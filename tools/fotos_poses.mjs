// Fotografía a Nina con el probador en las poses más exigentes para la ropa, de frente, de lado y de atrás.
// Sirve para revisar una prenda nueva (¿se atraviesa?, ¿se abre?) o comparar dos versiones de los modelos.
//
//   1. npm run dev            (en otra ventana)
//   2. node tools/fotos_poses.mjs <carpeta> [parámetros extra del probador, p. ej. "look=azar&seed=3"]
//
// Deja una imagen por pose en <carpeta> (ej.: split-1.5-lado.png).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [, , out, extra = ''] = process.argv;
if (!out) { console.error('Uso: node tools/fotos_poses.mjs <carpeta> [parámetros]'); process.exit(1); }
mkdirSync(out, { recursive: true });

// animación → segundos donde se detiene (idle/walk/run no: son de locomoción y no se pausan)
const POSES = { jump: [0.5], wave: [0.8], sit: [1.5], lie: [1.5], dance: [0.5, 1.5], split: [0.8, 1.5], walk_back: [0.3], candle: [1.0, 2.0, 3.0] };
const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 700, height: 700 } });
const errores = [];
p.on('pageerror', e => errores.push(e.message));
p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
for (const [anim, ts] of Object.entries(POSES)) for (const t of ts) for (const vista of ['frente', 'lado', 'atras']) {
  await p.goto(`http://localhost:5173/src/debug/probador.html?anim=${anim}&t=${t}&vista=${vista}&${extra}`);
  await p.waitForFunction(() => window.__probador && window.__probador.listo, null, { timeout: 60000 });
  await p.addStyleTag({ content: '#panel{display:none}' });
  await p.waitForTimeout(300);
  await p.locator('#c').screenshot({ path: `${out}/${anim}-${t}-${vista}.png` });
}
console.log(`${Object.values(POSES).flat().length * 3} fotos en ${out}. Errores:`, errores.length ? errores : 'ninguno');
await b.close();
