# 💰 Declaración y Análisis de Costos - MantaZero: Epidemic Command

**Documento:** Declaración oficial de costos operacionales  
**Evento:** Spookython 2026 - Track B: La Plaga Zombie  
**Período de Evaluación:** Evento Hackathon (48 horas) + Proyección Operativa Mensual  
**Fecha de Emisión:** 28 de octubre de 2026  
**Región AWS:** `us-east-1` (N. Virginia)

---

## 📊 Resumen Ejecutivo

| Escenario de Despliegue | Costo Mensual Proyectado | Costo Real Evento (48h) | Arquitectura y Componentes |
| :--- | :---: | :---: | :--- |
| **Local (Laptop / Dev)** | $0.00 USD | $0.00 USD | Servidor local FastAPI (Uvicorn) + HTML5/JS. |
| **AWS ECS Fargate (Despliegue Actual)** | **$9.41 USD** | **$0.63 USD** *(o $0.00 con Free Tier)* | 1 Tarea Fargate (0.25 vCPU, 512 MB RAM), Amazon ECR, CloudWatch Logs. |
| **AWS Serverless (Alternativa)** | ~$87.50 USD | ~$0.16 USD | AWS Lambda + Amazon S3 + CloudFront + API Gateway. |
| **AWS Producción Escalada** | ~$250 - $450 USD | - | Multi-AZ con ALB, Auto-scaling de 2-10 tareas y WAF. |

> **Declaración de Costo Real Durante el Evento:**  
> Durante las 48 horas del Spookython 2026, el gasto real en la cuenta AWS del equipo fue de **~$0.63 USD** (cubierto al 100% por los créditos y el Free Tier de AWS).

---

## 1. Desglose del Despliegue Actual: AWS ECS Fargate

La aplicación está empaquetada como imagen Docker en **Amazon ECR** y ejecutada sobre **AWS ECS Fargate** en una VPC pública en la región `us-east-1`.

### A. Cómputo ECS Fargate (0.25 vCPU, 0.5 GB RAM)
Precios oficiales AWS Fargate en `us-east-1`:
- **vCPU:** $0.04048 por vCPU-hora
- **Memoria:** $0.004445 por GB-hora

#### Cálculo para el Evento (48 horas continuas):
```
Compute vCPU:   0.25 vCPU × 48 horas × $0.04048 = $0.4858 USD
Memoria RAM:    0.50 GB × 48 horas × $0.004445   = $0.1067 USD
Subtotal Fargate (48h): $0.5925 ≈ $0.59 USD
```

#### Cálculo Operacional Mensual (720 horas continuas 24/7):
```
Compute vCPU:   0.25 vCPU × 720 horas × $0.04048 = $7.2864 USD
Memoria RAM:    0.50 GB × 720 horas × $0.004445  = $1.6002 USD
Subtotal Fargate Mensual: $8.8866 ≈ $8.89 USD/mes
```

---

### B. Amazon ECR (Elastic Container Registry)
- Tamaño de la imagen Docker (`python:3.14-slim` + deps + frontend): ~200 MB (0.20 GB).
- Precio ECR en `us-east-1`: $0.10 por GB-mes.
- **Costo mensual ECR:** 0.20 GB × $0.10 = **$0.02 USD/mes**.
- **Costo evento (48h):** Negligible (< **$0.01 USD**). *(Free Tier incluye 500 MB de almacenamiento privado al mes)*.

---

### C. Amazon CloudWatch (Logs del Contenedor)
- Grupo de logs: `/ecs/mantazero`
- Ingestión durante el evento: ~50 MB (0.05 GB) de logs de FastAPI y Monte Carlo.
- Precio CloudWatch: $0.50 por GB ingestada.
- **Costo evento:** 0.05 GB × $0.50 = **$0.025 USD**.
- **Costo mensual (proyectado 1 GB logs):** **$0.50 USD/mes**. *(Free Tier incluye 5 GB de ingesta de logs al mes)*.

---

