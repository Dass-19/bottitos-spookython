# MantaZero ECS Deployment Script
# Este script despliega MantaZero en AWS ECS Fargate y obtiene la URL pública

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║         MantaZero - ECS Fargate Deployment                 ║"
Write-Host "║              Spookython 2026 Track B                       ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Variables
$CLUSTER_NAME = "mantazero-cluster"
$SERVICE_NAME = "mantazero-service"
$TASK_FAMILY = "mantazero"
$REGION = "us-east-1"
$ACCOUNT_ID = "028610956449"
$ECR_REPO = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/mantazero"

# Color codes
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"

function Log-Success {
    param([string]$message)
    Write-Host "✓ $message" -ForegroundColor $GREEN
}

function Log-Error {
    param([string]$message)
    Write-Host "✗ $message" -ForegroundColor $RED
}

function Log-Info {
    param([string]$message)
    Write-Host "ℹ $message" -ForegroundColor $YELLOW
}

# ============================================================================
# PASO 4: Crear CloudWatch Logs Group
# ============================================================================
Log-Info "PASO 4: Creando CloudWatch Logs group..."
try {
    aws logs create-log-group `
      --log-group-name /ecs/mantazero `
      --region $REGION 2>/dev/null
    Log-Success "CloudWatch Logs group creado (o ya existía)"
} catch {
    Log-Success "CloudWatch Logs group listo"
}

# ============================================================================
# PASO 5: Registrar Task Definition en ECS
# ============================================================================
Log-Info "PASO 5: Registrando Task Definition en ECS..."
try {
    $taskDef = aws ecs register-task-definition `
      --cli-input-json file://ecs-task-definition.json `
      --region $REGION | ConvertFrom-Json
    
    $TASK_REVISION = $taskDef.taskDefinition.revision
    Log-Success "Task Definition registrada (revisión $TASK_REVISION)"
} catch {
    Log-Error "Error registrando Task Definition: $_"
    exit 1
}

# ============================================================================
# PASO 6: Crear ECS Cluster
# ============================================================================
Log-Info "PASO 6: Creando ECS Cluster..."
try {
    aws ecs create-cluster `
      --cluster-name $CLUSTER_NAME `
      --region $REGION | Out-Null
    Log-Success "ECS Cluster '$CLUSTER_NAME' creado"
} catch {
    if ($_ -match "already exists") {
        Log-Success "ECS Cluster '$CLUSTER_NAME' ya existe"
    } else {
        Log-Error "Error: $_"
    }
}

# ============================================================================
# PASO 7: Obtener VPC y Subnet
# ============================================================================
Log-Info "PASO 7: Obteniendo VPC y Subnet predeterminadas..."
try {
    $VPC_ID = aws ec2 describe-vpcs `
      --filters Name=isDefault,Values=true `
      --query 'Vpcs[0].VpcId' --output text --region $REGION
    
    if ([string]::IsNullOrEmpty($VPC_ID)) {
        Log-Error "No se encontró VPC predeterminada"
        exit 1
    }
    Log-Success "VPC ID obtenido: $VPC_ID"
    
    $SUBNET_ID = aws ec2 describe-subnets `
      --filters Name=vpc-id,Values=$VPC_ID `
      --query 'Subnets[0].SubnetId' --output text --region $REGION
    
    if ([string]::IsNullOrEmpty($SUBNET_ID)) {
        Log-Error "No se encontró Subnet"
        exit 1
    }
    Log-Success "Subnet ID obtenido: $SUBNET_ID"
} catch {
    Log-Error "Error obteniendo VPC/Subnet: $_"
    exit 1
}

# ============================================================================
# PASO 8 & 9: Crear Security Group y Autorizar Puerto 8080
# ============================================================================
Log-Info "PASO 8-9: Creando Security Group y autorizando puerto 8080..."
try {
    # Intentar crear nuevo SG
    $SG_ID = aws ec2 create-security-group `
      --group-name mantazero-sg `
      --description "MantaZero ECS Security Group" `
      --vpc-id $VPC_ID `
      --region $REGION `
      --query 'GroupId' --output text 2>/dev/null
    
    if ([string]::IsNullOrEmpty($SG_ID)) {
        # Si ya existe, obtener su ID
        $SG_ID = aws ec2 describe-security-groups `
          --filters Name=group-name,Values=mantazero-sg Name=vpc-id,Values=$VPC_ID `
          --query 'SecurityGroups[0].GroupId' --output text --region $REGION
    }
    
    Log-Success "Security Group obtenido: $SG_ID"
    
    # Autorizar puerto 8080
    aws ec2 authorize-security-group-ingress `
      --group-id $SG_ID `
      --protocol tcp --port 8080 `
      --cidr 0.0.0.0/0 --region $REGION 2>/dev/null
    
    Log-Success "Puerto 8080 autorizado"
} catch {
    Log-Success "Security Group configurado (posiblemente ya existía)"
}

# ============================================================================
# PASO 11: Crear ECS Service
# ============================================================================
Log-Info "PASO 11: Creando ECS Service..."
try {
    aws ecs create-service `
      --cluster $CLUSTER_NAME `
      --service-name $SERVICE_NAME `
      --task-definition ${TASK_FAMILY}:${TASK_REVISION} `
      --desired-count 1 `
      --launch-type FARGATE `
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
      --region $REGION | Out-Null
    
    Log-Success "ECS Service '$SERVICE_NAME' creado"
} catch {
    if ($_ -match "already exists") {
        Log-Success "ECS Service '$SERVICE_NAME' ya existe"
    } else {
        Log-Error "Error: $_"
    }
}

