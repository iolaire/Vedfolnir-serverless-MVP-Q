# Vedfolnir Architecture Diagrams

This folder contains Python scripts to generate PNG diagrams showing the Vedfolnir application architecture.

**Note:** PNG files are excluded from git tracking and must be generated locally.

## Current Diagrams (Updated 2025-10-17)

### **Recommended Current Scripts**
1. **create_current_architecture.py** - Current AWS architecture (2025)
2. **create_technical_flow.py** - Technical implementation flow
3. **create_deployment_monitoring.py** - Deployment & monitoring setup
4. **create_privacy_ux_flow.py** - Privacy-first user experience

### **Updated Legacy Scripts**
5. **create_architecture_diagram.py** - Basic AWS architecture (updated)
6. **create_detailed_diagram.py** - With cost breakdown (updated)
7. **create_expanded_diagram.py** - Complete browser & AWS (updated)
8. **create_browser_flow_diagram.py** - Browser UX flow (updated)
9. **create_focused_flow_diagram.py** - Core functionality (updated)

## Key Architecture Updates (2025)

### Current Implementation Features:
- **React SPA**: Modern React Router with privacy-first design
- **AWS Amplify**: Zip deployment with auto-detection
- **Lambda Function**: 256MB Python 3.13 with Bedrock Nova Lite
- **Rate Limiting**: DynamoDB-based (60 req/min)
- **Monitoring**: 4 CloudWatch alarms with SNS email alerts
- **Privacy**: Browser-only token storage, no server-side data
- **Domain**: Custom domain with Route 53 + CloudFront + ACM

### Deployment Automation:
- Auto-detection of AWS resources
- Dynamic configuration via `domain-config.json`
- Comprehensive monitoring setup
- Privacy-preserving architecture

## Usage

```bash
# Activate virtual environment
source diagram_env/bin/activate

# Generate current architecture (recommended)
python create_current_architecture.py

# Generate all updated legacy diagrams
python create_architecture_diagram.py
python create_browser_flow_diagram.py
python create_detailed_diagram.py
python create_expanded_diagram.py
python create_focused_flow_diagram.py

# Generate technical implementation
python create_technical_flow.py
python create_deployment_monitoring.py
python create_privacy_ux_flow.py
```

## Requirements

- Python 3.x
- diagrams library (`pip install diagrams`)
- Graphviz (for rendering)

## Generated Files

PNG files are generated locally and excluded from git tracking. Run the Python scripts to create:
- `vedfolnir_current_architecture.png`
- `vedfolnir_technical_flow.png`
- `vedfolnir_deployment_monitoring.png`
- `vedfolnir_privacy_ux.png`
- `vedfolnir_-_ai_alt_text_generator_architecture.png`
- `vedfolnir_-_browser_user_experience_flow.png`
- `vedfolnir_-_complete_browser_&_aws_architecture.png`
- `vedfolnir_-_core_functionality_flow.png`
- `vedfolnir_-_detailed_architecture_with_cost_breakdown.png`
