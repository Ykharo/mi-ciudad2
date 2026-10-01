// (Adentro de un lugar con senderos —el parque, la plaza: world/senderos.js— caminan por ellos: entran por la entrada
// más cercana. Además, a veces sólo lo cruzan de paseo: `pasear`.)
// Los vecinos usan los juegos y las bancas: al llegar a una esquina, a veces (PROB) eligen uno libre que quede cerca
// (a menos de LEJOS metros), caminan hasta él, lo usan un rato y vuelven a la vereda. El sube y baja es de a dos: quien
// lo elige invita al vecino libre más cercano. Los juegos salen de las zonas que ponen los lugares (world/zones.js):
// las bancas ('bench') y los juegos ('juego', salvo los `privado`); se usan como los usa la jugadora (game/juegos.js):
// sentados en el carrusel y el sube y baja, columpiándose (se impulsan solos), saltando en la cama elástica, y subiendo
// y tirándose por el tobogán. Nadie se sienta encima de otro: el ancla (o la banca) queda reservada desde que lo elige.
import { lerpAngle, pick } from '../core/math.js';
import { collide } from '../world/physics.js';
import { LINES, WALK } from '../world/layout.js';
import { camino, cercano, ruta, todasLasRedes } from '../world/senderos.js';
import { zones } from '../world/zones.js';
import { avatarDo, avatarStop } from '../characters/animator.js';
import { npcs, onEsquina } from './npcs.js';
import { ALTURA, BOTE, anclaLibre, liberar, mirada, ocupar, pararEnAncla, secuenciaTobogan, sentarEnAncla } from './juegos.js';

const PROB = 0.3, LEJOS = 26;
const DURA = { banca: [10, 20], asiento: [10, 18], columpio: [14, 22], cama: [6, 10] };
const azar = ([a, b]) => a + Math.random() * (b - a);
const lista = J => (Array.isArray(J.asientos) ? J.asientos : Object.values(J.asientos).flat());

// los juegos y bancas que hay (se arman la primera vez: las zonas ya están puestas)
let usos = null;
function todos() {
  if (usos) return usos;
  usos = [];
  for (const z of zones) {
    if (z.id === 'bench') usos.push({ tipo: 'banca', zona: z, libre: () => !z.bench.quien });
    else if (z.id === 'juego' && !z.juego.privado) {
      const J = z.juego;
      if (J.tipo === 'asiento' || J.tipo === 'columpio') usos.push({ tipo: J.tipo, zona: z, juego: J, libre: () => !!anclaLibre(lista(J), z.x, z.z) });
      else usos.push({ tipo: J.tipo, zona: z, juego: J, libre: () => !J.ocupado && !J.reservado });
    }
  }
  return usos;
}
const libre = n => !n.uso && !(n.greet > 0);

// reservar el lugar (al decidir) y soltarlo (al terminar o si no llega)
function reservar(u, n) {
  if (u.tipo === 'banca') { u.zona.bench.quien = n; return {}; }
  if (u.tipo === 'asiento' || u.tipo === 'columpio') { const a = anclaLibre(lista(u.juego), u.zona.x, u.zona.z); a.userData.quien = n; return { ancla: a }; }
  u.juego.reservado = n; return {};
}
function soltarReserva(u, r) {
  if (u.tipo === 'banca') u.zona.bench.quien = null;
  else if (r.ancla) r.ancla.userData.quien = null;
  else u.juego.reservado = null;
}

