// Una versión del juego: la web (npm run build → dist/web), archivos separados para GitHub Pages. Los modelos se
// descargan cuando se usan (cada prenda, sólo si alguien la lleva puesta). (Hasta el 30-09-2026 había además una
// versión de un solo archivo con todo adentro; se dejó porque crecía con cada prenda: PLAN.md.)
import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Huella de cada modelo (assets/modelos/**/*.glb): el cargador la agrega a la dirección (?v=…). Así un navegador
// descarga de nuevo un modelo que cambió (antes seguía con su copia vieja: un nina_base.glb sin las animaciones
// nuevas), y uno que no cambió lo sigue sacando de su caché. Módulo virtual: 'virtual:huellas-modelos'.
function huellasModelos() {
  const id = 'virtual:huellas-modelos', rid = '\0' + id;
  const calcular = () => {
    const h = {};
    const recorrer = dir => readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const f = join(dir, e.name);
      if (e.isDirectory()) recorrer(f);
      else if (e.name.endsWith('.glb')) h[relative('assets', f).replace(/\\/g, '/')] = createHash('md5').update(readFileSync(f)).digest('hex').slice(0, 10);
    });
    recorrer('assets/modelos');
    return h;
  };
  return {
    name: 'huellas-modelos',
    resolveId: i => (i === id ? rid : null),
    load: i => (i === rid ? `export default ${JSON.stringify(calcular())};` : null),
    // en desarrollo, si se regenera un modelo, la huella se vuelve a calcular
    configureServer(server) {
      server.watcher.on('change', f => {
        if (!/modelos[\\/].*\.glb$/.test(f)) return;
        const m = server.moduleGraph.getModuleById(rid);
        if (m) server.moduleGraph.invalidateModule(m);
      });
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: 'assets',
  plugins: [huellasModelos()],
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    // Safari 14 en adelante: al empaquetar Three.js ya no se necesita importmap (Safari 16.4+)
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    chunkSizeWarningLimit: 1000,   // Three.js solo ya pesa ~600 kB; es esperado
  },
});
