data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix = "genehub-${var.environment}"

  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # Position of each AZ in the list, used to derive per-subnet CIDR offsets.
  az_index = { for i, az in local.azs : az => i }

  # Carve the VPC into /20 blocks. A /16 yields 16 of them; tiers are spaced
  # four apart so each can grow to four AZs without renumbering the others.
  #   public 0-3, app 4-7, data 8-11
  public_cidr  = { for az, i in local.az_index : az => cidrsubnet(var.vpc_cidr, 4, i) }
  private_cidr = { for az, i in local.az_index : az => cidrsubnet(var.vpc_cidr, 4, i + 4) }
  data_cidr    = { for az, i in local.az_index : az => cidrsubnet(var.vpc_cidr, 4, i + 8) }

  # One NAT in the first AZ, or one per AZ.
  nat_azs = var.single_nat_gateway ? slice(local.azs, 0, 1) : local.azs

  # Which NAT each private subnet egresses through.
  nat_for_az = {
    for az in local.azs : az => var.single_nat_gateway ? local.azs[0] : az
  }

  interface_endpoints = toset([
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager",
    "sts",
  ])
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = local.name_prefix
  }
}

# --- Subnets ---------------------------------------------------------------

resource "aws_subnet" "public" {
  for_each = toset(local.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = local.public_cidr[each.key]

  # The ALB and NAT gateways bring their own addresses; nothing here needs one.
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name_prefix}-${each.key}-public"
    Tier = "public"
  }
}

resource "aws_subnet" "private" {
  for_each = toset(local.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = local.private_cidr[each.key]

  tags = {
    Name = "${local.name_prefix}-${each.key}-private"
    Tier = "app"
  }
}

# Isolated tier for RDS and RDS Proxy. Its route table has no default route,
# so nothing here can reach the internet in either direction.
resource "aws_subnet" "data" {
  for_each = toset(local.azs)

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = local.data_cidr[each.key]

  tags = {
    Name = "${local.name_prefix}-${each.key}-data"
    Tier = "data"
  }
}

# --- Gateways --------------------------------------------------------------

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_eip" "nat" {
  for_each = toset(local.nat_azs)

  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-${each.key}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  for_each = toset(local.nat_azs)

  subnet_id     = aws_subnet.public[each.key].id
  allocation_id = aws_eip.nat[each.key].id

  tags = {
    Name = "${local.name_prefix}-${each.key}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# --- Routing ---------------------------------------------------------------

# All public subnets share one table; they all route to the same gateway.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-public"
  }
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = toset(local.azs)

  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[each.key].id
}

# One private table per AZ so each can point at its own NAT.
resource "aws_route_table" "private" {
  for_each = toset(local.azs)

  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-${each.key}-private"
  }
}

resource "aws_route" "private_default" {
  for_each = toset(local.azs)

  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[local.nat_for_az[each.key]].id
}

resource "aws_route_table_association" "private" {
  for_each = toset(local.azs)

  route_table_id = aws_route_table.private[each.key].id
  subnet_id      = aws_subnet.private[each.key].id
}

# Deliberately routeless: local VPC traffic only.
resource "aws_route_table" "data" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-data"
  }
}

resource "aws_route_table_association" "data" {
  for_each = toset(local.azs)

  route_table_id = aws_route_table.data.id
  subnet_id      = aws_subnet.data[each.key].id
}

# --- VPC endpoints ---------------------------------------------------------

# Gateway endpoint: free, and keeps ECR layer pulls and S3 traffic off the NAT.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [for rt in aws_route_table.private : rt.id],
    [aws_route_table.data.id],
  )

  tags = {
    Name = "${local.name_prefix}-s3"
  }
}

resource "aws_vpc_endpoint" "interface" {
  for_each = local.interface_endpoints

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${local.name_prefix}-${replace(each.key, ".", "-")}"
  }
}

# --- Flow logs -------------------------------------------------------------

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc/${local.name_prefix}/flow-logs"
  retention_in_days = var.flow_log_retention_days
}

data "aws_iam_policy_document" "flow_logs_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "flow_logs" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    resources = var.enable_flow_logs ? ["${aws_cloudwatch_log_group.flow_logs[0].arn}:*"] : ["*"]
  }
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name               = "${local.name_prefix}-vpc-flow-logs"
  assume_role_policy = data.aws_iam_policy_document.flow_logs_assume_role.json
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name   = "${local.name_prefix}-vpc-flow-logs"
  role   = aws_iam_role.flow_logs[0].id
  policy = data.aws_iam_policy_document.flow_logs.json
}

resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  iam_role_arn         = aws_iam_role.flow_logs[0].arn
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn
  log_destination_type = "cloud-watch-logs"

  tags = {
    Name = "${local.name_prefix}-flow-logs"
  }
}
