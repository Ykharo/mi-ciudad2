#!/usr/bin/env python3
"""
reanimar_avatar.py — Reemplaza las animaciones de un avatar .glb (esqueleto de 17 huesos:
Hips, Spine, Chest, Neck, HeadBone, UpperArm/Forearm/Hand L/R, Thigh/Shin/Foot L/R)
por animaciones nuevas hechas con keyframes + IK de piernas (los pies no patinan).

Animaciones: idle, walk, run, jump, wave, sit, lie, dance, split

Uso:
    python3 reanimar_avatar.py entrada.glb salida.glb
Requiere el módulo `mathutils` (viene con Blender; fuera de Blender: pip install mathutils).
También se puede ejecutar desde la pestaña Scripting de Blender (ajusta ENTRADA/SALIDA abajo).

Convenciones (espacio glTF): +Y arriba, el personaje mira hacia +Z.
Los huesos "L" están en -X y los "R" en +X.
"""
import json, struct, math, sys, os
import numpy as np
try:
    from mathutils import Vector, Quaternion
except ImportError:          # el módulo pip `bpy` trae mathutils, pero hay que importar bpy antes
    import bpy  # noqa: F401
    from mathutils import Vector, Quaternion

ENTRADA = sys.argv[1] if len(sys.argv) > 2 else "avatar_cuerpo_animado.glb"
SALIDA = sys.argv[2] if len(sys.argv) > 2 else "avatar_reanimado.glb"
FPS = 30

# =====================================================================  lectura / escritura glb
def load_glb(path):
    d = open(path, "rb").read()
    off, chunks = 12, []
    while off < len(d):
        ln, ty = struct.unpack("<II", d[off:off + 8])
        chunks.append(d[off + 8:off + 8 + ln]); off += 8 + ln
    return json.loads(chunks[0]), (chunks[1] if len(chunks) > 1 else b"")

def save_glb(path, j, b):
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    b += b"\0" * ((4 - len(b) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(b)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(b), 0x004E4942)); f.write(b)

def strip_animations(j, b):
    """Elimina las animaciones existentes y compacta el buffer (quita sus datos)."""
    j.pop("animations", None)
    used = set()
    for m in j.get("meshes", []):
        for p in m["primitives"]:
            used.update(p["attributes"].values())
            if "indices" in p: used.add(p["indices"])
            for t in p.get("targets", []): used.update(t.values())
    for s in j.get("skins", []):
        if "inverseBindMatrices" in s: used.add(s["inverseBindMatrices"])
    acc_map = {old: new for new, old in enumerate(sorted(used))}
    accessors = [j["accessors"][i] for i in sorted(used)]
    bv_used = sorted({a["bufferView"] for a in accessors if "bufferView" in a} |
                     {im["bufferView"] for im in j.get("images", []) if "bufferView" in im})
    bv_map, views, nb = {}, [], bytearray()
    for old in bv_used:
        v = dict(j["bufferViews"][old]); o = v.get("byteOffset", 0)
        while len(nb) % 4: nb += b"\0"
        chunk = b[o:o + v["byteLength"]]
        v["byteOffset"] = len(nb); nb += chunk
        bv_map[old] = len(views); views.append(v)
    for a in accessors:
        if "bufferView" in a: a["bufferView"] = bv_map[a["bufferView"]]
    for im in j.get("images", []):
        if "bufferView" in im: im["bufferView"] = bv_map[im["bufferView"]]
    for m in j.get("meshes", []):
        for p in m["primitives"]:
            p["attributes"] = {k: acc_map[v] for k, v in p["attributes"].items()}
            if "indices" in p: p["indices"] = acc_map[p["indices"]]
            p["targets"] = [{k: acc_map[v] for k, v in t.items()} for t in p.get("targets", [])] or None
            if p["targets"] is None: del p["targets"]
    for s in j.get("skins", []):
        if "inverseBindMatrices" in s: s["inverseBindMatrices"] = acc_map[s["inverseBindMatrices"]]
    j["accessors"], j["bufferViews"] = accessors, views
    j["buffers"] = [{"byteLength": len(nb)}]
    return j, nb

def add_accessor(j, nb, arr, typ):
    arr = np.ascontiguousarray(arr, dtype=np.float32)
    while len(nb) % 4: nb += b"\0"
    j["bufferViews"].append({"buffer": 0, "byteOffset": len(nb), "byteLength": arr.nbytes})
    nb += arr.tobytes()
    a = {"bufferView": len(j["bufferViews"]) - 1, "componentType": 5126,
         "count": int(arr.shape[0]), "type": typ}
    if typ == "SCALAR":
        a["min"], a["max"] = [float(arr.min())], [float(arr.max())]
    j["accessors"].append(a)
    j["buffers"][0]["byteLength"] = len(nb)
    return len(j["accessors"]) - 1

# =====================================================================  matemáticas
def Qx(d): return Quaternion((1, 0, 0), math.radians(d))
def Qy(d): return Quaternion((0, 1, 0), math.radians(d))
def Qz(d): return Quaternion((0, 0, 1), math.radians(d))
def E(x=0.0, y=0.0, z=0.0):
    """Rotación: primero z (abrir/cerrar lateral), luego x (adelante/atrás), luego y (giro)."""
    return Qy(y) @ Qx(x) @ Qz(z)
def smooth(u): u = min(max(u, 0.0), 1.0); return u * u * (3 - 2 * u)
def lerp(a, b, u): return a + (b - a) * u
TAU = 2 * math.pi

