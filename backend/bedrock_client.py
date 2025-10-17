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

import json
import base64
import boto3
import os


def generate_alt_text(image_data):
    """Generate alt text for image using Amazon Nova Lite"""
    import logging
    logger = logging.getLogger()
    
    try:
        # Create Bedrock client
        region = os.environ.get('BEDROCK_REGION', 'us-east-1')
        bedrock = boto3.client('bedrock-runtime', region_name=region)
        
        # Prepare payload for Nova Lite (correct format based on AWS docs)
        payload = {
            'messages': [{
                'role': 'user',
                'content': [{
                    'image': {
                        'format': 'jpeg',
                        'source': {
                            'bytes': image_data
                        }
                    }
                }, {
                    'text': '''# Image Description for Accessibility

## Task
Generate a detailed, concise alt text description of the provided image that effectively communicates its content to visually impaired users.

## Guidelines
Create a comprehensive description that includes:
- **Primary subjects**: Identify main people, animals, or objects
- **Actions**: Describe what is happening in the scene
- **Setting**: Mention the location or environment
- **Visual details**: Include relevant colors, lighting, composition
- **Context**: Add any text, signs, or important background elements
- **Mood/atmosphere**: Convey the overall feeling or tone if relevant

## Format Requirements
- Write in clear, descriptive language
- Use present tense
- Be specific but concise (aim for 1-3 sentences)
- Avoid subjective interpretations
- Focus on what is visible, not assumptions

## Examples
- Good: "A golden retriever sits on green grass in a sunny park, looking directly at the camera with its tongue out"
- Avoid: "A happy dog enjoying a beautiful day"

Please provide only the alt text description, without any additional commentary or formatting.'''
                }]
            }],
            'inferenceConfig': {
                'maxTokens': 200,
                'temperature': 0.1,
                'topP': 0.9
            }
        }
        
        # Call Bedrock
        response = bedrock.invoke_model(
            modelId='amazon.nova-lite-v1:0',
            body=json.dumps(payload),
            contentType='application/json'
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        
        # Extract alt text from response
        if 'output' in response_body and 'message' in response_body['output']:
            content = response_body['output']['message']['content']
            if content and len(content) > 0:
                alt_text = content[0].get('text', '').strip()
                
                # Log token usage for monitoring
                usage = response_body.get('usage', {})
                input_tokens = usage.get('inputTokens', 0)
                output_tokens = usage.get('outputTokens', 0)
                total_tokens = usage.get('totalTokens', 0)
                
                # Calculate cost (Nova Lite pricing: $0.0008 per 1K input tokens, $0.0016 per 1K output tokens)
                input_cost = (input_tokens / 1000) * 0.0008
                output_cost = (output_tokens / 1000) * 0.0016
                total_cost = input_cost + output_cost
                
                logger.info(f"Bedrock usage - Input: {input_tokens}, Output: {output_tokens}, Total: {total_tokens} tokens, Cost: ${total_cost:.6f}")
                
                # Send custom metrics to CloudWatch
                try:
                    cloudwatch = boto3.client('cloudwatch', region_name=region)
                    project_name = os.environ.get('PROJECT_NAME', 'alt-text-generator-q')
                    
                    cloudwatch.put_metric_data(
                        Namespace=f'{project_name}/Bedrock',
                        MetricData=[
                            {
                                'MetricName': 'InputTokens',
                                'Value': input_tokens,
                                'Unit': 'Count',
                                'Dimensions': [
                                    {'Name': 'Project', 'Value': project_name},
                                    {'Name': 'Environment', 'Value': 'prod'}
                                ]
                            },
                            {
                                'MetricName': 'OutputTokens',
                                'Value': output_tokens,
                                'Unit': 'Count',
                                'Dimensions': [
                                    {'Name': 'Project', 'Value': project_name},
                                    {'Name': 'Environment', 'Value': 'prod'}
                                ]
                            },
                            {
                                'MetricName': 'TotalTokens',
                                'Value': total_tokens,
                                'Unit': 'Count',
                                'Dimensions': [
                                    {'Name': 'Project', 'Value': project_name},
                                    {'Name': 'Environment', 'Value': 'prod'}
                                ]
                            },
                            {
                                'MetricName': 'RequestCost',
                                'Value': total_cost,
                                'Unit': 'None',
                                'Dimensions': [
                                    {'Name': 'Project', 'Value': project_name},
                                    {'Name': 'Environment', 'Value': 'prod'}
                                ]
                            }
                        ]
                    )
                except Exception as e:
                    logger.warning(f"Failed to send CloudWatch metrics: {e}")
                
                return alt_text
        
        logger.error("No valid content in Bedrock response")
        return "Unable to generate alt text for this image."
        
    except Exception as e:
        logger.error(f"Bedrock error: {str(e)}")
        raise Exception(f"Failed to generate alt text: {str(e)}")


def validate_image_data(image_data):
    """Validate base64 image data"""
    try:
        # Decode base64 to check if it's valid
        decoded = base64.b64decode(image_data)
        
        # Basic size check (max 20MB for Bedrock)
        if len(decoded) > 20 * 1024 * 1024:
            raise ValueError("Image too large (max 20MB)")
        
        # Check for common image headers
        if not (decoded.startswith(b'\xff\xd8\xff') or  # JPEG
                decoded.startswith(b'\x89PNG') or        # PNG
                decoded.startswith(b'GIF8') or           # GIF
                decoded.startswith(b'RIFF')):            # WebP
            raise ValueError("Invalid image format")
        
        return True
        
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")
