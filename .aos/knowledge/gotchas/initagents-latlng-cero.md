---
id: 202610281200
title: Tras initAgents() los agentes tienen lat/lng = 0 hasta el primer frame
severity: medium
tags: [frontend, engine.js, paciente-cero]
---

- **Síntoma:** al lanzar el brote, a veces no se veía ningún infectado al cerrar la cinemática. Con el código anterior, 1 de 8 epicentros mostraba zombie en cuadro.
- **Causa raíz:**
  - `startOutbreakSequence` elegía el último agente cuya ruta contenía el epicentro, que podía estar a kilómetros.
  - Hacía `flyTo` al nodo, no al agente.
  - Las coordenadas `a.lat/a.lng` solo se calculan en `updateAndRender()`, así que justo después de `initAgents()` valen 0 y no sirven para medir distancias.
- **Resolución:**
  - `pickPatientZero()` calcula la posición con `getPosAtDist(routeKey, posMeters)` y elige al no inmune más cercano.
  - `flyTo` va a su posición.
  - Hay una gracia `invulnTimer` que solo corre fuera de la cinemática.
  - Al cerrar la cinemática se re-selecciona y se hace `panTo` si hace falta.
- **Prevención:** no leer `a.lat/a.lng/a.screenX` de agentes recién creados; usar `getPosAtDist`.