def K(keys, t):
    """Curva de keyframes con interpolación cúbica suave (sin rebotes en picos ni mesetas)."""
    if t <= keys[0][0]: return keys[0][1]
    if t >= keys[-1][0]: return keys[-1][1]
    i = max(k for k in range(len(keys) - 1) if keys[k][0] <= t)
    (t0, v0), (t1, v1) = keys[i], keys[i + 1]
    h = t1 - t0; u = (t - t0) / h
    def tan(k):
        if k <= 0 or k >= len(keys) - 1: return 0.0
        (ta, va), (tk, vk), (tb, vb) = keys[k - 1], keys[k], keys[k + 1]
        if (vk - va) * (vb - vk) <= 0: return 0.0
        return (vb - va) / (tb - ta)
    m0, m1 = tan(i) * h, tan(i + 1) * h
    u2, u3 = u * u, u * u * u
    return (2*u3 - 3*u2 + 1) * v0 + (u3 - 2*u2 + u) * m0 + (-2*u3 + 3*u2) * v1 + (u3 - u2) * m1

def hermite(p0, p1, m0, m1, u):
    u2, u3 = u * u, u * u * u
    return (2*u3 - 3*u2 + 1) * p0 + (u3 - 2*u2 + u) * m0 + (-2*u3 + 3*u2) * p1 + (u3 - u2) * m1

# =====================================================================  esqueleto
J, BIN = load_glb(ENTRADA)
NODE = {n.get("name"): i for i, n in enumerate(J["nodes"])}
SKIN = J["skins"][0]
BONES = [J["nodes"][i]["name"] for i in SKIN["joints"]]
PARENT = {b: None for b in BONES}
for b in BONES:
    for c in J["nodes"][NODE[b]].get("children", []):
        if J["nodes"][c]["name"] in PARENT: PARENT[J["nodes"][c]["name"]] = b
REST = {b: Vector(J["nodes"][NODE[b]].get("translation", [0, 0, 0])) for b in BONES}
ORDER = []
def _visit(b):
    ORDER.append(b)
    for c in BONES:
        if PARENT[c] == b: _visit(c)
_visit([b for b in BONES if PARENT[b] is None][0])

SX = {"L": -1 if REST["UpperArmL"].x < 0 else 1}
SX["R"] = -SX["L"]
H0 = REST["Hips"].y                                   # altura de cadera en reposo
FOOTX = abs(REST["ThighR"].x + REST["ShinR"].x + REST["FootR"].x)
ANK_H = H0 + REST["ShinR"].y + REST["FootR"].y       # altura del tobillo sobre el suelo
HEEL, BALL = -0.085, 0.10                             # talón y punta (pivotes) respecto del tobillo

# =====================================================================  pose + solver
class Pose:
    def __init__(self):
        self.hips = Vector((0, H0, 0))
        self.rot = {b: Quaternion() for b in BONES}
        self.leg = {}   # lado -> (tobillo_objetivo, rot_mundo_pie, polo)
        self.arm = {}   # lado -> (muñeca_objetivo | fn(P), rot_mundo_mano | None, polo, peso)
        self.leg_w = {} # lado -> peso de la IK de pierna (0 = usar las rotaciones FK de p.rot)

def ik2(parent_w, root, r1, r2, target, pole):
    """IK de dos huesos analítica. Devuelve rotaciones locales y de mundo."""
    L1, L2 = r1.length, r2.length
    dv = target - root
    d = max(min(dv.length, (L1 + L2) * 0.9995), abs(L1 - L2) + 1e-4)
    n = dv.normalized()
    a = (L1 * L1 - L2 * L2 + d * d) / (2 * d)
    h = math.sqrt(max(L1 * L1 - a * a, 0.0))
    pp = pole - n * pole.dot(n)
    if pp.length < 1e-6: pp = Vector((0, 0, 1)) - n * n.z
    pp.normalize()
    knee = root + n * a + pp * h
    end = root + n * d
    w1 = (parent_w @ r1).rotation_difference(knee - root) @ parent_w
    w2 = (w1 @ r2).rotation_difference(end - knee) @ w1
    return parent_w.inverted() @ w1, w1.inverted() @ w2, w2

def solve(p):
    P, W = {}, {}
    def fk(b):
        par = PARENT[b]
        if par is None:
            P[b], W[b] = p.hips.copy(), p.rot[b].copy()
        else:
            P[b] = P[par] + W[par] @ REST[b]
            W[b] = W[par] @ p.rot[b]
    for b in ("Hips", "Spine", "Chest", "Neck", "HeadBone"): fk(b)
    for sd in ("L", "R"):
        th, sh, ft = "Thigh" + sd, "Shin" + sd, "Foot" + sd
        if sd in p.leg:
            tgt, frot, pole = p.leg[sd]
            root = P["Hips"] + W["Hips"] @ REST[th]
            l1, l2, w2 = ik2(W["Hips"], root, REST[sh], REST[ft], tgt, pole)
            wl = p.leg_w.get(sd, 1.0)
            fk_th, fk_sh, fk_ft = p.rot[th].copy(), p.rot[sh].copy(), p.rot[ft].copy()
            p.rot[th], p.rot[sh] = fk_th.slerp(l1, wl), fk_sh.slerp(l2, wl)
            p.rot[ft] = fk_ft.slerp(w2.inverted() @ frot, wl)
        for b in (th, sh, ft): fk(b)
    for sd in ("L", "R"):
        ua, fa, hd = "UpperArm" + sd, "Forearm" + sd, "Hand" + sd
        if sd in p.arm:
            tgt, hrot, pole, wgt = p.arm[sd]
            if callable(tgt): tgt = tgt(P, W)
            root = P["Chest"] + W["Chest"] @ REST[ua]
            l1, l2, w2 = ik2(W["Chest"], root, REST[fa], REST[hd], tgt, pole)
            p.rot[ua] = p.rot[ua].slerp(l1, wgt)
            p.rot[fa] = p.rot[fa].slerp(l2, wgt)
            if hrot is not None:
                hand_ik = w2.inverted() @ hrot
                p.rot[hd] = p.rot[hd].slerp(hand_ik, wgt)
        for b in (ua, fa, hd): fk(b)
    return P, W

