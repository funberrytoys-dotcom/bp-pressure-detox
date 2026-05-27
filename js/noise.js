/**
 * noise.js — Web Audio API: white/pink/brown noise + rain/ocean/forest/fan
 * No external files — all synthesized
 */
let audioCtx, gainNode, noiseNode, timerId, activeType = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ---- White noise (buffer) ----
function createWhiteNoise() {
  const ctx = getCtx();
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer; src.loop = true;
  return src;
}

// ---- Pink noise (Voss-McCartney algorithm) ----
function createPinkNoise() {
  const ctx = getCtx();
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer; src.loop = true;
  return src;
}

// ---- Rain: noise + steep lowpass ~800Hz ----
function createRainSound() {
  const ctx = getCtx();
  const noise = createWhiteNoise();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 800;
  noise.connect(filter);
  const gain = ctx.createGain(); gain.gain.value = 0.25;
  filter.connect(gain);
  return { src: [noise], out: gain };
}

// ---- Ocean: Brown-ish noise + slow LFO on filter ----
function createOceanSound() {
  const ctx = getCtx();
  const noise = createWhiteNoise();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 350;
  noise.connect(filter);

  // LFO for "waves"
  const lfo = ctx.createOscillator();
  lfo.type = 'sine'; lfo.frequency.value = 0.15;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
  lfo.start();

  const gain = ctx.createGain(); gain.gain.value = 0.35;
  filter.connect(gain);
  return { src: [noise, lfo], out: gain };
}

// ---- Forest: modulated high-mid noise + "birds" (short chirps from oscillators interval) ----
function createForestSound() {
  const ctx = getCtx();
  const noise = createWhiteNoise();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 0.5;
  noise.connect(filter);
  const gain = ctx.createGain(); gain.gain.value = 0.15;
  filter.connect(gain);

  // Random bird chirps
  function chirp() {
    if (!activeType || activeType !== 'forest') return;
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.setValueAtTime(4000 + Math.random()*3000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(6000, ctx.currentTime + 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.02, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
    setTimeout(chirp, 2000 + Math.random()*6000);
  }
  setTimeout(chirp, 1000);

  return { src: [noise], out: gain };
}

// ---- Fan: pink-ish noise + narrow bandpass ~200Hz ----
function createFanSound() {
  const ctx = getCtx();
  const noise = createWhiteNoise();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 180; filter.Q.value = 2;
  noise.connect(filter);
  const gain = ctx.createGain(); gain.gain.value = 0.3;
  filter.connect(gain);
  return { src: [noise], out: gain };
}

// ---- Play / Stop interface ----
function playSound(type) {
  stopSound(); // reset
  activeType = type;
  const ctx = getCtx();

  if (!gainNode) gainNode = ctx.createGain();
  gainNode.gain.value = parseFloat(document.getElementById('vol')?.value || 0.5);
  gainNode.connect(ctx.destination);

  let node;
  if (type === 'white') { node = createWhiteNoise(); node.connect(gainNode); node.start(); noiseNode = node; }
  else if (type === 'pink') { node = createPinkNoise(); node.connect(gainNode); node.start(); noiseNode = node; }
  else if (type === 'rain') { const r = createRainSound(); r.src.forEach(s => s.start()); r.out.connect(gainNode); noiseNode = r; }
  else if (type === 'ocean') { const r = createOceanSound(); r.src.forEach(s => s.start()); r.out.connect(gainNode); noiseNode = r; }
  else if (type === 'forest') { const r = createForestSound(); r.src.forEach(s => s.start()); r.out.connect(gainNode); noiseNode = r; }
  else if (type === 'fan') { const r = createFanSound(); r.src.forEach(s => s.start()); r.out.connect(gainNode); noiseNode = r; }

  // Timer
  const mins = parseInt(document.getElementById('sleep-timer')?.value || 0);
  if (mins > 0) {
    timerId = setTimeout(() => stopSound(), mins * 60000);
  }
}

function stopSound() {
  if (timerId) { clearTimeout(timerId); timerId = null; }
  if (!noiseNode) return;

  try {
    if (Array.isArray(noiseNode.src)) {
      noiseNode.src.forEach(s => { try { s.stop(); s.disconnect(); } catch(e){} });
    } else {
      noiseNode.stop(); noiseNode.disconnect();
    }
  } catch(e){}
  noiseNode = null;
  activeType = null;
}

function setVolume(val) {
  if (gainNode) gainNode.gain.value = parseFloat(val);
}