// Caminar por una ruta (lista de puntos [x, z], world/senderos.js): de punto en punto, rodeando lo que haya
// (collide). Si se atasca 2,5 s sin acercarse al punto, salta al siguiente (o, en el último, se da por llegado si está
// cerca: `cerca`; si no, 'atascado'). `caminar(dt)` → 'anda', 'llego' o 'atascado'.
function recorrido(n, puntos, cerca = 0.3) {
  let i = 0, mejor = Infinity, quieto = 0;
  return function caminar(dt) {
    const [x, z] = puntos[i], ultimo = i === puntos.length - 1, d = Math.hypot(x - n.pos.x, z - n.pos.z);
    if (d < (ultimo ? cerca : 0.6)) { if (ultimo) return 'llego'; i++; mejor = Infinity; quieto = 0; return 'anda'; }
    const st = Math.min(d, n.speed * dt);
    n.pos.x += (x - n.pos.x) / d * st; n.pos.z += (z - n.pos.z) / d * st; collide(n.pos, 0.4);
    n.facing = lerpAngle(n.facing, Math.atan2(x - n.pos.x, z - n.pos.z), 1 - Math.exp(-dt * 10));
    if (d < mejor - 0.05) { mejor = d; quieto = 0; } else if ((quieto += dt) > 2.5) {
      if (!ultimo) { i++; mejor = Infinity; quieto = 0; return 'anda'; }
      return d < cerca + 2.5 ? 'llego' : 'atascado';
    }
    return 'anda';
  };
}
const rutaA = (n, x, z) => ruta(n.pos.x, n.pos.z, x, z);

// Mandar a un vecino a un juego: camina hasta la zona (por los senderos, si el juego está en un lugar con senderos),
// lo usa y vuelve a su esquina (n.target), también por los senderos
function mandar(n, u) {
  const r = reservar(u, n), Z = u.zona, vuelta = n.target.clone();
  let fase = 'ir', t = 0, dur = 0, uso = null, caminar = recorrido(n, rutaA(n, Z.x, Z.z), Math.max(0.6, Z.r * 0.7));
  const volver = () => { fase = 'volver'; caminar = recorrido(n, rutaA(n, vuelta.x, vuelta.z), 0.2); };
  n.uso = {
    tipo: u.tipo, juego: u.juego, ancla: r.ancla, get fase() { return fase; },
    update(dt) {
      if (fase === 'ir') {
        const e = caminar(dt);
        if (e === 'atascado') { soltarReserva(u, r); volver(); return { anda: n.speed }; }
        if (e === 'llego') { uso = empezar(n, u, r); dur = uso.dur; t = 0; fase = 'usar'; }
        else return { anda: n.speed };
      }
      if (fase === 'usar') {
        t += dt;
        const s = uso.mover(dt, t, dur);
        if (s === 'fin' || (dur && t >= dur)) { uso.terminar(); volver(); return {}; }
        return { raiz: true, sentado: true, cara: 'feliz' };
      }
      // volver a la vereda
      if (caminar(dt) !== 'anda') { n.pos.x = vuelta.x; n.pos.z = vuelta.z; n.uso = null; n.wait = 0.4; }
      return { anda: n.speed };
    },
  };
}

