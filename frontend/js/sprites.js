// ==========================================================================
// METAL SLUG ZOMBIE & HERO SPRITE ENGINES (HTML5 2D CANVAS)
// Based on official Metal Slug Wiki: https://metalslug.fandom.com/wiki/Zombies
// 4 EPIDEMIOLOGICAL STATES:
// 1. HUMANO (S) - PF Squad, SPARROWS, Rebel Soldiers, Scientists
// 2. MORDIDO (E) - Incubando Virus Z con convulsiones y tos de bilis
// 3. INFECTADO (I) - Zombis de Metal Slug (Zombie Heroes, Rebel Zombie, Scientist Zombie, Tar Man) + Chorro Vómito de Sangre
// 4. INMUNE (R) - Tropas Hazmat con Máscara Antigás y Botiquín de Primeros Auxilios (First-Aid Kit)
// ==========================================================================

const HERO_ROSTER = {
  marco: {
    id: 'marco',
    name: 'MARCO',
    title: 'PF Squad Leader',
    hairColor: '#fcd34d',      // Rubio brillante
    headbandColor: '#ef4444',  // Cinta roja icónica
    vestColor: '#ea580c',      // Chaleco naranja clásico
    shirtColor: '#f8fafc',     // Camiseta blanca
    pantsColor: '#365314',     // Pantalón verde oliva
    skinColor: '#fed7aa',      // Tono piel humano
    hasGlasses: false,
    hasCap: false,
    hasBandana: true
  },
  tarma: {
    id: 'tarma',
    name: 'TARMA',
    title: 'PF Squad Operative',
    hairColor: '#451a03',      // Castaño despeinado
    headbandColor: null,
    vestColor: '#166534',      // Chaleco verde militar
    shirtColor: '#fef08a',     // Camiseta crema
    pantsColor: '#854d0e',     // Pantalón caqui
    skinColor: '#fed7aa',
    hasGlasses: true,          // Gafas de sol oscuras
    glassesColor: '#020617',
    hasCap: false,
    hasBandana: false
  },
  eri: {
    id: 'eri',
    name: 'ERI',
    title: 'SPARROWS Operative',
    hairColor: '#fde047',      // Rubio claro
    headbandColor: '#4d7c0f',  // Bandana verde olivo
    vestColor: '#3f6212',      // Top verde militar
    shirtColor: '#ffffff',
    pantsColor: '#365314',     // Pantalón camuflaje
    skinColor: '#fde68a',
    hasGlasses: false,
    hasCap: false,
    hasBandana: true
  },
  fio: {
    id: 'fio',
    name: 'FIO',
    title: 'SPARROWS Medic',
    hairColor: '#78350f',      // Castaño con coletas
    headbandColor: null,
    vestColor: '#0284c7',      // Chaleco azul
    shirtColor: '#ffffff',
    pantsColor: '#a16207',     // Bermudas caqui
    skinColor: '#fde68a',
    hasGlasses: true,          // Gafas redondas de ver
    glassesColor: '#38bdf8',
    hasCap: true,              // Boina scout marrón
    capColor: '#854d0e',
    hasBandana: false
  },
  rebel: {
    id: 'rebel',
    name: 'REBEL SOLDIER',
    title: 'Morden Army Guard',
    hairColor: '#1f2937',
    headbandColor: null,
    vestColor: '#14532d',      // Uniforme militar verde oscuro
    shirtColor: '#166534',
    pantsColor: '#1c3924',
    skinColor: '#fed7aa',
    hasGlasses: false,
    hasCap: false,
    hasHelmet: true,           // Casco de acero Morden
    helmetColor: '#475569',
    isRebel: true
  },
  scientist: {
    id: 'scientist',
    name: 'SCIENTIST',
    title: 'Bio-Research Doctor',
    hairColor: '#94a3b8',      // Pelo grisáceo ralo
    headbandColor: null,
    vestColor: '#f8fafc',      // Bata blanca de laboratorio
    shirtColor: '#0284c7',     // Camisa azul
    tieColor: '#dc2626',       // Corbata roja
    pantsColor: '#334155',     // Pantalón de vestir oscuro
    skinColor: '#fef08a',
    hasGlasses: true,
    glassesColor: '#0f172a',
    isScientist: true
  },
  tarman: {
    id: 'tarman',
    name: 'TAR MAN',
    title: 'Alien Residue Mutation',
    hairColor: '#09090b',
    headbandColor: null,
    vestColor: '#09090b',      // Masa de alquitrán negra
    shirtColor: '#18181b',
    pantsColor: '#09090b',
    skinColor: '#1c1917',
    hasGlasses: false,
    hasCap: false,
    isTarMan: true
  }
};

