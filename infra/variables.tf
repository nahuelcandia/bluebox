variable "vpc_id" {
  description = "VPC Id"
  type        = string
  default     = "vpc-0a0a0a0a0a0a0a0a0" // Replace here your VPC ID
}
variable "private_subnet_tags" {
  description = "List of names of the private subnets"
  type        = list(string)
  default     = ["private-a", "private-b", "private-c"] // Replace here your private subnets names
}
variable "proxy_target" {
  description = "The URL of the target endpoint (the backend service that you want to proxy requests to)"
  type        = string
  default     = "http://your.backend.com" // Replace here your backend service URL
}
variable "domain_name" {
  description = "The domain name alias of for the CloudFront distribution"
  type        = string
  default     = "your.domain.com" // Replace here your domain name alias for the CloudFront distribution
}
variable "cert_domain_name" {
  description = "The domain name of the certificate (e.g. *.example.com)"
  type        = string
  default     = "*.domain.com" // Replace here with the domain name of the certificate
}
variable "x_origin_verify" {
  description = "The value of the X-Origin-Verify header"
  type        = string
  default     = "some-secret-value" // Replace here with the value of the X-Origin-Verify header
}
