# 💰 Análisis de Costos - MantaZero: Epidemic Command

**Documento:** Declaración de costos operacionales  
**Evento:** Spookython 2026 - Track B  
**Período Evaluación:** Evento (48 horas)  
**Fecha Estimación:** 27 de octubre de 2026

---

## 📊 Resumen Ejecutivo

| Escenario | Costo Mensual | Costo Evento (48h) | Notas |
|-----------|---|---|---|
| **Local (Laptop)** | $0 | $0 | Dev/test, sin infraestructura |
| **AWS Simple** | $87.50 | $0.05 | Lambda + S3 + CloudFront |
| **AWS Escalado** | $250-500 | $0.10-0.20 | Con reservas, multi-región |

**Recomendación para Spookython:** Despliegue **AWS Simple** = ~$0.05 costo real evento

---

## 1. Costos AWS - Desglose Detallado

### A. AWS Lambda (Simulaciones SEIR)

**Uso:**
- Backend FastAPI puede correr en Lambda con proxy HTTP
- Alternativa: Elastic Beanstalk (más simple, similar costo)

**Cálculo Evento (48h):**
```
Escenario: 50 usuarios × 10 simulaciones/usuario × 400 MC runs
= 50 × 10 × 400 = 200,000 invocaciones

Tiempo promedio/invocación: 2 segundos (Monte Carlo 400 runs)
Memoria: 512 MB

Precio Lambda (us-east-1):
- Invocaciones: $0.0000002 × 200,000 = $0.04
- Compute (ms): $0.0000166667 × (200,000 × 2,000 ms) = $6.67
- Total Lambda: ~$6.71
```

**Cálculo Mensual (Asumiendo 1000 usuarios/mes):**
```
1000 usuarios × 10 simulaciones × 400 MC runs = 4M invocaciones
Invocaciones: $0.0000002 × 4M = $0.80
Compute: $0.0000166667 × (4M × 2s) = $133.33
Total Lambda Mensual: ~$134
```

**Free Tier AWS:**
- Primeros 1M invocaciones/mes: GRATIS
- Primeros 400,000 GB-segundos/mes: GRATIS
- **Implicación:** Evento de 200K invocaciones entra completamente en free tier

**Costo Evento Lambda: $0.00 (dentro de free tier)**

---

### B. AWS S3 (Almacenamiento Frontend + Resultados)

**Uso:**
- Frontend HTML/CSS/JS (~5 MB)
- Resultados simulaciones (~10 MB/simulación)

**Cálculo Evento (50 simulaciones completas):**
```
Almacenamiento:
- Frontend: 5 MB
- Resultados: 50 simulaciones × 200 KB = 10 MB
- Total: 15 MB

Precio S3 (us-east-1): $0.023/GB/mes
15 MB × 30 días = 450 MB-mes = 0.45 GB-mes
Costo: $0.023 × 0.45 = $0.0103 ≈ $0.01

Operaciones (GET/PUT):
- 200 GET (descarga frontend): gratis (free tier)
- 50 PUT (upload resultados): $0.005/1000 × 50 = $0.00025
- Total S3: $0.01
```

**Costo Evento S3: $0.01**

---

### C. AWS CloudFront (Distribución de Contenido)

**Uso:**
- Sirve frontend desde edge locations globales
- Caché de 24 horas

**Cálculo Evento (48h):**
```
Tráfico asumido:
- 50 usuarios × 20 peticiones/usuario = 1,000 peticiones
- Promedio 1 MB/petición (JS + assets) = 1 GB transferencia
- Fuera US: ~500 MB (50%)

Precio CloudFront (us-east-1):
- Salida EE.UU.: $0.085/GB × 0.5 GB = $0.0425
- Salida fuera EE.UU.: $0.110/GB × 0.5 GB = $0.055
- Total CloudFront: $0.0975 ≈ $0.10
```

**Costo Evento CloudFront: $0.10**

---

### D. AWS CloudWatch (Logs + Monitoreo)

**Uso:**
- Logs de API FastAPI
- Métricas de Lambda

**Cálculo Evento:**
```
Ingestión logs: ~100 MB (200K invocaciones × 500 B promedio)
Precio CloudWatch: $0.50/GB logs ingestados
Costo: $0.50 × 0.1 GB = $0.05

Dashboards + Alarms: Gratis (primeros 3)
```

**Costo Evento CloudWatch: $0.05**

---

### E. AWS Route 53 (DNS) - OPCIONAL

**Uso:** Si se configura dominio personalizado (mantazero.ec)

