// Plugin de Vite para la versión de un solo archivo: agrega cada modelo como
// <script id="asset:ID" type="application/octet-stream">…base64…</script> al final del <body>:
// los del manifiesto y todas las prendas (assets/modelos/prendas/*.glb → id 'prenda:NOMBRE').
// El cargador (src/assets/loader.js) los lee de ahí en vez de descargarlos.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MANIFEST, PRENDAS_DIR } from '../src/assets/manifest.js';

export default function embedAssets({ dir }) {
  return {
    name: 'incrustar-modelos',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => {
        const modelos = { ...MANIFEST };
        for (const f of readdirSync(resolve(dir, PRENDAS_DIR))) if (f.endsWith('.glb')) modelos['prenda:' + f.slice(0, -4)] = `${PRENDAS_DIR}/${f}`;
        return Object.entries(modelos).map(([id, file]) => ({
          tag: 'script',
          attrs: { id: 'asset:' + id, type: 'application/octet-stream' },
          children: readFileSync(resolve(dir, file)).toString('base64'),
          injectTo: 'body',
        }));
      },
    },
  };
}
