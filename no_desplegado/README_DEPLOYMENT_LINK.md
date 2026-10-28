# 🌐 MantaZero - Obtener la Dirección Web

**Estado:** Scripts de despliegue creados y listos. Red AWS temporalmente inaccesible.

---

## Opción 1: Usar GitHub Actions (RECOMENDADO) ✅

GitHub ejecutará automáticamente el despliegue a ECS cuando hagas `git push`.

### Pasos:

1. **Asegúrate que tienes permisos OIDC en AWS:**
   - Necesitas que alguien con acceso a AWS cree un rol `GitHubActionsRole`
   - O ejecuta manualmente los comandos de la Opción 3

2. **Push del código:**
   ```powershell
   git push origin main
   ```

3. **Ver el despliegue en acción:**
   - Ve a tu repo en GitHub
   - Tab: **Actions**
   - Verás el workflow "Build and Push to ECR" corriendo
   - Espera ~5 minutos

4. **Obtener la URL:**
   Una vez completado el workflow:
   ```powershell
   # En AWS Console
   # 1. Ir a ECS → Clusters → mantazero-cluster
   # 2. Ir a Services → mantazero-service
   # 3. Ver las Tasks corriendo
   # 4. Click en la Task → Ver IP pública en "Network"
   
   # O en PowerShell:
   $TASK_ARN = aws ecs list-tasks --cluster mantazero-cluster --service-name mantazero-service --query 'taskArns[0]' --output text --region us-east-1
   
   $ENI_ID = aws ecs describe-tasks --cluster mantazero-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[0].value' --output text --region us-east-1
   
   aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1
   ```

---

## Opción 2: Ejecutar Script PowerShell Manualmente ✅

Cuando la conectividad AWS se restablezca:

```powershell
cd "c:\Users\magno\Documents\GitHub\bottitos-spookython"
.\deploy-ecs-fixed.ps1
```

**El script:**
- ✅ Crea CloudWatch Logs
- ✅ Registra la Task Definition en ECS
- ✅ Crea el Cluster ECS
- ✅ Configura VPC y Security Group
- ✅ Crea el Service ECS
- ✅ Espera 90 segundos
- ✅ Obtiene la IP pública
- ✅ Guarda la URL en `DEPLOYMENT_URL.txt`

**Resultado esperado:**
```
╔════════════════════════════════════════════════════════════╗
║                🎉 ¡DESPLIEGUE EXITOSO!                     ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  🌐 DIRECCIÓN WEB:                                         ║
║  http://54.123.456.789:8080
║                                                             ║
║  📊 API Endpoints:                                         ║
║  Health:    http://54.123.456.789:8080/api/health
║  Simulate:  POST http://54.123.456.789:8080/api/simulate
║                                                             ║
╚════════════════════════════════════════════════════════════╝
```

---

## Opción 3: Comandos Paso a Paso Directos ✅

Si prefieres ejecutar cada paso manualmente:

### 1. Crear CloudWatch Logs
```powershell
aws logs create-log-group --log-group-name /ecs/mantazero --region us-east-1
```

### 2. Registrar Task Definition
```powershell
aws ecs register-task-definition `
  --cli-input-json file://ecs-task-definition.json `
  --region us-east-1
```

### 3. Crear Cluster
```powershell
aws ecs create-cluster `
  --cluster-name mantazero-cluster `
  --region us-east-1
```

### 4. Obtener IDs de Red
```powershell
$VPC_ID = "vpc-0f9ebc7ece6d2a837"
$SUBNET_ID = "subnet-0330e33fb231d099d"  # Usa cualquier subnet disponible
$SG_ID = "sg-xxxxx"  # O crea uno nuevo
```

### 5. Crear Security Group (si no existe)
```powershell
$SG_ID = aws ec2 create-security-group `
  --group-name mantazero-sg `
  --description "MantaZero" `
  --vpc-id $VPC_ID `
  --region us-east-1 `
  --query 'GroupId' --output text

# Permitir puerto 8080
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 8080 `
  --cidr 0.0.0.0/0 --region us-east-1
```

### 6. Crear Service ECS
```powershell
aws ecs create-service `
  --cluster mantazero-cluster `
  --service-name mantazero-service `
  --task-definition mantazero:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
  --region us-east-1
```

### 7. Esperar a que la tarea se inicie
```powershell
Start-Sleep -Seconds 90
```

### 8. Obtener el Task ARN
```powershell
$TASK_ARN = aws ecs list-tasks `
  --cluster mantazero-cluster `
  --service-name mantazero-service `
  --query 'taskArns[0]' --output text --region us-east-1
