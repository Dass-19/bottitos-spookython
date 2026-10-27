// ==========================================================================
// MANTA OUTBREAK // MAIN SIMULATION & COMBAT ENGINE (4 STATES + REAL RESOURCES)
// ==========================================================================

(function initMetalSlugEngine() {
  const config = window.MANTA_CONFIG;
  const sprites = window.MANTA_SPRITES;
  const sfx = window.SFX;
  const rawRoutes = window.MANTA_STREET_ROUTES || {};

  // Simulation Game State
  const state = {
    hasStarted: false,
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
    
    // Census & SEIR Model
    totalPop: 271145,
    healthy: 249453,
    bitten: 0,
    infected: 0,
    immune: 21692,
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
    zoom: 13,
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
            <div class="px-2 py-0.5 rounded border-2 ${isEpicenter ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_10px_#dc2626]' : 'bg-[#141e17] border-[#4b5e4e] text-amber-300 shadow-md'} font-heavy text-[8px] whitespace-nowrap flex items-center gap-1">
              <span>${isEpicenter ? '☠ ' : '★ '}${node.name}</span>
            </div>
            <div class="w-2.5 h-2.5 rounded-full ${isEpicenter ? 'bg-red-600 animate-ping' : 'bg-amber-400'} mt-0.5 border border-black"></div>
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

  // 3. CANVAS SETUP & AGENT INITIALIZATION
  const canvas = document.getElementById('agent-canvas');
  const ctx = canvas.getContext('2d');

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
    const rKeys = Object.keys(config.routePairs);
    const count = state.agentCount;
    const HERO_KEYS = ['marco', 'tarma', 'eri', 'fio', 'clark', 'ralf'];

    for (let i = 0; i < count; i++) {
      const rKey = rKeys[Math.floor(Math.random() * rKeys.length)];
      const rd = routeData[rKey];
      const posMeters = Math.random() * rd.totalDist;
      const dir = Math.random() < 0.5 ? 1 : -1;
      
      // Determine if naturally immune
      const isImmune = (Math.random() < state.immunityRate);
      const agentType = isImmune ? 'immune' : 'human';
      const heroId = HERO_KEYS[i % HERO_KEYS.length];

      state.agents.push({
        id: i,
        heroId: heroId,
        type: agentType,
        routeKey: rKey,
        posMeters: posMeters,
        dir: dir,
        speedMps: 11.0 + Math.random() * 8.0,
        lateralOffsetMeters: (Math.random() - 0.5) * 5.0,
        lat: 0,
        lng: 0,
        screenX: 0,
        screenY: 0,
        facing: 1,
        incubationTimer: 0,
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
        isPatientZero: false
      });
    }

    // Calculate initial counts
    const immCount = Math.round(state.totalPop * state.immunityRate);
    state.immune = immCount;
    state.healthy = state.totalPop - immCount;
    state.bitten = 0;
    state.infected = 0;
    state.recovered = 0;
    state.deaths = 0;
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

    // Hide pre-sim panel
    const panel = document.getElementById('pre-sim-panel');
    if (panel) panel.style.display = 'none';

    // Start cinematic sequence
    window.startOutbreakSequence(epVal);
  };

  window.togglePreSimPanel = function() {
    const panel = document.getElementById('pre-sim-panel');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
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
              if (state.ammo > 0) {
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
                    // DEFLECTED BY IMMUNITY!
                    sfx.deflect();
                    state.particles.push({
                      type: 'text',
                      text: '¡INMUNE!',
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
                    // BITTEN / ENTERS INCUBATION!
                    for (let k = 0; k < 6; k++) {
                      state.particles.push({
                        type: 'bile',
                        x: a.screenX + a.facing * 5,
                        y: a.screenY - 3,
                        vx: a.facing * (1.8 + Math.random() * 2.5),
                        vy: -1.2 + Math.random() * 2.4,
                        size: 2.2 + Math.random() * 2,
                        color: (Math.random() < 0.6) ? '#84cc16' : '#dc2626',
                        life: 1.0,
                        decay: 0.06
                      });
                    }

                    sfx.zombieBite();
                    target.type = 'bitten';
                    target.incubationTimer = state.incubationSeconds * 60;
                    target.incubationMax = state.incubationSeconds * 60;
                    target.glitchTimer = 25;

                    state.particles.push({
                      type: 'text',
                      text: '¡MORDIDO!',
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

    // C. Render Agents
    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      if (a.screenX < -25 || a.screenX > canvas.width + 25 || a.screenY < -25 || a.screenY > canvas.height + 25) continue;

      const incPct = (a.incubationMax > 0) ? (1 - (a.incubationTimer / a.incubationMax)) : 0;

      if (currentZoom < 15) {
        sprites.drawTacticalChibiHead(ctx, a.screenX, a.screenY, a.type, a.glitchTimer, a.animBob, incPct, a.heroId);
      } else {
        if (a.type === 'infected') {
          sprites.drawZombieMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.isVomiting, a.alertTimer, a.glitchTimer, spriteScale, a.heroId);
        } else if (a.type === 'bitten') {
          sprites.drawBittenMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.alertTimer, a.glitchTimer, incPct, spriteScale, a.heroId);
        } else if (a.type === 'immune') {
          sprites.drawImmuneMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.isShooting, a.alertTimer, a.cureTimer, spriteScale, a.heroId);
        } else {
          sprites.drawSoldierMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.isShooting, a.alertTimer, a.cureTimer, spriteScale, (state.ammo > 0), a.heroId);
        }
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

      // Cure synthesis in Lab
      if (state.cureProgress < 100) {
        // Immunes boost research speed (they provide antibodies)
        const boost = (state.distributionPriority === 'med' ? 0.12 : 0.07) * (1 + (state.immune / state.totalPop) * 5);
        state.cureProgress = Math.min(100, +(state.cureProgress + boost * state.speed).toFixed(1));
        
        if (state.cureProgress >= 100) {
          // Produces a new supply crate!
          state.cureCrates += 1;
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
          state.cureProgress = 0.0;
        }

        const bar = document.getElementById('slug-cure-bar');
        const lbl = document.getElementById('slug-cure-text');
        if (bar) bar.style.width = `${state.cureProgress}%`;
        if (lbl) lbl.innerText = `${state.cureProgress}%`;
      }

      // Environmental propagation
      if (state.infected > 0 && state.infected < state.totalPop) {
        const factor = (state.isCarnaval ? 1.6 : 1.0) * (state.isNight ? 1.2 : 0.9) * (state.cercoVial ? 0.7 : 1.0);
        const spreadDelta = Math.floor((Math.random() * 4 + 1) * state.speed * factor);
        
        state.healthy = Math.max(0, state.totalPop - state.immune - state.infected - state.bitten);
        updateHUD();
        updateParishBars();
        updateContagionRadius();
      }
    }

    updateAndRender();
    requestAnimationFrame(simLoop);
  }

  requestAnimationFrame(simLoop);

  // 7. TELEMETRY & HUD UPDATES
  function updateHUD() {
    const hEl = document.getElementById('metric-healthy');
    const hPct = document.getElementById('metric-healthy-pct');
    const bEl = document.getElementById('metric-bitten');
    const bPct = document.getElementById('metric-bitten-pct');
    const iEl = document.getElementById('metric-infected');
    const iPct = document.getElementById('metric-infected-pct');
    const mEl = document.getElementById('metric-immune');
    const mPct = document.getElementById('metric-immune-pct');

    if (hEl) hEl.innerText = state.healthy.toLocaleString('es-EC');
    if (hPct) hPct.innerText = `${((state.healthy / state.totalPop) * 100).toFixed(1)}%`;

    if (bEl) bEl.innerText = String(state.bitten);
    if (bPct) bPct.innerText = `${((state.bitten / state.totalPop) * 100).toFixed(2)}%`;

    if (iEl) iEl.innerText = String(state.infected);
    if (iPct) iPct.innerText = `${((state.infected / state.totalPop) * 100).toFixed(2)}%`;

    if (mEl) mEl.innerText = state.immune.toLocaleString('es-EC');
    if (mPct) mPct.innerText = `${((state.immune / state.totalPop) * 100).toFixed(1)}%`;

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

    // Dynamic curve deformation
    const infPct = Math.min(1.0, state.infected / 5000);
    const bitPct = Math.min(1.0, state.bitten / 500);

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
    const statusText = document.getElementById('slug-sim-status');
    if (state.isRunning) {
      if (btnText) btnText.innerText = '⏸️ PAUSE';
      if (statusText) {
        statusText.innerText = state.hasStarted ? 'BROTE ACTIVO' : 'PRE-BROTE (DÍA 0)';
        statusText.className = state.hasStarted ? 'text-red-500' : 'text-emerald-400';
      }
    } else {
      if (btnText) btnText.innerText = '▶️ PLAY';
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

  window.switchScenario = function(scen) {
    state.currentScenario = scen;
    const t1 = document.getElementById('slug-tab-1');
    const t2 = document.getElementById('slug-tab-2');
    const t3 = document.getElementById('slug-tab-3');
    const r0El = document.getElementById('metric-r0');
    const r0Badge = document.getElementById('metric-r0-badge');

    [t1, t2, t3].forEach(t => {
      if (t) t.className = "p-1.5 bg-[#121914] border border-slate-700 text-left rounded hover:border-slate-500 transition-all flex flex-col";
    });

    if (scen === 'A') {
      if (t1) t1.className = "p-1.5 bg-[#201015] border-2 border-red-600 text-left rounded shadow-md flex flex-col";
      state.isCarnaval = true;
      state.cercoVial = false;
      state.r0 = 4.8;
      if (r0Badge) r0Badge.innerText = "EXTREMO";
    } else if (scen === 'B') {
      if (t2) t2.className = "p-1.5 bg-[#201a08] border-2 border-amber-500 text-left rounded shadow-md flex flex-col";
      state.isCarnaval = false;
      state.cercoVial = true;
      state.r0 = 2.1;
      if (r0Badge) r0Badge.innerText = "MODERADO";
    } else if (scen === 'C') {
      if (t3) t3.className = "p-1.5 bg-[#0e1f14] border-2 border-emerald-500 text-left rounded shadow-md flex flex-col";
      state.isCarnaval = false;
      state.cercoVial = true;
      state.cureProgress = 78.5;
      state.r0 = 0.72;
      const bar = document.getElementById('slug-cure-bar');
      const lbl = document.getElementById('slug-cure-text');
      if (bar) bar.style.width = '78.5%';
      if (lbl) lbl.innerText = '78.5%';
      if (r0Badge) r0Badge.innerText = "CONTENIDO";
    }
    if (r0El) r0El.innerText = state.r0.toFixed(2);
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
              a.type = 'human';
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

          state.infected = Math.max(0, state.infected - healed * 20);
          state.bitten = Math.max(0, state.bitten - healed * 5);
          state.recovered += (healed * 20);
          state.healthy += (healed * 20);
          state.score += 800;
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

  window.resetSimulation = function() {
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

    // Open Pre-Sim Panel
    const panel = document.getElementById('pre-sim-panel');
    if (panel) panel.style.display = 'flex';
  };

})();
