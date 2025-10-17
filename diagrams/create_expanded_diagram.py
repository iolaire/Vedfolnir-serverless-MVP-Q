#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.network import CloudFront, Route53
from diagrams.aws.storage import S3
from diagrams.aws.mobile import Amplify
from diagrams.aws.database import Dynamodb
from diagrams.aws.management import Cloudwatch, CloudwatchAlarm
from diagrams.aws.integration import SNS
from diagrams.aws.security import ACM
from diagrams.programming.framework import React
from diagrams.onprem.client import Users
from diagrams.onprem.network import Internet
from diagrams.onprem.security import Vault
from diagrams.onprem.vcs import Git

with Diagram("Vedfolnir - Complete Browser & AWS Architecture", show=False, direction="LR"):
    
    with Cluster("Development"):
        developer = Users("Developer")
        git_repo = Git("Git Repository")
        deploy_script = Git("deploy-amplify-zip.js")
    
    with Cluster("Browser Client"):
        user = Users("User")
        
        with Cluster("React SPA"):
            landing_page = React("Landing\n/")
            connect_page = React("Connect\n/connect")
            dashboard_page = React("Dashboard\n/dashboard")
            about_page = React("About/Help\n/about, /help")
        
        with Cluster("Browser Storage"):
            local_storage = Vault("localStorage\nEncrypted Tokens")
            session_storage = Vault("sessionStorage\nInstance Data")
    
    with Cluster("AWS Production"):
        with Cluster("Domain & CDN"):
            route53 = Route53("Route 53\nq.zero.vedfolnir.org")
            acm_cert = ACM("ACM Certificate")
            cloudfront = CloudFront("CloudFront CDN")
        
        with Cluster("Frontend Hosting"):
            amplify = Amplify("AWS Amplify\nZip Deployment")
            s3_bucket = S3("S3 Bucket\nStatic Files")
        
        with Cluster("Backend Processing"):
            lambda_func = Lambda("Lambda Function\nlambda_function.py\n256MB Python 3.13")
            bedrock_client = Bedrock("Bedrock Client\nbedrock_client.py\nNova Lite Model")
        
        with Cluster("Data Storage"):
            rate_db = Dynamodb("DynamoDB\nRate Limiting\n60 req/min")
        
        with Cluster("Monitoring System"):
            metrics = Cloudwatch("CloudWatch\nCustom Metrics")
            alarm_errors = CloudwatchAlarm("Error Alarm\n>5 errors")
            alarm_costs = CloudwatchAlarm("Cost Alarm\n>$10/month")
            alarm_duration = CloudwatchAlarm("Duration Alarm\n>30 seconds")
            alarm_invocations = CloudwatchAlarm("Invocation Alarm\n>1000/hour")
            sns_alerts = SNS("SNS Alerts\nEmail Notifications")
    
    with Cluster("External APIs"):
        mastodon_api = Internet("Mastodon API\n/api/v1/statuses")
        pixelfed_api = Internet("Pixelfed API\n/api/v1/media")
    
    # Development flow
    developer >> git_repo >> deploy_script >> amplify
    
    # User navigation
    user >> landing_page >> connect_page >> dashboard_page
    connect_page >> local_storage
    connect_page >> session_storage
    
    # Infrastructure
    user >> route53 >> cloudfront >> amplify >> s3_bucket
    acm_cert >> cloudfront
    
    # API processing
    dashboard_page >> lambda_func >> rate_db
    lambda_func >> bedrock_client
    
    # External API calls
    dashboard_page >> mastodon_api
    dashboard_page >> pixelfed_api
    
    # Monitoring
    lambda_func >> metrics
    metrics >> alarm_errors >> sns_alerts
    metrics >> alarm_costs >> sns_alerts
    metrics >> alarm_duration >> sns_alerts
    metrics >> alarm_invocations >> sns_alerts
    sns_alerts >> developer
