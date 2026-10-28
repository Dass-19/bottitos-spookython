# 🚀 Despliegue de MantaZero en AWS ECS Fargate

**Fecha:** Octubre 27, 2026  
**Objetivo:** Obtener la dirección web (URL) pública de MantaZero  
**Tiempo estimado:** 45 minutos  
**Resultado final:** `http://{PUBLIC_IP}:8080`

---

## 📋 Requisitos Previos

- ✅ AWS CLI configurado con credenciales
- ✅ Docker instalado y corriendo
- ✅ Cuenta AWS con permisos en us-east-1
- ✅ Archivo `ecs-task-definition.json` en el repositorio
- ✅ Imagen Docker disponible localmente

---

## 🔧 Pasos de Despliegue

### **PASO 1: Hacer Login en AWS ECR**

**Descripción:** Autentica Docker con el repositorio ECR de Amazon.

```powershell
aws ecr get-login-password --region us-east-1 | `
  docker login --username AWS --password-stdin `
  028610956449.dkr.ecr.us-east-1.amazonaws.com
```

**Resultado esperado:**
```
Login Succeeded
```

---

### **PASO 2: Construir Imagen Docker**

**Descripción:** Crea la imagen Docker a partir del Dockerfile.

```powershell
cd "c:\Users\magno\Documents\GitHub\bottitos-spookython"

docker build -t 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest .
```

**Resultado esperado:**
```
Successfully tagged 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest
```

---

### **PASO 3: Enviar Imagen a ECR**

**Descripción:** Sube la imagen Docker al repositorio ECR.

```powershell
docker push 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest
```

**Resultado esperado:**
```
latest: digest: sha256:xxxxx size: xxxxx
```

---

### **PASO 4: Crear CloudWatch Logs Group**

**Descripción:** Crea el grupo de logs para que ECS almacene los logs de la aplicación.

```powershell
aws logs create-log-group `
  --log-group-name /ecs/mantazero `
  --region us-east-1 2>/dev/null | Out-Null
```

**Resultado esperado:**
```
(Sin error, o "ResourceAlreadyExistsException" si ya existe - ambos están bien)
```

---

### **PASO 5: Registrar Task Definition en ECS**

**Descripción:** Registra la tarea ECS Fargate con la configuración especificada.

```powershell
aws ecs register-task-definition `
  --cli-input-json file://ecs-task-definition.json `
  --region us-east-1
```

**Resultado esperado:**
```
{
  "taskDefinition": {
    "family": "mantazero",
    "revision": 1,
    "taskDefinitionArn": "arn:aws:ecs:us-east-1:028610956449:task-definition/mantazero:1"
  }
}
```

---

### **PASO 6: Crear ECS Cluster**

**Descripción:** Crea el cluster que hospedará los contenedores.

```powershell
aws ecs create-cluster `
  --cluster-name mantazero-cluster `
  --region us-east-1
```

**Resultado esperado:**
```
{
  "cluster": {
    "clusterName": "mantazero-cluster",
    "status": "ACTIVE"
  }
}
```

---

### **PASO 7: Obtener VPC y Subnet Predeterminadas**

**Descripción:** Recupera el VPC y subnet predeterminados para la red.

```powershell
$VPC_ID = aws ec2 describe-vpcs `
  --filters Name=isDefault,Values=true `
  --query 'Vpcs[0].VpcId' --output text --region us-east-1

Write-Host "VPC_ID obtenido: $VPC_ID"

$SUBNET_ID = aws ec2 describe-subnets `
  --filters Name=vpc-id,Values=$VPC_ID `
  --query 'Subnets[0].SubnetId' --output text --region us-east-1

Write-Host "SUBNET_ID obtenido: $SUBNET_ID"
```

**Resultado esperado:**
```
VPC_ID obtenido: vpc-xxxxx
SUBNET_ID obtenido: subnet-xxxxx
```

---

### **PASO 8: Crear Security Group**

**Descripción:** Crea el grupo de seguridad para controlar el tráfico de la aplicación.

```powershell
$SG_ID = aws ec2 create-security-group `
  --group-name mantazero-sg `
  --description "MantaZero ECS Security Group" `
  --vpc-id $VPC_ID `
  --region us-east-1 `
  --query 'GroupId' --output text

Write-Host "Security Group creado: $SG_ID"
```

**Resultado esperado:**
```
Security Group creado: sg-xxxxx
```

---

### **PASO 9: Autorizar Puerto 8080 en Security Group**

