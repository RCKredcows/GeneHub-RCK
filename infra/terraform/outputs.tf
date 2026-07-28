output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC."
  value       = aws_vpc.main.cidr_block
}

output "availability_zones" {
  description = "Availability zones the subnets span."
  value       = local.azs
}

output "public_subnet_ids" {
  description = "Public subnet IDs, for the ALB."
  value       = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  description = "Private application subnet IDs, for ECS tasks."
  value       = [for s in aws_subnet.private : s.id]
}

output "data_subnet_ids" {
  description = "Isolated data subnet IDs, for the RDS subnet group."
  value       = [for s in aws_subnet.data : s.id]
}

output "alb_security_group_id" {
  description = "Security group for the load balancer."
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "Security group for ECS tasks."
  value       = aws_security_group.app.id
}

output "data_security_group_id" {
  description = "Security group for RDS and RDS Proxy."
  value       = aws_security_group.data.id
}

# Every private subnet egresses through these. Needed when a third party has to
# allowlist our outbound traffic — Supabase during Phase 1, Resend for email.
output "nat_public_ips" {
  description = "Public IPs of the NAT gateways."
  value       = [for e in aws_eip.nat : e.public_ip]
}

# Set these as the domain's nameservers at your registrar. Until you do, the
# zone is inert and ACM cannot validate the certificate.
output "route53_nameservers" {
  description = "Nameservers to delegate the domain to."
  value       = aws_route53_zone.main.name_servers
}

output "route53_zone_id" {
  description = "Hosted zone ID, for alias records to the ALB."
  value       = aws_route53_zone.main.zone_id
}

output "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener."
  value       = aws_acm_certificate.main.arn
}

output "app_fqdn" {
  description = "Hostname the application will be served from."
  value       = local.app_fqdn
}

output "alb_dns_name" {
  description = "Load balancer hostname. Useful for testing before DNS is delegated."
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "Load balancer ARN."
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "Target group ARN. The ECS service registers into this."
  value       = aws_lb_target_group.app.arn
}

output "https_listener_enabled" {
  description = "Whether the HTTPS listener exists yet. False until the certificate is validated."
  value       = var.validate_certificate
}
