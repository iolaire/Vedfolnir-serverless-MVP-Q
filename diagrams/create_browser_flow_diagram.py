#!/usr/bin/env python3

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.programming.framework import React
from diagrams.onprem.network import Internet
from diagrams.onprem.security import Vault
from diagrams.aws.compute import Lambda

with Diagram("Vedfolnir - Browser User Experience Flow", show=False, direction="TB"):
    
    user = Users("Fediverse User")
    
    with Cluster("Browser Experience"):
        with Cluster("React Router Pages"):
            landing = React("Landing Page\n/ - Privacy Info")
            connect = React("Connect Page\n/connect - Token Setup")
            dashboard = React("Dashboard\n/dashboard - Post Scanning")
            about = React("About/Help\n/about, /help")
        
        with Cluster("Privacy-First Storage"):
            local_storage = Vault("localStorage\nEncrypted Tokens")
            session_storage = Vault("sessionStorage\nInstance URLs")
        
        with Cluster("User Actions"):
            scan_posts = Internet("Scan Posts\nDirect API Calls")
            select_image = Internet("Select Image\nFor Alt Text")
            review_text = Internet("Review & Approve\nGenerated Text")
    
    with Cluster("External Services"):
        mastodon_api = Internet("Mastodon/Pixelfed\nActivityPub APIs")
        lambda_backend = Lambda("Lambda Backend\nAI Processing")
    
    # User journey
    user >> Edge(label="1. Visit Site") >> landing
    landing >> Edge(label="2. Get Started") >> connect
    connect >> Edge(label="3. Store Token") >> local_storage
    connect >> Edge(label="4. Store Instance") >> session_storage
    connect >> Edge(label="5. Go to Dashboard") >> dashboard
    
    # Post scanning flow
    dashboard >> Edge(label="6. Scan Posts") >> scan_posts
    scan_posts >> Edge(label="7. Fetch Timeline") >> mastodon_api
    mastodon_api >> Edge(label="8. Return Images") >> select_image
    
    # Alt text generation
    select_image >> Edge(label="9. Generate Alt Text") >> lambda_backend
    lambda_backend >> Edge(label="10. AI Response") >> review_text
    review_text >> Edge(label="11. Update Post") >> mastodon_api
    mastodon_api >> Edge(label="12. Success") >> user
