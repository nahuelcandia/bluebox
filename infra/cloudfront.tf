resource "aws_cloudfront_distribution" "bluebox_cloudfront" {
  origin {
    domain_name = module.api_gateway.default_apigatewayv2_stage_domain_name
    origin_id   = "Bluebox API Gateway"

    custom_header {
      name  = "X-Origin-Verify"
      value = var.x_origin_verify
    }

    origin_shield {
      enabled              = true
      origin_shield_region = "us-east-1"
    }

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 60
      origin_read_timeout      = 60
    }
  }

  enabled = true

  aliases = [var.domain_name]

  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = ["AF", "CN", "RU", "KP", "UA", "TM", "UZ", "SY", "LB", "IR", "IQ", "IN", "SC", "TW"]
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.acm_cert.arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  retain_on_delete = true

  default_cache_behavior {
    target_origin_id       = "Bluebox API Gateway"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin"]
      cookies {
        forward = "none"
      }
    }
    min_ttl                    = 0
    default_ttl                = 0
    max_ttl                    = 0
    response_headers_policy_id = "eaab4381-ed33-4a86-88ca-d9558dc6cd63"
  }
}
