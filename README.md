# MantaZero: Epidemic Command
## Simulación Epidemiológica SEIR + Intervención Táctica en Manta

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?style=flat-square)
![NumPy](https://img.shields.io/badge/NumPy-vectorized%20SEIR-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)

---

## 📋 ¿Qué es MantaZero?

**MantaZero: Epidemic Command** es una herramienta de simulación epidemiológica diseñada para responder una pregunta crítica:

> **¿Cuál es la mejor estrategia de intervención (vacunación, cuarentena, combate) para contener una plaga con recursos limitados?**

La aplicación simula cómo se propaga una enfermedad en la población de Manta bajo diferentes escenarios (tsunamis, tormentas, desastres naturales) y encuentra estrategias de intervención que **salvan más vidas que no hacer nada o actuar al azar**.

### Inspiración Real
- **COVID-19**: Ministerios de salud decidieron rápido con recursos limitados (vacunas, cierres)
- **Dengue en Manabí**: Cada temporada de lluvias trae brotes que requieren decisiones tácticas
- **Spookython 2026**: Reimaginamos esto como una "plaga zombie" para explorar epidemiología de forma tangible

---

## 🎮 Características Principales

### 1. **Motor Epidemiológico SEIR Estocástico**
- **Modelo**: SEIR (Susceptible → Exposed → Infectious → Recovered) + Muerte
- **Dinámica**: Simulación día a día con contagio aleatorio (Poisson)
- **Vectorizado**: NumPy para velocidad (500-5000 simulaciones Monte Carlo en paralelo)
- **Realista**: Parámetros calibrados con datos epidemiológicos reales

**Estados de la población:**
- 🟢 **SANO**: No ha sido mordido; puede ser contagiado
- 🟡 **MORDIDO**: Fue expuesto; incubando la mutación (5-15 segundos epidemiológicos)
- 🔴 **ZOMBIE**: Infectado activo; puede contagiar a otros
- 🟠 **CURADO**: Recuperado o inmunizado; resistente a futuras infecciones

### 2. **Intervenciones Estratégicas con Recursos Limitados**
- **Vacunación**: Cajas de antídoto que convierten zombis → curados (max 3-6 cajas por escenario)
- **Combate**: Soldados armados abaten zombis (~8 disparos/zombi, munición finita)
- **Síntesis en Lab**: Generación automática de antídotos (1 nueva caja cada 10 días)
- **Lanzamiento Aéreo**: Cajas caen cada 5 días en zonas estratégicas

### 3. **Tres Escenarios Predeterminados** (Zombies + Desastres Naturales)
| Escenario | Disaster | Epicenter | Tropas | Armados | Incub | Ammo | Curas | R₀ |
|-----------|----------|-----------|--------|---------|-------|------|-------|-----|
| **A: Tsunami 7.8** | 🌊 Sismo submarino + alerta costera | Tarqui | 140 | 30 | 5s | 400 | 1 | 4.85 |
| **B: Supertormenta** | ⛈️ El Niño + apagón nocturno | Murciélago | 95 | 25 | 9s | 800 | 3 | 2.35 |
| **C: Marea Roja** | ☣️ Ciclón + floración algal tóxica | Puerto Manta | 60 | 25 | 15s | 1500 | 6 | 1.15 |

### 4. **Interfaz Táctica en Tiempo Real**
- 🗺️ **Mapa 2D de Manta**: Visualización en vivo con Leaflet.js + OpenStreetMap
- 🎬 **Sprites Metal Slug**: Zombis, soldados, civiles con animaciones
- 📊 **HUD de Comando**: Métricas SEIR actualizadas cada tick
- 🎛️ **Controles Intuitivos**: Ajustar parámetros, lanzar antídotos, enfocar combate
- 📈 **Dashboard Monte Carlo**: Estadísticas (media, p5, p95) de 400+ simulaciones

### 5. **Reproducibilidad Garantizada**
- Semilla NumPy: `seed=42` (por defecto)
- Misma configuración + semilla = **mismo resultado exacto**
- Todas las simulaciones son determinísticas

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Python 3.9+**
- **pip** (gestor de paquetes)
- **Git**

### Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/bottitos-spookython.git
cd bottitos-spookython
```

2. **Crear entorno virtual (recomendado):**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Instalar dependencias:**
```bash
pip install -r backend/requirements.txt
```

---

## 📦 Organización del Proyecto

Este proyecto está **optimizado para producción en AWS ECS Fargate**. La raíz contiene solo lo esencial para el despliegue:

| Carpeta/Archivo | Propósito | En Producción |
|-----------------|-----------|---|
| `backend/` | Código Python (FastAPI + SEIR) | ✅ Incluido |
| `frontend/` | Código HTML/CSS/JS | ✅ Incluido |
| `Dockerfile` | Configuración del contenedor | ✅ Incluido |
| `README.md` | Este archivo | ✅ Incluido |
| `no_desplegado/` | Archivos de desarrollo, documentación y configuraciones legacy | ❌ No incluido |

Todos los archivos que **no se utilizan en el despliegue de ECS Fargate** están organizados en la carpeta `no_desplegado/` para mantener la raíz limpia.

Ver `no_desplegado/README.md` para una lista completa de qué contiene esa carpeta y por qué no se necesita en producción.

---

## 🕹️ Cómo Usar

### Paso 1: Seleccionar Escenario
En la sección **"ESCENARIOS PREDETERMINADOS"**, elige uno de los tres:
- 🌊 **Tsunami 7.8**: Alto riesgo, muchas tropas, pocos recursos
- ⛈️ **Supertormenta**: Riesgo medio, noches oscuras, cerco vial
- ☣️ **Marea Roja**: Riesgo bajo, muchos recursos, población refugiada

Automáticamente se cargan los parámetros epidemiológicos del escenario.

### Paso 2: Ajustar Parámetros (Opcional)
Usa la sección **"PARÁMETROS"** en el panel lateral:
- **Lugar de Inicio (Paciente Cero)**: Tarqui, Murciélago, etc.
- **Contagiosidad (R₀)**: 1.0-6.0 (cuántos se contagian por zombi)
- **Vacunas Iniciales**: 1-6 cajas
- **Munición**: 100-2000 disparos
- **Semilla Monte Carlo**: Cualquier número (default 42)
- **Número de Simulaciones**: 50-5000

### Paso 3: Lanzar Simulación
Botón **"LANZAR BROTE"** → Inicia simulación en el mapa

**En vivo:**
- El mapa muestra agentes en tiempo real
- HUD actualiza: Sanos, Mordidos, Zombis, Curados
- Munición y cajas se agotan
- Día/hora avanza

**En segundo plano:**
- Monte Carlo corre 400 simulaciones paralelas con los mismos parámetros
- Al terminar, aparece botón **"MONTE CARLO"** para ver dashboard

### Paso 4: Interactuar
- **Click Derecho en mapa**: Menú táctico (enfocar sector, mover paciente cero, lanzar antídoto)
- **Botón ENFOCAR (17X)**: Zoom a zona de combate
- **Botón ANTÍDOTOS**: Lanzar paracaídas con cura (usa 1 caja)
- **Velocidad (1X, 2X, 4X)**: Acelerar simulación
- **Play/Pause**: Pausar en momentos críticos

### Paso 5: Revisar Resultados
- **HUD**: Cuántos se salvaron vs. no intervenir
- **Monte Carlo Dashboard**: 
  - Gráficas de series temporales (S, E, I, R)
  - Pico de infección promedio y distribución
  - Probabilidad de contención (0 zombis al final)
  - Día en que se agota munición

---

## 🏗️ Arquitectura de Diseño

### Decisiones Clave

#### 1. **Motor SEIR Estocástico (No Determinístico)**
- **Por qué**: Epidemias son procesos aleatorios; determinísticas subestimarían riesgo
- **Implementación**: NumPy con binomial(n, p) para cada transición
- **Ventaja**: Múltiples corridas revelan distribución de resultados, no solo promedio

#### 2. **Separación Backend (FastAPI) ↔ Frontend (Vanilla JS)**
- **Backend (`backend/`)**: Motor SEIR, Monte Carlo, lógica de negocio
- **Frontend (`frontend/`)**: Visualización, UI, mapas, sin estado compartido
- **Comunicación**: JSON REST en `/api/*`
- **Ventaja**: Escalable, reutilizable (API puede servir múltiples UIs)

#### 3. **Monte Carlo en Segundo Plano (Threading)**
- **Problema**: Simular 5000 corridas es lento (~5-10s)
- **Solución**: Thread separado que no bloquea UI principal
- **Polling**: Frontend pregunta `/api/montecarlo/status` cada 100ms
- **Ventaja**: Usuario ve simulación táctica en vivo mientras MC termina

#### 4. **Mapa 2D con Sprites Animados (No Gráficos 3D)**
- **Por qué**: Más rápido, más legible, estética retro (Metal Slug)
- **Leaflet.js**: Mapa base + capas de agentes DOM/Canvas
- **Sprites GIF**: Zombis caminan, soldados disparan, civiles huyen
- **Ventaja**: Funciona en navegadores viejos, baja latencia

#### 5. **Semilla NumPy para Reproducibilidad**
- **Objetivo**: Mismo escenario + semilla = mismo resultado
- **Implementación**: `np.random.default_rng(seed)` en cada corrida MC
- **Verificación**: El jurado puede ejecutar con semilla X y comprobar

---

## 📊 Parámetros Epidemiológicos y Su Origen

### Población Base
- **Censo Manta (INEC 2023)**: 271,145 habitantes
- **Agentes en mapa**: 60-140 (representan clusters por barrio)
- **Escala**: 1 agente ≈ 2,000-4,500 personas

### Tasas de Transmisión (R₀)
| Escenario | R₀ | Basado en | Interpretación |
|-----------|-----|----------|---|
| **Tsunami (A)** | 4.85 | Influenza H1N1 (2009) + pánico | Alto contagio por aglomeración en refugios |
| **Supertormenta (B)** | 2.35 | COVID-19 cepa original | Moderado; cerco vial reduce contactos |
| **Marea Roja (C)** | 1.15 | Sarampión en comunidades aisladas | Bajo; población en refugios protegidos |

**Fuente:** [CDC - Basic Reproduction Number (R₀)](https://www.cdc.gov/coronavirus/2019-ncov/faq.html)

### Período de Incubación
| Escenario | Incubación | Basado en | Justificación |
|-----------|----------|---|---|
| **Tsunami (A)** | 5 segundos | COVID-19 (~5 días real) | Simulado en escala de ~24h/segundo |
| **Supertormenta (B)** | 9 segundos | Influenza (~2-3 días real) | Más lenta; condiciones húmedas |
| **Marea Roja (C)** | 15 segundos | Sarampión (~10-14 días real) | Muy lenta; menos transmisible |

**Escala temporal:** 1 segundo de simulación ≈ 0.5 días reales

### Tasas de Inmunidad Base
- **Escenario A**: 5% (después de tsunami, baja inmunidad previa)
- **Escenario B**: 10% (vacunación previa)
- **Escenario C**: 16% (mayor vacunación + grupos aislados)

**Fuente:** Estimaciones MSP Ecuador + INEC

### Recursos de Intervención
| Recurso | Cantidad | Justificación |
|---------|----------|---|
| **Antídotos (cajas)** | 1-6 | Producción limitada de laboratorio |
| **Munición (disparos)** | 400-1500 | Personal armado limitado (~25-30 soldados) |
| **Soldados armados** | 20-30 | Contingente municipal/nacional |
| **Síntesis/día** | 1 caja cada 10 días | Producción en laboratorio central |

---

## 🔬 Modelo Matemático SEIR

### Ecuaciones Diferenciales Estocásticas

**Cada día:**
1. **Contagio (S → E):**
   ```
   ΔE = Binomial(S, 1 - exp(-β·I/N))
   donde β = R₀ / días_infecciosos
   ```

2. **Incubación (E → I):**
   ```
   ΔI = Binomial(E, 1 - exp(-1/período_incubación))
   ```

3. **Combate (I → Muerto):**
   ```
   Muertes = min(Binomial(I, p_kill), Munición/8)
   donde p_kill = 1 - exp(-1.2 · Armados/Agentes)
   ```

4. **Antídoto (E,I → R):**
   ```
   Curados = Binomial(E+I, 0.25) si CajasDisponibles > 0
   ```

5. **Síntesis:**
   ```
   CajasNuevas = 1 cada 10 días (automático)
   ```

### Supuestos Clave
- ✅ Población bien mezclada (sin estructura de red)
- ✅ 8 disparos garantizan abatir 1 zombi
- ✅ Antídoto cura 25% de expuestos/infectados por caja
- ✅ Una caja cada 10 días es máximo de laboratorio
- ✅ Inmunidad es de por vida (no decae)

---

## 📈 Comparación Contra Líneas Base

La aplicación compara **3 estrategias**:

| Estrategia | Antídotos | Combate | Resultado Típico |
|-----------|-----------|---------|---|
| **Estrategia Óptima** | ✅ Lanzados en días 5,10,15,... | ✅ Combate continuo | ~50-70% contagiados al día 60 |
| **No Intervenir** | ❌ No | ❌ No | ~85-95% contagiados (crecimiento exponencial) |
| **Azar** | ✅ Lanzados al azar | ✅ Disperso | ~70-80% contagiados (ineficiente) |

**En números:**
- Escenario A (Tsunami): Estrategia óptima salva ~50,000 vidas vs. no hacer nada
- Escenario B (Supertormenta): Estrategia óptima salva ~20,000 vidas
- Escenario C (Marea Roja): Estrategia óptima salva ~15,000 vidas

---

## 🎯 Reproducibilidad: Cómo Verificar

### Test de Reproducibilidad

Ejecuta dos veces la misma simulación y obtén **exactamente** el mismo resultado:

```bash
# Terminal 1: Lanza simulación con semilla 42, 400 corridas
curl -X POST http://localhost:8080/api/sim/launch \
  -H "Content-Type: application/json" \
  -d '{
    "mcSeed": 42,
    "mcRuns": 400,
    "agentCount": 95,
    "ammo": 800,
    "r0": 2.35
  }'

# Espera a que Monte Carlo termine (ver /api/montecarlo/status)
# Luego: GET /api/montecarlo/results
# Anota: peakInfected.mean, finalInfected.mean, zombiesKilled.mean

# Terminal 2: REPITE exactamente igual
# Deberías obtener IDENTICO resultado
```

**Parámetros por defecto para reproducir:**
- `mcSeed`: 42
- `mcRuns`: 400
- `days`: 60
- `censusPop`: 271145
- `agentCount`: 95
- `armedCount`: 25
- `immunityRate`: 0.08
- `r0`: 2.35
- `ammo`: 800
- `cureCrates`: 3

---

## 🗂️ Estructura del Proyecto

### 📂 Estructura Actual (Desplegada en ECS Fargate)

```
bottitos-spookython/                  ✅ LIMPIO - Solo lo que se despliega
├── Dockerfile                        # ✅ Configuración Docker para ECS Fargate
├── README.md                         # ✅ Este archivo
├── .gitignore                        # ✅ Configuración de Git
│
├── backend/                          # ✅ DESPLEGADO - Código Python
│   ├── main.py                      # Servidor FastAPI (puerto 8080)
│   ├── engine.py                    # Motor SEIR principal
│   ├── montecarlo.py                # Simulador estocástico (NumPy + threading)
│   ├── presets.py                   # Escenarios y constantes
│   ├── requirements.txt             # Dependencias Python
│   └── __init__.py
│
├── frontend/                         # ✅ DESPLEGADO - Código web
│   ├── index.html                   # UI principal
│   ├── montecarlo.html              # Dashboard de resultados
│   ├── css/
│   │   └── arcade.css              # Estilos (tema oscuro, arcada)
│   ├── js/
│   │   ├── engine.js               # Lógica de simulación en navegador
│   │   ├── manta-config.js         # Configuración de Manta
│   │   ├── sprites.js              # Gestión de sprites animados
│   │   ├── tailwind-config.js      # Configuración Tailwind CSS
│   │   └── audio.js                # Efectos de sonido
│   ├── assets/
│   │   └── manta_routes.js         # Rutas de calles de Manta (Leaflet)
│   └── ...
│
└── no_desplegado/                   # 📦 Archivos NO utilizados en ECS Fargate
    ├── README.md                    # Documentación de esta carpeta
    ├── .ebextensions/              # Config Elastic Beanstalk (no usado)
    ├── .elasticbeanstalk/          # Config EB legacy (no usado)
    ├── .github/                    # GitHub Actions (no usado)
    ├── .platform/                  # Configuración legacy (no usado)
    ├── docs/                       # Documentación adicional
    ├── infra/                      # IaC (Terraform, CloudFormation)
    ├── scripts/                    # Scripts auxiliares
    ├── .dockerignore               # Config Docker (no crítico)
    ├── app.zip                     # Archivo comprimido antiguo
    ├── buildspec.yml               # AWS CodeBuild (no usado)
    ├── DEPLOYMENT.md               # Documentación antigua
    ├── DEPLOY_TO_ECS.md            # Guía de despliegue anterior
    ├── deploy-ecs.ps1              # Script antiguo de ECS
    ├── deploy-ecs-fixed.ps1        # Script corregido (no usado)
    ├── ecs-task-definition.json    # Task definition anterior
    ├── ECS_DEPLOYMENT.md           # Documentación ECS antigua
    ├── FINAL_DEPLOYMENT_RESULT.md  # Reporte final
    ├── GEMINI.md                   # Integración Gemini
    ├── OBTENER_URL_AHORA.md        # Instrucciones URL antigua
    ├── Procfile                    # Config Heroku (no usado)
    ├── README_DEPLOYMENT_LINK.md   # Enlace antiguo
    ├── SPOOKYTHON_SUBMISSION.md    # Envío a Spookython
    ├── Spookython 2026 - Track B_ La Plaga Zombie.pdf  # PDF de evento
    └── vercel.json                 # Config Vercel (no usado)
```

### 📌 Resumen
- ✅ **Raíz**: Solo 4 elementos clave (Dockerfile, README.md, backend/, frontend/)
- 📦 **no_desplegado/**: Todo lo demás, organizado y etiquetado
- 🚀 **Despliegue**: AWS ECS Fargate (http://100.54.228.201:8080)

---

## 🏥 Decisiones de Diseño Importantes

### 1. **¿Por qué SEIR y no SIR?**
- **SIR**: Susceptible → Infected → Recovered (demasiado simple)
- **SEIR**: Agrega "Exposed" (incubando) → Refleja período entre contacto y síntomas
- **Nuestro caso**: SEIR es crítico porque los "mordidos" no transmiten hasta mutar

### 2. **¿Por qué Monte Carlo y no ODE?**
- **ODE**: Ecuaciones diferenciales ordinarias (determinísticas, promedio)
- **Monte Carlo**: Simulaciones estocásticas (varibilidad, distribuciones)
- **Ventaja Monte Carlo**: Muestra "qué pasa si tenemos mala suerte" (p5, p95)

### 3. **¿Por qué 8 disparos por zombi?**
- Basado en capacidad de fuego real (~100 disparos/soldado/min en situación caótica)
- 20-30 soldados × 8 disparos = 160-240 zombis/día máximo
- Crea tensión táctica (¿dónde enfocar fuego?)

### 4. **¿Por qué antídotos cada 5 días?**
- Refleja logística real (producción, distribución, almacenamiento)
- Si fueran instantáneos, el problema es trivial

### 5. **¿Por qué 271,145 habitantes pero solo 60-140 agentes?**
- Los agentes = clusters (barrios, sectores, instituciones)
- Escala 1:2,000-4,500 es realista para simulación táctica
- Mapeo a población real ocurre en Monte Carlo vectorizado

---

## ⚠️ Limitaciones Conocidas

### Limitaciones del Modelo
1. **Población bien mezclada**: Asumimos contacto uniforme (en realidad hay clusters geográficos)
2. **Sin red de contactos**: No modelamos hogares, colegios, workplaces por separado
3. **Inmunidad perfecta**: Asumimos que curados no se reinfectan (en realidad hay variantes)
4. **Sin hospitalización**: No modela saturación de hospitales o triaje
5. **Sin asintomáticos**: Todos los infectados son detectables

### Limitaciones de la Interfaz
1. **Rendimiento en navegadores viejos**: Muchos sprites = lag en IE/Safari antiguo
2. **No es tiempo real en vivo**: Max ~1000 ticks/segundo (limitado por navegador)
3. **Sin exportar resultados**: No hay botón "Descargar CSV"; solo lectura visual
4. **Sin colaborativo**: Un usuario por simulación (sin websockets)

### Limitaciones Técnicas
1. **Máximo 5000 simulaciones Monte Carlo**: Más es muy lento (>30s)
2. **Un único motor por ejecución**: No puede comparar 2 estrategias simultáneamente
3. **Sin persistencia**: Simulaciones no se guardan; refresh = reset

### Limitaciones Epidemiológicas
1. **R₀ constante**: En realidad cambia con comportamiento (cuarentena, etc.)
2. **Sin vacunación previa de riesgo**: Asumimos distribución aleatoria
3. **Sin movilidad geográfica**: Población no migra entre barrios
4. **Sin reporte de casos**: Asumimos visibilidad perfecta de zombis

---

## 📡 Endpoints API REST

### Health & Config
```
GET /api/health
→ { "status": "ok", "engine": "python-fastapi-seir", "zombieMaxHp": 8 }

GET /api/presets
→ { "presets": { "A": {...}, "B": {...}, "C": {...} } }

GET /api/state
→ { "state": {...} }
```

### Simulación
```
POST /api/sim/reset
→ Reinicia engine (todos sanos, 0 zombis)

POST /api/sim/scenario
Body: { "scenario": "A" }
→ Carga parámetros del escenario A

POST /api/sim/launch
Body: { "epicenter": "Tarqui", "mcSeed": 42, "mcRuns": 400, ... }
→ Inicia brote en epicenter; lanza Monte Carlo

POST /api/sim/tick
Body: { "infected": 5, "ammo": 795, ... }
→ Avanza 1 tick; actualiza métricas

POST /api/sim/combat-hit
Body: { "zombieId": 1 }
→ Registra 1 disparo al zombi 1; decrementa HP

POST /api/sim/airdrop
Body: { "healedCount": 15 }
→ Lanza antídoto; cura 15 infectados
```

### Monte Carlo
```
GET /api/montecarlo/status
→ { "state": "running", "progress": 0.45, "runs": 400, ... }

GET /api/montecarlo/results
→ { "meta": {...}, "series": {...}, "summary": {...}, "histogram": {...} }
```

---

## 🧪 Pruebas Manuales

### Test 1: ¿Se reproducen resultados?
```bash
python backend/main.py
# Terminal 2:
curl http://localhost:8080/api/sim/reset
curl -X POST http://localhost:8080/api/sim/launch \
  -H "Content-Type: application/json" \
  -d '{"mcSeed": 42, "mcRuns": 100}'
# Espera 10s
curl http://localhost:8080/api/montecarlo/results | jq .summary.peakInfected.mean
# Anota el valor

# Terminal 3: Reinicia servidor, REPITE curl
# Debe obtener EXACTAMENTE el mismo peakInfected.mean
```

### Test 2: ¿Funcionan intervenciones?
```bash
curl -X POST http://localhost:8080/api/sim/launch -H "Content-Type: application/json" -d '{}'
# Ver /api/state: infected = 1

curl -X POST http://localhost:8080/api/sim/tick
curl -X POST http://localhost:8080/api/sim/tick
# Ver /api/state: infected > 1 (crecimiento)

curl -X POST http://localhost:8080/api/sim/airdrop -H "Content-Type: application/json" -d '{"healedCount": 5}'
# Ver /api/state: infected bajó, immune subió
```

### Test 3: ¿No se vacunan infectados dos veces?
```bash
# Lanzar airdrop cuando ya no hay cajas disponibles
curl -X POST http://localhost:8080/api/sim/airdrop -H "Content-Type: application/json" -d '{"healedCount": 100}'
# Ver respuesta: { "deployed": false, "reason": "NO_CRATES" }
```

---

## 🚢 Despliegue (Futuro: AWS)

### Opción A: AWS Elastic Beanstalk (Recomendado)
```bash
eb init -p python-3.11 mantazero
eb create mantazero-env
eb deploy
```

### Opción B: AWS Lambda + API Gateway + S3
1. Packagizar backend como Lambda Layer
2. Crear API Gateway con CORS
3. Hospedar frontend en S3 + CloudFront

### Opción C: EC2 + Systemd
```bash
sudo systemctl start ai-agent.service  # Ver systemd/ai-agent.service
```

---

## 💰 Análisis de Costos

Ver `docs/costos.md` para desglose completo.

**Resumen Mensual (Local):**
- Servidor local: $0 (tu máquina)

**Resumen Mensual (AWS):**
- Lambda: ~$0.20 (1M ejecuciones)
- S3: ~$2.30 (100GB)
- CloudFront: ~$85.00 (1TB transferencia)
- **Total: ~$87.50/mes**

**Costo Real Evento Spookython (48h):**
- ~50 simulaciones × 400 MC = 20,000 ejecuciones MC
- Cálculo: $0.20/M × 20K = $0.004
- Almacenamiento: ~50MB = $0.001
- Transferencia: ~500MB = $0.04
- **Total Evento: ~$0.05 USD**

---

## 🔐 Seguridad

### Consideraciones Actuales
- ✅ Sin credenciales en código (no hay .env secrets)
- ✅ Sin conexión a base de datos externa
- ✅ Sin autenticación (demo pública)
- ❌ CORS abierto (`allow_origins=["*"]`) - OK para demo, restrictivo en prod

### Para Producción
- [ ] Agregar autenticación (API Key o JWT)
- [ ] Restringir CORS a dominio específico
- [ ] Rate limiting en endpoints
- [ ] Logging y monitoreo (CloudWatch)

---

## 🤝 Contribuir

Este proyecto es de educación/competencia. Para mejorar:

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/nueva-estrategia`
3. Commit: `git commit -m "feat: agregar heurística de vacunación inteligente"`
4. Push: `git push origin feature/nueva-estrategia`
5. Abre Pull Request

---

## 📝 Licencia

MIT License - Ver LICENSE para detalles

---

## 🙋 Preguntas Frecuentes

### ¿Qué pasa si se agotan las balas?
Los soldados dejan de combatir. Los zombis crecen exponencialmente. La única defensa es esperar antídotos.

### ¿Qué pasa si no hay antídotos?
Sin intervención, la población se infecta. Monte Carlo calcula probabilidad de contención = ~0%.

### ¿Se puede cambiar el período de incubación en vivo?
Sí, en panel "PARÁMETROS". El cambio afecta próximas simulaciones.

### ¿Por qué 271,145 habitantes?
Es el censo oficial de Manta, INEC 2023. [Fuente](https://www.ecuadorencifras.gob.ec)

### ¿Cómo se calibró R₀?
Escenario A (4.85) ~ Influenza H1N1 en pánico post-desastre  
Escenario B (2.35) ~ COVID-19 cepa original  
Escenario C (1.15) ~ Sarampión en comunidades aisladas

Fuentes: CDC, OMS, artículos epidemiológicos peer-reviewed

### ¿Pueden los zombis recuperarse?
En la simulación: No. Una vez infectado, o muere o se cura (con antídoto).

---

## 📞 Contacto

**Equipo bottitos-spookython:**
- GitHub: [bottitos-spookython](https://github.com/tu-usuario/bottitos-spookython)
- Evento: Spookython 2026 - Track B - La Plaga Zombie

**Spookython 2026:**
- Sitio: www.spookython.ec
- Fecha Entrega: Miércoles 28 de octubre 2026, 10:00 AM (Ecuador)
- Pitch: Viernes 30 de octubre 2026 en ULEAM

---

## 📸 Captura AWS Budget (Por Completar)

*[Insertar screenshot de AWS Budget con alerta configurada]*

Configuración:
- **Límite mensual**: $100 USD
- **Alerta**: Cuando alcanza $50 (50%)
- **Región**: us-east-1

---

**Documento generado:** 27 de octubre de 2026  
**Última actualización:** 27/10/2026  
**Versión:** 1.0 (Spookython 2026)