# =====================================================================  helpers de pose
def foot(x, z, pitch=0.0, yaw=0.0, lift=0.0, roll=0.0, ank_h=None):
    """Pie apoyado en el suelo en (x, z). pitch>0: talón arriba (pivota en la punta);
    pitch<0: punta arriba (pivota en el talón). Devuelve (tobillo, rotación de mundo)."""
    R = Qy(yaw) @ Qz(roll) @ Qx(pitch)
    base = Vector((x, 0, z))
    ah = ANK_H if ank_h is None else ank_h
    if pitch >= 0:
        piv, rel = base + Qy(yaw) @ Vector((0, 0, BALL)), Vector((0, ah, -BALL))
    else:
        piv, rel = base + Qy(yaw) @ Vector((0, 0, HEEL)), Vector((0, ah, -HEEL))
    return piv + R @ rel + Vector((0, lift, 0)), R

def knee_pole(p, sd, out=0.2):
    return p.rot["Hips"] @ Vector((SX[sd] * out, 0, 1))

def set_foot(p, sd, x, z, pitch=0.0, yaw=0.0, lift=0.0, roll=0.0, ank_h=None, pole=None):
    ank, R = foot(x, z, pitch, yaw, lift, roll, ank_h)
    p.leg[sd] = (ank, R, pole if pole is not None else knee_pole(p, sd))

def arm(p, sd, lower=13.0, swing=0.0, elbow=10.0, hand=0.0, twist=0.0, fore_z=0.0, hand_z=0.0):
    """Brazo por FK. lower: cuánto se baja desde la pose A (negativo = levantar lateral);
    swing>0: hacia adelante; elbow>0: dobla el codo hacia adelante."""
    s = SX[sd]
    p.rot["UpperArm" + sd] = E(x=-swing, y=s * twist, z=-s * lower)
    p.rot["Forearm" + sd] = E(x=-elbow, z=s * fore_z)
    p.rot["Hand" + sd] = E(x=-hand, z=s * hand_z)

def feet_rest(p, spread=0.012, yaw=7.0):
    for sd in ("L", "R"):
        s = SX[sd]
        set_foot(p, sd, s * (FOOTX + spread), 0.0, yaw=s * yaw)

# =====================================================================  ANIMACIONES
def idle(t, T):
    p = Pose()
    w = math.sin(TAU * t / T)            # traspaso de peso (+ hacia R)
    b = math.sin(TAU * t / (T / 2))      # respiración
    p.hips = Vector((SX["R"] * 0.012 * w, H0 - 0.012 + 0.0025 * b, 0.0))
    p.rot["Hips"] = E(z=SX["R"] * 1.8 * w)
    p.rot["Spine"] = E(x=1.0, z=-SX["R"] * 1.3 * w)
    p.rot["Chest"] = E(x=-1.3 * b, z=-SX["R"] * 0.8 * w)
    yaw = K([(0, 0), (1.2, 0), (1.7, 16), (3.0, 16), (3.5, -7), (4.9, -7), (5.4, 0), (T, 0)], t)
    nod = K([(0, 0), (1.2, 0), (1.7, -3), (3.0, -3), (3.5, 4), (4.9, 3), (5.4, 0), (T, 0)], t)
    p.rot["Neck"] = E(x=0.4 * nod, y=0.35 * yaw)
    p.rot["HeadBone"] = E(x=0.6 * nod + 0.8 * b, y=0.65 * yaw, z=-SX["R"] * 1.5 * w)
    for sd in ("L", "R"):
        s = SX[sd]
        arm(p, sd, lower=13 - 1.3 * b, swing=3 + 1.5 * math.sin(TAU * t / T - 0.7) * s * SX["R"],
            elbow=13 + 1.0 * b, hand=6)
    feet_rest(p)
    return p