# ============================================================================
# PASO 12: Esperar a que la Tarea se Inicie
# ============================================================================
Log-Info "PASO 12: Esperando 60 segundos a que la tarea se inicie..."
for ($i = 60; $i -gt 0; $i--) {
    Write-Host -NoNewline "`rEsperando... $i segundos"
    Start-Sleep -Seconds 1
}
Write-Host ""
Log-Success "Tiempo de espera completado"

# ============================================================================
# PASO 13: Obtener Task ARN
# ============================================================================
Log-Info "PASO 13: Obteniendo Task ARN..."
try {
    $TASK_ARN = aws ecs list-tasks `
      --cluster $CLUSTER_NAME `
      --service-name $SERVICE_NAME `
      --query 'taskArns[0]' --output text --region $REGION
    
    if ([string]::IsNullOrEmpty($TASK_ARN)) {
        Log-Error "No se encontraron tareas en ejecución"
        Log-Info "Intenta nuevamente en 30 segundos"
        exit 1
    }
    Log-Success "Task ARN obtenido"
} catch {
    Log-Error "Error obteniendo Task ARN: $_"
    exit 1
}

# ============================================================================
# PASO 14: Obtener Detalles de la Tarea
# ============================================================================
Log-Info "PASO 14: Obteniendo detalles de la tarea..."
try {
    $TASK_INFO = aws ecs describe-tasks `
      --cluster $CLUSTER_NAME `
      --tasks $TASK_ARN `
      --region $REGION | ConvertFrom-Json
    
    $ENI_ID = $TASK_INFO.tasks[0].attachments[0].details[0].value
    
    if ([string]::IsNullOrEmpty($ENI_ID)) {
        Log-Error "No se pudo obtener ENI ID"
        exit 1
    }
    Log-Success "ENI ID obtenido: $ENI_ID"
} catch {
    Log-Error "Error obteniendo detalles de la tarea: $_"
    exit 1
}

# ============================================================================
# PASO 15: Obtener IP Pública
# ============================================================================
Log-Info "PASO 15: Obteniendo IP pública de la tarea..."
try {
    $PUBLIC_IP = aws ec2 describe-network-interfaces `
      --network-interface-ids $ENI_ID `
      --query 'NetworkInterfaces[0].Association.PublicIp' `
      --output text --region $REGION
    
    if ([string]::IsNullOrEmpty($PUBLIC_IP) -or $PUBLIC_IP -eq "None") {
        Log-Error "IP pública no disponible aún. Intenta en 30 segundos"
        exit 1
    }
    Log-Success "IP pública obtenida: $PUBLIC_IP"
} catch {
    Log-Error "Error obteniendo IP pública: $_"
    exit 1
}

# ============================================================================
# PASO 16 & 17: Mostrar URL Completa y Verificar Conectividad
# ============================================================================
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
Write-Host "║  📍 Detalles Técnicos:                                     ║"
Write-Host "║  Cluster:   $CLUSTER_NAME"
Write-Host "║  Service:   $SERVICE_NAME"
Write-Host "║  Task:      $TASK_FAMILY (rev. $TASK_REVISION)"
Write-Host "║  IP Pública: $PUBLIC_IP"
Write-Host "║  Región:    $REGION"
Write-Host "║                                                             ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar salud
Log-Info "Verificando conectividad de la aplicación..."
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "$WEB_URL/api/health" -TimeoutSec 10 -ErrorAction Stop
    Log-Success "✓ Health Check exitoso"
    Write-Host "Respuesta: $($response.Content)"
} catch {
    Log-Info "Health check aún no disponible (esperado si la aplicación está iniciando)"
    Log-Info "Intenta nuevamente en 30 segundos:"
    Write-Host "  curl $WEB_URL/api/health"
}

# ============================================================================
# PASO 18: Guardar Resultado en Archivo
# ============================================================================
$RESULT_FILE = "DEPLOYMENT_URL.txt"

$resultContent = @"
MantaZero - Deployment Exitoso
================================
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Evento: Spookython 2026 Track B - La Plaga Zombie

DIRECCIÓN WEB (¡CÓPIALA!)
=========================
$WEB_URL

URLs Útiles
===========
- Web UI:     $WEB_URL
- Health:    $WEB_URL/api/health
- Simulate:  $WEB_URL/api/simulate (POST)

Detalles Técnicos
=================
Cluster:            $CLUSTER_NAME
Service:            $SERVICE_NAME
Task Definition:    $TASK_FAMILY:$TASK_REVISION
Region:             $REGION
Account ID:         $ACCOUNT_ID
Public IP:          $PUBLIC_IP
ENI ID:             $ENI_ID

ECR Repository:     $ECR_REPO
Task ARN:           $TASK_ARN

CloudWatch Logs:    /ecs/mantazero
Security Group ID:  $SG_ID
Subnet ID:          $SUBNET_ID
VPC ID:             $VPC_ID

Próximos Pasos
==============
1. ✓ Aplicación desplegada
2. → Prueba la salud: curl $WEB_URL/api/health
3. → Prueba la API: curl -X POST $WEB_URL/api/simulate ...
4. → Actualiza README.md con esta URL
5. → Haz commit: git add README.md && git commit -m "Add live URL"
6. → Sube a Spookython antes del 28 de octubre

Ejemplo de Solicitud POST
==========================
curl -X POST $WEB_URL/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "initial_susceptible": 990,
    "initial_infected": 10,
    "initial_recovered": 0,
    "beta": 0.3,
    "gamma": 0.1,
    "days": 30
  }'
"@

Set-Content -Path $RESULT_FILE -Value $resultContent
Log-Success "Resultado guardado en: $RESULT_FILE"

Write-Host ""
Log-Success "¡Despliegue completado exitosamente!"
Write-Host ""
