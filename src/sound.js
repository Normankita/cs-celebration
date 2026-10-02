// Synthesized sound effects (Web Audio) - no audio files needed.
let ctx = null;
let master = null;
let muted = false;
const LEVEL = 0.8;

// Browsers only allow audio after a user gesture, so call this from a click/keypress.
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : LEVEL;
    // Compressor keeps a barrage of overlapping booms from clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : LEVEL, ctx.currentTime, 0.02);
}

const rand = (min, max) => Math.random() * (max - min) + min;

function tone(freq, start, dur, { type = "sine", gain = 0.3, attack = 0.01, slideTo } = {}) {
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(start, dur, { gain = 0.3, from = 4000, to = 800, type = "bandpass" } = {}) {
  const t = ctx.currentTime + start;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

// BBC "Greenwich Time Signal" pip: a pure 1 kHz sine with a crisp, flat-topped envelope.
function pip(dur, gain = 0.55) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1000;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.setValueAtTime(gain, t + dur - 0.01);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// One short pip per countdown second.
export function tick() {
  if (!ctx) return;
  pip(0.1);
}

// The long pip at zero, then a rising crowd cheer / applause under the fireworks.
export function celebrate() {
  if (!ctx) return;
  pip(0.5, 0.6);
  noise(0.4, 3.5, { gain: 0.05, from: 900, to: 2600, type: "bandpass" });
  for (let i = 0; i < 70; i++) {
    noise(1 + Math.random() * 4, 0.05, { gain: 0.07, from: 1500 + Math.random() * 3500, to: 1200 });
  }
}

// A rocket: rising whistle for `flight` seconds, then the burst lands exactly when it ends.
export function launch(flight, size = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;

  // whistle
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(rand(500, 700), t);
  osc.frequency.exponentialRampToValueAtTime(rand(1900, 2600), t + flight);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.12);
  g.gain.setValueAtTime(0.05, t + flight - 0.05);
  g.gain.linearRampToValueAtTime(0, t + flight);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + flight + 0.05);
  noise(0, flight, { gain: 0.05, from: 1200, to: 3500 });

  // burst
  const b = flight;
  tone(rand(90, 150), b, 0.6, { type: "sine", gain: 0.9 * size, slideTo: 30, attack: 0.004 });
  noise(b, 0.7, { gain: 0.6 * size, from: 5000, to: 250, type: "lowpass" });
  noise(b, 0.15, { gain: 0.4 * size, from: 8000, to: 1000 });

  // crackle / glitter as the sparks fall
  const pops = Math.floor(rand(12, 26));
  for (let i = 0; i < pops; i++) {
    noise(b + 0.12 + Math.random() * 1.1, 0.04, { gain: rand(0.08, 0.2), from: rand(2500, 7000), to: 1500 });
  }
  for (let i = 0; i < 5; i++) {
    tone(rand(2500, 5000), b + 0.2 + Math.random() * 0.9, 0.12, { gain: 0.03 });
  }
}
