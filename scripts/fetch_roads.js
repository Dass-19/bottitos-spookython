const https = require('https');

const query = `[out:json][timeout:25];
(
  way["highway"]["name"~"Malecón|Chávez|105|Puerto|Tarqui",i](-0.96,-80.74,-0.93,-80.70);
);
out geom;`;

const postData = 'data=' + encodeURIComponent(query);
const req = https.request('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'MantaSimulator/1.0',
    'Content-Length': Buffer.byteLength(postData)
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Ways found:', json.elements.length);
      json.elements.forEach(w => {
        const first = w.geometry[0];
        const last = w.geometry[w.geometry.length - 1];
        console.log(`[${w.id}] ${w.tags.name} | pts: ${w.geometry.length} | start: [${first.lat}, ${first.lon}] -> end: [${last.lat}, ${last.lon}]`);
      });
    } catch(err) {
      console.error(err.message, data.slice(0, 200));
    }
  });
});
req.write(postData);
req.end();
