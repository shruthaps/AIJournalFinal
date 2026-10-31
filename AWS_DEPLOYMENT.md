# Dearly — AWS Cloud Deployment & Operations Guide

This guide details the deployment of **Dearly** on Amazon Web Services (AWS). It is designed to be demonstrated for a **Software Development Project (SDP)** course and features two deployment options:
1. **Option A (Recommended for Students & SDP Demo)**: Cost-conscious **AWS App Runner** or **AWS Lightsail** ($3.50 – $5/month or 100% Free Tier eligible).
2. **Option B (Enterprise Multi-AZ)**: High-availability **AWS ECS Fargate**, **Application Load Balancer (ALB)**, **Amazon EFS**, and **Amazon S3**.

---

## 1. Cloud Architecture Comparison

| Dimension | Option A: Student SDP (App Runner / Lightsail) | Option B: Enterprise Multi-AZ (ECS Fargate + ALB) |
|---|---|---|
| **Best For** | Academic demonstration, portfolio, student budget | Enterprise production, multi-region scaling |
| **Estimated Cost** | **$0 – $5 / month** (Free tier eligible) | **~$25 – $35 / month** (ALB + NAT Gateway + Fargate) |
| **Container Service** | AWS App Runner / Lightsail Containers | AWS ECS Fargate Tasks |
| **Load Balancer** | Built-in managed HTTPS endpoint (Included) | AWS Application Load Balancer ($16/mo baseline) |
| **Storage** | Attached SSD volume or S3 bucket | Amazon EFS Multi-AZ Mount + S3 Bucket |
| **SSL/TLS** | Automatic free managed certificate | AWS Certificate Manager (ACM) via ALB |
| **Setup Time** | **< 10 minutes** | **~20 minutes** via CloudFormation |

---

## 2. Option A: Student SDP Deployment (Cost-Conscious)

### Step 1: Build & Push Image to Amazon ECR Public or Private

```bash
# 1. Set environment variables
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO="dearly-app"

# 2. Create repository
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

# 3. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 4. Build and push image
docker build -t $ECR_REPO:latest .
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

### Step 2: Deploy to AWS App Runner

AWS App Runner runs containers with automatic load balancing, automatic HTTPS, and zero server maintenance:

```bash
# Create App Runner Service
aws apprunner create-service \
  --service-name dearly-journal \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'"$AWS_ACCOUNT_ID"'.dkr.ecr.'"$AWS_REGION"'.amazonaws.com/'"$ECR_REPO"':latest",
      "ImageConfiguration": {
        "Port": "5000",
        "RuntimeEnvironmentVariables": [
          { "Name": "NODE_ENV", "Value": "production" },
          { "Name": "JWT_SECRET", "Value": "dearly-prod-secret-key-student-demo" },
          { "Name": "PORT", "Value": "5000" }
        ]
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{"Cpu": "1 vCPU", "Memory": "2 GB"}'
```

App Runner will provide an instant, secure HTTPS URL (e.g., `https://xyz123.us-east-1.awsapprunner.com`) that you can demonstrate to your professor.

---

## 3. Option B: Enterprise Multi-AZ Deployment (ECS Fargate + ALB)

For production requirements with dedicated VPC subnets and multi-AZ storage:

### Architecture Diagram

```
                      +-----------------------------+
                      |   Amazon Route 53 (DNS)     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   AWS Certificate Manager   |
                      |          (SSL/TLS)          |
                      +--------------+--------------+
                                     |
                                     v
                  +-----------------------------------+
                  |  Application Load Balancer (ALB)  |
                  +------------------+----------------+
                                     |
                                     v
                  +-----------------------------------+
                  |      AWS ECS Fargate Cluster      |
                  |  (Multi-AZ Container Instances)   |
                  +---------+----------------+--------+
                            |                |
             (EFS Volume Mount)              | (S3 SDK)
                            v                v
                 +--------------------+   +-------------------+
                 |     Amazon EFS     |   |     Amazon S3     |
                 | (Encrypted Storage |   |  (Private Media   |
                 |  for SQLite DB)    |   |     Bucket)       |
                 +--------------------+   +-------------------+
```

### Deploying the CloudFormation Stack

The CloudFormation template is located in `aws/dearly-cloudformation.yml`:

```bash
aws cloudformation create-stack \
  --stack-name dearly-production \
  --template-body file://aws/dearly-cloudformation.yml \
  --parameters \
      ParameterKey=EnvironmentName,ParameterValue=production \
      ParameterKey=ContainerImage,ParameterValue=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest \
      ParameterKey=JwtSecret,ParameterValue="dearly-jwt-prod-$(openssl rand -hex 16)" \
      ParameterKey=GeminiApiKey,ParameterValue="" \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION
```

Check status:
```bash
aws cloudformation describe-stacks \
  --stack-name dearly-production \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \
  --output text
```

---

## 4. Local Testing with Docker Compose

To test the container stack locally before deploying:

```bash
# Build and run with docker compose
docker compose up --build -d

# Verify health endpoint
curl http://localhost:5000/api/health

# Access in browser
open http://localhost:5000
```

---

## 5. Security & Privacy Audit

1. **Strict User Scoping**: All database queries enforce `WHERE user_id = ?`. Users cannot read, alter, or delete other users' entries, journals, goals, or AI reflections.
2. **Private Storage**: S3 media buckets block all public ACLs and enforce server-side AES256 encryption.
3. **No Unnecessary Log Leakage**: User journal text is never written to server console or CloudWatch logs.
4. **Data Sovereignty**: Complete offline export available as clean JSON or Obsidian-ready Markdown archive.
