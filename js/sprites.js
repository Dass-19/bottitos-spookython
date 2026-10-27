// ==========================================================================
// METAL SLUG SPRITE ENGINES & PARTICLE SYSTEM
// Heroes: Marco Rossi, Tarma Roving, Eri Kasamoto, Fio Germi, Clark Still, Ralf Jones
// Entities: Humano, Mordido (Incubando), Infectado (Zombie), Inmune
// ==========================================================================

const HERO_ROSTER = {
  marco: {
    id: 'marco',
    name: 'MARCO',
    hairColor: '#fcd34d',      // Rubio
    headbandColor: '#ef4444',  // Cinta roja con nudo
    vestColor: '#ea580c',      // Chaleco naranja
    shirtColor: '#f8fafc',     // Camiseta blanca
    pantsColor: '#374c39',     // Pantalón verde oliva
    hasGlasses: false,
    hasCap: false,
    hasBandana: true
  },
  tarma: {
    id: 'tarma',
    name: 'TARMA',
    hairColor: '#451a03',      // Pelo castaño despeinado
    headbandColor: null,
    vestColor: '#15803d',      // Chaleco verde militar
    shirtColor: '#fef08a',     // Camiseta crema
    pantsColor: '#854d0e',     // Pantalón caqui
    hasGlasses: true,          // Gafas de sol oscuras
    glassesColor: '#020617',
    hasCap: false,
    hasBandana: false
  },
  eri: {
    id: 'eri',
    name: 'ERI',
    hairColor: '#fde047',      // Pelo rubio claro
    headbandColor: '#4d7c0f',  // Bandana verde olivo
    vestColor: '#4d7c0f',      // Top verde militar
    shirtColor: '#ffffff',
    pantsColor: '#3f6212',     // Pantalón camuflaje verde
    hasGlasses: false,
    hasCap: false,
    hasBandana: true
  },
  fio: {
    id: 'fio',
    name: 'FIO',
    hairColor: '#78350f',      // Pelo castaño con coletas
    headbandColor: null,
    vestColor: '#0284c7',      // Chaleco azul
    shirtColor: '#ffffff',
    pantsColor: '#a16207',     // Bermudas caqui
    hasGlasses: true,          // Gafas de ver redondas
    glassesColor: '#38bdf8',
    hasCap: true,              // Boina scout marrón
    capColor: '#854d0e',
    hasBandana: false
  },
  clark: {
    id: 'clark',
    name: 'CLARK',
    hairColor: '#fcd34d',
    headbandColor: null,
    vestColor: '#1e3a8a',      // Chaleco azul marino militar
    shirtColor: '#ffffff',
    pantsColor: '#334155',     // Pantalón azul pizarra
    hasGlasses: true,          // Gafas de sol oscuras
    glassesColor: '#020617',
    hasCap: true,              // Gorra de béisbol azul
    capColor: '#1d4ed8',
    hasBandana: false
  },
  ralf: {
    id: 'ralf',
    name: 'RALF',
    hairColor: '#382218',      // Pelo castaño alborotado
    headbandColor: '#dc2626',  // Bandana roja frontal
    vestColor: '#3f6212',      // Chaleco verde oliva
    shirtColor: '#ffffff',
    pantsColor: '#14532d',     // Pantalón comando
    hasGlasses: false,
    hasCap: false,
    hasBandana: true,
    isMuscular: true
  }
};

