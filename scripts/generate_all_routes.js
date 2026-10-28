const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'frontend', 'assets', 'manta_routes.js');

// Nodos y corredores: fuente única en frontend/js/manta-config.js
global.window = {};
require(path.join(__dirname, '..', 'frontend', 'js', 'manta-config.js'));
const NODES = window.MANTA_CONFIG.nodes;
const PAIRS = window.MANTA_CONFIG.routePairs;
const FORCE = process.argv.includes('--all');  // por defecto solo pide a OSRM las rutas que faltan

function loadExisting() {
  if (FORCE || !fs.existsSync(OUT)) return {};
  global.window.MANTA_STREET_ROUTES = {};
  new Function('window', fs.readFileSync(OUT, 'utf8'))(global.window);
  return global.window.MANTA_STREET_ROUTES;
}

function fetchOSRM(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'MantaRouteBuilder/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.routes && j.routes[0]) {
            // OSRM returns [lon, lat], we want [lat, lng]
            const coords = j.routes[0].geometry.coordinates.map(c => [
              parseFloat(c[1].toFixed(5)),
              parseFloat(c[0].toFixed(5))
            ]);
            resolve(coords);
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function interpolate(p1, p2, count) {
  const res = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    res.push([
      parseFloat((p1.lat + t * (p2.lat - p1.lat)).toFixed(5)),
      parseFloat((p1.lng + t * (p2.lng - p1.lng)).toFixed(5))
    ]);
  }
  return res;
}

async function run() {
  const existing = loadExisting();
  const result = {};
  const keys = Object.keys(PAIRS);
  console.log(`Starting generation for ${keys.length} routes (${Object.keys(existing).length} existentes)...`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const [fromK, toK] = PAIRS[key];
    const fromNode = NODES[fromK];
    const toNode = NODES[toK];
    if (existing[key]) { result[key] = existing[key]; continue; }

    console.log(`[${i + 1}/${keys.length}] Fetching ${key}...`);
    let coords = await fetchOSRM(fromNode, toNode);

    if (coords && coords.length >= 2) {
      result[key] = coords;
      console.log(`  -> OK: ${coords.length} street waypoints`);
    } else {
      console.log(`  -> Fallback interpolation for ${key}`);
      result[key] = interpolate(fromNode, toNode, 20);
    }
    // Small polite delay between requests
    await new Promise(r => setTimeout(r, 600));
  }

  // Ensure Murcielago_Tarqui specifically follows the coastal road via PuertoManta and Pescador if OSRM doesn't do it cleanly
  if (result.Murcielago_PuertoManta && result.PuertoManta_Pescador && result.Pescador_Tarqui) {
    console.log('Ensuring Murcielago_Tarqui follows coastal curve perfectly...');
    result.Murcielago_Tarqui = [
      ...result.Murcielago_PuertoManta,
      ...result.PuertoManta_Pescador.slice(1),
      ...result.Pescador_Tarqui.slice(1)
    ];
  }

  const outStr = 'window.MANTA_STREET_ROUTES = ' + JSON.stringify(result) + ';\n';
  fs.writeFileSync(OUT, outStr);
  console.log('Successfully written ' + OUT);
}

run();
