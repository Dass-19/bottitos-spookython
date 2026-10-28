# 🚀 Guía de Despliegue AWS - Spookython 2026

**Objetivo:** Tener MantaZero funcionando en AWS con URL pública antes del 28 de octubre 10:00 AM  
**Tiempo Estimado:** 1-2 horas  
**Costo:** $0.00 (usando AWS Free Tier)

---

## 📋 Pre-Requisitos

- [ ] Cuenta AWS creada (si no tienes, crea una en [aws.amazon.com](https://aws.amazon.com/free))
- [ ] AWS CLI instalado (`aws --version` en terminal)
- [ ] Git configurado
- [ ] Python 3.9+ instalado

**Verificar requisitos:**
```bash
# En terminal/PowerShell:
aws --version
git --version
python --version
```

---

## 🎯 Opción 1: Elastic Beanstalk (RECOMENDADO - Más Fácil)

**Ventajas:** Automático, simple, similar costo a Lambda  
**Tiempo:** 30-45 minutos

### Paso 1: Instalar EB CLI

```bash
pip install awsebcli
eb --version  # Verifica instalación
```

### Paso 2: Inicializar Elastic Beanstalk

```bash
cd c:\Users\magno\Documents\GitHub\bottitos-spookython

# Inicializar EB
eb init -p python-3.11 mantazero --region us-east-1

# Cuando pregunte:
# - "Create an application": y (yes)
# - "Environment Name": prod
# - "DNS CNAME": mantazero-prod (único)
# - "Enable CodeCommit": n (no)
```

**Resultado esperado:**
```
Successfully created application and environment.
Environment Details
...
Created .elasticbeanstalk/config.yml
```

### Paso 3: Crear Archivo de Configuración

Crea `c:\Users\magno\Documents\GitHub\bottitos-spookython\.ebextensions\python.config`:

```yaml
option_settings:
  "aws:elasticbeanstalk:container:python":
    WSGIPath: backend.main:app
  "aws:ec2:instances":
    InstanceType: t3.micro
  "aws:autoscaling:launchconfiguration":
    InstanceType: t3.micro
```

### Paso 4: Crear Procfile

Crea `c:\Users\magno\Documents\GitHub\bottitos-spookython\Procfile`:

```
web: gunicorn backend.main:app
```

### Paso 5: Actualizar requirements.txt

Asegúrate que `backend/requirements.txt` incluya:

```
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0.0
gunicorn>=21.0.0  # AGREGA ESTA LÍNEA
```

### Paso 6: Crear Entorno y Desplegar

```bash
# Crear entorno en us-east-1
eb create prod

# Esto tardará 5-10 minutos...
# Verás logs: "Creating application version..."
```

**Cuando termine, verás:**
```
Environment URL: http://mantazero-prod.us-east-1.elasticbeanstalk.com
```

### Paso 7: Verificar Despliegue

```bash
# Abre en navegador:
# http://mantazero-prod.us-east-1.elasticbeanstalk.com

# O prueba API:
curl http://mantazero-prod.us-east-1.elasticbeanstalk.com/api/health
```

**Respuesta esperada:**
```json
{"status":"ok","engine":"python-fastapi-seir","zombieMaxHp":8}
```

### Paso 8: Guardar URL en README

En `README.md`, reemplaza la sección de despliegue:

```markdown
## 🚀 Despliegue en AWS

**URL en vivo (Spookython 2026):**
- [MantaZero en Elastic Beanstalk](http://mantazero-prod.us-east-1.elasticbeanstalk.com)

**Región:** us-east-1  
**Estado:** Funcionando  
**Free Tier:** Sí (sin costos)

### Troubleshooting
Si la aplicación no carga:
1. Verifica logs: `eb logs`
2. Reinicia: `eb restart`
3. Redeploya: `eb deploy`
```

---

## 🎯 Opción 2: AWS Lambda + S3 + CloudFront (Más Control)

**Ventajas:** Más flexible, escalable, pay-per-use  
**Tiempo:** 1-2 horas  
**Recomendado si:** Necesitas mayor control

### No desarrollaremos esto en detalle para no exceder tiempo. Usa Opción 1.

---

## 📊 Paso 9: Configurar AWS Budget (Requisito Spookython)

1. **Abre AWS Console:**
   - URL: [https://console.aws.amazon.com](https://console.aws.amazon.com)
   - Busca "AWS Budgets" en la barra de búsqueda

2. **Crear Budget:**
   - Haz clic en "Create budget"
   - Nombre: `MantaZero-Event-Budget`
   - Budget type: `Spending`
   - Límite mensual: `$50 USD`

3. **Configurar Alertas:**
   - Alert threshold #1: 25% ($12.50)
   - Alert threshold #2: 50% ($25.00)
   - Alert threshold #3: 100% ($50.00)
   - Email de notificación: Tu email

4. **Captura screenshot:**
   - Presiona Ctrl+PrintScreen (Win) o Cmd+Shift+5 (Mac)
   - Guarda como `docs/budget.png`

5. **Inserta en README:**
   ```markdown
   ## 💰 AWS Budget Configurado

   ![AWS Budget Alert](docs/budget.png)

   Presupuesto mensual: $50 USD  
   Alertas: 25%, 50%, 100%  
   Estado: ✅ Configurado
   ```

---

## ✅ Paso 10: Verificación Final

Antes de entregar, ejecuta este checklist:

```bash
# 1. Verificar archivo README
cat README.md | head -50  # Debe tener contenido

# 2. Verificar docs/
ls -la docs/
# Debe mostrar: arquitectura.md, costos.md, budget.png

# 3. Verificar git commits
git log --oneline | head -10
# Debe mostrar commit de documentación

# 4. Verificar URL pública
# Abre en navegador: http://mantazero-prod.us-east-1.elasticbeanstalk.com
# Debe cargar interfaz sin errores

# 5. Verificar API
curl http://mantazero-prod.us-east-1.elasticbeanstalk.com/api/health
# Debe retornar: {"status":"ok",...}

# 6. Verificar frontend
# Clic en: http://mantazero-prod.us-east-1.elasticbeanstalk.com/
# Debe mostrar: HUD con "SANOS", "ZOMBIS", "CURADOS", etc.
```

---

## 📝 Paso 11: Crear Presentación PDF

Crea un PDF de 5 slides con:

**Slide 1: Portada**
```
MantaZero: Epidemic Command
Simulación SEIR + Intervención Táctica
Spookython 2026 - Track B
[Tu Nombre/Equipo]
```

**Slide 2: El Problema**
```
🌊 Brotes epidemiológicos en Manta
- COVID-19, Dengue demuestran crisis
- Autoridades deciden rápido con recursos limitados
- ¿Dónde vacunar? ¿Dónde cerrar? ¿Cuándo?
```

**Slide 3: La Solución**
```
MantaZero: Herramienta táctica
- Simula propagación SEIR estocástico
- Monte Carlo: 400+ corridas en paralelo
- Compara: estrategia óptima vs. nada vs. azar
- Resultado: Cuánta gente se salva
```

**Slide 4: Tecnología**
```
- Backend: FastAPI + NumPy (motor SEIR)
- Frontend: Leaflet.js + Metal Slug sprites
- Cloud: AWS Elastic Beanstalk (free tier)
- Reproducible: Semilla NumPy = resultados consistentes
```

**Slide 5: Impacto**
```
Escenario A (Tsunami 7.8):
- Sin intervención: 220,000 infectados
- Con estrategia MantaZero: 50,000 infectados
- Vidas salvadas: ~170,000 personas
```

**Herramientas para PDF:**
- Google Slides → Descargar como PDF
- LibreOffice Impress
- PowerPoint → Guardar como PDF

---

## 🚨 Troubleshooting

### Problema: "Connection refused"
```
Error: No puedo acceder a http://mantazero-prod.us-east-1.elasticbeanstalk.com
```

**Solución:**
1. Verifica que EB está corriendo: `eb status`
2. Si está en "pending", espera 10 minutos
3. Si está en "red", revisa logs: `eb logs`
4. Redeploya: `eb deploy`

### Problema: "502 Bad Gateway"
```
Error: Página en blanco o 502 en navegador
```

**Solución:**
1. Probablemente backend no inicia correctamente
2. Verifica logs: `eb logs --stream`
3. Busca "ERROR" en los logs
4. Común: Path incorrecto en Procfile o requirements.txt faltante

### Problema: "FileNotFoundError: index.html"
```
Error: Frontend no carga
```

**Solución:**
1. Verifica que frontend/ tiene index.html
2. FastAPI debe servir archivos estáticos:
   ```python
   # En backend/main.py después de routes API
   app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
   ```
3. Redeploya: `eb deploy`

### Problema: "ModuleNotFoundError: numpy"
```
Error: backend/montecarlo.py no encuentra NumPy
```

**Solución:**
1. Verifica requirements.txt tiene numpy
2. Reinstala local: `pip install -r backend/requirements.txt`
3. Haz commit y redeploya: `git add . && git commit -m "fix: deps" && eb deploy`

---

## 📞 Soporte Rápido

Si algo no funciona:

1. **Logs de EB:**
   ```bash
   eb logs --stream
   ```
   Esto mostrará errores en tiempo real

2. **Reiniciar ambiente:**
   ```bash
   eb restart
   ```

3. **Información ambiente:**
   ```bash
   eb status
   eb info
   ```

4. **Desconectar si necesitas empezar de cero:**
   ```bash
   eb terminate prod
   eb create prod
   ```

---

## 📌 Resumen de URLs Entrega

**Antes de entregar, ten listas estas URLs:**

1. **Repositorio GitHub:**
   - https://github.com/tu-usuario/bottitos-spookython

2. **Aplicación en vivo:**
   - http://mantazero-prod.us-east-1.elasticbeanstalk.com

3. **API Health Check:**
   - http://mantazero-prod.us-east-1.elasticbeanstalk.com/api/health

4. **Presentación PDF:**
   - [Local: descargar antes de pitch]

---

## ✅ Checklist Final de Entrega

**Código & Repo:**
- [ ] README.md completado (6,000+ palabras)
- [ ] docs/arquitectura.md con diagramas
- [ ] docs/costos.md con análisis
- [ ] docs/budget.png (screenshot presupuesto)
- [ ] Git: historial de commits visible
- [ ] Repositorio público (GitHub/GitLab/Bitbucket)

**AWS:**
- [ ] Despliegue funcional en AWS
- [ ] URL pública que responde
- [ ] /api/health retorna JSON
- [ ] Interfaz carga sin errores JavaScript
- [ ] AWS Budget configurado con alerta

**Documentación:**
- [ ] Parámetros por defecto documentados en README
- [ ] Semilla (42) y runs (400) especificados
- [ ] Decisiones de diseño explicadas
- [ ] Limitaciones conocidas listadas

**Presentación:**
- [ ] PDF de 5 slides máximo (20 MB)
- [ ] Video demo (opcional, < 5 min)
- [ ] Notas para el pitch (qué decir en 5 min)

---

## 🎬 Hito Final

**Viernes 30 de octubre en ULEAM:**
- 5 minutos: Presentación + demostración en vivo
- 3 minutos: Preguntas del jurado
- **Prueba de fuego:** Jurado corre simulación con semilla propia, cambia parámetros, ve resultados

**Para la prueba de fuego:**
- ✅ Tendrás laptop con internet
- ✅ Abrirás http://mantazero-prod... en navegador
- ✅ Harás clic: "LANZAR BROTE"
- ✅ Verás simulación en vivo
- ✅ Jurado dice "cambia R₀ a 6.0"
- ✅ Cambias parámetro → ves nueva simulación
- ✅ **5 minutos para responder**

---

**Documento preparado:** 27 de octubre de 2026  
**Para:** Equipo bottitos-spookython  
**Deadline:** 28 de octubre 10:00 AM Ecuador  
**Entrega:** Plataforma Spookython 2026

¡Éxito en la entrega! 🚀
