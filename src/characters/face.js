// Expresiones de la cara (atlas 4×2).

const FACE_CELLS = { normal: [0, 0], feliz: [1, 0], triste: [2, 0], sorpresa: [3, 0], enojada: [0, 1], guino: [1, 1] };
const BLINK_CELL = [1, 0];               // ojos cerrados de la cara "feliz"
const BLINKS = new Set(['normal', 'sorpresa', 'triste', 'enojada']);
function cell(m, [col, row]) { if (m && m.map) m.map.offset.set(col * 0.25, row * 0.5); }
function setFace(c, f) {
  c.face = f; const x = FACE_CELLS[f] || FACE_CELLS.normal;
  cell(c.mats.Face_Eyes, c.blinkOn > 0 ? BLINK_CELL : x); cell(c.mats.Face_Eyebrows, x); cell(c.mats.Face_Mouth, x);
}

export { BLINKS, setFace };
