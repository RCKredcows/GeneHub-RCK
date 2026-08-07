locals {
  alb_log_bucket = "${local.name_prefix}-alb-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = [for s in aws_subnet.public : s.id]
  security_groups    = [aws_security_group.alb.id]

  idle_timeout               = var.alb_idle_timeout
  enable_deletion_protection = var.alb_deletion_protection

  # Tenants are resolved from the Host header, so preserve it verbatim.
  preserve_host_header = true

  # Reject ambiguous requests rather than letting them reach the app, where
  # header smuggling could confuse tenant resolution.
  desync_mitigation_mode     = "strictest"
  drop_invalid_header_fields = true

  dynamic "access_logs" {
    for_each = var.enable_alb_access_logs ? [1] : []

    content {
      bucket  = aws_s3_bucket.alb_logs[0].id
      prefix  = "alb"
      enabled = true
    }
  }

  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

# --- Target group ----------------------------------------------------------

# target_type "ip" is required for Fargate, whose tasks get their own ENI
# rather than sharing a host.
resource "aws_lb_target_group" "app" {
  name        = "${local.name_prefix}-app"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  port        = var.app_port
  protocol    = "HTTP"

  # Well under the ECS default stop timeout, so deploys drain promptly.
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${local.name_prefix}-app"
  }

  # The ALB listener references this group, so a replacement has to be created
  # before the old one can be torn down.
  lifecycle {
    create_before_destroy = true
  }
}

# --- Listeners -------------------------------------------------------------

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Gated on validate_certificate: a listener cannot attach a certificate that
# ACM has not issued yet. Until the domain is delegated and validation runs,
# the ALB exists with the redirect listener only.
resource "aws_lb_listener" "https" {
  count = var.validate_certificate ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# --- DNS -------------------------------------------------------------------

resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Every tenant hostname resolves here. Adding a tenant is a database row, not
# a DNS or Terraform change.
resource "aws_route53_record" "wildcard" {
  count = var.enable_wildcard_certificate ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "*.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# --- Access logs -----------------------------------------------------------

resource "aws_s3_bucket" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  bucket = local.alb_log_bucket

  # Access logs are disposable and the lifecycle policy expires them anyway.
  # Without this, a teardown fails on BucketNotEmpty and has to be emptied by
  # hand before terraform will continue.
  force_destroy = true

  tags = {
    Name = local.alb_log_bucket
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  bucket = aws_s3_bucket.alb_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ALB access logs support SSE-S3 only; a customer-managed KMS key breaks delivery.
resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  bucket = aws_s3_bucket.alb_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  bucket = aws_s3_bucket.alb_logs[0].id

  rule {
    id     = "expire-access-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.access_log_retention_days
    }
  }
}

data "aws_iam_policy_document" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["s3:PutObject"]

    principals {
      type        = "Service"
      identifiers = ["logdelivery.elasticloadbalancing.amazonaws.com"]
    }

    resources = [
      "${aws_s3_bucket.alb_logs[0].arn}/alb/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  count = var.enable_alb_access_logs ? 1 : 0

  bucket = aws_s3_bucket.alb_logs[0].id
  policy = data.aws_iam_policy_document.alb_logs[0].json
}
