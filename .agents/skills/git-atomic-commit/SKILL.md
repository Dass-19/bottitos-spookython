---
name: git-atomic-commit
description: "Crea commits atómicos con Conventional Commits y lista explícita de archivos; nunca git add -A."
---
<!-- DASS-AOS-GENERATED: aos adapt-native antigravity desde .aos/skills/specs/git-atomic-commit.md (+ .local.md). No editar -->

# Skill: git-atomic-commit

> Crea commits atómicos verificados con Conventional Commits exigiendo la lista explícita de archivos afectados. Nunca usa `git add -A`.

## Comando
```bash
python .aos/skills/bin/git_atomic_commit.py -m "feat(auth): add token verification" -f src/auth.py src/tokens.py
```