// Un paseo: entra a un lugar con senderos por una entrada, lo cruza (a veces se detiene un rato a mirar a mitad de
// camino) y sale por otra; después sigue por la vereda hacia la esquina más cercana.
const ESQUINAS = [];
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) ESQUINAS.push({ i, j, sx, sz, x: LINES[i] + sx * WALK, z: LINES[j] + sz * WALK });
function pasear(n, red, a, b) {
  const ids = camino(red, a, b), puntos = [[n.pos.x, n.pos.z], ...ids.map(id => red.nodos[id])];
  // dónde se detiene a mirar (un punto adentro: no la entrada ni la salida), si se detiene
  const alto = puntos.length >= 4 && Math.random() < 0.6 ? 2 + Math.floor(Math.random() * (puntos.length - 3)) : -1;
  let i = 0, espera = 0, caminar = recorrido(n, puntos.slice(1, alto > 0 ? alto + 1 : undefined), 0.4);
  n.uso = {
    tipo: 'paseo', get fase() { return espera > 0 ? 'mirar' : 'pasear'; },
    update(dt) {
      if (espera > 0) { espera -= dt; return { cara: 'feliz' }; }
      const e = caminar(dt);
      if (e === 'anda') return { anda: n.speed };
      if (alto > 0 && i === 0) { i = 1; espera = 2 + Math.random() * 3; caminar = recorrido(n, puntos.slice(alto + 1), 0.4); return {}; }
      // salió: sigue por la vereda hacia la esquina más cercana
      let c = ESQUINAS[0], d0 = Infinity;
      for (const q of ESQUINAS) { const d = Math.hypot(q.x - n.pos.x, q.z - n.pos.z); if (d > 1 && d < d0) { d0 = d; c = q; } }
      Object.assign(n, { i: c.i, j: c.j, sx: c.sx, sz: c.sz }); n.target.set(c.x, 0, c.z);
      n.uso = null;
      return { anda: n.speed };
    },
  };
}
// ¿hay una entrada de un lugar con senderos a menos de 20 m (en la vereda)? va hacia ella y cruza hasta otra
function quierePasear(n) {
  for (const red of todasLasRedes()) {
    const a = cercano(red, n.pos.x, n.pos.z, red.entradas), [x, z] = red.nodos[a];
    if (Math.hypot(x - n.pos.x, z - n.pos.z) > 20 || red.entradas.length < 2) continue;
    const b = pick(red.entradas.filter(e => e !== a));
    pasear(n, red, a, b);
    return true;
  }
  return false;
}

// usarlo: cada tipo pone al vecino en su lugar cada cuadro; `terminar` lo baja junto al juego
function empezar(n, u, r) {
  const ch = n.ch, J = u.juego, A = r.ancla;
  const bajarJunto = (x, z, f) => { n.pos.set(x, 0, z); collide(n.pos, 0.45); n.facing = f; avatarStop(ch); };
  if (u.tipo === 'banca') {
    const b = u.zona.bench, k = ch.k, fx = Math.sin(b.ry), fz = Math.cos(b.ry);
    avatarDo(ch, 'sit', { start: 0.95, ts: 1.2 });
    return {
      dur: azar(DURA.banca),
      mover() { ch.root.position.set(b.x + fx * (0.05 + 0.10 * k), 0.72 - 0.158 * k, b.z + fz * (0.05 + 0.10 * k)); ch.root.rotation.set(0, b.ry, 0); n.pos.set(b.x + fx * 1.1, 0, b.z + fz * 1.1); },
      terminar() { b.quien = null; bajarJunto(b.x + fx * 1.1, b.z + fz * 1.1, b.ry); },
    };
  }
  if (u.tipo === 'asiento') {
    ocupar(J, A, n); avatarDo(ch, 'sit', { start: 0.95, ts: 1.2 });
    return {
      dur: azar(DURA.asiento),
      mover() { const p = sentarEnAncla(ch, A); n.pos.set(p.x, 0, p.z); },
      terminar() { liberar(J, A); const p = sentarEnAncla(ch, A); bajarJunto(p.x, p.z, mirada(A)); },
    };
  }
  if (u.tipo === 'columpio') {
    // se impulsa solo: hacia donde va el columpio (como la jugadora con la palanca); al final deja de impulsarse
    ocupar(J, A, n);
    const S = A.userData, dePie = Math.random() < 0.3, anim = dePie ? 'columpio_de_pie' : 'columpio';
    avatarDo(ch, anim, { hold: true, stopOnMove: false });
    S.ocupado = true;
    let pose = 0.5;
    return {
      dur: azar(DURA.columpio),
      mover(dt, t, dur) {
        const empuje = t < dur - 4 ? Math.sign(S.vel || 1) : 0;
        S.impulso = empuje;
        pose += (0.5 + 0.5 * empuje - pose) * Math.min(1, dt * 5);
        if (ch.sp && ch.sp.name === anim) { ch.sp.a.timeScale = 0; ch.sp.a.time = pose * ch.sp.a.getClip().duration; }
        const p = dePie ? pararEnAncla(ch, A) : sentarEnAncla(ch, A); n.pos.set(p.x, 0, p.z);
      },
      terminar() { S.impulso = 0; S.ocupado = false; liberar(J, A); const p = sentarEnAncla(ch, A); bajarJunto(p.x, p.z, mirada(A)); },
    };
  }
  if (u.tipo === 'cama') {
    J.reservado = null; ocupar(J, null, n);
    const c = J.centro.getWorldPosition(n.pos.clone()), f = n.facing;
    let bote = -1;
    return {
      dur: azar(DURA.cama),
      mover(dt, t) {
        const k = Math.floor(t / BOTE), fr = t / BOTE - k;
        if (k !== bote) { bote = k; avatarDo(ch, 'jump', { start: 0.36, ts: 0.75, stopOnMove: false }); }
        ch.root.position.set(c.x, c.y + 4 * ALTURA * fr * (1 - fr), c.z); ch.root.rotation.set(0, f, 0); n.pos.set(c.x, 0, c.z);
      },
      terminar() { liberar(J, null); bajarJunto(c.x + Math.sin(f) * 2.6, c.z + Math.cos(f) * 2.6, f); },
    };
  }
  // tobogán: sube, se tira (a veces de pie) y queda abajo
  J.reservado = null; ocupar(J, null, n);
  const seq = secuenciaTobogan(ch, J, Math.random() < 0.3);
  return {
    dur: 0,
    mover(dt) { const s = seq.mover(dt); n.pos.set(ch.root.position.x, 0, ch.root.position.z); return s === 'fin' ? 'fin' : null; },
    terminar() { liberar(J, null); const p = J.salida.getWorldPosition(n.pos.clone()); bajarJunto(p.x, p.z, mirada(J.salida)); },
  };
}

