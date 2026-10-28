# Costos · MantaZero: Epidemic Command

Región `us-east-1`. Precios on-demand de lista; no incluyen Free Tier ni créditos. Fecha: 28-oct-2026.

## Resumen

| Despliegue | USD/mes | Componentes |
| :--- | ---: | :--- |
| Local | 0.00 | Uvicorn + frontend estático |
| **AWS ECS Fargate (actual)** | **36.41** | 1 tarea Fargate, ALB, ECR, CloudWatch Logs |
| AWS serverless (alternativa) | ~137.50 | Lambda, API Gateway, S3, CloudFront |
| AWS producción escalada | ~250–450 | Multi-AZ, auto-scaling 2–10 tareas, WAF |

**Gasto real del mes (AWS Budgets): $7.14.**

---

## 1. Despliegue actual

### Fargate (0.25 vCPU, 0.5 GB)

Tarifas: $0.04048 por vCPU-hora, $0.004445 por GB-hora.

```
vCPU     0.25 × 720 h × $0.04048  = $7.29
Memoria  0.50 × 720 h × $0.004445 = $1.60
Total por tarea                   = $8.89 / mes   ($0.01234 / h)
```

### Application Load Balancer

```
Hora fija   720 h × $0.0225 = $16.20 / mes
LCU         $0.008 por LCU-hora; despreciable con tráfico de demo
```

### IPv4 públicas

AWS cobra $0.005/h por IPv4 pública. La tarea tiene `assignPublicIp=ENABLED` y el ALB ocupa como mínimo 2 subredes, cada una con su IP.

```
3 IPs × 720 h × $0.005 = $10.80 / mes
```

### ECR

Imagen de ~200 MB × $0.10 por GB-mes = **$0.02/mes**.

### CloudWatch Logs (`/ecs/mantazero`)

~1 GB de ingesta × $0.50 por GB = **$0.50/mes**.

### Transferencia de salida

~1.5 MB por sesión. Los primeros 100 GB/mes son gratis: **$0.00**.

### Total

| Componente | Tarifa | USD/mes |
| :--- | :--- | ---: |
| Fargate 0.25 vCPU / 0.5 GB | $0.01234 / h | 8.89 |
| ALB | $0.0225 / h + LCU | 16.20 |
| IPv4 públicas (×3) | $0.005 / h c/u | 10.80 |
| ECR | $0.10 / GB-mes | 0.02 |
| CloudWatch Logs | $0.50 / GB | 0.50 |
| Data transfer out | gratis hasta 100 GB | 0.00 |
| **Total** | | **36.41** |

El servicio anterior (`mantazero-service`, `mantazero:1`) sigue en estado Active. Si tiene una tarea corriendo, suma ~$12.49/mes (Fargate + 1 IPv4). Para que no cueste nada hay que bajarlo a 0 tareas o eliminarlo.

**Ahorro posible:** quitar la IP pública de la tarea (subred privada + NAT o endpoints VPC) ahorra $3.60/mes. Con tráfico de demo, el ALB es el componente más caro.

---

## 2. Alternativa serverless

```
CloudFront → S3 (frontend)
           → API Gateway → Lambda (FastAPI + Mangum) → Monte Carlo
```

Estimación para 1000 usuarios activos al mes:

| Componente | USD/mes |
| :--- | ---: |
| Lambda (4 M invocaciones, 512 MB, 2 s por Monte Carlo), neto de Free Tier | ~127.30 |
| S3 | ~0.20 |
| CloudFront | ~5.00 |
| CloudWatch Logs | ~5.00 |
| **Total** | **~137.50** |

Fargate sale ~3.8 veces más barato con tráfico sostenido y no tiene cold start. Además, el estado de la simulación vive en memoria del proceso, algo que Lambda no conserva entre invocaciones.

---

## 3. AWS Budget

| Parámetro | Valor |
| :--- | :--- |
| Nombre | `mantazero-budget` |
| Tipo | Cost budget, mensual recurrente |
| Límite | $50.00 |
| Alertas (email, costo real) | 25 % ($12.50) · 50 % ($25.00) · 80 % ($40.00) · 100 % ($50.00) |
| Gasto actual | $7.14 (14.28 %) |
| Alertas disparadas | 0 |

![AWS Budget: estado](budget-resumen.png)

![AWS Budget: alertas](budget-alertas.png)

---

## Referencias

- [AWS Pricing Calculator](https://calculator.aws/)
- [Fargate](https://aws.amazon.com/fargate/pricing/) · [ELB](https://aws.amazon.com/elasticloadbalancing/pricing/) · [VPC / IPv4 pública](https://aws.amazon.com/vpc/pricing/) · [ECR](https://aws.amazon.com/ecr/pricing/) · [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)
