// ==========================================================================
// MANTA OUTBREAK // GPS LANDMARKS & STREET NETWORK (CALLES / AVENIDAS / VÍAS)
// 20 Official Street & Avenue Intersections of Manta Cantón
// ==========================================================================

const MANTA_CONFIG = {
  center: [-0.958, -80.718],

  // 20 Nodes snapped to real streets, avenues, and alleys of Manta
  nodes: {
    Murcielago: {
      lat: -0.9416,
      lng: -80.7298,
      name: 'Av. Malecón y Calle 24 (Murciélago)',
      street: 'Av. Malecón Jaime Chávez Ramírez',
      desc: 'Malecón Escénico y acceso principal a Playa El Murciélago.'
    },
    Calle13: {
      lat: -0.9472,
      lng: -80.7268,
      name: 'Calle 13 y Av. 24 (Callejón Central)',
      street: 'Calle 13 (Eje Comercial)',
      desc: 'Corredor comercial denso y bancario del centro de Manta.'
    },
    FlavioReyes: {
      lat: -0.9508,
      lng: -80.7285,
      name: 'Av. Flavio Reyes y Calle 15',
      street: 'Av. Flavio Reyes',
      desc: 'Corredor gastronómico, bares y zona rosa central.'
    },
    HospitalRZ: {
      lat: -0.9525,
      lng: -80.7262,
      name: 'Av. 24 y Calle 12 (Hospital RZ)',
      street: 'Av. 24',
      desc: 'Hospital General Dr. Rodríguez Zambrano y complejo médico.'
    },
    Barbasquillo: {
      lat: -0.9482,
      lng: -80.7412,
      name: 'Av. Barbasquillo y Calle M1',
      street: 'Av. Barbasquillo',
      desc: 'Distrito hotelero, Manta Business Center y acantilado sur.'
    },
    ULEAM: {
      lat: -0.9556,
      lng: -80.7482,
      name: 'Av. Circunvalación y Vía a San Mateo (ULEAM)',
      street: 'Av. Circunvalación Tramo 1',
      desc: 'Ciudadela universitaria de la ULEAM con alto flujo de estudiantes.'
    },
    PuertoManta: {
      lat: -0.9455,
      lng: -80.7227,
      name: 'Av. Malecón y Plaza Cívica (Acceso Puerto)',
      street: 'Av. Malecón Jaime Chávez Ramírez',
      desc: 'Terminal Portuario Internacional de Manta (Acceso Terrestre APM) y Plaza Cívica.'
    },
    Pescador: {
      lat: -0.9506,
      lng: -80.7205,
      name: 'Redondel de INEPACA (El Pescador)',
      street: 'Av. Malecón y Av. 4 de Noviembre',
      desc: 'Redondel vial estratégico de distribución entre el Puerto, Tarqui y el Centro.'
    },
    Tarqui: {
      lat: -0.9525,
      lng: -80.7072,
      name: 'Av. 105 y Calle 102 (Mercado Tarqui)',
      street: 'Av. 105',
      desc: 'Epicentro cero. Mercado de Tarqui y zona comercial de mariscos.'
    },
    TarquiPlayita: {
      lat: -0.9519,
      lng: -80.7122,
      name: 'Malecón de Tarqui y Playita Mía',
      street: 'Malecón de Tarqui',
      desc: 'Playa pesquera artesanal y astillero de botes.'
    },
    Jocay: {
      lat: -0.9572,
      lng: -80.7098,
      name: 'Av. 4 de Noviembre y Calle J-10 (Jocay)',
      street: 'Av. 4 de Noviembre',
      desc: 'Arteria principal de conexión norte-sur y repuesteras.'
    },
    VeinteDeMayo: {
      lat: -0.9682,
      lng: -80.7228,
      name: 'Av. Interbarrial y Calle 308 (20 de Mayo)',
      street: 'Av. Interbarrial',
      desc: 'Sector densamente poblado del eje de la Vía Interbarrial.'
    },
    EloyAlfaro: {
      lat: -0.9781,
      lng: -80.7180,
      name: 'Vía Interbarrial y Av. 212 (Eloy Alfaro)',
      street: 'Vía Interbarrial',
      desc: 'Parroquia Eloy Alfaro, sector residencial denso.'
    },
    LosEsteros: {
      lat: -0.9520,
      lng: -80.6890,
      name: 'Av. 102 y Calle 119 (Los Esteros)',
      street: 'Av. 102',
      desc: 'Sector industrial atunero y muelles pesqueros.'
    },
    Palmar: {
      lat: -0.9615,
      lng: -80.6865,
      name: 'Av. de la Cultura y Terminal El Palmar',
      street: 'Av. de la Cultura',
      desc: 'Terminal Terrestre Luis Valdivieso Morán.'
    },
    Aeropuerto: {
      lat: -0.9525,
      lng: -80.6765,
      name: 'Vía Puerto-Aeropuerto (Base Aérea MEC)',
      street: 'Vía Puerto-Aeropuerto',
      desc: 'Aeropuerto Internacional Eloy Alfaro y Base Militar FAE.'
    },
    Jaramijo: {
      lat: -0.9510,
      lng: -80.6400,
      name: 'Vía Manta-Jaramijó y Caleta Este',
      street: 'Vía a Jaramijó',
      desc: 'Límite costero este con caleta pesquera artesanal.'
    },
    SanMateo: {
      lat: -0.9850,
      lng: -80.8120,
      name: 'Ruta Spondylus E15 y Acceso San Mateo',
      street: 'Ruta del Spondylus E15',
      desc: 'Caleta pesquera y puerto artesanal de San Mateo al oeste.'
    },
    Montecristi: {
      lat: -1.0450,
      lng: -80.6620,
      name: 'Intercambiador E30 y Vía Montecristi',
      street: 'Autovía E30',
      desc: 'Salida sur cantonal hacia Montecristi y Portoviejo.'
    },
    Marianita: {
      lat: -1.0250,
      lng: -80.8450,
      name: 'Ruta Spondylus E15 y Santa Marianita',
      street: 'Ruta del Spondylus E15',
      desc: 'Playa balnearia y límite suroeste del cantón.'
    }
  },

  // 30 Corredores Viales Urbanos
  routePairs: {
    // Eje Costero & Portuario
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

    // Eje Sur & Vía Interbarrial (Jocay, 20 de Mayo, Eloy Alfaro, Montecristi)
    Jocay_VeinteDeMayo: ['Jocay', 'VeinteDeMayo'],
    VeinteDeMayo_EloyAlfaro: ['VeinteDeMayo', 'EloyAlfaro'],
    Jocay_EloyAlfaro: ['Jocay', 'EloyAlfaro'],
    ULEAM_EloyAlfaro: ['ULEAM', 'EloyAlfaro'],
    EloyAlfaro_Montecristi: ['EloyAlfaro', 'Montecristi'],
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
