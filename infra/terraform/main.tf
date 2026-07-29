terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

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