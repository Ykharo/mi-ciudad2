// ESLint: errores comunes + las reglas de dependencia entre capas de src/ (PLAN.md, sección 2.1).
//   core ← engine ← assets ← contenido (world, characters, pets, cars) ← game ← audio, ui ← debug ← main.js
// Una capa no importa nada de las capas que están a su derecha, y no puede haber ciclos de importación.
import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

const CONTENIDO = ['world', 'characters', 'pets', 'cars'];
const ARRIBA = {
  core: ['engine', 'assets', ...CONTENIDO, 'game', 'audio', 'ui', 'debug', 'main.js'],
  engine: ['assets', ...CONTENIDO, 'game', 'audio', 'ui', 'debug', 'main.js'],
  assets: [...CONTENIDO, 'game', 'audio', 'ui', 'debug', 'main.js'],
  ...Object.fromEntries(CONTENIDO.map(c => [c, ['game', 'audio', 'ui', 'debug', 'main.js']])),
  game: ['audio', 'ui', 'debug', 'main.js'],
  audio: ['game', 'ui', 'debug', 'main.js'],
  ui: ['debug', 'main.js'],
  debug: ['main.js'],
};
const zonas = Object.entries(ARRIBA).map(([capa, prohibidas]) => ({
  target: `./src/${capa}`,
  from: prohibidas.map(p => `./src/${p}`),
  message: `${capa}/ no puede importar capas de más arriba (ver PLAN.md 2.1): usa eventos (core/events.js) o parámetros.`,
}));

export default [
  { ignores: ['dist/**', 'juego_actual/**', 'test-results/**', 'playwright-report/**', 'herramientas_avatar/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    plugins: { import: importPlugin },
    rules: {
      'import/no-cycle': 'error',
      'import/no-restricted-paths': ['error', { zones: zonas }],
      'import/named': 'error',
      // three/addons usa "exports", que el resolvedor no entiende; virtual:… son módulos de vite.config.js
      'import/no-unresolved': ['error', { ignore: ['^three', '^virtual:'] }],
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],   // try { … } catch (_) { } a propósito (localStorage, pointer capture)
    },
  },
  {
    files: ['tests/**/*.js', 'tools/**/*.{js,mjs}', '*.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
