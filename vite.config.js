// Una versión del juego: la web (npm run build → dist/web), archivos separados para GitHub Pages. Los modelos se
// descargan cuando se usan (cada prenda, sólo si alguien la lleva puesta). (Hasta el 30-09-2026 había además una
// versión de un solo archivo con todo adentro; se dejó porque crecía con cada prenda: PLAN.md.)
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
    // Safari 14 en adelante: al empaquetar Three.js ya no se necesita importmap (Safari 16.4+)
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    chunkSizeWarningLimit: 1000,   // Three.js solo ya pesa ~600 kB; es esperado
  },
});
