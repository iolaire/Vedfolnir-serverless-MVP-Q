#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.network import CloudFront, Route53
from diagrams.aws.storage import S3
from diagrams.aws.mobile import Amplify
from diagrams.aws.database import Dynamodb
from diagrams.aws.management import Cloudwatch
from diagrams.aws.integration import SNS
from diagrams.aws.security import ACM
from diagrams.onprem.client import Users
from diagrams.onprem.network import Internet

with Diagram("Vedfolnir - Detailed Architecture with Cost Breakdown", show=False, direction="TB"):
    
    user = Users("Fediverse User")
    
    with Cluster("Frontend Infrastructure"):
        route53 = Route53("Route 53\n$0.50/month\nDNS Hosting")
        acm = ACM("ACM Certificate\nFREE\nSSL/TLS")
        cloudfront = CloudFront("CloudFront\n$0.85/month\n100K requests")
        amplify = Amplify("AWS Amplify\n$0.15/month\nZip Deployment")
        s3_static = S3("S3 Static\n$0.50/month\n100K page views")
    
    with Cluster("Backend Services"):
        lambda_func = Lambda("Lambda Function\n$0.85/month\n100K invocations\n256MB, 2s avg")
        bedrock = Bedrock("Bedrock Nova Lite\n$80.00/month\n100K images\n$0.0008/1K tokens")
        
    with Cluster("Data & Monitoring"):
        dynamodb = Dynamodb("DynamoDB\n$0.50/month\nRate Limiting\n60 req/min")
        cloudwatch = Cloudwatch("CloudWatch\n$0.60/month\n4 Alarms + Metrics")
        sns = SNS("SNS Alerts\nFREE\nEmail Notifications")
    
    with Cluster("External APIs"):
        mastodon = Internet("Mastodon/Pixelfed\nFREE\nActivityPub APIs")
    
    with Cluster("Cost Summary"):
        total_cost = Internet("Total: $82.85/month\n(High Usage)\n\nPersonal: $0.52/month\n(30 images/month)")
    
    # Infrastructure flow
    user >> route53 >> cloudfront >> amplify >> s3_static
    acm >> cloudfront
    
    # Backend processing
    user >> Edge(label="Generate Alt Text") >> lambda_func
    lambda_func >> Edge(label="Rate Check") >> dynamodb
    lambda_func >> Edge(label="AI Processing") >> bedrock
    lambda_func >> Edge(label="Metrics") >> cloudwatch
    cloudwatch >> Edge(label="Alerts") >> sns
    
    # External integration
    lambda_func >> Edge(label="Update Posts") >> mastodon
    
    # Cost indication
    bedrock >> Edge(label="96% of costs", style="dashed") >> total_cost
