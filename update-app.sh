#!/bin/bash

# Copyright (C) 2025 iolaire mcfadden
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.


# Function to create dashboard configuration
create_dashboard_config() {
    cat > dashboard.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "${PROJECT_NAME}/Lambda", "Invocations", "Project", "$PROJECT_NAME", "Environment", "prod" ],
          [ ".", "Errors", ".", ".", ".", "." ],
          [ ".", "Duration", ".", ".", ".", ".", { "stat": "Average", "label": "Duration Average" } ]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Lambda Performance",
        "view": "timeSeries",
        "setPeriodToTimeRange": false,
        "yAxis": {
          "left": {
            "showUnits": false
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "${PROJECT_NAME}/Lambda", "MemoryUsed", "Project", "$PROJECT_NAME", "Environment", "prod" ],
          [ ".", ".", ".", ".", ".", ".", { "stat": "Maximum" } ]
        ],
        "period": 3600,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Memory Usage",
        "view": "timeSeries",
        "setPeriodToTimeRange": false,
        "yAxis": {
          "left": {
            "label": "Memory (MB)",
            "showUnits": false
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "${PROJECT_NAME}/Bedrock", "InputTokens", "Project", "$PROJECT_NAME", "Environment", "prod" ],
          [ ".", "OutputTokens", ".", ".", ".", "." ],
          [ ".", "TotalTokens", ".", ".", ".", "." ],
          [ ".", "InputTokens", ".", ".", ".", ".", { "stat": "Maximum" } ],
          [ ".", "OutputTokens", ".", ".", ".", ".", { "stat": "Maximum" } ]
        ],
        "period": 3600,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Bedrock Token Usage",
        "view": "timeSeries",
        "setPeriodToTimeRange": false,
        "yAxis": {
          "left": {
            "showUnits": false
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "${PROJECT_NAME}/Bedrock", "RequestCost", "Project", "$PROJECT_NAME", "Environment", "prod" ]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Bedrock Costs per Request",
        "view": "timeSeries",
        "setPeriodToTimeRange": false,
        "yAxis": {
          "left": {
            "label": "Cost (USD)",
            "showUnits": false
          }
        }
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 12,
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Billing", "EstimatedCharges", "Currency", "USD" ],
          [ ".", ".", "Currency", "USD", "ServiceName", "AmazonBedrock" ],
          [ ".", ".", "Currency", "USD", "ServiceName", "AWSLambda" ]
        ],
        "period": 86400,
        "stat": "Maximum",
        "region": "us-east-1",
        "title": "Daily Estimated Charges",
        "view": "timeSeries",
        "setPeriodToTimeRange": false,
        "yAxis": {
          "left": {
            "label": "Cost (USD)",
            "showUnits": false
          }
        }
      }
    }
  ]
}
EOF
}

# Quick update script for the deployed app
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read project name from config
PROJECT_NAME=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).projectName" 2>/dev/null || echo "test-alt-text-generator-q")

# Function to detect Lambda function name dynamically
detect_lambda_function() {
    local lambda_name
    lambda_name=$(aws lambda list-functions --query "Functions[?contains(FunctionName, '$PROJECT_NAME') || contains(FunctionName, 'alt-text') || contains(FunctionName, 'bedrock')].FunctionName" --output text | head -1)
    if [ -z "$lambda_name" ]; then
        # If no function found, use the expected name for creation
        lambda_name="${PROJECT_NAME}-lambda"
    fi
    echo "$lambda_name"
}

# Function to detect Amplify App ID dynamically
detect_amplify_app() {
    local app_id
    app_id=$(aws amplify list-apps --query "apps[?contains(name, '$PROJECT_NAME') || contains(description, '$PROJECT_NAME')].appId" --output text | head -1)
    echo "$app_id"
}

# Function to detect hosted zone ID dynamically
detect_hosted_zone() {
    local domain="$1"
    local zone_id
    zone_id=$(aws route53 list-hosted-zones --query "HostedZones[?contains(Name, '$domain')].Id" --output text | sed 's|/hostedzone/||' | head -1)
    echo "$zone_id"
}

# Initial Lambda function detection (may not exist yet)
LAMBDA_NAME=$(detect_lambda_function)
echo "🔍 Target Lambda function: $LAMBDA_NAME"
BUCKET_NAME="${PROJECT_NAME}-frontend"

# Read domain from config
FULL_DOMAIN=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).fullDomain" 2>/dev/null || echo "test.zero.vedfolnir.org")

# Read alert email from config
ALERT_EMAIL=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).alertEmail" 2>/dev/null || echo "admin@example.com")

# Read cost threshold from config
COST_THRESHOLD=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).costThreshold" 2>/dev/null || echo "10")

# Read alarm thresholds from config
ERROR_THRESHOLD=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).errorThreshold" 2>/dev/null || echo "5")
DURATION_THRESHOLD=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).durationThreshold" 2>/dev/null || echo "30000")
INVOCATION_THRESHOLD=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).invocationThreshold" 2>/dev/null || echo "1000")
RATE_LIMIT_PER_MINUTE=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).rateLimitPerMinute" 2>/dev/null || echo "1000")
LAMBDA_MEMORY_SIZE=$(node -p "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/domain-config.json', 'utf8')).lambdaMemorySize" 2>/dev/null || echo "512")

echo "🔄 Updating Vedfolnir – AI-Powered Accessibility for the Fediverse App..."
echo "📋 Project: $PROJECT_NAME"
echo "🌐 Domain: $FULL_DOMAIN"

