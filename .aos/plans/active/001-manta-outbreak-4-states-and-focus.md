---
id: 202610270806
type: plan
status: active
priority: high
tags: [plan/feature]
created: 2026-10-27
---

# Plan: Feature — manta-outbreak-4-states-and-focus

> Objetivo (Definition of Done): Implementar 4 estados de entidades (Humano, Mordido/Incubando, Infectado/Zombie, Inmune), escenario realista con recursos limitados (munición, antídotos), arranque desde cero con selección de epicentro y animación de mutación del Paciente Cero, menú contextual con clic derecho para enfocar con zoom animado, y parametrización funcional de los controles.

## Contexto y Archivos Afectados
- Archivos modificados:
  - `index.html`: HUD de 4 entidades, contadores de recursos limitados, panel de parametrización pre-brote, menú contextual y overlay cinemático de Paciente Cero.
  - `css/arcade.css`: Estilos para menú contextual, overlay cinemático, retícula de rastreo, auras de mordido e inmune.
  - `js/sprites.js`: Motores gráficos Chibi y Micro-sprites para Humano, Mordido, Infectado e Inmune, además de partículas de mutación y escudo inmune.
  - `js/audio.js`: Síntesis de efectos de tos, rugido de transformación y deflexión inmune.
  - `js/engine.js`: Lógica de simulación SEIR desde cero, cinemática de Paciente Cero, clic derecho "Enfocar", límites de munición y antídoto, y cálculo en vivo por parroquias.
- DASS-AOS:
  - Inicializado con `aos init antigravity`.
  - `.aos/`, `.gitignore` y `GEMINI.md` configurados.

## Fases de Ejecución Atómica

- [x] Fase 1: Discovery & requisitos
  - Revertir commit no autorizado inmediatamente (`git reset HEAD~1`).
  - Identificar repositorio DASS-AOS (`https://github.com/Dass-19/dass-aos`) e inicializarlo con `aos init antigravity`.
  - Definir las 4 entidades: Humano, Mordido (incubando con temporizador y síntomas), Infectado (zombie activo), Inmune (resistente con deflexión).
  - Formalizar recursos finitos (Munición de soldados, Cajas de antídoto).
  - Diseñar el inicio desde cero con parametrización y cinemática del Paciente Cero.
  - Diseñar menú contextual con clic derecho para "Enfocar" con animación de cámara suave.
  - Gate: Configuración aprobada y documentada.

- [x] Fase 2: Diseño de Sprites y Recursos
  - Crear renderizado Chibi y Micro-sprites para los 4 estados en `js/sprites.js`.
  - Agregar efectos de sonido para tos, transformación y deflexión en `js/audio.js`.
  - Diseñar overlay cinemático y menú contextual en `css/arcade.css`.
  - Gate: Motores gráficos y estilos listos.

- [x] Fase 3: Implementación del Motor de Simulación (js/engine.js & index.html)
  - Control de inicio desde cero (`state.hasStarted = false`).
  - Panel de parametrización interactivo con selección de epicentro en Manta.
  - Cinemática en 3 fases de la transformación gradual del Paciente Cero.
  - Interacción con clic derecho: menú contextual táctico con opción "Enfocar Sector" (`map.flyTo` suave a 17X).
  - Lógica de combate y contagio:
    * Soldados disparan y gastan munición finita; si se agota, huyen.
    * Zombies muerden a humanos convirtiéndolos en mordidos con cuenta regresiva.
    * Inmunes repelen mordeduras y no se infectan.
    * Lanzamiento de antídoto limitado por existencias de cajas (recargables vía síntesis de laboratorio).
  - Enlace dinámico de todas las variables, sliders, cerco vial y barras de parroquias en vivo.
  - Gate: Sintaxis validada con `node --check`.

- [x] Fase 4: Verificación
  - Pruebas sintácticas de archivos JS (`node --check`).
  - Verificación de no realización de commits sin autorización explícita.
  - Verificación de estado del harness con `aos status`.
  - Gate: Código libre de errores de sintaxis y repositorio en estado limpio para revisión del usuario.

## Registro de Decisiones (Discovery Trail)
- **Decisión 1:** El commit previo fue retirado con `git reset HEAD~1`. No se realizarán commits sin orden expresa del usuario.
- **Decisión 2:** DASS-AOS se inicializó con `aos init antigravity`, generando `.aos/`, `.gitignore` y `GEMINI.md` para ser versionados junto al proyecto.
- **Decisión 3:** Se crearon 4 tipos de entidad bien diferenciados: Humano (sano/combate), Mordido (en proceso de incubación con indicador visual y temporizador), Infectado (zombie agresivo que contagia) e Inmune (protegido contra mordeduras, aporta a la síntesis de la cura).
- **Decisión 4:** Los recursos son estrictamente limitados: munición que se consume con cada disparo y cajas de antídoto finitas que se reabastecen cuando el laboratorio llega al 100%.
- **Decisión 5:** El inicio desde cero incluye una cinemática del Paciente Cero con retícula de satélite y transformación en 3 fases (Síntoma -> Incubación -> Mutación completa).
- **Decisión 6:** El clic derecho abre un menú táctico con la opción "Enfocar Sector", que realiza un vuelo animado (`flyTo`) a zoom 17 para inspeccionar los micro-sprites y sus interacciones.
