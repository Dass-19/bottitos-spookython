const https = require('https');

function route(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MantaSimulator/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Route from Murcielago [-0.9416, -80.7298] to Pescador [-0.9472, -80.7148]
  const res = await route([-0.9416, -80.7298], [-0.9472, -80.7148]);
  if (res.routes && res.routes[0]) {
    const coords = res.routes[0].geometry.coordinates; // [lon, lat]
    console.log('OSRM Murcielago -> Pescador points count:', coords.length);
    console.log('First point:', coords[0]);
    console.log('Middle point:', coords[Math.floor(coords.length / 2)]);
    console.log('Last point:', coords[coords.length - 1]);
    console.log('Min lat:', Math.min(...coords.map(c => c[1])));
    console.log('Max lat:', Math.max(...coords.map(c => c[1])));
    console.log('Min lon:', Math.min(...coords.map(c => c[0])));
    console.log('Max lon:', Math.max(...coords.map(c => c[0])));
  } else {
    console.log('No routes found:', res);
  }
}

main().catch(console.error);
