---
name: arcade-design
description: "Guía y sistema de diseño Arcade Metal Slug: componentes UI, paleta táctica militar (camo, ámbar fósforo, cian radar, rojo biohazard), tipografías pixel/heavy, efectos CRT scanlines, botones biselados, modales de despliegue y micro-sprites. Úsala para crear o modificar interfaces, paneles y widgets con estética arcade armoniosa y limpia basada en css/arcade.css."
---

# Skill: arcade-design

> **Propósito**: Proporcionar el sistema de diseño visual, componentes reutilizables y directrices estéticas para mantener el estilo **Arcade Táctico Metal Slug** con **armonía visual**, evitando el ruido gráfico excesivo y manteniendo el mapa o canvas como protagonista principal.
>
> **Fuente de verdad CSS**: [`css/arcade.css`](file:///c:/Users/usuario/Desktop/bottitos-spookython/css/arcade.css)

---

## 1. Principios del Sistema de Diseño

1. **El Mapa es el Protagonista (75% - 85% del Viewport)**:
   - La visualización geográfica y el canvas de entidades dominan la pantalla.
   - Los controles y telemetría flotan sobre docks o barras delgadas de cristal táctico (`glass-panel`).
2. **Arcade sin Ruido Visual**:
   - Evitar bordes gigantescos, remaches falsos excesivos o texturas pesadas que resten legibilidad o espacio.
   - En su lugar, usar **glassmorphism táctico militar**: fondos oscuros degradados, desenfoque de fondo (`backdrop-filter: blur(8px)`), bordes sutiles con acentos de color y esquinas ligeramente redondeadas (`rounded-md`).
3. **Jerarquía Cromática Táctica**:
   - **Verde Esmeralda (`#10b981`, `#059669`)**: Tropas regulares (Regular Army), humanos sanos, operaciones seguras, botón de confirmación.
   - **Ámbar Fósforo / Oro (`#facc15`, `#d97706`)**: Títulos de misión, puntuación 1UP, sujetos incubando/mordidos, botones de acción primaria.
   - **Cian Radar (`#38bdf8`, `#06b6d4`)**: Rutas viales, telemetría técnica, retículas de selección, menú contextual de enfoque.
   - **Rojo Biohazard (`#ef4444`, `#dc2626`)**: Infectados / zombis activos, cuarentena, botón de purga, estados críticos.
   - **Pizarra Obsidiana (`#090e12`, `#0d141b`, `#131b22`)**: Fondo base de pantallas y paneles para máximo contraste.
4. **Respuesta Táctil & Sonora (SFX)**:
   - Cada botón arcade tiene transiciones de hover (`translateY(-1px)`, incremento de glow) y active (`translateY(1px)`).
   - Complementar siempre con eventos de audio mediante el objeto global `SFX` (`sfx.button()`, `sfx.alarm()`, etc.).

---

## 2. Tipografías Oficiales

Se deben cargar e importar en el `<head>` del HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Chakra+Petch:wght@400;600;700&family=JetBrains+Mono:wght@400;700&family=Press+Start+2P&family=Russo+One&display=swap" rel="stylesheet">
```

| Uso | Fuente | Clase / Estilo | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Título de Cabecera Arcade** | `Black Ops One` | `.arcade-title` | Gradiente oro a naranja con drop-shadow neón |
| **Encabezados Militares & Botones** | `Russo One` | `font-['Russo_One']` o `font-heavy` | Etiquetas de botones, títulos de paneles |
| **Telemetría Digital & Contadores** | `JetBrains Mono` | `.font-led` o `font-mono` | Días transcurridos, ratio SEIR, puntuación |
| **Labels Tácticos, Badges y Menús** | `Chakra Petch` | `font-['Chakra_Petch']` | Menú contextual, chips de telemetría |
| **Sellos 8-Bit y Retro Accents** | `Press Start 2P` | `font-['Press_Start_2P']` | Sellos "1UP", "DAY 0", badges de bajas |

---

## 3. Clases de Componentes en `css/arcade.css`

### A. Paneles de Cristal Táctico (`.glass-panel`)

Reemplazan los marcos pesados de metal por cristal oscuro translúcido con brillo de borde esmeralda.

```html
<!-- Panel estándar para barras y sidebars -->
<div class="glass-panel p-3 rounded-lg flex flex-col gap-2">
  <span class="text-xs font-['Russo_One'] text-amber-300">ESTADO DE OPERACIÓN</span>
  <p class="text-[11px] text-slate-300 font-['Chakra_Petch']">Contenido informativo táctico...</p>
</div>

<!-- Panel secundario más sutil para sub-tarjetas o celdas de telemetría -->
<div class="glass-panel-subtle p-2 rounded flex items-center justify-between">
  <span class="text-[10px] text-slate-400">AMUNICIÓN DISPONIBLE:</span>
  <span class="font-led text-cyan-400 font-bold">120 RDS</span>
</div>
```

### B. Botones Arcade Biselados (`.btn-arcade-*`)

Poseen efecto de bisel 3D, gradiente de color brillante y sombra de resplandor.

```html
<!-- Botón Dorado / Acción Primaria o Misión -->
<button class="btn-arcade-gold px-4 py-2 rounded text-xs">
  ★ INICIAR SIMULACIÓN
</button>

<!-- Botón Verde / Tropas & Seguridad -->
<button class="btn-arcade-green px-3 py-1.5 rounded text-[10px]">
  DESPLEGAR REFUERZOS
</button>

<!-- Botón Rojo / Alerta Crítica & Cuarentena -->
<button class="btn-arcade-red px-3 py-1.5 rounded text-[10px]">
  ACTIVAR CUARENTENA
</button>

<!-- Botón Pizarra / Selectores Secundarios & Toggles -->
<button class="btn-arcade-dark px-2.5 py-1 rounded text-[9px]">
  SATÉLITE 2D
</button>
```

### C. Menú Contextual Flotante (Click Derecho en Mapa)

Desplegado en el evento `contextmenu` del mapa para enfocar la cámara o interactuar:

```html
<div id="map-context-menu">
  <div class="context-menu-item" onclick="focusOnCoordinates()">
    <span class="text-cyan-400">⊕</span> ENFOCAR SECTOR (ZOOM 17X)
  </div>
  <div class="context-menu-item" onclick="setContextEpicenter()">
    <span class="text-red-400">☠</span> FIJAR EPICENTRO AQUÍ
  </div>
  <div class="context-menu-item" onclick="deployContextAirdrop()">
    <span class="text-emerald-400">📦</span> LANZAR ANTÍDOTO
  </div>
</div>
```

```javascript
// Manejador en Leaflet
map.on('contextmenu', function(e) {
  L.DomEvent.preventDefault(e);
  contextCoordinates = e.latlng;
  const menu = document.getElementById('map-context-menu');
  menu.style.display = 'block';
  menu.style.left = `${e.containerPoint.x}px`;
  menu.style.top = `${e.containerPoint.y}px`;
});
```

### D. Overlay CRT y Efectos de Atmósfera

* **`.crt-overlay`**: Capa superior fija con `pointer-events: none` que dibuja scanlines oscuras a intervalos de 3px para dar textura de monitor de cabina arcade.
* **`.cinematic-overlay`**: Viñeta radial oscura para el momento de transformación del Paciente Cero.
* **`.target-reticle`**: Retícula circular giratoria de borde discontinuo rojo (`#ef4444`) que se centra sobre la entidad seleccionada.
* **`.pulse-alert`**: Parpadeo suave para advertencias biológicas activas.

```html
<!-- CRT Scanlines globales sobre toda la app -->
<div class="fixed inset-0 crt-overlay z-40"></div>

<!-- Retícula de objetivo para cinemática -->
<div class="target-reticle" style="left: 50%; top: 50%;"></div>
```

---

## 4. Los 4 Estados de Entidades y Micro-Sprites Metal Slug

Al renderizar agentes o presentar métricas en la interfaz, respetar siempre la paleta y los 4 estados biológicos:

| Estado | Significado Clínico | Color Hex | Micro-Sprite / Equipo |
| :--- | :--- | :--- | :--- |
| **Humano** | Regular Army sano en patrulla | `#10b981` (Verde) | Uniforme militar, arma reglamentaria, chaleco del héroe |
| **Mordido** | Fase de incubación viral latente | `#f59e0b` (Ámbar) | Camuflaje oscureciéndose, venas visibles, aura ámbar |
| **Infectado** | Zombi activo transmisor | `#ef4444` (Rojo) | Piel pálida/morada, ojos rojos, vómito biológico, ropa rota |
| **Inmune** | Resistente natural al patógeno | `#38bdf8` (Cian) | Aura cian, uniforme de combate especializado con insignia |

### Rostro de Héroes Metal Slug
En [`js/sprites.js`](file:///c:/Users/usuario/Desktop/bottitos-spookython/js/sprites.js), se implementa `HERO_ROSTER` para diferenciar los 6 personajes icónicos incluso cuando son zombis o están mordidos:
1. **Marco Rossi**: Cabello rubio claro, bandana blanca militar.
2. **Tarma Roving**: Cabello castaño corto, gafas de sol tácticas negras.
3. **Eri Kasamoto**: Cabello rubio recogido con bandana verde oliva.
4. **Fio Germi**: Cabello castaño, boina marrón y anteojos de armazón redondo.
5. **Clark Still**: Boina azul marino del ejército y gafas de sol oscuras.
6. **Ralf Jones**: Cabello negro con bandana roja de combate.

---

## 5. Patrón de Layout Táctico Recomendado

```
+-------------------------------------------------------------------------+
| HEADER TÁCTICO (h-12): Título Arcade, 1UP Score, LED Reloj, SFX Toggle  |
+---------------------------------------------------+---------------------+
|                                                   | SIDEBAR DOCK (300px)|
|                  VIEWPORT MAPA                    | [Tab: Logística]    |
|               (Leaflet + Canvas)                  | [Tab: Control]      |
|                                                   | [Tab: Sectores]     |
|   - Nodos viales 100% terrestres                  |                     |
|   - Líneas punteadas cian sobre avenidas          | Paneles de vidrio   |
|   - Micro-sprites a Zoom >= 15x                   | con telemetría      |
|   - Radar Chibi a Zoom < 15x                      | y sliders arcade    |
|                                                   |                     |
+---------------------------------------------------+---------------------+
```

---

## 6. Checklist de Verificación de Armonía Visual

Al diseñar o modificar interfaces bajo este estilo, auditar:
- [ ] **¿El mapa ocupa al menos el 75% del ancho de la pantalla?** No permitir que las barras laterales ahoguen el viewport.
- [ ] **¿Los overlays decorativos tienen `pointer-events: none`?** El usuario siempre debe poder hacer click, arrastrar y enfocar el mapa sin bloqueos.
- [ ] **¿Los botones usan las clases `.btn-arcade-*` en vez de estilos planos genéricos?**
- [ ] **¿Las etiquetas numéricas usan `.font-led` con espaciado monoespaciado?**
- [ ] **¿Ningún camino o nodo cruza por el mar o zonas no transitables?** (Garantía de realismo terrestre).
- [ ] **¿Se mantiene el contraste de accesibilidad?** Textos de datos siempre en colores de alta legibilidad (`#f8fafc`, `#34d399`, `#38bdf8`, `#fbbf24`), nunca grises oscuros sobre negro.
