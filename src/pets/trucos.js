// Las poses de los trucos de las mascotas (los enseña la Mascotienda; los pide game/trucos.js). Cada cuadro, después de
// animatePet (que la deja sentada o parada), `poseTruco(P, id, u, t)` mueve el cuerpo y las patas: `u` va de 0 a 1 a
// lo largo del truco. Todo entra y sale suave (k). Sirve para todas las especies: las patas de adelante son las que
// están más adelante (P.legs, posición z).
//   patita     sentada, levanta una pata de adelante y la mueve un poco
//   saludar    sentada, levanta la pata bien alto y la mueve de lado a lado
//   vuelta     da una vuelta entera en el aire
//   dos_patas  se para en las patas de atrás y mueve las de adelante
//   muerta     cae de lado con las patas tiesas… y revive de un salto
//   bailar     se mece, salta al ritmo y mueve la cabeza
export const TRUCOS = {
  patita: { dura: 2.6, sentada: true },
  saludar: { dura: 2.6, sentada: true },
  vuelta: { dura: 1.3, sentada: false },
  dos_patas: { dura: 2.8, sentada: false },
  muerta: { dura: 3.4, sentada: false },
  bailar: { dura: 4.5, sentada: false },
};
const suave = x => x * x * (3 - 2 * x);
const entraSale = (u, a = 0.15) => suave(Math.min(1, u / a, (1 - u) / a));
function patas(P) {
  const zm = P.legs.reduce((a, l) => a + l.position.z, 0) / P.legs.length;
  const delante = P.legs.filter(l => l.position.z >= zm - 1e-4), atras = P.legs.filter(l => l.position.z < zm - 1e-4);
  // la de adelante derecha (la mascota mira a +z: su derecha es −x)
  const una = delante.slice().sort((a, b) => a.position.x - b.position.x)[0];
  return { delante, atras, una };
}
// girar el cuerpo sobre el eje x alrededor de un punto del suelo (z0): las patas de atrás quedan donde estaban
function pararseSobre(P, ang, z0) {
  P.body.rotation.x += ang;
  P.body.position.y += z0 * Math.sin(ang);          // (el punto (0, z0) giraría a (−z0·sen a, z0·cos a): se compensa)
  P.body.position.z += z0 - z0 * Math.cos(ang);
}

export function poseTruco(P, id, u, t) {
  const k = entraSale(u), L = patas(P);
  if (id === 'patita' || id === 'saludar') {
    const l = L.una || P.legs[0]; if (!l) return;
    if (id === 'patita') { l.rotation.x = l.rotation.x * (1 - k) + (-1.45 + Math.sin(t * 5) * 0.12) * k; l.rotation.z = 0; }
    else { l.rotation.x = l.rotation.x * (1 - k) - 2.3 * k; l.rotation.z = Math.sin(t * 11) * 0.55 * k; }
  } else if (id === 'vuelta') {
    const v = suave(Math.min(1, Math.max(0, (u - 0.1) / 0.8)));
    P.root.rotation.y += v * Math.PI * 2;
    P.body.position.y += Math.sin(Math.PI * v) * 0.5;
    L.delante.forEach(l => { l.rotation.x -= Math.sin(Math.PI * v) * 0.6; });
    L.atras.forEach(l => { l.rotation.x += Math.sin(Math.PI * v) * 0.6; });
  } else if (id === 'dos_patas' || id === 'bailar') {
    const baila = id === 'bailar', z0 = L.atras.length ? Math.min(...L.atras.map(l => l.position.z)) : 0;
    const ang = -(baila ? 0.55 : P.kind === 'pinguino' ? 0.15 : 1.0) * k;
    pararseSobre(P, ang, z0);
    if (baila) {
      P.body.rotation.z += Math.sin(t * 7) * 0.22 * k; P.body.position.y += Math.abs(Math.sin(t * 7)) * 0.12 * k;
      if (P.head) P.head.rotation.z = Math.sin(t * 7 + 1) * 0.35 * k;
      P.root.rotation.y += Math.sin(t * 1.8) * 0.6 * k;
    } else P.body.position.y += Math.abs(Math.sin(t * 4)) * 0.03 * k;
    L.atras.forEach(l => { l.rotation.x = l.rotation.x * (1 - k) - ang; });   // derechas, sobre el suelo
    L.delante.forEach((l, i) => { l.rotation.x = l.rotation.x * (1 - k) + (-0.9 + Math.sin(t * (baila ? 7 : 9) + i * Math.PI) * 0.45) * k; });
  } else if (id === 'muerta') {
    // cae (0–15 %), se queda tiesa, y al final revive de un salto
    const cae = suave(Math.min(1, u / 0.12)) * (u > 0.82 ? 1 - suave(Math.min(1, (u - 0.82) / 0.1)) : 1);
    const a = cae * Math.PI / 2, M = P.medidas, hc = M.alto * 0.6;
    P.body.rotation.z += a;
    P.body.position.x += hc * Math.sin(a);
    P.body.position.y += (hc + (M.ancho * 0.45 - hc) * cae) - hc * Math.cos(a);
    P.legs.forEach((l, i) => { l.rotation.x = l.rotation.x * (1 - cae) + (u > 0.6 && u < 0.8 ? Math.sin(t * 30 + i) * 0.08 : 0) * cae; l.rotation.z = 0; });
    if (u > 0.9) P.body.position.y += Math.sin(Math.PI * (u - 0.9) / 0.1) * 0.35;   // ¡revive!
  }
}
