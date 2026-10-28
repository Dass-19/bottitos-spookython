---
id: 202610270806
type: plan
status: completed
priority: high
tags: [plan/feature, mantazero, montecarlo, fastapi]
created: 2026-10-27
---

# Plan: Feature — MantaZero: Epidemic Command (Monorepo, 4 SEIR States, Combat & NumPy Monte Carlo)

> Objetivo (Definition of Done): Reestructurar el proyecto en `backend/`, `frontend/`, `infra/`, `docs/`; renombrar a **MantaZero: Epidemic Command**; implementar motor SEIR en FastAPI en contraste 1:1 con los agentes del mapa (reparto aleatorio de armados, 8 disparos por zombi, 3 escenarios de desastres naturales, inicio detenido en Día 0); y ejecutar simulación Monte Carlo en segundo plano con semilla NumPy sobre la población real de Manta (271,145 hab.) con dashboard en `/montecarlo`.

## Contexto y Archivos Afectados
- **Backend (`backend/`)**:
  - `backend/presets.py`: Constantes (`TOTAL_POPULATION = 271145`, `ZOMBIE_MAX_HP = 8`) y los 3 escenarios (`A`: Tsunami 7.8, `B`: El Niño, `C`: Marea Roja).
  - `backend/engine.py`: Motor SEIR principal en escala 1:1 con los agentes del mapa (`totalPop = agentCount`), síntesis de laboratorio y combate de 8 impactos por zombi.
  - `backend/montecarlo.py`: Motor estocástico vectorizado con NumPy (`np.random.default_rng(seed)`) en hilo background sobre el censo real de Manta (`271,145`).
  - `backend/main.py`: Endpoints FastAPI (`/api/*`), ruta `/montecarlo` y montaje estático de `frontend/`.
  - `backend/requirements.txt`: Dependencias (`fastapi`, `uvicorn`, `pydantic`, `numpy`).
- **Frontend (`frontend/`)**:
  - `frontend/index.html`: Rebrand a `MantaZero: Epidemic Command`, HUD limpio sin puntos parpadeantes ni leyendas redundantes, selector `MAPA / SAT` junto al botón de reiniciar, paneles plegables (`#tactical-dock` con 1.ª pestaña `🎛️ PARÁMETROS`), control de personas armadas y semilla de Monte Carlo.
  - `frontend/montecarlo.html`: Dashboard estadístico con promedios, rangos P5–P95 y gráficas Chart.js.
  - `frontend/js/engine.js`: Renderizado 2D, reparto aleatorio Fisher-Yates de armados, barra `X/8` HP por zombi, sincronización con FastAPI y sondeo de Monte Carlo.
  - `frontend/css/arcade.css`: Transiciones para paneles colapsables y chips del HUD.
- **Infraestructura & Documentación**:
  - `infra/.gitkeep` y `docs/.gitkeep`.

## Fases de Ejecución Atómica

- [x] Fase 1: Reestructuración Monorepo y Contratos HTTP
  - Separar en `backend/`, `frontend/`, `infra/.gitkeep`, `docs/.gitkeep`.
  - Declarar contrato OpenAPI en `.aos/contracts/http/simulation-api.yaml` incluyendo endpoints `/api/sim/*`, `/api/montecarlo/*` y `/montecarlo`.
  - Gate: Raíz limpia y contrato HTTP actualizado.

- [x] Fase 2: UI/UX Táctica y Rebrand a MantaZero: Epidemic Command
  - Renombrar título principal y cabeceras a `MantaZero: Epidemic Command`.
  - Eliminar puntos brillantes (`animate-ping` / `animate-pulse`), barra `INTEL:`, tarjeta flotante `TARGET` y píldora de leyenda superior derecha.
  - Mover selector `MAPA / SAT` a la barra inferior, a la izquierda del botón de reiniciar.
  - Hacer plegables el dock derecho (con `🎛️ PARÁMETROS` como primera pestaña) y la barra inferior para que el mapa ocupe el 100% del espacio.
  - Gate: Interfaz limpia y validada visualmente.

- [x] Fase 3: Combate Táctico (8 Disparos por Zombi & Personas Armadas Aleatorias)
  - Agregar parámetro `Personas con Armas` (`#init-armed-slider`) repartido aleatoriamente con barajado Fisher-Yates entre los agentes del mapa.
  - Configurar resistencia de zombis en `8` impactos de bala (`hp: 8, maxHp: 8`) con barra de vida flotante `X/8`.
  - Gate: Solo los agentes armados disparan y cada zombi cae al 8.º impacto.

- [x] Fase 4: Motor Monte Carlo en Segundo Plano (NumPy) y Separación de Escalas
  - Implementar `MonteCarloRunner` en `backend/montecarlo.py` con `np.random.default_rng(seed)` corriendo en background sobre la población real de Manta (`271,145` hab.).
  - Ajustar `backend/engine.py` y `frontend/js/engine.js` para que la simulación principal funcione 100% en contraste con los agentes del mapa (`totalPop = agentCount`).
  - Construir dashboard `/montecarlo` (`frontend/montecarlo.html`) con KPIs, abanico P5–P95 / P25–P75, curva SEIR logarítmica, histograma y tabla de percentiles.
  - Gate: Sintaxis JS verificada (`node --check frontend/js/engine.js`) y pruebas de integración FastAPI + Monte Carlo (`ALL_SEPARATION_TESTS_PASSED`).

## Registro de Decisiones (Discovery Trail)
- **Decisión 1:** No realizar commits automáticos sin orden expresa del usuario.
- **Decisión 2:** La simulación principal en el mapa calcula sus métricas (`SANOS`, `MORDIDOS`, `ZOMBIS`, `CURADOS`) en proporción 1:1 con los agentes desplegados (`agentCount`), mientras que el Monte Carlo en segundo plano opera con los datos reales del censo de Manta (`271,145` habitantes).
- **Decisión 3:** El backend FastAPI (`backend/engine.py` y `backend/montecarlo.py`) es la fuente de verdad de los cálculos SEIR y estocásticos; el frontend (`frontend/js/engine.js`) se encarga del renderizado espacial y sincroniza el estado vía REST.
