---
name: memory-refresh
description: "Refresco de inicio de sesión (aos refresh): gotchas recientes, estado de codebase-memory y siguiente tarea del plan activo."
---
<!-- DASS-AOS-GENERATED: aos adapt-native antigravity desde .aos/skills/specs/memory-refresh.md (+ .local.md). No editar -->

# Skill: memory-refresh

> Ejecutado obligatoriamente al inicio de cada sesión (ver hooks/session-start.md).  
> Consulta el estado de `codebase-memory`, lista los gotchas más recientes, las especificaciones abiertas (PRD/TRD), las últimas lecciones del LEDGER y la siguiente tarea del plan activo.

## Comando
```bash
aos refresh [--gotchas-limit 5]
```
