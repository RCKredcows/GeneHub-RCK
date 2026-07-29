locals {
  app_fqdn = var.domain_name

  certificate_sans = var.enable_wildcard_certificate ? ["*.${var.domain_name}"] : []
}

resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "GeneHub ${var.environment}"

  tags = {
    Name = "${local.name_prefix}-zone"
  }
}

# --- Certificate -----------------------------------------------------------

# A wildcard does not cover the apex, so the apex is the primary name and
# *.domain is a SAN. Both are needed: the apex for the landing page, the
# wildcard for the per-tenant subdomains in Phase 4.
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = local.certificate_sans
  validation_method         = "DNS"

  tags = {
    Name = "${local.name_prefix}-cert"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# One record per distinct name on the certificate. The apex and its wildcard
# share a validation record, hence the dedupe by domain_name.
resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for opt in aws_acm_certificate.main.domain_validation_options :
    opt.domain_name => {
      name  = opt.resource_record_name
      type  = opt.resource_record_type
      value = opt.resource_record_value
    }
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.value]
  ttl             = 60
  allow_overwrite = true
}


resource "aws_acm_certificate_validation" "main" {
  count = var.validate_certificate ? 1 : 0

  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.certificate_validation : r.fqdn]

  timeouts {
    create = "45m"
  }
}