# Update backend if requested
if [[ "$1" == "backend" || "$1" == "all" ]]; then
    echo "🚀 Updating Backend..."
    
    # Wait for Lambda function to be completely ready (only if it exists)
    if aws lambda get-function --function-name "$LAMBDA_NAME" >/dev/null 2>&1; then
        echo "⏳ Waiting for Lambda function to be ready..."
        while true; do
            STATUS=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.LastUpdateStatus' --output text 2>/dev/null)
            if [ "$STATUS" = "Successful" ]; then
                echo "✅ Lambda function is ready"
                break
            elif [ "$STATUS" = "Failed" ]; then
                echo "❌ Lambda function update failed"
                exit 1
            else
                echo "⏳ Lambda status: $STATUS - waiting..."
                sleep 10
            fi
        done
    else
        echo "🆕 Lambda function does not exist - will create new one"
    fi
    
    cd "$PROJECT_ROOT/backend/deploy"
    
    # Sync files from main backend folder to deploy folder
    cp "$PROJECT_ROOT/backend/lambda_function.py" .
    cp "$PROJECT_ROOT/backend/bedrock_client.py" .
    cp "$PROJECT_ROOT/backend/rate_limiter.py" .
    
    # Install Python dependencies (excluding PIL for now)
    if [ -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
        echo "📦 Installing Python dependencies..."
        # Install only essential dependencies that work cross-platform
        python3 -m pip install boto3==1.34.0 requests==2.31.0 -t . --upgrade
    fi
    
    zip -r function.zip . -x "*.git*" "*.DS_Store*" > /dev/null
    
    # Get AWS account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_NAME="${PROJECT_NAME}-lambda-role"
    ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
    
    # Create IAM role if it doesn't exist
    if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
        echo "🔐 Creating Lambda execution role..."
        
        # Create trust policy
        cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create the role
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file://trust-policy.json \
            --description "Lambda execution role for $PROJECT_NAME" \
            --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"
        
        # Attach basic Lambda execution policy
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        # Attach DynamoDB permissions for rate limiting
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
        
        # Attach SNS permissions for notifications
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonSNSFullAccess"
        
        # Attach CloudWatch permissions for custom metrics
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        
        # Create constrained Bedrock policy for this project
        cat > bedrock-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/${PROJECT_NAME}-rate-limits"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
EOF
        
        # Create and attach the constrained policy
        POLICY_NAME="${PROJECT_NAME}-bedrock-policy"
        aws iam create-policy \
            --policy-name "$POLICY_NAME" \
            --policy-document file://bedrock-policy.json \
            --description "Constrained Bedrock access for $PROJECT_NAME"
        
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"
        
        # Clean up
        rm trust-policy.json bedrock-policy.json
        
        # Wait for role to be available
        echo "⏳ Waiting for role to be available..."
        sleep 10
    else
        echo "🔐 Lambda role exists, ensuring all required permissions..."
        
        # Ensure DynamoDB permissions for rate limiting
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" 2>/dev/null || true
        
        # Ensure SNS permissions for notifications
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/AmazonSNSFullAccess" 2>/dev/null || true
        
        # Ensure CloudWatch permissions for custom metrics
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy" 2>/dev/null || true
        
        # Update existing Bedrock policy to include CloudWatch permissions
        POLICY_NAME="${PROJECT_NAME}-bedrock-policy"
        cat > bedrock-policy-update.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/${PROJECT_NAME}-rate-limits"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
EOF
        
        # Update the policy if it exists
        if aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" >/dev/null 2>&1; then
            # Get current policy document
            CURRENT_POLICY=$(aws iam get-policy-version \
                --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                --version-id $(aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" --query 'Policy.DefaultVersionId' --output text) \
                --query 'PolicyVersion.Document' --output json)
            
            NEW_POLICY=$(cat bedrock-policy-update.json)
            
            # Compare policies (normalize whitespace)
            if [ "$(echo "$CURRENT_POLICY" | tr -d ' \n\t')" = "$(echo "$NEW_POLICY" | tr -d ' \n\t')" ]; then
                echo "🔐 Bedrock policy unchanged, skipping update"
            else
                echo "🔄 Updating existing Bedrock policy with CloudWatch permissions..."
                
                # Try to create new policy version, handle version limit error
                if ! aws iam create-policy-version \
                    --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                    --policy-document file://bedrock-policy-update.json \
                    --set-as-default 2>/dev/null; then
                    
                    echo "⚠️  Policy version limit reached, cleaning up old versions..."
                    
                    # Get non-default versions and delete them
                    OLD_VERSIONS=$(aws iam list-policy-versions \
                        --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                        --query 'Versions[?IsDefaultVersion==`false`].VersionId' \
                        --output text)
                    
                    if [ -n "$OLD_VERSIONS" ]; then
                        for version in $OLD_VERSIONS; do
                            echo "🗑️  Deleting policy version: $version"
                            aws iam delete-policy-version \
                                --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                                --version-id "$version"
                        done
                    fi
                    
                    # Now try creating the new version again
                    echo "🔄 Retrying policy update..."
                    aws iam create-policy-version \
                        --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                        --policy-document file://bedrock-policy-update.json \
                        --set-as-default
                fi
            fi
        fi
        
        rm -f bedrock-policy-update.json
    fi
    
    # Check if Lambda function exists, create if not
    if ! aws lambda get-function --function-name "$LAMBDA_NAME" >/dev/null 2>&1; then
        echo "🆕 Creating Lambda function..."
        aws lambda create-function \
            --function-name "$LAMBDA_NAME" \
            --runtime python3.13 \
            --role "$ROLE_ARN" \
            --handler lambda_function.handler \
            --zip-file fileb://function.zip \
            --timeout 30 \
            --memory-size $LAMBDA_MEMORY_SIZE \
            --environment Variables="{BEDROCK_REGION=us-east-1,RATE_LIMIT_PER_MINUTE=$RATE_LIMIT_PER_MINUTE,RATE_LIMIT_TABLE_NAME=${PROJECT_NAME}-rate-limits,PROJECT_NAME=$PROJECT_NAME}" \
            --description "Vedfolnir AI Alt Text Generator" \
            --tags "Project=$PROJECT_NAME,Environment=prod,ManagedBy=vedfolnir" >/dev/null
        echo "✅ Lambda function created: $LAMBDA_NAME"
    else
        aws lambda update-function-code --function-name "$LAMBDA_NAME" --zip-file fileb://function.zip
        
        # Wait for code update to complete before configuration update
        echo "⏳ Waiting for code update to complete..."
        while true; do
            STATUS=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.LastUpdateStatus' --output text 2>/dev/null)
            if [ "$STATUS" = "Successful" ]; then
                break
            elif [ "$STATUS" = "Failed" ]; then
                echo "❌ Lambda code update failed"
                exit 1
            else
                echo "⏳ Code update status: $STATUS - waiting..."
                sleep 5
            fi
        done
        
        aws lambda update-function-configuration \
            --function-name "$LAMBDA_NAME" \
            --handler lambda_function.handler \
            --memory-size $LAMBDA_MEMORY_SIZE \
            --environment Variables="{BEDROCK_REGION=us-east-1,RATE_LIMIT_PER_MINUTE=$RATE_LIMIT_PER_MINUTE,RATE_LIMIT_TABLE_NAME=${PROJECT_NAME}-rate-limits,PROJECT_NAME=$PROJECT_NAME}"
    fi
    
    # Add resource-based policy for Function URL access
    echo "🔐 Setting up Function URL permissions..."
    # Remove existing permission if it exists (ignore errors)
    aws lambda remove-permission --function-name "$LAMBDA_NAME" --statement-id FunctionURLAllowPublicAccess 2>/dev/null || true
    # Add new permission
    aws lambda add-permission \
        --function-name "$LAMBDA_NAME" \
        --statement-id FunctionURLAllowPublicAccess \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE > /dev/null
    
    # Create function URL if it doesn't exist
    if ! aws lambda get-function-url-config --function-name "$LAMBDA_NAME" >/dev/null 2>&1; then
        echo "🔗 Creating Lambda function URL..."
        aws lambda create-function-url-config \
            --function-name "$LAMBDA_NAME" \
            --auth-type NONE \
            --cors "AllowCredentials=false,AllowHeaders=*,AllowMethods=*,AllowOrigins=https://$FULL_DOMAIN,ExposeHeaders=*,MaxAge=86400" >/dev/null
        echo "✅ Lambda function URL created"
    fi
    
    echo "✅ Backend updated"
    
    # Re-detect Lambda function after backend update to ensure we have the correct name
    LAMBDA_NAME=$(detect_lambda_function)
    echo "🔍 Confirmed Lambda function: $LAMBDA_NAME"
    
    # Trigger monitoring setup after backend update
    echo "📊 Setting up monitoring..."
    
    # Wait for Lambda function to be ready
    echo "⏳ Waiting for Lambda function to be ready..."
    while true; do
        STATUS=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.State' --output text 2>/dev/null || echo "Pending")
        if [ "$STATUS" = "Active" ]; then
            echo "✅ Lambda function is ready"
            break
        fi
        echo "⏳ Lambda function status: $STATUS - waiting..."
        sleep 5
    done
    
    # Load configuration
    ALERT_EMAIL=$(jq -r '.alertEmail // "iolaire@vedfolnir.org"' "$PROJECT_ROOT/domain-config.json")
    COST_THRESHOLD=$(jq -r '.costThreshold // 10' "$PROJECT_ROOT/domain-config.json")
    ERROR_THRESHOLD=$(jq -r '.errorThreshold // 5' "$PROJECT_ROOT/domain-config.json")
    DURATION_THRESHOLD=$(jq -r '.durationThreshold // 30000' "$PROJECT_ROOT/domain-config.json")
    INVOCATION_THRESHOLD=$(jq -r '.invocationThreshold // 1000' "$PROJECT_ROOT/domain-config.json")
    
    # Create SNS topic for alerts (idempotent)
    echo "📧 Managing SNS topic for alerts..."
    
    # Check if topic exists
    TOPIC_ARN=$(aws sns list-topics --query "Topics[?contains(TopicArn, '${PROJECT_NAME}-alerts')].TopicArn" --output text)
    
    if [ -z "$TOPIC_ARN" ]; then
        echo "📧 Creating SNS topic: ${PROJECT_NAME}-alerts"
        TOPIC_ARN=$(aws sns create-topic --name "${PROJECT_NAME}-alerts" --query 'TopicArn' --output text)
        echo "✅ SNS topic created: $TOPIC_ARN"
        
        # Subscribe email to topic
        aws sns subscribe \
          --topic-arn "$TOPIC_ARN" \
          --protocol email \
          --notification-endpoint "$ALERT_EMAIL" >/dev/null
        echo "📧 Email subscription added for: $ALERT_EMAIL"
        echo "⚠️  Please check your email and confirm the subscription"
    else
        echo "📧 SNS topic exists: $TOPIC_ARN"
        
        # Check if email subscription exists and matches current config
        EXISTING_EMAIL=$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --query "Subscriptions[?Protocol=='email'].Endpoint" --output text)
        
        if [ "$EXISTING_EMAIL" != "$ALERT_EMAIL" ]; then
            echo "📧 Email address changed from '$EXISTING_EMAIL' to '$ALERT_EMAIL'"
            
            # Remove old subscription if exists
            if [ -n "$EXISTING_EMAIL" ]; then
                OLD_SUB_ARN=$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --query "Subscriptions[?Protocol=='email' && Endpoint=='$EXISTING_EMAIL'].SubscriptionArn" --output text)
                if [ -n "$OLD_SUB_ARN" ] && [ "$OLD_SUB_ARN" != "None" ]; then
                    aws sns unsubscribe --subscription-arn "$OLD_SUB_ARN"
                    echo "📧 Removed old email subscription: $EXISTING_EMAIL"
                fi
            fi
            
            # Add new subscription
            aws sns subscribe \
              --topic-arn "$TOPIC_ARN" \
              --protocol email \
              --notification-endpoint "$ALERT_EMAIL" >/dev/null
            echo "📧 New email subscription added for: $ALERT_EMAIL"
            echo "⚠️  Please check your email and confirm the subscription"
        else
            echo "📧 Email subscription unchanged: $ALERT_EMAIL"
        fi
    fi
    
    # Create CloudWatch alarms (idempotent with change detection)
    echo "🚨 Managing CloudWatch alarms..."
    
    # Function to create or update alarm
    create_or_update_alarm() {
        local alarm_name="$1"
        local metric_name="$2"
        local threshold="$3"
        local comparison="$4"
        local description="$5"
        local namespace="$6"
        local dimensions="$7"
        
        # Check if alarm exists
        if aws cloudwatch describe-alarms --alarm-names "$alarm_name" --query 'MetricAlarms[0]' >/dev/null 2>&1; then
            # Get current threshold
            CURRENT_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "$alarm_name" --query 'MetricAlarms[0].Threshold' --output text)
            
            if [ "$CURRENT_THRESHOLD" != "$threshold" ]; then
                echo "🚨 Updating alarm threshold: $alarm_name ($CURRENT_THRESHOLD → $threshold)"
                aws cloudwatch put-metric-alarm \
                  --alarm-name "$alarm_name" \
                  --alarm-description "$description" \
                  --metric-name "$metric_name" \
                  --namespace "$namespace" \
                  --statistic Sum \
                  --period 300 \
                  --threshold "$threshold" \
                  --comparison-operator "$comparison" \
                  --evaluation-periods 2 \
                  --alarm-actions "$TOPIC_ARN" \
                  --dimensions "$dimensions" >/dev/null
                echo "✅ Alarm updated: $alarm_name"
            else
                echo "🚨 Alarm unchanged: $alarm_name (threshold: $threshold)"
            fi
        else
            echo "🚨 Creating alarm: $alarm_name"
            aws cloudwatch put-metric-alarm \
              --alarm-name "$alarm_name" \
              --alarm-description "$description" \
              --metric-name "$metric_name" \
              --namespace "$namespace" \
              --statistic Sum \
              --period 300 \
              --threshold "$threshold" \
              --comparison-operator "$comparison" \
              --evaluation-periods 2 \
              --alarm-actions "$TOPIC_ARN" \
              --dimensions "$dimensions" >/dev/null
            echo "✅ Alarm created: $alarm_name"
        fi
    }
    
    # Create alarms
    create_or_update_alarm \
        "${PROJECT_NAME}-high-error-rate" \
        "Errors" \
        "$ERROR_THRESHOLD" \
        "GreaterThanThreshold" \
        "High error rate for ${PROJECT_NAME}" \
        "AWS/Lambda" \
        "Name=FunctionName,Value=$LAMBDA_NAME"
    
    create_or_update_alarm \
        "${PROJECT_NAME}-high-duration" \
        "Duration" \
        "$DURATION_THRESHOLD" \
        "GreaterThanThreshold" \
        "High duration for ${PROJECT_NAME}" \
        "AWS/Lambda" \
        "Name=FunctionName,Value=$LAMBDA_NAME"
    
    create_or_update_alarm \
        "${PROJECT_NAME}-high-invocations" \
        "Invocations" \
        "$INVOCATION_THRESHOLD" \
        "GreaterThanThreshold" \
        "High invocation rate for ${PROJECT_NAME}" \
        "AWS/Lambda" \
        "Name=FunctionName,Value=$LAMBDA_NAME"
    
    # Create cost alarm (different approach for billing metrics)
    echo "🚨 Managing cost alarm..."
    COST_ALARM_NAME="${PROJECT_NAME}-high-costs"
    
    if aws cloudwatch describe-alarms --alarm-names "$COST_ALARM_NAME" --query 'MetricAlarms[0]' >/dev/null 2>&1; then
        CURRENT_COST_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "$COST_ALARM_NAME" --query 'MetricAlarms[0].Threshold' --output text)
        
        if [ "$CURRENT_COST_THRESHOLD" != "$COST_THRESHOLD" ]; then
            echo "🚨 Updating cost alarm threshold: $COST_ALARM_NAME ($CURRENT_COST_THRESHOLD → $COST_THRESHOLD)"
            aws cloudwatch put-metric-alarm \
              --alarm-name "$COST_ALARM_NAME" \
              --alarm-description "High costs for ${PROJECT_NAME} project" \
              --metric-name "EstimatedCharges" \
              --namespace "AWS/Billing" \
              --statistic Maximum \
              --period 86400 \
              --threshold "$COST_THRESHOLD" \
              --comparison-operator GreaterThanThreshold \
              --evaluation-periods 1 \
              --alarm-actions "$TOPIC_ARN" \
              --dimensions Name=Currency,Value=USD >/dev/null
            echo "✅ Cost alarm updated: $COST_ALARM_NAME"
        else
            echo "🚨 Cost alarm unchanged: $COST_ALARM_NAME (threshold: $COST_THRESHOLD)"
        fi
    else
        echo "🚨 Creating cost alarm: $COST_ALARM_NAME"
        aws cloudwatch put-metric-alarm \
          --alarm-name "$COST_ALARM_NAME" \
          --alarm-description "High costs for ${PROJECT_NAME} project" \
          --metric-name "EstimatedCharges" \
          --namespace "AWS/Billing" \
          --statistic Maximum \
          --period 86400 \
          --threshold "$COST_THRESHOLD" \
          --comparison-operator GreaterThanThreshold \
          --evaluation-periods 1 \
          --alarm-actions "$TOPIC_ARN" \
          --dimensions Name=Currency,Value=USD >/dev/null
        echo "✅ Cost alarm created: $COST_ALARM_NAME"
    fi
    
    # Set up log retention
    echo "📝 Setting up log retention..."
    aws logs put-retention-policy \
      --log-group-name "/aws/lambda/$LAMBDA_NAME" \
      --retention-in-days 90 2>/dev/null || echo "Log group will be created on first execution"
    
    # Create CloudWatch dashboard (check for changes)
    echo "📊 Managing CloudWatch dashboard..."
    
    # Define the new dashboard configuration
    create_dashboard_config    
    # Check if dashboard exists and compare
    if aws cloudwatch get-dashboard --dashboard-name "${PROJECT_NAME}-Dashboard" >/dev/null 2>&1; then
        # Get existing dashboard
        EXISTING_DASHBOARD=$(aws cloudwatch get-dashboard --dashboard-name "${PROJECT_NAME}-Dashboard" --query 'DashboardBody' --output text)
        NEW_DASHBOARD=$(cat dashboard.json)
        
        # Compare dashboards (normalize whitespace)
        if [ "$(echo "$EXISTING_DASHBOARD" | tr -d ' \n\t')" = "$(echo "$NEW_DASHBOARD" | tr -d ' \n\t')" ]; then
            echo "📊 Dashboard unchanged: ${PROJECT_NAME}-Dashboard"
        else
            echo "📊 Dashboard changed - updating: ${PROJECT_NAME}-Dashboard"
            aws cloudwatch put-dashboard \
              --dashboard-name "${PROJECT_NAME}-Dashboard" \
              --dashboard-body file://dashboard.json >/dev/null
            echo "✅ Dashboard updated: ${PROJECT_NAME}-Dashboard"
        fi
    else
        echo "📊 Creating new dashboard: ${PROJECT_NAME}-Dashboard"
        aws cloudwatch put-dashboard \
          --dashboard-name "${PROJECT_NAME}-Dashboard" \
          --dashboard-body file://dashboard.json >/dev/null
        echo "✅ Dashboard created: ${PROJECT_NAME}-Dashboard"
    fi
    
    rm -f dashboard.json
    
    echo "✅ Monitoring setup complete (4 alarms + dashboard + log retention)"
