---
id: 202610281201
title: El retroceso del zombie contra un inmune causaba oscilación infinita
severity: medium
tags: [frontend, engine.js, combate]
---

- **Síntoma:** zombies "pegados" junto a un inmune.
- **Causa raíz:**
  - Cada intento fallido hacía `a.posMeters -= a.dir * 3.5`.
  - El zombie volvía a avanzar sobre el mismo inmune y repetía el intento cada `vomitCooldown`.
- **Resolución:** `a.triedImmune` (Set por zombie). Un solo intento por inmune, sin retroceso; después se le ignora (incluido `alertTimer`/`facing`).
- **Prevención:** no resolver colisiones moviendo al agente contra su propia dirección de marcha; marcar el par como resuelto.
