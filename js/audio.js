// ==========================================================================
// METAL SLUG NEO-GEO AUDIO SYNTHESIZER (Web Audio API)
// ==========================================================================

const SFX = {
  muted: false,
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  play(freq, type = 'square', duration = 0.08, vol = 0.07) {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  coin() {
    this.play(987, 'square', 0.1, 0.09);
    setTimeout(() => this.play(1318, 'square', 0.22, 0.09), 85);
  },
  button() {
    this.play(380, 'triangle', 0.05, 0.08);
  },
  alarm() {
    this.play(260, 'sawtooth', 0.12, 0.09);
    setTimeout(() => this.play(190, 'sawtooth', 0.12, 0.09), 110);
  },
  cure() {
    // Mission complete / Antidote fanfare
    this.play(523, 'sine', 0.08);
    setTimeout(() => this.play(659, 'sine', 0.08), 70);
    setTimeout(() => this.play(784, 'sine', 0.12), 140);
    setTimeout(() => this.play(1046, 'sine', 0.25), 210);
  },
  gunshot() {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  },
  zombieBite() {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  },
  cough() {
    if (this.muted) return;
    this.play(220, 'sawtooth', 0.06, 0.05);
    setTimeout(() => this.play(150, 'sawtooth', 0.08, 0.06), 50);
  },
  bloodVomit() {
    if (this.muted) return;
    try {
      this.init();
      // Visceral bubbling blood eruption (Metal Slug 3 Zombie Bomb)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.18);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.11, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);

      // Low frequency rumble
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      oscSub.type = 'triangle';
      oscSub.frequency.setValueAtTime(70, this.ctx.currentTime);
      oscSub.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.5);
      gainSub.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gainSub.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start();
      oscSub.stop(this.ctx.currentTime + 0.5);
    } catch (e) {}
  },
  deflect() {
    if (this.muted) return;
    this.play(880, 'triangle', 0.05, 0.08);
    setTimeout(() => this.play(1760, 'sine', 0.1, 0.08), 40);
  },
  transformRoar() {
    if (this.muted) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(240, this.ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.85);
    } catch (e) {}
  },
  powSalute() {
    if (this.muted) return;
    this.play(880, 'sine', 0.08, 0.08);
    setTimeout(() => this.play(1318, 'sine', 0.16, 0.08), 80);
  },
  toggleMute() {
    this.muted = !this.muted;
    const b = document.getElementById('btn-sfx-slug');
    if (b) b.innerText = this.muted ? "SFX: MUTED" : "SFX: NEO-GEO";
    if (!this.muted) this.coin();
  }
};

window.SFX = SFX;
