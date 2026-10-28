// ==========================================================================
// MantaZero: Epidemic Command // GPS LANDMARKS & STREET NETWORK (CALLES / AVENIDAS / VÍAS)
// 30 nodos de calles y barrios reales de Manta (OSM), unidos por 52 corredores viales
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
    },
    SantaMartha: {
      lat: -0.9569,
      lng: -80.73466,
      name: 'Av. 34 (Santa Martha)',
      street: 'Avenida 34',
      desc: 'Barrio residencial al sur del centro de Manta.'
    },
    AbdonCalderon: {
      lat: -0.9581,
      lng: -80.74193,
      name: 'Barrio Abdón Calderón',
      street: 'Calles interiores',
      desc: 'Barrio popular denso entre Santa Martha y la ULEAM.'
    },
    Manta2000: {
      lat: -0.95914,
      lng: -80.75117,
      name: 'Av. 4 (Manta 2000)',
      street: 'Avenida 4',
      desc: 'Urbanización residencial del sector Barbasquillo.'
    },
    CiudadDelSol: {
      lat: -0.96368,
      lng: -80.75412,
      name: 'Calle Principal de Ciudad del Sol',
      street: 'Calle Principal',
      desc: 'Ciudadela residencial en el borde suroeste urbano.'
    },
    Miraflores: {
      lat: -0.95665,
      lng: -80.71923,
      name: 'Calle 1 de Enero (Miraflores)',
      street: 'Calle 1 de Enero',
      desc: 'Barrio de Tarqui entre el centro y Jocay.'
    },
    LosGeranios: {
      lat: -0.97843,
      lng: -80.72525,
      name: 'Ciudadela Los Geranios',
      street: 'Calles interiores',
      desc: 'Ciudadela residencial de la parroquia Tarqui.'
    },
    Urbirrios: {
      lat: -0.98284,
      lng: -80.7228,
      name: 'Calle H (Urbirríos)',
      street: 'Calle H',
      desc: 'Urbanización popular al sur de Tarqui.'
    },
    NuevaEsperanza: {
      lat: -0.98491,
      lng: -80.71248,
      name: 'Calle 103 (Nueva Esperanza)',
      street: 'Calle 103',
      desc: 'Barrio de la parroquia Eloy Alfaro.'
    },
    LaAurora: {
      lat: -0.98088,
      lng: -80.69792,
      name: 'Ciudadela La Aurora',
      street: 'Calles interiores',
      desc: 'Ciudadela residencial de la parroquia Eloy Alfaro.'
    },
    Altamira: {
      lat: -0.96788,
      lng: -80.689,
      name: 'Altamira (Los Esteros)',
      street: 'Calles interiores',
      desc: 'Urbanización al sur de Los Esteros, cerca de El Palmar.'
    }
  },

  // Corredores viales (geometría real en assets/manta_routes.js, generada con scripts/generate_all_routes.js)
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
    Jocay_Montecristi: ['Jocay', 'Montecristi'],

    // Barrios residenciales (dispersión de la población)
    HospitalRZ_SantaMartha: ['HospitalRZ', 'SantaMartha'],
    SantaMartha_AbdonCalderon: ['SantaMartha', 'AbdonCalderon'],
    AbdonCalderon_ULEAM: ['AbdonCalderon', 'ULEAM'],
    AbdonCalderon_Manta2000: ['AbdonCalderon', 'Manta2000'],
    ULEAM_Manta2000: ['ULEAM', 'Manta2000'],
    Manta2000_CiudadDelSol: ['Manta2000', 'CiudadDelSol'],
    CiudadDelSol_AbdonCalderon: ['CiudadDelSol', 'AbdonCalderon'],
    SantaMartha_VeinteDeMayo: ['SantaMartha', 'VeinteDeMayo'],
    Jocay_Miraflores: ['Jocay', 'Miraflores'],
    Miraflores_HospitalRZ: ['Miraflores', 'HospitalRZ'],
    Miraflores_VeinteDeMayo: ['Miraflores', 'VeinteDeMayo'],
    VeinteDeMayo_LosGeranios: ['VeinteDeMayo', 'LosGeranios'],
    LosGeranios_Urbirrios: ['LosGeranios', 'Urbirrios'],
    Urbirrios_NuevaEsperanza: ['Urbirrios', 'NuevaEsperanza'],
    NuevaEsperanza_EloyAlfaro: ['NuevaEsperanza', 'EloyAlfaro'],
    NuevaEsperanza_LaAurora: ['NuevaEsperanza', 'LaAurora'],
    LaAurora_EloyAlfaro: ['LaAurora', 'EloyAlfaro'],
    LaAurora_Altamira: ['LaAurora', 'Altamira'],
    Altamira_Palmar: ['Altamira', 'Palmar'],
    Altamira_LosEsteros: ['Altamira', 'LosEsteros']
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
