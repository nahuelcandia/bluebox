resource "aws_iam_role" "iam_for_lambda" {
  name = "bluebox-iam_for_lambda"

  assume_role_policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Action : "sts:AssumeRole",
        Principal : {
          Service : "lambda.amazonaws.com"
        },
        Effect : "Allow",
        Sid : ""
      }
    ]
  })

  inline_policy {
    name = "ec2_policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = [
            "ec2:*",
            "dynamodb:*",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Effect   = "Allow"
          Resource = "*"
        },
      ]
    })
  }
}

resource "aws_security_group" "outbound_lambda_sg" {
  name        = "Outbound Bluebox Security Group"
  description = "Security group for outbound Bluebox"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port   = "0"
    to_port     = "65535"
    protocol    = "tcp"
    cidr_blocks = [for subnet in data.aws_subnet.private : subnet.cidr_block]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Outbound Bluebox Security Group"
  }
}

resource "aws_security_group" "inbound_lambda_sg" {
  name        = "Inbound Bluebox Security Group"
  description = "Security group for inbound Bluebox"
  vpc_id      = data.aws_vpc.vpc.id

  ingress {
    from_port   = "0"
    to_port     = "65535"
    protocol    = "tcp"
    cidr_blocks = [for subnet in data.aws_subnet.private : subnet.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [for subnet in data.aws_subnet.private : subnet.cidr_block]
  }

  egress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    prefix_list_ids = ["pl-02cd2c6b"]
  }

  tags = {
    Name = "Inbound Bluebox Security Group"
  }
}

resource "aws_lambda_function" "outbound_lambda" {
  filename         = "../dist/outbound.zip"
  function_name    = "bluebox-outbound"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "outbound.handler"
  source_code_hash = filebase64sha256("../dist/outbound.zip")
  timeout          = 600
  memory_size      = 1024

  runtime = "nodejs18.x"

  environment {
    variables = {
      NODE_ENV = "production"
    }
  }

  vpc_config {
    security_group_ids = [aws_security_group.outbound_lambda_sg.id]
    subnet_ids         = [for subnet in data.aws_subnet.private : subnet.id]
  }
}

resource "aws_lambda_function" "inbound_lambda" {
  filename         = "../dist/inbound.zip"
  function_name    = "bluebox-inbound"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "inbound.handler"
  source_code_hash = filebase64sha256("../dist/inbound.zip")
  timeout          = 600
  memory_size      = 1024

  runtime = "nodejs14.x"

  environment {
    variables = {
      PROXY_TARGET    = var.proxy_target
      NODE_ENV        = "production"
      X_ORIGIN_VERIFY = var.x_origin_verify
    }
  }

  vpc_config {
    security_group_ids = [aws_security_group.inbound_lambda_sg.id]
    subnet_ids         = [for subnet in data.aws_subnet.private : subnet.id]
  }
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name     = "bluebox"
  hash_key = "alias"

  server_side_encryption_enabled = true
  point_in_time_recovery_enabled = true
  ttl_enabled                    = true
  ttl_attribute_name             = "ttl"

  attributes = [
    {
      name = "alias"
      type = "S"
    }
  ]
}

resource "aws_kms_key" "bluebox_key" {
  description = "KMS key for Bluebox"
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Id" : "bluebox-key-policy",
    "Statement" : [
      {
        "Sid" : "Enable IAM policies",
        "Effect" : "Allow",
        "Principal" : { "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        "Action" : "kms:*",
        "Resource" : "*"
      },
      {
        "Sid" : "Allow use of the key",
        "Effect" : "Allow",
        "Principal" : { "AWS" : [
          aws_iam_role.iam_for_lambda.arn
        ] },
        "Action" : [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ],
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_kms_alias" "bluebox_key" {
  name          = "alias/bluebox"
  target_key_id = aws_kms_key.bluebox_key.key_id
}

output "lambdas" {
  value = local.lambdas
}
