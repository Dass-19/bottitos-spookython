# MantaZero ECS Deployment Script - Version Corregida

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║         MantaZero - ECS Fargate Deployment                 ║"
Write-Host "║              Spookython 2026 Track B                       ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

$CLUSTER_NAME = "mantazero-cluster"
$SERVICE_NAME = "mantazero-service"
$TASK_FAMILY = "mantazero"
$REGION = "us-east-1"

Write-Host "✓ PASO 4: CloudWatch Logs group"
aws logs create-log-group --log-group-name /ecs/mantazero --region $REGION 2>/dev/null
Write-Host "✓ PASO 5: Task Definition registrada"
$taskDef = aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region $REGION | ConvertFrom-Json
$TASK_REVISION = $taskDef.taskDefinition.revision

Write-Host "✓ PASO 6: ECS Cluster creado"
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION 2>/dev/null

Write-Host "✓ PASO 7: Obteniendo VPC y Subnet..."
$VPC_ID = aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region $REGION
$SUBNETS = aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --query 'Subnets[*].SubnetId' --output text --region $REGION
$SUBNET_ID = ($SUBNETS -split '\s+')[0]

Write-Host "  VPC: $VPC_ID"
Write-Host "  Subnet: $SUBNET_ID"

Write-Host "✓ PASO 8-9: Security Group con puerto 8080"
$SG_ID = aws ec2 create-security-group --group-name mantazero-sg --description "MantaZero" --vpc-id $VPC_ID --region $REGION --query 'GroupId' --output text 2>/dev/null
if ([string]::IsNullOrEmpty($SG_ID)) {
    $SG_ID = aws ec2 describe-security-groups --filters Name=group-name,Values=mantazero-sg Name=vpc-id,Values=$VPC_ID --query 'SecurityGroups[0].GroupId' --output text --region $REGION
}
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $REGION 2>/dev/null
Write-Host "  SG: $SG_ID"

Write-Host "✓ PASO 11: Creando ECS Service..."
aws ecs create-service `
  --cluster $CLUSTER_NAME `
  --service-name $SERVICE_NAME `
  --task-definition "${TASK_FAMILY}:${TASK_REVISION}" `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
  --region $REGION 2>/dev/null

Write-Host "✓ Esperando 90 segundos a que la tarea se inicie..."
for ($i = 90; $i -gt 0; $i--) {
    Write-Host -NoNewline "`r   $i segundos"
    Start-Sleep -Seconds 1
}
Write-Host "`n"

Write-Host "✓ Obteniendo Task ARN..."
$TASK_ARN = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --query 'taskArns[0]' --output text --region $REGION

if ([string]::IsNullOrEmpty($TASK_ARN) -or $TASK_ARN -eq "None") {
    Write-Host "⚠ Task no está corriendo aún. Intenta en 30 segundos"
    exit 1
}

Write-Host "✓ Obteniendo detalles de la tarea..."
$TASK_INFO = aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN --region $REGION | ConvertFrom-Json
$ENI_ID = $TASK_INFO.tasks[0].attachments[0].details[0].value

Write-Host "✓ Obteniendo IP pública..."
$PUBLIC_IP = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region $REGION

if ([string]::IsNullOrEmpty($PUBLIC_IP) -or $PUBLIC_IP -eq "None") {
    Write-Host "⚠ IP pública no disponible aún. Intenta en 60 segundos"
    exit 1
}

$WEB_URL = "http://$PUBLIC_IP`:8080"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║                🎉 ¡DESPLIEGUE EXITOSO!                     ║"
Write-Host "╠════════════════════════════════════════════════════════════╣"
Write-Host "║                                                             ║"
Write-Host "║  🌐 DIRECCIÓN WEB:                                         ║"
Write-Host "║  $WEB_URL"
Write-Host "║                                                             ║"
Write-Host "║  📊 API Endpoints:                                         ║"
Write-Host "║  Health:  $WEB_URL/api/health"
Write-Host "║  Simulate: POST $WEB_URL/api/simulate"
Write-Host "║                                                             ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Guardar resultado
$RESULT = @"
MANTAZERO DEPLOYMENT
====================
Dirección web: $WEB_URL
Health: $WEB_URL/api/health
Simulate: $WEB_URL/api/simulate

Detalles:
- Cluster: $CLUSTER_NAME
- Service: $SERVICE_NAME
- Task: $TASK_FAMILY (rev. $TASK_REVISION)
- IP: $PUBLIC_IP
- Region: $REGION
"@

Set-Content -Path "DEPLOYMENT_URL.txt" -Value $RESULT
Write-Host "✓ Resultado guardado en DEPLOYMENT_URL.txt"
Write-Host ""
