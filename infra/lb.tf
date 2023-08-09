resource "aws_security_group" "lb_sg" {
  name        = "Bluebox Load Balancer Security Group"
  description = "Allow port 80 inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = "80"
    to_port     = "80"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Bluebox Load Balancer"
  }
}

resource "aws_lb" "bluebox_lb" {
  name            = "bluebox-internal-alb"
  internal        = true
  security_groups = [aws_security_group.lb_sg.id]
  subnets         = [for subnet in data.aws_subnet.private : subnet.id]
}

resource "aws_lb_listener" "listener_80" {
  load_balancer_arn = aws_lb.bluebox_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Bluebox LB is Up"
      status_code  = "200"
    }
  }
}

resource "aws_lb_target_group" "bluebox_tg" {
  name        = "bluebox-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "lambda"
}

resource "aws_lb_listener_rule" "notifications" {
  listener_arn = aws_lb_listener.listener_80.arn
  priority     = 98

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.bluebox_tg.arn
  }

  condition {
    path_pattern {
      values = ["/bluebox*"]
    }
  }
}

resource "aws_lambda_alias" "outbound_lambda_live" {
  name             = "live"
  description      = "Live alias"
  function_name    = aws_lambda_function.outbound_lambda.arn
  function_version = aws_lambda_function.outbound_lambda.version
}

resource "aws_lambda_permission" "alb_permission" {
  statement_id  = "AllowExecutionFromALB"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.outbound_lambda.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  qualifier     = aws_lambda_alias.outbound_lambda_live.name
  source_arn    = aws_lb_target_group.bluebox_tg.arn
}

resource "aws_lb_target_group_attachment" "bluebox_attachment" {
  target_group_arn = aws_lb_target_group.bluebox_tg.arn
  target_id        = aws_lambda_alias.outbound_lambda_live.arn
  depends_on       = [aws_lambda_permission.alb_permission]
}
