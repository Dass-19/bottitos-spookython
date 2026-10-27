// ==========================================================================
// METAL SLUG SPRITE ENGINES & PARTICLE SYSTEM
// ==========================================================================

const MANTA_SPRITES = {
  // 1. TACTICAL CHIBI HEAD (ZOOM < 15)
  drawTacticalChibiHead(ctx, x, y, isInfected, glitchTimer, bob) {
    ctx.save();
    const yOffset = Math.sin(bob) * 1.5;
    ctx.translate(Math.round(x), Math.round(y + yOffset));

    if (isInfected) {
      if (glitchTimer > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Damaged Combat Helmet
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      // Pale Rot Skin
      ctx.fillStyle = '#6b9075';
      ctx.fillRect(-4, -2, 8, 7);

      // Bulging Blood-Red Eyes
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-3, 0, 2, 2);
      ctx.fillRect(1, 0, 2, 2);

      // Acid / Blood Drool
      ctx.fillStyle = (glitchTimer > 0) ? '#84cc16' : '#991b1b';
      ctx.fillRect(-2, 3, 4, 2);

      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -3, 10, 8);
    } else {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Regular Army Combat Helmet
      ctx.fillStyle = '#3f5742';
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#658a69';
      ctx.fillRect(-5, -2, 10, 1.5);

      // Tactical Cyan Visor
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-4, -5, 3, 2);
      ctx.fillRect(1, -5, 3, 2);

      // Peach Soldier Face
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(-4, -1, 8, 6);

      // Eyes & Chin
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, 1, 1.5, 1.5);
      ctx.fillRect(1.5, 1, 1.5, 1.5);

      ctx.fillStyle = '#9d174d';
      ctx.fillRect(-2, 3, 4, 1);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-5, -2, 10, 7);
    }
    ctx.restore();
  },

  // 2. REGULAR ARMY SOLDIER ANIMATED MICRO-SPRITE (ZOOM >= 15)
  drawSoldierMicroSprite(ctx, x, y, facing, animFrame, isShooting, alertTimer, cureTimer, scale) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing * scale, scale);

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
    // Olive Cargo Pants
    ctx.fillStyle = '#374c39';
    ctx.fillRect(-3 + legOff, 1, 2.5, 3);
    ctx.fillRect(0.5 - legOff, 1, 2.5, 3);

    // Torso / Khaki Combat Vest with white tee
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-3, -3, 6, 4.5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-1.5, -3, 3, 2);

    // Peach Soldier Face & Red Headband (Marco Rossi style)
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-2.5, -7, 5, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -8, 6, 2);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-3.5, -7, 1.5, 3); // headband tail knot

    // Chibi Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0.5, -6, 1.5, 1.5);

    // Heavy Machine Gun Weapon
    if (isShooting) {
      // Gun raised forward aiming
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -2.5, 8, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, -1.5, 3, 2);
      // Muzzle Flash Spark
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(9.5, -1.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gun held steady
      ctx.fillStyle = '#475569';
      ctx.fillRect(1, -1, 6, 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-0.5, 0, 2.5, 1.5);
    }

    ctx.restore();

    // Alerts / Speech Balloons (Drawn un-flipped)
    if (alertTimer > 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y - 14 * scale));
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.fillRect(-4, -5, 8, 8);
      ctx.strokeRect(-4, -5, 8, 8);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 7px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, -1);
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

  // 3. METAL SLUG ZOMBIE SOLDIER ANIMATED MICRO-SPRITE (ZOOM >= 15)
  drawZombieMicroSprite(ctx, x, y, facing, animFrame, isVomiting, alertTimer, glitchTimer, scale) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (glitchTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
    }
    ctx.scale(facing * scale, scale);

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
    // Tattered Dark Purple Pants
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

    // Bulging Glowing Blood-Red Eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1, -6.5, 2, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(1.5, -6, 1, 1);

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

  // 4. PARTICLES ENGINE (Tracers, Muzzle Flashes, Acid Bile, Sparks, Floating Text)
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
        ctx.fillStyle = '#f97316';
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