def gait(t, T, S, ST, lift_h, run=False):
    """Ciclo de marcha en el lugar. q=0: contacto de talón del pie L."""
    p = Pose()
    q = (t / T) % 1.0
    # --- cadera
    if run:
        dy = -0.022 - 0.018 * math.cos(TAU * 2 * (q - 0.18))
        lean = 9.0
    else:
        dy = -0.010 - 0.005 * math.cos(TAU * 2 * q)
        lean = 2.5
    # q=0: pie L adelante -> la cadera del lado L también va adelante (giro en Y)
    yaw_h = (7.0 if run else 5.0) * math.cos(TAU * q) * -SX["L"]
    # el peso se carga sobre el pie de apoyo (L en q≈0.25, R en q≈0.75)
    side = (0.006 if run else 0.012) * math.sin(TAU * q) * SX["L"]
    p.hips = Vector((side, H0 + dy, 0.0))
    p.rot["Hips"] = E(x=lean * 0.5, y=yaw_h)
    p.rot["Spine"] = E(x=lean * 0.5, y=-yaw_h * 0.8)
    p.rot["Chest"] = E(x=(-1.5 if not run else 2.0), y=-yaw_h * 0.7)
    p.rot["Neck"] = E(x=-lean * 0.35, y=yaw_h * 0.3)
    p.rot["HeadBone"] = E(x=-lean * 0.35 + 1.5 * math.cos(TAU * 2 * q), y=yaw_h * 0.3)
    # --- piernas
    for sd, ph in (("L", 0.0), ("R", 0.5)):
        s = SX[sd]
        qq = (q + ph) % 1.0
        if qq < ST:
            u = qq / ST
            z = S - 2 * S * u
            if run:
                pitch = K([(0, -6), (0.15, 0), (0.55, 0), (1.0, 34)], u)
            else:
                pitch = K([(0, -18), (0.13, 0), (0.62, 0), (1.0, 30)], u)
            lift = 0.0
        else:
            u = (qq - ST) / (1 - ST)
            m = -2 * S * (1 - ST) / ST
            z = hermite(-S, S, m, m, u)
            if run:
                lift = lift_h * math.sin(math.pi * u) ** 0.8
                z -= 0.06 * math.sin(math.pi * min(u * 1.6, 1.0))    # talón hacia el glúteo
                pitch = K([(0, 34), (0.4, 25), (0.85, 0), (1, -6)], u)
            else:
                lift = lift_h * math.sin(math.pi * u) * (1.15 - 0.3 * u)
                pitch = K([(0, 30), (0.3, 12), (0.75, -12), (1, -18)], u)
        set_foot(p, sd, s * (FOOTX + 0.004), z, pitch=pitch, yaw=s * 5, lift=lift,
                 pole=knee_pole(p, sd, 0.1))
    # --- brazos (opuestos a las piernas, con retardo)
    for sd, ph in (("L", 0.0), ("R", 0.5)):
        c = math.cos(TAU * (q + ph - 0.07))
        if run:
            arm(p, sd, lower=6, swing=-38 * c + 8, elbow=82 + 14 * max(0.0, -c), hand=10)
        else:
            fwd = max(0.0, -c)
            arm(p, sd, lower=11, swing=-20 * c, elbow=12 + 14 * fwd, hand=6 + 5 * fwd)
    return p

def walk(t, T): return gait(t, T, S=0.15, ST=0.60, lift_h=0.07)
def run(t, T):  return gait(t, T, S=0.21, ST=0.36, lift_h=0.16, run=True)

def jump(t, T):
    p = Pose()
    dy = K([(0, 0), (0.10, 0.006), (0.34, -0.15), (0.44, 0.015), (0.66, 0.29), (0.88, 0.02),
            (1.00, -0.14), (1.27, -0.02), (T, 0)], t)
    hp = K([(0, 0), (0.34, 17), (0.44, -3), (0.66, -4), (0.88, 6), (1.00, 17), (1.27, 3), (T, 0)], t)
    sp = K([(0, 0), (0.34, 13), (0.44, -7), (0.66, -4), (0.88, 6), (1.00, 13), (1.27, 2), (T, 0)], t)
    lift = K([(0, 0), (0.42, 0), (0.50, 0.12), (0.66, 0.34), (0.82, 0.14), (0.88, 0)], t)
    zb = K([(0, 0), (0.46, 0), (0.66, -0.05), (0.84, 0.01), (0.90, 0)], t)
    pitch = K([(0, 0), (0.30, 0), (0.42, 30), (0.52, 38), (0.66, 18), (0.82, 14), (0.88, 10),
               (0.95, 0), (T, 0)], t)
    swing = K([(0, 0), (0.12, -6), (0.34, 50), (0.46, -125), (0.66, -150), (0.88, -70),
               (1.00, -22), (1.27, -6), (T, 0)], t)
    out = K([(0, 0), (0.46, 10), (0.66, 24), (0.88, 12), (1.2, 2), (T, 0)], t)
    elbow = K([(0, 12), (0.34, 22), (0.46, 8), (0.66, 14), (1.00, 38), (1.27, 16), (T, 12)], t)
    p.hips = Vector((0, H0 + dy, -0.03 * smooth(hp / 17)))
    p.rot["Hips"] = E(x=hp)
    p.rot["Spine"] = E(x=sp * 0.6)
    p.rot["Chest"] = E(x=sp * 0.4)
    p.rot["Neck"] = E(x=-(hp + sp) * 0.3)
    p.rot["HeadBone"] = E(x=-(hp + sp) * 0.35 - K([(0, 0), (0.46, 0), (0.66, -8), (0.88, 0)], t))
    for sd in ("L", "R"):
        s = SX[sd]
        arm(p, sd, lower=13 - out, swing=-swing, elbow=elbow, hand=8)
        set_foot(p, sd, s * (FOOTX + 0.012), zb, pitch=pitch, yaw=s * 7, lift=lift)
    return p

def wave(t, T):
    p = Pose()
    env = K([(0, 0), (0.38, 1.07), (0.55, 1.0), (2.35, 1.0), (2.9, 0), (T, 0)], t)
    e = min(max(env, 0.0), 1.0)
    wt = max(0.0, t - 0.45)
    wamp = K([(0, 0), (0.5, 0), (0.65, 1), (2.2, 1), (2.45, 0), (T, 0)], t)
    wv = math.sin(TAU * wt / 0.44) * wamp
    wv2 = math.sin(TAU * wt / 0.44 - 0.9) * wamp
    sd, od = "L", "R"                        # saluda con el brazo del lado L
    s = SX[sd]
    b = math.sin(TAU * t / 1.5)
    p.hips = Vector((SX[od] * 0.014 * e, H0 - 0.012 - 0.006 * e + 0.003 * wv, 0))
    p.rot["Hips"] = E(z=SX[od] * 2.0 * e)
    p.rot["Spine"] = E(z=-SX[od] * 1.5 * e, x=1)
    p.rot["Chest"] = E(z=s * -4.0 * e * -1, x=-1.0 * b, y=-s * 5 * e)
    p.rot["Neck"] = E(z=-s * 3 * e, y=s * 4 * e)
    p.rot["HeadBone"] = E(z=-s * 7 * e + 1.5 * wv, y=s * 6 * e, x=-3 * e)
    arm(p, sd, lower=lerp(13, -100, env), swing=18 * e, elbow=lerp(13, 14, e),
        fore_z=62 * e + 20 * wv, hand_z=14 * wv2, hand=-6 * e, twist=-25 * e)
    arm(p, od, lower=13 + 2 * e, swing=4 * e, elbow=16, hand=6)
    feet_rest(p)
    return p

