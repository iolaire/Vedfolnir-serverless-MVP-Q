#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.aws.network import CloudFront, Route53
from diagrams.aws.management import Cloudwatch
from diagrams.aws.database import Dynamodb
from diagrams.aws.ml import Bedrock
from diagrams.aws.integration import SNS
from diagrams.aws.mobile import Amplify
from diagrams.programming.framework import React
from diagrams.onprem.network import Internet

with Diagram("Vedfolnir - Technical Implementation Flow", show=False, direction="LR", filename="vedfolnir_technical_flow"):
    
    with Cluster("Browser (Client-Side)"):
        user = Users("User")
        
        with Cluster("React Router Pages"):
            landing_page = React("Landing Page\n(/)")
            connect_page = React("Connect Page\n(/connect)")
            dashboard_page = React("Dashboard\n(/dashboard)")
            about_page = React("About/Help\n(/about, /help)")
        
        with Cluster("Browser Storage"):
            local_storage = Internet("localStorage\nEncrypted Tokens")
            session_storage = Internet("sessionStorage\nInstance URLs")
    
    with Cluster("AWS Infrastructure"):
        with Cluster("Frontend Hosting"):
            route53 = Route53("DNS\nq.zero.vedfolnir.org")
            cloudfront = CloudFront("CDN\nSSL Certificate")
            amplify = Amplify("Amplify\nZip Deployment")
            s3_static = S3("S3 Bucket\nStatic Files")
        
        with Cluster("Backend Processing"):
            lambda_main = Lambda("Lambda Function\nlambda_function.py")
            bedrock_client = Bedrock("Bedrock Client\nbedrock_client.py")
            
        with Cluster("Data & Monitoring"):
            rate_limit_db = Dynamodb("Rate Limiting\nDynamoDB Table")
            metrics = Cloudwatch("CloudWatch\nCustom Metrics")
            alerts = SNS("SNS Alerts\nEmail Notifications")
    
    with Cluster("External Services"):
        mastodon_api = Internet("Mastodon API\n/api/v1/statuses")
        pixelfed_api = Internet("Pixelfed API\n/api/v1/media")
    
    # User navigation flow
    user >> landing_page >> connect_page >> dashboard_page
    
    # Token storage
    connect_page >> Edge(label="Store Encrypted") >> local_storage
    connect_page >> Edge(label="Store Session") >> session_storage
    
    # Frontend hosting
    user >> route53 >> cloudfront >> amplify >> s3_static
    
    # API processing flow
    dashboard_page >> Edge(label="POST /\n{image_data: base64}") >> lambda_main
    lambda_main >> Edge(label="Check Rate Limit") >> rate_limit_db
    lambda_main >> Edge(label="generate_alt_text()") >> bedrock_client
    bedrock_client >> Edge(label="Nova Lite Model") >> lambda_main
    
    # External API calls
    dashboard_page >> Edge(label="Fetch Posts") >> mastodon_api
    dashboard_page >> Edge(label="Update Media") >> pixelfed_api
    
    # Monitoring
    lambda_main >> Edge(label="Custom Metrics") >> metrics
    metrics >> Edge(label="Threshold Alerts") >> alerts
    alerts >> Edge(label="Email") >> user
