# 🌐 OBTENER TU URL AHORA - INSTRUCCIONES DIRECTAS

**Estado:** ECS Service está creado y esperando. Solo falta pushear la imagen Docker.

---

## ✅ Lo Que Ya Hemos Hecho:

- ✅ Cluster ECS creado: `mantazero-cluster`
- ✅ Service ECS creado: `mantazero-service`  
- ✅ Security Group creado: `sg-0f28593e6c8063193`
- ✅ Subnet configurado: `subnet-0330e33fb231d099d`
- ✅ VPC: `vpc-0f9ebc7ece6d2a837`

---

## ⏳ Lo Que Falta:

**SOLO 1 COSA:** Construir la imagen Docker y enviarla a ECR

### Opción A: Usando Docker Desktop (SI FUNCIONA)

```powershell
cd "c:\Users\magno\Documents\GitHub\bottitos-spookython"

# 1. Login a ECR
aws ecr get-login-password --region us-east-1 | `
  docker login --username AWS --password-stdin `
  028610956449.dkr.ecr.us-east-1.amazonaws.com

# 2. Construir imagen (5 minutos)
docker build -t 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest .

# 3. Pushear a ECR (2 minutos)
docker push 028610956449.dkr.ecr.us-east-1.amazonaws.com/mantazero:latest

# 4. Obtener URL (cuando esté listo en 2-3 minutos)
$TASK_ARN = aws ecs list-tasks --cluster mantazero-cluster --query 'taskArns[0]' --output text --region us-east-1
$ENI_ID = aws ecs describe-tasks --cluster mantazero-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[0].value' --output text --region us-east-1
$PUBLIC_IP = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1
Write-Host "Tu URL es: http://$PUBLIC_IP:8080"
```

---

### Opción B: Usando AWS CodeBuild (SIN Local Docker)

CodeBuild es parte de AWS - construye la imagen en el cloud, no en tu máquina.

```powershell
# 1. Crear proyecto CodeBuild
aws codebuild create-project `
  --name mantazero-build `
  --source type=GITHUB,location=https://github.com/tu-usuario/bottitos-spookython `
  --artifacts type=NO_ARTIFACTS `
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_MEDIUM `
  --service-role arn:aws:iam::028610956449:role/CodeBuildServiceRole `
  --region us-east-1

# 2. Iniciar build
aws codebuild start-build --project-name mantazero-build --region us-east-1

# 3. Monitorear (esperar 10-15 minutos)
aws codebuild batch-get-builds --ids <BUILD_ID> --region us-east-1

# 4. Cuando esté listo, obtener URL (ver arriba)
```

---

### Opción C: Usar GitHub Actions (MÁS RECOMENDADO)

Simplemente haz un push y GitHub lo construye automáticamente:

```powershell
cd "c:\Users\magno\Documents\GitHub\bottitos-spookython"

# 1. Push del código
git push origin main

# 2. Ir a GitHub Actions
# https://github.com/tu-usuario/bottitos-spookython/actions

# 3. Esperar ~10 minutos a que termine "Build and Push to ECR"

# 4. Luego ejecutar:
$TASK_ARN = aws ecs list-tasks --cluster mantazero-cluster --query 'taskArns[0]' --output text --region us-east-1
$ENI_ID = aws ecs describe-tasks --cluster mantazero-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[0].value' --output text --region us-east-1
$PUBLIC_IP = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1
Write-Host "Tu URL es: http://$PUBLIC_IP:8080"
```

---

## 🎯 Mi Recomendación

**Opción C (GitHub Actions)** - Es la más fácil:

1. Solo haces `git push`
2. GitHub construye automáticamente
3. La imagen se sube a ECR sola
4. Las tareas se inician automáticamente
5. Luego solo ejecutas 4 comandos para obtener la IP

---

## ⚡ Pasos Inmediatos

### SI ELIGES OPCIÓN C (RECOMENDADO):

