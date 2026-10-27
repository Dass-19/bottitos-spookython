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
