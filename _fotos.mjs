// temporal: bufanda, lentes, moño y las pociones nuevas
import { chromium } from '@playwright/test';
const OUT = process.env.OUT;
const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] });
async function abrir(pets) {
  const page = await b.newPage({ viewport: { width: 1000, height: 650 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CERR', m.text()); });
  await page.addInitScript(d => localStorage.setItem('ciudadArcoiris.v2', JSON.stringify(d)), { version: 2, pets, cars: [], regaloPrueba: true });
  await page.goto('http://localhost:5173/?test');
  await page.waitForFunction(() => document.querySelector('#btnPlay')?.textContent === '¡A jugar!', null, { timeout: 90000 });
  await page.click('#btnPlay');
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__juego.teleport(-20, -12));
  await page.waitForTimeout(2000);
  return page;
}
const todo = ['bufanda', 'lentes', 'mono', 'brillo', 'burbujas', 'mini', 'gigante'];
const mirar = (page, i, a, d = 1.6) => page.evaluate(([i, a, d]) => {
  const j = window.__juego, p = j.player.pets[i], r = p.obj.root.position, f = p.facing + a, s = p.obj.root.scale.x;
  j.cam.fijo = { pos: [r.x + Math.sin(f) * d * s, r.y + 0.9 * s, r.z + Math.cos(f) * d * s], look: [r.x, r.y + 0.6 * s, r.z] };
}, [i, a, d]);
{
  const ropa = { cuello: 'bufanda', cara: 'lentes', cola: 'mono' };
  const page = await abrir(['perro', 'gato', 'conejo', 'unicornio'].map((k, i) => ({ kind: k, color: ['#E9B77A', '#B9B9CC', '#FFFFFF', '#FFB8D6'][i], name: k, cosas: todo, extras: { ropa } })));
  for (let i = 0; i < 4; i++) for (const [k, a] of [['frente', 0.4], ['atras', 2.6]]) { await mirar(page, i, a); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/n_${i}_${k}.png` }); }
  await page.close();
}
{
  const page = await abrir([
    { kind: 'perro', color: '#E9B77A', name: 'Brillo', cosas: todo, extras: { brillo: true } },
    { kind: 'gato', color: '#B9B9CC', name: 'Burbu', cosas: todo, extras: { burbujas: true, tamano: 'gigante' } },
    { kind: 'perro', color: '#C98B4F', name: 'Mini', cosas: todo, extras: { tamano: 'mini' } },
  ]);
  console.log(await page.evaluate(() => window.__juego.player.pets.map(p => [p.name, p.obj.root.scale.x.toFixed(2), JSON.stringify(p.extras)])));
  await page.keyboard.down('d'); await page.waitForTimeout(1500); await page.keyboard.up('d');
  await page.waitForTimeout(300);
  await page.evaluate(() => { const j = window.__juego, r = j.player.pos; j.cam.fijo = { pos: [r.x, 2.2, r.z + 6], look: [r.x - 1.5, 0.6, r.z] }; });
  await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/n_pociones.png` });
  await page.waitForTimeout(1500); await page.screenshot({ path: `${OUT}/n_pociones2.png` });
  await page.close();
}
await b.close();