```powershell
# 1. Ir al directorio
cd "c:\Users\magno\Documents\GitHub\bottitos-spookython"

# 2. Push
git push origin main

# 3. Esperar 10 minutos
# Ir a: https://github.com/Dass-19/bottitos-spookython/actions
# Ver el workflow "Build and Push to ECR"

# 4. Cuando termine (status verde ✅):
# Ejecutar en PowerShell:

$TASK_ARN = aws ecs list-tasks --cluster mantazero-cluster --query 'taskArns[0]' --output text --region us-east-1
Write-Host "Task ARN: $TASK_ARN"

if (-not [string]::IsNullOrEmpty($TASK_ARN) -and $TASK_ARN -ne "None") {
    $ENI_ID = aws ecs describe-tasks --cluster mantazero-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[0].value' --output text --region us-east-1
    Write-Host "ENI ID: $ENI_ID"
    
    if (-not [string]::IsNullOrEmpty($ENI_ID) -and $ENI_ID -ne "None") {
        $PUBLIC_IP = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region us-east-1
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════"
        Write-Host "🌐 TU DIRECCIÓN WEB ES:"
        Write-Host "http://$PUBLIC_IP:8080"
        Write-Host "════════════════════════════════════════════════════"
        Write-Host ""
        Write-Host "✓ Health check:  http://$PUBLIC_IP:8080/api/health"
        Write-Host "✓ API: POST      http://$PUBLIC_IP:8080/api/simulate"
    } else {
        Write-Host "Aún no hay ENI. Espera 1 minuto más e intenta nuevamente."
    }
} else {
    Write-Host "Aún no hay tareas. La imagen podría estar construyéndose."
    Write-Host "Intenta en 2 minutos"
}
```

---

## 📋 Timeline Estimado

| Paso | Tiempo | Acciones |
|------|--------|----------|
| 1 | 0 min | git push origin main |
| 2 | 2-10 min | Imagen Docker se construye en GitHub |
| 3 | 5-10 min | Imagen se sube a ECR |
| 4 | 2-5 min | ECS inicia la tarea |
| 5 | 1 min | Ejecutas comandos para obtener IP |
| **Total** | **20-30 min** | **¡Tienes tu URL!** |

---

## ✅ Una Vez Tengas la URL

1. **Copiar la URL** (ej: `http://54.123.456.789:8080`)

2. **Editar README.md:**
   ```markdown
   ## 🌐 Despliegue en Vivo
   
   Dirección web: http://54.123.456.789:8080
   ```

3. **Commit:**
   ```powershell
   git add README.md
   git commit -m "Add live ECS endpoint"
   git push origin main
   ```

4. **Enviar a Spookython:**
   - Plataforma Spookython 2026
   - Track B: La Plaga Zombie
   - URL del repo: https://github.com/tu-usuario/bottitos-spookython
   - URL en vivo: http://54.123.456.789:8080

---

## 🆘 Si Algo Falla

### GitHub Actions no termina en 15 minutos
- Los builds a veces tardan más
- No interrumpas, espera
- Revisa los logs en Actions

### Aún no hay tareas después de 20 minutos
- Revisa CloudWatch logs: https://console.aws.amazon.com/cloudwatch/logs/
- Busca: `/ecs/mantazero`
- Verás el error de por qué no inicia

### Imagen no llega a ECR
- Revisa el workflow en GitHub Actions
- Verifica que tienes credenciales AWS configuradas
- Intenta Opción A (Docker local) en su lugar

---

## 📞 Contacto Rápido

**Si necesitas ayuda:**
- Revisa DEPLOY_TO_ECS.md (guía completa)
- Revisa README_DEPLOYMENT_LINK.md (todas las opciones)
- Ejecuta `aws ecs describe-services --cluster mantazero-cluster --services mantazero-service --region us-east-1` para ver el estado

---

**¿Cuál opción vas a usar? A, B, o C?**

**Mi recomendación: Opción C (GitHub Actions) - Solo haz `git push` y espera.**
