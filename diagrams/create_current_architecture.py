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
from diagrams.onprem.network import Internet

with Diagram("Vedfolnir - Current Architecture (2025)", show=False, direction="TB", filename="vedfolnir_current_architecture"):
    
    user = Users("Fediverse User")
    
    with Cluster("Frontend (React SPA)"):
        with Cluster("AWS Hosting"):
            route53 = Route53("Route 53\nq.zero.vedfolnir.org")
            cloudfront = CloudFront("CloudFront CDN\nSSL/TLS")
            amplify = Amplify("AWS Amplify\nCI/CD & Hosting")
            s3_frontend = S3("S3 Bucket\nStatic Assets")
        
        with Cluster("React Components"):
            landing = Internet("Landing Page\nPrivacy-First Design")
            connect = Internet("Connect Page\nToken Input")
            dashboard = Internet("Dashboard\nPost Scanning")
    
    with Cluster("Backend (Serverless)"):
        lambda_func = Lambda("Lambda Function\n256MB, Python 3.13")
        bedrock = Bedrock("Amazon Bedrock\nNova Lite Model")
        
        with Cluster("Monitoring & Rate Limiting"):
            dynamodb = Dynamodb("DynamoDB\nRate Limiting")
            cloudwatch = Cloudwatch("CloudWatch\nMetrics & Alarms")
            sns = SNS("SNS\nEmail Alerts")
    
    with Cluster("External APIs"):
        mastodon = Internet("Mastodon/Pixelfed\nActivityPub APIs")
    
    # User flow
    user >> Edge(label="1. Visit Site") >> route53
    route53 >> cloudfront >> amplify >> s3_frontend
    s3_frontend >> Edge(label="2. Load React App") >> landing
    
    landing >> Edge(label="3. Connect Account") >> connect
    connect >> Edge(label="4. Scan Posts") >> dashboard
    
    # API calls
    dashboard >> Edge(label="5. Generate Alt Text\n(Base64 Image)") >> lambda_func
    lambda_func >> Edge(label="6. Rate Check") >> dynamodb
    lambda_func >> Edge(label="7. AI Processing") >> bedrock
    bedrock >> Edge(label="8. Alt Text") >> lambda_func
    lambda_func >> Edge(label="9. Update Post") >> mastodon
    
    # Monitoring
    lambda_func >> Edge(label="Metrics") >> cloudwatch
    cloudwatch >> Edge(label="Alerts") >> sns
    sns >> Edge(label="Email") >> user
    
    # Return path
    mastodon >> Edge(label="10. Success") >> dashboard
    dashboard >> Edge(label="11. Updated UI") >> user
