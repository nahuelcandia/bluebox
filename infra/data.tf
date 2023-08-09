data "aws_caller_identity" "current" {}

data "aws_acm_certificate" "acm_cert" {
  domain      = var.cert_domain_name
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

data "aws_vpc" "vpc" {
  id = var.vpc_id
}

data "aws_subnet" "private" {
  count = length(var.private_subnet_tags)

  filter {
    name   = "tag:Name"
    values = [var.private_subnet_tags[count.index]]
  }
}
