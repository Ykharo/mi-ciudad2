// Efecto "aura ascendente" sobre un personaje (al acertar el Código Aura): desde los pies sube una columna de luz que
// gira (dos capas: una ancha y suave, otra delgada y brillante, con la textura subiendo), en el suelo un anillo que se
// expande y destella, y chispas que suben en espiral alrededor del cuerpo. Crece, se sostiene y se apaga (~2,8 s).
// Todo con brillo aditivo y sin sombras (barato, también en el iPad).
//   const a = efectoAura(padre, { color: 'dorado' | 'celeste', alto: 3 })   // padre: el grupo del personaje (lo sigue)
//   a.update(dt) cada cuadro → false cuando terminó (y ya se sacó del padre)
import { THREE } from './three.js';

const COLORES = {
  // (colores saturados y oscuros: con brillo aditivo se aclaran solos; claros, quemaban al personaje en blanco)
  dorado: { a: 0xC98A10, b: 0xB0307A, c: [0xFFE27A, 0xFFC02E, 0xFF8FD0, 0xFFF6D0] },
  celeste: { a: 0x1E8FC0, b: 0x6A3FD0, c: [0xB8F0FF, 0x5FD8FF, 0xB79BFF, 0xEAFBFF] },
};
const DUR = 2.8;

// textura de la columna: brillante abajo y transparente arriba, con vetas verticales que al subir parecen energía
let texCol = null, texChispa = null, texAnillo = null;
function texturas() {
  if (texCol) return;
  let c = document.createElement('canvas'); c.width = 128; c.height = 256; let x = c.getContext('2d');
  const g = x.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 256);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(0,0,0,${0.25 + Math.random() * 0.5})`; x.fillRect(Math.random() * 128, Math.random() * 256, 2 + Math.random() * 7, 30 + Math.random() * 90); }
  texCol = new THREE.CanvasTexture(c); texCol.wrapS = texCol.wrapT = THREE.RepeatWrapping;
  c = document.createElement('canvas'); c.width = c.height = 64; x = c.getContext('2d');
  let r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = r; x.fillRect(0, 0, 64, 64);
  texChispa = new THREE.CanvasTexture(c);
  c = document.createElement('canvas'); c.width = c.height = 128; x = c.getContext('2d');
  r = x.createRadialGradient(64, 64, 30, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.7, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = r; x.fillRect(0, 0, 128, 128);
  texAnillo = new THREE.CanvasTexture(c);
}

// El letrero del jurado cuando alguien logra un Aura: una estrella dorada gruesa (5 puntas) con una "A" grande al
// centro por los dos lados y un halo que brilla detrás. Mide ~0,8 m de punta a punta. El grupo mira hacia +z.
export function estrellaAura() {
  texturas();
  const g = new THREE.Group(), forma = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.4;
    i ? forma.lineTo(Math.cos(a) * r, Math.sin(a) * r) : forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2 });
  geo.translate(0, 0, -0.025);
  const oro = new THREE.MeshStandardMaterial({ color: 0xFFC83D, metalness: 0.6, roughness: 0.28, emissive: 0x8A5A00, emissiveIntensity: 0.55 });
  g.add(new THREE.Mesh(geo, oro));
  // la "A" (y su sombra violeta), por delante y por detrás
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.font = '800 200px "Baloo 2", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round'; x.lineWidth = 22; x.strokeStyle = '#FFFFFF'; x.strokeText('A', 128, 146);
  x.fillStyle = '#7A3FE0'; x.fillText('A', 128, 146);
  const tex = new THREE.CanvasTexture(c), letra = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  for (const s of [1, -1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), letra); m.position.z = s * 0.054; m.rotation.y = s > 0 ? 0 : Math.PI; g.add(m); }
  // el halo
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: texChispa, color: 0xFFD66B, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.z = -0.06; g.add(halo); g.userData.halo = halo;
  g.traverse(o => { o.castShadow = false; o.receiveShadow = false; });
  return g;
}

export function efectoAura(padre, { color = 'dorado', alto = 3 } = {}) {
  texturas();
  const C = COLORES[color] || COLORES.dorado, g = new THREE.Group(); padre.add(g);
  const aditivo = (o = {}) => ({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...o });
  // la columna: dos cilindros abiertos (la textura se repite y sube); cada uno con su propia textura para moverla
  const capa = (radio, col, op) => {
    const t = texCol.clone(); t.needsUpdate = true; t.repeat.set(2, 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radio * 0.75, radio, alto, 28, 1, true), new THREE.MeshBasicMaterial(aditivo({ map: t, color: col, opacity: 0 })));
    m.position.y = alto / 2; m.userData.op = op; g.add(m); return m;
  };
  // (la de afuera rodea al personaje; la de adentro es un hilo de luz detrás de él, sin cubrirlo)
  const capas = [capa(0.95, C.a, 0.5), capa(0.6, C.b, 0.35)];
  // el anillo del suelo
  const anillo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial(aditivo({ map: texAnillo, color: C.a, opacity: 0 })));
  anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.03; g.add(anillo);
  // chispas en espiral: cada una con su ángulo, radio, velocidad y color
  const N = 90, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), ch = [], tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    ch.push({ a: Math.random() * Math.PI * 2, r: 0.35 + Math.random() * 0.55, y: Math.random() * alto * 0.3, v: 0.9 + Math.random() * 1.6, giro: 1.5 + Math.random() * 2 });
    tmp.setHex(C.c[i % C.c.length]).multiplyScalar(0.8); col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const matCh = new THREE.PointsMaterial({ size: 0.13, map: texChispa, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const puntos = new THREE.Points(geo, matCh); puntos.frustumCulled = false; g.add(puntos);
  g.traverse(o => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = 6; });

  let t = 0;
  return {
    update(dt) {
      if (!g.parent) return false;
      t += dt;
      const entra = Math.min(1, t / 0.4), sale = t > DUR - 0.7 ? Math.min(1, (t - (DUR - 0.7)) / 0.7) : 0, k = entra * (1 - sale);
      // la columna sube (crece desde el suelo) y gira; su textura sube
      capas.forEach((m, i) => {
        m.material.opacity = m.userData.op * k * (0.85 + 0.15 * Math.sin(t * 9 + i));
        m.scale.set(1 + 0.08 * Math.sin(t * 4 + i), Math.max(0.01, entra), 1 + 0.08 * Math.sin(t * 4 + i));
        m.position.y = alto / 2 * Math.max(0.01, entra);
        m.rotation.y += dt * (i ? -1.6 : 1.1);
        m.material.map.offset.y -= dt * (i ? 1.1 : 0.7);
      });
      // el anillo se expande con un destello al empezar
      const u = Math.min(1, t / 0.7);
      anillo.scale.setScalar(0.4 + 2.6 * (1 - Math.pow(1 - u, 3)));
      anillo.material.opacity = (1 - u) * 0.9 + 0.3 * k;
      // las chispas suben girando y se abren un poco
      ch.forEach((c, i) => {
        c.y += dt * c.v; c.a += dt * c.giro;
        if (c.y > alto && sale === 0) { c.y = 0; c.r = 0.35 + Math.random() * 0.55; }
        const r = c.r * (1 + c.y / alto * 0.6);
        pos.set([Math.cos(c.a) * r, c.y, Math.sin(c.a) * r], i * 3);
      });
      geo.attributes.position.needsUpdate = true;
      matCh.opacity = k;
      if (t >= DUR) { padre.remove(g); capas.forEach(m => { m.geometry.dispose(); m.material.map.dispose(); m.material.dispose(); }); geo.dispose(); matCh.dispose(); anillo.material.dispose(); anillo.geometry.dispose(); return false; }
      return true;
    },
  };
}
