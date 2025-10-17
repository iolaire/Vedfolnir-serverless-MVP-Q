#!/bin/bash

# Load project configuration
PROJECT_NAME=$(jq -r '.projectName' domain-config.json)
LAMBDA_FUNCTION_NAME=$(jq -r '.lambdaFunctionName' domain-config.json)
REGION=$(jq -r '.region' domain-config.json)

echo "Setting up MVP monitoring for project: $PROJECT_NAME"
echo "Lambda function: $LAMBDA_FUNCTION_NAME"
echo "Region: $REGION"

# Create CloudWatch alarms
echo "Creating CloudWatch alarms..."

# 1. High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-HighErrors" \
  --alarm-description "High Lambda error rate detected" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION_NAME \
  --evaluation-periods 1 \
  --region $REGION

# 2. High cost alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-HighCosts" \
  --alarm-description "AWS costs exceeding budget" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1 \
  --region us-east-1

# 3. Long duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-LongDuration" \
  --alarm-description "Lambda function taking too long" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 30000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION_NAME \
  --evaluation-periods 2 \
  --region $REGION

# 4. High invocation rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "${PROJECT_NAME}-HighInvocations" \
  --alarm-description "Unusual spike in Lambda invocations" \
  --metric-name Invocations \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 3600 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=$LAMBDA_FUNCTION_NAME \
  --evaluation-periods 1 \
  --region $REGION

# Set CloudWatch log retention
echo "Setting CloudWatch log retention..."
aws logs put-retention-policy \
  --log-group-name "/aws/lambda/$LAMBDA_FUNCTION_NAME" \
  --retention-in-days 90 \
  --region $REGION

echo "MVP monitoring setup complete!"
echo "Created 4 CloudWatch alarms and set log retention to 90 days"
