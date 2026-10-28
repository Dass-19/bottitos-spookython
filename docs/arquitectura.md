# 🏗️ Arquitectura de MantaZero: Epidemic Command

---

## ☁️ Arquitectura Cloud en AWS (Despliegue de Producción)

El sistema opera bajo un despliegue contenerizado administrado mediante **AWS ECS Fargate** en la región **`us-east-1` (N. Virginia)**.

### Diagrama de Infraestructura AWS

```mermaid
graph TB
    subgraph Internet["🌐 Zona Pública (Internet)"]
        User["👤 Usuario / Jurado Evaluador<br/>Navegador Web (Chrome / Firefox / Edge)"]
    end

    subgraph AWSCloud["☁️ AWS Cloud (Región us-east-1)"]
        CF["⚡ Amazon CloudFront (CDN + SSL/TLS)<br/>d25jz4tlj2zdm.cloudfront.net<br/>Puerto 443 (HTTPS Seguro)"]
        ALB["⚖️ Application Load Balancer (ALB)<br/>mantazero-alb-994615840.us-east-1.elb.amazonaws.com<br/>Puerto 80 (HTTP Origin)"]

        subgraph VPC["Amazon VPC (172.31.0.0/16)"]
            subgraph PublicSubnet["Subred Pública (subnet-0330e33fb231d099d)"]
                SG["🛡️ Security Group (mantazero-sg)<br/>Inbound: TCP 8080<br/>Outbound: Todo el tráfico permitido"]
                
                subgraph ECSCluster["Amazon ECS Cluster: mantazero-cluster"]
                    subgraph FargateTask["Tarea Fargate: mantazero:4<br/>0.25 vCPU / 512 MB RAM"]
                        direction TB
                        Container["🐳 Contenedor Docker (python:3.14-slim)"]
                        FastAPI["⚡ Servidor Uvicorn / FastAPI (Puerto 8080)"]
                        StaticFront["🖥️ Frontend Estático (HTML5, JS, Leaflet, Chart.js)"]
                        SEIREngine["⚙️ Motor SEIR Táctico en Memoria"]
                        MCRunner["🔄 Monte Carlo Runner (NumPy Vectorizado en Thread Background)"]
                        
                        Container --> FastAPI
                        FastAPI --> StaticFront
                        FastAPI --> SEIREngine
                        FastAPI --> MCRunner
                    end
                end
            end
        end

        subgraph ManagedServices["Servicios Administrados de AWS"]
            ECR["📦 Amazon ECR (028610956449.dkr.ecr.us-east-1)<br/>Repositorio de Imagen: mantazero"]
            CW["📊 Amazon CloudWatch Logs<br/>Grupo: /ecs/mantazero"]
            IAM["🔐 AWS IAM<br/>Rol de Ejecución: ecsTaskExecutionRole"]
            Budget["💰 AWS Budgets<br/>Presupuesto Mensual $50 USD con Alertas"]
        end
    end

    %% Conexiones y flujo
    User -->|"1. HTTPS / 443 (Certificado SSL/TLS)"| CF
    CF -->|"2. Reenvío HTTP al Origin ALB"| ALB
    ALB -->|"3. Tráfico balanceado a Fargate"| SG
    SG -->|"4. Acceso al contenedor (Puerto 8080)"| FargateTask
    IAM -.->|"Autorización y políticas mínimas"| FargateTask
    ECR -->|"Descarga inicial de imagen Docker"| Container
    FastAPI -->|"Envío de telemetría y logs stdout/stderr"| CW

    style Internet fill:#e0f2fe,stroke:#0284c7
    style AWSCloud fill:#f8fafc,stroke:#475569
    style VPC fill:#f1f5f9,stroke:#64748b
    style PublicSubnet fill:#f8fafc,stroke:#94a3b8
    style SG fill:#fef3c7,stroke:#d97706
    style FargateTask fill:#ecfdf5,stroke:#059669
    style ManagedServices fill:#fdf4ff,stroke:#c026d3
```

### Componentes AWS y Superficie de Exposición:
1. **Zonas Públicas:**
   - **Puerto 8080 (HTTP):** Expuesto públicamente mediante Elastic Network Interface (ENI) con IP pública para acceso directo de usuarios y jurados al mapa interactivo y endpoints REST.