// el sube y baja es de a dos: si queda otro asiento libre, invita al vecino libre más cercano (a menos de 60 m)
function invitar(n, u) {
  if (!u.juego || !u.juego.pareja || !u.libre()) return;
  let otro = null, mejor = 60;
  for (const m of npcs) { if (m === n || !libre(m)) continue; const d = m.pos.distanceTo(n.pos); if (d < mejor) { mejor = d; otro = m; } }
  if (otro) mandar(otro, u);
}

// al llegar a una esquina: a veces cruza un parque o plaza por los senderos (PROB_PASEO), a veces se va a un juego
// cercano (PROB) (true si se fue)
const PROB_PASEO = 0.3;
onEsquina(n => {
  if (Math.random() < PROB_PASEO && quierePasear(n)) return true;
  if (Math.random() >= PROB) return false;
  const cerca = todos().filter(u => u.libre() && Math.hypot(u.zona.x - n.pos.x, u.zona.z - n.pos.z) < LEJOS);
  if (!cerca.length) return false;
  const u = pick(cerca);
  mandar(n, u); invitar(n, u);
  return true;
});

// (para las pruebas: mandar al vecino i al juego libre de ese tipo más cercano; y en qué está cada uno)
const vecinosJuegos = {
  mandar(i, tipo, pareja = false) {
    const n = npcs[i], cand = todos().filter(u => u.tipo === tipo && u.libre() && (!pareja || (u.juego && u.juego.pareja)));
    if (!n || !cand.length || n.uso) return false;
    cand.sort((a, b) => Math.hypot(a.zona.x - n.pos.x, a.zona.z - n.pos.z) - Math.hypot(b.zona.x - n.pos.x, b.zona.z - n.pos.z));
    mandar(n, cand[0]); invitar(n, cand[0]);
    return true;
  },
  estado: () => npcs.map(n => (n.uso ? { tipo: n.uso.tipo, fase: n.uso.fase, y: n.ch.root.position.y, x: n.pos.x, z: n.pos.z } : null)),
  // mandarlo a cruzar el lugar con senderos más cercano, de la entrada más cercana a otra
  pasear(i) { const n = npcs[i]; return !!n && !n.uso && quierePasear(n); },
};

export { vecinosJuegos };