**Descripción:** Permite tráfico de entrada en el puerto 8080.

```powershell
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 8080 `
  --cidr 0.0.0.0/0 --region us-east-1

Write-Host "Puerto 8080 autorizado para todos ($SG_ID)"
```

**Resultado esperado:**
```
(Sin error - regla creada exitosamente)
Puerto 8080 autorizado para todos: sg-xxxxx
```

---

### **PASO 10: Mostrar Valores de Configuración**

**Descripción:** Muestra los valores necesarios para crear el servicio.

```powershell
Write-Host "=========================================="
Write-Host "Valores obtenidos para crear el servicio:"
Write-Host "=========================================="
Write-Host "VPC_ID: $VPC_ID"
Write-Host "SUBNET_ID: $SUBNET_ID"
Write-Host "SG_ID: $SG_ID"
Write-Host "=========================================="
```

---

### **PASO 11: Crear Servicio ECS**

**Descripción:** Crea el servicio ECS con la configuración Fargate.

```powershell
aws ecs create-service `
  --cluster mantazero-cluster `
  --service-name mantazero-service `
  --task-definition mantazero:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
  --region us-east-1

Write-Host "Servicio ECS creado exitosamente"
Write-Host "Esperando 60 segundos para que la tarea se inicie..."
```

**Resultado esperado:**
```
{
  "service": {
    "serviceName": "mantazero-service",
    "status": "ACTIVE",
    "desiredCount": 1,
    "runningCount": 0
  }
}
```

---

### **PASO 12: Esperar a que la Tarea se Inicie**

**Descripción:** Pausa 60 segundos para que ECS inicie la tarea.

```powershell
Start-Sleep -Seconds 60
Write-Host "✓ Tarea debería estar iniciándose..."
```

---

### **PASO 13: Obtener ARN de la Tarea**

**Descripción:** Recupera el identificador único de la tarea en ejecución.

```powershell
$TASK_ARN = aws ecs list-tasks `
  --cluster mantazero-cluster `
  --service-name mantazero-service `
  --query 'taskArns[0]' --output text --region us-east-1

Write-Host "Task ARN: $TASK_ARN"
```

**Resultado esperado:**
```
Task ARN: arn:aws:ecs:us-east-1:028610956449:task/mantazero-cluster/xxxxx
```

---

### **PASO 14: Obtener Detalles de la Tarea**

**Descripción:** Obtiene información de la tarea incluyendo el ID de la interfaz de red.

```powershell
$TASK_INFO = aws ecs describe-tasks `
  --cluster mantazero-cluster `
  --tasks $TASK_ARN `
  --region us-east-1 | ConvertFrom-Json

$ENI_ID = $TASK_INFO.tasks[0].attachments[0].details[0].value

Write-Host "ENI ID: $ENI_ID"
```

**Resultado esperado:**
```
ENI ID: eni-xxxxx
```

---

### **PASO 15: Obtener IP Pública de la Tarea**

**Descripción:** Recupera la dirección IP pública asignada a la tarea (ESTA ES TU URL).

```powershell
$PUBLIC_IP = aws ec2 describe-network-interfaces `
  --network-interface-ids $ENI_ID `
  --query 'NetworkInterfaces[0].Association.PublicIp' `
  --output text --region us-east-1

Write-Host "=========================================="
Write-Host "✓ IP PÚBLICA OBTENIDA:"
Write-Host "=========================================="
Write-Host $PUBLIC_IP
Write-Host "=========================================="
```

**Resultado esperado:**
```
========================================
✓ IP PÚBLICA OBTENIDA:
========================================
54.123.456.789
========================================
```

---

### **PASO 16: Mostrar Dirección Web Completa**

**Descripción:** Muestra la URL completa para acceder a MantaZero.

```powershell
$WEB_URL = "http://$PUBLIC_IP`:8080"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║                  🌐 MANTAZERO DESPLEGADO                    ║"
Write-Host "╠════════════════════════════════════════════════════════════╣"
Write-Host "║                                                             ║"
Write-Host "║  Dirección web:  $WEB_URL"
Write-Host "║                                                             ║"
Write-Host "║  API Health:     $WEB_URL/api/health"
Write-Host "║                                                             ║"
Write-Host "║  API Simulate:   POST $WEB_URL/api/simulate"
Write-Host "║                                                             ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""
```

---

### **PASO 17: Verificar Conectividad (Health Check)**

**Descripción:** Verifica que la aplicación está respondiendo.

```powershell
Write-Host "Probando conectividad..."
Write-Host "Esperando 10 segundos para que la aplicación esté lista..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "$WEB_URL/api/health" -ErrorAction Stop
    Write-Host "✓ Health Check exitoso:"
    Write-Host $response.Content
} catch {
    Write-Host "⚠ Health check no respondió aún (esperado si la aplicación está iniciando)"
    Write-Host "  Intenta nuevamente en 20 segundos"
}
```

---

### **PASO 18: Guardar Resultado en Archivo**

**Descripción:** Guarda la URL en un archivo para referencia futura.

```powershell
$RESULT_FILE = "c:\Users\magno\Documents\GitHub\bottitos-spookython\DEPLOYMENT_URL.txt"