def sit(t, T, lie=False):
    p = Pose()
    if not lie:
        ky = [(0, H0), (0.15, H0 + 0.004), (0.60, 0.46), (1.00, 0.165), (1.12, 0.150), (1.4, 0.158), (T, 0.158)]
        kz = [(0, 0), (0.60, -0.07), (1.00, -0.10), (T, -0.10)]
        kp = [(0, 0), (0.60, 30), (1.00, 6), (1.35, -10), (T, -10)]
        fz = [(0, 0), (0.62, 0), (1.00, 0.20), (1.30, 0.27), (T, 0.27)]
    else:
        ky = [(0, H0), (0.12, H0 + 0.004), (0.50, 0.46), (0.88, 0.165), (1.0, 0.152), (1.30, 0.150),
              (2.0, 0.095), (2.15, 0.088), (T, 0.090)]
        kz = [(0, 0), (0.50, -0.07), (0.88, -0.10), (1.30, -0.11), (2.0, -0.21), (T, -0.21)]
        kp = [(0, 0), (0.50, 30), (0.88, 6), (1.30, -30), (2.0, -84), (2.15, -86), (T, -86)]
        fz = [(0, 0), (0.52, 0), (0.88, 0.20), (1.30, 0.27), (T, 0.27)]
    y, z, pitch = K(ky, t), K(kz, t), K(kp, t)
    settle = K([(0, 0), (1.3 if not lie else 2.1, 0), (1.6 if not lie else 2.4, 1), (T, 1)], t)
    b = math.sin(TAU * max(0, t - 1.2) / 2.6) * settle
    p.hips = Vector((0, y, z))
    p.rot["Hips"] = E(x=pitch)
    sp = K([(0, 0), (0.60, 14), (1.0, 8), (1.4, 12), (T, 12)], t) if not lie else \
         K([(0, 0), (0.50, 14), (0.88, 8), (1.3, 10), (2.0, 2), (T, 2)], t)
    p.rot["Spine"] = E(x=sp * 0.6)
    p.rot["Chest"] = E(x=sp * 0.4 - 1.5 * b)
    if lie:
        nk = K([(0, 0), (0.5, -10), (1.3, 5), (2.0, 16), (T, 16)], t)
        hk = K([(0, 0), (0.5, -12), (1.3, 6), (2.0, 24), (T, 24)], t)
        p.rot["Neck"] = E(x=nk)
        p.rot["HeadBone"] = E(x=hk, y=K([(0, 0), (2.4, 0), (2.9, 12), (T, 12)], t),
                              z=K([(0, 0), (2.4, 0), (2.9, -8), (T, -8)], t))
    else:
        look = K([(0, 0), (1.5, 0), (2.0, -14), (2.6, -14), (2.9, 4), (T, 4)], t)
        p.rot["Neck"] = E(x=-(pitch + sp) * 0.25)
        p.rot["HeadBone"] = E(x=-(pitch + sp) * 0.3 + 3 * b, y=look, z=-look * 0.25)
    # piernas
    for sd in ("L", "R"):
        s = SX[sd]
        fzz = K(fz, t)
        if lie and sd == "L":        # pierna estirada al acostarse
            ext = K([(0, 0), (1.3, 0), (2.1, 1), (T, 1)], t)
            zz = lerp(fzz, 0.34, ext)
            ank_h = lerp(ANK_H, 0.09, ext)
            pit = lerp(0, -82, ext)
            set_foot(p, sd, s * (FOOTX + 0.02), zz, pitch=0, yaw=s * 6, ank_h=ank_h,
                     pole=Vector((s * 0.15, 1, 0.3)).lerp(knee_pole(p, sd), 1 - ext))
            p.leg[sd] = (p.leg[sd][0], Qy(s * 6) @ Qx(pit), p.leg[sd][2])
        else:
            set_foot(p, sd, s * (FOOTX + 0.025 + 0.02 * smooth(t - 0.6)), fzz, yaw=s * 8,
                     pole=Vector((s * 0.25, 0.6, 1.0)) if t > 0.6 else knee_pole(p, sd))
    # brazos: equilibrio al bajar, luego manos sobre las rodillas (o sobre la guata al acostarse)
    for sd in ("L", "R"):
        s = SX[sd]
        bal = K([(0, 0), (0.55, 1), (0.95, 0.4), (1.3, 0), (T, 0)], t)
        arm(p, sd, lower=13 - 10 * bal, swing=55 * bal, elbow=15 + 20 * bal, hand=6)
        if not lie:
            wgt = K([(0, 0), (1.0, 0), (1.45, 1), (T, 1)], t)
            tgt = (lambda P, W, sd=sd: P["Shin" + sd] + Vector((-SX[sd] * 0.01, 0.05, -0.03)))
            p.arm[sd] = (tgt, None, Vector((SX[sd] * 1.0, 0, -0.4)), wgt)
        else:
            wgt = K([(0, 0), (2.0, 0), (2.5, 1), (T, 1)], t)
            tgt = (lambda P, W, sd=sd: P["Spine"] + W["Spine"] @ Vector((SX[sd] * 0.05, 0.06, 0.12)))
            p.arm[sd] = (tgt, None, W_out(sd), wgt)
    return p

