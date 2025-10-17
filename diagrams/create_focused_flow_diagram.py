#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.network import Internet
from diagrams.programming.framework import React
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.database import Dynamodb

with Diagram("Vedfolnir - Core Functionality Flow", show=False, direction="TB"):
    
    user = Users("Fediverse User")
    
    with Cluster("React Dashboard (Dashboard.jsx)"):
        with Cluster("Connection Setup"):
            instance_input = React("Instance URL Input\n(masto.ai, pixelfed.social)")
            token_storage = React("Token Storage\nEncrypted in Browser")
            
        with Cluster("Post Scanning"):
            scan_posts = React("Scan Posts Button\nFetch User Timeline")
            image_discovery = React("Image Discovery\nFilter Missing Alt Text")
            
        with Cluster("Alt Text Generation"):
            select_image = React("Select Image\nPreview & Generate")
            review_approve = React("Review & Approve\nEdit Generated Text")
            update_post = React("Update Post\nDirect API Call")
    
    with Cluster("AWS Backend"):
        rate_limiting = Dynamodb("Rate Limiting\n60 requests/minute")
        lambda_func = Lambda("Lambda Function\nlambda_function.py")
        bedrock_ai = Bedrock("Bedrock Nova Lite\ngenerate_alt_text()")
    
    with Cluster("External APIs"):
        mastodon_api = Internet("Mastodon Instance\n/api/v1/statuses")
        pixelfed_api = Internet("Pixelfed Instance\n/api/v1/media")
    
    # Core workflow
    user >> Edge(label="1. Enter Instance URL") >> instance_input
    instance_input >> Edge(label="2. Store Token") >> token_storage
    token_storage >> Edge(label="3. Scan Posts") >> scan_posts
    
    scan_posts >> Edge(label="4. Fetch Timeline") >> mastodon_api
    mastodon_api >> Edge(label="5. Return Posts") >> image_discovery
    
    image_discovery >> Edge(label="6. Select Image") >> select_image
    select_image >> Edge(label="7. Generate Alt Text") >> lambda_func
    
    lambda_func >> Edge(label="8. Check Rate Limit") >> rate_limiting
    lambda_func >> Edge(label="9. Process Image") >> bedrock_ai
    bedrock_ai >> Edge(label="10. Return Alt Text") >> review_approve
    
    review_approve >> Edge(label="11. Update Post") >> update_post
    update_post >> Edge(label="12. API Call") >> mastodon_api
    update_post >> Edge(label="12. API Call") >> pixelfed_api
    
    mastodon_api >> Edge(label="13. Success") >> user
    pixelfed_api >> Edge(label="13. Success") >> user
