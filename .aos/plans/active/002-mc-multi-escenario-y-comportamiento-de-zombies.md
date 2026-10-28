---
id: 202610281102
type: plan
status: active
priority: high
tags: [plan/feature, montecarlo, zombies, llm]
created: 2026-10-28
prd: .aos/specs/001-mc-multi-escenario-y-comportamiento-de-zombies.prd.md
trd: .aos/specs/001-mc-multi-escenario-y-comportamiento-de-zombies.trd.md
---

# Plan: Feature — MC multi-escenario y comportamiento de zombies

> Objetivo (Definition of Done): CA-1 a CA-7 del PRD `001-mc-multi-escenario-y-comportamiento-de-zombies.prd.md` verificados en vivo sobre el contenedor en `:8080`, con `aos verify` en verde.

## Contexto y Archivos Afectados
- **PRD:** `.aos/specs/001-mc-multi-escenario-y-comportamiento-de-zombies.prd.md` (CA-1 a CA-7).
- **TRD:** `.aos/specs/001-mc-multi-escenario-y-comportamiento-de-zombies.trd.md`.
- **Archivos previstos:**
  - `backend/montecarlo.py`, `backend/main.py`, `backend/engine.py`, `backend/brain.py`;
  - `frontend/montecarlo.html`, `frontend/index.html`, `frontend/js/engine.js`;
  - `infra/ecs-task-definition.json`;
  - `scripts/test_montecarlo.py`.
- **ADRs vinculados:**
  - ADR-002 (escalas, se mantiene);
  - ADR-003 (MC desacoplado);
  - ADR-004 (cerebro LLM).
- **Contratos:** `.aos/contracts/http/simulation-api.yaml` (actualizado).
- **Riesgo (ADR-008): alto.**
  - Contrato compartido.
  - Concurrencia: hilo MC.
  - Servicio externo con secreto.
  - Implica revisión 4R.

## Fases de Ejecución Atómica

- [x] Fase 1: Discovery & contratos
  - Línea base:
    - `aos verify` → todo SKIPPED (sin lint ni test configurados);
    - `node --check frontend/js/engine.js` → OK;
    - `scripts/test_scales.py` (citado en el LEDGER) ya no existe.
  - PRD y TRD 001, ADR-003, ADR-004, y contrato con `/api/montecarlo/run` y `/api/zombie/decide`.
  - Gate: `python -c "import yaml; yaml.safe_load(open('.aos/contracts/http/simulation-api.yaml'))"` → OK (14 paths).
- [x] Fase 2: Backend Monte Carlo multi-escenario (CA-1, CA-2) + backend del cerebro (CA-7)
  - Test-first `scripts/test_montecarlo.py`, configurado como `test_command` en `.aos/config.json`.
    - RED visto: `ImportError: cannot import name 'run_scenarios'`.
    - Umbral de ρ(r0, pico) ajustado de 0.5 a 0.3: el valor medido fue 0.47, y ammo da ≈ −0.04.
  - `backend/brain.py` se adelantó a esta fase porque el test lo importa.
  - Validación pydantic: rechaza 5 de 5 casos inválidos (min > max, clave desconocida, bool mal tipado, fuera de límites, lista vacía).
  - Rendimiento: 8 escenarios × 1000 corridas = 1.7 s.
  - Gate: `aos verify` → TEST PASSED (`ALL_MC_TESTS_PASSED`, 5/5).
- [x] Fase 3: Frontend Monte Carlo + desacople del mapa
  - Gate: `node --check` OK.
  - Live-verify (playwright-cli) de `/montecarlo` con 4 escenarios (3 presets + 1 con rangos): KPIs, banda P5–P95, pico, probabilidades y tornado OK.
  - A 375 px `scrollWidth = 375`, sin scroll horizontal.
  - Consola: solo el aviso del CDN de Tailwind y el 404 de favicon, ambos previos al cambio.
  - curl:
    - CA-2: `launch` → `status: idle`;
    - CA-1: 2 escenarios → `sensitivity` `{r0: +0.29, armedCount: −0.47}` y `{}` para el fijo;
    - rango invertido → 422.
  - Iteración 2026-10-28, a pedido del usuario: los escenarios contenidos eran invisibles en el eje lineal.
    - Pico en escala log y `minBarLength`.
    - 4 escenarios demo con rangos, calibrados con `run_scenarios`, que corren automáticamente si no hay resultados:
      - Carnaval sin control: pico ~160k;
      - Respuesta táctica: ~900;
      - Cerco + antídoto: ~170;
      - Ciudad blindada: ~1.
    - Rediseño visual: el color de cada escenario se mantiene en tarjetas, gráficos y tabla; tarjetas resumen con severidad; toggle LOG/LINEAL; sensibilidad coloreada por signo; tabla plegable.
    - Verificado a 1400 y 375 px (`scrollWidth = 375`).
