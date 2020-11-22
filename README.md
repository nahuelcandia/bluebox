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
- CloudFront Reverse Proxy
- AWS Lambda
- DynamoDB

Bluebox vaults the original data, encrypted, in a DynamoDB database isolated from the rest of your infrastructure.
Thereby offloading liability and removing the risk of a data breach.


## How does it work?
You point your client API or Frontend to a CloudFront DNS (a reverse proxy)

Inbound Example:

BEFORE: api.yourcompany.com → Your API Server

AFTER: api.yourcompany.com → The Bluebox → Your API Server

Outbound Example:

BEFORE: Your API Server → 3rd Party Service / Financial Institution

AFTER: Your API Server → The Bluebox → 3rd Party Service / Financial Institution

The inbound/reverse proxy directs traffic between the client-side (inbound) traffic, the bluebox (where sensitive data is stored),
and your backend systems. When you send a request out of your service (Outbound), the Bluebox will intercept and replace the aliases by its original value and
send it forth to the original endpoint, as illustrated by the below image.

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

## Technologies Used
- Node.JS
- Serverless Framework
- DynamoDB

## AWS Services Required
- CloudFront: acts as the reverse proxy.
- AWS Lambda: encrypts the information, saves it into DynamoDB and replaces it by aliases.
- DynamoDB: stores the sensitive data encrypted.
- VPC [TBD]: interconnects services and isolates them from the rest of the network.
- Cloudwatch [TBD]: stores logs of the activity.
- Cloudtrail [TBD]: stores logs of the activity.
- Config [TBD]: stores logs of the configuration of your account.
- Inspector [TBD]: Automated security assessment service to help improve the security and compliance of applications deployed on AWS.

### AWS Total Cost of Ownership (TCO)
This table shows how much you may spend every month when implementing all the required resources, in the us-east region.
The calculation is based on the amount of requests, taking in account that storing one record may incurr in up to 4 internal requests.
1 record = 4 requests

## Contributing
Please see our contributing.md.

## Authors
Nahuel Candia (@nahuelcandia) – Rebill
