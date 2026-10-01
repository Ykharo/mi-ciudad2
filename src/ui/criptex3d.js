// El criptex del "Código Aura" (prototipo): tres anillos de cristal hexagonales en un eje horizontal, entre tapas
// doradas, flotando delante de la cámara (va colgado de ella: siempre en el tercio de abajo de la pantalla, aunque la
// cámara se mueva). Cada anillo tiene 6 caras con una figura; la de frente, dentro del marco dorado, es la elegida, y
// la de arriba y la de abajo se ven inclinadas (la anterior y la siguiente). Se gira deslizando el dedo hacia arriba o
// abajo (o tocando la parte de arriba o de abajo del anillo; con teclado ←→ y ↑↓), y encaja con un rebote. La gema
// rosada de abajo (o Enter) confirma.
//
// El "cristal" es simulado (barato, también en el iPad): cuerpo semitransparente con brillo propio que late, un halo
// aditivo, aristas luminosas, chispitas que suben y un reflejo que cruza el marco. Las figuras van opacas sobre una
// placa clara, para que siempre se vean nítidas.
//
//   const c = crearCriptex({ camera, dom, anillos, alConfirmar, alGirar })
//     anillos: 3 listas de 6 figuras { id, emoji?, img?, simbolo? } (img: la imagen propia, cuando exista; simbolo: una
//     runa para las caras que sobran)
//   c.update(dt, t)   cada cuadro        c.elegidos() → [id, id, id]        c.marcar([bien, bien, bien])
//   c.abrir(fin)      acierto: se abre y desaparece        c.quitar()        c.girar(anillo, pasos)   c.elegir(anillo)
import { THREE } from '../engine/three.js';
import { tube } from '../engine/geometry.js';

const PASO = Math.PI / 3;                       // 60°: una cara
const R = 0.13, L = 0.2, GAP = 0.035;           // radio (= lado de la cara), largo de cada anillo, separación
const AP = R * Math.cos(Math.PI / 6);           // apotema: distancia del eje a cada cara
const D = 1.15;                                 // distancia a la cámara
const ANCHO = 3 * L + 2 * GAP + 0.13;           // con las tapas
const COLOR = { arista: 0xEFE6FF, elegido: 0xFFF2A8, bien: 0x7CFFB2, mal: 0xFF7A8A };

// textura de una figura: la imagen propia si hay, si no el emoji (o la runa) dibujado en un canvas
const cacheTex = new Map();
function textura(f) {
  const clave = f.img || f.emoji || f.simbolo;
  if (cacheTex.has(clave)) return cacheTex.get(clave);
  let t;
  if (f.img) t = new THREE.TextureLoader().load(f.img);
  else {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
    if (f.simbolo) { x.font = '700 150px "Baloo 2", serif'; x.fillStyle = '#A98BFF'; x.fillText(f.simbolo, 128, 136); }
    else { x.font = '190px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.fillText(f.emoji, 128, 142); }
    t = new THREE.CanvasTexture(c);
  }
  t.anisotropy = 4; cacheTex.set(clave, t); return t;
}
function texturaChispa() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,240,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function texturaReflejo() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 4; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 4);
  return new THREE.CanvasTexture(c);
}
// "AURA" como un hechizo: letras luminosas con un degradado mágico y resplandor (se dibuja con brillo aditivo)
function texturaHechizo(texto) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 320; const x = c.getContext('2d');
  x.font = '800 220px "Baloo 2", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const g = x.createLinearGradient(0, 60, 0, 260);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#E9C8FF'); g.addColorStop(1, '#8FE8FF');
  // resplandor morado, borde morado oscuro (para que se lea también sobre la luz del aura) y las letras claras
  x.shadowColor = 'rgba(150,80,255,1)';
  for (const b of [60, 30]) { x.shadowBlur = b; x.fillStyle = 'rgba(120,60,230,.8)'; x.fillText(texto, 512, 175); }
  x.shadowBlur = 0; x.lineJoin = 'round'; x.lineWidth = 18; x.strokeStyle = 'rgba(70,30,150,.85)'; x.strokeText(texto, 512, 175);
  x.shadowColor = 'rgba(255,255,255,.9)'; x.shadowBlur = 14; x.fillStyle = g; x.fillText(texto, 512, 175);
  x.shadowBlur = 0; x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeText(texto, 512, 175);
  return new THREE.CanvasTexture(c);
}
// los puntos, como en los juegos 3D de Nintendo: número grueso amarillo-dorado, borde blanco y otro oscuro, sombra
function texturaPuntos(texto) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const x = c.getContext('2d');
  x.font = '800 190px "Baloo 2", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.fillStyle = 'rgba(40,20,90,.45)'; x.fillText(texto, 518, 168);                  // sombra
  x.lineWidth = 34; x.strokeStyle = '#3B1E8F'; x.strokeText(texto, 512, 156);       // borde oscuro
  x.lineWidth = 16; x.strokeStyle = '#FFFFFF'; x.strokeText(texto, 512, 156);       // borde blanco
  const g = x.createLinearGradient(0, 70, 0, 240);
  g.addColorStop(0, '#FFF7B0'); g.addColorStop(0.5, '#FFD23F'); g.addColorStop(1, '#FF9B2E');
  x.fillStyle = g; x.fillText(texto, 512, 156);
  return new THREE.CanvasTexture(c);
}
// un prisma hexagonal con el eje en x y una cara plana mirando hacia +z
function hexGeo(radio, largo) { const g = new THREE.CylinderGeometry(radio, radio, largo, 6, 1, false, Math.PI / 6); g.rotateZ(Math.PI / 2); return g; }

