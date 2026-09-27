// Piezas de HTML para los paneles.

const svgI = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;
function optsHTML(list, cur, key) {
  return '<div class="opts">' + list.map(s => `<button class="opt${s.id === cur ? ' on' : ''}" data-k="${key}" data-v="${s.id}">${s.ic ? `<span class="ic">${s.ic}</span>` : ''}<span>${s.name}</span></button>`).join('') + '</div>';
}
function swHTML(list, cur, key) {
  return '<div class="sws">' + list.map((c, i) => {
    const v = key === 'skin' ? i : c, on = key === 'skin' ? i === cur : c.toLowerCase() === String(cur).toLowerCase();
    return `<button class="sw${on ? ' on' : ''}" style="background:${c}" data-k="${key}" data-v="${v}" aria-label="Color ${i + 1}"></button>`;
  }).join('') + '</div>';
}
const clone = o => JSON.parse(JSON.stringify(o));
function carIcon(type, c, a) {
  const o = 'stroke="rgba(38,49,92,.35)" stroke-width="1"', gl = '#BFE6FF';
  const wh = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2B2F45"/><circle cx="${x}" cy="${y}" r="${(r * 0.42).toFixed(1)}" fill="#E6E9F2"/>`;
  const P = {
    clasico: `<path d="M14 12 L17 4 H38 L42 12Z" fill="${c}" ${o}/><path d="M18.5 11 L20.5 6 H27 V11Z M30 11 V6 H36 L38.5 11Z" fill="${gl}"/><rect x="15" y="2" width="25" height="3" rx="1.5" fill="${a}" ${o}/><rect x="4" y="11" width="48" height="11" rx="5" fill="${c}" ${o}/>` + wh(15, 22, 5) + wh(41, 22, 5),
    descapotable: `<rect x="20" y="5" width="5" height="8" rx="2" fill="${a}" ${o}/><path d="M31 12 L34 5.5" stroke="#9AA3B8" stroke-width="2.4" stroke-linecap="round"/><path d="M3 19 V15 Q3 12 8 12 H46 Q53 12 53 16 V19Z" fill="${c}" ${o}/>` + wh(13, 20, 5) + wh(43, 20, 5),
    jeep: `<circle cx="4.5" cy="13" r="4" fill="#2B2F45"/><path d="M16 8 V2 H23 V8" fill="none" stroke="${a}" stroke-width="2.4" stroke-linejoin="round"/><path d="M35 8 V3" stroke="#3C4670" stroke-width="2.4" stroke-linecap="round"/><rect x="6" y="8" width="44" height="12" rx="2" fill="${c}" ${o}/>` + wh(16, 21, 6) + wh(40, 21, 6),
    buggy: `<path d="M17 14 L20 3 H31 L38 14" fill="none" stroke="${a}" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 13 H40 L51 16 Q52 19 49 20 H11Z" fill="${c}" ${o}/>` + wh(15, 20, 7) + wh(45, 22, 5),
    deportivo: `<path d="M2 7 H10 M6 7 V12" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/><path d="M3 20 V14 Q4 11 12 11 L22 7 H30 L38 11 Q50 12 53 16 V20Z" fill="${c}" ${o}/><path d="M24 8.5 H29 L34 11 H22Z" fill="${gl}"/>` + wh(13, 20, 5) + wh(43, 20, 5),
    camioneta: `<path d="M27 11 V3 H38 Q41 3 43 7 L45 11Z" fill="${c}" ${o}/><path d="M30 10 V5 H37 L39.5 10Z" fill="${gl}"/><rect x="3" y="10" width="51" height="10" rx="3" fill="${c}" ${o}/><path d="M6 13.5 H24" stroke="rgba(38,49,92,.3)" stroke-width="1.5"/>` + wh(12, 21, 5.5) + wh(44, 21, 5.5),
    monster: `<path d="M19 4 V1 H25 V4" fill="none" stroke="${a}" stroke-width="2" stroke-linejoin="round"/><path d="M11 12 V6 Q11 4 14 4 H38 Q44 4 45 8 L46 12Z" fill="${c}" ${o}/>` + wh(15, 19.5, 7.5) + wh(41, 19.5, 7.5),
    karting: `<rect x="15" y="9" width="4.5" height="8" rx="1.5" fill="${a}" ${o}/><path d="M30 16 L33 10" stroke="#3C4670" stroke-width="2" stroke-linecap="round"/><path d="M5 20 L9 16 H47 L51 20Z" fill="${c}" ${o}/>` + wh(12, 22, 4.5) + wh(44, 22, 4.5)
  };
  return svgI(56, 28, P[type]);
}
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

export { carIcon, clone, optsHTML, stars, svgI, swHTML };
