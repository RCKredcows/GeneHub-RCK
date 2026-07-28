terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Partial configuration: bucket, key, region, and dynamodb_table are supplied
  # at init time by scripts/deploy-infra.sh, which also creates them if missing.
  # Backend blocks cannot reference variables, which is why they live there.
  backend "s3" {}
}

data "aws_caller_identity" "current" {}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "genehub"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}