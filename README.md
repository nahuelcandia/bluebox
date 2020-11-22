# Bluebox
Open Source PCI-Compliant Serverless Proxy and "Blackbox" that replaces sensitive information on-the-fly for inbound and outbound traffic.

This standalone quickstart module aims to simplify the process of becoming PCI-DSS compliant,
by handling any sensible data in an isolated system, physically and logically
separated from the rest of the system making use of the AWS infrastructure.

It will allow you to collect, protect, and exchange sensitive information to utilize the value of
the data without your business having to come into contact with the original data.

The service will proxy between your API and the web, intercepting all the incoming requests
and replacing any sensible data of your choice by aliases.

Bluebox replaces sensitive data with an aliased version, which can be safely stored and used in the same
way as the original data. 

All the information is handled over PCI-Compliant services provided by the AWS infrastructure:
- AWS Lambda
- CloudFront
- API Gateway
- DynamoDB

Bluebox vaults the original data, encrypted, in a DynamoDB database isolated from the rest of your infrastructure.
Thereby offloading liability and removing the risk of a data breach.


## How does it work?
You point your client API or Frontend to a CloudFront DNS (a reverse proxy)

Example:

BEFORE: api.yourcompany.com → [Your API Server]

AFTER: api.yourcompany.com → cloudfront-reverse-proxy → [Your API Server]

The inbound/reverse proxy directs traffic between the client-side (inbound) traffic, the bluebox (where sensitive data is stored),
and your backend systems as illustrated by the below image.

![layout](https://raw.github.com/nahuelcandia/bluebox/master/docs/assets/bluebox-flow.png)

## Getting Started

```bash
npm install
serverless dynamodb install
serverless offline start
serverless dynamodb migrate (this imports schema)
```

Run service offline

```bash
serverless offline start
```

## Contributing
Please see our contributing.md.

## Authors
Nahuel Candia (@nahuelcandia) – Rebill
