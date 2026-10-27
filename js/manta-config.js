// ==========================================================================
// MANTA OUTBREAK // GPS LANDMARKS & ROAD NETWORK CONFIGURATION
// ==========================================================================

const MANTA_CONFIG = {
  center: [-0.958, -80.718],

  // Official landmarks of Manta Cantón with descriptions
  nodes: {
    Tarqui: {
      lat: -0.9495,
      lng: -80.7075,
      name: 'Mercado de Tarqui',
      desc: 'Epicentro cero. Puestos de mariscos y muelle pesquero artesanal.'
    },
    Murcielago: {
      lat: -0.9425,
      lng: -80.7305,
      name: 'Playa Murciélago',
      desc: 'Zona turística y balneario costero. Gran aglomeración en Malecón Escénico.'
    },
    Jocay: {
      lat: -0.9570,
      lng: -80.7100,
      name: 'Barrio Jocay (Av. 4 de Nov)',
      desc: 'Eje comercial céntrico conectado a Tarqui y Parroquia Eloy Alfaro.'
    },
    EloyAlfaro: {
      lat: -0.9780,
      lng: -80.7180,
      name: 'Parroquia Eloy Alfaro',
      desc: 'Sector residencial denso atravesado por la Vía Interbarrial.'
    },
    LosEsteros: {
      lat: -0.9520,
      lng: -80.6890,
      name: 'Costa Azul / Los Esteros',
      desc: 'Sector de plantas atuneras y muelles de descarga artesanal.'
    },
    Montecristi: {
      lat: -1.0450,
      lng: -80.6620,
      name: 'Nudo E30 Montecristi',
      desc: 'Límite cantonal y salida sur hacia Portoviejo e interior provincial.'
    },
    SanMateo: {
      lat: -0.9850,
      lng: -80.8120,
      name: 'Caleta San Mateo',
      desc: 'Población pesquera al oeste por la Ruta del Spondylus E15.'
    },
    Jaramijo: {
      lat: -0.9510,
      lng: -80.6400,
      name: 'Playa Jaramijó',
      desc: 'Límite costero este con caleta pesquera.'
    },
    Marianita: {
      lat: -1.0250,
      lng: -80.8450,
      name: 'Santa Marianita',
      desc: 'Población balnearia costera al suroeste por Ruta E15.'
    }
  },

  // 10 Road Corridor Pairings
  routePairs: {
    Murcielago_Jocay: ['Murcielago', 'Jocay'],
    EloyAlfaro_Montecristi: ['EloyAlfaro', 'Montecristi'],
    Tarqui_Jocay: ['Tarqui', 'Jocay'],
    Jocay_EloyAlfaro: ['Jocay', 'EloyAlfaro'],
    Murcielago_SanMateo: ['Murcielago', 'SanMateo'],
    LosEsteros_Jaramijo: ['LosEsteros', 'Jaramijo'],
    SanMateo_Marianita: ['SanMateo', 'Marianita'],
    Tarqui_LosEsteros: ['Tarqui', 'LosEsteros'],
    Murcielago_Tarqui: ['Murcielago', 'Tarqui'],
    Jocay_Montecristi: ['Jocay', 'Montecristi']
  },

  // Haversine distance in meters
  haversine(p1, p2) {
    const R = 6371000;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLng = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
};

window.MANTA_CONFIG = MANTA_CONFIG;
