// Pruebas del juego con Playwright. `npm test` arma primero las dos versiones (pretest) y prueba:
// - dev:   el código de src/ servido por Vite (desarrollo)
// - web:   dist/web, la versión que se publica en GitHub Pages
// - unico: dist/unico/ciudad-arcoiris.html, la versión de un solo archivo
// Las capturas de referencia (tests/capturas/) son las mismas para todas: vienen del juego de la etapa 0.
import { defineConfig, devices } from '@playwright/test';

const SERVIDORES = {
  dev:   { puerto: 5173, cmd: 'npx vite', pagina: '/' },
  web:   { puerto: 4173, cmd: 'npx vite preview', pagina: '/' },
  unico: { puerto: 4174, cmd: 'npx vite preview --mode unico', pagina: '/ciudad-arcoiris.html' },
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
    // el render de WebGL puede variar algún píxel entre corridas
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
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
    proyecto('dev', 'dev', escritorio, /(humo|capturas)\.spec\.js/),
    proyecto('dev-ipad', 'dev', ipad, /humo\.spec\.js/),
    proyecto('web', 'web', escritorio, /(humo|capturas)\.spec\.js/),
    proyecto('web-ipad', 'web', ipad, /humo\.spec\.js/),
    proyecto('unico', 'unico', escritorio, /(humo|capturas|sin-red)\.spec\.js/),
  ],
  webServer: Object.values(SERVIDORES).map(s => ({
    command: `${s.cmd} --port ${s.puerto} --strictPort`,
    url: `http://localhost:${s.puerto}${s.pagina}`,
    reuseExistingServer: true,
    timeout: 60_000,
  })),
});
