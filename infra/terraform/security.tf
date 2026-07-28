# Security groups are declared with standalone rule resources rather than
# inline ingress/egress blocks. Inline rules that reference each other across
# groups (ALB <-> app) create a dependency cycle Terraform cannot resolve.

# Nothing should ever attach to the default group, so strip it bare.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-default-do-not-use"
  }
}

# --- ALB -------------------------------------------------------------------

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Public entry point. Internet-facing on 443."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-alb"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from the internet"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "alb_http_redirect" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP, redirected to HTTPS by the listener"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  description                  = "Forward to application tasks"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = var.app_port
  to_port                      = var.app_port
}

# --- Application tasks -----------------------------------------------------

resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-app"
  description = "ECS tasks. Reachable only from the ALB."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-app"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "Application port from the ALB only"
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = var.app_port
  to_port                      = var.app_port
}

# Outbound stays open: tasks pull images, call Cognito and Secrets Manager,
# and (during Phase 1) still reach Supabase and Resend.
resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  description       = "All outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# --- Data tier -------------------------------------------------------------

resource "aws_security_group" "data" {
  name        = "${local.name_prefix}-data"
  description = "RDS and RDS Proxy. Reachable only from application tasks."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-data"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "data_from_app" {
  security_group_id            = aws_security_group.data.id
  description                  = "PostgreSQL from application tasks only"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

# No egress rule. Security groups are stateful, so replies to allowed inbound
# connections still flow; the database has no reason to originate traffic.

# --- Interface VPC endpoints -----------------------------------------------

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpc-endpoints"
  description = "Interface endpoints. HTTPS from inside the VPC."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-vpc-endpoints"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "endpoints_from_app" {
  security_group_id            = aws_security_group.vpc_endpoints.id
  description                  = "HTTPS from application tasks"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
}
