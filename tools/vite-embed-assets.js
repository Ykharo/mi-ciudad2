// Plugin de Vite para la versión de un solo archivo: agrega cada modelo del manifiesto como
// <script id="asset:ID" type="application/octet-stream">…base64…</script> al final del <body>.
// El cargador (src/assets/loader.js) lo lee de ahí en vez de descargarlo.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MANIFEST } from '../src/assets/manifest.js';

export default function embedAssets({ dir }) {
  return {
    name: 'incrustar-modelos',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => Object.entries(MANIFEST).map(([id, file]) => ({
        tag: 'script',
        attrs: { id: 'asset:' + id, type: 'application/octet-stream' },
        children: readFileSync(resolve(dir, file)).toString('base64'),
        injectTo: 'body',
      })),
    },
  };
}