2. **Zonas Privadas y Protegidas:**
   - **VPC Subnet:** Red aislada donde reside la tarea de cómputo.
   - **IAM Least Privilege:** Rol `ecsTaskExecutionRole` restringido exclusivamente a lectura en ECR y escritura de logs hacia CloudWatch.
   - **Sin Base de Datos Expuesta:** El estado epidemiológico se ejecuta efímeramente en memoria de Python con latencia menor a 2 ms.

---

## 🧩 Diagrama General de Software (Capas de Aplicación)

```mermaid
graph TB
    subgraph Client["🖥️ Cliente (Navegador)"]
        HTML["index.html<br/>Interfaz Táctica"]
        JS["engine.js<br/>Lógica Local"]
        MAP["Leaflet.js<br/>Mapa 2D Manta"]
        AUDIO["audio.js<br/>Efectos Sonido"]
    end
    
    subgraph API["🔗 API REST (FastAPI)"]
        HEALTH["GET /api/health"]
        STATE["GET /api/state"]
        LAUNCH["POST /api/sim/launch"]
        TICK["POST /api/sim/tick"]
        HIT["POST /api/sim/combat-hit"]
        AIRDROP["POST /api/sim/airdrop"]
        MC_STATUS["GET /api/montecarlo/status"]
        MC_RESULTS["GET /api/montecarlo/results"]
    end
    
    subgraph Backend["⚙️ Backend (Python FastAPI)"]
        MAIN["main.py<br/>Servidor HTTP"]
        ENGINE["SeirSimulationEngine<br/>Motor Principal"]
        MC["MonteCarloRunner<br/>Thread Background"]
    end
    
    subgraph Logic["🧬 Lógica Epidemiológica"]
        SEIR["SEIR Estocástico<br/>(S→E→I→R)"]
        COMBAT["Combate Táctico<br/>(I → Muerte)"]
        CURE["Antídotos<br/>(E,I → R)"]
        NUMPY["NumPy<br/>Vectorizado"]
    end
    
    subgraph Data["💾 Datos"]
        STATE_ENGINE["Estado Simulación<br/>Día/Hora/Agentes"]
        PARAMS["Parámetros<br/>R₀, vacunas, munición"]
        PRESETS["Escenarios A/B/C<br/>Desastres Naturales"]
    end
    
    subgraph Dashboard["📊 Dashboard MC"]
        HTML2["montecarlo.html"]
        CHART["Chart.js<br/>Gráficas"]
        STATS["Estadísticas<br/>p5,p95,mean"]
    end
    
    %% Conexiones Cliente
    HTML -->|"GET /"| MAIN
    JS -->|"REST JSON"| API
    MAP -->|"OpenStreetMap"| OSM["🌍 Tiles OSM"]
    
    %% Conexiones API
    API -->|"Endpoints"| MAIN
    
    %% Conexiones Backend
    MAIN -->|"Inicia/Controla"| ENGINE
    MAIN -->|"Inicia Thread"| MC
    ENGINE -->|"Estado en vivo"| STATE_ENGINE
    
    %% Conexiones Lógica
    ENGINE -->|"Aplica SEIR"| SEIR
    ENGINE -->|"Registra disparos"| COMBAT
    ENGINE -->|"Lanza antídotos"| CURE
    MC -->|"Vectorizado 500-5000x"| NUMPY
    NUMPY -->|"Simula 60 días"| SEIR
    NUMPY -->|"Computa estadísticas"| STATS
    
    %% Conexiones Datos
    ENGINE --> PARAMS
    ENGINE --> STATE_ENGINE
    MAIN -->|"GET"| PRESETS
    MC -->|"Lee"| PARAMS
    MC -->|"Lee"| PRESETS
    
    %% Conexiones Dashboard
    MC -->|"JSON"| MC_RESULTS
    MC_RESULTS -->|"Descarga"| HTML2
    HTML2 --> CHART
    CHART --> STATS
    
    style Client fill:#e1f5ff
    style API fill:#fff3e0
    style Backend fill:#f3e5f5
    style Logic fill:#e8f5e9
    style Data fill:#fce4ec
    style Dashboard fill:#fff9c4
```

---

## Flujo de Datos: Ciclo de Simulación