export function crearCriptex({ camera, dom, anillos, alConfirmar, alGirar }) {
  const raiz = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(cuerpo); camera.add(raiz);
  const cristal = new THREE.MeshStandardMaterial({ color: 0x9B7BFF, emissive: 0x5A2EFF, emissiveIntensity: 0.45, roughness: 0.1, metalness: 0.05, transparent: true, opacity: 0.55, depthWrite: false });
  const halo = new THREE.MeshBasicMaterial({ color: 0xA98BFF, transparent: true, opacity: 0.3, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false });
  // cada figura va sobre un medallón claro (opaco: siempre nítida), y alrededor se ve el cristal
  const placa = new THREE.MeshBasicMaterial({ color: 0xF6F1FF });
  const oro = new THREE.MeshStandardMaterial({ color: 0xFFD66B, metalness: 0.7, roughness: 0.3, emissive: 0x6B4A00, emissiveIntensity: 0.45 });
  const geoCuerpo = hexGeo(R, L), geoHalo = hexGeo(R * 1.07, L * 1.02);
  const geoPlaca = new THREE.CircleGeometry(R * 0.47, 32), geoFig = new THREE.PlaneGeometry(R * 0.74, R * 0.74);
  const vert = j => { const a = Math.PI / 6 + j * PASO; return [R * Math.sin(a), R * Math.cos(a)]; };

  // los tres anillos
  const A = anillos.map((figs, i) => {
    const g = new THREE.Group(); g.position.x = (i - 1) * (L + GAP); cuerpo.add(g);
    const caja = new THREE.Mesh(geoCuerpo, cristal); caja.renderOrder = 2; g.add(caja);
    const h = new THREE.Mesh(geoHalo, halo); h.renderOrder = 3; g.add(h);
    const arista = new THREE.MeshBasicMaterial({ color: COLOR.arista });
    for (let j = 0; j < 6; j++) {
      const [y, z] = vert(j), [y2, z2] = vert(j + 1);
      tube(g, [-L / 2, y, z], [L / 2, y, z], 0.0045, arista);
      for (const s of [-1, 1]) tube(g, [s * L / 2, y, z], [s * L / 2, y2, z2], 0.0045, arista);
    }
    // caras: la k mira hacia (0, sin a, cos a), a = k·60°; con el anillo girado en a, queda de frente
    figs.forEach((f, k) => {
      const a = k * PASO, n = new THREE.Vector3(0, Math.sin(a), Math.cos(a));
      const p = new THREE.Mesh(geoPlaca, placa); p.position.copy(n).multiplyScalar(AP + 0.002); p.rotation.x = -a; g.add(p);
      const im = new THREE.Mesh(geoFig, new THREE.MeshBasicMaterial({ map: textura(f), transparent: true, alphaTest: 0.4 }));
      im.position.copy(n).multiplyScalar(AP + 0.004); im.rotation.x = -a; g.add(im);
    });
    const inicio = 1 + Math.floor(Math.random() * 5);   // empieza en una cara cualquiera
    return { g, caja, figs, arista, rot: inicio * PASO, obj: inicio * PASO, vel: 0, bien: false, sacude: 0 };
  });
  // separadores y tapas doradas (no giran)
  for (const s of [-1, 1]) {
    const sep = new THREE.Mesh(hexGeo(R * 1.1, GAP * 0.8), oro); sep.position.x = s * (L + GAP) / 2; cuerpo.add(sep);
    const tapa = new THREE.Mesh(hexGeo(R * 1.18, 0.04), oro); tapa.position.x = s * (1.5 * L + GAP + 0.02); cuerpo.add(tapa);
    const punta = new THREE.Mesh(new THREE.ConeGeometry(R * 0.55, 0.06, 6), oro); punta.rotation.z = -s * Math.PI / 2;
    punta.position.x = s * (1.5 * L + GAP + 0.07); cuerpo.add(punta);
  }
  // el marco de la ventana (las caras de frente son las elegidas), que late
  const marcoM = new THREE.MeshBasicMaterial({ color: 0xFFF2B3 });
  const W = 3 * L + 2 * GAP + 0.03, H = R * 1.02, zM = AP + 0.012;
  [[0, H / 2, W, 0.008], [0, -H / 2, W, 0.008], [-W / 2, 0, 0.008, H], [W / 2, 0, 0.008, H]].forEach(([x, y, w, h]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.006), marcoM); b.position.set(x, y, zM); cuerpo.add(b);
  });
  // el reflejo que cruza el marco cada tanto
  const reflejo = new THREE.Mesh(new THREE.PlaneGeometry(0.07, H), new THREE.MeshBasicMaterial({ map: texturaReflejo(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  reflejo.position.z = zM + 0.002; reflejo.renderOrder = 4; reflejo.rotation.z = -0.35; cuerpo.add(reflejo);
  // chispitas que suben alrededor
  const N = 46, pos = new Float32Array(N * 3), chispa = [];
  for (let i = 0; i < N; i++) chispa.push({ x: (Math.random() - 0.5) * ANCHO, z: (Math.random() - 0.5) * 0.3, f: Math.random(), v: 0.5 + Math.random() });
  const geoCh = new THREE.BufferGeometry(); geoCh.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const matCh = new THREE.PointsMaterial({ size: 0.016, map: texturaChispa(), color: 0xE7DCFF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const puntos = new THREE.Points(geoCh, matCh); puntos.renderOrder = 5; puntos.frustumCulled = false; cuerpo.add(puntos);
  // la gema para confirmar
  const gemaM = new THREE.MeshStandardMaterial({ color: 0xFF8FD0, emissive: 0xFF3FA4, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.2, flatShading: true });
  const gema = new THREE.Group(); gema.position.set(0, -R - 0.085, 0.03); cuerpo.add(gema);
  const piedra = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), gemaM); piedra.scale.y = 1.25; gema.add(piedra);
  raiz.traverse(o => { o.castShadow = false; o.receiveShadow = false; });

  // ---- tocar y arrastrar ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const tocado = e => {
    const r = dom.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...A.map(a => a.caja), piedra], false)[0];
    if (!hit) return null;
    if (hit.object === piedra) return { gema: true };
    const i = A.findIndex(a => a.caja === hit.object), local = A[i].g.worldToLocal(hit.point.clone());
    return { i, arriba: local.y * Math.cos(A[i].rot) - local.z * Math.sin(A[i].rot) > 0 };   // (y del punto sin el giro)
  };
  const PX_PASO = () => Math.max(50, dom.clientHeight * 0.1);   // cuántos píxeles de arrastre son una cara
  let drag = null, sel = -1, vivo = true, abriendo = null, calma = 0;
  const abajo = e => {
    if (!vivo || abriendo) return;
    const h = tocado(e); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    if (h.gema) { pulsoGema = 1; if (alConfirmar) alConfirmar(); return; }
    if (A[h.i].bien) return;
    drag = { i: h.i, y0: e.clientY, rot0: A[h.i].rot, movio: false, arriba: h.arriba, ult: e.clientY, t: performance.now(), v: 0 };
    try { dom.setPointerCapture(e.pointerId); } catch (_) { }
  };
  const mover = e => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 6) drag.movio = true;
    if (drag.movio) {
      const a = A[drag.i]; a.rot = drag.rot0 + dy / PX_PASO() * PASO; a.obj = a.rot;
      const now = performance.now(); drag.v = (e.clientY - drag.ult) / Math.max(1, now - drag.t); drag.ult = e.clientY; drag.t = now;
    }
  };
  const arriba = () => {
    if (!drag) return;
    const a = A[drag.i];
    if (!drag.movio) girar(drag.i, drag.arriba ? 1 : -1);   // un toque: la cara de arriba (o la de abajo) pasa al frente
    else { const extra = Math.max(-2, Math.min(2, Math.round(drag.v * 2.5))); a.obj = (Math.round(a.rot / PASO) + extra) * PASO; avisar(drag.i); }
    drag = null;
  };
  dom.addEventListener('pointerdown', abajo, true);
  addEventListener('pointermove', mover); addEventListener('pointerup', arriba); addEventListener('pointercancel', arriba);
  const tecla = e => {
    if (!vivo || abriendo) return;
    if (e.key === 'ArrowLeft') sel = (sel <= 0 ? 3 : sel) - 1;
    else if (e.key === 'ArrowRight') sel = (sel + 1) % 3;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { if (sel < 0) sel = 0; girar(sel, e.key === 'ArrowUp' ? -1 : 1); }
    else if (e.key === 'Enter') { pulsoGema = 1; if (alConfirmar) alConfirmar(); }
    else return;
    e.preventDefault();
  };
  addEventListener('keydown', tecla);

  function girar(i, pasos) { const a = A[i]; if (a.bien || abriendo) return; a.obj = (Math.round(a.obj / PASO) + pasos) * PASO; avisar(i); }
  function avisar(i) { calma = 1.2; if (alGirar) alGirar(i); }
  const cara = a => ((Math.round(a.obj / PASO) % 6) + 6) % 6;

  // ---- cada cuadro ----
  let pulsoGema = 0;
  function update(dt, t) {
    // dónde va: abajo al centro, del tamaño que quepa (también en vertical)
    const tanV = Math.tan(camera.fov * Math.PI / 360), alto = D * tanV, ancho = alto * camera.aspect;
    // (en el tercio de abajo: que no tape a quien baila; los anillos, de al menos ~10 % del ancho para el dedo)
    const s = Math.min(0.85, (1.6 * ancho) / ANCHO, (0.62 * alto) / (R * 2 + 0.13));
    raiz.scale.setScalar(s);
    // flota: sube y baja y se mece; casi quieto mientras se gira un anillo
    calma = Math.max(0, calma - dt);
    const amp = drag || calma > 0 ? 0.25 : 1;
    raiz.position.set(0, -alto * 0.93 + (R + 0.125) * s + Math.sin(t * 1.1) * 0.012 * amp * s, -D);
    cuerpo.rotation.set(-0.08 + Math.sin(t * 0.8) * 0.02 * amp, Math.sin(t * 0.55) * 0.05 * amp, Math.sin(t * 0.7) * 0.02 * amp);
    // los anillos encajan con un resorte (un poco de rebote)
    for (const [i, a] of A.entries()) {
      if (!(drag && drag.i === i)) { a.vel += ((a.obj - a.rot) * 220 - a.vel * 17) * dt; a.rot += a.vel * dt; }
      a.g.rotation.x = a.rot;
      a.sacude = Math.max(0, a.sacude - dt);
      a.g.position.y = 0; a.g.position.z = 0;
      a.g.rotation.z = a.sacude > 0 ? Math.sin(t * 60) * 0.06 * a.sacude : 0;
      if (!a.bien && a.sacude <= 0) a.arista.color.setHex(i === sel ? COLOR.elegido : COLOR.arista);
    }
    cristal.emissiveIntensity = 0.32 + 0.1 * Math.sin(t * 2.2) + (abriendo ? abriendo.brillo : 0);
    marcoM.color.setHSL(0.13, 1, 0.78 + 0.08 * Math.sin(t * 3));
    const ciclo = (t % 4) / 4; reflejo.position.x = -W / 2 + ciclo * 1.6 * W; reflejo.visible = reflejo.position.x < W / 2;
    // chispitas
    const rapido = abriendo ? 3 : 1;
    chispa.forEach((c, i) => {
      c.f += dt * 0.25 * c.v * rapido; if (c.f > 1) { c.f -= 1; c.x = (Math.random() - 0.5) * ANCHO; }
      pos[i * 3] = c.x + Math.sin(t * 2 + i) * 0.01; pos[i * 3 + 1] = -R - 0.05 + c.f * (2 * R + 0.15); pos[i * 3 + 2] = c.z;
    });
    geoCh.attributes.position.needsUpdate = true;
    // la gema gira y late; al tocarla, salta
    pulsoGema = Math.max(0, pulsoGema - dt * 3);
    piedra.rotation.y = t * 1.4; piedra.scale.setScalar(1 + pulsoGema * 0.35); piedra.scale.y *= 1.25;
    gemaM.emissiveIntensity = 0.5 + 0.25 * Math.sin(t * 4);
    // abriéndose: los anillos dan una vuelta uno tras otro y el cristal brilla; aparece el hechizo "AURA" (crece y se
    // desvanece hacia arriba), después los puntos (saltan con rebote, se quedan un momento y se van), y recién ahí el
    // criptex se achica hasta desaparecer
    if (abriendo) {
      const T = abriendo.t += dt;
      A.forEach((a, i) => { const u = Math.min(1, Math.max(0, (T - i * 0.15) / 0.6)); a.g.rotation.x = a.rot + (u * u * (3 - 2 * u)) * Math.PI * 2; });
      abriendo.brillo = Math.min(1, T * 1.5);
      const { hechizo, puntos } = abriendo;
      // AURA: 0,5 → 2,0 s
      const h = (T - 0.5) / 1.5;
      hechizo.visible = h > 0 && h < 1;
      if (hechizo.visible) {
        const entra = Math.min(1, h / 0.25), sale = h > 0.6 ? (h - 0.6) / 0.4 : 0;
        hechizo.material.opacity = entra * (1 - sale);
        hechizo.scale.setScalar(0.55 + 0.45 * (1 - Math.pow(1 - entra, 3)) + sale * 0.35);
        hechizo.position.y = 0.42 + h * 0.08;
        hechizo.rotation.z = Math.sin(T * 3) * 0.03;
      }
      // +puntos: 1,7 → 3,3 s (rebote al entrar, como en los juegos de Nintendo)
      const p = (T - 1.7) / 1.6;
      puntos.visible = p > 0 && p < 1;
      if (puntos.visible) {
        const u = Math.min(1, p / 0.22), rebote = u < 1 ? 1 - Math.pow(1 - u, 2) * Math.cos(u * 9) * 1 : 1;
        const sale = p > 0.75 ? (p - 0.75) / 0.25 : 0;
        puntos.scale.setScalar(Math.max(0.01, rebote * (1 - sale * 0.7)));
        puntos.material.opacity = 1 - sale;
        puntos.position.y = 0.3 + p * 0.04 + sale * 0.08;
        puntos.rotation.z = Math.sin(p * Math.PI * 2) * 0.04;
      }
      // el criptex se va: 3,2 → 3,6 s
      if (T > 3.2) { const u = Math.min(1, (T - 3.2) / 0.4); cuerpo.scale.setScalar(Math.max(0.001, (1 - u) * (1 + 0.8 * u))); }
      if (T > 3.6) { const fin = abriendo.fin; abriendo = null; quitar(); if (fin) fin(); }
    }
  }

  // ---- resultado ----
  function marcar(res) {
    res.forEach((ok, i) => {
      const a = A[i];
      if (ok) { a.bien = true; a.arista.color.setHex(COLOR.bien); a.obj = Math.round(a.obj / PASO) * PASO; }
      else { a.sacude = 0.6; a.arista.color.setHex(COLOR.mal); }
    });
  }
  // acierto: `puntos` es el texto de los puntos (ej. '+1000 pts'); `fin` se llama cuando ya desapareció
  function abrir(fin, puntos = '+1000 pts') {
    A.forEach(a => { a.arista.color.setHex(COLOR.bien); a.rot = a.obj; });
    // los textos van en la raíz (no en el cuerpo, que se achica al final), arriba del criptex
    const texto = (tex, ancho, alto, aditivo) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0,
        blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending }));
      m.renderOrder = 10; m.visible = false; raiz.add(m); return m;
    };
    abriendo = { t: 0, brillo: 0, fin, hechizo: texto(texturaHechizo('AURA'), 0.95, 0.297, false), puntos: texto(texturaPuntos(puntos), 0.62, 0.182, false) };
  }
  function quitar() {
    if (!vivo) return; vivo = false;
    camera.remove(raiz);
    dom.removeEventListener('pointerdown', abajo, true);
    removeEventListener('pointermove', mover); removeEventListener('pointerup', arriba); removeEventListener('pointercancel', arriba);
    removeEventListener('keydown', tecla);
  }
  // dónde queda cada anillo en la pantalla (para alinear las palabras del código con ellos)
  const _v = new THREE.Vector3();
  function enPantalla() {
    raiz.updateMatrixWorld(true);
    return A.map(a => { a.g.getWorldPosition(_v); _v.project(camera); return (_v.x + 1) / 2; });
  }

  return {
    update, marcar, abrir, quitar, girar, enPantalla,
    elegir(i) { sel = i; },
    elegidos: () => A.map(a => a.figs[cara(a)].id),
    caras: () => A.map(cara),
    vivo: () => vivo,
  };
}