```

### 9. Obtener detalles de la tarea
```powershell
$TASK_INFO = aws ecs describe-tasks `
  --cluster mantazero-cluster `
  --tasks $TASK_ARN `
  --region us-east-1 | ConvertFrom-Json

$ENI_ID = $TASK_INFO.tasks[0].attachments[0].details[0].value
```

### 10. Obtener IP pública (¡LA URL!)
```powershell
$PUBLIC_IP = aws ec2 describe-network-interfaces `
  --network-interface-ids $ENI_ID `
  --query 'NetworkInterfaces[0].Association.PublicIp' `
  --output text --region us-east-1

Write-Host "Tu dirección web es: http://$PUBLIC_IP:8080"
```

---

## Archivos Creados

- ✅ **DEPLOY_TO_ECS.md** - Documentación completa del despliegue (18 pasos)
- ✅ **deploy-ecs.ps1** - Script PowerShell original
- ✅ **deploy-ecs-fixed.ps1** - Script PowerShell optimizado
- ✅ **.github/workflows/deploy-to-ecr.yml** - GitHub Actions workflow
- ✅ **ecs-task-definition.json** - Configuración de la tarea ECS
- ✅ **buildspec.yml** - Configuración de AWS CodeBuild

---

## Próximos Pasos Después de Obtener la URL

Una vez tengas la dirección web (ej: `http://54.123.456.789:8080`):

### 1. Probar la aplicación
```powershell
# Health check
curl http://{IP}:8080/api/health

# Simular epidemia
curl -X POST http://{IP}:8080/api/simulate `
  -H "Content-Type: application/json" `
  -d '{
    "initial_susceptible": 990,
    "initial_infected": 10,
    "initial_recovered": 0,
    "beta": 0.3,
    "gamma": 0.1,
    "days": 30
  }'
```

### 2. Actualizar README.md
Abre `README.md` y agrega al inicio:

```markdown
## 🚀 Despliegue en Vivo

**La aplicación está desplegada en AWS ECS Fargate:**

- **Dirección web:** http://{YOUR_IP}:8080
- **Health check:** http://{YOUR_IP}:8080/api/health
- **Simulate API:** POST http://{YOUR_IP}:8080/api/simulate

*Reemplaza {YOUR_IP} con la IP pública obtenida*
```

### 3. Hacer commit
```powershell
git add README.md
git commit -m "Add live ECS Fargate endpoint for Spookython 2026"
git push origin main
```

### 4. Enviar a Spookython
- Ve a la plataforma Spookython 2026
- Track B: La Plaga Zombie
- Proporciona:
  - URL del repositorio: https://github.com/magnomp/bottitos-spookython
  - URL de la aplicación: http://{YOUR_IP}:8080

---

## Estado del Despliegue

| Componente | Estado |
|-----------|--------|
| Dockerfile | ✅ Listo |
| Task Definition | ✅ Listo |
| Security Group | ✅ Listo |
| buildspec.yml | ✅ Listo |
| GitHub Actions Workflow | ✅ Listo |
| PowerShell Scripts | ✅ Listo |
| Documentación | ✅ Completa |
| **Despliegue a ECS** | ⏳ Espera conectividad AWS |

---

## Solución de Problemas

### "Connect timeout on endpoint URL"
- **Causa:** Problema de red temporal
- **Solución:** Intenta en 5-10 minutos

### "Service not found"
- **Causa:** El servicio tardó más de 90 segundos en iniciarse
- **Solución:** Espera 2-3 minutos más e intenta obtener el Task ARN nuevamente

### "IP pública es 'None'"
- **Causa:** La tarea está iniciando aún
- **Solución:** Espera 3-5 minutos más

### "Task failed to start"
- **Solución:** Revisa los logs de ECS en AWS Console

---

## Archivos de Despliegue

```
bottitos-spookython/
├── DEPLOY_TO_ECS.md                    ← Lee esto para detalles
├── deploy-ecs.ps1                      ← Script original
├── deploy-ecs-fixed.ps1                ← Script mejorado
├── .github/workflows/deploy-to-ecr.yml ← GitHub Actions
├── ecs-task-definition.json            ← ECS config
├── buildspec.yml                       ← CodeBuild config
└── DEPLOYMENT_URL.txt                  ← Se genera cuando ejecutas script
```

---

**Cuando la conectividad se restablezca o ejecutes manualmente, la dirección web aparecerá automáticamente.**

**¿Necesitas ayuda?** Verifica que:
- ✅ AWS CLI está configurado: `aws sts get-caller-identity`
- ✅ Tienes permisos en us-east-1
- ✅ Docker está corriendo (para GitHub Actions)
- ✅ El repositorio está sincronizado: `git push origin main`