```mermaid
sequenceDiagram
    actor User as 👤 Usuario
    participant FE as 🌐 Frontend<br/>JavaScript
    participant API as 📡 FastAPI<br/>REST API
    participant ENG as ⚙️ Engine<br/>(SEIR)
    participant MC as 🔄 Monte Carlo<br/>(NumPy)
    participant DB as 💾 Estado

    User->>FE: 1. Selecciona Escenario A
    FE->>API: POST /api/sim/scenario {A}
    API->>ENG: apply_scenario("A")
    ENG->>DB: Carga parámetros: R₀=4.85, Armas=400, etc.
    API-->>FE: { state: {...} }
    
    User->>FE: 2. Ajusta parámetros (opcional)
    FE->>FE: Valida inputs localmente
    
    User->>FE: 3. Clic "LANZAR BROTE"
    FE->>API: POST /api/sim/launch {agentCount, ammo, mcSeed=42, mcRuns=400}
    API->>ENG: launch_outbreak()
    ENG->>DB: infected=1, healthy=94, immune=8
    
    par Simulación Principal
        loop Cada frame (60 FPS)
            User->>FE: [Interactúa en mapa]
            FE->>FE: Renderiza sprites
            FE->>FE: Calcula colisiones
            FE->>API: POST /api/sim/tick {infected, ammo, ...}
            API->>ENG: tick()
            ENG->>DB: Actualiza estado
            API-->>FE: { state, newDay }
            FE->>FE: Actualiza HUD
            FE->>FE: Dibuja mapa
        end
    and Monte Carlo (Background)
        API->>MC: start(params, 400 runs, seed=42)
        Note over MC: NumPy: S→E→I vectorizado
        MC->>MC: Simula 60 días × 400 runs
        MC->>MC: Calcula p5, p25, p75, p95
        MC->>DB: Guarda resultados
    end
    
    User->>FE: 4. Lanza antídoto (clic)
    FE->>API: POST /api/sim/airdrop {healedCount: 10}
    API->>ENG: deploy_airdrop(10)
    ENG->>DB: infected -= 10, immune += 10, cureCrates -= 1
    API-->>FE: { deployed: true, state }
    FE->>FE: Anima paracaídas SVG
    
    User->>FE: 5. MC termina (background)
    FE->>API: GET /api/montecarlo/status
    API-->>FE: { state: "done", progress: 1.0 }
    FE->>FE: Muestra botón "MONTE CARLO"
    
    User->>FE: 6. Clic "MONTE CARLO"
    FE->>FE: Abre montecarlo.html
    FE->>API: GET /api/montecarlo/results
    API-->>FE: { meta, series, summary, histogram }
    FE->>FE: Renderiza gráficas (Chart.js)
    FE->>User: Muestra: pico infección, zombis abatidos, etc.
```

---

## Arquitectura por Capas

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTACIÓN (Frontend)                 │
│  HTML5 + CSS3 + Vanilla JavaScript + Leaflet + Chart.js    │
│  - index.html: Interfaz táctica en tiempo real              │
│  - montecarlo.html: Dashboard de resultados                 │
│  - assets/sprites: GIFs Metal Slug (zombis, soldados)       │
└─────────────────────────────────────────────────────────────┘
                           ↕ REST JSON
