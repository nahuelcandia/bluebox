#!/bin/bash
apt install -y jq

echo "########### Creating profile ###########"

aws configure set aws_access_key_id default_access_key --profile=localstack
aws configure set aws_secret_access_key default_secret_key --profile=localstack
aws configure set region us-east-1 --profile=localstack

echo "########### Creating DynamoDB Bluebox Table ###########"
aws dynamodb --region=us-east-1 --profile=localstack --endpoint-url=http://localhost:4566 create-table \
    --table-name bluebox \
    --attribute-definitions \
        AttributeName=alias,AttributeType=S \
    --key-schema \
        AttributeName=alias,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5

echo "########### Creating KMS Key ###########"

# Create KMS key and extract KeyId
KEY_ID=$(aws kms --region=us-east-1 --profile=localstack --endpoint-url=http://localhost:4566 create-key --description "My test key" | jq -r .KeyMetadata.KeyId)

# Check if the KeyId was successfully extracted
if [ -z "$KEY_ID" ]; then
    echo "Failed to create KMS key"
    exit 1
fi

# Create an alias for the KMS key
ALIAS_NAME="alias/bluebox"
aws kms --region=us-east-1 --profile=localstack --endpoint-url=http://localhost:4566 create-alias --alias-name $ALIAS_NAME --target-key-id $KEY_ID
