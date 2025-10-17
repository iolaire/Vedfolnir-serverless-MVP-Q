#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.aws.network import CloudFront, Route53
from diagrams.aws.management import Cloudwatch, CloudwatchAlarm
from diagrams.aws.database import Dynamodb
from diagrams.aws.ml import Bedrock
from diagrams.aws.integration import SNS
from diagrams.aws.mobile import Amplify
from diagrams.aws.security import ACM
from diagrams.onprem.client import Users
from diagrams.onprem.vcs import Git

with Diagram("Vedfolnir - Deployment & Monitoring Architecture", show=False, direction="TB", filename="vedfolnir_deployment_monitoring"):
    
    with Cluster("Development & Deployment"):
        developer = Users("Developer")
        git_repo = Git("Git Repository\nGitHub")
        
        with Cluster("Deployment Scripts"):
            deploy_script = Git("deploy-amplify-zip.js\nAuto-detection")
            update_script = Git("update-app.sh\nComponent Updates")
            domain_config = Git("domain-config.json\nConfiguration")
    
    with Cluster("AWS Production Environment"):
        with Cluster("Domain & SSL"):
            route53_dns = Route53("Route 53\nDNS Management")
            acm_cert = ACM("ACM Certificate\nSSL/TLS")
            cloudfront_cdn = CloudFront("CloudFront\nGlobal CDN")
        
        with Cluster("Frontend Infrastructure"):
            amplify_app = Amplify("Amplify App\nZip Deployment")
            s3_bucket = S3("S3 Bucket\nStatic Hosting")
        
        with Cluster("Backend Services"):
            lambda_function = Lambda("Lambda Function\n256MB Memory\nPython 3.13")
            bedrock_nova = Bedrock("Bedrock Nova Lite\nAI Model")
            
        with Cluster("Data Storage"):
            dynamodb_rate = Dynamodb("DynamoDB\nRate Limiting\n60 req/min")
        
        with Cluster("Monitoring & Alerting"):
            with Cluster("CloudWatch Metrics"):
                cw_invocations = Cloudwatch("Invocations\nCount")
                cw_errors = Cloudwatch("Errors\nCount") 
                cw_duration = Cloudwatch("Duration\nMilliseconds")
                cw_costs = Cloudwatch("Costs\nUSD")
                cw_tokens = Cloudwatch("Bedrock Tokens\nInput/Output")
            
            with Cluster("Alarms (4 Total)"):
                alarm_error = CloudwatchAlarm("Error Rate\n>5 errors")
                alarm_cost = CloudwatchAlarm("Monthly Cost\n>$10 USD")
                alarm_duration = CloudwatchAlarm("Duration\n>30 seconds")
                alarm_invocation = CloudwatchAlarm("Invocation Rate\n>1000/hour")
            
            sns_alerts = SNS("SNS Topic\nEmail Alerts")
    
    # Deployment flow
    developer >> git_repo >> deploy_script
    deploy_script >> Edge(label="Auto-detect Resources") >> amplify_app
    deploy_script >> Edge(label="Configure Domain") >> route53_dns
    update_script >> Edge(label="Update Components") >> lambda_function
    
    # Infrastructure connections
    route53_dns >> cloudfront_cdn >> amplify_app >> s3_bucket
    acm_cert >> cloudfront_cdn
    
    # Backend connections
    lambda_function >> bedrock_nova
    lambda_function >> dynamodb_rate
    
    # Monitoring flow
    lambda_function >> cw_invocations >> alarm_invocation
    lambda_function >> cw_errors >> alarm_error
    lambda_function >> cw_duration >> alarm_duration
    lambda_function >> cw_costs >> alarm_cost
    lambda_function >> cw_tokens
    
    # Alert notifications
    alarm_error >> sns_alerts
    alarm_cost >> sns_alerts
    alarm_duration >> sns_alerts
    alarm_invocation >> sns_alerts
    sns_alerts >> Edge(label="iolaire@vedfolnir.org") >> developer
