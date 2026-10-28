---
id: 202610281111
type: decision
status: vigente
created: 2026-10-28
---

# ADR-004: Cerebro del zombie cero con LLM en Ollama Cloud (stdlib, con fallback)

> Decision: El zombie cero decide su próxima ruta y su objetivo consultando un LLM en Ollama Cloud (`POST https://ollama.com/api/chat`, modelo por `OLLAMA_MODEL`, por defecto `nemotron-3-ultra` (ver medición)). La llamada la hace solo el backend (`backend/brain.py`), con `urllib` de la stdlib, timeout corto y una heurística local como fallback. La API key vive solo en el entorno (`OLLAMA_API_KEY`).

## Contexto
- **Alternativas evaluadas con el usuario (2026-10-28):**
  - **Jev (TypeSafe AI):** no está en el catálogo de Bedrock; se usa por la API propietaria de TypeSafe.
  - **Strands Decider 2B:** open source, pero requiere hospedarlo uno mismo (GPU o endpoint SageMaker con costo mientras esté encendido).
  - **Ollama Cloud:** sin infra propia.
    - `beam`: MoE 501B, 23.4B activos, el recomendado por menor cómputo activo.
    - `nemotron-3-ultra`: 550B, 55B activos.
- Ningún LLM general responde en milisegundos, así que la decisión se pide de forma anticipada (al 50% del tramo) y nunca bloquea el loop de render.

## Medición con API key real (2026-10-28)
- `beam` sigue razonando aunque se envíe `think: false`, a veces contesta en inglés y envuelve el JSON en ```json```: 1,5–4 s.
- `nemotron-3-ultra` con `think: false` devuelve JSON limpio en español: 1,1–4,5 s.
- Se cambia el modelo por defecto a `nemotron-3-ultra` y el timeout a 6 s. La decisión se pide al 50 % del tramo, unos 9 s antes de la intersección.
- El parser extrae el objeto `{…}` aunque venga envuelto en Markdown.

## Consecuencias
- A favor:
  - comportamiento "inteligente" del zombie cero;
  - sin dependencias nuevas;
  - funciona sin key gracias a la heurística `argmax(humans − 3·armed)`.
- En contra:
  - servicio externo con latencia variable y cuota;
  - un secreto más que gestionar (secret de ECS en producción).
- **Seguridad:**
  - la key nunca llega al navegador ni a los logs;
  - la entrada al prompt son solo números y nombres de ruta generados por el propio frontend, validados por pydantic.

## Condiciones de Revocación
Solo puede ser supersedido por otro ADR que lo declare explícitamente.
