---
id: 202610281102
type: prd
status: approved
tags: [spec/prd, montecarlo, zombies, llm]
created: 2026-10-28
---

# PRD: MC multi-escenario y comportamiento de zombies

> Para quien analiza el brote en MantaZero: un Monte Carlo propio, que compara varios escenarios con parámetros inciertos, y un mapa cuyos zombies se comportan de forma creíble.

## Problema
- El Monte Carlo solo se ejecuta al lanzar el mapa, con un único set de parámetros fijos (`backend/main.py` `/api/sim/launch` → `mc_runner.start`). No permite comparar escenarios ni modelar incertidumbre.
- Zombies pegados a inmunes: tras cada intento fallido el zombie retrocede 3.5 m y vuelve a avanzar sobre el mismo inmune (`frontend/js/engine.js`, rama `target.type === 'immune'`). Reportado por el usuario.
- El antídoto vuelve inmunes a los curados. El usuario pide que solo los cure y que una parte quede armada.
- A veces, al terminar la cinemática inicial, no se ve ningún infectado en cuadro. Reportado por el usuario.
- Los zombies son percibidos como lentos (hoy usan la misma velocidad que los humanos).
- Hipótesis de producto: un zombie cero que decide rutas y objetivos con un LLM hace la simulación más interesante.

## Usuario y contexto
- **Quién lo usa:** el equipo del Spookython y los jurados que exploran la simulación.
- **Cuándo y dónde:** en el navegador, desde `/` (mapa) y `/montecarlo` (análisis).
- **Qué hace hoy en su lugar:** lanza el mapa y espera el MC de un único escenario.

## Alcance
- **Dentro:**
  - MC independiente con N escenarios, cada parámetro fijo o en rango;
  - comparación entre escenarios y sensibilidad;
  - fixes de comportamiento en el mapa;
  - zombie cero guiado por LLM (Ollama Cloud) con fallback heurístico.
- **Fuera (no-objetivos):**
  - persistir corridas MC entre reinicios;
  - varios zombies guiados por LLM;
  - barrido tipo grid;
  - cambiar la escala censal del MC (ADR-002 se mantiene en eso).

## Criterios de aceptación (medibles)
- [ ] **CA-1:** `POST /api/montecarlo/run` con ≥2 escenarios produce en `/api/montecarlo/results` un resultado por escenario, y cada uno trae `sensitivity` para los parámetros dados en rango.
- [ ] **CA-2:** tras `POST /api/sim/launch`, `GET /api/montecarlo/status` sigue en `state: "idle"` (el mapa no dispara MC).
- [ ] **CA-3:** un zombie intenta infectar a un mismo inmune una sola vez y sigue su camino, sin retroceso ni oscilación.
- [ ] **CA-4:** al lanzar el antídoto, los curados pasan a `human` (no `immune`) y `ceil(curados × 0.15)` de ellos (mínimo 1 si hubo curados) reciben arma; se eligen entre los curados que no estaban armados. El backend suma los curados a `healthy`, no a `immune`.
- [ ] **CA-5:** al terminar la cinemática de inicio hay ≥1 agente `infected` dentro del viewport, en 10 lanzamientos sobre epicentros distintos.
- [ ] **CA-6:** los zombies (`infected`) se mueven a 1.25× la velocidad del agente base.
- [ ] **CA-7:** `POST /api/zombie/decide` devuelve `source: "llm"` con `OLLAMA_API_KEY` válida, y `source: "heuristic"` sin key o ante error/timeout. El loop del mapa nunca espera la respuesta.

## Riesgos de producto
- La latencia del LLM puede hacer que la decisión llegue tarde y no se note. Mitigación: pedirla de forma anticipada y caer a la heurística.
- Un MC con muchos escenarios × corridas puede tardar. Mitigación: límites de 8 escenarios y 5000 corridas.

## Preguntas abiertas
- [ ] `OLLAMA_API_KEY` para verificar CA-7 con el modelo real (pendiente del usuario).

## Referencias
- **TRD:** `.aos/specs/001-mc-multi-escenario-y-comportamiento-de-zombies.trd.md`
- **Plan:** `.aos/plans/active/002-mc-multi-escenario-y-comportamiento-de-zombies.md`
