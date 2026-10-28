---
id: 202610281102
type: trd
status: approved
tags: [spec/trd, montecarlo, zombies, llm]
created: 2026-10-28
prd: 001-mc-multi-escenario-y-comportamiento-de-zombies.prd.md
---

# TRD: MC multi-escenario y comportamiento de zombies

> Cómo se construye y por qué así. **No repite el PRD: lo cita.**

## Contexto
- **PRD:** `001-mc-multi-escenario-y-comportamiento-de-zombies.prd.md`. Cubre CA-1 a CA-7.
- Archivos previstos:
  - `backend/montecarlo.py`, `backend/main.py`, `backend/engine.py`, `backend/brain.py` (nuevo);
  - `frontend/montecarlo.html`, `frontend/index.html`, `frontend/js/engine.js`;
  - `infra/ecs-task-definition.json`;
  - `scripts/test_montecarlo.py` (nuevo).

## Arquitectura y límites
- **MC (CA-1, CA-2):**
  - `MonteCarloRunner.start(scenarios, runs, seed)` recorre los escenarios en el hilo existente, con un único `np.random.default_rng(seed)`.
  - Cada parámetro numérico es escalar o `{min, max}`, y se muestrea por corrida como array `(n,)` para seguir vectorizado.
  - Antídoto en el modelo: E/I curados vuelven a S. Los armados suman `ceil(0.15 × curados)`.
  - `sensitivity[param] = {peakInfected: ρ, totalAttacked: ρ}`: Spearman (`np.corrcoef` sobre rangos), solo para los params en rango.
  - `/api/sim/launch` deja de llamar al runner.
- **Mapa (CA-3 a CA-6):** cambios locales en `frontend/js/engine.js`; `deploy_airdrop` en `backend/engine.py` suma a `healthy`.
- **Cerebro (CA-7):**
  - `backend/brain.py` expone `decide(options) -> {choice, target, reason, source, latencyMs}`.
  - Llama a `POST https://ollama.com/api/chat` (`Authorization: Bearer $OLLAMA_API_KEY`, `stream: false`, `format` = JSON schema) con `urllib.request` y timeout `OLLAMA_TIMEOUT` (2.5 s por defecto).
  - Modelo: `OLLAMA_MODEL`, por defecto `beam`.
  - Sin key, error, timeout o `choice` fuera de rango → heurística `argmax(humans − 3·armed)`.
- **Fronteras:**
  - el navegador nunca ve la API key, solo habla con `/api/zombie/decide`;
  - el MC no comparte estado con `sim_engine`.

## Contratos
- **HTTP:** `.aos/contracts/http/simulation-api.yaml` (actualizar):
  - nuevos `POST /api/montecarlo/run` y `POST /api/zombie/decide`;
  - `/api/sim/launch` sin `mcRuns/mcSeed`;
  - nuevo shape de `/api/montecarlo/results`.
- **Eventos:** sin cambios.

## Modelo de datos
- Sin persistencia: resultados MC en memoria del proceso, como hasta ahora.

## Decisiones
- ADRs vinculados:
  - ADR-003 (MC desacoplado, escenarios y rangos), que actualiza ADR-002;
  - ADR-004 (cerebro LLM vía Ollama Cloud).

## Dependencias nuevas
- Ninguna de Python/JS: se usa `urllib` de la stdlib.
- Servicio externo nuevo (Ollama Cloud), registrado en ADR-004.

## Plan de prueba
- **Unitarias** (`scripts/test_montecarlo.py`, configurado como `test_command` de `aos verify`):
  - conservación S+E+I+R = pop;
  - rango min=max ≡ fijo con la misma semilla;
  - 2 escenarios → 2 resultados con `sensitivity`;
  - launch no arranca MC;
  - heurística del cerebro;
  - fallback sin key.
- **De contrato:** YAML válido; las rutas de FastAPI coinciden con `paths` del contrato.
- **Live-verify:**
  - contenedor en `:8080`;
  - curl a `/api/montecarlo/run` y `/api/zombie/decide`;
  - navegador: `/montecarlo` con 2+ escenarios, y el mapa con 10 lanzamientos, un airdrop y un contacto con inmune.

## Observabilidad
- `/api/montecarlo/status` con `state: "error"` y mensaje.
- `brain.decide` loguea `source`, `latencyMs` y el error resumido, nunca la key.
- La respuesta de `/api/zombie/decide` expone `source` para detectar fallback continuo.

## Riesgos técnicos
- Latencia de modelos MoE grandes (cientos de ms a segundos): se mitiga con petición anticipada y timeout.
- Bucle de combate O(n²) en el mapa: no cambia y no se empeora.
