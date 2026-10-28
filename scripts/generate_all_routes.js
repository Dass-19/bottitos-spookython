const https = require('https');
const fs = require('fs');

// Real terrestrial nodes of Manta Cantón
const NODES = {
  Murcielago: { lat: -0.9416, lng: -80.7298, name: 'Av. Malecón y Calle 24 (Murciélago)' },
  Calle13: { lat: -0.9472, lng: -80.7268, name: 'Calle 13 y Av. 24 (Callejón Central)' },
  FlavioReyes: { lat: -0.9508, lng: -80.7285, name: 'Av. Flavio Reyes y Calle 15' },
  HospitalRZ: { lat: -0.9525, lng: -80.7262, name: 'Av. 24 y Calle 12 (Hospital RZ)' },
  Barbasquillo: { lat: -0.9482, lng: -80.7412, name: 'Av. Barbasquillo y Calle M1' },
  ULEAM: { lat: -0.9556, lng: -80.7482, name: 'Av. Circunvalación y Vía a San Mateo (ULEAM)' },
  PuertoManta: { lat: -0.9455, lng: -80.7227, name: 'Av. Malecón y Plaza Cívica (Acceso Puerto)' },
  Pescador: { lat: -0.9506, lng: -80.7205, name: 'Redondel de INEPACA / Av. Malecón' },
  Tarqui: { lat: -0.9525, lng: -80.7072, name: 'Av. 105 y Calle 102 (Mercado Tarqui)' },
  TarquiPlayita: { lat: -0.9519, lng: -80.7122, name: 'Malecón de Tarqui y Playita Mía' },
  Jocay: { lat: -0.9572, lng: -80.7098, name: 'Av. 4 de Noviembre y Calle J-10 (Jocay)' },
  VeinteDeMayo: { lat: -0.9682, lng: -80.7228, name: 'Av. Interbarrial y Calle 308 (20 de Mayo)' },
  EloyAlfaro: { lat: -0.9781, lng: -80.7180, name: 'Vía Interbarrial y Av. 212 (Eloy Alfaro)' },
  LosEsteros: { lat: -0.9520, lng: -80.6890, name: 'Av. 102 y Calle 119 (Los Esteros)' },
  Palmar: { lat: -0.9615, lng: -80.6865, name: 'Av. de la Cultura y Terminal El Palmar' },
  Aeropuerto: { lat: -0.9525, lng: -80.6765, name: 'Vía Puerto-Aeropuerto (Base MEC)' },
  Jaramijo: { lat: -0.9510, lng: -80.6400, name: 'Vía Manta-Jaramijó y Caleta Este' },
  SanMateo: { lat: -0.9850, lng: -80.8120, name: 'Ruta Spondylus E15 y Acceso San Mateo' },
  Montecristi: { lat: -1.0450, lng: -80.6620, name: 'Intercambiador E30 y Vía Montecristi' },
  Marianita: { lat: -1.0250, lng: -80.8450, name: 'Ruta Spondylus E15 y Santa Marianita' }
};

const PAIRS = {
  // Eje Costero & Portuario (100% TERRESTRE)
  Murcielago_PuertoManta: ['Murcielago', 'PuertoManta'],
  PuertoManta_Pescador: ['PuertoManta', 'Pescador'],
  Pescador_Tarqui: ['Pescador', 'Tarqui'],
  Tarqui_TarquiPlayita: ['Tarqui', 'TarquiPlayita'],
  TarquiPlayita_LosEsteros: ['TarquiPlayita', 'LosEsteros'],
  Murcielago_Tarqui: ['Murcielago', 'Tarqui'],
  Pescador_Jocay: ['Pescador', 'Jocay'],

  // Centro Urbano & Callejones Comerciales
  Murcielago_Calle13: ['Murcielago', 'Calle13'],
  Calle13_FlavioReyes: ['Calle13', 'FlavioReyes'],
  FlavioReyes_HospitalRZ: ['FlavioReyes', 'HospitalRZ'],
  HospitalRZ_Jocay: ['HospitalRZ', 'Jocay'],
  FlavioReyes_Barbasquillo: ['FlavioReyes', 'Barbasquillo'],
  FlavioReyes_Jocay: ['FlavioReyes', 'Jocay'],
  Murcielago_Jocay: ['Murcielago', 'Jocay'],
  Tarqui_Jocay: ['Tarqui', 'Jocay'],

  // Barbasquillo, ULEAM & Spondylus Oeste
  Murcielago_Barbasquillo: ['Murcielago', 'Barbasquillo'],
  Barbasquillo_ULEAM: ['Barbasquillo', 'ULEAM'],
  ULEAM_SanMateo: ['ULEAM', 'SanMateo'],
  Murcielago_SanMateo: ['Murcielago', 'SanMateo'],
  SanMateo_Marianita: ['SanMateo', 'Marianita'],

  // Eje Este (Los Esteros, Palmar, Aeropuerto, Jaramijó)
  Tarqui_LosEsteros: ['Tarqui', 'LosEsteros'],
  Tarqui_Palmar: ['Tarqui', 'Palmar'],
  LosEsteros_Palmar: ['LosEsteros', 'Palmar'],
  Palmar_Aeropuerto: ['Palmar', 'Aeropuerto'],
  Aeropuerto_Jaramijo: ['Aeropuerto', 'Jaramijo'],
  LosEsteros_Jaramijo: ['LosEsteros', 'Jaramijo'],

  // Eje Sur & Vía Interbarrial
  Jocay_VeinteDeMayo: ['Jocay', 'VeinteDeMayo'],
  VeinteDeMayo_EloyAlfaro: ['VeinteDeMayo', 'EloyAlfaro'],
  Jocay_EloyAlfaro: ['Jocay', 'EloyAlfaro'],
  ULEAM_EloyAlfaro: ['ULEAM', 'EloyAlfaro'],
  EloyAlfaro_Montecristi: ['EloyAlfaro', 'Montecristi'],
  Jocay_Montecristi: ['Jocay', 'Montecristi']
};

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
  const result = {};
  const keys = Object.keys(PAIRS);
  console.log(`Starting generation for ${keys.length} routes...`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const [fromK, toK] = PAIRS[key];
    const fromNode = NODES[fromK];
    const toNode = NODES[toK];

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
  fs.writeFileSync('assets/manta_routes.js', outStr);
  console.log('Successfully written assets/manta_routes.js!');
}

run();
