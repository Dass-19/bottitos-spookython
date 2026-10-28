---
id: 202610272314
type: decision
status: vigente (consecuencias de Monte Carlo actualizadas por ADR-003)
created: 2026-10-27
---

# ADR-002: Separación Monorepo Backend (FastAPI + NumPy Monte Carlo) y Frontend (Leaflet + Canvas)

> Decision: Separar el proyecto `MantaZero: Epidemic Command` en 4 carpetas raíz (`backend/`, `frontend/`, `infra/`, `docs/`) y dividir las escalas de población entre la simulación principal en vivo (escala 1:1 con agentes en mapa) y la simulación Monte Carlo en segundo plano (escala real del censo de Manta: 271,145 habitantes).

## Contexto
- La interfaz táctica 2D requiere que los indicadores del HUD (`SANOS`, `MORDIDOS`, `ZOMBIS`, `CURADOS`) guarden proporción exacta (1:1) con las entidades visibles que caminan, combaten y mutan sobre las calles de Manta (`agentCount`, ej. 95 agentes).
- El análisis epidemiológico estocástico requiere ejecutar cientos de corridas Monte Carlo con semilla reproducible de NumPy (`np.random.default_rng(seed)`) sobre la población censal real de Manta (`271,145` habitantes) sin bloquear el hilo de renderizado del navegador.

## Consecuencias
- **Backend (`backend/`)**:
  - `backend/engine.py`: Fuente única de verdad de la simulación principal en escala de agentes (`totalPop = agentCount`), reloj epidemiológico, síntesis de antídotos en laboratorio y validación de combate (8 disparos por zombi).
  - `backend/montecarlo.py`: Hilo en segundo plano con NumPy vectorizado sobre `censusPop = 271,145`, exponiendo `/api/montecarlo/status` y `/api/montecarlo/results`.
  - `backend/main.py`: API REST FastAPI bajo `/api/*`, ruta `/montecarlo` para el dashboard estadístico y servidor estático de `frontend/`.
- **Frontend (`frontend/`)**:
  - `frontend/index.html` y `frontend/js/engine.js`: HUD limpio y plegable, sincronizado con FastAPI y 100% en contraste con los agentes del mapa.
  - `frontend/montecarlo.html`: Dashboard con Chart.js (bandas P5–P95 / P25–P75, curva SEIR logarítmica, histograma del pico de infectados y tabla estadística).
- **Estructura limpia**: `infra/.gitkeep` y `docs/.gitkeep` mantienen las carpetas versionadas en Git sin archivos basura en la raíz.
