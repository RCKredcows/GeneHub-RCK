variable "aws_region" {
  description = "The region to deploy AWS resources in"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment to deploy resources in"
  type        = string
}

variable "state_bucket_name" {
  description = "The name of the bucket where the terraform state will live"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. Must be large enough to carve three /20 tiers per AZ."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "az_count" {
  description = "Number of availability zones to spread subnets across."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 4
    error_message = "az_count must be between 2 and 4; the ALB requires at least two."
  }
}

variable "single_nat_gateway" {
  description = "Route all private subnets through one NAT gateway. Cheap for dev; use false in production so an AZ failure cannot take out egress for every AZ."
  type        = bool
  default     = true
}

variable "app_port" {
  description = "Port the ECS application container listens on."
  type        = number
  default     = 8080
}

variable "enable_flow_logs" {
  description = "Send VPC flow logs to CloudWatch."
  type        = bool
  default     = true
}

variable "flow_log_retention_days" {
  description = "Retention in days for the VPC flow log group."
  type        = number
  default     = 30
}

variable "domain_name" {
  description = "Apex domain served from this environment. Currently a throwaway domain; swap for the real one at cutover."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}$", var.domain_name))
    error_message = "domain_name must be a bare apex domain such as example.com, with no scheme or trailing dot."
  }
}

variable "enable_wildcard_certificate" {
  description = "Add *.domain_name to the certificate. Required for the Phase 4 per-tenant subdomains; harmless before then."
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Address to receive alarm notifications. Leave empty to create the SNS topic without a subscription. AWS emails a confirmation link that must be clicked before anything is delivered."
  type        = string
  default     = ""
}

variable "alb_5xx_threshold" {
  description = "ALB-generated 5xx responses in a 5 minute window before alarming."
  type        = number
  default     = 5
}

variable "target_5xx_threshold" {
  description = "Application 5xx responses in a 5 minute window before alarming."
  type        = number
  default     = 10
}

variable "image_tag" {
  description = "Frontend image tag to run. Push it with scripts/build-and-push.sh before applying; Terraform does not build images."
  type        = string
}

variable "task_cpu" {
  description = "Fargate CPU units. 256 is a quarter vCPU, plenty for serving static files."
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate memory in MiB. Must be a valid pairing with task_cpu."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of tasks to run. Two spreads across AZs; one is fine for dev."
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "Retention for the application log group."
  type        = number
  default     = 30
}

variable "health_check_path" {
  description = "Path the ALB polls on application tasks. Must return 200 without authentication."
  type        = string
  default     = "/"
}

variable "alb_deletion_protection" {
  description = "Block terraform from destroying the load balancer. Enable for production."
  type        = bool
  default     = false
}

variable "alb_idle_timeout" {
  description = "Seconds an idle connection is held open by the ALB."
  type        = number
  default     = 60
}

variable "enable_alb_access_logs" {
  description = "Ship ALB access logs to a dedicated S3 bucket. Left off by default so the first apply cannot fail on a bucket policy; turn on once the ALB is up."
  type        = bool
  default     = false
}

variable "access_log_retention_days" {
  description = "Days to keep ALB access logs before expiring them."
  type        = number
  default     = 90
}

variable "validate_certificate" {
  description = "Block the apply until ACM finishes DNS validation. Leave false until the domain's nameservers have been delegated to the Route 53 zone, otherwise validation cannot complete and the apply hangs for 45 minutes."
  type        = bool
  default     = false
}