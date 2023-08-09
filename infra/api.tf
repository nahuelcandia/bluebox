module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "Bluebox"
  description   = "HTTP API Gateway via Bluebox"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_headers = ["*"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  default_route_settings = {
    throttling_rate_limit  = 10000
    throttling_burst_limit = 5000
  }


  create_api_domain_name = false

  integrations = {
    "ANY /" = {
      lambda_arn             = aws_lambda_function.inbound_lambda.arn
      payload_format_version = "2.0"
      timeout_milliseconds   = 30000
    }

    "ANY /{proxy+}" = {
      lambda_arn             = aws_lambda_function.inbound_lambda.arn
      payload_format_version = "2.0"
      timeout_milliseconds   = 30000
    }
  }
}

resource "aws_apigatewayv2_domain_name" "domain_name" {
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.acm_cert.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}