const MANTA_SPRITES = {
  HEROES: HERO_ROSTER,

  // 1. TACTICAL CHIBI HEAD (ZOOM < 15)
  drawTacticalChibiHead(ctx, x, y, stateType, glitchTimer, bob, incubationPct = 0, heroId = 'marco') {
    ctx.save();
    const yOffset = Math.sin(bob) * 1.5;
    ctx.translate(Math.round(x), Math.round(y + yOffset));

    const isInf = (stateType === 'infected' || stateType === true);
    const isBit = (stateType === 'bitten');
    const isImm = (stateType === 'immune');
    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    if (isInf) {
      if (glitchTimer > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Damaged Combat Helmet / Hair
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      // Hero specific infected accessory
      if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-5, -5, 10, 2);
      } else if (hero.hasCap) {
        ctx.fillStyle = hero.capColor || '#854d0e';
        ctx.fillRect(-5, -6, 10, 2.5);
      }

      // Pale Rot Skin
      ctx.fillStyle = '#6b9075';
      ctx.fillRect(-4, -2, 8, 7);

      // Bulging Blood-Red Eyes / Glasses
      if (hero.hasGlasses) {
        ctx.fillStyle = hero.glassesColor || '#020617';
        ctx.fillRect(-4, 0, 3.5, 2.5);
        ctx.fillRect(0.5, 0, 3.5, 2.5);
      } else {
        ctx.fillStyle = '#ff0033';
        ctx.fillRect(-3, 0, 2, 2);
        ctx.fillRect(1, 0, 2, 2);
      }

      // Acid / Blood Drool
      ctx.fillStyle = (glitchTimer > 0) ? '#84cc16' : '#991b1b';
      ctx.fillRect(-2, 3, 4, 2);

      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(-5, -3, 10, 8);
    } else if (isBit) {
      // MORDIDO / INCUBANDO - Pulsing amber/orange hazard glow
      if (glitchTimer > 0) ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Sickly Discolored Helmet / Hair
      ctx.fillStyle = hero.hairColor;
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-5, -4, 10, 2);
      }

      // Pale Feverish Skin with dark blotches
      ctx.fillStyle = '#c7b07b';
      ctx.fillRect(-4, -2, 8, 6.5);

      // Bloodshot Eyes or Glasses
      if (hero.hasGlasses) {
        ctx.fillStyle = hero.glassesColor || '#020617';
        ctx.fillRect(-4, 0, 3, 2);
        ctx.fillRect(1, 0, 3, 2);
      } else {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-3, 1, 1.5, 1.5);
        ctx.fillRect(1.5, 1, 1.5, 1.5);
      }

      // Amber Hazard Stroke
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-5, -2, 10, 7.5);

      // Mini Incubation Gauge on top
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, -9, 10, 2.5);
      const gaugeWidth = Math.max(1, Math.min(10, Math.round(10 * incubationPct)));
      ctx.fillStyle = (incubationPct > 0.7) ? '#ef4444' : '#f59e0b';
      ctx.fillRect(-5, -9, gaugeWidth, 2.5);
    } else if (isImm) {
      // INMUNE - Golden Aura with Shield protection
      ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = hero.hairColor;
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      // Golden band
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-5, -3, 10, 2);

      // Face
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -1, 8, 6);

      // Eyes or Glasses
      if (hero.hasGlasses) {
        ctx.fillStyle = hero.glassesColor || '#020617';
        ctx.fillRect(-4, 0, 3, 2);
        ctx.fillRect(1, 0, 3, 2);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, 1, 1.5, 1.5);
        ctx.fillRect(1.5, 1, 1.5, 1.5);
      }

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-5, -2, 10, 7);

      // Star badge on top
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('★', -2, -8);
    } else {
      // HERO HUMAN (Marco, Tarma, Eri, Fio, Clark, Ralf)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = hero.hairColor;
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      // Cap or Bandana
      if (hero.hasCap) {
        ctx.fillStyle = hero.capColor || '#1d4ed8';
        ctx.fillRect(-5, -6, 10, 3);
        ctx.fillRect(1, -6, 5, 1.5); // Cap visor
      } else if (hero.hasBandana && hero.headbandColor) {
        ctx.fillStyle = hero.headbandColor;
        ctx.fillRect(-5, -4, 10, 2);
      }

      // Peach Face
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(-4, -1, 8, 6);

      // Eyes or Glasses
      if (hero.hasGlasses) {
        ctx.fillStyle = hero.glassesColor || '#0f172a';
        ctx.fillRect(-4, 0, 3.2, 2.2);
        ctx.fillRect(0.8, 0, 3.2, 2.2);
        // White glint on sunglasses
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, 0.5, 1, 1);
        ctx.fillRect(1.8, 0.5, 1, 1);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, 1, 1.5, 1.5);
        ctx.fillRect(1.5, 1, 1.5, 1.5);
      }

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -2, 10, 7);
    }
    ctx.restore();
  },

  // 2. METAL SLUG HERO ANIMATED MICRO-SPRITE (ZOOM >= 15)
  drawSoldierMicroSprite(ctx, x, y, facing, animFrame, isShooting, alertTimer, cureTimer, scale, hasAmmo = true, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walking Legs Cycle (2 frames)
    const legOff = (animFrame % 2 === 0) ? 2 : -2;
    // Combat Boots
    ctx.fillStyle = '#1c241e';
    ctx.fillRect(-3 + legOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 4, 2.5, 3);
    // Pants (Hero specific)
    ctx.fillStyle = hero.pantsColor;
    ctx.fillRect(-3 + legOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 1, 2.5, 3);

    // Torso / Vest & Shirt (Hero specific)
    ctx.fillStyle = hero.vestColor;
    ctx.fillRect(-3, -3, 6, 4.5);
    ctx.fillStyle = hero.shirtColor;
    ctx.fillRect(-1.5, -3, 3, 2);

    // Bare muscular arms for Ralf
    if (hero.isMuscular) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3.8, -2, 1.2, 3);
      ctx.fillRect(2.6, -2, 1.2, 3);
    }

    // Peach Face & Hair
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-2.5, -7, 5, 4);

    // Hair
    ctx.fillStyle = hero.hairColor;
    ctx.fillRect(-3, -8, 6, 2.5);

    // Head accessories (Cap, Bandana, Glasses)
    if (hero.hasCap) {
      ctx.fillStyle = hero.capColor || '#1d4ed8';
      ctx.fillRect(-3.5, -9, 7, 2.5);
      ctx.fillRect(1, -7.5, 4, 1.5); // Cap peak
    } else if (hero.hasBandana && hero.headbandColor) {
      ctx.fillStyle = hero.headbandColor;
      ctx.fillRect(-3, -8, 6, 2);
      ctx.fillRect(-3.8, -7, 1.5, 3); // Headband knot tail
    }

    // Eyes / Glasses / Sunglasses
    if (hero.hasGlasses) {
      ctx.fillStyle = hero.glassesColor || '#020617';
      ctx.fillRect(-0.5, -6.5, 3.5, 2.2);
      // Glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0.5, -6, 1, 1);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0.5, -6, 1.5, 1.5);
    }

    // Weapon handling
    if (isShooting && hasAmmo) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -2.5, 8, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, -1.5, 3, 2);
      // Muzzle Flash Spark
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(9.5, -1.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (!hasAmmo) {
      // Empty hands raised fleeing
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(1, -5, 3, 2);
      ctx.fillRect(-2, -5, 3, 2);
    } else {
      // Gun held steady
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -1, 6, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, 0, 2.5, 1.5);
    }

    ctx.restore();

    // Alert Balloons & Hero Name Tag
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

    // Cure "THANK YOU!" salute
    if (cureTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 15 * scale));
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText('THANK YOU!', 0, 0);
      ctx.restore();
    }
  },

  // 3. MORDIDO / INFECTADO EN INCUBACIÓN (ZOOM >= 15)
  drawBittenMicroSprite(ctx, x, y, facing, animFrame, alertTimer, glitchTimer, incubationPct, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (glitchTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shaky / staggering walk cycle
    const bOff = (animFrame % 2 === 0) ? 1.2 : -1.0;
    ctx.fillStyle = '#222822';
    ctx.fillRect(-3 + bOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - bOff, 4, 2.5, 3);
    // Soiled pants
    ctx.fillStyle = '#3a4433';
    ctx.fillRect(-3 + bOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - bOff, 1, 2.5, 3);

    // Hunched shivering torso
    ctx.fillStyle = hero.vestColor;
    ctx.fillRect(-3.5, -2.5, 6.5, 4.5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-1.5, -2.5, 2.5, 2);

    // Clutching throat/neck with hand
    ctx.fillStyle = '#c7b07b';
    ctx.fillRect(1, -3, 3, 2.5);

    // Sickly Pale Face
    ctx.fillStyle = '#c7b07b';
    ctx.fillRect(-2, -6.5, 5, 4);

    // Hero Headwear / Hair
    if (hero.hasCap) {
      ctx.fillStyle = hero.capColor || '#1d4ed8';
      ctx.fillRect(-3, -8.5, 6.5, 2);
    } else if (hero.hasBandana && hero.headbandColor) {
      ctx.fillStyle = hero.headbandColor;
      ctx.fillRect(-2.5, -7.5, 5.5, 1.8);
    }

    // Feverish Red Eye or crooked glasses
    if (hero.hasGlasses) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, -6, 3, 2);
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0.5, -5.5, 1.5, 1.5);
    }

    // Veins / Coughing drool
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(1, -3.5, 2, 1.5);

    ctx.restore();

    // Floating Incubation Gauge (Un-flipped)
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - 14 * scale));
    // Container box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.fillRect(-10, -5, 20, 6);
    ctx.strokeRect(-10, -5, 20, 6);

    // Fill bar
    const barW = Math.max(0, Math.min(18, Math.round(18 * incubationPct)));
    ctx.fillStyle = (incubationPct > 0.65) ? '#ef4444' : '#f59e0b';
    ctx.fillRect(-9, -4, barW, 4);

    // Alert icon
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 5px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.name} MORDIDO`, 0, -6);
    ctx.restore();
  },

  // 4. METAL SLUG ZOMBIE SOLDIER ANIMATED MICRO-SPRITE (ZOOM >= 15)
  drawZombieMicroSprite(ctx, x, y, facing, animFrame, isVomiting, alertTimer, glitchTimer, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (glitchTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dragging Limp Leg Walk Cycle
    const zOff = (animFrame % 2 === 0) ? 1.5 : -1.2;
    ctx.fillStyle = '#1e1b24';
    ctx.fillRect(-3 + zOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - zOff, 4, 2.5, 3);
    // Tattered Dark Pants
    ctx.fillStyle = '#3b334a';
    ctx.fillRect(-3 + zOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - zOff, 1, 2.5, 3);

    // Hunched Torso / Ripped Army Rags
    ctx.fillStyle = '#262030';
    ctx.fillRect(-4, -3, 6, 5);

    // Zombie Shambler Arms Extended Forward
    ctx.fillStyle = '#5a7a63';
    ctx.fillRect(1, -3, 6.5, 2);

    // Decaying Zombie Head
    ctx.fillStyle = '#5a7a63';
    ctx.fillRect(-2, -7.5, 5.5, 4.5);

    // Preserved Hero Zombie Accents
    if (hero.hasCap) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-3, -9, 6.5, 2);
    } else if (hero.hasBandana && hero.headbandColor) {
      ctx.fillStyle = hero.headbandColor;
      ctx.fillRect(-3, -8.5, 6.5, 1.8);
      ctx.fillRect(-3.8, -7.5, 1.5, 2.5); // Knot tail
    }

    // Glowing Eyes / Askew Glasses
    if (hero.hasGlasses) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, -6.8, 3.5, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -6.3, 1.5, 1.5);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(1, -6.5, 2, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(1.5, -6, 1, 1);
    }

    // Dripping Acid Bile / Blood Mouth
    ctx.fillStyle = isVomiting ? '#84cc16' : '#991b1b';
    ctx.fillRect(1, -4, 3, 2);

    ctx.restore();

    // Alert Balloon ☠
    if (alertTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 14 * scale));
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.fillRect(-5, -5, 10, 9);
      ctx.strokeRect(-5, -5, 10, 9);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, -0.5);
      ctx.restore();
    }
  },

  // 5. INMUNE ANIMATED MICRO-SPRITE (ZOOM >= 15)
  drawImmuneMicroSprite(ctx, x, y, facing, animFrame, isShooting, alertTimer, cureTimer, scale, heroId = 'marco') {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing * scale, scale);

    const hero = HERO_ROSTER[heroId] || HERO_ROSTER.marco;

    // Glowing bio-defense aura
    ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walking Legs
    const legOff = (animFrame % 2 === 0) ? 2 : -2;
    ctx.fillStyle = '#1c241e';
    ctx.fillRect(-3 + legOff, 4, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 4, 2.5, 3);
    // Dark Cargo Pants
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3 + legOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 1, 2.5, 3);

    // Hero Vest with Gold Epaulettes
    ctx.fillStyle = hero.vestColor;
    ctx.fillRect(-3, -3, 6, 4.5);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-3.5, -3, 1.5, 1.5);
    ctx.fillRect(2, -3, 1.5, 1.5);

    // Face & Golden Headband
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2.5, -7, 5, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-3, -8, 6, 2);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-3.5, -7, 1.5, 3);

    // Confident Eye / Glasses
    if (hero.hasGlasses) {
      ctx.fillStyle = hero.glassesColor || '#020617';
      ctx.fillRect(0, -6.5, 3, 2);
    } else {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0.5, -6, 1.5, 1.5);
    }

    // Defense weapon / shield
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1, -2, 7, 2);

    ctx.restore();

    // Bio-protection emblem
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - 14 * scale));
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillRect(-12, -4.5, 24, 7.5);
    ctx.strokeRect(-12, -4.5, 24, 7.5);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 5px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.name} INMUNE`, 0, 1.5);
    ctx.restore();
  },

  // 6. PARTICLES ENGINE (Tracers, Muzzle Flashes, Acid Bile, Sparks, Floating Text, Mutation Bursts)
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
        ctx.lineWidth = 1.5 * p.life;
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
      } else if (p.type === 'bile') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'mutation_burst') {
        p.radius = (p.radius || 3) + 1.2;
        ctx.save();
        ctx.strokeStyle = p.color || '#84cc16';
        ctx.lineWidth = 2 * p.life;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'shield_wave') {
        p.radius = (p.radius || 2) + 0.9;
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2 * p.life;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
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
