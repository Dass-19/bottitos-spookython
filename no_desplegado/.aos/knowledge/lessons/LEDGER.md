# Registro de Lecciones (LEDGER)

Una línea por lección **con evidencia**. No es un diario y no lleva opiniones: es lo que el
motor aprendió y puede volver a usar. Alimenta `aos refresh` al inicio de sesión.

Formato (Markdown, una fila por lección, más reciente arriba):

| Fecha | Artefacto tocado | Evidencia (comando o salida) | Efecto |
|---|---|---|---|
| 2026-10-27 | `backend/engine.py`, `backend/montecarlo.py`, `frontend/js/engine.js` | `python scripts/test_scales.py` -> `ALL_SEPARATION_TESTS_PASSED` & `node --check frontend/js/engine.js` (exit 0) | Separar la escala visual del mapa (`totalPop = agentCount`) de la escala censal real en Monte Carlo (`censusPop = 271145`) evita porcentajes `0.00%` en el HUD manteniendo rigor estadístico en `/montecarlo`. |

## Cómo se usa

- Se añade una fila en el **cierre** de una fase (skill `phased-delivery` §8) y en el hook `post-task.md`.
- Solo entran lecciones con evidencia: un comando, una salida o una medición. Si no se puede citar, va a `.aos/knowledge/gotchas/` como trampa, no aquí.
- La lección guía la **siguiente** tarea. Si algo de aquí resultó falso, se corrige en la misma pasada y se deja la fila con su corrección.
- Adoptado de *Harness²* (`google-research/harness2`): el *improvement harness* retiene las lecciones con evidencia de cada tarea para la siguiente. Ver ADR-008.