def W_out(sd): return Vector((SX[sd] * 1.0, 0.3, 0))

def lie(t, T): return sit(t, T, lie=True)

def dance(t, T):
    p = Pose()
    beat = 0.5
    bb = t / beat                                       # beats
    bounce = -0.034 * (0.5 + 0.5 * math.cos(TAU * bb))
    R = [0, .10, .10, .10, 0, 0, -.10, 0, 0]            # step-touch (cada medio beat)
    L = [0, 0, .10, 0, 0, -.10, -.10, -.10, 0]
    hb = (bb % 4.0) * 2
    k = min(int(hb), 7); u = hb - k
    offs = {}
    for sd, arr in (("R", R), ("L", L)):
        a0, a1 = arr[k], arr[k + 1]
        offs[sd] = (lerp(a0, a1, smooth(u)), 0.05 * math.sin(math.pi * u) if a0 != a1 else 0.0)
    cx = (offs["R"][0] + offs["L"][0]) / 2
    sway = math.sin(math.pi * bb)                       # vaivén cada 2 beats
    up = K([(0, 0), (3.55, 0), (4.0, 1), (7.55, 1), (8.0, 0)], bb % 8)
    p.hips = Vector((SX["R"] * cx * 0.9, H0 - 0.03 + bounce, 0))
    p.rot["Hips"] = E(z=SX["R"] * 5 * sway, y=6 * sway)
    p.rot["Spine"] = E(z=-SX["R"] * 3 * sway, x=2)
    p.rot["Chest"] = E(z=-SX["R"] * 3 * sway, y=-7 * sway + 4 * math.sin(TAU * bb))
    p.rot["Neck"] = E(x=3 * math.cos(TAU * bb), z=SX["R"] * 3 * sway)
    p.rot["HeadBone"] = E(x=4 * math.cos(TAU * bb), z=SX["R"] * 5 * sway, y=-4 * sway)
    for sd in ("L", "R"):
        s = SX[sd]
        side = 1 if sd == "R" else -1
        pump = math.sin(math.pi * bb) * side
        arm_pump = dict(lower=4, swing=30 + 26 * pump, elbow=95 - 10 * pump, hand=10)
        arm_up = dict(lower=-128 + 14 * sway * side, swing=12, elbow=18, hand=0, hand_z=12 * sway)
        prm = {kk: lerp(arm_pump.get(kk, 0), arm_up.get(kk, 0), smooth(up)) for kk in set(arm_pump) | set(arm_up)}
        arm(p, sd, **prm)
        off, lift = offs[sd]
        set_foot(p, sd, s * (FOOTX + 0.03) + SX["R"] * off, 0.0, yaw=s * 8, lift=lift,
                 pitch=18 * math.sin(math.pi * min(1, lift / 0.05)) if lift > 0 else 0)
    return p

def split(t, T):
    p = Pose()
    fx = K([(0, 0), (0.30, 0), (1.70, 1), (T, 1)], t)
    y = K([(0, H0), (0.30, H0 - 0.02), (1.70, 0.150), (1.84, 0.138), (2.0, 0.145), (T, 0.145)], t)
    b = math.sin(TAU * max(0, t - 1.9) / 1.6) * smooth((t - 1.9) / 0.3)
    p.hips = Vector((0, y, 0))
    lean = K([(0, 0), (0.3, 0), (1.0, 12), (1.7, 6), (2.1, -2), (T, -2)], t)
    p.rot["Hips"] = E(x=lean * 0.5)
    p.rot["Spine"] = E(x=lean * 0.3)
    p.rot["Chest"] = E(x=lean * 0.2 - 1.3 * b)
    p.rot["Neck"] = E(x=-lean * 0.3)
    p.rot["HeadBone"] = E(x=-lean * 0.3 - K([(0, 0), (1.9, 0), (2.3, 6), (T, 6)], t),
                          z=K([(0, 0), (2.0, 0), (2.4, 8), (T, 8)], t))
    for sd in ("L", "R"):
        s = SX[sd]
        reach = FOOTX + fx * (0.60 - FOOTX)
        roll = 78 * smooth(fx)
        ah = lerp(ANK_H, 0.075, smooth(fx))
        set_foot(p, sd, s * reach, 0.02 * fx, yaw=s * lerp(7, 0, fx), roll=s * roll, ank_h=ah,
                 pole=Vector((0, 0.2, 1)))
        # compensa el pivote del pie rodado para que el tobillo quede a la altura correcta
        ank, R, pole = p.leg[sd]
        p.leg[sd] = (Vector((s * reach, ah, 0.02 * fx)), R, pole)
        tada = K([(0, 0), (1.5, 0), (2.1, 1.06), (2.3, 1), (T, 1)], t)
        bal = K([(0, 0), (0.9, 1), (1.5, 1), (2.0, 0), (T, 0)], t)
        arm(p, sd, lower=lerp(13, -35, bal) + lerp(0, -118, tada) + 4 * b * tada, swing=18 * bal + 10 * tada,
            elbow=lerp(12, 8, tada), hand=-4 * tada, hand_z=-10 * tada)
    return p

