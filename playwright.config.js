// Pruebas del juego con Playwright. `npm test` arma primero la versión web (pretest) y prueba:
// - dev:   el código de src/ servido por Vite (desarrollo)
// - web:   dist/web, la versión que se publica en GitHub Pages
// Las capturas de referencia (tests/capturas/) son las mismas para las dos.
import { defineConfig, devices } from '@playwright/test';

// ?test instala los ganchos de prueba (window.__juego, ver src/debug/hooks.js)
const SERVIDORES = {
  dev:   { puerto: 5173, cmd: 'npx vite', pagina: '/?test' },
  web:   { puerto: 4173, cmd: 'npx vite preview', pagina: '/?test' },
};

const escritorio = {
  ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 },
  // WebGL con la GPU del PC: por software (SwiftShader) es demasiado lento para las capturas.
  // Las capturas de referencia dependen de la GPU: si se cambia de PC, se regeneran.
  launchOptions: { args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] },
};
// lo más parecido a Safari del iPad que se puede automatizar en Windows (no reemplaza el iPad real)
const ipad = { ...devices['iPad Pro 11 landscape'] };

const proyecto = (nombre, version, dispositivo, testMatch) => {
  const s = SERVIDORES[version];
  return { name: nombre, testMatch, use: { ...dispositivo, baseURL: `http://localhost:${s.puerto}`, juego: s.pagina } };
};

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  expect: {
    timeout: 30_000,
    // La GPU puede variar un nivel de color en algún píxel entre corridas (vidrios transparentes);
    // eso ya lo ignora el umbral por píxel (threshold 0,2). Más de 50 píxeles distintos es un cambio real.
    toHaveScreenshot: { maxDiffPixels: 50 },
  },
  // un solo navegador a la vez: WebGL es pesado y las pruebas se estorban
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: '{testDir}/capturas/{arg}{ext}',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    proyecto('dev', 'dev', escritorio, /(humo|lugares|manejo|guardado|vestidor|personajes|capturas)\.spec\.js/),
    proyecto('dev-ipad', 'dev', ipad, /(humo|lugares|manejo|guardado|vestidor|personajes)\.spec\.js/),
    proyecto('web', 'web', escritorio, /(humo|lugares|manejo|guardado|vestidor|personajes|capturas|sin-red)\.spec\.js/),
    proyecto('web-ipad', 'web', ipad, /(humo|lugares|manejo|guardado|vestidor|personajes)\.spec\.js/),
  ],
  webServer: Object.values(SERVIDORES).map(s => ({
    command: `${s.cmd} --port ${s.puerto} --strictPort`,
    url: `http://localhost:${s.puerto}${s.pagina}`,
    reuseExistingServer: true,
    timeout: 60_000,
  })),
});
