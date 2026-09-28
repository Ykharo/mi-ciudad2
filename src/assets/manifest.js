// Modelos del juego: id → archivo dentro de assets/ (publicDir de Vite).
// Las prendas siguen una convención y no hace falta anotarlas: 'prenda:ID' → modelos/prendas/ID.glb.
// Lo usan el cargador (en el navegador) y el plugin que los incrusta en la versión de un solo archivo.
export const MANIFEST = {
  nina_base: 'modelos/nina_base.glb',
};
export const PRENDAS_DIR = 'modelos/prendas';

export function assetFile(id) {
  if (MANIFEST[id]) return MANIFEST[id];
  if (id.startsWith('prenda:')) return `${PRENDAS_DIR}/${id.slice(7)}.glb`;
  return null;
}
