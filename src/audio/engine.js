// Ruido del motor al manejar.
import { driving } from '../cars/driving.js';
import { AC, sfxGain } from './audio.js';

/* soft engine hum while driving */
let engine = null;
function startEngine() {
  if (!AC || engine) return;
  const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o.frequency.value = 50; f.type = 'lowpass'; f.frequency.value = 420; g.gain.value = 0.0001;
  o.connect(f); f.connect(g); g.connect(sfxGain); o.start();
  g.gain.setTargetAtTime(0.14, AC.currentTime, 0.2);
  engine = { o, g };
}
function setEngine(speed) { if (engine) engine.o.frequency.setTargetAtTime((48 + speed * 7) * (driving ? driving.stats.pitch : 1), AC.currentTime, 0.08); }
function stopEngine() {
  if (!engine) return; const e = engine; engine = null;
  e.g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.1); setTimeout(() => { try { e.o.stop(); } catch (_) { } }, 600);
}

export { setEngine, startEngine, stopEngine };
