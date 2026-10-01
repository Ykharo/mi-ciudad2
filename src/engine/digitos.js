// Números de "calculadora": dígitos de siete segmentos dibujados en un canvas (los apagados se ven tenues detrás, como
// en una pantalla LCD/LED). Para la pantalla gigante del Escenario del Aura y los carteles del jurado.
//   dibujarDigitos(ctx, texto, { x, y, alto, color, apagado, cifras })   texto: dígitos (y espacios)
//   anchoDigitos(cifras, alto)                                           cuánto ocupa
// Segmentos:  a arriba, b arriba derecha, c abajo derecha, d abajo, e abajo izquierda, f arriba izquierda, g medio.
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcfgd', '-': 'g', ' ': '' };

export const anchoDigitos = (cifras, alto) => cifras * alto * 0.62;

function segmento(x, cx, cy, horizontal, largo, grueso) {
  // un segmento con puntas en diagonal (como los de las calculadoras)
  const h = largo / 2, g = grueso / 2;
  x.beginPath();
  if (horizontal) { x.moveTo(cx - h, cy); x.lineTo(cx - h + g, cy - g); x.lineTo(cx + h - g, cy - g); x.lineTo(cx + h, cy); x.lineTo(cx + h - g, cy + g); x.lineTo(cx - h + g, cy + g); }
  else { x.moveTo(cx, cy - h); x.lineTo(cx + g, cy - h + g); x.lineTo(cx + g, cy + h - g); x.lineTo(cx, cy + h); x.lineTo(cx - g, cy + h - g); x.lineTo(cx - g, cy - h + g); }
  x.closePath(); x.fill();
}

function digito(x, ch, ox, oy, alto, color, apagado) {
  const w = alto * 0.5, gr = alto * 0.11, l = w - gr * 0.4, hl = alto / 2 - gr * 0.2, sk = alto * 0.06;   // sk: inclinación
  const pos = {
    a: [ox + w / 2 + sk, oy, true, l], g: [ox + w / 2, oy + alto / 2, true, l], d: [ox + w / 2 - sk, oy + alto, true, l],
    f: [ox + sk * 0.5, oy + alto / 4, false, hl], b: [ox + w + sk * 0.5, oy + alto / 4, false, hl],
    e: [ox - sk * 0.5, oy + alto * 3 / 4, false, hl], c: [ox + w - sk * 0.5, oy + alto * 3 / 4, false, hl],
  };
  const on = SEG[ch] || '';
  for (const [s, [cx, cy, hz, len]] of Object.entries(pos)) {
    if (!on.includes(s)) { if (!apagado) continue; x.fillStyle = apagado; x.shadowBlur = 0; }
    else { x.fillStyle = color; x.shadowColor = color; x.shadowBlur = alto * 0.12; }
    segmento(x, cx, cy, hz, len, gr);
  }
  x.shadowBlur = 0;
}

// `cifras`: cuántas casillas (el número se alinea a la derecha; las de la izquierda quedan apagadas)
export function dibujarDigitos(x, texto, { x: x0 = 0, y: y0 = 0, alto = 100, color = '#7CFFB2', apagado = 'rgba(255,255,255,.07)', cifras = texto.length } = {}) {
  const t = String(texto).padStart(cifras, ' '), paso = alto * 0.62;
  for (let i = 0; i < t.length; i++) digito(x, t[i], x0 + i * paso + alto * 0.04, y0, alto, color, apagado);
}
