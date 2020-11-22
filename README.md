# Bluebox

### NOTE: WORK IN PROGRESS - UNSTABLE

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

This solution heavily relies on the AWS managed services and its infrastructure in order to achieve compliance.

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
The core AWS components used by this Quick Start include the following AWS services. (If
you are new to AWS, see Getting Started with AWS.)

- CloudFront: acts as the reverse proxy.
- AWS Lambda: encrypts the information, saves it into DynamoDB and replaces it by aliases.
- DynamoDB: stores the sensitive data encrypted.
- Inspector [TBD]: Automated security assessment service to help improve the security and compliance of applications deployed on AWS.
- AWS CloudTrail – AWS CloudTrail records AWS API calls and delivers log files that
include caller identity, time, source IP address, request parameters, and response 
Amazon Web Services – Standardized Architecture for PCI DSS January 2020. 
The call history and details provided by CloudTrail enable security analysis,
resource change tracking, and compliance auditing.
- Amazon CloudWatch – Amazon CloudWatch is a monitoring service for AWS Cloud
resources and the applications you run on AWS. You can use Amazon CloudWatch to
collect and track metrics, collect and monitor log files, set alarms, and automatically
react to changes in your AWS resources.
- AWS Config – AWS Config is a fully managed service that provides you with an AWS
resource inventory, configuration history, and configuration change notifications to
enable security and governance. AWS Config rules enable you to automatically check the
configuration of AWS resources recorded by AWS Config.
Note The AWS Config rules feature is currently available in the AWS Regions
listed on the endpoints and quotas webpage.
- AWS Secrets Manager - AWS Secrets Manager is a credentials management service that
helps you protect access to your applications, services, and IT resources. This service
enables you to easily rotate, manage, and retrieve database credentials, API keys, and
other secrets throughout their lifecycle. Using Secrets Manager, you can secure and
manage secrets used to access resources in the AWS Cloud, on third-party services, and
on-premises.
- Amazon S3 - Amazon Simple Storage Service (Amazon S3) is an object storage service
that offers industry-leading scalability, data availability, security, and performance.
Customers of all sizes and industries can use Amazon S3 to store and protect any
amount of data for a range of use cases, such as websites, mobile applications, backup
and restore, archive, enterprise applications, IoT devices, and big data analytics.
Amazon S3 provides easy-to-use management features so you can organize your data
and configure finely tuned access controls to meet your specific business, organizational,
and compliance requirements.
- Amazon VPC – The Amazon Virtual Private Cloud (Amazon VPC) service lets you
provision a private, logically isolated section of the AWS Cloud where you can launch
AWS services and other resources in a virtual network that you define. You have
complete control over your virtual networking environment, including selection of your
own IP address range, creation of subnets, and configuration of route tables and
network gateways.
- AWS WAF - AWS WAF is a web application firewall that helps protect web applications
from attacks by allowing you to configure rules that allow, block, or monitor (count) web
requests based on conditions that you define. These conditions include IP addresses,
HTTP headers, HTTP body, URI strings, structured query language (SQL) injection and
cross-site scripting.

### AWS Total Cost of Ownership (TCO)

This table shows how much you may spend every month when implementing all the required resources, in the us-east region.

The calculation is based on the amount of requests, taking in account that storing one record may incurr in up to 4 internal requests.

1 record = 4 requests

- Lambda cost per request:
- Average cost per record in DynamoDB:
- Average Network cost per request:
- Average cost per n requests in CloudWatch Logs:
- Average cost per n requests in Cloudtrail:
- Average cost Config:
- Average cost Inspector:

*All costs averages are on a calendar month basis.

Amount of Records | TCO 
--- | --- 
100 | $1 
1,000 | $1 
5,000 | $1 
10,000 | $1 
50,000 | $1 
100,000 | $1 
500,000 | $1 
1,000,000 | $1 

## Architecture Diagram


## Contributing
Please see our contributing.md.

## Authors
Nahuel Candia ([@nahuelcandia](https://twitter.com/dncandia)) – [Rebill, Inc.](https://www.rebill.to)