fi

# Update frontend if requested
if [[ "$1" == "frontend" || "$1" == "all" ]]; then
    echo "🌐 Updating Frontend..."
    
    # Re-detect Lambda function before frontend update to ensure we have the latest
    LAMBDA_NAME=$(detect_lambda_function)
    echo "🔍 Using Lambda function for frontend: $LAMBDA_NAME"
    
    # Create S3 bucket if it doesn't exist
    if ! aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
        echo "🪣 Creating S3 bucket: $BUCKET_NAME"
        aws s3 mb "s3://$BUCKET_NAME" --region us-east-1
        aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document error.html
        
        # Tag S3 bucket
        aws s3api put-bucket-tagging \
          --bucket "$BUCKET_NAME" \
          --tagging "TagSet=[{Key=Project,Value=$PROJECT_NAME},{Key=Environment,Value=prod},{Key=ManagedBy,Value=vedfolnir}]"
    fi
    
    cd "$PROJECT_ROOT/frontend"
    
    # Get current Lambda URL for frontend
    CURRENT_LAMBDA_URL=$(aws lambda get-function-url-config --function-name "$LAMBDA_NAME" --query FunctionUrl --output text 2>/dev/null || echo "")
    
    # Update index.html from template with current Lambda URL
    if [ -f "index.html.template" ] && [ ! -z "$CURRENT_LAMBDA_URL" ]; then
        echo "🔧 Updating index.html from template with Lambda URL..."
        sed "s|{{LAMBDA_URL}}|$CURRENT_LAMBDA_URL|g" index.html.template > index.html
        echo "✅ Updated index.html with Lambda URL: $CURRENT_LAMBDA_URL"
    fi
    
    npm install
    npm run build
    aws s3 sync dist "s3://$BUCKET_NAME" --delete
    echo "✅ Frontend updated"
    
    # Also update Amplify
    echo "🚀 Updating Amplify..."
    cd "$PROJECT_ROOT"
    node deploy-amplify-zip.js
    echo "✅ Amplify updated"
    
    # Invalidate CloudFront cache if distribution exists
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET_NAME.s3-website-us-east-1.amazonaws.com'].Id" --output text 2>/dev/null || echo "")
    if [[ -n "$DISTRIBUTION_ID" ]]; then
        echo "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
        echo "✅ Cache invalidated"
    fi