def walk_back(t, T, S=0.08):
    """Pasos hacia atrás arrastrando los pies (estilo moonwalk): un pie apoyado en punta avanza
    respecto del cuerpo mientras el otro se desliza plano hacia atrás."""
    p = Pose()
    q = (t / T) % 1.0
    sw = math.sin(TAU * q)
    p.hips = Vector((SX["R"] * 0.010 * sw, H0 - 0.034 - 0.008 * math.cos(TAU * 2 * q), 0.0))
    p.rot["Hips"] = E(x=3, y=4 * sw, z=SX["R"] * 2.0 * sw)
    p.rot["Spine"] = E(x=3, y=-3 * sw)
    p.rot["Chest"] = E(x=2, y=-4 * sw, z=-SX["R"] * 1.5 * sw)
    bob = math.cos(TAU * 2 * q)
    p.rot["Neck"] = E(x=-2 + 2 * bob, y=2 * sw)
    p.rot["HeadBone"] = E(x=-2 + 2.5 * bob, z=SX["R"] * 3 * sw)
    for sd, ph in (("L", 0.0), ("R", 0.5)):
        s = SX[sd]
        qq = (q + ph) % 1.0
        if qq < 0.5:                                   # en punta: fijo en el suelo, avanza respecto del cuerpo
            u = qq / 0.5; z = -S + 2 * S * u; lift = 0.0
        else:                                          # plano: se arrastra hacia atrás
            u = (qq - 0.5) / 0.5; z = S - 2 * S * smooth(u) * 0.35 - 2 * S * u * 0.65; lift = 0.003
        pitch = K([(0, 0), (0.07, 34), (0.43, 34), (0.5, 0), (1.0, 0)], qq)
        set_foot(p, sd, s * (FOOTX + 0.012), z, pitch=pitch, yaw=s * 6, lift=lift, pole=knee_pole(p, sd, 0.25))
        c = math.cos(TAU * (q + ph) - 0.5)
        arm(p, sd, lower=10 - 3 * c, swing=8 + 10 * c, elbow=40 + 15 * max(0, c), hand=12, hand_z=4 * c)
    return p

def settle(p, extra=0.0):
    """Baja/sube la cadera para que el punto más bajo del cuerpo toque el suelo."""
    P, W = solve(p)
    pts = []
    for b in ("Hips", "Spine", "Chest", "Neck"):
        for zz in (-0.075, 0.075):
            pts.append((P[b] + W[b] @ Vector((0, 0, zz))).y)
    pts.append((P["Hips"] + W["Hips"] @ Vector((0, -0.08, -0.05))).y)
    hc = P["HeadBone"] + W["HeadBone"] @ Vector((0, 0.09, -0.01))
    pts.append(hc.y - 0.155)
    for sd in ("L", "R"):
        pts.append(P["Foot" + sd].y - 0.03); pts.append(P["Shin" + sd].y - 0.05)
    return min(pts) - extra

def candle(t, T):
    """Vela invertida: se sienta, rueda hacia atrás, sube las piernas estiradas con las manos en
    la espalda baja, se mantiene un momento y vuelve: baja las piernas, rueda hacia adelante,
    recoge los pies y se levanta hasta la pose base (termina en el mismo lugar donde empezó)."""
    p = Pose()
    y_sit = K([(0, H0), (0.12, H0 + 0.004), (0.45, 0.46), (0.80, 0.165), (1.0, 0.16), (5.6, 0.16),
               (5.85, 0.165), (6.35, 0.46), (6.8, H0 - 0.006), (T, H0)], t)
    z = K([(0, 0), (0.45, -0.07), (0.80, -0.10), (1.25, -0.20), (1.70, -0.30), (2.25, -0.35), (4.4, -0.35),
           (4.95, -0.30), (5.4, -0.20), (5.85, -0.10), (6.35, -0.05), (6.8, 0), (T, 0)], t)
    hold = smooth((t - 2.35) / 0.4) * (1 - smooth((t - 4.1) / 0.3))
    wob = math.sin(TAU * (t - 2.35) / 1.4) * hold
    wob2 = math.sin(TAU * (t - 2.35) / 1.1 + 1.0) * hold
    hp = K([(0, 0), (0.45, 30), (0.80, 6), (1.25, -60), (1.70, -115), (2.25, -162), (2.45, -166), (4.4, -165),
            (4.95, -118), (5.4, -62), (5.85, 4), (6.35, 30), (6.8, 2), (T, 0)], t) + 2.5 * wob
    sp = K([(0, 0), (0.45, 14), (0.80, 8), (1.25, 26), (1.70, 22), (2.25, 6), (4.4, 4), (4.95, 22), (5.4, 26),
            (5.85, 8), (6.35, 14), (6.8, 1), (T, 0)], t)
    nk = K([(0, 0), (0.80, -4), (1.25, 22), (1.70, 42), (2.25, 58), (4.4, 58), (4.95, 42), (5.4, 22),
            (5.85, -4), (6.35, -8), (6.8, 0), (T, 0)], t)
    hk = K([(0, 0), (0.80, -4), (1.25, 14), (1.70, 24), (2.25, 28), (4.4, 28), (4.95, 24), (5.4, 14),
            (5.85, -4), (6.35, -10), (6.8, 1), (T, 0)], t)
    p.hips = Vector((0, y_sit, z))
    p.rot["Hips"] = E(x=hp)
    p.rot["Spine"] = E(x=sp * 0.6)
    p.rot["Chest"] = E(x=sp * 0.4)
    p.rot["Neck"] = E(x=nk)
    p.rot["HeadBone"] = E(x=hk, y=4 * wob2)
    # piernas: IK en el suelo al sentarse / levantarse, FK en el suelo y en la vela
    fx = K([(0, 0), (0.80, -88), (1.25, -118), (1.70, -122), (2.25, -12), (2.5, -4), (4.4, -4), (4.9, -120),
            (5.4, -122), (5.85, -88), (T, -88)], t)
    kn = K([(0, 0), (0.80, 105), (1.25, 128), (1.70, 122), (2.25, 6), (2.5, 0), (4.4, 0), (4.9, 125),
            (5.4, 128), (5.85, 105), (T, 105)], t)
    fp = K([(0, 0), (0.80, 0), (1.25, 18), (1.70, 38), (2.25, 62), (4.4, 64), (4.9, 38), (5.4, 18),
            (5.85, 0), (T, 0)], t)
    lw = K([(0, 1), (0.82, 1), (1.12, 0), (5.5, 0), (5.85, 1), (T, 1)], t)
    ab = K([(0, 0), (1.7, 6), (2.3, 3), (4.4, 3), (5.0, 6), (5.85, 0), (T, 0)], t)
    fz = K([(0, 0), (0.47, 0), (0.80, 0.20), (1.0, 0.24), (5.5, 0.24), (5.85, 0.20), (6.15, 0.04), (T, 0)], t)
    for sd in ("L", "R"):
        s = SX[sd]
        p.rot["Thigh" + sd] = E(x=fx + 3 * wob2 * s, z=s * ab)
        p.rot["Shin" + sd] = E(x=kn)
        p.rot["Foot" + sd] = E(x=fp)
        p.leg_w[sd] = lw
        seated = 0.45 < t < 6.55
        set_foot(p, sd, s * (FOOTX + 0.02 - 0.008 * smooth((t - 6.2) / 0.5)), fz, yaw=s * (8 - smooth((t - 6.2) / 0.5)),
                 pole=Vector((s * 0.25, 0.6, 1.0)) if seated else knee_pole(p, sd))
        # brazos: equilibrio al bajar/subir, abrazan las rodillas al rodar, manos en la espalda en la vela
        bal = K([(0, 0), (0.45, 1), (0.8, 0.3), (1.1, 0), (5.85, 0), (6.2, 1), (6.65, 0.15), (T, 0)], t)
        hug = K([(0, 0), (0.9, 0), (1.3, 1), (1.9, 1), (2.3, 0.3), (4.4, 0.3), (4.8, 1), (5.5, 1), (5.85, 0), (T, 0)], t)
        arm(p, sd, lower=13 - 10 * bal - 4 * hug, swing=55 * bal + 70 * hug, elbow=15 + 20 * bal + 55 * hug, hand=6)
        wgt = K([(0, 0), (1.85, 0), (2.4, 1), (4.35, 1), (4.75, 0), (T, 0)], t)
        tgt = (lambda P, W, sd=sd: P["Spine"] + W["Spine"] @ Vector((SX[sd] * 0.075, -0.01, -0.095)))
        p.arm[sd] = (tgt, None, Vector((SX[sd] * 0.6, -1.0, 0.0)), wgt)
    # apoyo en el suelo (espalda, hombros, cabeza) mientras está rodando
    g = smooth((t - 0.80) / 0.30) * (1 - smooth((t - 5.55) / 0.3))
    if g > 0:
        dy = settle(p)
        p.hips = Vector((0, p.hips.y - dy * g, z))
    return p