@"
MantaZero Deployment URL
========================
Fecha de despliegue: $(Get-Date)
Cluster: mantazero-cluster
Servicio: mantazero-service
Región: us-east-1

Dirección web: $WEB_URL

URLs útiles:
- Web UI:     $WEB_URL
- Health:    $WEB_URL/api/health
- Simulate:  $WEB_URL/api/simulate (POST)

ARN de la tarea: $TASK_ARN
ENI ID: $ENI_ID
IP Pública: $PUBLIC_IP
"@ | Set-Content $RESULT_FILE

Write-Host "Resultado guardado en: $RESULT_FILE"
```

---

## 📊 Resumen de Comandos

| # | Paso | Comando | Tiempo |
|---|------|---------|--------|
| 1 | ECR Login | `aws ecr get-login-password ...` | 5s |
| 2 | Build Image | `docker build ...` | 30-60s |
| 3 | Push to ECR | `docker push ...` | 30-60s |
| 4 | CloudWatch Logs | `aws logs create-log-group ...` | 5s |
| 5 | Register Task | `aws ecs register-task-definition ...` | 5s |
| 6 | Create Cluster | `aws ecs create-cluster ...` | 10s |
| 7 | Get VPC | `aws ec2 describe-vpcs ...` | 5s |
| 8 | Create SG | `aws ec2 create-security-group ...` | 10s |
| 9 | Auth Port | `aws ec2 authorize-security-group-ingress ...` | 5s |
| 10 | Show Values | `Write-Host ...` | 1s |
| 11 | Create Service | `aws ecs create-service ...` | 5s |
| 12 | Wait | `Start-Sleep 60` | 60s |
| 13 | Get Task ARN | `aws ecs list-tasks ...` | 5s |
| 14 | Task Details | `aws ecs describe-tasks ...` | 5s |
| 15 | Get Public IP | `aws ec2 describe-network-interfaces ...` | 5s |
| 16 | Display URL | `Write-Host ...` | 1s |
| 17 | Health Check | `Invoke-WebRequest ...` | 15s |
| 18 | Save Result | `Set-Content ...` | 1s |
| **TOTAL** | | | **~3-4 minutos** |

---

## ✅ Checklist Pre-Despliegue

Antes de ejecutar, verifica:

- [ ] AWS CLI configurado: `aws sts get-caller-identity`
- [ ] Docker corriendo: `docker ps`
- [ ] Dockerfile existe: `test-path Dockerfile`
- [ ] ecs-task-definition.json existe: `test-path ecs-task-definition.json`
- [ ] Git cambios guardados: `git status`
- [ ] Estás en el directorio correcto: `pwd`

---

## 🚨 Solución de Problemas

### Error: "docker: command not found"
**Solución:** Instala Docker o reinicia tu sesión terminal

### Error: "Unable to locate credentials"
**Solución:** Configura AWS CLI: `aws configure`

### Error: "Task failed to start"
**Solución:** Revisa logs: `aws logs tail /ecs/mantazero --follow --region us-east-1`

### Error: "Cannot reach endpoint"
**Solución:** Espera 2-3 minutos más (ECS tardía en iniciar)

---

## 🎯 Próximos Pasos Después del Despliegue

1. ✅ Obtener URL (este documento)
2. ⏳ Probar `/api/health` en el navegador
3. ⏳ Probar `/api/simulate` con curl
4. ⏳ Actualizar README.md con la URL
5. ⏳ Hacer commit: `git commit -m "Add live ECS Fargate endpoint"`
6. ⏳ Enviar a Spookython

---

**Documento generado:** October 27, 2026  
**Autor:** Kiro AI  
**Estado:** Listo para ejecución
