# Vedfolnir – AI-Powered Accessibility for the Fediverse

AI-powered alt text generation for images using Amazon Bedrock and React frontend.

**Open Source** - Licensed under AGPL v3+ | **Privacy-First** - No data storage | **Secure** - Comprehensive security review completed

## 🌐 Live Application

**🎉 Your app is live at: https://q.zero.vedfolnir.org**

- **📄 Legal & Privacy**: https://q.zero.vedfolnir.org/legal

## 🚀 Quick Deployment

### For Your Own Domain
1. **Copy domain config**: `cp domain-config.sample.json domain-config.json`
2. **Edit domain-config.json** with your domain details (AWS resource IDs auto-detected)
3. **Deploy**: `node deploy-amplify-zip.js` (automatically detects and updates AWS resources)

### Current Domain
Deploy using Amplify zip method:

```bash
# Deploy frontend to Amplify
node deploy-amplify-zip.js

# Update backend Lambda function
./update-app.sh backend
```

## 🔄 Quick Updates

Update deployed components:

```bash
# Update everything (backend + frontend + domain)
./update-app.sh all

# Update frontend only (S3 + Amplify)
./update-app.sh frontend

# Update backend only (Lambda)
./update-app.sh backend

# Update domain configuration
./update-app.sh domain
```

## 📁 Project Structure

```
├── frontend/              # React SPA application
│   ├── src/              # React components & routing
│   ├── public/           # Static assets
│   ├── index.html.template # Template for dynamic generation
│   └── index.html        # Generated (gitignored)
├── backend/
│   ├── lambda_function.py # Main Lambda handler
│   ├── bedrock_client.py # Bedrock Nova Lite integration
│   ├── deploy/           # Clean deployment files
│   └── dev/              # Development scripts
├── diagrams/             # Architecture diagrams
│   ├── create_*.py       # Diagram generation scripts
│   └── *.png             # Generated diagrams (gitignored)
├── deploy-amplify-zip.js # Amplify zip deployment (auto-detection)
├── update-app.sh         # Component update script
├── domain-config.sample.json # Sample domain configuration
└── LICENSE               # AGPL v3+ license
```

## 🛠️ Manual Deployment Steps

### Prerequisites
- AWS CLI configured
- Node.js installed
- Route 53 hosted zone (for custom domain)

### 1. Backend Deployment
```bash
./update-app.sh backend
```

### 2. Frontend Deployment
```bash
node deploy-amplify-zip.js
```

### 3. Domain Setup
```bash
./update-app.sh domain
```

## 🌐 Custom Domain

The app is configured with custom domain `q.zero.vedfolnir.org`. To update domain configuration:

```bash
node update-domain.js
```

## 📋 Testing

Test the deployed application:
```bash
# Test the live app
curl -I https://q.zero.vedfolnir.org

# Run deployment tests
node deployment-tests.js
node domain-tests.js
```

## 🔗 Live URLs

Current deployment URLs:
- **🌐 Custom Domain**: https://q.zero.vedfolnir.org ✅
- **📱 Amplify**: https://main.d1qul4kz7dh3x3.amplifyapp.com
- **⚡ Backend API**: https://ehv7xwsyndobxx3ep7reox5da40twayu.lambda-url.us-east-1.on.aws/
- **🗂️ S3 Frontend**: http://alt-text-generator-frontend-q.s3-website-us-east-1.amazonaws.com

## 🏗️ Architecture

- **Frontend**: React + Vite → AWS Amplify (with CloudFront CDN)
- **Backend**: Python Lambda function with Amazon Bedrock (Nova Lite model)
- **Domain**: Route 53 DNS → CloudFront distribution
- **Deployment**: Automated scripts with AWS CLI

## 📊 Monitoring & Alerts

### **CloudWatch Monitoring**
- ✅ **4 CloudWatch Alarms** - Error rate, costs, duration, invocations
- ✅ **Email Notifications** - SNS alerts for all alarm triggers
- ✅ **Rate Limiting** - 60 requests/minute with email notifications
- ✅ **Real-time Dashboard** - Visual monitoring of key metrics
- ✅ **Structured Logging** - Bedrock token usage and cost tracking

### **Configurable Thresholds**
Configure monitoring and performance via `domain-config.json`:
```json
{
  "alertEmail": "iolaire@vedfolnir.org",
  "costThreshold": 10,
  "errorThreshold": 5,
  "durationThreshold": 30000,
  "invocationThreshold": 1000,
  "rateLimitPerMinute": 60,
  "lambdaMemorySize": 256
}
```