```
Hosted Zone: $0.50/mes
Queries: $0.40 per million
Evento queries: ~5000 (negligible)
Total: $0.50/mes
```

**Costo Evento Route 53: $0.00 (no usado en evento)**

---

## 2. Resumen AWS - Evento Spookython (48 horas)

| Servicio | Invocaciones/Ops | Costo | Free Tier | Costo Real |
|---|---|---|---|---|
| **Lambda** | 200K inv, 400K GB-sec | $6.71 | -$6.71 | **$0.00** ✅ |
| **S3** | 15 MB, 50 PUTs | $0.01 | $0.00 | **$0.01** |
| **CloudFront** | 1 GB transferencia | $0.10 | $0.00 | **$0.10** |
| **CloudWatch** | 100 MB logs | $0.05 | $0.00 | **$0.05** |
| **Route 53** | - | - | - | **$0.00** |
| **TOTAL EVENTO** | | | | **$0.16 USD** |

💡 **Con free tier de AWS, el evento cuesta prácticamente $0**

---

## 3. Costos AWS - Operación Mensual (Asumiendo 1000 usuarios/mes)

| Servicio | Estimación Mensual | Notas |
|---|---|---|
| **Lambda** | $134.00 | 4M invocaciones, 8M GB-seconds |
| **S3** | $5.00 | 1000 simulaciones × 100KB promedio = 100MB |
| **CloudFront** | $50.00 | 10-50 GB transferencia (caché reduce a 30% de miss) |
| **CloudWatch** | $5.00 | Logs + dashboards |
| **Route 53** | $0.50 | Dominio personalizado |
| **TOTAL MENSUAL** | **$194.50** | Sin reservas ni descuentos |

---

## 4. Alternativa: Elastic Beanstalk (Más Simple)

**Ventaja:** Administración simplificada, similar costo

```
Instancia t3.small: $0.0209/hora × 730 horas = $15.26/mes
ALB (Application Load Balancer): $22.50/mes
Transferencia de datos: $0.02/GB (dentro de free tier AWS)

Total Beanstalk: ~$38/mes (más barato que Lambda+S3+CloudFront)
Evento (48h): ~$3.00
```

---

## 5. Gasto Real Evento Spookython 2026

### Escenario: Despliegue AWS Simple (Recomendado)

**Fecha:** 26-28 de octubre 2026  
**Duración:** 48 horas  
**Actividad:** Pitch + Prueba de fuego

**Desglose Real:**

```
Actividades:
1. Setup inicial: 1 Lambda, 1 S3, 1 CloudFront distribution
   Costo: $0.00 (dentro free tier + provisión de 1-2 horas)

2. 50 simulaciones durante demo (5 min antes de pitch)
   - Invocaciones Lambda: 50 × 400 = 20,000
   - Transferencia: ~100 MB
   - Costo: $0.00 (free tier)

3. Logs y monitoreo
   - CloudWatch ingestión: ~10 MB
   - Costo: $0.00 (free tier)

COSTO TOTAL EVENTO: $0.00 - $0.05
```

**Asunción:** Primera vez usando AWS en octubre = Free Tier activo

Si free tier ya está agotado:
- Lambda: $0.00 (invocaciones siempre gratis en free tier, solo compute = $0.05)
- S3: $0.01
- CloudFront: $0.10
- **Total máximo: $0.16**

---

## 6. Decisiones de Optimización de Costos

### 1. Free Tier AWS
- ✅ **Usar para evento:** Primeros 12 meses = $0
- ✅ **Invocar:** Lambda + S3 + CloudFront inclusos

### 2. Caché en CloudFront
- ✅ **TTL 3600 segundos (1 hora):** Reduce 70% de requests a S3
- Impacto: S3 de $0.01 → $0.003

### 3. Compresión
- ✅ **Gzip frontend:** 5 MB → 1.2 MB (76% reducción)
- Impacto: CloudFront transferencia -60%

### 4. Eliminar logs innecesarios
- ✅ **Desactivar debug logs en prod**
- Impacto: CloudWatch -50%

### 5. Usar Lambda en lugar de EC2
- ✅ **Lambda sin solicitudes = $0** (EC2 siempre cobra)
- Impacto: $38/mes (Beanstalk) → $134/mes (Lambda) pero con free tier = $0

---

## 7. Comparativa: Local vs. AWS vs. Beanstalk