ANIMS = [  # nombre, función, duración (s), bucle
    ("idle", idle, 6.0, True),
    ("walk", walk, 32 / 30, True),
    ("run", run, 20 / 30, True),
    ("jump", jump, 1.55, True),
    ("wave", wave, 3.0, True),
    ("sit", sit, 3.0, False),
    ("lie", lie, 3.5, False),
    ("dance", dance, 4.0, True),
    ("split", split, 3.5, False),
    ("walk_back", walk_back, 1.0, True),
    ("candle", candle, 7.0, False),
]

# =====================================================================  bake + exportar
def bake(fn, T):
    n = int(round(T * FPS))
    times = np.array([i / FPS for i in range(n + 1)], np.float32)
    times[-1] = T
    rot = {b: [] for b in BONES}
    pos = []
    for tt in times:
        p = fn(float(tt), T)
        solve(p)
        for b in BONES:
            q = p.rot[b].normalized()
            if rot[b] and rot[b][-1].dot(q) < 0: q = -q
            rot[b].append(q)
        pos.append(p.hips.copy())
    return times, rot, pos

def main():
    j, nb = strip_animations(J, BIN)
    nb = bytearray(nb)
    j["animations"] = []
    speeds = {}
    for name, fn, T, loop in ANIMS:
        times, rot, pos = bake(fn, T)
        ti = add_accessor(j, nb, times, "SCALAR")
        samplers, channels = [], []
        for b in BONES:
            arr = np.array([[q.x, q.y, q.z, q.w] for q in rot[b]], np.float32)
            samplers.append({"input": ti, "output": add_accessor(j, nb, arr, "VEC4"), "interpolation": "LINEAR"})
            channels.append({"sampler": len(samplers) - 1, "target": {"node": NODE[b], "path": "rotation"}})
        arr = np.array([[v.x, v.y, v.z] for v in pos], np.float32)
        samplers.append({"input": ti, "output": add_accessor(j, nb, arr, "VEC3"), "interpolation": "LINEAR"})
        channels.append({"sampler": len(samplers) - 1, "target": {"node": NODE["Hips"], "path": "translation"}})
        j["animations"].append({"name": name, "samplers": samplers, "channels": channels,
                                "extras": {"loop": loop}})
    j.setdefault("asset", {})["extras"] = {"walk_speed_mps": round(2 * 0.15 / (0.60 * 32 / 30), 3),
                                           "walk_back_speed_mps": -round(4 * 0.08 / 1.0, 3),
                                           "run_speed_mps": round(2 * 0.21 / (0.36 * 20 / 30), 3)}
    save_glb(SALIDA, j, bytes(nb))
    print("OK ->", SALIDA, f"{os.path.getsize(SALIDA) / 1024:.0f} KB",
          "| animaciones:", [a[0] for a in ANIMS], "|", j["asset"]["extras"])

if __name__ == "__main__":
    main()
