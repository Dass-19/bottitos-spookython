---
name: semgrep-scan
description: "Análisis estático de seguridad (SAST) con Semgrep; soporta --dry-run si no está instalado."
---
<!-- DASS-AOS-GENERATED: aos adapt-native antigravity desde .aos/skills/specs/semgrep-scan.md (+ .local.md). No editar -->

# Skill: semgrep-scan

> SAST con Semgrep. Soporta modo dry-run para no romper flujos locales cuando la herramienta no está instalada.

## Comando
```bash
aos scan --tool semgrep [--dry-run]
# O con CLI instalado:
aos scan --tool semgrep [--dry-run]
```

## Exit codes
- 0 → Limpio, modo dry-run, o solo advertencias
- 1 → Hallazgos HIGH/CRITICAL (modo real)
- 2 → Error en ejecución de herramienta
