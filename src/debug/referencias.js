// Referencias encima de las vistas del probador (sólo desarrollo): una hoja de referencias/ropa/ (o cualquier imagen
// que se cargue) sobre cada vista, con transparencia, en modo normal o "diferencia", reflejada si hace falta, y que se
// mueve arrastrando y se agranda con la rueda. Recortes listos por hoja (vista frontal, lateral, cabeza) y "Alinear con
// 4 toques": dos puntos en la referencia y los mismos dos en el modelo. El ajuste de cada vista se guarda en el
// navegador (localStorage), por hoja.
const HOJAS = import.meta.glob('/referencias/ropa/*.png', { query: '?url', import: 'default', eager: true });
// recortes de cada hoja (x, y, ancho, alto en píxeles de la hoja): el personaje de cabeza a pies, o la cabeza
const RECORTES = {
  'hoja_de_referencia_nina.png': { frontal: [6, 66, 308, 592], lateral: [328, 66, 240, 453], cabeza: [839, 60, 229, 212], 'cabeza de lado': [1068, 60, 163, 212] },
  'hoja_personaje_nuevo.png': { frontal: [15, 55, 300, 493], lateral: [330, 55, 300, 493], cabeza: [905, 65, 230, 215], 'cabeza de lado': [1140, 65, 170, 215] },
  'hoja_personaje_nino.png': { frontal: [15, 55, 300, 530], lateral: [330, 55, 300, 530], cabeza: [905, 65, 235, 220], 'cabeza de lado': [1145, 65, 165, 220] },
};
const nombreDe = url => decodeURIComponent(url.split('/').pop().split('?')[0]);
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
const leer = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };

// Una capa de referencia sobre una vista (rect en píxeles de la pantalla). Transformación: la imagen (ya reflejada si
// `espejo`) se dibuja en t + s·u, con u en píxeles de la imagen.
function crearCapa(id) {
  const caja = document.createElement('div'), lamina = document.createElement('div'), img = document.createElement('img');
  caja.className = 'ref-caja'; lamina.className = 'ref-lamina'; img.className = 'ref-img'; img.draggable = false;
  lamina.appendChild(img); caja.appendChild(lamina); document.body.appendChild(caja);
  const c = { id, caja, img, url: null, W: 1, H: 1, t: [0, 0], s: 1, espejo: false, opacidad: 0.5, mezcla: 'normal', recorte: '', rect: { x: 0, y: 0, w: 1, h: 1 } };
  c.clave = () => `probador.ref.${nombreDe(c.url || '')}.${id}`;
  c.pintar = () => {
    // (la mezcla va en la caja: es la que se apoya sobre el dibujo del modelo; en la lámina se mezclaría consigo misma)
    Object.assign(caja.style, { left: c.rect.x + 'px', top: c.rect.y + 'px', width: c.rect.w + 'px', height: c.rect.h + 'px', display: c.url ? '' : 'none', mixBlendMode: c.mezcla });
    Object.assign(lamina.style, { width: c.W + 'px', height: c.H + 'px', transform: `translate(${c.t[0]}px, ${c.t[1]}px) scale(${c.s})`, opacity: c.opacidad });
    img.style.transform = c.espejo ? 'scaleX(-1)' : '';
  };
  // se guarda relativo al alto de la vista (así sirve aunque cambie el tamaño de la ventana)
  c.guardar = () => { if (c.url) guardar(c.clave(), { t: [c.t[0] / c.rect.h, c.t[1] / c.rect.h], s: c.s / c.rect.h, espejo: c.espejo, opacidad: c.opacidad, mezcla: c.mezcla, recorte: c.recorte }); };
  c.recortar = nombre => {   // encuadra un recorte de la hoja en la vista
    const r = (RECORTES[nombreDe(c.url)] || {})[nombre];
    c.recorte = nombre;
    if (!r) return;
    const [x, y, w, h] = r, xd = c.espejo ? c.W - (x + w) : x;
    c.s = c.rect.h * 0.9 / h;
    c.t = [c.rect.w / 2 - (xd + w / 2) * c.s, c.rect.h * 0.05 - y * c.s];
  };
  c.cargar = (url, nombreRecorte) => new Promise(ok => {
    c.url = url;
    img.onload = () => {
      c.W = img.naturalWidth; c.H = img.naturalHeight;
      const g = leer(c.clave());
      if (g) Object.assign(c, { t: [g.t[0] * c.rect.h, g.t[1] * c.rect.h], s: g.s * c.rect.h, espejo: g.espejo, opacidad: g.opacidad, mezcla: g.mezcla, recorte: g.recorte });
      else c.recortar(nombreRecorte);
      c.pintar(); ok();
    };
    img.src = url;
  });
  c.aPantalla = u => [c.rect.x + c.t[0] + c.s * u[0], c.rect.y + c.t[1] + c.s * u[1]];
  c.aImagen = p => [(p[0] - c.rect.x - c.t[0]) / c.s, (p[1] - c.rect.y - c.t[1]) / c.s];
  return c;
}

