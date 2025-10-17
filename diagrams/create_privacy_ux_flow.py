#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.aws.compute import Lambda
from diagrams.aws.ml import Bedrock
from diagrams.aws.database import Dynamodb
from diagrams.programming.framework import React
from diagrams.onprem.network import Internet
from diagrams.onprem.security import Vault

with Diagram("Vedfolnir - Privacy-First User Experience", show=False, direction="TB", filename="vedfolnir_privacy_ux"):
    
    user = Users("Fediverse User\n(Mastodon/Pixelfed)")
    
    with Cluster("Privacy-First Design"):
        with Cluster("Browser-Only Data"):
            browser_storage = Vault("Browser Storage\nEncrypted Tokens\nNever Sent to Server")
            session_data = Vault("Session Storage\nInstance URLs\nTemporary Only")
        
        with Cluster("No Data Collection"):
            no_tracking = Internet("No Tracking\nNo Analytics\nNo Cookies")
            no_storage = Internet("No Server Storage\nNo User Accounts\nNo Personal Data")
    
    with Cluster("User Journey"):
        with Cluster("1. Landing & Education"):
            landing = React("Landing Page\nPrivacy Explanation\nFeature Overview")
            about = React("About Page\nCreator Info\nOpen Source")
            help = React("Help Page\nSetup Instructions\nTroubleshooting")
        
        with Cluster("2. Connection Setup"):
            connect = React("Connect Page\nInstance URL Input\nToken Generation Guide")
            token_encrypt = Vault("Token Encryption\nAES-GCM in Browser\nNever Transmitted")
        
        with Cluster("3. Post Scanning"):
            dashboard = React("Dashboard\nScan Posts Button\nImage Discovery")
            post_fetch = Internet("Fetch User Posts\nDirect API Calls\nNo Proxy/Storage")
        
        with Cluster("4. Alt Text Generation"):
            image_select = React("Image Selection\nPreview & Review\nManual Override")
            ai_process = Lambda("Temporary Processing\nImage → Base64\nImmediate Discard")
            bedrock_ai = Bedrock("Bedrock Nova Lite\nAI Alt Text\nNo Image Storage")
        
        with Cluster("5. Post Updates"):
            review_approve = React("Review & Approve\nEdit Generated Text\nUser Control")
            api_update = Internet("Direct API Update\nMastodon/Pixelfed\nNo Intermediary")
    
    with Cluster("Rate Limiting & Monitoring"):
        rate_limit = Dynamodb("Rate Limiting\n60 requests/minute\nIP-based only")
        monitoring = Internet("Anonymous Metrics\nNo User Tracking\nPerformance Only")
    
    # User flow
    user >> Edge(label="1. Visit Site") >> landing
    landing >> Edge(label="Learn More") >> about
    landing >> Edge(label="Get Help") >> help
    landing >> Edge(label="Get Started") >> connect
    
    # Privacy-preserving connection
    connect >> Edge(label="2. Generate Token\n(User's Instance)") >> token_encrypt
    token_encrypt >> Edge(label="Store Locally") >> browser_storage
    
    # Post scanning
    connect >> Edge(label="3. Scan Posts") >> dashboard
    dashboard >> Edge(label="Direct API Call") >> post_fetch
    post_fetch >> Edge(label="Images Found") >> image_select
    
    # AI processing (temporary)
    image_select >> Edge(label="4. Generate Alt Text\n(Temporary Base64)") >> ai_process
    ai_process >> Edge(label="Process & Discard") >> bedrock_ai
    bedrock_ai >> Edge(label="Alt Text Only") >> review_approve
    
    # Final update
    review_approve >> Edge(label="5. Update Post\n(Direct API)") >> api_update
    api_update >> Edge(label="Success") >> user
    
    # Rate limiting (privacy-preserving)
    ai_process >> Edge(label="Check Rate\n(IP Only)") >> rate_limit
    
    # Privacy annotations
    browser_storage >> Edge(label="Never Transmitted", style="dashed", color="red") >> no_storage
    session_data >> Edge(label="Cleared on Close", style="dashed", color="green") >> no_tracking
