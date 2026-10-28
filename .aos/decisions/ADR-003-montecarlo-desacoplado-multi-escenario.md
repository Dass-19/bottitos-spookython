---
id: 202610281110
type: decision
status: vigente
created: 2026-10-28
---

# ADR-003: Monte Carlo desacoplado del mapa, multi-escenario con parámetros en rango

> Decision: El Monte Carlo deja de dispararse desde `/api/sim/launch` y pasa a ejecutarse solo bajo demanda vía `POST /api/montecarlo/run`, con N escenarios cuyos parámetros pueden ser fijos o rangos `{min, max}` muestreados por corrida. Actualiza la sección de consecuencias de ADR-002 que lo describía como disparado por el mapa; la separación de escalas de ADR-002 se mantiene. También reemplaza la descripción del dashboard de ADR-002: `frontend/montecarlo.html` es ahora un laboratorio multi-escenario (configurador, comparativa KPI, bandas P5–P95 por escenario, rango del pico, probabilidades y sensibilidad).

## Contexto
- El usuario pidió que el MC funcione aparte de la simulación del mapa y con múltiples escenarios y parámetros posibles (PRD 001, CA-1 y CA-2).
- Un único set fijo de parámetros no muestra la incertidumbre ni permite comparar estrategias.

## Consecuencias
- A favor:
  - comparación entre escenarios;
  - análisis de sensibilidad (Spearman) sobre los parámetros en rango;
  - el mapa no consume CPU con un MC que nadie pidió.
- En contra: el usuario debe configurar escenarios en `/montecarlo`. Se mitiga precargando los presets A/B/C.
- El modelo del MC se alinea con el mapa:
  - el antídoto devuelve a S (no inmuniza);
  - el 15% de los curados (`ceil`) se arma.

## Condiciones de Revocación
Solo puede ser supersedido por otro ADR que lo declare explícitamente.