┌─────────────────────────────────────────────────────────────┐
│                    API REST (FastAPI)                       │
│  - Health check, presets, simulación CRUD                   │
│  - Endpoints: /api/sim/*, /api/montecarlo/*                │
│  - CORS habilitado (demo) → restrictivo en prod             │
└─────────────────────────────────────────────────────────────┘
                           ↕ Métodos Python
┌─────────────────────────────────────────────────────────────┐
│               LÓGICA DE NEGOCIO (Backend)                   │
│                                                             │
│  1️⃣ SeirSimulationEngine (backend/engine.py)               │
│     - Estado principal: día, hora, S/E/I/R                 │
│     - Métodos: launch, tick, register_zombie_hit,          │
│       deploy_airdrop                                        │
│     - Transiciones: E→I (binomial), I→Muerto (combate)    │
│                                                             │
│  2️⃣ MonteCarloRunner (backend/montecarlo.py)               │
│     - Thread background: NumPy vectorizado                  │
│     - Entrada: params, runs, seed                          │
│     - Salida: series {S,E,I,R} + estadísticas             │
│     - 500-5000 simulaciones de 60 días c/u                 │
└─────────────────────────────────────────────────────────────┘
                           ↕ Python/NumPy
┌─────────────────────────────────────────────────────────────┐
│        NÚCLEO EPIDEMIOLÓGICO (Modelos Matemáticos)         │
│                                                             │
│  SEIR Estocástico:                                         │
│  - S → E: Binomial(S, 1 - exp(-β·I/N))                    │
│  - E → I: Binomial(E, 1 - exp(-1/τ_incub))                │
│  - I → R: Binomial(I, 0.25) si hay cajas                  │
│  - I → D: min(Binomial(I, p_kill), munición/8)            │
│                                                             │
│  Parámetros:                                               │
│  - β: Tasa de contagio (R₀ / días_infecciosos)           │
│  - p_kill: 1 - exp(-1.2 · soldados/agentes)              │
│  - R₀: 1.15 - 4.85 según escenario                        │
│  - τ_incub: 5-15 segundos (escala epidemiológica)        │
└─────────────────────────────────────────────────────────────┘
                           ↕ NumPy Arrays
┌─────────────────────────────────────────────────────────────┐
│                   ALMACENAMIENTO (Estado)                   │
│                                                             │
│  - Estado en memoria: Dict Python {day, infected, ...}    │
│  - Sin persistencia: Reset en cada nueva simulación        │
│  - Parámetros: Presets.py + inputs REST                   │
│  - Resultados MC: Numpy arrays → JSON en memoria           │
│                                                             │
│  Futuro (AWS):                                             │
│  - S3: Guardar simulaciones completas (.json)             │
│  - DynamoDB: Histórico de corridas                        │
│  - CloudWatch: Logs + métricas                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes Clave

### 1. **Frontend (HTML5 + Vanilla JS)**

**Archivos:**
```
frontend/
├── index.html                    # UI principal
├── montecarlo.html              # Dashboard resultados
├── css/arcade.css               # Estilos tema oscuro/arcada
├── js/
│   ├── engine.js                # State machine simulación
│   ├── manta-config.js          # Configuración rutas Manta
│   ├── sprites.js               # Manejo sprites GIF
│   ├── tailwind-config.js       # Configuración Tailwind
│   └── audio.js                 # Efectos de sonido SFX
└── assets/
    └── manta_routes.js          # GeoJSON rutas OpenStreetMap
```

**Responsabilidades:**
- Renderizar interfaz táctica
- Dibujar agentes en mapa con Leaflet.js
- Hacer polling a API REST
- Animar sprites zombis/soldados
- Mostrar gráficas Chart.js

---

### 2. **Backend FastAPI (Python)**

**main.py** - Servidor HTTP
```python
# Endpoints:
GET  /api/health          # Healthcheck
GET  /api/presets         # Obtener escenarios A/B/C
GET  /api/state           # Estado actual

POST /api/sim/reset       # Reinicia simulación
POST /api/sim/scenario    # Carga parámetros escenario
POST /api/sim/launch      # Inicia brote + MC
POST /api/sim/tick        # Avanza 1 frame
POST /api/sim/combat-hit  # Registra disparo
POST /api/sim/airdrop     # Lanza antídoto

GET  /api/montecarlo/status   # % completado
GET  /api/montecarlo/results  # Resultados JSON
```

---

### 3. **Motor SEIR (engine.py)**

```python
class SeirSimulationEngine:
    state = {
        "day", "hour", "minute",
        "healthy", "bitten", "infected", "immune",
        "ammo", "cureCrates", "deaths", "r0", ...
    }
    
    def reset()              # Reinicia estado
    def launch_outbreak()    # Inicia con params
    def tick()               # Avanza 1 frame (~10 min virtual)
    def register_zombie_hit() # -1 ammo, -1 HP zombi
    def deploy_airdrop()     # Cura infecciones
```

**Transiciones por tick:**
1. Incubación: `E → I` (si período cumplido)
2. Contagio: `S → E` (nuevo contacto)
3. Combate: `I → Muerto` (si hay munición)
4. Antídoto: `I → R` (si hay caja + lanzada)
5. Síntesis: Genera 1 nueva caja cada 10 días

---

### 4. **Monte Carlo (montecarlo.py)**

```python
class MonteCarloRunner:
    def start(params, runs=400, seed=42)
        # Inicia thread background
        
    def _simulate(rng, params, n)
        # Vectorizado en NumPy:
        # S, E, I, R = arrays[n, days+1]
        # Para cada día:
        #   - Contagio Poisson
        #   - Incubación Binomial
        #   - Combate Binomial
        #   - Antídotos Binomial
        
    def _aggregate(chunks, params, runs, seed)
        # Combina resultados:
        # - Series temporales (mean, p5, p25, p75, p95)
        # - Estadísticas: peakInfected, finalInfected, etc.
        # - Histograma: distribución picos
```

**Rendimiento:**
- 400 runs × 60 días: ~2 segundos (NumPy vectorizado)
- Threading: No bloquea API principal
- Reproducibilidad: Semilla `np.random.default_rng(42)`

---

## Flujo de Datos: Específico

### Línea Base: "No Intervenir"
```
t=0: S=270,900 | E=0 | I=1 | R=245 | Muertes=0

t=1: S≈270,750 | E≈150 | I≈50 | R=245
     (Contagio exponencial sin freno)
     
t=30: S≈100,000 | E≈5000 | I≈150,000 | R=245
      (Pico de infecciones, crecimiento incontrolable)
      
t=60: S≈50,000 | E≈1000 | I≈5000 | R=245
      (Mayoría se infectó, infección decae por falta de S)
      
Resultado: 220,000 infectados acumulados
```

### Línea Base: "Estrategia Óptima"
```
t=0: S=270,900 | E=0 | I=1 | R=245 | Munición=800 | Cajas=3

t=5: Lanzar 1 caja
     S≈270,800 | E≈100 | I≈30 | R≈300 (curados por antídoto)

t=10: Combate + 2ª caja
      I≈50 (abatidos por munición) | I→10 (por antídoto)
      Munición=400 | Cajas=2
      
t=30: Síntesis genera caja 4
      R≈10,000 (muchos curados)
      I≈500 (contenido por intervención)
      
t=60: I≈100 | R≈50,000 | Munición≈50 (crítico)
      
Resultado: 50,000 infectados acumulados (77% menos que no intervenir)
```

---

## Escalabilidad Arquitectónica

### Local (Ahora)
- ✅ Backend: FastAPI en puerto 8080
- ✅ Frontend: Archivos estáticos HTML/JS
- ✅ Data: En memoria (Dict Python)
- Límite: ~100 usuarios concurrentes

### AWS Elastic Beanstalk (Corto Plazo)
- Instancia t3.small: auto-scaling
- ALB: distribución de carga
- Data: Estado en memoria (sin persistencia)
- Límite: ~500 usuarios concurrentes

### AWS Serverless (Mediano Plazo)
- Lambda: API sin servidor
- S3 + CloudFront: Frontend + CDN
- DynamoDB: Persistencia resultados
- Step Functions: Orquestación MC paralelo
- Límite: ~10,000 usuarios concurrentes

### Multi-Región AWS (Largo Plazo)
- Lambda + API Gateway en us-east-1, eu-west-1, ap-southeast-1
- S3 replicación multi-región
- DynamoDB global tables
- Route 53: Geo-routing
- Límite: Ilimitado (con costos >$5K/mes)

---

## Seguridad

### Actual (Demo)
- ❌ Sin autenticación
- ❌ CORS abierto (`["*"]`)
- ✅ Sin credenciales en código
- ✅ Sin inyección SQL (no hay BD)

### Producción (Checklist)
- [ ] API Key o JWT en headers
- [ ] CORS restringido a dominio cliente
- [ ] Rate limiting: 100 req/min por IP
- [ ] HTTPS obligatorio
- [ ] Logs de auditoría en CloudWatch
- [ ] WAF en CloudFront (AWS)
- [ ] Validación inputs + sanitización
- [ ] Secrets en AWS Secrets Manager

---

## Monitoreo & Observabilidad

### Métricas Clave
```
CloudWatch Dashboards:
- Lambda duration (p50, p95, p99)
- S3 request rate
- API response time
- MC completion time
- Errores y excepciones

Alarmas:
- Lambda errors > 1%
- API latency > 5s
- MC timeout > 60s
- S3 403/404 rate > 5/min
```

### Logs
```
CloudWatch Logs:
- /aws/lambda/mantazero-api
- /aws/s3/mantazero-frontend
- Application logs (FastAPI)
- Errores de simulación SEIR
```

---

**Diagrama preparado:** 27 de octubre de 2026  
**Versión:** 1.0  
**Arquitecto:** Equipo bottitos-spookython
