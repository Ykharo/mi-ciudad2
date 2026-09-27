// Música y efectos sintetizados con WebAudio.
import { state } from '../core/state.js';

/* ================= AUDIO ================= */
let AC = null, master, musicGain, sfxGain, noiseBuf, seqTimer = null, nextTime = 0, step = 0; state.musicOn = true;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
  AC = new Ctx();
  master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
  musicGain = AC.createGain(); musicGain.gain.value = 0.2; musicGain.connect(master);
  sfxGain = AC.createGain(); sfxGain.gain.value = 0.32; sfxGain.connect(master);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.2, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function tone(freq, t, dur, type, gain, dest, attack = 0.008, freqEnd) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function hat(t) {
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7500;
  g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f); f.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.06);
}
// I – V – vi – IV in C major, two melodic phrases
const CHORDS = [[48, 64, 67, 72], [43, 62, 67, 71], [45, 64, 69, 72], [41, 65, 69, 72]];
const MELODY = [
  [76, 79, 84, 79, 76, 0, 74, 76], [74, 79, 83, 79, 74, 0, 71, 74], [72, 76, 81, 76, 72, 76, 79, 81], [81, 79, 77, 76, 74, 0, 72, 0],
  [79, 0, 76, 79, 84, 0, 83, 81], [79, 0, 74, 79, 83, 0, 81, 79], [76, 0, 81, 0, 84, 83, 81, 76], [77, 81, 84, 81, 79, 77, 76, 74]
];
const STEP = 60 / 118 / 2;
function playStep(s, t) {
  const bar = Math.floor(s / 8) % 8, st = s % 8, ch = CHORDS[bar % 4], m = MELODY[bar][st];
  if (m) { tone(mtof(m), t, 0.3, 'triangle', 0.42, musicGain); tone(mtof(m + 12), t, 0.16, 'sine', 0.08, musicGain); }
  if (st === 0 || st === 4) { tone(mtof(ch[0]), t, 0.42, 'sine', 0.75, musicGain, 0.01); tone(150, t, 0.14, 'sine', 0.45, musicGain, 0.004, 48); }
  if (st === 3 || st === 7) tone(mtof(ch[0] + 7), t, 0.2, 'sine', 0.35, musicGain);
  if (st === 2 || st === 6) for (let i = 1; i < 4; i++) tone(mtof(ch[i] - 12), t + i * 0.012, 0.24, 'sine', 0.12, musicGain);
  if (st % 2 === 1) hat(t);
}
function startMusic() {
  if (!AC || seqTimer) return;
  musicGain.gain.cancelScheduledValues(AC.currentTime); musicGain.gain.setTargetAtTime(0.2, AC.currentTime, 0.1);
  nextTime = AC.currentTime + 0.08;
  seqTimer = setInterval(() => { while (nextTime < AC.currentTime + 0.15) { playStep(step, nextTime); nextTime += STEP; step++; } }, 30);
}
function stopMusic() {
  if (!seqTimer) return; clearInterval(seqTimer); seqTimer = null;
  if (AC) musicGain.gain.setTargetAtTime(0.0001, AC.currentTime, 0.08);
  setTimeout(() => { if (!seqTimer && AC) musicGain.gain.setValueAtTime(0.2, AC.currentTime + 0.3); }, 600);
}
function sfx(kind) {
  if (!AC) return; const t = AC.currentTime + 0.01;
  if (kind === 'jump') tone(380, t, 0.2, 'sine', 0.6, sfxGain, 0.005, 820);
  else if (kind === 'pop') { tone(880, t, 0.1, 'triangle', 0.5, sfxGain); tone(1320, t + 0.05, 0.12, 'triangle', 0.35, sfxGain); }
  else if (kind === 'open') { tone(660, t, 0.12, 'sine', 0.4, sfxGain); tone(990, t + 0.07, 0.16, 'sine', 0.35, sfxGain); }
  else if (kind === 'adopt') [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), t + i * 0.09, 0.3, 'triangle', 0.45, sfxGain));
  else if (kind === 'bonk') { tone(150, t, 0.22, 'sine', 0.8, sfxGain, 0.004, 55); tone(90, t, 0.12, 'triangle', 0.4, sfxGain); }
  else if (kind === 'horn') [0, 0.24].forEach(d => { tone(466, t + d, 0.2, 'square', 0.12, sfxGain, 0.01); tone(587, t + d, 0.2, 'square', 0.1, sfxGain, 0.01); });
}

function toneF(freq, t, dur, type, gain, fType, fFreq, freqEnd, attack = 0.01) {
  const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  f.type = fType; f.frequency.value = fFreq; f.Q.value = 2.5;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.05);
}
function hornSound(kind) {
  if (!AC) return; const t = AC.currentTime + 0.01;
  if (kind === 'pato') [0, 0.2].forEach(d => { toneF(560, t + d, 0.16, 'sawtooth', 0.55, 'bandpass', 1100, 420); toneF(565, t + d, 0.16, 'square', 0.2, 'bandpass', 2000, 430); });
  else if (kind === 'musical') [72, 76, 79, 84, 79, 84].forEach((m, i) => tone(mtof(m), t + i * 0.1, 0.14, 'triangle', 0.5, sfxGain));
  else if (kind === 'tren') [0, 0.42].forEach(d => [466, 554, 698].forEach(f => toneF(f, t + d, 0.38, 'sawtooth', 0.2, 'lowpass', 1800, 0, 0.04)));
  else if (kind === 'payaso') [0, 0.22].forEach((d, i) => toneF(i ? 700 : 900, t + d, 0.18, 'square', 0.35, 'bandpass', 1400, i ? 520 : 650));
  else sfx('horn');
}

export { AC, hornSound, initAudio, sfx, sfxGain, startMusic, stopMusic };