- [x] Fase 4: Fixes del mapa (CA-3 a CA-6)
  - CA-5:
    - antes (HEAD en :8090): 1 de 8 epicentros con zombie visible al cerrar la cinemática;
    - después: 10 de 10;
    - en pausa a 5.2 s (Murcielago, Tarqui, Jocay): 1 zombie dentro del viewport y HUD = 1.
  - CA-4: HUD antes/después del airdrop: sanos 85 → 87, mordidos 1 → 0, zombis 1 → 0, inmunes 8 → 8 (no inmuniza).
  - **No ejercido en vivo** (estado privado del closure):
    - CA-3 (un intento por inmune);
    - la parte "armados" de CA-4;
    - CA-6 (factor 1.25).
    - Cubiertos por revisión de código y movidos a pruebas manuales.
  - Gate: `node --check` OK.
- [x] Fase 5: Cerebro LLM del zombie cero (CA-7)
  - Frontend: `requestBrainDecision` / `pickNextConn`; las intersecciones reutilizan `outgoingConns`.
  - Con API key real (2026-10-28):
    - `beam` ignora `think: false` y envuelve el JSON en Markdown;
    - `nemotron-3-ultra` con `think: false` devuelve JSON limpio en 1,1–4,5 s;
    - por eso: modelo por defecto `nemotron-3-ultra`, timeout de 6 s y parser tolerante a Markdown (ver ADR-004).
  - Gate:
    - `aos verify` con 11 tests (el de JSON en Markdown, visto fallar con una mutación);
    - curl a `/api/zombie/decide` ×3 → `source: llm` en 1,2–2,6 s;
    - simulación en vivo (Jocay, 40 s) → 2 decisiones `source=llm` en el log, sin la key.
  - La key nunca se escribe en el repo: se pasa con `docker run -e OLLAMA_API_KEY=...`.
  - En ECS sigue pendiente el secret (F7).
- Zonas de dispersión (pedido del usuario, 2026-10-28):
  - +10 barrios reales (Nominatim/OSM, ajustados con OSRM `nearest`) y +19 corredores OSRM; quedan 30 nodos y 51 rutas.
  - San Juan descartado: OSRM daba rodeos de 8 y 18,6 km.
  - `scripts/generate_all_routes.js` ahora lee `manta-config.js` y solo pide las rutas que faltan (`--all` regenera todas); las 32 rutas previas quedaron idénticas.
  - `BARRIO_PARISH` asigna los barrios nuevos a las barras por parroquia.
- Iteración de mapa (pedidos del usuario, 2026-10-28):
  - **Paciente cero:**
    - galera CSS (`.patient-zero`);
    - el globo 🧠 ahora es `brain_bubble`: sigue al zombie unos 4 s (antes ~2,2 s fijo en el lugar).
  - **Red de calles:**
    - Ciudad del Sol ↔ Abdón Calderón (2,9 km), así Ciudad del Sol deja de ser callejón sin salida; el único nodo con una sola ruta es Marianita, que es límite.
    - Al cargar, cada nodo se mueve al centro de los extremos reales de sus rutas y cada ruta se cierra en su nodo (antes había huecos de hasta 341 y 906 m).
  - **Combate en metros:**
    - disparo 75 m y mordida 15 m para todos los agentes; antes eran 65/14 px y solo para los que estaban en pantalla, así que el zoom cambiaba la simulación;
    - prueba Tarqui, 35 s: zoom 17 → 9 y 3 afectados; zoom 13 → 6 y 5 (sin sesgo).
  - **Caza:** radio de olfato/oído de 300 m (`huntPrey` / `huntConn`); en la prueba, un zombie pasó de ~290 m a ~67 m de su presa en 4 s y la mordió.
