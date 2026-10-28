# ECS Fargate Deployment Guide

This guide completes the deployment of MantaZero to AWS ECS Fargate. All Docker and infrastructure files are ready.

## Prerequisites

- AWS CLI configured with credentials in us-east-1 region
- Docker installed and running
- Account ID: `028610956449`
- ECR Repository: `028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero`

## Step 1: Build and Push Docker Image to ECR

### Option A: Using AWS CodeBuild (Recommended)

Create a CodeBuild project to build and push the image:

```bash
# 1. Create CloudWatch Logs group for ECS
aws logs create-log-group --log-group-name /ecs/mantazero --region us-east-1 2>/dev/null || true

# 2. Create CodeBuild project
aws codebuild create-project \
  --name mantazero-build \
  --source type=GITHUB,location=https://github.com/magnomp/bottitos-spookython \
  --artifacts type=NO_ARTIFACTS \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_MEDIUM \
  --service-role arn:aws:iam::028610956449:role/CodeBuildServiceRole \
  --region us-east-1

# 3. Start a build
aws codebuild start-build --project-name mantazero-build --region us-east-1
```

### Option B: Using Docker Locally

If Docker is running on your machine:

```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 028610956449.dkr.ecr.us-east-1.amazonaws.com

# 2. Build image
docker build -t 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest .

# 3. Push to ECR
docker push 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest

# 4. Verify push
aws ecr describe-images --repository-name mantazero --region us-east-1
```

### Option C: Using AWS CLI with Docker Build in CodeBuild (via GitHub Actions)

Push this workflow to `.github/workflows/ecr-push.yml`:

```yaml
name: Push to ECR

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::028610956449:role/GitHubActionsRole
          aws-region: us-east-1
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 028610956449.dkr.ecr.us-east-1.amazonaws.com
      
      - name: Build and push
        run: |
          docker build -t 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest .
          docker push 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest
```

## Step 2: Register ECS Task Definition

```bash
# Register the task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1
```

Expected output: Task definition ARN
```
arn:aws:ecs:us-east-1:028610956449:task-definition/mantazero:1
```

## Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name mantazero-cluster \
  --region us-east-1

# Expected output includes cluster ARN
```

## Step 4: Create VPC and Security Group (if not already done)

```bash
# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region us-east-1)

# Get default subnet
SUBNET_ID=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --query 'Subnets[0].SubnetId' --output text --region us-east-1)

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name mantazero-sg \
  --description "MantaZero ECS Security Group" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

# Allow inbound on port 8080
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

echo "VPC_ID=$VPC_ID"
echo "SUBNET_ID=$SUBNET_ID"
echo "SG_ID=$SG_ID"
```

Save the output values for Step 5.

## Step 5: Create ECS Service

```bash
# Set variables (from previous step output)
CLUSTER_NAME=mantazero-cluster
TASK_FAMILY=mantazero
TASK_REVISION=1
SERVICE_NAME=mantazero-service
DESIRED_COUNT=1
VPC_ID=vpc-xxxxx  # Replace with output from Step 4
SUBNET_ID=subnet-xxxxx  # Replace with output from Step 4
SG_ID=sg-xxxxx  # Replace with output from Step 4

# Create service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_FAMILY:$TASK_REVISION \
  --desired-count $DESIRED_COUNT \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --region us-east-1
```

## Step 6: Get Task Public IP

```bash
# List tasks
TASK_ARN=$(aws ecs list-tasks \
  --cluster mantazero-cluster \
  --service-name mantazero-service \
  --query 'taskArns[0]' \
  --output text \
  --region us-east-1)

# Get task details
aws ecs describe-tasks \
  --cluster mantazero-cluster \
  --tasks $TASK_ARN \
  --query 'tasks[0].attachments[?name==`ElasticNetworkInterface`].details[?name==`networkInterfaceId`].value' \
  --output text \
  --region us-east-1

# Get ENI details (replace eni-xxxxx with output above)
ENI_ID=eni-xxxxx
aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI_ID \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text \
  --region us-east-1
```

## Step 7: Test Deployment

```bash
# Replace PUBLIC_IP with the IP from Step 6
PUBLIC_IP=x.x.x.x

# Test health endpoint
curl http://$PUBLIC_IP:8080/api/health

# Run a simulation
curl -X POST http://$PUBLIC_IP:8080/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "initial_susceptible": 990,
    "initial_infected": 10,
    "initial_recovered": 0,
    "beta": 0.3,
    "gamma": 0.1,
    "days": 30
  }'
```

Expected response for health:
```json
{"status": "ok"}
```

## Step 8: Update README with Final URL

Once the service is running and tested, update README.md with the ECS endpoint:

```markdown
## Deployment

The application is deployed on AWS ECS Fargate:
- **API Endpoint:** http://{PUBLIC_IP}:8080
- **Health Check:** http://{PUBLIC_IP}:8080/api/health
```

## Cleanup (if needed)

```bash
# Delete service
aws ecs delete-service \
  --cluster mantazero-cluster \
  --service mantazero-service \
  --force \
  --region us-east-1

# Delete cluster
aws ecs delete-cluster \
  --cluster mantazero-cluster \
  --region us-east-1

# Delete security group
aws ec2 delete-security-group \
  --group-id sg-xxxxx \
  --region us-east-1
```

## Cost Management

Create a CloudWatch Budget alert:

```bash
aws budgets create-budget \
  --account-id 028610956449 \
  --budget file:///dev/stdin \
  --notifications-with-subscribers file:///dev/stdin << 'EOF'
{
  "BudgetName": "MantaZero-ECS",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
EOF
```

## Troubleshooting

### Task not starting
```bash
# Check task logs
aws logs tail /ecs/mantazero --follow --region us-east-1
```

### Image not found in ECR
```bash
# List images
aws ecr list-images --repository-name mantazero --region us-east-1
```

### Cannot reach endpoint
- Verify security group allows port 8080 from 0.0.0.0/0
- Verify task has public IP assigned (assignPublicIp=ENABLED)
- Check ECS task status in console
- Review CloudWatch logs in /ecs/mantazero log group

## Next: Submission to Spookython

Once deployment is confirmed working:

1. **Update README.md** with final ECS endpoint URL
2. **Commit final changes:**
   ```bash
   git add README.md
   git commit -m "Update with final ECS Fargate endpoint"
   git push origin main
   ```
3. **Verify all Spookython Track B requirements are met:**
   - ✅ Deployed on AWS (ECS Fargate)
   - ✅ Docker containerized
   - ✅ Full documentation (README + architecture + costs)
   - ✅ Health check endpoint
   - ✅ Simulation API working
   - ✅ Open source license (MIT)
   - ✅ Git history with meaningful commits
4. **Submit repository link to Spookython platform before deadline**