fi

# Setup monitoring if requested
if [[ "$1" == "monitoring" || "$1" == "all" ]]; then
    echo "📊 Setting up monitoring..."
    
    # Wait for Lambda function to be ready
    echo "⏳ Waiting for Lambda function to be ready..."
    aws lambda wait function-updated --function-name "$LAMBDA_NAME"
    
    # Create SNS topic for alerts (only if it doesn't exist)
    echo "📧 Setting up email notifications..."
    if aws sns get-topic-attributes --topic-arn "arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):${PROJECT_NAME}-alerts" >/dev/null 2>&1; then
        SNS_TOPIC_ARN="arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):${PROJECT_NAME}-alerts"
        echo "📧 SNS topic already exists: ${PROJECT_NAME}-alerts"
        
        # Check if email subscription needs updating
        EXISTING_EMAIL=$(aws sns list-subscriptions-by-topic --topic-arn "$SNS_TOPIC_ARN" --query 'Subscriptions[?Protocol==`email`].Endpoint' --output text)
        if [ "$EXISTING_EMAIL" != "$ALERT_EMAIL" ]; then
            echo "📧 Email changed from $EXISTING_EMAIL to $ALERT_EMAIL - updating subscription"
            # Remove old subscription
            OLD_SUB_ARN=$(aws sns list-subscriptions-by-topic --topic-arn "$SNS_TOPIC_ARN" --query 'Subscriptions[?Protocol==`email`].SubscriptionArn' --output text)
            if [ "$OLD_SUB_ARN" != "None" ] && [ ! -z "$OLD_SUB_ARN" ]; then
                aws sns unsubscribe --subscription-arn "$OLD_SUB_ARN"
            fi
            # Add new subscription
            aws sns subscribe --topic-arn "$SNS_TOPIC_ARN" --protocol email --notification-endpoint "$ALERT_EMAIL"
            echo "📧 New email subscription created for $ALERT_EMAIL (check email to confirm)"
        else
            echo "📧 Email subscription unchanged: $ALERT_EMAIL"
        fi
    else
        SNS_TOPIC_ARN=$(aws sns create-topic --name "${PROJECT_NAME}-alerts" --query 'TopicArn' --output text)
        
        # Tag SNS topic
        aws sns tag-resource \
          --resource-arn "$SNS_TOPIC_ARN" \
          --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"
        
        # Subscribe email to topic
        aws sns subscribe \
          --topic-arn "$SNS_TOPIC_ARN" \
          --protocol email \
          --notification-endpoint "$ALERT_EMAIL"
        
        echo "📧 Email subscription created for $ALERT_EMAIL (check email to confirm)"
    fi
    
    # Create CloudWatch alarms (only if they don't exist)
    echo "Creating CloudWatch alarms..."
    
    # 1. High error rate alarm
    if ! aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-HighErrors" >/dev/null 2>&1; then
        aws cloudwatch put-metric-alarm \
          --alarm-name "${PROJECT_NAME}-HighErrors" \
          --alarm-description "High Lambda error rate detected" \
          --metric-name Errors \
          --namespace AWS/Lambda \
          --statistic Sum \
          --period 300 \
          --threshold "$ERROR_THRESHOLD" \
          --comparison-operator GreaterThanThreshold \
          --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
          --evaluation-periods 1 \
          --alarm-actions "$SNS_TOPIC_ARN"
        echo "✅ Created HighErrors alarm (threshold: $ERROR_THRESHOLD)"
    else
        # Check if threshold needs updating
        CURRENT_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-HighErrors" --query 'MetricAlarms[0].Threshold' --output text)
        if [ "$CURRENT_THRESHOLD" != "$ERROR_THRESHOLD.0" ]; then
            echo "🚨 Error threshold changed from $CURRENT_THRESHOLD to $ERROR_THRESHOLD - updating alarm"
            aws cloudwatch put-metric-alarm \
              --alarm-name "${PROJECT_NAME}-HighErrors" \
              --alarm-description "High Lambda error rate detected" \
              --metric-name Errors \
              --namespace AWS/Lambda \
              --statistic Sum \
              --period 300 \
              --threshold "$ERROR_THRESHOLD" \
              --comparison-operator GreaterThanThreshold \
              --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
              --evaluation-periods 1 \
              --alarm-actions "$SNS_TOPIC_ARN"
            echo "✅ Updated HighErrors alarm threshold to $ERROR_THRESHOLD"
        else
            echo "📊 HighErrors alarm unchanged (threshold: $ERROR_THRESHOLD)"
        fi
    fi
    
    # Tag existing resources for cost tracking
    echo "🏷️ Tagging existing resources..."
    
    # Tag Lambda function
    LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.FunctionArn' --output text)
    aws lambda tag-resource \
      --resource "$LAMBDA_ARN" \
      --tags "Project=$PROJECT_NAME,Environment=prod,ManagedBy=vedfolnir" 2>/dev/null || true
    
    # Tag S3 bucket
    aws s3api put-bucket-tagging \
      --bucket "$BUCKET_NAME" \
      --tagging "TagSet=[{Key=Project,Value=$PROJECT_NAME},{Key=Environment,Value=prod},{Key=ManagedBy,Value=vedfolnir}]" 2>/dev/null || true
    
    # Tag IAM role
    aws iam tag-role \
      --role-name "${PROJECT_NAME}-lambda-role" \
      --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir" 2>/dev/null || true
    
    # Tag Amplify app
    if [ ! -z "$AMPLIFY_APP_ID" ]; then
        aws amplify tag-resource \
          --resource-arn "arn:aws:amplify:us-east-1:$(aws sts get-caller-identity --query Account --output text):apps/$AMPLIFY_APP_ID" \
          --tags "Project=$PROJECT_NAME,Environment=prod,ManagedBy=vedfolnir" 2>/dev/null || true
    fi
    
    # Create CloudWatch alarms
    echo "Creating CloudWatch alarms..."
    if ! aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-ProjectCosts" >/dev/null 2>&1; then
        aws cloudwatch put-metric-alarm \
          --alarm-name "${PROJECT_NAME}-ProjectCosts" \
          --alarm-description "Project costs exceeding budget" \
          --metric-name BlendedCost \
          --namespace AWS/Billing \
          --statistic Maximum \
          --period 86400 \
          --threshold "$COST_THRESHOLD" \
          --comparison-operator GreaterThanThreshold \
          --dimensions Name=Currency,Value=USD \
          --evaluation-periods 1 \
          --region us-east-1 \
          --alarm-actions "$SNS_TOPIC_ARN"
        echo "✅ Created ProjectCosts alarm (threshold: \$$COST_THRESHOLD)"
    else
        # Check if threshold needs updating
        CURRENT_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-ProjectCosts" --query 'MetricAlarms[0].Threshold' --output text)
        if [ "$CURRENT_THRESHOLD" != "$COST_THRESHOLD.0" ]; then
            echo "💰 Cost threshold changed from \$$CURRENT_THRESHOLD to \$$COST_THRESHOLD - updating alarm"
            aws cloudwatch put-metric-alarm \
              --alarm-name "${PROJECT_NAME}-ProjectCosts" \
              --alarm-description "Project costs exceeding budget" \
              --metric-name BlendedCost \
              --namespace AWS/Billing \
              --statistic Maximum \
              --period 86400 \
              --threshold "$COST_THRESHOLD" \
              --comparison-operator GreaterThanThreshold \
              --dimensions Name=Currency,Value=USD \
              --evaluation-periods 1 \
              --region us-east-1 \
              --alarm-actions "$SNS_TOPIC_ARN"
            echo "✅ Updated ProjectCosts alarm threshold to \$$COST_THRESHOLD"
        else
            echo "📊 ProjectCosts alarm unchanged (threshold: \$$COST_THRESHOLD)"
        fi
    fi
    
    # 3. Long duration alarm
    if ! aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-LongDuration" >/dev/null 2>&1; then
        aws cloudwatch put-metric-alarm \
          --alarm-name "${PROJECT_NAME}-LongDuration" \
          --alarm-description "Lambda function taking too long" \
          --metric-name Duration \
          --namespace AWS/Lambda \
          --statistic Average \
          --period 300 \
          --threshold "$DURATION_THRESHOLD" \
          --comparison-operator GreaterThanThreshold \
          --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
          --evaluation-periods 2 \
          --alarm-actions "$SNS_TOPIC_ARN"
        echo "✅ Created LongDuration alarm (threshold: ${DURATION_THRESHOLD}ms)"
    else
        # Check if threshold needs updating
        CURRENT_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-LongDuration" --query 'MetricAlarms[0].Threshold' --output text)
        if [ "$CURRENT_THRESHOLD" != "$DURATION_THRESHOLD.0" ]; then
            echo "⏱️ Duration threshold changed from ${CURRENT_THRESHOLD}ms to ${DURATION_THRESHOLD}ms - updating alarm"
            aws cloudwatch put-metric-alarm \
              --alarm-name "${PROJECT_NAME}-LongDuration" \
              --alarm-description "Lambda function taking too long" \
              --metric-name Duration \
              --namespace AWS/Lambda \
              --statistic Average \
              --period 300 \
              --threshold "$DURATION_THRESHOLD" \
              --comparison-operator GreaterThanThreshold \
              --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
              --evaluation-periods 2 \
              --alarm-actions "$SNS_TOPIC_ARN"
            echo "✅ Updated LongDuration alarm threshold to ${DURATION_THRESHOLD}ms"
        else
            echo "📊 LongDuration alarm unchanged (threshold: ${DURATION_THRESHOLD}ms)"
        fi
    fi
    
    # 4. High invocation rate alarm
    if ! aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-HighInvocations" >/dev/null 2>&1; then
        aws cloudwatch put-metric-alarm \
          --alarm-name "${PROJECT_NAME}-HighInvocations" \
          --alarm-description "Unusual spike in Lambda invocations" \
          --metric-name Invocations \
          --namespace AWS/Lambda \
          --statistic Sum \
          --period 3600 \
          --threshold "$INVOCATION_THRESHOLD" \
          --comparison-operator GreaterThanThreshold \
          --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
          --evaluation-periods 1 \
          --alarm-actions "$SNS_TOPIC_ARN"
        echo "✅ Created HighInvocations alarm (threshold: $INVOCATION_THRESHOLD/hour)"
    else
        # Check if threshold needs updating
        CURRENT_THRESHOLD=$(aws cloudwatch describe-alarms --alarm-names "${PROJECT_NAME}-HighInvocations" --query 'MetricAlarms[0].Threshold' --output text)
        if [ "$CURRENT_THRESHOLD" != "$INVOCATION_THRESHOLD.0" ]; then
            echo "📈 Invocation threshold changed from $CURRENT_THRESHOLD to $INVOCATION_THRESHOLD - updating alarm"
            aws cloudwatch put-metric-alarm \
              --alarm-name "${PROJECT_NAME}-HighInvocations" \
              --alarm-description "Unusual spike in Lambda invocations" \
              --metric-name Invocations \
              --namespace AWS/Lambda \
              --statistic Sum \
              --period 3600 \
              --threshold "$INVOCATION_THRESHOLD" \
              --comparison-operator GreaterThanThreshold \
              --dimensions Name=FunctionName,Value=$LAMBDA_NAME \
              --evaluation-periods 1 \
              --alarm-actions "$SNS_TOPIC_ARN"
            echo "✅ Updated HighInvocations alarm threshold to $INVOCATION_THRESHOLD/hour"
        else
            echo "📊 HighInvocations alarm unchanged (threshold: $INVOCATION_THRESHOLD/hour)"
        fi
    fi
    
    # Set CloudWatch log retention
    echo "Setting CloudWatch log retention..."
    aws logs put-retention-policy \
      --log-group-name "/aws/lambda/$LAMBDA_NAME" \
      --retention-in-days 90 2>/dev/null || echo "Log group will be created on first execution"
    
    # Create CloudWatch dashboard (check for changes)
    echo "📊 Managing CloudWatch dashboard..."
    
    # Define the new dashboard configuration
    create_dashboard_config    
    # Check if dashboard exists and compare
    if aws cloudwatch get-dashboard --dashboard-name "${PROJECT_NAME}-Dashboard" >/dev/null 2>&1; then
        # Get existing dashboard
        EXISTING_DASHBOARD=$(aws cloudwatch get-dashboard --dashboard-name "${PROJECT_NAME}-Dashboard" --query 'DashboardBody' --output text)
        NEW_DASHBOARD=$(cat dashboard.json)
        
        # Compare dashboards (normalize whitespace)
        if [ "$(echo "$EXISTING_DASHBOARD" | tr -d ' \n\t')" = "$(echo "$NEW_DASHBOARD" | tr -d ' \n\t')" ]; then
            echo "📊 Dashboard unchanged: ${PROJECT_NAME}-Dashboard"
        else
            echo "📊 Dashboard changed - updating: ${PROJECT_NAME}-Dashboard"
            aws cloudwatch put-dashboard \
              --dashboard-name "${PROJECT_NAME}-Dashboard" \
              --dashboard-body file://dashboard.json >/dev/null
            echo "✅ Dashboard updated: ${PROJECT_NAME}-Dashboard"
        fi
    else
        echo "📊 Creating new dashboard: ${PROJECT_NAME}-Dashboard"
        aws cloudwatch put-dashboard \
          --dashboard-name "${PROJECT_NAME}-Dashboard" \
          --dashboard-body file://dashboard.json >/dev/null
        echo "✅ Dashboard created: ${PROJECT_NAME}-Dashboard"
    fi
    
    rm -f dashboard.json
    
    echo "✅ Monitoring setup complete (4 alarms + dashboard + log retention)"
