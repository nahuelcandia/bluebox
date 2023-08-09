terraform {
  required_providers {
    aws = {
      version = "~> 4.59.0"
      source  = "hashicorp/aws"
    }
  }

  backend "s3" {
    bucket = "rebill-terraform-state"
    key    = "tf-state"
    region = "us-east-1"
  }
}

# Configure the AWS Provider
provider "aws" {
  region                     = "us-east-1"
  skip_requesting_account_id = false
  default_tags {
    tags = {
      Environment = terraform.workspace
      Application = "Bluebox"
    }
  }
}
