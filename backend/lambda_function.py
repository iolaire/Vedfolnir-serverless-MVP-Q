import json
import os
import logging
import boto3
import time
import resource
import base64
import requests
from io import BytesIO
from bedrock_client import generate_alt_text, validate_image_data

# Set up logging first
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Optional PIL import - gracefully handle if not available
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("PIL not available - image validation will be limited")

# Initialize clients
dynamodb = boto3.client('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def send_lambda_metrics(start_time, success=True):
    """Send Lambda performance metrics to CloudWatch"""
    try:
        project_name = os.environ.get('PROJECT_NAME', 'alt-text-generator-q')
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        metrics = [
            {
                'MetricName': 'Invocations',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Project', 'Value': project_name},
                    {'Name': 'Environment', 'Value': 'prod'}
                ]
            },
            {
                'MetricName': 'Duration',
                'Value': duration,
                'Unit': 'Milliseconds',
                'Dimensions': [
                    {'Name': 'Project', 'Value': project_name},
                    {'Name': 'Environment', 'Value': 'prod'}
                ]
            },
            {
                'MetricName': 'MemoryUsed',
                'Value': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024,  # Convert KB to MB
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Project', 'Value': project_name},
                    {'Name': 'Environment', 'Value': 'prod'}
                ]
            }
        ]
        
        if not success:
            metrics.append({
                'MetricName': 'Errors',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Project', 'Value': project_name},
                    {'Name': 'Environment', 'Value': 'prod'}
                ]
            })
        
        cloudwatch.put_metric_data(
            Namespace=f'{project_name}/Lambda',
            MetricData=metrics
        )
    except Exception as e:
        logger.warning(f"Failed to send Lambda metrics: {e}")

def check_rate_limit():
    """Simple global rate limiting - configurable requests per minute"""
    table_name = os.environ.get('RATE_LIMIT_TABLE_NAME', 'alt-text-generator-q-rate-limits')
    project_name = os.environ.get('PROJECT_NAME', 'alt-text-generator-q')
    current_minute = int(time.time() // 60)
    
    # Get rate limit from environment variable
    rate_limit = int(os.environ.get('RATE_LIMIT_PER_MINUTE', '1000'))
    
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
                BillingMode='PAY_PER_REQUEST',
                Tags=[
                    {'Key': 'Project', 'Value': project_name},
                    {'Key': 'Environment', 'Value': 'prod'},
                    {'Key': 'ManagedBy', 'Value': 'vedfolnir'}
                ]
            )
            logger.info(f"Created DynamoDB table: {table_name}")
            
            # Store rate limit config in table for change detection
            dynamodb.put_item(
                TableName=table_name,
                Item={
                    'time_window': {'S': 'config'},
                    'rate_limit': {'N': str(rate_limit)}
                }
            )
        except dynamodb.exceptions.ResourceInUseException:
            pass  # Table already exists
        except Exception as e:
            if 'ResourceInUseException' in str(e):
                pass  # Table exists
        
        # Check if rate limit config changed
        try:
            config_response = dynamodb.get_item(
                TableName=table_name,
                Key={'time_window': {'S': 'config'}}
            )
            if 'Item' in config_response:
                stored_limit = int(config_response['Item']['rate_limit']['N'])
                if stored_limit != rate_limit:
                    logger.info(f"Rate limit changed from {stored_limit} to {rate_limit} requests/minute")
                    # Update stored config
                    dynamodb.put_item(
                        TableName=table_name,
                        Item={
                            'time_window': {'S': 'config'},
                            'rate_limit': {'N': str(rate_limit)}
                        }
                    )
            else:
                # Store initial config
                dynamodb.put_item(
                    TableName=table_name,
                    Item={
                        'time_window': {'S': 'config'},
                        'rate_limit': {'N': str(rate_limit)}
                    }
                )
        except Exception:
            pass  # Config tracking is optional
        
        # Update counter
        response = dynamodb.update_item(
            TableName=table_name,
            Key={'time_window': {'S': str(current_minute)}},
            UpdateExpression='ADD request_count :inc',
            ExpressionAttributeValues={':inc': {'N': '1'}},
            ReturnValues='UPDATED_NEW'
        )
        
        count = int(response['Attributes']['request_count']['N'])
        
        if count > rate_limit:
            logger.warning(f"Rate limit exceeded: {count} requests in minute {current_minute} (limit: {rate_limit})")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Rate limiting error: {str(e)}")
        return True  # Allow request if rate limiting fails


def get_cors_headers():
    """Return empty headers since Function URL handles CORS"""
    return {}


def sanitize_base64(image_data):
    """Validate and sanitize base64 image data"""
    if not image_data or not isinstance(image_data, str):
        return None
    
    # Remove data URL prefix if present
    if image_data.startswith('data:'):
        image_data = image_data.split(',', 1)[-1]
    
    # Validate base64
    try:
        validate_image_data(image_data)
        return image_data
    except Exception:
        return None


def handler(event, context):
    """Lambda function handler"""
    start_time = time.time()
    
    # Handle OPTIONS requests for CORS
    if event.get('httpMethod') == 'OPTIONS':
        send_lambda_metrics(start_time, success=True)
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }
    
    # Check rate limit first
    if not check_rate_limit():
        logger.warning("Request blocked by rate limiting")
        send_lambda_metrics(start_time, success=False)
        return {
            'statusCode': 429,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Rate limit exceeded. Please try again later.'})
        }
    
    # Parse body if it's a string (Function URL format)
    if isinstance(event.get('body'), str):
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            body = {}
    else:
        body = event
    
    # Handle both image_data (base64) and image_url
    image_data = body.get('image_data')
    image_url = body.get('image_url')
    
    if image_url:
        # Fetch image from URL and convert to base64 (same as frontend conversion)
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Convert to JPEG and resize (same logic as frontend)
            if not PIL_AVAILABLE:
                # Without PIL, just encode the raw image data
                image_data = base64.b64encode(response.content).decode('utf-8')
            else:
                img = Image.open(BytesIO(response.content))
                
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize to max 1024px (same as frontend)
                max_size = 1024
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Convert to JPEG base64
                buffer = BytesIO()
                img.save(buffer, format='JPEG', quality=80)
                image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            logger.error(f"ERROR: Failed to fetch image from URL: {str(e)}")
            send_lambda_metrics(start_time, success=False)
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Failed to fetch image from URL'})
            }
    
    # Validate image data
    image_data = sanitize_base64(image_data)
    if not image_data:
        logger.error("ERROR: Invalid image data provided")
        send_lambda_metrics(start_time, success=False)
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': 'Invalid image data'
        }
    
    try:
        # Generate alt text using Bedrock
        alt_text = generate_alt_text(image_data)
        
        # Simple success logging with token count
        token_count = len(alt_text.split())
        logger.info(f"SUCCESS: Generated alt text, tokens: {token_count}")
        
        send_lambda_metrics(start_time, success=True)
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'alt_text': alt_text})
        }
        
    except Exception as e:
        # Simple error logging
        logger.error(f"ERROR: Alt text generation failed - {str(e)}")
        send_lambda_metrics(start_time, success=False)
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)})
        }
