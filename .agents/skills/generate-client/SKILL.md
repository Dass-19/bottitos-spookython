---
name: generate-client
description: "Genera clientes tipados a partir de los contratos OpenAPI de .aos/contracts/http/."
---
<!-- DASS-AOS-GENERATED: aos adapt-native antigravity desde .aos/skills/specs/generate-client.md (+ .local.md). No editar -->

# Skill: generate-client

> Genera clientes tipados a partir de contratos OpenAPI.  
> Stack-agnóstico con soporte para TypeScript, Python, Go, Java, o stubs documentados.

## Generadores soportados
- `openapi-typescript` → TypeScript types (`schema.d.ts`) + client stub
- `datamodel-codegen` → Python (modelos Pydantic)
- `openapi-generator` → Multi-lenguaje (`typescript-fetch`, `python`, `go`, etc.)
- `generic` → Valida presencia del contrato y emite README con instrucciones

## Comando
```bash
aos generate-client \
  --contract ".aos/contracts/http/example.yaml" \
  --output "./src/api/generated" \
  --generator openapi-typescript
```

## Cuándo usar
Inmediatamente después de crear o modificar cualquier contrato HTTP, antes de escribir código manual.
