// Pruebas del juego con Playwright.
// Etapa 0: se prueba el juego armado de hoy (juego_actual/), servido tal cual con `vite preview`,
// que sólo entrega archivos estáticos (no transforma el HTML ni el importmap).
import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4173;

export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  expect: {
    timeout: 30_000,
    // el render de WebGL por software puede variar algún píxel entre corridas
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  // un solo navegador a la vez: WebGL por software es pesado y las pruebas se estorban
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotPathTemplate: '{testDir}/capturas/{arg}-{projectName}{ext}',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'escritorio',
      use: {
        ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 },
        // WebGL con la GPU del PC: por software (SwiftShader) es demasiado lento para las capturas.
        // Las capturas de referencia dependen de la GPU: si se cambia de PC, se regeneran.
        launchOptions: { args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] },
      },
    },
    {
      // lo más parecido a Safari del iPad que se puede automatizar en Windows (no reemplaza el iPad real)
      name: 'ipad',
      use: { ...devices['iPad Pro 11 landscape'] },
      testIgnore: /capturas\.spec\.js/,
    },
  ],
  webServer: {
    command: `npx vite preview --outDir juego_actual --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/ciudad-arcoiris-nina.html`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