fi

    # Tag S3 bucket for cost tracking
    aws s3api put-bucket-tagging \
      --bucket "$BUCKET_NAME" \
      --tagging "TagSet=[{Key=Project,Value=$PROJECT_NAME},{Key=Environment,Value=prod},{Key=ManagedBy,Value=vedfolnir}]"
    
    # Tag CloudWatch alarms for cost tracking
    aws cloudwatch tag-resource \
      --resource-arn "arn:aws:cloudwatch:us-east-1:$(aws sts get-caller-identity --query Account --output text):alarm:${PROJECT_NAME}-HighErrors" \
      --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"
    
    aws cloudwatch tag-resource \
      --resource-arn "arn:aws:cloudwatch:us-east-1:$(aws sts get-caller-identity --query Account --output text):alarm:${PROJECT_NAME}-LongDuration" \
      --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"
    
    aws cloudwatch tag-resource \
      --resource-arn "arn:aws:cloudwatch:us-east-1:$(aws sts get-caller-identity --query Account --output text):alarm:${PROJECT_NAME}-HighInvocations" \
      --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"
    
    aws cloudwatch tag-resource \
      --resource-arn "arn:aws:cloudwatch:us-east-1:$(aws sts get-caller-identity --query Account --output text):alarm:${PROJECT_NAME}-ProjectCosts" \
      --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=prod" "Key=ManagedBy,Value=vedfolnir"

# Setup domain if requested
if [[ "$1" == "domain" || "$1" == "all" ]]; then
    echo "🌐 Setting up custom domain..."
    node update-domain.js
fi

# Show current URLs
echo ""
echo "📋 Current Deployment URLs:"
LAMBDA_URL=$(aws lambda get-function-url-config --function-name "$LAMBDA_NAME" --query FunctionUrl --output text 2>/dev/null || echo "Not configured")
echo "Backend: $LAMBDA_URL"
echo "Frontend: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo "Amplify: https://main.d1qul4kz7dh3x3.amplifyapp.com"
echo "Domain: https://$FULL_DOMAIN ✅"

echo "✅ Update complete!"
