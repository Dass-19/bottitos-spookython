// ==========================================================================
// MantaZero: Epidemic Command // MAIN SIMULATION & COMBAT ENGINE (4 STATES + REAL RESOURCES)
// ==========================================================================

(function initMetalSlugEngine() {
  const config = window.MANTA_CONFIG;
  const sprites = window.MANTA_SPRITES;
  const sfx = window.SFX;
  const rawRoutes = window.MANTA_STREET_ROUTES || {};

  // Python Backend API Connector (FastAPI /api/*) & State Synchronization
  async function syncBackend(endpoint, payload = null) {
    try {
      const opts = payload
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        : { method: 'GET' };
      const res = await fetch(endpoint, opts);
      if (res.ok) return await res.json();
    } catch (_) {
      // Fallback silencioso si se abre sin servidor activo
    }
    return null;
  }

  function applyBackendState(srvState) {
    if (!srvState) return;
    if (typeof srvState.totalPop === 'number') state.totalPop = srvState.totalPop;
    if (typeof srvState.healthy === 'number') state.healthy = srvState.healthy;
    if (typeof srvState.bitten === 'number') state.bitten = srvState.bitten;
    if (typeof srvState.infected === 'number') state.infected = srvState.infected;
    if (typeof srvState.immune === 'number') state.immune = srvState.immune;
    if (typeof srvState.recovered === 'number') state.recovered = srvState.recovered;
    if (typeof srvState.deaths === 'number') state.deaths = srvState.deaths;
    if (typeof srvState.ammo === 'number') state.ammo = srvState.ammo;
    if (typeof srvState.maxAmmo === 'number') state.maxAmmo = srvState.maxAmmo;
    if (typeof srvState.cureCrates === 'number') state.cureCrates = srvState.cureCrates;
    if (typeof srvState.cureProgress === 'number') state.cureProgress = srvState.cureProgress;
    if (typeof srvState.score === 'number') state.score = srvState.score;
    if (typeof srvState.day === 'number') state.day = srvState.day;
    if (typeof srvState.hour === 'number') state.hour = srvState.hour;
    if (typeof srvState.minute === 'number') state.minute = srvState.minute;
    if (typeof srvState.r0 === 'number') state.r0 = srvState.r0;
  }

  // Simulation Game State
  const state = {
    hasStarted: false,
    armedCount: 20,
    mcSeed: 42,
    isTransforming: false,
    isRunning: true,
    speed: 1,
    score: 0,
    credits: 4,
    day: 0,
    hour: 0,
    minute: 0,
    isNight: false,
    isCarnaval: true,
    cercoVial: false,
    activeEpicenter: 'Tarqui',
    currentScenario: 'A',
    distributionPriority: 'med',
    tileLayerName: 'dark',
    cureProgress: 0.0,
    cureEtaDays: 30,
    
    // Agentes en el mapa y Modelo SEIR local (en contraste directo con los agentes activos)
    totalPop: 95,
    healthy: 87,
    bitten: 0,
    infected: 0,
    immune: 8,
    recovered: 0,
    deaths: 0,
    r0: 3.82,

    // Limited Resources
    ammo: 800,
    maxAmmo: 800,
    cureCrates: 3,

    // Configurable Parameters
    agentCount: 95,
    immunityRate: 0.08,
    incubationSeconds: 8.0,

    // Entities & VFX
    agents: [],
    particles: []
  };

  // Precompute distances & topological connections for street navigation
  const routeData = {};
  const nodeToRoutes = {};
  Object.keys(config.nodes).forEach(k => { nodeToRoutes[k] = []; });

  Object.keys(config.routePairs).forEach(rKey => {
    const [nA, nB] = config.routePairs[rKey];
    const pts = rawRoutes[rKey] || [
      [config.nodes[nA].lat, config.nodes[nA].lng],
      [config.nodes[nB].lat, config.nodes[nB].lng]
    ];

    const cumDists = [0];
    let totalDist = 0;
    for (let i = 1; i < pts.length; i++) {
      totalDist += config.haversine(pts[i - 1], pts[i]);
      cumDists.push(totalDist);
    }
    routeData[rKey] = { pts, cumDists, totalDist, nodeA: nA, nodeB: nB };

    if (!nodeToRoutes[nA]) nodeToRoutes[nA] = [];
    if (!nodeToRoutes[nB]) nodeToRoutes[nB] = [];
    nodeToRoutes[nA].push({ route: rKey, at: 'nodeA' });
    nodeToRoutes[nB].push({ route: rKey, at: 'nodeB' });
  });

  // Exact position lookup along real curved road
  function getPosAtDist(rKey, dist) {
    const rd = routeData[rKey];
    if (!rd) return { lat: config.center[0], lng: config.center[1], angle: 0 };
    dist = Math.max(0, Math.min(rd.totalDist, dist));
    const cd = rd.cumDists;
    let low = 0, high = cd.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (cd[mid] <= dist) low = mid + 1;
      else high = mid - 1;
    }
    const i = Math.max(0, high);
    if (i >= rd.pts.length - 1) {
      const p = rd.pts[rd.pts.length - 1];
      return { lat: p[0], lng: p[1], angle: 0 };
    }
    const segDist = cd[i + 1] - cd[i];
    const t = segDist > 0 ? (dist - cd[i]) / segDist : 0;
    const p0 = rd.pts[i];
    const p1 = rd.pts[i + 1];
    const lat = p0[0] + (p1[0] - p0[0]) * t;
    const lng = p0[1] + (p1[1] - p0[1]) * t;
    const angle = Math.atan2(p1[0] - p0[0], (p1[1] - p0[1]) * Math.cos(p0[0] * Math.PI / 180));
    return { lat, lng, angle };
  }

  // 1. INITIALIZE LEAFLET MAP
  const map = L.map('osm-map', {
    center: config.center,
    zoom: 14,
    minZoom: 11,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: true
  });

  // Tile layers (Táctico Oscuro & Satélite 2D)
  const tileLayers = {
    dark: L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; DeLorme, NAVTEQ',
        maxNativeZoom: 16,
        maxZoom: 19
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxNativeZoom: 16,
        maxZoom: 19
      })
    ]),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP',
      maxNativeZoom: 18,
      maxZoom: 19
    })
  };
  tileLayers.dark.addTo(map);

  window.setTileLayer = function(layerKey) {
    Object.keys(tileLayers).forEach(k => map.removeLayer(tileLayers[k]));
    tileLayers[layerKey].addTo(map);
    state.tileLayerName = layerKey;

    const btnDark = document.getElementById('slug-layer-dark');
    const btnSat = document.getElementById('slug-layer-satellite');
    if (layerKey === 'dark') {
      if (btnDark) btnDark.className = "btn-slug-green px-2.5 py-1 text-[9px] rounded text-black font-heavy";
      if (btnSat) btnSat.className = "btn-slug-dark px-2.5 py-1 text-[9px] rounded text-slate-300 font-heavy";
    } else {
      if (btnSat) btnSat.className = "btn-slug-green px-2.5 py-1 text-[9px] rounded text-black font-heavy";
      if (btnDark) btnDark.className = "btn-slug-dark px-2.5 py-1 text-[9px] rounded text-slate-300 font-heavy";
    }
  };

  // Road polylines
  const roadPolylines = [];
  function drawRoadPolylines() {
    Object.keys(routeData).forEach(rKey => {
      const rd = routeData[rKey];
      const poly = L.polyline(rd.pts, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.75,
        dashArray: '8, 6'
      }).addTo(map);
      roadPolylines.push(poly);
    });
  }
  drawRoadPolylines();

  // Contagion biohazard circles
  const contagionCircles = {};
  function setupContagionCircles() {
    Object.keys(config.nodes).forEach(key => {
      const node = config.nodes[key];
      const isEpicenter = (key === state.activeEpicenter);
      const radius = isEpicenter ? 600 : 300;
      const circle = L.circle([node.lat, node.lng], {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: isEpicenter ? 0.25 : 0.08,
        radius: radius,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);
      contagionCircles[key] = circle;
    });
  }
  setupContagionCircles();

  // Landmark markers
  const nodeMarkers = {};
  function setupNodeMarkers() {
    Object.keys(config.nodes).forEach(key => {
      const node = config.nodes[key];
      const isEpicenter = (key === state.activeEpicenter);

      const customIcon = L.divIcon({
        className: 'manta-node-icon',
        html: `
          <div class="flex flex-col items-center cursor-pointer group" onclick="inspectLandmark('${key}'); SFX.alarm();">
            <div class="px-2 py-0.5 rounded border-2 ${isEpicenter ? 'bg-red-950 border-red-500 text-red-300' : 'bg-[#141e17] border-[#4b5e4e] text-amber-300 shadow-md'} font-heavy text-[8px] whitespace-nowrap flex items-center gap-1">
              <span>${isEpicenter ? '☠ ' : '★ '}${node.name}</span>
            </div>
          </div>
        `,
        iconSize: [110, 32],
        iconAnchor: [55, 16]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        inspectLandmark(key);
        sfx.button();
      });
      nodeMarkers[key] = marker;
    });
  }
  setupNodeMarkers();

  // Map Zoom Telemetry & Live Render Mode Badge
  function updateZoomTelemetry() {
    const z = map.getZoom();
    const el = document.getElementById('slug-map-zoom');
    if (el) el.innerText = `${z}X`;

    const badge = document.getElementById('zoom-badge-indicator');
    if (badge) {
      if (z >= 15) {
        badge.innerHTML = `<span class="text-emerald-400 font-bold animate-pulse">★ MICRO-SPRITES METAL SLUG [${z}X]</span>`;
      } else {
        badge.innerHTML = `<span class="text-cyan-400">RADAR TÁCTICO [${z}X]</span>`;
      }
    }
  }
  map.on('zoomend', updateZoomTelemetry);
  updateZoomTelemetry();

  // 2. RIGHT-CLICK CONTEXT MENU HANDLING
  let contextCoordinates = null;
  const contextMenuEl = document.getElementById('map-context-menu');

  map.on('contextmenu', function(e) {
    if (L.DomEvent) L.DomEvent.preventDefault(e);
    contextCoordinates = e.latlng;

    if (contextMenuEl) {
      contextMenuEl.style.display = 'block';
      const pt = e.containerPoint;
      const maxX = map.getContainer().clientWidth - 200;
      const maxY = map.getContainer().clientHeight - 130;
      contextMenuEl.style.left = `${Math.min(pt.x, maxX)}px`;
      contextMenuEl.style.top = `${Math.min(pt.y, maxY)}px`;
    }
    sfx.button();
  });

  window.hideContextMenu = function() {
    if (contextMenuEl) contextMenuEl.style.display = 'none';
  };

  map.on('click', window.hideContextMenu);
  map.on('movestart', window.hideContextMenu);

  window.focusOnCoordinates = function() {
    if (!contextCoordinates) return;
    window.hideContextMenu();
    map.flyTo(contextCoordinates, 17, { duration: 1.5, easeLinearity: 0.25 });
  };

  window.setContextEpicenter = function() {
    if (!contextCoordinates) return;
    window.hideContextMenu();

    if (!state.hasStarted) {
      // Find nearest node or set custom
      let nearestKey = 'Tarqui';
      let minDist = 99999;
      Object.keys(config.nodes).forEach(k => {
        const d = config.haversine([contextCoordinates.lat, contextCoordinates.lng], [config.nodes[k].lat, config.nodes[k].lng]);
        if (d < minDist) {
          minDist = d;
          nearestKey = k;
        }
      });
      state.activeEpicenter = nearestKey;
      inspectLandmark(nearestKey);
      window.confirmAndLaunchOutbreak();
    } else {
      // Spawn extra outbreak at point
      spawnZombieAt(contextCoordinates.lat, contextCoordinates.lng);
    }
  };

  window.deployContextAirdrop = function() {
    if (!contextCoordinates) return;
    window.hideContextMenu();
    window.deployCureAirdrop(contextCoordinates);
  };

  function spawnZombieAt(lat, lng) {
    let nearestAgent = null;
    let minDist = 999999;
    state.agents.forEach(a => {
      const d = Math.hypot(a.lat - lat, a.lng - lng);
      if (d < minDist) {
        minDist = d;
        nearestAgent = a;
      }
    });
    if (nearestAgent) {
      nearestAgent.type = 'infected';
      nearestAgent.hp = 8;
      nearestAgent.maxHp = 8;
      nearestAgent.glitchTimer = 30;
      sfx.transformRoar();
      state.particles.push({
        type: 'mutation_burst',
        x: nearestAgent.screenX,
        y: nearestAgent.screenY,
        color: '#dc2626',
        life: 1.0,
        decay: 0.03
      });
      state.infected += 1;
      updateHUD();
    }
  }

  // 3. CANVAS & METAL SLUG DOM SPRITE LAYER SETUP
  const canvas = document.getElementById('agent-canvas');
  const ctx = canvas.getContext('2d');
  const domLayer = document.getElementById('agent-dom-layer');
  const agentDoms = {};

  // SEIR Model Sprites (Spookython 2026 Track B canonical sprites: Sano, Mordido, Zombie, Exorcizado)
  const SHOWCASE_GIFS = {
    spookython: {
      name: '★ SPOOKYTHON (TRACK B)',
      title: 'Personajes Canónicos SEIR (Sano, Mordido, Zombie, Exorcizado)',
      human: 'assets/sprites/sano.gif',
      bitten: 'assets/sprites/mordido.gif',
      zombie: 'assets/sprites/zombie.gif',
      immune: 'assets/sprites/exorcizado.gif',
      descH: 'Soldadito civil saludando con pañuelo rojo y gorra militar.',
      descB: 'Pálido y temblando con sudor frío, marcas de mordedura sangrante y ojo infectado.',
      descZ: 'Camina arrastrando los pies con costillas expuestas, ropa rasgada y brazos al frente.',
      descI: 'Exorcizado / Inmune: Flota en túnica astral con aureola divina y destellos sagrados.'
    }
  };

  let activeShowcaseHero = 'spookython';

  function getAgentGif(a) {
    if (a.type === 'infected') return 'assets/sprites/zombie.gif';
    if (a.type === 'bitten') return 'assets/sprites/mordido.gif';
    if (a.type === 'immune') return 'assets/sprites/exorcizado.gif';
    return 'assets/sprites/sano.gif';
  }

  function resizeCanvas() {
    const rect = map.getContainer().getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resizeCanvas();
  map.on('resize', resizeCanvas);
  window.addEventListener('resize', () => {
    map.invalidateSize();
    resizeCanvas();
  });
  setTimeout(() => {
    map.invalidateSize();
    resizeCanvas();
  }, 300);

  // Initialize Agents: starts with 0 infected, all humans + immune %
  function initAgents() {
    state.agents = [];
    state.particles = [];
    if (domLayer) domLayer.innerHTML = '';
    Object.keys(agentDoms).forEach(k => delete agentDoms[k]);
    const rKeys = Object.keys(config.routePairs);
    const count = state.agentCount;
    const HERO_KEYS = ['marco', 'tarma', 'eri', 'fio', 'rebel', 'scientist', 'tarman'];

    // Reparto aleatorio (Fisher-Yates) de las personas con armas
    const order = Array.from({ length: count }, (_, k) => k);
    for (let k = order.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [order[k], order[r]] = [order[r], order[k]];
    }
    const armedSet = new Set(order.slice(0, Math.min(state.armedCount, count)));

    for (let i = 0; i < count; i++) {
      const rKey = rKeys[Math.floor(Math.random() * rKeys.length)];
      const rd = routeData[rKey];
      const posMeters = Math.random() * rd.totalDist;
      const dir = Math.random() < 0.5 ? 1 : -1;
      
      // Pre-outbreak state: only Sano (human) and natural Inmune (immune) walk the streets
      let agentType = 'human';
      let incubationTimer = 0;
      const immuneAgents = Math.round(count * state.immunityRate);
      if (i < immuneAgents) {
        agentType = 'immune';   // Exorcizado / Inmune (R)
      } else {
        agentType = 'human';    // Sano (S)
      }

      const heroId = HERO_KEYS[i % HERO_KEYS.length];

      state.agents.push({
        id: i,
        heroId: heroId,
        type: agentType,
        routeKey: rKey,
        posMeters: posMeters,
        dir: dir,
        speedMps: (agentType === 'infected' ? 8.0 : (agentType === 'bitten' ? 6.5 : 12.0)) + Math.random() * 4.0,
        lateralOffsetMeters: (Math.random() - 0.5) * 5.0,
        lat: 0,
        lng: 0,
        screenX: 0,
        screenY: 0,
        facing: 1,
        incubationTimer: incubationTimer,
        incubationMax: state.incubationSeconds * 60,
        glitchTimer: 0,
        animBob: Math.random() * Math.PI * 2,
        animFrame: 0,
        alertTimer: 0,
        shootCooldown: Math.floor(Math.random() * 20),
        isShooting: false,
        targetZombiePos: null,
        vomitCooldown: Math.floor(Math.random() * 20),
        isVomiting: false,
        cureTimer: 0,
        hp: 8,
        maxHp: 8,
        armed: armedSet.has(i),
        isPatientZero: (i === 0)
      });
    }

    // Calculate initial counts for pre-outbreak state (100% en contraste con los agentes del mapa)
    state.totalPop = count;
    state.infected = 0;
    state.bitten = 0;
    const immCount = Math.round(count * state.immunityRate);
    state.immune = immCount;
    state.healthy = count - immCount;
    state.recovered = 0;
    state.deaths = 0;
    state.hasStarted = false;
    const agCountEl = document.getElementById('slug-agent-count');
    if (agCountEl) agCountEl.innerText = String(count);
    updateHUD();
  }
  initAgents();

  // 4. PATIENT ZERO GRADUAL TRANSFORMATION CINEMATIC
  window.startOutbreakSequence = function(epKey) {
    state.activeEpicenter = epKey || state.activeEpicenter;
    const epNode = config.nodes[state.activeEpicenter] || config.nodes.Tarqui;

    // Pick agent closest to epicenter node
    let targetAgent = null;
    let minD = 999999;
    state.agents.forEach(a => {
      if (a.routeKey.includes(state.activeEpicenter)) {
        targetAgent = a;
      }
    });
    if (!targetAgent && state.agents.length > 0) targetAgent = state.agents[0];

    if (!targetAgent) return;
    targetAgent.isPatientZero = true;
    targetAgent.type = 'human';

    // Camera fly to patient zero
    map.flyTo([epNode.lat, epNode.lng], 17, { duration: 1.5 });

    state.isTransforming = true;
    const overlay = document.getElementById('cinematic-overlay');
    const title = document.getElementById('cinematic-title');
    const badge = document.getElementById('cinematic-stage-badge');
    const loc = document.getElementById('cinematic-location');
    const desc = document.getElementById('cinematic-desc');
    const prog = document.getElementById('cinematic-progress');

    if (overlay) overlay.classList.add('active');
    if (loc) loc.innerText = `SECTOR ZERO: ${epNode.name.toUpperCase()}`;

    // STAGE 1: SÍNTOMA (0s - 1.6s)
    if (title) title.innerText = "SATÉLITE REGULAR ARMY // OBJETIVO BLOQUEADO";
    if (badge) badge.innerText = "FASE 1/3: SÍNTOMA CERO";
    if (desc) desc.innerText = "SUJETO LOCAL EXPUESTO A BIOTOXINA DE ORIGEN MARINO...";
    if (prog) prog.style.width = "25%";
    targetAgent.alertTimer = 80;
    sfx.cough();

    // STAGE 2: INCUBACIÓN Y MUTACIÓN CELULAR (1.6s - 3.4s)
    setTimeout(() => {
      if (badge) badge.innerText = "FASE 2/3: INCUBACIÓN VIRAL (MORDIDO)";
      if (desc) desc.innerText = "COLAPSO CELULAR: VENAS OSCURAS Y RIGIDEZ EXTREMA...";
      if (prog) prog.style.width = "65%";
      targetAgent.type = 'bitten';
      targetAgent.glitchTimer = 35;
      sfx.alarm();

      for (let k = 0; k < 6; k++) {
        state.particles.push({
          type: 'bile',
          x: targetAgent.screenX,
          y: targetAgent.screenY - 3,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -1.0 - Math.random(),
          size: 2.2,
          color: '#f59e0b',
          life: 1.0,
          decay: 0.04
        });
      }
    }, 1600);

    // STAGE 3: MUTACIÓN COMPLETA (3.4s - 5.0s)
    setTimeout(() => {
      if (badge) badge.innerText = "FASE 3/3: TRANSFORMACIÓN COMPLETA";
      if (desc) desc.innerText = "¡MUTACIÓN COMPLETA! EL PACIENTE CERO DESPIERTA COMO ZOMBI.";
      if (prog) prog.style.width = "100%";

      targetAgent.type = 'infected';
      targetAgent.hp = 8;
      targetAgent.maxHp = 8;
      targetAgent.glitchTimer = 45;
      sfx.transformRoar();

      // Mutation burst VFX
      for (let k = 0; k < 12; k++) {
        state.particles.push({
          type: 'bile',
          x: targetAgent.screenX,
          y: targetAgent.screenY - 3,
          vx: (Math.random() - 0.5) * 3.5,
          vy: -1.5 - Math.random() * 2.5,
          size: 3.5,
          color: (k % 2 === 0) ? '#84cc16' : '#dc2626',
          life: 1.0,
          decay: 0.03
        });
      }
      state.particles.push({
        type: 'mutation_burst',
        x: targetAgent.screenX,
        y: targetAgent.screenY - 3,
        color: '#dc2626',
        life: 1.0,
        decay: 0.03
      });

      state.hasStarted = true;
      state.infected = 1;
      state.healthy = state.totalPop - state.immune - 1;
      updateHUD();
      updateNewsTicker();

      const simStatus = document.getElementById('slug-sim-status');
      if (simStatus) {
        simStatus.innerText = 'BROTE ACTIVO';
        simStatus.className = 'text-red-500 pulse-alert';
      }
    }, 3400);

    // End cutscene (5.0s)
    setTimeout(() => {
      if (overlay) overlay.classList.remove('active');
      state.isTransforming = false;
    }, 5000);
  };

  // Launch button from Pre-Sim Modal
  window.confirmAndLaunchOutbreak = function() {
    const epSelect = document.getElementById('init-epicenter-select');
    const epVal = epSelect ? epSelect.value : 'Tarqui';

    const agentsSlider = document.getElementById('init-agents-slider');
    if (agentsSlider) state.agentCount = parseInt(agentsSlider.value, 10);

    const armedSlider = document.getElementById('init-armed-slider');
    if (armedSlider) state.armedCount = Math.min(parseInt(armedSlider.value, 10), state.agentCount);
    const seedInput = document.getElementById('init-mc-seed');
    if (seedInput) state.mcSeed = parseInt(seedInput.value, 10) || 42;

    const immuneSlider = document.getElementById('init-immune-slider');
    if (immuneSlider) state.immunityRate = parseInt(immuneSlider.value, 10) / 100;

    const incubSlider = document.getElementById('init-incub-slider');
    if (incubSlider) state.incubationSeconds = parseFloat(incubSlider.value);

    const ammoSelect = document.getElementById('init-ammo-select');
    if (ammoSelect) {
      state.ammo = parseInt(ammoSelect.value, 10);
      state.maxAmmo = state.ammo;
    }

    const cratesSelect = document.getElementById('init-crates-select');
    if (cratesSelect) state.cureCrates = parseInt(cratesSelect.value, 10);

    const carnavalCheck = document.getElementById('init-carnaval-check');
    if (carnavalCheck) state.isCarnaval = carnavalCheck.checked;

    const nightCheck = document.getElementById('init-night-check');
    if (nightCheck && nightCheck.checked !== state.isNight) window.toggleNightCycle();

    const cercoCheck = document.getElementById('init-cerco-check');
    if (cercoCheck && cercoCheck.checked !== state.cercoVial) window.toggleCercoVial();

    // Re-init clean agent population with new settings
    initAgents();

    // Collapse side dock so map takes 100% space during outbreak sequence
    if (typeof window.toggleControlDock === 'function') {
      window.toggleControlDock(true);
    }

    // Hide pre-sim panel if present
    const panel = document.getElementById('pre-sim-panel');
    if (panel) panel.style.display = 'none';

    syncBackend('/api/sim/launch', {
      epicenter: epVal,
      agentCount: state.agentCount,
      armedCount: state.armedCount,
      mcSeed: state.mcSeed,
      immunityRate: state.immunityRate,
      incubationSeconds: state.incubationSeconds,
      ammo: state.ammo,
      cureCrates: state.cureCrates,
      isCarnaval: state.isCarnaval,
      isNight: state.isNight,
      cercoVial: state.cercoVial
    }).then(res => {
      if (res && res.state) applyBackendState(res.state);
    });

    window.startMonteCarloPolling();

    // Start cinematic sequence
    window.startOutbreakSequence(epVal);
  };

  window.triggerMapResize = function() {
    if (map) {
      map.invalidateSize();
    }
    resizeCanvas();
    setTimeout(() => {
      if (map) map.invalidateSize();
      resizeCanvas();
    }, 310);
  };

  window.toggleControlDock = function(forceState) {
    const dock = document.getElementById('tactical-dock');
    const btnText = document.getElementById('btn-toggle-dock-text');
    const btnIcon = document.getElementById('btn-toggle-dock-icon');
    const mapDockBtn = document.getElementById('map-dock-expand-btn');
    if (!dock) return;

    let willCollapse;
    if (typeof forceState === 'boolean') {
      willCollapse = forceState;
    } else {
      willCollapse = !dock.classList.contains('dock-collapsed');
    }

    if (willCollapse) {
      dock.classList.add('dock-collapsed');
      if (btnText) btnText.innerText = 'CONTROLES & PARÁMETROS';
      if (btnIcon) btnIcon.innerText = 'tune';
      if (mapDockBtn) mapDockBtn.classList.remove('hidden');
    } else {
      dock.classList.remove('dock-collapsed');
      if (btnText) btnText.innerText = 'PLEGAR PANELES';
      if (btnIcon) btnIcon.innerText = 'close';
      if (mapDockBtn) mapDockBtn.classList.add('hidden');
    }
    window.triggerMapResize();
  };

  window.toggleBottomControls = function() {
    const bar = document.getElementById('bottom-control-dock');
    const trigger = document.getElementById('bottom-bar-trigger');
    if (!bar) return;

    const isCollapsed = bar.classList.contains('bar-collapsed');
    if (isCollapsed) {
      bar.classList.remove('bar-collapsed');
      if (trigger) trigger.classList.add('hidden');
    } else {
      bar.classList.add('bar-collapsed');
      if (trigger) trigger.classList.remove('hidden');
    }
    window.triggerMapResize();
  };

  window.togglePreSimPanel = function() {
    const panel = document.getElementById('pre-sim-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden') || panel.style.display === 'none';
    if (isHidden) {
      panel.classList.remove('hidden');
      panel.style.display = 'flex';
    } else {
      panel.classList.add('hidden');
      panel.style.display = 'none';
    }
  };

  // 5. ANIMATION & COMBAT LOOP (60 FPS)
  function updateAndRender() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentZoom = map.getZoom();
    const effectiveSpeed = state.speed * (state.isNight ? 0.8 : 1.1) * (state.isCarnaval ? 1.3 : 1.0) * (state.cercoVial ? 0.7 : 1.0);
    const spriteScale = 0.85 + (currentZoom - 14) * 0.42;

    // A. Update Agents along streets
    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      const rd = routeData[a.routeKey];
      if (!rd) continue;

      if (state.isRunning && !state.isTransforming) {
        // Slow down if bitten
        const bittenSpeedFactor = (a.type === 'bitten') ? 0.55 : 1.0;
        a.posMeters += a.dir * a.speedMps * (1 / 60) * effectiveSpeed * 3.8 * bittenSpeedFactor;

        // Intersection transitions (with roadblock check)
        if (a.dir === 1 && a.posMeters >= rd.totalDist) {
          const targetNode = rd.nodeB;
          let conns = (nodeToRoutes[targetNode] || []).filter(c => c.route !== a.routeKey);
          
          // Cerco vial blocks routes towards Montecristi or San Mateo
          if (state.cercoVial) {
            conns = conns.filter(c => !c.route.includes('Montecristi') && !c.route.includes('SanMateo'));
          }

          if (conns.length > 0) {
            const nextConn = conns[Math.floor(Math.random() * conns.length)];
            a.routeKey = nextConn.route;
            const nextRd = routeData[a.routeKey];
            if (nextConn.at === 'nodeA') {
              a.posMeters = 0;
              a.dir = 1;
            } else {
              a.posMeters = nextRd.totalDist;
              a.dir = -1;
            }
          } else {
            // Turn around
            a.dir = -1;
            a.posMeters = rd.totalDist;
          }
        } else if (a.dir === -1 && a.posMeters <= 0) {
          const targetNode = rd.nodeA;
          let conns = (nodeToRoutes[targetNode] || []).filter(c => c.route !== a.routeKey);

          if (state.cercoVial) {
            conns = conns.filter(c => !c.route.includes('Montecristi') && !c.route.includes('SanMateo'));
          }

          if (conns.length > 0) {
            const nextConn = conns[Math.floor(Math.random() * conns.length)];
            a.routeKey = nextConn.route;
            const nextRd = routeData[a.routeKey];
            if (nextConn.at === 'nodeA') {
              a.posMeters = 0;
              a.dir = 1;
            } else {
              a.posMeters = nextRd.totalDist;
              a.dir = -1;
            }
          } else {
            // Turn around
            a.dir = 1;
            a.posMeters = 0;
          }
        }
      }

      // Exact GPS on road + sidewalk offset
      const pos = getPosAtDist(a.routeKey, a.posMeters);
      const perpAngle = pos.angle + Math.PI / 2;
      a.lat = pos.lat + Math.sin(perpAngle) * (a.lateralOffsetMeters / 111139);
      a.lng = pos.lng + Math.cos(perpAngle) * (a.lateralOffsetMeters / (111139 * Math.cos(pos.lat * Math.PI / 180)));

      // Facing direction & stride frame
      const heading = (a.dir === 1) ? pos.angle : (pos.angle + Math.PI);
      a.facing = Math.cos(heading) >= 0 ? 1 : -1;
      a.animBob += 0.22 * effectiveSpeed;
      a.animFrame = Math.floor(a.animBob) % 2;

      // Screen projection
      const pt = map.latLngToContainerPoint([a.lat, a.lng]);
      a.screenX = pt.x;
      a.screenY = pt.y;

      // Handle Incubation timer for Bitten
      if (a.type === 'bitten' && state.isRunning) {
        a.incubationTimer -= 1 * state.speed;
        if (a.incubationTimer <= 0) {
          // Mutate into infected!
          a.type = 'infected';
          a.hp = 8;
          a.maxHp = 8;
          a.glitchTimer = 25;
          sfx.zombieBite();

          state.particles.push({
            type: 'text',
            text: '¡MUTADO!',
            x: a.screenX,
            y: a.screenY - 14,
            color: '#dc2626',
            life: 1.0,
            decay: 0.04
          });

          state.particles.push({
            type: 'mutation_burst',
            x: a.screenX,
            y: a.screenY - 3,
            color: '#dc2626',
            life: 1.0,
            decay: 0.04
          });

          state.bitten = Math.max(0, state.bitten - 1);
          state.infected += 1;
          updateHUD();
        }
      }

      // Decay timers
      if (a.alertTimer > 0) a.alertTimer--;
      if (a.shootCooldown > 0) a.shootCooldown--;
      if (a.shootCooldown < 18) a.isShooting = false;
      if (a.vomitCooldown > 0) a.vomitCooldown--;
      if (a.vomitCooldown < 20) a.isVomiting = false;
      if (a.glitchTimer > 0) a.glitchTimer--;
      if (a.cureTimer > 0) a.cureTimer--;
    }

    // B. Combat Detection & Reactions
    if (state.isRunning && state.hasStarted && !state.isTransforming) {
      for (let i = 0; i < state.agents.length; i++) {
        const a = state.agents[i];
        if (a.screenX < -20 || a.screenX > canvas.width + 20 || a.screenY < -20 || a.screenY > canvas.height + 20) continue;

        // 1. Soldier/Civilian shooting if zombie nearby
        if (a.type === 'human' || a.type === 'immune') {
          let nearestZombie = null;
          let nearestDist = 9999;

          for (let j = 0; j < state.agents.length; j++) {
            const other = state.agents[j];
            if (other.type === 'infected') {
              const d = Math.hypot(a.screenX - other.screenX, a.screenY - other.screenY);
              if (d < nearestDist) {
                nearestDist = d;
                nearestZombie = other;
              }
            }
          }

          if (nearestZombie && nearestDist < 65) {
            a.alertTimer = 16;
            a.facing = (nearestZombie.screenX >= a.screenX) ? 1 : -1;

            if (a.shootCooldown <= 0) {
              if (a.armed && state.ammo > 0) {
                // Shoot weapon & spend ammo
                a.shootCooldown = 28;
                a.isShooting = true;
                state.ammo -= 1;
                updateResourceTelemetry();

                state.particles.push({
                  type: 'tracer',
                  x1: a.screenX + a.facing * 8,
                  y1: a.screenY - 2,
                  x2: nearestZombie.screenX,
                  y2: nearestZombie.screenY - 3,
                  life: 1.0,
                  decay: 0.12,
                  color: '#fef08a'
                });

                state.particles.push({
                  type: 'muzzle',
                  x: a.screenX + a.facing * 8,
                  y: a.screenY - 2,
                  life: 1.0,
                  decay: 0.25
                });

                state.particles.push({
                  type: 'spark',
                  x: nearestZombie.screenX,
                  y: nearestZombie.screenY - 3,
                  life: 1.0,
                  decay: 0.2
                });

                sfx.gunshot();

                // Apply bullet damage: Zombie dies in 8 gunshots
                if (typeof nearestZombie.hp !== 'number') {
                  nearestZombie.hp = 8;
                  nearestZombie.maxHp = 8;
                }
                nearestZombie.hp -= 1;
                syncBackend('/api/sim/combat-hit', { zombieId: nearestZombie.id });
                nearestZombie.glitchTimer = 8;
                nearestZombie.posMeters -= nearestZombie.dir * 0.6;

                if (nearestZombie.hp <= 0) {
                  for (let k = 0; k < 10; k++) {
                    state.particles.push({
                      type: 'blood_stream',
                      x: nearestZombie.screenX,
                      y: nearestZombie.screenY - 6,
                      vx: (Math.random() - 0.5) * 4.5,
                      vy: -1.5 - Math.random() * 2.5,
                      size: 2.5 + Math.random() * 2.0,
                      color: (k % 2 === 0) ? '#dc2626' : '#7f1d1d',
                      life: 1.0,
                      decay: 0.04
                    });
                  }
                  state.particles.push({
                    type: 'text',
                    text: '💀 ¡ZOMBI ABATIDO!',
                    x: nearestZombie.screenX,
                    y: nearestZombie.screenY - 18,
                    color: '#4ade80',
                    life: 1.2,
                    decay: 0.03
                  });

                  if (agentDoms[nearestZombie.id]) {
                    agentDoms[nearestZombie.id].remove();
                    delete agentDoms[nearestZombie.id];
                  }
                  const zIdx = state.agents.indexOf(nearestZombie);
                  if (zIdx !== -1) {
                    state.agents.splice(zIdx, 1);
                    if (zIdx <= i) i--;
                  }

                  state.infected = Math.max(0, state.infected - 1);
                  state.deaths += 1;
                  state.score += 250;
                  const scoreEl = document.getElementById('score-counter');
                  if (scoreEl) scoreEl.innerText = String(state.score).padStart(6, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  const agCountEl = document.getElementById('slug-agent-count');
                  if (agCountEl) agCountEl.innerText = String(state.agents.length);
                  updateHUD();
                  updateParishBars();
                  updateContagionRadius();
                }
              } else {
                // Out of ammo: flee!
                a.dir = (nearestZombie.screenX >= a.screenX) ? -1 : 1;
                a.speedMps = 16.0;
              }
            }
          }
        } 
        // 2. Infected attacking humans / immune
        else if (a.type === 'infected') {
          for (let j = 0; j < state.agents.length; j++) {
            const target = state.agents[j];
            if (target.type === 'human' || target.type === 'immune') {
              const d = Math.hypot(a.screenX - target.screenX, a.screenY - target.screenY);

              if (d < 65) {
                a.alertTimer = 16;
                a.facing = (target.screenX >= a.screenX) ? 1 : -1;
              }

              if (d < 14) {
                if (a.vomitCooldown <= 0) {
                  a.vomitCooldown = 32;
                  a.isVomiting = true;

                  if (target.type === 'immune') {
                    // DEFLECTED BY FIRST-AID IMMUNITY!
                    sfx.deflect();
                    state.particles.push({
                      type: 'text',
                      text: '¡FIRST-AID IMMUNE!',
                      x: target.screenX,
                      y: target.screenY - 14,
                      color: '#facc15',
                      life: 1.0,
                      decay: 0.04
                    });
                    state.particles.push({
                      type: 'shield_wave',
                      x: target.screenX,
                      y: target.screenY - 2,
                      life: 1.0,
                      decay: 0.05
                    });
                    // Push zombie back
                    a.posMeters -= a.dir * 3.5;
                  } else {
                    // BITTEN / ENTERS INCUBATION! (Metal Slug Blood Vomit Attack)
                    sfx.bloodVomit();

                    for (let k = 0; k < 8; k++) {
                      state.particles.push({
                        type: 'blood_stream',
                        x: a.screenX + a.facing * 5,
                        y: a.screenY - 3,
                        vx: a.facing * (2.2 + Math.random() * 3.2),
                        vy: -1.6 - Math.random() * 2.0,
                        size: 2.2 + Math.random() * 2.4,
                        color: (Math.random() < 0.75) ? '#dc2626' : '#991b1b',
                        life: 1.0,
                        decay: 0.05
                      });
                    }

                    target.type = 'bitten';
                    target.incubationTimer = state.incubationSeconds * 60;
                    target.incubationMax = state.incubationSeconds * 60;
                    target.glitchTimer = 25;

                    state.particles.push({
                      type: 'text',
                      text: '¡INCUBANDO VIRUS Z!',
                      x: target.screenX,
                      y: target.screenY - 14,
                      color: '#f59e0b',
                      life: 1.0,
                      decay: 0.04
                    });

                    state.bitten += 1;
                    state.healthy = Math.max(0, state.healthy - 1);
                    state.score += 20;
                    updateHUD();
                  }
                }
              }
            }
          }
        }
      }
    }

    // C. Render Agents (Spookython 2026 High-Definition Animated GIFs)
    if (domLayer) {
      domLayer.style.display = 'block';
    }

    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      if (a.screenX < -60 || a.screenX > canvas.width + 60 || a.screenY < -60 || a.screenY > canvas.height + 60) {
        if (agentDoms[a.id]) agentDoms[a.id].style.display = 'none';
        continue;
      }

      const incPct = (a.incubationMax > 0) ? (1 - (a.incubationTimer / a.incubationMax)) : 0;

      // Spookython Pixel Art Animated GIF Sprite
      let dom = agentDoms[a.id];
      const gifSrc = getAgentGif(a);
      let cssClass = 'slug-dom-agent pixelated';
      if (a.type === 'infected') cssClass += ' agent-infected';
      else if (a.type === 'bitten') cssClass += ' agent-bitten';
      else if (a.type === 'immune') cssClass += ' agent-immune';

      if (!dom && domLayer) {
        dom = document.createElement('div');
        dom.className = cssClass;
        dom.innerHTML = `<img src="${gifSrc}" class="pixelated" style="height: 40px; width: auto;" alt="${a.type}" />`;
        domLayer.appendChild(dom);
        agentDoms[a.id] = dom;
        dom._lastSrc = gifSrc;
        dom._lastType = a.type;
      } else if (dom) {
        dom.style.display = 'block';
        if (dom._lastSrc !== gifSrc) {
          const img = dom.querySelector('img');
          if (img) img.src = gifSrc;
          dom._lastSrc = gifSrc;
        }
        if (dom._lastType !== a.type) {
          dom.className = cssClass;
          dom._lastType = a.type;
        }
      }

      if (dom) {
        const flip = a.facing < 0 ? -1 : 1;
        const scale = Math.min(1.6, Math.max(0.5, 0.85 + (currentZoom - 13) * 0.22));
        dom.style.transform = `translate3d(${Math.round(a.screenX - 18)}px, ${Math.round(a.screenY - 38)}px, 0) scaleX(${flip}) scale(${scale})`;
      }

        // Canvas Overlays for Combat, Vomit & Meters:
        if (a.isVomiting) {
          // Iconic Metal Slug Blood Vomit Cannon Wave
          ctx.save();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(a.screenX + a.facing * 8, a.screenY - 14);
          ctx.quadraticCurveTo(a.screenX + a.facing * 22, a.screenY - 26, a.screenX + a.facing * 34, a.screenY - 4);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(a.screenX + a.facing * 18, a.screenY - 22, 3, 3);
          ctx.fillRect(a.screenX + a.facing * 26, a.screenY - 15, 3.5, 3.5);
          ctx.fillRect(a.screenX + a.facing * 32, a.screenY - 6, 4, 4);

          // Puddle
          ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
          ctx.beginPath();
          ctx.ellipse(a.screenX + a.facing * 32, a.screenY, 5, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (a.type === 'bitten') {
          // Floating Incubation Gauge on canvas
          ctx.save();
          ctx.translate(Math.round(a.screenX), Math.round(a.screenY - 38));
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.fillRect(-12, -4, 24, 6);
          ctx.strokeRect(-12, -4, 24, 6);

          const barW = Math.max(0, Math.min(22, Math.round(22 * incPct)));
          ctx.fillStyle = (incPct > 0.65) ? '#ef4444' : '#f59e0b';
          ctx.fillRect(-11, -3, barW, 4);

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 5px "Russo One", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VIRUS Z', 0, -5);
          ctx.restore();
        }

        if (a.type === 'infected' && typeof a.hp === 'number' && a.hp < (a.maxHp || 8)) {
          // Floating Zombie HP Bar (8 shots to kill)
          const hpPct = Math.max(0, a.hp / (a.maxHp || 8));
          ctx.save();
          ctx.translate(Math.round(a.screenX), Math.round(a.screenY - 38));
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1;
          ctx.fillRect(-12, -4, 24, 5);
          ctx.strokeRect(-12, -4, 24, 5);

          const barW = Math.max(0, Math.min(22, Math.round(22 * hpPct)));
          ctx.fillStyle = (hpPct > 0.4) ? '#ef4444' : '#f97316';
          ctx.fillRect(-11, -3, barW, 3);

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${a.hp}/8`, 0, -5);
          ctx.restore();
        }

        if (a.cureTimer > 0) {
          ctx.save();
          ctx.translate(Math.round(a.screenX), Math.round(a.screenY - 42));
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8px "Russo One", sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText('THANK YOU!', 0, 0);
          ctx.restore();
        }
    }

    // D. Render Particles
    sprites.renderParticles(ctx, state.particles);
  }

  // 6. SIMULATION CLOCK AND TELEMETRY TICK
  let lastTick = Date.now();
  function simLoop() {
    const now = Date.now();
    const delta = now - lastTick;

    if (state.isRunning && state.hasStarted && delta > (500 / state.speed)) {
      lastTick = now;

      syncBackend('/api/sim/tick', {
        infected: state.infected,
        bitten: state.bitten,
        immune: state.immune,
        ammo: state.ammo
      }).then(res => {
        if (res && res.state) {
          applyBackendState(res.state);
          if (res.synthesizedCrate) {
            sfx.cure();
            state.particles.push({
              type: 'text',
              text: '+1 CAJA DE ANTÍDOTO SINTETIZADA',
              x: canvas.width / 2,
              y: 40,
              color: '#facc15',
              life: 1.5,
              decay: 0.02
            });
          }
          const bar = document.getElementById('slug-cure-bar');
          const lbl = document.getElementById('slug-cure-text');
          if (bar) bar.style.width = `${state.cureProgress}%`;
          if (lbl) lbl.innerText = `${state.cureProgress}%`;
          if (res.newDay) {
            updateNewsTicker();
            updateSEIRChart();
          }
          updateHUD();
          updateParishBars();
          updateContagionRadius();
        } else {
          // Offline fallback when opened via file:// without FastAPI server
          state.minute += 10;
          if (state.minute >= 60) {
            state.minute = 0;
            state.hour += 1;
            if (state.hour >= 24) {
              state.hour = 0;
              state.day += 1;
              updateNewsTicker();
              updateSEIRChart();
            }
          }
          if (state.cureProgress < 100) {
            const boost = (state.distributionPriority === 'med' ? 0.12 : 0.07) * (1 + (state.immune / Math.max(1, state.totalPop)) * 5);
            state.cureProgress = Math.min(100, +(state.cureProgress + boost * state.speed).toFixed(1));
            if (state.cureProgress >= 100) {
              state.cureCrates += 1;
              sfx.cure();
              state.cureProgress = 0.0;
            }
            const bar = document.getElementById('slug-cure-bar');
            const lbl = document.getElementById('slug-cure-text');
            if (bar) bar.style.width = `${state.cureProgress}%`;
            if (lbl) lbl.innerText = `${state.cureProgress}%`;
          }
          updateHUD();
          updateParishBars();
          updateContagionRadius();
        }
      });
    }

    updateAndRender();
    requestAnimationFrame(simLoop);
  }

  requestAnimationFrame(simLoop);

  // 7. TELEMETRY & HUD UPDATES (100% EN CONTRASTE CON LOS AGENTES DEL MAPA)
  function updateHUD() {
    if (state.agents && state.agents.length > 0) {
      let h = 0, b = 0, inf = 0, imm = 0;
      for (let k = 0; k < state.agents.length; k++) {
        const t = state.agents[k].type;
        if (t === 'infected') inf++;
        else if (t === 'bitten') b++;
        else if (t === 'immune') imm++;
        else h++;
      }
      state.healthy = h;
      state.bitten = b;
      state.infected = inf;
      state.immune = imm;
      state.totalPop = state.agents.length;
    }

    const denom = Math.max(1, state.totalPop);
    const hEl = document.getElementById('metric-healthy');
    const hPct = document.getElementById('metric-healthy-pct');
    const bEl = document.getElementById('metric-bitten');
    const bPct = document.getElementById('metric-bitten-pct');
    const iEl = document.getElementById('metric-infected');
    const iPct = document.getElementById('metric-infected-pct');
    const mEl = document.getElementById('metric-immune');
    const mPct = document.getElementById('metric-immune-pct');
    const agCountEl = document.getElementById('slug-agent-count');

    if (agCountEl) agCountEl.innerText = String(state.totalPop);

    if (hEl) hEl.innerText = String(state.healthy);
    if (hPct) hPct.innerText = `${((state.healthy / denom) * 100).toFixed(1)}%`;

    if (bEl) bEl.innerText = String(state.bitten);
    if (bPct) bPct.innerText = `${((state.bitten / denom) * 100).toFixed(1)}%`;

    if (iEl) iEl.innerText = String(state.infected);
    if (iPct) iPct.innerText = `${((state.infected / denom) * 100).toFixed(1)}%`;

    if (mEl) mEl.innerText = String(state.immune);
    if (mPct) mPct.innerText = `${((state.immune / denom) * 100).toFixed(1)}%`;

    updateResourceTelemetry();
  }

  function updateResourceTelemetry() {
    const ammoEl = document.getElementById('metric-ammo');
    const ammoStatus = document.getElementById('metric-ammo-status');
    const cratesEl = document.getElementById('metric-cure-crates');
    const lblAmmoStock = document.getElementById('lbl-ammo-stock');
    const lblCrateStock = document.getElementById('lbl-crate-stock');
    const btnCrateCount = document.getElementById('btn-crate-count');

    if (ammoEl) ammoEl.innerText = String(state.ammo);
    if (ammoStatus) {
      if (state.ammo <= 0) {
        ammoStatus.innerText = 'AGOTADA!';
        ammoStatus.className = 'font-mono text-[9px] text-red-500 font-bold pulse-alert';
      } else if (state.ammo < 200) {
        ammoStatus.innerText = 'BAJA!';
        ammoStatus.className = 'font-mono text-[9px] text-amber-400 font-bold';
      } else {
        ammoStatus.innerText = 'STOCK';
        ammoStatus.className = 'font-mono text-[9px] text-cyan-400 font-bold';
      }
    }

    if (cratesEl) cratesEl.innerText = String(state.cureCrates).padStart(2, '0');
    if (lblAmmoStock) lblAmmoStock.innerText = `${state.ammo} / ${state.maxAmmo}`;
    if (lblCrateStock) lblCrateStock.innerText = `${state.cureCrates} CAJAS`;
    if (btnCrateCount) btnCrateCount.innerText = String(state.cureCrates);
  }

  // Live Parish Contagion calculation based on real agent coordinates
  function updateParishBars() {
    const parishCounts = {
      Tarqui: { total: 0, bad: 0 },
      Murcielago: { total: 0, bad: 0 },
      EloyAlfaro: { total: 0, bad: 0 },
      Montecristi: { total: 0, bad: 0 }
    };

    state.agents.forEach(a => {
      let parish = null;
      if (a.routeKey.includes('Tarqui')) parish = 'Tarqui';
      else if (a.routeKey.includes('Murcielago')) parish = 'Murcielago';
      else if (a.routeKey.includes('EloyAlfaro')) parish = 'EloyAlfaro';
      else if (a.routeKey.includes('Montecristi')) parish = 'Montecristi';

      if (parish && parishCounts[parish]) {
        parishCounts[parish].total++;
        if (a.type === 'infected' || a.type === 'bitten') {
          parishCounts[parish].bad++;
        }
      }
    });

    const calcPct = (p) => {
      const data = parishCounts[p];
      if (!data || data.total === 0) return 0;
      return Math.min(100, Math.round((data.bad / data.total) * 100));
    };

    const tPct = calcPct('Tarqui');
    const mPct = calcPct('Murcielago');
    const ePct = calcPct('EloyAlfaro');
    const mcPct = calcPct('Montecristi');

    const tBar = document.getElementById('bar-tarqui');
    const tText = document.getElementById('bar-tarqui-text');
    if (tBar) tBar.style.width = `${tPct}%`;
    if (tText) tText.innerText = `${tPct}% INFECTED`;

    const mBar = document.getElementById('bar-murcielago');
    const mText = document.getElementById('bar-murcielago-text');
    if (mBar) mBar.style.width = `${mPct}%`;
    if (mText) mText.innerText = `${mPct}% INFECTED`;

    const eBar = document.getElementById('bar-eloy');
    const eText = document.getElementById('bar-eloy-text');
    if (eBar) eBar.style.width = `${ePct}%`;
    if (eText) eText.innerText = `${ePct}% INFECTED`;

    const mcBar = document.getElementById('bar-montecristi');
    const mcText = document.getElementById('bar-montecristi-text');
    if (mcBar) mcBar.style.width = `${mcPct}%`;
    if (mcText) mcText.innerText = `${mcPct}% INFECTED`;
  }

  function updateContagionRadius() {
    const pct = (state.infected / state.totalPop);
    Object.keys(contagionCircles).forEach(key => {
      const circle = contagionCircles[key];
      if (circle) {
        const baseRadius = (key === state.activeEpicenter) ? 600 : 300;
        const newRadius = Math.round(baseRadius * (1 + pct * 2.5));
        circle.setRadius(newRadius);
        circle.setStyle({ fillOpacity: Math.min(0.5, 0.12 + pct * 0.4) });
      }
    });
  }

  function updateNewsTicker() {
    const ticker = document.getElementById('slug-news-ticker');
    if (!ticker) return;

    if (!state.hasStarted) {
      ticker.innerText = "★ ESPERANDO PARAMETRIZACIÓN DEL ESCENARIO // SELECCIONE EPICENTRO Y RECURSOS PARA DESPLEGAR PACIENTE CERO ★";
      return;
    }

    const messages = [
      `★ DÍA ${state.day}: BROTE EXPONENCIAL EN ${state.activeEpicenter.toUpperCase()} // REGULAR ARMY DESPLIEGA CONTENCIÓN ★`,
      `★ DÍA ${state.day}: SE REPORTAN CASOS DE MUTACIÓN CELULAR ACELERADA TRAS MORDEDURAS // SÍNTESIS DE ANTÍDOTO EN CURSO ★`,
      `★ DÍA ${state.day}: RECURSOS MILITARES Y MUNICIÓN BAJO CONTROL LOGÍSTICO ESTRICTO EN EL CANTÓN MANTA ★`,
      `★ DÍA ${state.day}: SUJETOS INMUNES DETECTADOS // SU PLASMA PERMITE ACELERAR LA PRODUCCIÓN DE LA CURA ★`,
      `★ DÍA ${state.day}: SISTEMA DE AIRDROP DE ANTÍDOTO LISTO PARA IMPACTAR SECTORES CRÍTICOS ★`
    ];
    ticker.innerText = messages[state.day % messages.length];
  }

  // Dynamic SEIR SVG chart calculation
  function updateSEIRChart() {
    const marker = document.getElementById('day-marker-line');
    const markerTxt = document.getElementById('day-marker-text');
    const xPos = Math.min(590, Math.round((state.day / 60) * 580 + 10));

    if (marker) {
      marker.setAttribute('x1', xPos);
      marker.setAttribute('x2', xPos);
    }
    if (markerTxt) {
      markerTxt.setAttribute('x', Math.min(560, xPos + 4));
      markerTxt.innerText = `DÍA ${state.day}`;
    }

    // Dynamic curve deformation scaled to map agents
    const denom = Math.max(1, state.totalPop);
    const infPct = Math.min(1.0, state.infected / denom);
    const bitPct = Math.min(1.0, state.bitten / denom);

    const cS = document.getElementById('curve-susceptible');
    const cB = document.getElementById('curve-bitten');
    const cI = document.getElementById('curve-infected');

    if (cS) {
      const dropY = Math.round(10 + infPct * 45);
      cS.setAttribute('d', `M 0,10 Q 200,12 400,${dropY} T 600,${dropY + 5}`);
    }
    if (cB) {
      const bitY = Math.round(68 - bitPct * 40);
      cB.setAttribute('d', `M 0,68 Q 200,66 350,${bitY} T 600,64`);
    }
    if (cI) {
      const infY = Math.round(68 - infPct * 55);
      cI.setAttribute('d', `M 0,68 Q 250,65 420,${infY} T 600,${infY - 2}`);
    }
  }

  // 8. WINDOW ACTIONS & USER CONTROLS
  window.zoomToCombat = function() {
    let bestTarget = null;
    let minCombatDist = 9999;

    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      if (a.type === 'human' || a.type === 'immune') {
        for (let j = 0; j < state.agents.length; j++) {
          const b = state.agents[j];
          if (b.type === 'infected' || b.type === 'bitten') {
            const dist = Math.hypot(a.lat - b.lat, a.lng - b.lng);
            if (dist < minCombatDist) {
              minCombatDist = dist;
              bestTarget = a;
            }
          }
        }
      }
    }

    if (bestTarget) {
      map.flyTo([bestTarget.lat, bestTarget.lng], 17, { duration: 1.2 });
    } else if (state.agents.length > 0) {
      map.flyTo([state.agents[0].lat, state.agents[0].lng], 17, { duration: 1.2 });
    } else {
      const epNode = config.nodes[state.activeEpicenter] || config.nodes.Tarqui;
      map.flyTo([epNode.lat, epNode.lng], 17, { duration: 1.2 });
    }
  };

  window.centerManta = function() {
    map.flyTo(config.center, 13, { duration: 1.0 });
  };

  window.focusOnLandmark = function(key) {
    const node = config.nodes[key];
    if (node) {
      map.flyTo([node.lat, node.lng], 17, { duration: 1.2 });
    }
  };

  window.addCreditToken = function() {
    state.credits++;
    const badge = document.getElementById('credit-token-badge');
    if (badge) badge.innerText = String(state.credits).padStart(2, '0');
  };

  window.toggleSimPlay = function() {
    state.isRunning = !state.isRunning;
    const btnText = document.getElementById('slug-play-text');
    const floatBtnText = document.getElementById('floating-play-text');
    const statusText = document.getElementById('slug-sim-status');
    if (state.isRunning) {
      if (btnText) btnText.innerText = '⏸️ PAUSE';
      if (floatBtnText) floatBtnText.innerText = '⏸️ PAUSE';
      if (statusText) {
        statusText.innerText = state.hasStarted ? 'BROTE ACTIVO' : 'PRE-BROTE (DÍA 0)';
        statusText.className = state.hasStarted ? 'text-red-500' : 'text-emerald-400';
      }
    } else {
      if (btnText) btnText.innerText = '▶️ PLAY';
      if (floatBtnText) floatBtnText.innerText = '▶️ PLAY';
      if (statusText) {
        statusText.innerText = 'PAUSADO';
        statusText.className = 'text-yellow-400 pulse-alert';
      }
    }
  };

  window.setSpeed = function(s) {
    state.speed = s;
    ['1', '2', '4'].forEach(n => {
      const b = document.getElementById(`spd-btn-${n}`);
      if (b) b.className = "btn-slug-dark px-1.5 py-0.5 text-[9px] font-heavy rounded text-slate-300";
    });
    const active = document.getElementById(`spd-btn-${s}`);
    if (active) {
      active.className = "btn-slug-green px-1.5 py-0.5 text-[9px] font-heavy rounded text-black";
    }
  };

  window.toggleNightCycle = function() {
    state.isNight = !state.isNight;
    const icon = document.getElementById('slug-icon-night');
    const lbl = document.getElementById('slug-lbl-night');
    const ambient = document.getElementById('ambient-tint-layer');

    if (state.isNight) {
      if (icon) { icon.innerText = 'bedtime'; icon.className = 'material-symbols-outlined text-cyan-400 text-lg'; }
      if (lbl) { lbl.innerText = 'MODO NOCHE'; lbl.className = 'font-heavy text-[10px] text-cyan-400'; }
      if (ambient) ambient.style.backgroundColor = 'rgba(8, 6, 28, 0.45)';
    } else {
      if (icon) { icon.innerText = 'wb_sunny'; icon.className = 'material-symbols-outlined text-yellow-400 text-lg'; }
      if (lbl) { lbl.innerText = 'MODO DÍA'; lbl.className = 'font-heavy text-[10px] text-yellow-400'; }
      if (ambient) ambient.style.backgroundColor = 'transparent';
    }
  };

  window.toggleCarnaval = function() {
    state.isCarnaval = !state.isCarnaval;
    const btn = document.getElementById('slug-btn-carnaval');
    const icon = document.getElementById('slug-icon-carnaval');
    const lbl = document.getElementById('slug-lbl-carnaval');

    if (state.isCarnaval) {
      if (btn) btn.className = "btn-slug-red p-2 rounded flex items-center justify-between text-left";
      if (icon) { icon.innerText = 'festival'; icon.className = 'material-symbols-outlined text-white text-lg animate-bounce'; }
      if (lbl) { lbl.innerText = 'CARNAVAL: ON'; lbl.className = 'font-heavy text-[10px] text-white'; }
    } else {
      if (btn) btn.className = "btn-slug-dark p-2 rounded flex items-center justify-between text-left";
      if (icon) { icon.innerText = 'event_busy'; icon.className = 'material-symbols-outlined text-slate-400 text-lg'; }
      if (lbl) { lbl.innerText = 'CARNAVAL: OFF'; lbl.className = 'font-heavy text-[10px] text-slate-400'; }
    }
  };

  window.toggleCercoVial = function() {
    state.cercoVial = !state.cercoVial;
    const btn = document.getElementById('slug-btn-cerco');
    if (state.cercoVial) {
      if (btn) {
        btn.className = "btn-slug-gold px-2 py-0.5 text-[9px] rounded text-black font-heavy";
        btn.innerText = "BLOQUEADO";
      }
      roadPolylines.forEach(p => p.setStyle({ color: '#f59e0b', weight: 4.5 }));
    } else {
      if (btn) {
        btn.className = "btn-slug-dark px-2 py-0.5 text-[9px] rounded text-slate-400";
        btn.innerText = "DESACTIVADO";
      }
      roadPolylines.forEach(p => p.setStyle({ color: '#06b6d4', weight: 3.5 }));
    }
  };

  window.setIncubationTime = function(val) {
    state.incubationSeconds = parseFloat(val);
    const txt = document.getElementById('live-incub-text');
    if (txt) txt.innerText = `${val}s`;
  };

  window.changeEpicenter = function(epKey) {
    state.activeEpicenter = epKey;
    inspectLandmark(epKey);
  };

  const DISASTER_PRESETS = {
    A: {
      epicenter: 'Tarqui',
      agents: 140,
      armed: 30,
      immunityPct: 5,
      incubationSec: 5,
      ammo: 400,
      crates: 1,
      isNight: false,
      isCarnaval: true,
      cercoVial: false,
      r0: 4.85,
      badge: 'EXTREMO',
      tint: 'rgba(6, 78, 115, 0.22)' // Inundación Tsunami Costero
    },
    B: {
      epicenter: 'Murcielago',
      agents: 95,
      armed: 25,
      immunityPct: 10,
      incubationSec: 9,
      ammo: 800,
      crates: 3,
      isNight: true,
      isCarnaval: false,
      cercoVial: true,
      r0: 2.35,
      badge: 'TORMENTA',
      tint: 'rgba(8, 12, 38, 0.48)' // Supertormenta El Niño & Apagón
    },
    C: {
      epicenter: 'PuertoManta',
      agents: 60,
      armed: 25,
      immunityPct: 16,
      incubationSec: 15,
      ammo: 1500,
      crates: 6,
      isNight: false,
      isCarnaval: false,
      cercoVial: true,
      r0: 1.15,
      badge: 'CONTENCIÓN',
      tint: 'rgba(120, 28, 40, 0.18)' // Ciclón & Marea Roja Bio-Tóxica
    }
  };

  window.switchScenario = function(scen) {
    syncBackend('/api/sim/scenario', { scenario: scen });
    const preset = DISASTER_PRESETS[scen] || DISASTER_PRESETS.A;
    state.currentScenario = scen;

    // 1. Update Header Pills
    const t1 = document.getElementById('slug-tab-1');
    const t2 = document.getElementById('slug-tab-2');
    const t3 = document.getElementById('slug-tab-3');
    if (t1) t1.className = (scen === 'A')
      ? "px-2 py-0.5 rounded text-[9px] font-heavy text-red-300 bg-red-950/80 border border-red-500 transition-all cursor-pointer"
      : "px-2 py-0.5 rounded text-[9px] font-heavy text-slate-400 hover:text-red-300 transition-all cursor-pointer";
    if (t2) t2.className = (scen === 'B')
      ? "px-2 py-0.5 rounded text-[9px] font-heavy text-cyan-300 bg-cyan-950/80 border border-cyan-500 transition-all cursor-pointer"
      : "px-2 py-0.5 rounded text-[9px] font-heavy text-slate-400 hover:text-cyan-300 transition-all cursor-pointer";
    if (t3) t3.className = (scen === 'C')
      ? "px-2 py-0.5 rounded text-[9px] font-heavy text-emerald-300 bg-emerald-950/80 border border-emerald-500 transition-all cursor-pointer"
      : "px-2 py-0.5 rounded text-[9px] font-heavy text-slate-400 hover:text-emerald-300 transition-all cursor-pointer";

    // 2. Highlight Preset Cards in Parameters Tab
    const cA = document.getElementById('preset-card-A');
    const cB = document.getElementById('preset-card-B');
    const cC = document.getElementById('preset-card-C');
    if (cA) cA.className = (scen === 'A')
      ? "p-2 rounded border-2 border-red-500 bg-red-950/50 text-left transition-all cursor-pointer flex items-start justify-between gap-2 shadow-lg"
      : "p-2 rounded border border-slate-700 bg-[#111820] hover:border-red-500/60 text-left transition-all cursor-pointer flex items-start justify-between gap-2";
    if (cB) cB.className = (scen === 'B')
      ? "p-2 rounded border-2 border-cyan-400 bg-cyan-950/50 text-left transition-all cursor-pointer flex items-start justify-between gap-2 shadow-lg"
      : "p-2 rounded border border-slate-700 bg-[#111820] hover:border-cyan-400/60 text-left transition-all cursor-pointer flex items-start justify-between gap-2";
    if (cC) cC.className = (scen === 'C')
      ? "p-2 rounded border-2 border-emerald-400 bg-emerald-950/50 text-left transition-all cursor-pointer flex items-start justify-between gap-2 shadow-lg"
      : "p-2 rounded border border-slate-700 bg-[#111820] hover:border-emerald-400/60 text-left transition-all cursor-pointer flex items-start justify-between gap-2";

    // 3. Apply Preset Values to DOM Inputs & State
    state.activeEpicenter = preset.epicenter;
    const epSelect = document.getElementById('init-epicenter-select');
    if (epSelect) epSelect.value = preset.epicenter;

    state.agentCount = preset.agents;
    const agSlider = document.getElementById('init-agents-slider');
    const agVal = document.getElementById('init-agents-val');
    if (agSlider) agSlider.value = String(preset.agents);
    if (agVal) agVal.innerText = `${preset.agents} TROPAS`;

    state.armedCount = preset.armed;
    const armSlider = document.getElementById('init-armed-slider');
    const armVal = document.getElementById('init-armed-val');
    if (armSlider) armSlider.value = String(preset.armed);
    if (armVal) armVal.innerText = `${preset.armed} ARMADOS`;

    state.immunityRate = preset.immunityPct / 100;
    const imSlider = document.getElementById('init-immune-slider');
    const imVal = document.getElementById('init-immune-val');
    if (imSlider) imSlider.value = String(preset.immunityPct);
    if (imVal) imVal.innerText = `${preset.immunityPct}% INMUNES`;

    state.incubationSeconds = preset.incubationSec;
    const incSlider = document.getElementById('init-incub-slider');
    const incVal = document.getElementById('live-incub-text');
    if (incSlider) incSlider.value = String(preset.incubationSec);
    if (incVal) incVal.innerText = `${preset.incubationSec}s`;

    state.ammo = preset.ammo;
    state.maxAmmo = preset.ammo;
    const ammoSel = document.getElementById('init-ammo-select');
    if (ammoSel) ammoSel.value = String(preset.ammo);

    state.cureCrates = preset.crates;
    const crateSel = document.getElementById('init-crates-select');
    if (crateSel) crateSel.value = String(preset.crates);

    // Sync Environment Switches (Night, Carnaval, Cerco Vial)
    if (state.isNight !== preset.isNight) window.toggleNightCycle();
    const nightChk = document.getElementById('init-night-check');
    if (nightChk) nightChk.checked = preset.isNight;

    if (state.isCarnaval !== preset.isCarnaval) window.toggleCarnaval();
    const carnChk = document.getElementById('init-carnaval-check');
    if (carnChk) carnChk.checked = preset.isCarnaval;

    if (state.cercoVial !== preset.cercoVial) window.toggleCercoVial();
    const cercoChk = document.getElementById('init-cerco-check');
    if (cercoChk) cercoChk.checked = preset.cercoVial;

    const ambient = document.getElementById('ambient-tint-layer');
    if (ambient) ambient.style.backgroundColor = preset.tint;

    state.r0 = preset.r0;
    const r0El = document.getElementById('metric-r0');
    const r0Badge = document.getElementById('metric-r0-badge');
    if (r0El) r0El.innerText = state.r0.toFixed(2);
    if (r0Badge) r0Badge.innerText = preset.badge;

    inspectLandmark(preset.epicenter);

    if (!state.hasStarted) {
      initAgents();
    } else {
      updateHUD();
    }
  };

  window.inspectLandmark = function(key) {
    const node = config.nodes[key];
    if (!node) return;
    const tTitle = document.getElementById('target-title');
    const tDetails = document.getElementById('target-details');

    if (tTitle) tTitle.innerText = `TARGET: ${node.name.toUpperCase()}`;
    if (tDetails) tDetails.innerText = node.desc;

    map.panTo([node.lat, node.lng], { animate: true, duration: 0.8 });
  };

  // Parachute Antidote Supply Airdrop (Uses 1 limited crate)
  window.deployCureAirdrop = function(targetLatLng) {
    if (state.cureCrates <= 0) {
      sfx.alarm();
      state.particles.push({
        type: 'text',
        text: '¡SIN CAJAS DE ANTÍDOTO! ESPERANDO SÍNTESIS...',
        x: canvas.width / 2,
        y: 60,
        color: '#ef4444',
        life: 1.5,
        decay: 0.02
      });
      return;
    }

    // Spend 1 crate
    state.cureCrates -= 1;
    updateResourceTelemetry();
    sfx.cure();

    const crate = document.getElementById('slug-parachute-crate');
    const target = targetLatLng || config.nodes[state.activeEpicenter] || config.nodes.Tarqui;

    const startPoint = map.latLngToContainerPoint([target.lat + 0.02, target.lng]);
    const endPoint = map.latLngToContainerPoint([target.lat, target.lng]);

    if (crate) {
      crate.setAttribute('opacity', '1');
      crate.setAttribute('transform', `translate(${startPoint.x}, 0)`);

      let t = 0;
      function drop() {
        t += 0.035 * state.speed;
        if (t < 1) {
          const curX = startPoint.x + (endPoint.x - startPoint.x) * t;
          const curY = 10 + (endPoint.y - 10) * t;
          const sway = Math.sin(t * 12) * 5;
          crate.setAttribute('transform', `translate(${curX + sway}, ${curY})`);
          requestAnimationFrame(drop);
        } else {
          crate.setAttribute('transform', `translate(${endPoint.x}, ${endPoint.y})`);
          setTimeout(() => crate.setAttribute('opacity', '0'), 700);

          let healed = 0;
          state.agents.forEach(a => {
            const distKm = Math.hypot(a.lat - target.lat, a.lng - target.lng) * 111;
            if ((a.type === 'infected' || a.type === 'bitten') && distKm < 1.4) {
              a.type = 'immune';
              a.glitchTimer = 20;
              a.cureTimer = 40;
              a.incubationTimer = 0;
              healed++;

              for (let s = 0; s < 4; s++) {
                state.particles.push({
                  type: 'bile',
                  x: a.screenX + (Math.random() - 0.5) * 10,
                  y: a.screenY + (Math.random() - 0.5) * 10,
                  vx: (Math.random() - 0.5) * 1.5,
                  vy: -1.5 - Math.random() * 1.5,
                  size: 2.5,
                  color: '#facc15',
                  life: 1.0,
                  decay: 0.05
                });
              }
            }
          });

          if (healed > 0) sfx.powSalute();

          state.recovered += healed;
          state.score += 800;
          syncBackend('/api/sim/airdrop', { healedCount: healed }).then(res => {
            if (res && res.state) applyBackendState(res.state);
            updateHUD();
          });
          updateHUD();
          const scoreEl = document.getElementById('score-counter');
          if (scoreEl) scoreEl.innerText = String(state.score).padStart(6, '0');
        }
      }
      requestAnimationFrame(drop);
    }
  };

  window.deployCureToTarget = function() {
    window.deployCureAirdrop();
  };

  window.setDistributionPrio = function(p) {
    state.distributionPriority = p;
    ['med', 'costa', 'peri'].forEach(k => {
      const b = document.getElementById(`slug-prio-${k}`);
      if (b) b.className = "btn-slug-dark py-1 text-[9px] rounded text-slate-300 font-heavy cursor-pointer";
    });
    const act = document.getElementById(`slug-prio-${p}`);
    if (act) act.className = "btn-slug-green py-1 text-[9px] rounded text-black font-heavy cursor-pointer";
  };

  // ==========================================================================
  // METAL SLUG & SPOOKYTHON SHOWCASE LOGIC (4 SEIR STATES)
  // ==========================================================================
  window.openMetalSlugShowcase = function() {
    const modal = document.getElementById('metal-slug-showcase');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderShowcaseTabs();
    selectShowcaseHero(activeShowcaseHero);
  };

  window.closeMetalSlugShowcase = function() {
    const modal = document.getElementById('metal-slug-showcase');
    if (modal) modal.classList.add('hidden');
  };

  window.selectShowcaseHero = function(heroId) {
    activeShowcaseHero = heroId;
    const hero = SHOWCASE_GIFS[heroId] || SHOWCASE_GIFS.spookython;

    const imgH = document.getElementById('showcase-img-human');
    const imgB = document.getElementById('showcase-img-bitten');
    const imgZ = document.getElementById('showcase-img-zombie');
    const imgI = document.getElementById('showcase-img-immune');

    const descH = document.getElementById('showcase-desc-human');
    const descB = document.getElementById('showcase-desc-bitten');
    const descZ = document.getElementById('showcase-desc-zombie');
    const descI = document.getElementById('showcase-desc-immune');

    if (imgH) imgH.src = hero.human;
    if (imgB) imgB.src = hero.bitten;
    if (imgZ) imgZ.src = hero.zombie;
    if (imgI) imgI.src = hero.immune;

    if (descH && hero.descH) descH.textContent = hero.descH;
    if (descB && hero.descB) descB.textContent = hero.descB;
    if (descZ && hero.descZ) descZ.textContent = hero.descZ;
    if (descI && hero.descI) descI.textContent = hero.descI;

    // Invalidate DOM sprite cache on the map so active entities immediately switch skin
    Object.keys(agentDoms).forEach(id => {
      const dom = agentDoms[id];
      if (dom) dom._lastSrc = null;
    });

    renderShowcaseTabs();
    sfx.button();
  };

  window.testShowcaseBloodVomit = function() {
    const banner = document.getElementById('showcase-vomit-banner');
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 1400);
    }
    sfx.bloodVomit();
  };

  window.testShowcaseImmuneShield = function() {
    sfx.deflect();
    const imgI = document.getElementById('showcase-img-immune');
    if (imgI) {
      imgI.style.transform = 'scale(1.2)';
      setTimeout(() => { imgI.style.transform = 'scale(1.0)'; }, 350);
    }
  };

  function renderShowcaseTabs() {
    const container = document.getElementById('showcase-character-tabs');
    if (!container) return;
    container.innerHTML = `
      <div class="w-full flex flex-wrap items-center justify-between gap-2 px-2 py-1">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-amber-300 text-[11px] font-heavy tracking-wider">★ ROSTER EXCLUSIVO SPOOKYTHON 2026 (TRACK B)</span>
        </div>
        <div class="flex items-center gap-2 text-[9px] font-mono text-slate-400">
          <span class="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded font-bold">4 ESTADOS SEIR</span>
          <span class="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded">32x40 @ 8X PIXEL ART</span>
        </div>
      </div>
    `;
  }

  // Quick Map Spawn Testing Functions
  window.spawnTestZombie = function() {
    const center = map.getCenter();
    map.flyTo(center, 17, { duration: 1 });
    setTimeout(() => {
      spawnZombieAt(center.lat, center.lng);
      sfx.bloodVomit();
      state.hasStarted = true;
      const simStatus = document.getElementById('slug-sim-status');
      if (simStatus) {
        simStatus.innerText = 'BROTE ACTIVO';
        simStatus.className = 'text-red-500 pulse-alert';
      }
    }, 600);
  };

  window.spawnTestImmune = function() {
    const center = map.getCenter();
    map.flyTo(center, 17, { duration: 1 });
    setTimeout(() => {
      let nearestAgent = null;
      let minDist = 999999;
      state.agents.forEach(a => {
        const d = Math.hypot(a.lat - center.lat, a.lng - center.lng);
        if (d < minDist) {
          minDist = d;
          nearestAgent = a;
        }
      });
      if (nearestAgent) {
        nearestAgent.type = 'immune';
        sfx.deflect();
        state.particles.push({
          type: 'text',
          text: '¡INMUNE HAZMAT SPAWNED!',
          x: nearestAgent.screenX,
          y: nearestAgent.screenY - 14,
          color: '#facc15',
          life: 1.5,
          decay: 0.03
        });
        updateHUD();
      }
    }, 600);
  };

  // Monte Carlo en segundo plano: sondeo de progreso y acceso al dashboard
  let mcTimer = null;
  window.startMonteCarloPolling = function() {
    const btn = document.getElementById('btn-mc');
    const txt = document.getElementById('btn-mc-text');
    if (btn) { btn.dataset.ready = '0'; btn.classList.remove('hidden'); }
    if (mcTimer) clearInterval(mcTimer);
    mcTimer = setInterval(async () => {
      const st = await syncBackend('/api/montecarlo/status');
      if (!st) return;
      if (st.state === 'running') {
        if (txt) txt.innerText = `MONTE CARLO ${Math.round(st.progress * 100)}%`;
      } else if (st.state === 'done') {
        clearInterval(mcTimer);
        if (btn) btn.dataset.ready = '1';
        if (txt) txt.innerText = 'VER DASHBOARD MC';
        if (btn) btn.classList.add('animate-pulse');
        sfx.cure();
      } else if (st.state === 'error') {
        clearInterval(mcTimer);
        if (txt) txt.innerText = 'MC ERROR';
      }
    }, 1500);
  };

  window.openMonteCarlo = function() {
    const btn = document.getElementById('btn-mc');
    if (btn && btn.dataset.ready === '1') window.open('/montecarlo', '_blank');
  };

  window.resetSimulation = function() {
    syncBackend('/api/sim/reset', {}).then(res => {
      if (res && res.state) applyBackendState(res.state);
      updateHUD();
    });
    state.hasStarted = false;
    state.isTransforming = false;
    state.day = 0;
    state.hour = 0;
    state.minute = 0;
    state.score = 0;
    state.cureProgress = 0.0;
    state.cureCrates = 3;
    state.ammo = state.maxAmmo;
    
    initAgents();
    updateHUD();
    updateParishBars();
    updateContagionRadius();
    updateSEIRChart();

    const bar = document.getElementById('slug-cure-bar');
    const lbl = document.getElementById('slug-cure-text');
    if (bar) bar.style.width = '0%';
    if (lbl) lbl.innerText = '0.0%';

    const scoreEl = document.getElementById('score-counter');
    if (scoreEl) scoreEl.innerText = '000,000';

    const simStatus = document.getElementById('slug-sim-status');
    if (simStatus) {
      simStatus.innerText = 'PRE-BROTE (DÍA 0)';
      simStatus.className = 'text-emerald-400';
    }

    // Open side dock on the first tab (Parámetros)
    if (typeof window.toggleControlDock === 'function') {
      window.toggleControlDock(false);
    }
    if (typeof window.switchSidebarTab === 'function') {
      window.switchSidebarTab('control');
    }
  };

})();
