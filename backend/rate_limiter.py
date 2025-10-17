import boto3
import time
import json
import logging
import os

logger = logging.getLogger()
dynamodb = boto3.client('dynamodb')
sns = boto3.client('sns')

def get_project_name():
    """Get project name from domain config"""
    try:
        with open('/opt/domain-config.json', 'r') as f:
            config = json.load(f)
            return config['projectName']
    except:
        return 'alt-text-generator-q'  # fallback

def send_rate_limit_alert(count, current_minute):
    """Send alert only once per minute when rate limit exceeded"""
    if count == 1001:  # Only on first breach
        try:
            project_name = get_project_name()
            account_id = os.environ.get('AWS_ACCOUNT_ID')
            region = os.environ.get('AWS_REGION', 'us-east-1')
            
            topic_arn = f'arn:aws:sns:{region}:{account_id}:{project_name}-alerts'
            
            sns.publish(
                TopicArn=topic_arn,
                Subject=f'{project_name} - Rate Limit Exceeded',
                Message=f'Rate limit exceeded: {count} requests in minute {current_minute}'
            )
        except Exception as e:
            logger.error(f"Failed to send rate limit alert: {e}")

def check_rate_limit():
    """Simple global rate limiting - 1000 requests per minute"""
    project_name = get_project_name()
    table_name = f'{project_name}-rate-limits'
    current_minute = int(time.time() // 60)
    
    try:
        # Create table if it doesn't exist
        try:
            dynamodb.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'time_window', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'time_window', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            logger.info(f"Created DynamoDB table: {table_name}")
        except dynamodb.exceptions.ResourceInUseException:
            pass  # Table already exists
        
        # Update counter
        response = dynamodb.update_item(
            TableName=table_name,
            Key={'time_window': {'S': str(current_minute)}},
            UpdateExpression='ADD request_count :inc',
            ExpressionAttributeValues={':inc': {'N': '1'}},
            ReturnValues='UPDATED_NEW'
        )
        
        count = int(response['Attributes']['request_count']['N'])
        
        if count > 1000:
            logger.warning(f"Rate limit exceeded: {count} requests in minute {current_minute}")
            send_rate_limit_alert(count, current_minute)
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Rate limiting error: {str(e)}")
        return True  # Allow request if rate limiting fails