- [x] Fase 6: Live-verify, revisión 4R con recibo y cierre
  - Revisión y acuse en el Recibo.
  - Gotchas: `initagents-latlng-cero`, `zombie-retroceso-inmune`, `pydantic-nan-422`.
  - 2 filas en el LEDGER.
  - El plan sigue en `active/` hasta cerrar la Fase 5 con una key real.

## Recibo de Revisión (RDD)
- Candidato: `48a4451a1da4454888fdc3e4ab4e142da5155493` (`git stash create`) · 16 archivos · 2026-10-28 11:32
- Archivos modificados:
  - `.aos/config.json`, `.aos/contracts/http/simulation-api.yaml`;
  - `backend/engine.py`, `backend/main.py`, `backend/montecarlo.py`;
  - `frontend/index.html`, `frontend/js/engine.js`, `frontend/montecarlo.html`;
  - `infra/ecs-task-definition.json`.
- Archivos nuevos:
  - `backend/brain.py`, `scripts/test_montecarlo.py`;
  - ADR-003, ADR-004;
  - PRD y TRD 001;
  - este plan.
- Tier: alto (riesgo nombrado: contrato compartido, concurrencia del hilo MC, servicio externo con secreto).
- Lentes: 4R (4 revisores en paralelo).
- Verificación adversarial: un solo verificador independiente (otro modelo: Sonnet) para los 16 hallazgos deduplicados, en lugar de uno por hallazgo, para acotar el costo.
- Resultado: 16 confirmados, 0 refutados.
  - Risk:
    - **F9** NaN pasa la validación → `allow_inf_nan=False` + handler de 422 sin `input` (verificado: NaN y 1e400 → 422).
  - Resilience:
    - **F6** dashboard colgado ante error de red → try/catch y `fail()`.
    - **F8** `start()` sin lock y sin `runId` → `_start_lock`, `runId` en status y results, un hilo cancelado no escribe, y `poll` detecta corridas ajenas.
  - Readability:
    - **F1** README, **F2** README, **F3** arquitectura.md y **F5** ADR-002 → actualizados.
    - **F4** chip CURADOS → renombrado a INMUNES.
  - Reliability:
    - **F10** la gracia corría durante la cinemática → ahora solo fuera de ella.
    - **F11**–**F13** tests nuevos de destino de curados, runner E2E, validación y fallbacks del cerebro; mutaciones vistas fallar.
    - **F14** Spearman con empates → rangos promedio (= scipy).
    - **F15** `log.exception`.
    - **F16** `logging.basicConfig`.
  - **Pendiente (requiere al usuario):** F7, el secret `OLLAMA_API_KEY` en ECS.
- Acuse tras la corrección:
  - `aos verify` → PASSED (11 tests);
  - `node --check` OK;
  - `aos scan --dry-run` OK (semgrep y checkov no instalados);
  - live-verify: MC por UI → "listo", 4 columnas;
  - CA-5 en Murcielago, Tarqui y Jocay → 1 zombie visible, HUD = 1.

## Registro de Preguntas y Decisiones (Discovery Trail)
- **MC (2026-10-28)**
  - Pregunta: ¿cómo definir múltiples escenarios y parámetros?
  - Opciones: escenarios + rangos / barrido grid / solo presets.
  - Decisión: escenarios + rangos.
- **Acople con el mapa (2026-10-28)**
  - Pregunta: ¿el mapa sigue disparando el MC?
  - Decisión: no, totalmente aparte.
- **Armados entre los curados (2026-10-28)**
  - Pregunta: ¿15% de curados armados, exacto o probabilístico?
  - Decisión: exacto con mínimo 1 (`ceil`).
- **Cerebro del zombie cero (2026-10-28)**
  - Pregunta: ¿con qué modelo decide el zombie cero?
  - Opciones: Jev (TypeSafe) / Strands Decider 2B / Ollama Cloud.
  - Decisión: Ollama Cloud, `beam` por defecto y `nemotron-3-ultra` vía `OLLAMA_MODEL` (ADR-004).
- **Proceso (2026-10-28):** seguir el harness `.aos/`.

## Registro de Bloqueos
- `OLLAMA_API_KEY` pendiente del usuario para la verificación con el modelo real (CA-7, rama `llm`).
