#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.network import CloudFront, Route53
from diagrams.aws.storage import S3
from diagrams.aws.mobile import Amplify
from diagrams.aws.database import Dynamodb
from diagrams.aws.management import Cloudwatch
from diagrams.onprem.client import Users
from diagrams.onprem.network import Internet

with Diagram("Vedfolnir - AI Alt Text Generator Architecture", show=False, direction="TB"):
    
    users = Users("Fediverse Users")
    mastodon = Internet("Mastodon/Pixelfed")
    
    with Cluster("AWS Infrastructure"):
        dns = Route53("DNS\nq.zero.vedfolnir.org")
        cdn = CloudFront("CloudFront CDN")
        
        with Cluster("Frontend"):
            amplify = Amplify("AWS Amplify\nReact SPA")
            s3_frontend = S3("S3 Bucket\nStatic Assets")
        
        with Cluster("Backend"):
            lambda_func = Lambda("Lambda Function\n256MB Python 3.13")
            bedrock = Bedrock("Bedrock Nova Lite")
            rate_limit = Dynamodb("Rate Limiting\n60 req/min")
            monitoring = Cloudwatch("CloudWatch\nMetrics & Alarms")
    
    # User flow
    users >> dns >> cdn >> amplify >> s3_frontend
    amplify >> Edge(label="Scan Posts") >> mastodon
    amplify >> Edge(label="Generate Alt Text") >> lambda_func
    lambda_func >> rate_limit
    lambda_func >> bedrock
    lambda_func >> monitoring
    lambda_func >> Edge(label="Update Posts") >> mastodon
