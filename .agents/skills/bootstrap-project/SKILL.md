---
name: bootstrap-project
description: "Inicializa DASS-AOS en un repositorio (aos init): estructura .aos/ e instrucciones de agentes sincronizadas."
---
<!-- DASS-AOS-GENERATED: aos adapt-native antigravity desde .aos/skills/specs/bootstrap-project.md (+ .local.md). No editar -->

# Skill: bootstrap-project

> Inicializa DASS-AOS en cualquier repositorio para las herramientas de IA que se usan: crea `.aos/`, el archivo de instrucciones de cada herramienta (y nada más) y, para `claude-code` y `antigravity`, sus nativos.

## Comando
```bash
aos init [<herramienta>...] [--project-root <path>] [--project-name <name>]
# herramientas: claude-code, antigravity, gemini-cli, codex, opencode, cursor, windsurf
```
- Sin herramienta: usa las de `.aos/config.json` o las que detecta en el repo; si no hay ninguna, falla sin escribir nada.
- Ejecutarlo otra vez con otra herramienta la añade a `.aos/config.json` (`"tools"`).
- Los hooks de inicio de sesión quedan pendientes: revísalos y aplícalos con `aos adapt-native <herramienta> --yes`.