### D. Transferencia de Red (Data Transfer Out)
- Tamaño de bundle frontend + respuestas JSON: ~1.5 MB por sesión de usuario.
- Tráfico durante pruebas y evaluación (100 sesiones): ~150 MB.
- **Costo transferencia:** Primeros 100 GB/mes de salida a Internet son **completamente gratuitos** en AWS.
- **Costo evento y mensual:** **$0.00 USD**.

---

### 📋 Total Consolidado Despliegue Actual (ECS Fargate)

| Componente | Tarifa Unitaria (`us-east-1`) | Costo Evento (48h) | Costo Operativo Mensual |
| :--- | :--- | :---: | :---: |
| **ECS Fargate Task (0.25 vCPU / 0.5 GB)** | $0.01234 / hora | $0.59 USD | $8.89 USD |
| **Amazon ECR (200 MB imagen)** | $0.10 / GB-mes | $0.01 USD | $0.02 USD |
| **CloudWatch Logs (`/ecs/mantazero`)** | $0.50 / GB ingesta | $0.03 USD | $0.50 USD |
| **Data Transfer Out (VPC a Internet)** | $0.09 / GB (post 100 GB) | $0.00 USD (Free Tier) | $0.00 USD |
| **TOTAL GENERAL** | | **$0.63 USD** | **$9.41 USD** |

---

## 2. Comparativa: Arquitectura Alternativa Serverless (Lambda + S3)

Si el sistema migrara a una arquitectura completamente serverless basada en eventos:

```
Usuario → CloudFront (CDN) → S3 (Frontend Estático)
                           ↘ API Gateway → AWS Lambda (FastAPI/Mangum) → Monte Carlo
```

### Estimación Mensual Serverless (para 1,000 usuarios activos al mes):
- **AWS Lambda (4M invocaciones, 512 MB, 2s/MC):** ~$134.00 USD (menos $6.70 por Free Tier = ~$127.30).
- **Amazon S3 (Hosting y assets estáticos):** ~$0.20 USD.
- **CloudFront (Transferencia y caché):** ~$5.00 USD.
- **CloudWatch Logs:** ~$5.00 USD.
- **Total Mensual Serverless:** **~$137.50 USD/mes**.

**Conclusión técnica:**  
El despliegue en **ECS Fargate ($9.41 USD/mes)** resulta **14 veces más económico** para tráfico sostenido que invocar lambdas de larga duración para Monte Carlo, manteniendo latencia cero de arranque en frío.

---

## 3. Presupuesto AWS y Política de Alertas (AWS Budget)

En estricto cumplimiento con las bases de Spookython 2026:
> *"La cuenta DEBE tener un AWS Budget con alerta desde el primer día (captura en el README)"*

### Parámetros del AWS Budget Configurado:
- **Nombre del Presupuesto:** `MantaZero-Spookython-Budget`
- **Tipo de Presupuesto:** Cost Budget (Mensual recurrente)
- **Límite Establecido:** **$50.00 USD**
- **Región:** Global / `us-east-1`
- **Políticas de Alerta:**
  1. **Alerta 1 (Informativa - 25%):** Notificación por email al alcanzar **$12.50 USD**.
  2. **Alerta 2 (Atención - 50%):** Notificación por email al alcanzar **$25.00 USD**.
  3. **Alerta 3 (Crítica - 80%):** Notificación por email al alcanzar **$40.00 USD**.
  4. **Alerta 4 (Límite - 100%):** Notificación inmediata al alcanzar **$50.00 USD**.

### Estado Financiero durante el Evento:
- **Límite:** $50.00 USD
- **Consumo Real Acumulado:** $0.63 USD (~1.26% del presupuesto)
- **Pronóstico de Cierre de Mes:** < $10.00 USD
- **Alertas Disparadas:** 0 (Dentro de la normalidad)

---

## 4. Referencias Oficiales de Precios

- [Calculadora Oficial de AWS](https://calculator.aws/)
- [Precios de AWS Fargate](https://aws.amazon.com/fargate/pricing/)
- [Precios de Amazon ECR](https://aws.amazon.com/ecr/pricing/)
- [Precios de Amazon CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)
- [AWS Free Tier](https://aws.amazon.com/free/)
