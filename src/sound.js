// Synthesized sound effects (Web Audio) - no audio files needed.
let ctx = null;
let master = null;
let muted = false;

// Browsers only allow audio after a user gesture, so call this from a click/keypress.
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.02);
}

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

function noise(start, dur, { gain = 0.3, from = 4000, to = 800 } = {}) {
  const t = ctx.currentTime + start;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

// One beep per countdown second; the final 3 are higher and louder.
export function tick(n) {
  if (!ctx) return;
  if (n <= 3) tone(880, 0, 0.35, { type: "triangle", gain: 0.5, slideTo: 1000 });
  else tone(520, 0, 0.18, { type: "sine", gain: 0.3 });
}

// Cannon pop + rising fanfare + sparkle + applause-like crackle.
export function celebrate() {
  if (!ctx) return;
  tone(160, 0, 0.35, { type: "sine", gain: 0.9, slideTo: 40 });
  noise(0, 0.5, { gain: 0.6, from: 6000, to: 500 });

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => {
    tone(f, 0.15 + i * 0.12, 0.5, { type: "sawtooth", gain: 0.12 });
    tone(f * 2, 0.15 + i * 0.12, 0.5, { type: "sine", gain: 0.1 });
  });
  [523.25, 659.25, 783.99, 1046.5].forEach((f) =>
    tone(f, 0.7, 1.8, { type: "triangle", gain: 0.18, attack: 0.03 })
  );

  for (let i = 0; i < 14; i++) {
    tone(1500 + Math.random() * 2500, 0.9 + i * 0.09, 0.2, { gain: 0.06 });
  }
  for (let i = 0; i < 40; i++) {
    noise(0.8 + Math.random() * 2.5, 0.05, { gain: 0.15, from: 2000 + Math.random() * 4000, to: 1500 });
  }
}