- **alertEmail**: Email address for CloudWatch alarm notifications
- **costThreshold**: Monthly cost alarm threshold (USD)
- **errorThreshold**: Error count alarm threshold (per evaluation period)
- **durationThreshold**: Lambda timeout alarm threshold (milliseconds)
- **invocationThreshold**: Invocation rate alarm threshold (per hour)
- **rateLimitPerMinute**: API rate limiting threshold
- **lambdaMemorySize**: Lambda function memory allocation in MB (optimized to 256 MB)

### **Monitoring Cost**: ~$1.10/month
- CloudWatch Alarms: $0.40/month
- CloudWatch Logs: $0.20/month
- DynamoDB (rate limiting): $0.50/month
- SNS (email notifications): $0.00/month (first 1,000 notifications free)

## 🔒 Security Features

### **API Security**
- ✅ **API Key Authentication** - Secure Lambda endpoint access
- ✅ **CORS Restrictions** - Limited to `https://q.zero.vedfolnir.org`
- ✅ **Input Validation** - Base64 image data sanitization
- ✅ **Error Handling** - Generic error messages prevent information leakage
- ✅ **Rate Limiting** - 60 requests/minute with DynamoDB tracking

### **Web Security Headers**
- ✅ **X-Frame-Options: DENY** - Prevents clickjacking attacks
- ✅ **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- ✅ **X-XSS-Protection: 1; mode=block** - Enables XSS filtering
- ✅ **Strict-Transport-Security** - Enforces HTTPS connections
- ✅ **Referrer-Policy** - Controls referrer information
- ✅ **Content-Security-Policy** - Restricts resource loading

### **Privacy & Compliance**
- ✅ **No Personal Data Storage** - Images processed temporarily only
- ✅ **GDPR Compliant** - No tracking or persistent data collection
- ✅ **Secure Key Management** - API keys stored in environment variables

## 💰 Cost Analysis

### High Usage (100K images/month)
| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| **Amazon Bedrock Nova Lite** | 100K images × 2K tokens avg | $240.00 |
| **AWS Lambda** | 100K invocations, 256MB, 1s each | $0.42 |
| **Amazon S3** | Frontend hosting, 100K page views | $0.50 |
| **Amazon CloudFront** | CDN, 100K requests | $0.85 |
| **AWS Amplify** | Frontend hosting & CI/CD | $0.15 |
| **Amazon Route 53** | DNS hosting | $0.50 |
| **DynamoDB** | Rate limiting table | $0.50 |
| **CloudWatch** | Monitoring & alerts | $1.10 |
| **Total** | | **$244.02/month** |

**Cost per image: $0.0024**

### Personal Usage (30 images/month)
| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| **Amazon Bedrock Nova Lite** | 30 images × 2K tokens avg | $0.072 |
| **AWS Lambda** | 30 invocations, 256MB, 1s each | $0.00* |
| **Amazon S3** | Frontend hosting, minimal usage | $0.00* |
| **Amazon CloudFront** | CDN, minimal requests | $0.00* |
| **AWS Amplify** | Frontend hosting & CI/CD | $0.00* |
| **Amazon Route 53** | DNS hosting | $0.50 |
| **DynamoDB** | Rate limiting table | $0.50 |
| **CloudWatch** | Monitoring & alerts | $1.10 |
| **Total** | | **$2.22/month** |

**Cost per image: $0.074**

*Covered by AWS Free Tier

### Cost Breakdown (High Usage)
- **Bedrock (98%)**: $240 - Image processing with Nova Lite model
- **Infrastructure (2%)**: $4.02 - Hosting, CDN, DNS, monitoring

### Nova Lite Pricing Details
- **Input tokens**: $0.0008 per 1K tokens (image + prompt)
- **Output tokens**: $0.0016 per 1K tokens (alt text description)
- **Average usage**: ~2,000 tokens total per image
- **Lambda duration**: ~1 second average per request

### Free Tier Benefits
- **Lambda**: 1M requests + 400K GB-seconds/month free (first 12 months)
- **S3**: 5GB storage + 20K requests/month free (first 12 months)
- **CloudFront**: 1TB transfer + 10M requests/month free (first 12 months)
- **Amplify**: 1K build minutes + 15GB served/month free

### Cost Optimization Tips
- Implement prompt caching (up to 50% Bedrock savings)
- Lambda memory optimized to 256 MB (50% memory cost reduction)
- Use batch processing for multiple images
- Enable CloudFront caching for static assets
