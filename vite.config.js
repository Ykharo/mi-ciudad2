// Dos versiones del juego:
// - web (npm run build:web → dist/web): archivos separados, para GitHub Pages. Los modelos se descargan.
// - un solo archivo (npm run build → dist/unico/ciudad-arcoiris.html): todo adentro, incluido Three.js
//   y los modelos en base64. Abre con doble clic y en el visor donde se publica.
import { defineConfig } from 'vite';
import { renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { viteSingleFile } from 'vite-plugin-singlefile';
import embedAssets from './tools/vite-embed-assets.js';

const UNICO = 'ciudad-arcoiris.html';

// Vite siempre llama index.html a la página; en la versión de un solo archivo se renombra al final.
function renameHtml(outDir) {
  return {
    name: 'renombrar-html',
    apply: 'build',
    closeBundle() { renameSync(resolve(outDir, 'index.html'), resolve(outDir, UNICO)); },
  };
}

export default defineConfig(({ mode }) => {
  const unico = mode === 'unico';
  const outDir = unico ? 'dist/unico' : 'dist/web';
  return {
    base: './',
    publicDir: unico ? false : 'assets',
    build: {
      outDir,
      emptyOutDir: true,
      // Safari 14 en adelante: al empaquetar Three.js ya no se necesita importmap (Safari 16.4+)
      target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
      chunkSizeWarningLimit: 1000,   // Three.js solo ya pesa ~600 kB; es esperado
    },
    plugins: unico ? [viteSingleFile(), embedAssets({ dir: 'assets' }), renameHtml(outDir)] : [],
  };
});
