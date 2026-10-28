# 📦 Carpeta: no_desplegado

Esta carpeta contiene todos los archivos y configuraciones que **NO se utilizan en el despliegue actual de AWS ECS Fargate**.

## 🎯 Archivos no desplegados

### Configuraciones de otras plataformas:
- `.ebextensions/` - Configuración para AWS Elastic Beanstalk (no usado)
- `.elasticbeanstalk/` - Configuración de Elastic Beanstalk (no usado)
- `.platform/` - Configuración de plataformas legacy (no usado)
- `Procfile` - Configuración para Heroku (no usado)
- `vercel.json` - Configuración para Vercel (no usado)

### Archivos de despliegue legacy:
- `deploy-ecs.ps1` - Script antiguo de despliegue a ECS
- `deploy-ecs-fixed.ps1` - Script de despliegue corregido
- `DEPLOYMENT.md` - Documentación de despliegue anterior
- `DEPLOY_TO_ECS.md` - Guía de despliegue a ECS (reemplazada)
- `ECS_DEPLOYMENT.md` - Documentación de ECS antigua
- `ecs-task-definition.json` - Definición de tarea anterior

### Documentación y reports:
- `FINAL_DEPLOYMENT_RESULT.md` - Reporte final de despliegue
- `SPOOKYTHON_SUBMISSION.md` - Información de envío a Spookython
- `README_DEPLOYMENT_LINK.md` - Enlace de despliegue antiguo
- `OBTENER_URL_AHORA.md` - Instrucciones de URL antigua
- `GEMINI.md` - Documentación de integración Gemini

### Scripts y builds:
- `scripts/` - Scripts auxiliares (no usados en ECS)
- `buildspec.yml` - Configuración de AWS CodeBuild (no usado)
- `app.zip` - Archivo comprimido antiguo

### Documentación del proyecto:
- `.github/` - Configuración de GitHub Actions
- `docs/` - Documentación adicional del proyecto
- `infra/` - Configuración de infraestructura (Terraform, CloudFormation, etc.)

### Otros:
- `.dockerignore` - Archivo de configuración de Docker (no crítico)

---

## ✅ Archivos que SÍ se utilizan en ECS Fargate

La raíz del proyecto contiene solo lo esencial:

```
.
├── backend/              ✅ Código de FastAPI (se copia en el Dockerfile)
├── frontend/             ✅ Código de interfaz web (se copia en el Dockerfile)
├── Dockerfile            ✅ Configuración del contenedor
├── README.md             ✅ Documentación principal
├── .gitignore            ✅ Configuración de Git
└── no_desplegado/        📦 Archivos no utilizados
```

---

## 🚀 Despliegue Actual

- **Plataforma:** AWS ECS Fargate
- **Región:** us-east-1
- **Cluster:** mantazero-cluster
- **Service:** mantazero-service
- **URL:** http://100.54.228.201:8080
- **Status:** ✅ RUNNING

---

## 📝 Notas

Si en el futuro necesitas restaurar alguno de estos archivos (ej: configurar otra plataforma de despliegue), están todos aquí organizados en `no_desplegado/`.