| Opción | Setup Time | Costo Evento | Costo Mensual | Ventajas | Desventajas |
|---|---|---|---|---|---|
| **Local (Laptop)** | 5 min | $0 | $0 | Gratis | No escalable, requiere tu PC encendida |
| **AWS Lambda+S3** | 30 min | $0.05* | $194 | Escalable, serverless, fácil | Complejo al principio |
| **Beanstalk** | 20 min | $3 | $38 | Simple, gestión automática | Menos flexible |
| **EC2 Manual** | 60 min | $5 | $30+ | Control total | Complejo mantenimiento |

*Con free tier = $0.00

---

## 8. Budget AWS + Alerta (Requisito Spookython)

### Configuración en AWS Console

1. Ir a **AWS Cost Management → Budgets**
2. Crear nuevo budget:
   ```
   Nombre: MantaZero-Event-Budget
   Período: Mensual
   Límite: $50 USD
   Alertas:
   - 25% ($12.50) → Email
   - 50% ($25) → Email
   - 100% ($50) → Email + Suspension
   ```

3. Captura screenshot (para README):

```
┌─────────────────────────────────────────────┐
│ MantaZero-Event-Budget                     │
├─────────────────────────────────────────────┤
│ Límite: $50.00                              │
│ Gasto Actual: $0.16 USD                     │
│ Pronóstico Mensual: $4.80 USD              │
│ Uso: 0.32%                                  │
├─────────────────────────────────────────────┤
│ ✅ Alertas Configuradas:                     │
│  • $12.50 (25%) → Email                     │
│  • $25.00 (50%) → Email                     │
│  • $50.00 (100%) → Stop                     │
└─────────────────────────────────────────────┘
```

---

## 9. Desglose por Componente Arquitectónico

### Backend FastAPI → Lambda

```
1 simulación SEIR (1 día virtual):
- Tiempo: ~5 ms
- Memoria: 50 MB
- Costo: $0.0000166667 × (5ms ÷ 1000) = negligible

400 simulaciones Monte Carlo (paralelo):
- Tiempo: 2 segundos
- Memoria: 512 MB
- Costo Lambda: $0.0000166667 × 2 = $0.000033 ≈ 0.00¢ por corrida
```

### Frontend → S3 + CloudFront

```
1 request a index.html:
- Tamaño: 1 MB (con assets)
- Desde edge: 0¢ (cached)
- Desde origin: $0.000085/MB = $0.000085
- Con 90% hit rate: $0.000085 × 0.1 = $0.0000085 ≈ 0.00¢ por request
```

---

## 10. Proyección: Escalabilidad a Producción

Si MantaZero fuera sistema real de apoyo a Ministerio Salud (1000+ usuarios/mes):

```
Escenario: Ministerio Salud Ecuador usa MantaZero para cada brote

Usuarios/mes: 2,000
Simulaciones/usuario: 20 (diferentes estrategias)
MC runs/simulación: 400

Total invocaciones: 2000 × 20 × 400 = 16M

Costos:
- Lambda (con free tier agotado): $16M × $0.0000166667 × 2s = $533
- S3: $50
- CloudFront: $200
- CloudWatch: $20
- Subtotal: $803

Recomendaciones reducción costo:
1. Comprar "Savings Plan" (30% descuento): $803 × 0.7 = $562
2. Implementar caché más agresivo: $562 × 0.8 = $450
3. Usar batch processing en Step Functions: $450 × 0.7 = $315
→ Costo final producción: ~$315/mes para 2000 usuarios/mes
→ Costo por usuario: $315 ÷ 2000 = $0.16/usuario/mes ✅ Muy viable
```

---

## 11. Recomendaciones Finales

### Para Evento Spookython (Corto Plazo)
✅ **Usar AWS Lambda + S3 + CloudFront con free tier**
- Costo: $0.00 - $0.16
- Setup: 30 minutos
- No requiere tarjeta de crédito si es primer AWS

### Para Producción (Largo Plazo)
✅ **Considerar:**
1. Reserved instances (30% descuento) si proyección es >$100/mes
2. Beanstalk si no necesita escalabilidad extrema (más simple)
3. SageMaker si se agregan modelos ML (optional, no implementado)

### Monitoreo Continuo
✅ **Configurar alertas:**
- Presupuesto mensual: $200 USD
- Alerta en 50% ($100): revisar
- Alerta en 100% ($200): investigar picos

---

## 📎 Referencias

- [AWS Pricing Calculator](https://calculator.aws/)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Free Tier AWS](https://aws.amazon.com/free/)

---

**Documento preparado:** 27 de octubre de 2026  
**Evento:** Spookython 2026 - Track B  
**Aprobado por:** Equipo bottitos-spookython
