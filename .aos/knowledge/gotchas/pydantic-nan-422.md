---
id: 202610281202
title: NaN pasa la validación pydantic y un 422 con NaN da 500
severity: medium
tags: [backend, fastapi, pydantic, validacion]
---

- **Síntoma:**
  - `{"r0": NaN}` en `/api/montecarlo/run` devolvía 200 y luego un error en el hilo, borrando los últimos resultados.
  - `NaN` o `1e400` en campos int de `/api/zombie/decide` daban 500.
- **Causa raíz:**
  - Starlette acepta el literal `NaN`, y los floats pydantic lo admiten por defecto.
  - Toda comparación con NaN es False, así que `lo > hi` y los límites no lo detectan.
  - El 422 por defecto incluye `input`, y `JSONResponse` (`allow_nan=False`) no puede serializarlo.
- **Resolución:** `model_config = ConfigDict(allow_inf_nan=False)` en los modelos con floats y un handler de `RequestValidationError` que no hace eco de `input` (`backend/main.py`).
- **Prevención:** todo modelo con floats en una frontera lleva `allow_inf_nan=False`.