// El panel de referencias y las capas. vistas: [{ id, nombre, recorte (el que se usa al elegir una hoja) }].
export function crearReferencias(panel, vistas) {
  const capas = Object.fromEntries(vistas.map(v => [v.id, crearCapa(v.id)]));
  const hojas = Object.entries(HOJAS).map(([ruta, url]) => ({ nombre: nombreDe(ruta), url }));
  const sec = document.createElement('div');
  sec.innerHTML = `<h2>Referencias</h2>
    <label>Hoja</label><select id="refHoja"><option value="">(ninguna)</option>${hojas.map(h => `<option value="${h.url}">${h.nombre}</option>`).join('')}</select>
    <label>Cargar otra imagen</label><input id="refArchivo" type="file" accept="image/*">
    <div id="refVistas"></div>
    <label><input id="refGuias" type="checkbox"> Líneas guía</label>
    <button id="refMover" title="Arrastrar mueve la referencia; la rueda la agranda (también con Mayús apretada)">🖐 Mover referencia</button>
    <button id="refAlinear" title="Toca dos puntos en la referencia y después los mismos dos en el modelo">📐 Alinear con 4 toques</button>
    <div id="refAyuda" class="ayuda"></div>`;
  panel.appendChild(sec);
  const $ = s => sec.querySelector(s), vistasEl = $('#refVistas'), ayuda = $('#refAyuda');
  const recortesDe = c => Object.keys(RECORTES[nombreDe(c.url || '')] || {});
  function renderVistas() {
    vistasEl.innerHTML = vistas.filter(v => capas[v.id].rect.w > 1).map(v => {
      const c = capas[v.id];
      return `<fieldset data-v="${v.id}"><legend>${v.nombre}</legend>
        <label>Recorte</label><select data-k="recorte"><option value="">(libre)</option>${recortesDe(c).map(r => `<option${r === c.recorte ? ' selected' : ''}>${r}</option>`).join('')}</select>
        <label>Transparencia</label><input data-k="opacidad" type="range" min="0" max="1" step="0.05" value="${c.opacidad}">
        <label><input data-k="espejo" type="checkbox"${c.espejo ? ' checked' : ''}> Reflejar</label>
        <label><input data-k="mezcla" type="checkbox"${c.mezcla === 'difference' ? ' checked' : ''}> Diferencia (para alinear)</label>
        <label><input data-k="ver" type="checkbox"${c.oculta ? '' : ' checked'}> Mostrar</label>
      </fieldset>`;
    }).join('');
  }
  vistasEl.addEventListener('input', e => {
    const f = e.target.closest('[data-v]'); if (!f) return;
    const c = capas[f.dataset.v], k = e.target.dataset.k;
    if (k === 'opacidad') c.opacidad = +e.target.value;
    if (k === 'mezcla') c.mezcla = e.target.checked ? 'difference' : 'normal';
    if (k === 'ver') { c.oculta = !e.target.checked; c.caja.hidden = c.oculta; }
    if (k === 'espejo') { c.espejo = e.target.checked; if (c.recorte) c.recortar(c.recorte); }
    if (k === 'recorte') c.recortar(e.target.value);
    c.pintar(); c.guardar();
  });
  async function usarHoja(url) {
    for (const v of vistas) {
      const c = capas[v.id];
      if (!url) { c.url = null; c.pintar(); continue; }
      await c.cargar(url, v.recorte);
    }
    renderVistas();
  }
  $('#refHoja').addEventListener('change', e => usarHoja(e.target.value));
  $('#refArchivo').addEventListener('change', e => { const f = e.target.files[0]; if (f) usarHoja(URL.createObjectURL(f)); });
  $('#refGuias').addEventListener('change', e => document.body.classList.toggle('guias', e.target.checked));

  // mover y agrandar: con el botón activo o con Mayús apretada
  let modo = null, arrastre = null, toques = [];
  const capaEn = (x, y) => Object.values(capas).find(c => c.url && !c.oculta && x >= c.rect.x && x < c.rect.x + c.rect.w && y >= c.rect.y && y < c.rect.y + c.rect.h);
  const activa = () => modo || teclaMayus;
  let teclaMayus = false;
  const actualizarCursor = () => document.body.classList.toggle('ref-activa', !!activa());
  addEventListener('keydown', e => { if (e.key === 'Shift') { teclaMayus = true; actualizarCursor(); } });
  addEventListener('keyup', e => { if (e.key === 'Shift') { teclaMayus = false; actualizarCursor(); } });
  $('#refMover').addEventListener('click', () => { modo = modo === 'mover' ? null : 'mover'; toques = []; pasoAyuda(); actualizarCursor(); });
  $('#refAlinear').addEventListener('click', () => { modo = modo === 'alinear' ? null : 'alinear'; toques = []; pasoAyuda(); actualizarCursor(); });
  function pasoAyuda() {
    $('#refMover').classList.toggle('on', modo === 'mover'); $('#refAlinear').classList.toggle('on', modo === 'alinear');
    ayuda.textContent = modo === 'mover' ? 'Arrastra para mover la referencia; la rueda la agranda o achica. (Mayús apretada hace lo mismo sin el botón.)'
      : modo === 'alinear' ? ['1/4: toca un punto de la REFERENCIA (por ejemplo, la coronilla)', '2/4: toca otro punto de la REFERENCIA, lejos del primero (por ejemplo, la planta del pie o la barbilla)',
        '3/4: toca el MISMO primer punto en el MODELO', '4/4: toca el MISMO segundo punto en el MODELO'][toques.length] : '';
  }
  // Las capas no reciben el mouse (la cámara sigue funcionando); cuando se ajusta, se captura en la ventana.
  addEventListener('pointerdown', e => {
    if (!activa() || e.target.closest('#panel')) return;
    const c = capaEn(e.clientX, e.clientY); if (!c) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (modo === 'alinear') {
      if (toques.length && toques[0].c !== c) toques = [];
      toques.push({ c, p: [e.clientX, e.clientY] });
      if (toques.length === 4) {
        // los dos primeros toques en coordenadas de la imagen; los dos últimos, donde tienen que quedar
        const u1 = c.aImagen(toques[0].p), u2 = c.aImagen(toques[1].p), q1 = toques[2].p, q2 = toques[3].p;
        const s = Math.hypot(q2[0] - q1[0], q2[1] - q1[1]) / Math.hypot(u2[0] - u1[0], u2[1] - u1[1]);
        c.s = s; c.t = [q1[0] - c.rect.x - s * u1[0], q1[1] - c.rect.y - s * u1[1]];
        c.recorte = ''; c.pintar(); c.guardar(); renderVistas();
        toques = []; modo = null; actualizarCursor();
      }
      pasoAyuda();
      return;
    }
    arrastre = { c, x: e.clientX, y: e.clientY };
  }, true);
  addEventListener('pointermove', e => {
    if (!arrastre) return;
    const c = arrastre.c; c.t = [c.t[0] + e.clientX - arrastre.x, c.t[1] + e.clientY - arrastre.y];
    arrastre.x = e.clientX; arrastre.y = e.clientY; c.recorte = ''; c.pintar();
  }, true);
  addEventListener('pointerup', () => { if (arrastre) { arrastre.c.guardar(); arrastre = null; renderVistas(); } }, true);
  addEventListener('wheel', e => {
    if (!activa() || e.target.closest('#panel')) return;
    const c = capaEn(e.clientX, e.clientY); if (!c) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const u = c.aImagen([e.clientX, e.clientY]), k = Math.exp(-e.deltaY * 0.0012);
    c.s *= k; c.t = [e.clientX - c.rect.x - c.s * u[0], e.clientY - c.rect.y - c.s * u[1]];   // agranda alrededor del mouse
    c.recorte = ''; c.pintar(); c.guardar();
  }, { capture: true, passive: false });
  // flechas: mover de a 1 píxel (con Mayús, de a 10) la capa bajo el mouse
  let mouse = [0, 0];
  addEventListener('mousemove', e => { mouse = [e.clientX, e.clientY]; });
  addEventListener('keydown', e => {
    if (!modo || !/^Arrow/.test(e.key)) return;
    const c = capaEn(...mouse); if (!c) return;
    const d = e.shiftKey ? 10 : 1, dx = { ArrowLeft: -d, ArrowRight: d }[e.key] || 0, dy = { ArrowUp: -d, ArrowDown: d }[e.key] || 0;
    c.t = [c.t[0] + dx, c.t[1] + dy]; c.pintar(); c.guardar(); e.preventDefault();
  });

  return {
    // encuadra un recorte de la hoja en una vista (si hay hoja y el recorte existe)
    recortar(id, nombre) {
      const c = capas[id];
      if (!c.url || !(RECORTES[nombreDe(c.url)] || {})[nombre]) return;
      c.recortar(nombre); c.pintar(); c.guardar(); renderVistas();
    },
    // dónde está cada vista en la pantalla (las que no se usan: null)
    ubicar(rects) {
      for (const v of vistas) {
        const c = capas[v.id], r = rects[v.id], antes = c.rect.h;
        c.rect = r || { x: 0, y: 0, w: 1, h: 1 };
        c.caja.style.visibility = r ? '' : 'hidden';
        if (r && antes > 1 && antes !== r.h) { const k = r.h / antes; c.s *= k; c.t = [c.t[0] * k, c.t[1] * k]; }
        c.pintar();
      }
      renderVistas();
    },
  };
}