const MANTA_SPRITES = {
  HEROES: HERO_ROSTER,

  // ==========================================================================
  // 1. TACTICAL CHIBI HEAD ICON (ZOOM < 15)
  // ==========================================================================
  drawTacticalChibiHead(ctx, x, y, stateType, glitchTimer, bob, incubationPct = 0, heroId = 'marco') {
    ctx.save();
    const yOffset = Math.sin(bob) * 1.5;
    ctx.translate(Math.round(x), Math.round(y + yOffset));

    const isInf = (stateType === 'infected' || stateType === true);
    const isBit = (stateType === 'bitten');
    const isImm = (stateType === 'immune');
    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    if (isInf) {
      // ----------------------------------------------------
      // ESTADO: INFECTADO / ZOMBIE (Metal Slug Fandom Wiki)
      // ----------------------------------------------------
      if (glitchTimer > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      
      // Halo de Peligro Biohazard Rojo
      ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();

      if (hero.isTarMan) {
        // Tar Man Chibi: Gota de brea negra con ojos rojos
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(0, -1, 6.5, 0, Math.PI * 2);
        ctx.fill();
        // Ojos carmesí brillantes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-3, -1, 2, 2);
        ctx.fillRect(1, -1, 2, 2);
      } else {
        // Piel cadavérica verdosa ceniza canónica de Metal Slug
        ctx.fillStyle = '#657a6e';
        ctx.fillRect(-4, -2, 8, 7);

        // Cabello o Casco dañado
        if (hero.hasHelmet) {
          // Casco rebelde ladeado abollado
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(1, -3, 6, Math.PI + 0.3, 0.3);
          ctx.fill();
        } else if (hero.hasCap) {
          ctx.fillStyle = '#5c3d2e';
          ctx.fillRect(-4.5, -5, 9, 2.5);
        } else if (hero.hasBandana && hero.headbandColor) {
          ctx.fillStyle = hero.headbandColor;
          ctx.fillRect(-4.5, -4, 9, 2);
        } else {
          ctx.fillStyle = '#3f4f46';
          ctx.fillRect(-4, -4, 8, 2.5);
        }

        // Ojos carmesí inyectados en sangre
        if (hero.hasGlasses && !hero.isScientist) {
          ctx.fillStyle = '#020617';
          ctx.fillRect(-3.5, 0, 3, 2);
          ctx.fillRect(0.5, 0, 3, 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, 0.5, 1, 1);
          ctx.fillRect(2, 0.5, 1, 1);
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-3, 0, 2, 2);
          ctx.fillRect(1, 0, 2, 2);
        }

        // Salpicadura de sangre / bilis en la boca abierta
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-2.5, 3, 5, 2.5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-1.5, 4.5, 3, 2);
      }

      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-5, -3, 10, 8.5);

    } else if (isBit) {
      // ----------------------------------------------------
      // ESTADO: MORDIDO / INCUBANDO VIRUS Z
      // ----------------------------------------------------
      if (glitchTimer > 0) ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
      
      // Aura de Alerta Ámbar
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Piel amarillenta enfermiza con palidez cetrina
      ctx.fillStyle = '#c5b078';
      ctx.fillRect(-4, -2, 8, 7);

      // Cabello o Casco original desalineado
      ctx.fillStyle = hero.hairColor;
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-4.5, -4, 9, 2);
      } else if (hero.hasCap) {
        ctx.fillStyle = hero.capColor || '#854d0e';
        ctx.fillRect(-4.5, -5, 9, 2.5);
      } else if (hero.hasHelmet) {
        ctx.fillStyle = hero.helmetColor;
        ctx.beginPath();
        ctx.arc(0, -3, 6, Math.PI, 0);
        ctx.fill();
      }

      // Ojos febriles rojizos
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-3, 0.5, 1.8, 1.8);
      ctx.fillRect(1.2, 0.5, 1.8, 1.8);

      // Mini barra de incubación Virus Z
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -9, 12, 3);
      const gaugeW = Math.max(1, Math.min(12, Math.round(12 * incubationPct)));
      ctx.fillStyle = (incubationPct > 0.7) ? '#ef4444' : '#f59e0b';
      ctx.fillRect(-6, -9, gaugeW, 3);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-5, -2, 10, 7.5);

    } else if (isImm) {
      // ----------------------------------------------------
      // ESTADO: INMUNE // HAZMAT & FIRST-AID KIT (Metal Slug)
      // ----------------------------------------------------
      // Aura dorada y cian de descontaminación
      ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
      ctx.fill();

      // Máscara Antigás / Escafandra Hazmat
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4.5, -2, 9, 7);
      // Visor de Cristal Azul Cobalto Reflectante
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3.5, -0.5, 7, 2.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, 0, 1.5, 1); // Brillo

      // Filtro respirador inferior con Cruz Roja
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, 2.5, 4, 2.5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1, 3.2, 2, 1);
      ctx.fillRect(-0.5, 2.7, 1, 2);

      // Capucha protectora Hazmat amarilla
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-5, -3, 10, 8.5);

      // Icono flotante de Botiquín (+)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -11, 6, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -9.5, 4, 1);
      ctx.fillRect(-0.5, -10.5, 1, 3);

    } else {
      // ----------------------------------------------------
      // ESTADO: HUMANO // PEREGRINE FALCON / REBEL / SCIENTIST
      // ----------------------------------------------------
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Piel humana
      ctx.fillStyle = hero.skinColor || '#fed7aa';
      ctx.fillRect(-4, -1, 8, 6.5);

      // Pelo o Casco
      ctx.fillStyle = hero.hairColor;
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      // Accesorios humanos icónicos
      if (hero.hasHelmet) {
        ctx.fillStyle = hero.helmetColor;
        ctx.beginPath();
        ctx.arc(0, -2, 6.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5, -3, 10, 2); // Ala del casco
      } else if (hero.hasCap) {
        ctx.fillStyle = hero.capColor || '#854d0e';
        ctx.fillRect(-5, -5, 10, 3);
        ctx.fillRect(1, -5, 4, 1.5);
      } else if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-5, -4, 10, 2);
      }

      // Ojos o Gafas
      if (hero.hasGlasses) {
        ctx.fillStyle = hero.glassesColor || '#020617';
        ctx.fillRect(-3.5, 0.5, 3, 2);
        ctx.fillRect(0.5, 0.5, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2.5, 1, 1, 1);
        ctx.fillRect(1.5, 1, 1, 1);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, 1, 1.5, 1.5);
        ctx.fillRect(1.5, 1, 1.5, 1.5);
      }

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-5, -2, 10, 7.5);
    }
    ctx.restore();
  },

  // ==========================================================================
  // 2. HUMANO // METAL SLUG OPERATIVES & SOLDIERS (ZOOM >= 15)
  // ==========================================================================
  drawSoldierMicroSprite(ctx, x, y, facing, animFrame, isShooting, alertTimer, cureTimer, scale, hasAmmo = true, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Sombra en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ciclo de Caminado (2 frames de paso militar activo)
    const legOff = (animFrame % 2 === 0) ? 2 : -2;

    // Botas de Combate
    ctx.fillStyle = '#1c241e';
    ctx.fillRect(-3 + legOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 4, 2.5, 3);

    // Pantalones
    ctx.fillStyle = hero.pantsColor;
    ctx.fillRect(-3 + legOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 1, 2.5, 3);

    // Torso / Chaleco y Camisa
    ctx.fillStyle = hero.vestColor;
    ctx.fillRect(-3.5, -3, 7, 4.5);
    ctx.fillStyle = hero.shirtColor;
    ctx.fillRect(-1.5, -3, 3, 2.5);

    // Corbata si es científico
    if (hero.isScientist) {
      ctx.fillStyle = hero.tieColor || '#dc2626';
      ctx.fillRect(-0.5, -2.5, 1.2, 3);
    }

    // Rostro Humano
    ctx.fillStyle = hero.skinColor || '#fed7aa';
    ctx.fillRect(-2.5, -7, 5, 4);

    // Cabello / Casco
    ctx.fillStyle = hero.hairColor;
    ctx.fillRect(-3, -8, 6, 2.5);

    if (hero.hasHelmet) {
      ctx.fillStyle = hero.helmetColor;
      ctx.fillRect(-3.5, -9, 7.5, 3);
      ctx.fillRect(-4, -7, 8.5, 1.5);
    } else if (hero.hasCap) {
      ctx.fillStyle = hero.capColor || '#854d0e';
      ctx.fillRect(-3.5, -9, 7, 2.5);
      ctx.fillRect(1, -7.5, 4, 1.5);
    } else if (hero.hasBandana && hero.headbandColor) {
      ctx.fillStyle = hero.headbandColor;
      ctx.fillRect(-3, -8, 6, 2);
      ctx.fillRect(-3.8, -7, 1.5, 3); // Cola del nudo ondeando
    }

    // Ojos / Gafas
    if (hero.hasGlasses) {
      ctx.fillStyle = hero.glassesColor || '#020617';
      ctx.fillRect(-0.5, -6.5, 3.5, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0.5, -6, 1, 1);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0.5, -6, 1.5, 1.5);
    }

    // Arma de Fuego
    if (isShooting && hasAmmo) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -2.5, 8.5, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, -1.5, 3, 2);
      // Fogonazo Metal Slug
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(10, -1.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (!hasAmmo) {
      // Sin balas: manos levantadas huyendo
      ctx.fillStyle = hero.skinColor || '#fed7aa';
      ctx.fillRect(1, -5.5, 2.5, 2);
      ctx.fillRect(-2, -5.5, 2.5, 2);
    } else {
      // Arma en descanso
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -1, 6, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, 0, 2.5, 1.5);
    }

    ctx.restore();

    // Globos de Alerta / Nombre
    if (alertTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 14 * scale));
      if (!hasAmmo) {
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.fillRect(-16, -5, 32, 9);
        ctx.strokeRect(-16, -5, 32, 9);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 6px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO AMMO!', 0, 2);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.fillRect(-14, -5, 28, 8.5);
        ctx.strokeRect(-14, -5, 28, 8.5);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 6px "Russo One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hero.name, 0, -0.5);
      }
      ctx.restore();
    }

    // "THANK YOU!" saludo al ser curado
    if (cureTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 16 * scale));
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText('THANK YOU!', 0, 0);
      ctx.restore();
    }
  },

  // ==========================================================================
  // 3. MORDIDO // INCUBANDO VIRUS ZOMBIE (CONVULSIONES Y TEMBLORES)
  // ==========================================================================
  drawBittenMicroSprite(ctx, x, y, facing, animFrame, alertTimer, glitchTimer, incubationPct, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    
    // Temblores involuntarios de zombificación
    if (glitchTimer > 0 || Math.random() < 0.4) {
      ctx.translate((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2);
    }
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paso tambaleante espasmódico
    const bOff = (animFrame % 2 === 0) ? 1.5 : -1.2;
    ctx.fillStyle = '#222822';
    ctx.fillRect(-3 + bOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - bOff, 4, 2.5, 3);
    // Pantalón sucio de combate
    ctx.fillStyle = '#3a4433';
    ctx.fillRect(-3 + bOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - bOff, 1, 2.5, 3);

    // Torso encorvado temblando
    ctx.fillStyle = hero.vestColor;
    ctx.fillRect(-3.5, -2.5, 6.5, 4.5);

    // Mano aferrándose al cuello/pecho (reacción canónica de infección)
    ctx.fillStyle = '#c5b078';
    ctx.fillRect(1, -3.5, 3, 3);

    // Rostro cadavérico amarillento enfermo
    ctx.fillStyle = '#c5b078';
    ctx.fillRect(-2, -6.5, 5, 4);

    // Accesorios ladeados
    if (hero.hasHelmet) {
      ctx.fillStyle = '#3f4f44';
      ctx.fillRect(-2.5, -8.5, 6, 2.5);
    } else if (hero.hasCap) {
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-2.5, -8.5, 6, 2);
    } else if (hero.hasBandana && hero.headbandColor) {
      ctx.fillStyle = hero.headbandColor;
      ctx.fillRect(-2, -7.5, 5, 1.8);
    }

    // Ojo rojo febril inyectado en sangre
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0.5, -5.5, 1.8, 1.8);

    // Tos de bilis / sangre cayendo
    ctx.fillStyle = (Math.random() < 0.5) ? '#84cc16' : '#991b1b';
    ctx.fillRect(1.5, -3, 2, 2);

    ctx.restore();

    // Barra de Incubación "VIRUS Z" flotante
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - 14 * scale));
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.fillRect(-12, -5, 24, 6.5);
    ctx.strokeRect(-12, -5, 24, 6.5);

    const barW = Math.max(0, Math.min(22, Math.round(22 * incubationPct)));
    ctx.fillStyle = (incubationPct > 0.65) ? '#ef4444' : '#f59e0b';
    ctx.fillRect(-11, -4, barW, 4.5);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 5px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.name} INCUBANDO`, 0, -6);
    ctx.restore();
  },

  // ==========================================================================
  // 4. INFECTADO // ZOMBIS DE METAL SLUG (Paso lisiado & Chorro de Sangre)
  // Según: https://metalslug.fandom.com/wiki/Zombies
  // ==========================================================================
  drawZombieMicroSprite(ctx, x, y, facing, animFrame, isVomiting, alertTimer, glitchTimer, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (glitchTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Sombra oscura
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 5.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hero.isTarMan) {
      // ----------------------------------------------------
      // VARIANTE: TAR MAN (Hombre de Brea derretido de MS3)
      // ----------------------------------------------------
      const tarWave = Math.sin(animFrame * 2) * 1.5;
      ctx.fillStyle = '#09090b';
      // Masa de brea líquida derretida
      ctx.beginPath();
      ctx.moveTo(-5, 7);
      ctx.lineTo(5, 7);
      ctx.lineTo(4 + tarWave, -1);
      ctx.lineTo(2, -7);
      ctx.lineTo(-3, -7);
      ctx.lineTo(-4 - tarWave, 1);
      ctx.closePath();
      ctx.fill();

      // Costillas esqueléticas blancas expuestas
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2, -3, 4, 1);
      ctx.fillRect(-2.5, -1.5, 5, 1);
      ctx.fillRect(-2, 0, 4, 1);

      // Ojos incandescentes rojos
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-1.5, -5.5, 2, 2);
      ctx.fillRect(1, -5.5, 2, 2);

    } else {
      // ----------------------------------------------------
      // ZOMBI CANÓNICO METAL SLUG (Marco/Tarma/Rebel/Scientist Zombie)
      // ----------------------------------------------------
      // Paso lisiado arrastrado: una pierna extendida hacia atrás rota
      const limpLeg = (animFrame % 2 === 0) ? 2.5 : -1.5;
      
      // Piernas con botas desgastadas
      ctx.fillStyle = '#171a18';
      ctx.fillRect(-3 + limpLeg, 4, 2.5, 3);
      ctx.fillRect(0.5 - limpLeg, 4, 2.5, 3);
      // Pantalones rotos
      ctx.fillStyle = '#37413a';
      ctx.fillRect(-3 + limpLeg, 1, 2.5, 3);
      ctx.fillRect(0.5 - limpLeg, 1, 2.5, 3);

      // Torso profundamente encorvado con harapos
      ctx.fillStyle = '#262f29';
      ctx.fillRect(-4, -3, 6.5, 5);

      // Brazos extendidos hacia el frente en postura zombie
      ctx.fillStyle = '#657a6e'; // Piel verdosa cadavérica
      ctx.fillRect(1, -3, 7, 2.2);

      // Cabeza zombificada
      ctx.fillStyle = '#657a6e';
      ctx.fillRect(-2.5, -7.5, 5.5, 4.5);

      // Rasgos según personaje
      if (hero.hasHelmet) {
        // Casco Morden doblado y ladeado
        ctx.fillStyle = '#334155';
        ctx.fillRect(-2, -9, 6.5, 2);
        ctx.fillRect(-1, -7.5, 5, 1);
      } else if (hero.hasCap) {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(-3, -9, 6.5, 2);
      } else if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-3, -8.5, 6.5, 1.8);
        ctx.fillRect(-3.8, -7.5, 1.5, 2.5);
      } else if (hero.isScientist) {
        // Bata rota manchada
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-3.5, -2, 5, 4);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-1.5, -1, 2, 2.5); // Sangre en bata
      }

      // Ojo rojo brillante y mandíbula abierta
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -6.5, 2, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(1.5, -6, 1, 1);

      // Mandíbula caída rezumando sangre
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(1, -4, 3.5, 2.5);
    }

    // ========================================================================
    // ¡ATAQUE VÓMITO DE SANGRE! (Metal Slug 3 Zombie Blood Vomit Wave)
    // ========================================================================
    if (isVomiting) {
      // Cabeza abierta hacia adelante
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(2, -4.5, 4.5, 3.5);

      // Chorro arqueado de sangre densa
      ctx.save();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(4, -3.5);
      ctx.quadraticCurveTo(12, -7, 18, -1);
      ctx.stroke();

      // Gotas y núcleos carmesí de sangre en proyección
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, -5, 2.5, 2.5);
      ctx.fillRect(14, -3, 3, 3);
      ctx.fillRect(17, 0, 3.5, 3.5);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(12, -6, 2, 2);

      // Charco de sangre en el suelo de impacto
      ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
      ctx.beginPath();
      ctx.ellipse(18, 6, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Globo de Alerta ☠
    if (alertTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 14 * scale));
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.fillRect(-6, -5, 12, 9);
      ctx.strokeRect(-6, -5, 12, 9);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, -0.5);
      ctx.restore();
    }
  },

  // ==========================================================================
  // 5. INMUNE // HAZMAT & FIRST-AID KIT (BOTIQUÍN DE CURA METAL SLUG)
  // Según: https://metalslug.fandom.com/wiki/Zombies (Cure: First-Aid Kit)
  // ==========================================================================
  drawImmuneMicroSprite(ctx, x, y, facing, animFrame, isShooting, alertTimer, cureTimer, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Escudo de Bioprotección Descontaminante
    ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piernas con botas químicas selladas
    const legOff = (animFrame % 2 === 0) ? 2 : -2;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3 + legOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 4, 2.5, 3);
    // Traje Hazmat impermeable (Pantalón amarillo/blanco)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-3 + legOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 1, 2.5, 3);

    // Torso Hazmat con arnés de soporte
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-3.5, -3, 7, 4.5);
    ctx.fillStyle = '#1e293b'; // Arnés táctico
    ctx.fillRect(-1.5, -3, 3, 4.5);

    // Máscara Antigás Metal Slug de Doble Filtro
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3, -7, 6, 4.5);

    // Visor Táctico de Cristal Azul Cobalto Reflectante
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-1, -6.5, 4.5, 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0.5, -6, 1.2, 1); // Destello de luz

    // Doble Filtro Cilíndrico de la Máscara
    ctx.fillStyle = '#475569';
    ctx.fillRect(-3.8, -5, 1.5, 2.5);
    ctx.fillRect(2.8, -5, 1.5, 2.5);

    // ------------------------------------------------------------------------
    // BOTIQUÍN DE PRIMEROS AUXILIOS DE METAL SLUG (FIRST-AID KIT ITEM)
    // ------------------------------------------------------------------------
    // Maletín blanco canónico con cruz roja que cura zombis en MS3
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(2.5, -2, 6.5, 5);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(2.5, -2, 6.5, 5);
    // Cruz Roja (+)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(4.5, -1, 2.5, 1.2);
    ctx.fillRect(5.1, -1.6, 1.2, 2.4);

    ctx.restore();

    // Insignia flotante "FIRST-AID CURE"
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - 14 * scale));
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillRect(-14, -5, 28, 8);
    ctx.strokeRect(-14, -5, 28, 8);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 5.5px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.name} INMUNE`, 0, 1.5);
    ctx.restore();
  },

  // ==========================================================================
  // 6. MOTOR DE PARTÍCULAS (Chorros de Sangre, Trazadoras, Chispas, Ondas)
  // ==========================================================================
  renderParticles(ctx, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay || 0.05;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      if (p.type === 'tracer') {
        ctx.save();
        ctx.strokeStyle = p.color || '#fde047';
        ctx.lineWidth = 1.6 * p.life;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'muzzle') {
        ctx.save();
        ctx.fillStyle = '#fef08a';
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.fillStyle = p.color || '#f97316';
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        ctx.restore();
      } else if (p.type === 'blood_stream' || p.type === 'bile') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravedad parabólica
        ctx.save();
        ctx.fillStyle = p.color || '#dc2626';
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size || 2.5) * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'mutation_burst') {
        p.radius = (p.radius || 3) + 1.4;
        ctx.save();
        ctx.strokeStyle = p.color || '#dc2626';
        ctx.lineWidth = 2.2 * p.life;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'shield_wave') {
        p.radius = (p.radius || 2) + 1.1;
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2 * p.life;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'brain_bubble') {
        // Globo de decisión del paciente cero: sigue al agente y solo se desvanece en el último 25 %
        const f = p.follow;
        if (!f || f.type !== 'infected') { p.life = 0; continue; }
        const x = f.screenX, y = f.screenY - 74;  // por encima de la galera
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 4);
        ctx.font = 'bold 11px "Chakra Petch", sans-serif';
        const w = ctx.measureText(p.text).width + 14;
        ctx.fillStyle = 'rgba(11, 17, 23, 0.92)';
        ctx.strokeStyle = p.color || '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - w / 2, y - 11, w, 20, 6);
        ctx.moveTo(x - 5, y + 9); ctx.lineTo(x, y + 15); ctx.lineTo(x + 5, y + 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, x, y);
        ctx.restore();
      } else if (p.type === 'text') {
        p.y -= 0.6;
        ctx.save();
        ctx.fillStyle = p.color || '#fff';
        ctx.globalAlpha = p.life;
        ctx.font = 'bold 9px "Black Ops One", cursive';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }
    }
  }
};

window.MANTA_SPRITES = MANTA_SPRITES;
