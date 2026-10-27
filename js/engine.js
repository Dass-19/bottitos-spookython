// ==========================================================================
// MANTA OUTBREAK // MAIN SIMULATION & COMBAT ENGINE
// ==========================================================================

(function initMetalSlugEngine() {
  const config = window.MANTA_CONFIG;
  const sprites = window.MANTA_SPRITES;
  const sfx = window.SFX;
  const rawRoutes = window.MANTA_STREET_ROUTES || {};

  // Simulation Game State
  const state = {
    isRunning: true,
    speed: 1,
    score: 34800,
    credits: 4,
    day: 14,
    hour: 18,
    minute: 40,
    isNight: false,
    isCarnaval: true,
    cercoVial: false,
    activeEpicenter: 'Tarqui',
    currentScenario: 'A',
    distributionPriority: 'med',
    tileLayerName: 'dark',
    cureProgress: 42.8,
    cureEtaDays: 24,
    totalPop: 271145,
    healthy: 267820,
    infected: 3240,
    recovered: 85,
    deaths: 120,
    r0: 3.82,
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
      const radius = isEpicenter ? 900 : 450;
      const circle = L.circle([node.lat, node.lng], {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: isEpicenter ? 0.35 : 0.15,
        radius: radius,
        weight: 2,
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

  // 2. CANVAS SETUP & AGENT INITIALIZATION
  const canvas = document.getElementById('agent-canvas');
  const ctx = canvas.getContext('2d');
  const TOTAL_AGENTS = 115;

  function resizeCanvas() {
    const rect = map.getContainer().getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resizeCanvas();
  map.on('resize', resizeCanvas);

  function initAgents() {
    state.agents = [];
    state.particles = [];
    const rKeys = Object.keys(config.routePairs);

    for (let i = 0; i < TOTAL_AGENTS; i++) {
      const rKey = rKeys[Math.floor(Math.random() * rKeys.length)];
      const rd = routeData[rKey];
      const posMeters = Math.random() * rd.totalDist;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const isInfected = (rKey.includes('Tarqui') && Math.random() < 0.6) || (Math.random() < 0.22);

      state.agents.push({
        id: i,
        routeKey: rKey,
        posMeters: posMeters,
        dir: dir,
        speedMps: 13.0 + Math.random() * 11.0,
        lateralOffsetMeters: (Math.random() - 0.5) * 5.5,
        lat: 0,
        lng: 0,
        screenX: 0,
        screenY: 0,
        facing: 1,
        isInfected: isInfected,
        glitchTimer: 0,
        animBob: Math.random() * Math.PI * 2,
        animFrame: 0,
        alertTimer: 0,
        shootCooldown: Math.floor(Math.random() * 20),
        isShooting: false,
        targetZombiePos: null,
        vomitCooldown: Math.floor(Math.random() * 20),
        isVomiting: false,
        cureTimer: 0
      });
    }
  }
  initAgents();

  // 3. ANIMATION & COMBAT LOOP (60 FPS)
  function updateAndRender() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentZoom = map.getZoom();
    const effectiveSpeed = state.speed * (state.isNight ? 0.75 : 1.15) * (state.isCarnaval ? 1.35 : 1.0) * (state.cercoVial ? 0.65 : 1.0);
    const spriteScale = 0.85 + (currentZoom - 14) * 0.42;

    // A. Update Agents along streets
    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      const rd = routeData[a.routeKey];
      if (!rd) continue;

      if (state.isRunning) {
        a.posMeters += a.dir * a.speedMps * (1 / 60) * effectiveSpeed * 3.8;

        // Intersection transitions
        if (a.dir === 1 && a.posMeters >= rd.totalDist) {
          const targetNode = rd.nodeB;
          const conns = (nodeToRoutes[targetNode] || []).filter(c => c.route !== a.routeKey);
          const nextConn = conns.length ? conns[Math.floor(Math.random() * conns.length)] : { route: a.routeKey, at: 'nodeB' };
          a.routeKey = nextConn.route;
          const nextRd = routeData[a.routeKey];
          if (nextConn.at === 'nodeA') {
            a.posMeters = 0;
            a.dir = 1;
          } else {
            a.posMeters = nextRd.totalDist;
            a.dir = -1;
          }
        } else if (a.dir === -1 && a.posMeters <= 0) {
          const targetNode = rd.nodeA;
          const conns = (nodeToRoutes[targetNode] || []).filter(c => c.route !== a.routeKey);
          const nextConn = conns.length ? conns[Math.floor(Math.random() * conns.length)] : { route: a.routeKey, at: 'nodeA' };
          a.routeKey = nextConn.route;
          const nextRd = routeData[a.routeKey];
          if (nextConn.at === 'nodeA') {
            a.posMeters = 0;
            a.dir = 1;
          } else {
            a.posMeters = nextRd.totalDist;
            a.dir = -1;
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
    if (state.isRunning) {
      for (let i = 0; i < state.agents.length; i++) {
        const a = state.agents[i];
        if (a.screenX < -20 || a.screenX > canvas.width + 20 || a.screenY < -20 || a.screenY > canvas.height + 20) continue;

        if (!a.isInfected) {
          // Soldier searches for nearby zombies
          let nearestZombie = null;
          let nearestDist = 9999;

          for (let j = 0; j < state.agents.length; j++) {
            const other = state.agents[j];
            if (other.isInfected) {
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
              a.shootCooldown = 28;
              a.isShooting = true;
              a.targetZombiePos = { x: nearestZombie.screenX, y: nearestZombie.screenY };

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
            }
          }
        } else {
          // Zombie searches for soldiers to bite/vomit
          for (let j = 0; j < state.agents.length; j++) {
            const soldier = state.agents[j];
            if (!soldier.isInfected) {
              const d = Math.hypot(a.screenX - soldier.screenX, a.screenY - soldier.screenY);

              if (d < 65) {
                a.alertTimer = 16;
                a.facing = (soldier.screenX >= a.screenX) ? 1 : -1;
              }

              if (d < 14) {
                if (a.vomitCooldown <= 0) {
                  a.vomitCooldown = 32;
                  a.isVomiting = true;

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

                  soldier.isInfected = true;
                  soldier.glitchTimer = 22;

                  if (currentZoom >= 15) {
                    state.particles.push({
                      type: 'text',
                      text: 'INFECTED!',
                      x: soldier.screenX,
                      y: soldier.screenY - 14,
                      color: '#ef4444',
                      life: 1.0,
                      decay: 0.04
                    });
                  }

                  state.infected += Math.floor(Math.random() * 45 + 15);
                  state.healthy = Math.max(0, state.totalPop - state.infected);
                  updateHUD();
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

      if (currentZoom < 15) {
        sprites.drawTacticalChibiHead(ctx, a.screenX, a.screenY, a.isInfected, a.glitchTimer, a.animBob);
      } else {
        if (a.isInfected) {
          sprites.drawZombieMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.isVomiting, a.alertTimer, a.glitchTimer, spriteScale);
        } else {
          sprites.drawSoldierMicroSprite(ctx, a.screenX, a.screenY, a.facing, a.animFrame, a.isShooting, a.alertTimer, a.cureTimer, spriteScale);
        }
      }
    }

    // D. Render Particles
    sprites.renderParticles(ctx, state.particles);
  }

  // 4. SIMULATION CLOCK AND TELEMETRY TICK
  let lastTick = Date.now();
  function simLoop() {
    const now = Date.now();
    const delta = now - lastTick;

    if (state.isRunning && delta > (500 / state.speed)) {
      lastTick = now;

      state.minute += 10;
      if (state.minute >= 60) {
        state.minute = 0;
        state.hour += 1;
        if (state.hour >= 24) {
          state.hour = 0;
          state.day += 1;
          updateNewsTicker();
        }
      }

      // Cure synthesis
      if (state.cureProgress < 100) {
        const boost = state.distributionPriority === 'med' ? 0.08 : 0.05;
        state.cureProgress = Math.min(100, +(state.cureProgress + boost * state.speed).toFixed(1));
        const bar = document.getElementById('slug-cure-bar');
        const lbl = document.getElementById('slug-cure-text');
        if (bar) bar.style.width = `${state.cureProgress}%`;
        if (lbl) lbl.innerText = `${state.cureProgress}%`;
      }

      // Outbreak propagation
      if (state.infected < state.totalPop) {
        const factor = (state.isCarnaval ? 1.6 : 1.0) * (state.isNight ? 0.8 : 1.1) * (state.cercoVial ? 0.7 : 1.0);
        const spreadDelta = Math.floor((Math.random() * 32 + 10) * state.speed * factor);
        state.infected = Math.min(state.totalPop, state.infected + spreadDelta);
        state.healthy = Math.max(0, state.totalPop - state.infected);
        state.score += 25;
        const scoreEl = document.getElementById('score-counter');
        if (scoreEl) scoreEl.innerText = String(state.score).padStart(6, '0');
        updateHUD();
        updateAuditBars();
        updateContagionRadius();
      }
    }

    updateAndRender();
    requestAnimationFrame(simLoop);
  }

  requestAnimationFrame(simLoop);

  // Auto-zoom support for direct URL parameter (?zoom=combat)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('zoom') === 'combat' || urlParams.get('zoom') === '17') {
    setTimeout(() => {
      if (window.zoomToCombat) window.zoomToCombat();
    }, 800);
  }

  // Telemetry HUD updates
  function updateHUD() {
    const hEl = document.getElementById('metric-healthy');
    const hPct = document.getElementById('metric-healthy-pct');
    const iEl = document.getElementById('metric-infected');
    const iPct = document.getElementById('metric-infected-pct');

    if (hEl) hEl.innerText = state.healthy.toLocaleString('es-EC');
    if (hPct) hPct.innerText = `${((state.healthy / state.totalPop) * 100).toFixed(1)}%`;
    if (iEl) iEl.innerText = String(state.infected).padStart(6, '0');
    if (iPct) iPct.innerText = `+${((state.infected / state.totalPop) * 100).toFixed(1)}%`;
  }

  function updateAuditBars() {
    const pct = (state.infected / state.totalPop);
    const tarquiPct = Math.min(100, Math.round(pct * 120 + 40));
    const murcielagoPct = Math.min(100, Math.max(10, Math.round(pct * 90)));
    const eloyPct = Math.min(100, Math.round(pct * 110 + 20));

    const tBar = document.getElementById('bar-tarqui');
    const tText = document.getElementById('bar-tarqui-text');
    if (tBar) tBar.style.width = `${tarquiPct}%`;
    if (tText) tText.innerText = `${tarquiPct}% INFECTED`;

    const mBar = document.getElementById('bar-murcielago');
    const mText = document.getElementById('bar-murcielago-text');
    if (mBar) mBar.style.width = `${murcielagoPct}%`;
    if (mText) mText.innerText = `${murcielagoPct}% DEFENDED`;

    const eBar = document.getElementById('bar-eloy');
    const eText = document.getElementById('bar-eloy-text');
    if (eBar) eBar.style.width = `${eloyPct}%`;
    if (eText) eText.innerText = `${eloyPct}% CONTESTED`;
  }

  function updateContagionRadius() {
    const pct = (state.infected / state.totalPop);
    Object.keys(contagionCircles).forEach(key => {
      const circle = contagionCircles[key];
      if (circle) {
        const baseRadius = (key === state.activeEpicenter) ? 900 : 450;
        const newRadius = Math.round(baseRadius * (1 + pct * 2.2));
        circle.setRadius(newRadius);
        circle.setStyle({ fillOpacity: Math.min(0.6, 0.18 + pct * 0.38) });
      }
    });
  }

  function updateNewsTicker() {
    const ticker = document.getElementById('slug-news-ticker');
    if (!ticker) return;
    const messages = [
      `★ MISSION 1 // DÍA ${state.day}: ZOMBIE OUTBREAK INTENSIFIES IN TARQUI FISH MARKET // MUTANT BILE DETECTED // REGULAR ARMY AIRDROPS IMMINENT ★`,
      `★ MISSION 1 // DÍA ${state.day}: ARMORED CHECKPOINT REINFORCED ON E30 MONTECRISTI HIGHWAY & RUTA SPONDYLUS E15 // CURFEW ORDERED ★`,
      `★ MISSION 1 // DÍA ${state.day}: MANTA EMERGENCY COUNCIL ORDERS MASS QUARANTINE IN ELOY ALFARO & BARRIO JOCAY ★`,
      `★ MISSION 1 // DÍA ${state.day}: SUPPLY LAB REPORTS 50% ANTIDOTE SYNTHESIS // CHEMICAL PARACHUTE CRATES READY FOR DISPATCH ★`,
      `★ MISSION 1 // DÍA ${state.day}: CIVILIANS EVACUATED FROM EL MURCIÉLAGO BEACH AS VIRAL INFECTION RATE ACCELERATES ★`
    ];
    ticker.innerText = messages[state.day % messages.length];
  }

  // 5. EXPOSE USER ACTIONS TO WINDOW
  window.zoomToCombat = function() {
    let bestTarget = null;
    let minCombatDist = 9999;

    for (let i = 0; i < state.agents.length; i++) {
      const a = state.agents[i];
      if (!a.isInfected) {
        for (let j = 0; j < state.agents.length; j++) {
          const b = state.agents[j];
          if (b.isInfected) {
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
        statusText.innerText = 'COMBAT READY';
        statusText.className = 'text-emerald-400';
      }
    } else {
      if (btnText) btnText.innerText = '▶️ PLAY';
      if (statusText) {
        statusText.innerText = 'PAUSED';
        statusText.className = 'text-red-500 pulse-alert';
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

  window.changeEpicenter = function(epKey) {
    state.activeEpicenter = epKey;
    inspectLandmark(epKey);
    state.agents.forEach(a => {
      if (a.routeKey.includes(epKey) || Math.random() < 0.3) {
        a.isInfected = true;
        a.glitchTimer = 14;
      }
    });
    updateContagionRadius();
  };

  window.updateInitialPatients = function(val) {
    const text = document.getElementById('slug-patients-val');
    if (text) text.innerText = `${val} CASOS`;
    state.infected = parseInt(val, 10);
    state.healthy = state.totalPop - state.infected;
    updateHUD();
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

  // Parachute Antidote Supply Airdrop
  window.deployCureAirdrop = function() {
    const crate = document.getElementById('slug-parachute-crate');
    const targetNode = config.nodes[state.activeEpicenter] || config.nodes.Tarqui;

    const startPoint = map.latLngToContainerPoint([-0.9350, targetNode.lng]);
    const endPoint = map.latLngToContainerPoint([targetNode.lat, targetNode.lng]);

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
            const distKm = Math.hypot(a.lat - targetNode.lat, a.lng - targetNode.lng) * 111;
            if (a.isInfected && distKm < 1.4) {
              a.isInfected = false;
              a.glitchTimer = 20;
              a.cureTimer = 40;
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

          state.infected = Math.max(0, state.infected - 1500);
          state.recovered += 1500;
          state.healthy += 1500;
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
      if (b) b.className = "btn-slug-dark py-1 text-[9px] rounded text-slate-300 font-heavy";
    });
    const act = document.getElementById(`slug-prio-${p}`);
    if (act) act.className = "btn-slug-green py-1 text-[9px] rounded text-black font-heavy";
  };

  window.resetSimulation = function() {
    state.day = 1;
    state.hour = 8;
    state.minute = 0;
    state.infected = 120;
    state.healthy = state.totalPop - 120;
    state.cureProgress = 12.0;
    initAgents();
    updateHUD();
    updateContagionRadius();
    const bar = document.getElementById('slug-cure-bar');
    const lbl = document.getElementById('slug-cure-text');
    if (bar) bar.style.width = '12%';
    if (lbl) lbl.innerText = '12.0%';
  };

})();
