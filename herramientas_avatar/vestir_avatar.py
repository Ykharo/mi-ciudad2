#!/usr/bin/env python3
"""
vestir_avatar.py — Modela ropa y peinado para el avatar y los agrega al .glb como mallas
separadas, skinneadas al mismo esqueleto (se animan con el cuerpo).

  Pelo_Moño        peinado recogido con moño alto y mechones que enmarcan la cara
  Ropa_Peto        top corto negro con tirantes, borde y mariposa (textura Top_Emblem)
  Ropa_Pantalon    pantalón cargo pata de elefante con pretina, botón, bolsillos laterales
  Ropa_Zapatillas  zapatillas blancas con suela, panel lateral y talón

No modifica nada más del archivo (cuerpo, cara, animaciones). Usa los materiales que el
modelo ya traía (Hair_*, Cotton_*, Cargo_*, Sneaker_*, Sole, Button_Pewter, Top_Emblem).

Uso:  python3 vestir_avatar.py entrada.glb salida.glb
Requiere numpy, scipy y mathutils (incluido en el módulo `bpy`, o `pip install mathutils`).
Espacio glTF: +Y arriba, el personaje mira hacia +Z.
"""
import sys, json, struct, math
import numpy as np
from scipy.spatial import cKDTree
try:
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
except ImportError:
    import bpy  # noqa: F401
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree

# ============================================================== glb
CT = {5126: np.float32, 5123: np.uint16, 5121: np.uint8, 5125: np.uint32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}

def load(p):
    d = open(p, "rb").read(); l = struct.unpack("<I", d[12:16])[0]
    return json.loads(d[20:20 + l]), bytearray(d[20 + l + 8:])

def read_acc(j, B, i):
    a = j["accessors"][i]; bv = j["bufferViews"][a["bufferView"]]
    o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    dt, n = CT[a["componentType"]], NC[a["type"]]
    arr = np.frombuffer(bytes(B[o:o + a["count"] * n * np.dtype(dt).itemsize]), dtype=dt).reshape(a["count"], n)
    if a.get("normalized") and dt != np.float32: arr = arr.astype(np.float32) / np.iinfo(dt).max
    return arr

def mesh_data(j, B, name):
    p = [m for m in j["meshes"] if m["name"] == name][0]["primitives"][0]
    d = {k: read_acc(j, B, v) for k, v in p["attributes"].items()}
    d["indices"] = read_acc(j, B, p["indices"]).ravel().astype(np.int64)
    return d

def add_acc(j, B, arr, typ, ctype, target=None, minmax=False):
    arr = np.ascontiguousarray(arr)
    while len(B) % 4: B += b"\0"
    bv = {"buffer": 0, "byteOffset": len(B), "byteLength": arr.nbytes}
    if target: bv["target"] = target
    j["bufferViews"].append(bv); B += arr.tobytes()
    a = {"bufferView": len(j["bufferViews"]) - 1, "componentType": ctype,
         "count": int(arr.shape[0]), "type": typ}
    if minmax: a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
    j["accessors"].append(a)
    return len(j["accessors"]) - 1

# ============================================================== datos del avatar
J, BIN = load(sys.argv[1] if len(sys.argv) > 1 else "avatar_final.glb")
OUT = sys.argv[2] if len(sys.argv) > 2 else "avatar_vestido.glb"
MAT = {m["name"]: i for i, m in enumerate(J["materials"])}
JOINTS = [J["nodes"][i]["name"] for i in J["skins"][0]["joints"]]
JI = {n: i for i, n in enumerate(JOINTS)}
REST = {n["name"]: np.array(n.get("translation", [0, 0, 0])) for n in J["nodes"]}

def world_rest(name):
    """Posición de reposo de un hueso (sin rotaciones en reposo en este esqueleto)."""
    par = {c: n["name"] for n in J["nodes"] for c in n.get("children", [])}
    idx = {n["name"]: i for i, n in enumerate(J["nodes"])}
    p, cur = np.zeros(3), name
    while cur is not None:
        p += REST[cur]
        pi = par.get(idx[cur]); cur = pi if pi in JI else None
    return p

BODY = mesh_data(J, BIN, "Body_Base")
BP, BN, BI = BODY["POSITION"].astype(float), BODY["NORMAL"].astype(float), BODY["indices"].reshape(-1, 3)
BJ, BW = BODY["JOINTS_0"].astype(int), BODY["WEIGHTS_0"].astype(float)
DOM = np.array([JOINTS[BJ[i, BW[i].argmax()]] for i in range(len(BP))])
HEAD = mesh_data(J, BIN, "Head_Base")
HP, HI = HEAD["POSITION"].astype(float), HEAD["indices"].reshape(-1, 3)

def bvh(P, I): return BVHTree.FromPolygons([Vector(p) for p in P], [tuple(map(int, t)) for t in I])
BODY_BVH, HEAD_BVH = bvh(BP, BI), bvh(HP, HI)

def ray(tree, o, d):
    hit = tree.ray_cast(Vector(o), Vector(d))
    return None if hit[0] is None else np.array(hit[0])

# ============================================================== utilidades de malla
class Mesh:
    """Malla con varios materiales. Caras = triángulos."""
    def __init__(self): self.V, self.F, self.M, self.UV, self.tag = [], [], [], {}, {}
    def add(self, verts, faces, mat, uv=None):
        o = len(self.V); self.V.extend([np.asarray(v, float) for v in verts])
        for f in faces:
            f = [o + i for i in f]
            if len(f) == 3: self.F.append(f); self.M.append(mat)
            else:
                for k in range(1, len(f) - 1): self.F.append([f[0], f[k], f[k + 1]]); self.M.append(mat)
        if uv is not None:
            for i, t in enumerate(uv): self.UV[o + i] = t
        return o

def normals(V, F):
    V = np.asarray(V); N = np.zeros_like(V)
    for f in np.asarray(F):
        n = np.cross(V[f[1]] - V[f[0]], V[f[2]] - V[f[0]])
        N[f] += n
    l = np.linalg.norm(N, axis=1, keepdims=True); l[l == 0] = 1
    return N / l

def grid_faces(rows, cols, closed=False):
    """Quads de una grilla rows×cols (cols cerradas en anillo si closed)."""
    F = []
    cc = cols if closed else cols - 1
    for r in range(rows - 1):
        for c in range(cc):
            a, b = r * cols + c, r * cols + (c + 1) % cols
            F.append([a, a + cols, b + cols, b])
    return F

def shell(m, V, F, thick, mat_out, mat_in=None, mat_rim=None, outward=None):
    """Superficie con grosor: exterior + interior + bordes (como Solidify)."""
    V = np.asarray(V, float); F = [list(f) for f in F]
    tri = []
    for f in F: tri += [f] if len(f) == 3 else [[f[0], f[k], f[k + 1]] for k in range(1, len(f) - 1)]
    N = normals(V, tri) if outward is None else outward
    Vi = V - N * thick
    o = m.add(V, F, mat_out)
    i0 = m.add(Vi, [f[::-1] for f in F], mat_in if mat_in is not None else mat_out)
    # bordes: aristas que pertenecen a una sola cara
    cnt = {}
    for f in F:
        for k in range(len(f)):
            e = (f[k], f[(k + 1) % len(f)])
            key = tuple(sorted(e)); cnt.setdefault(key, []).append(e)
    rim = []
    for key, es in cnt.items():
        if len(es) == 1:
            a, b = es[0]
            rim.append([o + b, o + a, i0 + a, i0 + b])
    for q in rim:
        m.F.append([q[0], q[1], q[2]]); m.F.append([q[0], q[2], q[3]])
        m.M += [mat_rim if mat_rim is not None else mat_out] * 2
    return o

def extract_body(face_ok, offset):
    """Copia de las caras del cuerpo que cumplen face_ok, desplazada por la normal."""
    sel = [t for t in BI if face_ok(t)]
    used = sorted({int(v) for t in sel for v in t}); rm = {v: i for i, v in enumerate(used)}
    V = BP[used] + BN[used] * offset
    return V, [[rm[int(v)] for v in t] for t in sel], np.array(used)

def smooth(u): u = np.clip(u, 0, 1); return u * u * (3 - 2 * u)

# ============================================================== pesos de skinning
def skin_from_body(V, allowed, k=6, side=0):
    """Pesos copiados de los vértices del cuerpo más cercanos (restringidos a huesos permitidos).
    side=±1 limita a vértices del cuerpo de ese lado (evita que una pierna tome pesos de la otra)."""
    ok = np.array([d in allowed for d in DOM])
    if side: ok &= BP[:, 0] * side > -0.015
    idx = np.nonzero(ok)[0]; tree = cKDTree(BP[idx])
    dist, nn = tree.query(np.asarray(V), k=k)
    Jo = np.zeros((len(V), 4), np.uint16); Wo = np.zeros((len(V), 4), np.float32)
    for i in range(len(V)):
        acc = {}
        w_nn = 1.0 / (dist[i] + 1e-4) ** 2
        for wn, n in zip(w_nn, idx[nn[i]]):
            for jj, ww in zip(BJ[n], BW[n]):
                if ww > 0: acc[jj] = acc.get(jj, 0) + wn * ww
        top = sorted(acc.items(), key=lambda x: -x[1])[:4]
        s = sum(w for _, w in top)
        for c, (jj, ww) in enumerate(top): Jo[i, c], Wo[i, c] = jj, ww / s
    return Jo, Wo

def skin_rigid(V, joint):
    Jo = np.zeros((len(V), 4), np.uint16); Wo = np.zeros((len(V), 4), np.float32)
    Jo[:, 0], Wo[:, 0] = JI[joint], 1.0
    return Jo, Wo

# ============================================================== ZAPATILLAS
def zapatillas():
    m = Mesh()
    def ok(t):
        return all(DOM[v] in ("FootL", "FootR") or (DOM[v] in ("ShinL", "ShinR") and BP[v, 1] < 0.19) for v in t)
    V, F, used = extract_body(ok, 0.007)
    low = BP[used, 1] < 0.035
    V[low] += BN[used][low] * 0.006 * np.array([1, 0, 1])          # suela más ancha
    V[:, 1] = np.maximum(V[:, 1], 0.0)
    Vn = normals(V, F)
    tri_mat = []
    ankle_x = {s: world_rest("Foot" + s)[0] for s in "LR"}
    for f in F:
        c = V[f].mean(0); side = "L" if c[0] < 0 else "R"
        outer = abs(c[0]) > abs(ankle_x[side]) + 0.035
        if c[1] < 0.032 or (c[2] > 0.125 and c[1] < 0.075): mt = MAT["Sole"]           # suela y puntera
        elif (0.05 < c[1] < 0.10 and -0.06 < c[2] < 0.09 and outer) or (c[2] < -0.07 and c[1] > 0.07):
            mt = MAT["Sneaker_Panel"]                                                   # panel lateral y talón
        else: mt = MAT["Sneaker_Ivory"]
        tri_mat.append(mt)
    # grosor con materiales por cara
    base = len(m.V)
    shell(m, V, F, 0.004, MAT["Sneaker_Ivory"], mat_rim=MAT["Sneaker_Panel"], outward=Vn)
    for k, mt in enumerate(tri_mat): m.M[k] = mt
    return m, lambda V: skin_from_body(V, {"FootL", "FootR", "ShinL", "ShinR"})

# ============================================================== PETO
TOP_HEM = 0.902

def top_edge(th):
    """Altura del borde superior del peto según el ángulo (0 = frente, 180 = espalda)."""
    a = abs(math.degrees((th + math.pi) % (2 * math.pi) - math.pi))
    return float(np.interp(a, [0, 30, 48, 70, 90, 110, 132, 150, 180],
                              [1.066, 1.066, 1.058, 1.040, 1.030, 1.040, 1.062, 1.080, 1.080]))

def surface_strip(tree, pts2d, zc, zdir, width, lift, mat, m):
    """Línea delgada (costura, borde) proyectada sobre una superficie con rayos en ±Z."""
    P = []
    for x, y in pts2d:
        h = tree.ray_cast(Vector((x, y, zc + zdir * 0.6)), Vector((0, 0, -zdir)))
        if h[0] is not None:
            n = np.array(h[1]); n = n if n[2] * zdir > 0 else -n
            P.append((np.array(h[0]), n))
    V = []
    for i, (p, n) in enumerate(P):
        t = P[min(i + 1, len(P) - 1)][0] - P[max(i - 1, 0)][0]; t /= (np.linalg.norm(t) + 1e-9)
        w = np.cross(n, t); w /= (np.linalg.norm(w) + 1e-9)
        V += [p + n * lift - w * width / 2, p + n * lift + w * width / 2]
    m.add(V, [[2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2] for k in range(len(P) - 1)], mat)

def peto():
    m = Mesh()
    M = 64
    ts = [0.0, 0.035, 0.07] + list(np.linspace(0.12, 1.0, 11))
    ths = [2 * math.pi * k / M for k in range(M)]
    rows = []
    for t in ts:
        ys = [TOP_HEM + (top_edge(th) - TOP_HEM) * t for th in ths]
        rr = []
        for th, y in zip(ths, ys):
            zc = float(BP[np.abs(BP[:, 1] - y) < 0.02, 2].mean())
            rr.append((min(torso_r(y, th, zc), 0.142 / max(abs(math.sin(th)), 0.35)), y, zc))
        r = np.array([x[0] for x in rr])
        r = np.convolve(np.r_[r[-2:], r, r[:2]], np.ones(5) / 5, "valid")        # suaviza
        rows.append([np.array([math.sin(th) * (ri + 0.008), y, zc + math.cos(th) * (ri + 0.008)])
                     for th, ri, (_, y, zc) in zip(ths, r, rr)])
    V = [p for row in rows for p in row]
    F = [f[::-1] for f in grid_faces(len(rows), M, closed=True)]   # normales hacia afuera
    n0 = len(m.F)
    shell(m, V, F, 0.004, MAT["Cotton_Charcoal"], mat_rim=MAT["Cotton_Edge"])
    for q in range(len(F)):                                   # ribete gris del ruedo
        if q // M == 1:
            m.M[n0 + 2 * q] = m.M[n0 + 2 * q + 1] = MAT["Cargo_Stitch"]
        elif q // M in (0, 2):
            m.M[n0 + 2 * q] = m.M[n0 + 2 * q + 1] = MAT["Cotton_Edge"]
    top = bvh(V, [[f[0], f[1], f[2]] for f in F] + [[f[0], f[2], f[3]] for f in F])
    # tirantes anchos sobre los hombros
    for s in (-1, 1):
        x0, hw, N = s * 0.106, 0.020, 18
        grid = []
        for x in (x0 - hw, x0, x0 + hw):
            for k in range(N):
                ph = math.radians(-18 + 216 * k / (N - 1))
                d = np.array([0, math.sin(ph), math.cos(ph)])
                h = BODY_BVH.ray_cast(Vector((x, 1.02, -0.004)), Vector(d))
                p = np.array(h[0]) + np.array(h[1]) * 0.0105
                grid.append(p)
        Fs = grid_faces(3, N)
        shell(m, grid, Fs if s > 0 else [f[::-1] for f in Fs], 0.004, MAT["Cotton_Charcoal"], mat_rim=MAT["Cotton_Edge"])
    # mariposa
    cx, cy, sz, n = 0.0, 1.018, 0.052, 7
    pts, uv = [], []
    for r in range(n):
        for c in range(n):
            x = cx - sz / 2 + sz * c / (n - 1); y = cy + sz / 2 - sz * r / (n - 1)
            h = top.ray_cast(Vector((x, y, 0.6)), Vector((0, 0, -1)))
            nn = np.array(h[1]); nn = nn if nn[2] > 0 else -nn
            pts.append(np.array(h[0]) + nn * 0.0022); uv.append((c / (n - 1), r / (n - 1)))
    m.add(pts, grid_faces(n, n), MAT["Top_Emblem"], uv=uv)
    return m, lambda V: skin_from_body(V, {"Spine", "Chest", "Neck", "UpperArmL", "UpperArmR"})

# ============================================================== PANTALÓN pata de elefante
Y_CUT, HEM_Y = 0.600, 0.050

def leg_center(side, y):
    s = -1 if side == "L" else 1
    sel = (np.sign(BP[:, 0]) == s) & (np.abs(BP[:, 1] - y) < 0.03) & \
          np.array([d.startswith(("Thigh", "Shin", "Foot")) for d in DOM])
    if y > 0.2 and sel.sum() > 6:
        c = BP[sel].mean(0); c[1] = y
    else:
        a = world_rest("Foot" + side); c = np.array([a[0], y, a[2] + 0.02])
    return c

def body_r(c, th):
    d = np.array([math.sin(th), 0, math.cos(th)])
    h = ray(BODY_BVH, c, d)
    return 0.0 if h is None else np.linalg.norm(h - c)

def leg_design_r(y):
    if y >= 0.44: return 0.080 - 0.006 * (0.60 - y) / 0.16
    u = (0.44 - y) / (0.44 - HEM_Y)
    return 0.074 + (0.128 - 0.074) * u ** 1.5

def torso_r(y, th, zc):
    c = np.array([0.0, y, zc]); d = np.array([math.sin(th), 0, math.cos(th)])
    h = ray(BODY_BVH, c, d)
    return 0.0 if h is None else np.linalg.norm(h - c)

Y_TOP, Y_SPLIT0, Y_SPLIT1 = 0.852, 0.668, 0.585

def pant_ring(side, y, M):
    """Anillo de una pierna del pantalón. Arriba es media cintura (forma de D, con el lado
    plano en x=0); bajando se transforma en un círculo alrededor de la pierna."""
    s = -1 if side == "L" else 1
    zc = float(BP[np.abs(BP[:, 1] - max(y, 0.632)) < 0.03, 2].mean())
    nout, nin = M * 2 // 3, M - M * 2 // 3
    # --- forma D (media cintura)
    D = []
    for k in range(nout):
        th = math.pi * k / (nout - 1) if nout > 1 else 0.0          # 0 = frente, pi = atrás
        r = torso_r(max(y, 0.70), th * s, zc)
        D.append((th, r))
    # suaviza el perfil del cuerpo (quita bultos)
    rs = np.array([r for _, r in D]); rs = np.convolve(np.pad(rs, 3, mode="edge"), np.ones(7) / 7, "valid")
    Dp = [np.array([s * math.sin(th) * (r + 0.017), y, zc + math.cos(th) * (r + 0.017)]) for (th, _), r in zip(D, rs)]
    Dp[0][0] = Dp[-1][0] = s * 0.0005
    zf, zb = Dp[0][2], Dp[-1][2]
    for k in range(1, nin + 1):                                     # cuerda interior en x=0 (atrás -> frente)
        t = k / (nin + 1); Dp.append(np.array([s * 0.0005, y, zb + (zf - zb) * t]))
    # --- círculo de la pierna
    c = leg_center(side, y); c[2] += 0.008 * smooth((0.44 - y) / 0.39)
    C = []
    for k in range(M):
        th = (math.pi * k / (nout - 1)) if k < nout else (math.pi + math.pi * (k - nout + 1) / (nin + 1))
        d = np.array([s * math.sin(th), 0, math.cos(th)])
        r = leg_design_r(y) * (0.96 if abs(math.cos(th)) > 0.7 else 1.0)
        if y > 0.19: r = max(r, body_r(c, math.atan2(d[0], d[2])) + 0.016)
        C.append(c + d * r)
    b = smooth((Y_SPLIT0 - y) / (Y_SPLIT0 - Y_SPLIT1))
    return [(1 - b) * p + b * q for p, q in zip(Dp, C)] if b < 1 else C

def pantalon():
    m = Mesh()
    M = 36
    ys = list(np.linspace(Y_TOP, 0.68, 7)) + list(np.linspace(0.66, 0.585, 5)) + list(np.linspace(0.56, 0.47, 3)) + list(np.linspace(0.44, HEM_Y, 14))
    legs_bvh = []
    for side in "LR":
        s = -1 if side == "L" else 1
        rings = [pant_ring(side, y, M) for y in ys]
        V = [p for r in rings for p in r]
        F = grid_faces(len(rings), M, closed=True)
        if s < 0: F = [f[::-1] for f in F]
        n_before = len(m.V)
        shell(m, V, F, 0.005, MAT["Cargo_Pearl"], mat_rim=MAT["Cargo_Stitch"])
        for i in range(n_before, len(m.V)): m.tag[i] = s
        legs_bvh.append((V, F))
    allV = [p for V, _ in legs_bvh for p in V]
    allF = legs_bvh[0][1] + [[i + len(legs_bvh[0][0]) for i in f] for f in legs_bvh[1][1]]
    allF = [[f[0], f[1], f[2]] for f in allF] + [[f[0], f[2], f[3]] for f in allF]
    pants = bvh(allV, allF)
    def on_pants(o, d, extra):
        # se lanza desde afuera hacia adentro: así el primer impacto es siempre la cara exterior
        d = np.asarray(d, float); tg = np.array([d[2], 0, -d[0]])
        for sh in (0.0, 0.002, -0.002, 0.005, -0.005):          # evita la unión exacta de las piernas
            far = np.asarray(o, float) + d * 0.6 + tg * sh
            h = pants.ray_cast(Vector(far), Vector(-d))
            if h[0] is not None: return np.array(h[0]) - tg * sh + d * extra
        raise RuntimeError(f"sin superficie en {o} {d}")
    # bolsillos cargo laterales (a media pierna) con tapa
    for side in "LR":
        s = -1 if side == "L" else 1
        def surf(th, y, extra):
            c = leg_center(side, y)
            return on_pants(c, np.array([s * math.sin(th), 0, math.cos(th)]), extra)
        def patch(th0, th1, y0, y1, extra, mat, thick, nr=5, nc=7):
            P = [surf(th0 + (th1 - th0) * c / (nc - 1), y1 - (y1 - y0) * r / (nr - 1), extra)
                 for r in range(nr) for c in range(nc)]
            F2 = grid_faces(nr, nc)
            n_before = len(m.V)
            shell(m, P, F2 if s > 0 else [f[::-1] for f in F2], thick, mat, mat_rim=MAT["Cargo_Stitch"])
            for i in range(n_before, len(m.V)): m.tag[i] = s
        tho, a = math.pi / 2, math.radians(34)
        patch(tho - a, tho + a, 0.455, 0.555, 0.005, MAT["Cargo_Pocket"], 0.007)
        patch(tho - a - 0.06, tho + a + 0.06, 0.548, 0.588, 0.012, MAT["Cargo_Pocket"], 0.007)
    # pretina
    M2 = 48; band = []
    Y_B0, Y_B1 = Y_TOP + 0.004, Y_TOP - 0.028
    zc_b = float(BP[np.abs(BP[:, 1] - Y_TOP) < 0.03, 2].mean())
    for y in (Y_B0, Y_B1):
        c = np.array([0, min(y, Y_TOP - 0.002), zc_b])
        for k in range(M2):
            th = 2 * math.pi * k / M2
            d = np.array([math.sin(th), 0, math.cos(th)])
            p = on_pants(c, d, 0.004); p[1] = y
            band.append(p)
    shell(m, band, grid_faces(2, M2, closed=True), 0.010, MAT["Cargo_Pocket"], mat_rim=MAT["Cargo_Stitch"])
    y_mid = (Y_B0 + Y_B1) / 2
    def band_pt(th, extra):
        return on_pants(np.array([0, y_mid, zc_b]), np.array([math.sin(th), 0, math.cos(th)]), 0.004 + extra)
    # pasadores del cinturón
    for deg in (-100, -40, 40, 100, 180):
        th = math.radians(deg)
        d = np.array([math.sin(th), 0, math.cos(th)]); tg = np.array([math.cos(th), 0, -math.sin(th)])
        c = band_pt(th, 0.004)
        box = [c + tg * sx * 0.0065 + np.array([0, sy * 0.021, 0]) + d * sz
               for sz in (-0.004, 0.003) for sy in (-1, 1) for sx in (-1, 1)]
        m.add(box, [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]],
              MAT["Cargo_Pearl"])
    # botón
    bc = band_pt(0.0, 0.002)
    bp = []
    for zoff in (0.004, -0.002):
        for k in range(12):
            t = 2 * math.pi * k / 12
            bp.append([0.0085 * math.cos(t), bc[1] + 0.0085 * math.sin(t), bc[2] + zoff])
    bf = [[k, 12 + k, 12 + (k + 1) % 12, (k + 1) % 12] for k in range(12)] + [list(range(12))[::-1]]
    m.add(bp, bf, MAT["Button_Pewter"])
    zc_f = zc_b
    # cierre (línea central) y costura en J de la bragueta
    surface_strip(pants, [(0.0015, y) for y in np.linspace(Y_B1 - 0.002, 0.735, 10)], zc_f, 1, 0.003, 0.0016,
                  MAT["Cargo_Stitch"], m)
    J = [(0.021, y) for y in np.linspace(Y_B1 - 0.002, 0.752, 8)] + \
        [(0.021 * math.cos(a), 0.752 - 0.020 * math.sin(a)) for a in np.linspace(0.2, math.pi / 2, 6)]
    surface_strip(pants, J, zc_f, 1, 0.0028, 0.0016, MAT["Cargo_Stitch"], m)
    # bolsillos delanteros (abertura curva) y su costura
    for s in (-1, 1):
        cur = []
        for t in np.linspace(0, 1, 14):
            x = (1 - t) ** 2 * 0.060 + 2 * (1 - t) * t * 0.072 + t * t * 0.134
            y = (1 - t) ** 2 * (Y_B1 - 0.002) + 2 * (1 - t) * t * 0.760 + t * t * 0.752
            cur.append((s * x, y))
        surface_strip(pants, cur, zc_f, 1, 0.0045, 0.0018, MAT["Cargo_Pocket"], m)
        surface_strip(pants, [(x + s * 0.006, y - 0.006) for x, y in cur[:-2]], zc_f, 1, 0.0022, 0.0018,
                      MAT["Cargo_Stitch"], m)
    def skin(V):
        V = np.asarray(V)
        Jo, Wo = skin_from_body(V, {"Hips", "Spine", "ThighL", "ThighR", "ShinL", "ShinR"})
        for s, sd in ((-1, "L"), (1, "R")):
            idx = np.array([i for i, t in m.tag.items() if t == s])
            if len(idx):
                Jo[idx], Wo[idx] = skin_from_body(V[idx], {"Hips", "Spine", "Thigh" + sd, "Shin" + sd}, side=s)
        return Jo, Wo
    return m, skin

# ============================================================== PELO con moño alto
HC = np.array([0.0, 1.327, -0.011])

def head_r(d):
    h = ray(HEAD_BVH, HC, d)
    return np.linalg.norm(h - HC) if h is not None else 0.16

def sph(phi, el):
    """phi: 0 = frente (+Z), 90° = +X. el: elevación."""
    return np.array([math.cos(el) * math.sin(phi), math.sin(el), math.cos(el) * math.cos(phi)])

def hairline(phi):
    a = abs(math.degrees((phi + math.pi) % (2 * math.pi) - math.pi))
    return math.radians(np.interp(a, [0, 15, 35, 50, 65, 82, 100, 120, 145, 180], [41, 38, 30, 20, 8, -3, -9, -16, -28, -36]))

def pelo():
    m = Mesh()
    NP, NR = 56, 16
    ridge = lambda phi: 0.0035 * abs(math.sin(phi * 14))
    V = []
    for r in range(NR):
        t = r / (NR - 1)
        for k in range(NP):
            phi = 2 * math.pi * k / NP
            el = hairline(phi) + (math.radians(89) - hairline(phi)) * (t ** 0.9)
            d = sph(phi, el)
            pa = (phi + math.pi) % (2 * math.pi) - math.pi
            part = 0.007 * math.exp(-(pa / 0.07) ** 2) * (1 - smooth((t - 0.35) / 0.3))
            thick = 0.010 + 0.018 * smooth(t / 0.5) + 0.010 * smooth((math.sin(el) - 0.6) / 0.4) * (1 - t) \
                    + ridge(phi) * smooth(t / 0.25) - part \
                    + 0.016 * smooth((abs(math.sin(phi)) - 0.35) / 0.5) * (1 - 0.6 * t) * smooth(t / 0.3) \
                    + 0.010 * smooth((-math.cos(phi) - 0.2) / 0.6) * (1 - t)
            V.append(HC + d * (head_r(d) + thick))
    F = grid_faces(NR, NP, closed=True)
    # cierre en la coronilla
    top = len(V); V.append(HC + np.array([0, 1, 0]) * (head_r(np.array([0, 1, 0])) + 0.030))
    F += [[(NR - 1) * NP + k, top, (NR - 1) * NP + (k + 1) % NP][::-1] for k in range(NP)]
    F = [f[::-1] for f in F]
    o = m.add(V, F, MAT["Hair_Chestnut"])
    nq = (NR - 1) * NP
    for q in range(nq):
        col = q % NP
        mt = MAT["Hair_Light"] if col % 7 == 3 else (MAT["Hair_Dark"] if col % 9 == 6 else None)
        if mt is not None:
            m.M[2 * q] = mt; m.M[2 * q + 1] = mt
    # faldón interior en el borde (el nacimiento del pelo se ve con grosor, no como lámina)
    rim = [HC + sph(2 * math.pi * k / NP, hairline(2 * math.pi * k / NP) + 0.02) *
           (head_r(sph(2 * math.pi * k / NP, hairline(2 * math.pi * k / NP))) - 0.004) for k in range(NP)]
    ri = m.add(rim, [], MAT["Hair_Dark"])
    for k in range(NP):
        a, b = o + k, o + (k + 1) % NP
        m.F += [[a, ri + k, ri + (k + 1) % NP], [a, ri + (k + 1) % NP, b]]; m.M += [MAT["Hair_Dark"]] * 2
    # mechones (cintas con sección elíptica)
    def strand(ctrl, w0, w1, th, mat, n=14, wave=0.006, ring_n=7, bulge=0.0):
        ctrl = [np.asarray(c, float) for c in ctrl]
        pts = []
        for i in range(n):
            u = i / (n - 1) * (len(ctrl) - 1); k = min(int(u), len(ctrl) - 2); f = u - k
            p0, p1 = ctrl[k], ctrl[k + 1]
            pm = ctrl[k - 1] if k > 0 else p0; pn = ctrl[k + 2] if k + 2 < len(ctrl) else p1
            f2, f3 = f * f, f * f * f
            p = 0.5 * ((2 * p0) + (-pm + p1) * f + (2 * pm - 5 * p0 + 4 * p1 - pn) * f2 + (-pm + 3 * p0 - 3 * p1 + pn) * f3)
            pts.append(p)
        for i in range(1, n):                               # leve onda
            tg = pts[min(i + 1, n - 1)] - pts[i - 1]; tg /= np.linalg.norm(tg)
            side_v = np.cross(tg, (pts[i] - HC) / np.linalg.norm(pts[i] - HC))
            pts[i] = pts[i] + side_v * wave * math.sin(i / (n - 1) * 2.5 * math.pi) * (i / (n - 1))
        Vs = []
        for i, p in enumerate(pts):
            tng = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]; tng /= np.linalg.norm(tng)
            out = p - HC; out -= tng * out.dot(tng); out /= np.linalg.norm(out)
            b = np.cross(tng, out)
            u = i / (n - 1); bl = 1 + bulge * math.sin(math.pi * min(u * 1.3, 1))
            w = (w0 + (w1 - w0) * u) * bl; tk = th * (1 - 0.7 * u) * bl
            if i == n - 1: w *= 0.35; tk *= 0.35                   # punta cerrada
            for k in range(ring_n):
                a = 2 * math.pi * k / ring_n
                Vs.append(p + b * w * math.cos(a) + out * tk * math.sin(a))
        Fs = grid_faces(n, ring_n, closed=True)
        Fs = [f[::-1] for f in Fs]
        return m.add(Vs, Fs, mat)
    def on_hair(phi_deg, el_deg, extra=0.0):
        d = sph(math.radians(phi_deg), math.radians(el_deg))
        return HC + d * (head_r(d) + 0.012 + extra)
    CH, LI, DK = MAT["Hair_Chestnut"], MAT["Hair_Light"], MAT["Hair_Dark"]
    for s in (1, -1):
        # cortina delantera: sale de la raya, cubre la sien y el borde de la mejilla
        strand([on_hair(6 * s, 46, -0.010), on_hair(26 * s, 36, 0.004), on_hair(48 * s, 20, 0.010),
                on_hair(62 * s, 0, 0.012), on_hair(64 * s, -22, 0.014), on_hair(60 * s, -42, 0.016),
                on_hair(52 * s, -56, 0.020)], 0.034, 0.012, 0.018, CH, n=24, wave=0.008, ring_n=9, bulge=0.25)
        # capa lateral sobre la oreja
        strand([on_hair(30 * s, 52, -0.010), on_hair(55 * s, 32, 0.006), on_hair(76 * s, 8, 0.012),
                on_hair(82 * s, -18, 0.016), on_hair(78 * s, -42, 0.018), on_hair(70 * s, -60, 0.020)],
               0.040, 0.014, 0.020, LI, n=24, wave=0.010, ring_n=9, bulge=0.3)
        # capa trasera
        strand([on_hair(70 * s, 48, -0.010), on_hair(96 * s, 26, 0.008), on_hair(106 * s, -2, 0.014),
                on_hair(104 * s, -30, 0.018), on_hair(96 * s, -54, 0.020)], 0.042, 0.014, 0.020, CH,
               n=22, wave=0.008, ring_n=9, bulge=0.3)
        # mechón fino de brillo encima de la cortina
        strand([on_hair(14 * s, 44, 0.004), on_hair(40 * s, 28, 0.016), on_hair(58 * s, 6, 0.022),
                on_hair(60 * s, -18, 0.024), on_hair(55 * s, -36, 0.026)], 0.012, 0.004, 0.007, LI, n=18)
        # mechones de la nuca
        strand([on_hair(140 * s, -12, -0.006), on_hair(146 * s, -32, 0.010), on_hair(140 * s, -50, 0.018)],
               0.030, 0.010, 0.016, DK, n=14, ring_n=8, bulge=0.2)
    strand([on_hair(178, -18, -0.006), on_hair(180, -36, 0.010), on_hair(176, -52, 0.018)],
           0.032, 0.010, 0.016, CH, n=14, ring_n=8, bulge=0.2)
    # moño: base + lazadas + coletero
    bun_dir = sph(math.radians(180), math.radians(72))
    bc = HC + bun_dir * (head_r(bun_dir) + 0.072)
    rng = np.random.default_rng(7)
    def blob(center, radii, rot, mat, nu=16, nv=10, noise=0.08):
        Vb = []
        for i in range(nv + 1):
            v = math.pi * i / nv
            for k in range(nu):
                u = 2 * math.pi * k / nu
                p = np.array([math.sin(v) * math.cos(u), math.cos(v), math.sin(v) * math.sin(u)])
                p = p * radii * (1 + noise * math.sin(3 * u + 2 * v) * math.sin(v))
                Vb.append(center + rot @ p)
        Fb = grid_faces(nv + 1, nu, closed=True)
        return m.add(Vb, Fb, mat)
    def rotm(ax, ay, az):
        cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
        Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
        Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
        return Ry @ Rx @ Rz
    blob(bc, np.array([0.078, 0.066, 0.072]), rotm(0.3, 0, 0), MAT["Hair_Chestnut"])
    loops = [(0.9, 0.2, 0.0, MAT["Hair_Light"]), (-0.5, 1.4, 0.4, MAT["Hair_Chestnut"]),
             (0.2, 2.6, -0.5, MAT["Hair_Dark"]), (1.3, 4.0, 0.3, MAT["Hair_Chestnut"]),
             (-0.2, 5.1, 0.8, MAT["Hair_Light"])]
    for ax, ay, az, mt in loops:
        R = rotm(ax, ay, az)
        blob(bc + R @ np.array([0.038, 0.014, 0]), np.array([0.058, 0.034, 0.040]), R, mt, noise=0.05)
    # coletero en la base del moño
    base_c = HC + bun_dir * (head_r(bun_dir) + 0.022)
    ax_ = bun_dir / np.linalg.norm(bun_dir)
    e1 = np.cross(ax_, [1, 0, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(ax_, e1)
    Vt, NT, NS = [], 20, 8
    for i in range(NT):
        a = 2 * math.pi * i / NT
        cc = base_c + (e1 * math.cos(a) + e2 * math.sin(a)) * 0.046
        rad = (e1 * math.cos(a) + e2 * math.sin(a))
        for k in range(NS):
            b = 2 * math.pi * k / NS
            Vt.append(cc + (rad * math.cos(b) + ax_ * math.sin(b)) * 0.011)
    m.add(Vt, [f[::-1] for f in grid_faces(NT + 1, NS, closed=True)[:0]] +
          [[i * NS + k, i * NS + (k + 1) % NS, ((i + 1) % NT) * NS + (k + 1) % NS, ((i + 1) % NT) * NS + k]
           for i in range(NT) for k in range(NS)], MAT["Hair_Dark"])
    # mechón suelto que cae del moño
    strand([bc + np.array([0.03, -0.02, -0.04]), bc + np.array([0.06, -0.07, -0.05]),
            bc + np.array([0.07, -0.12, -0.03])], 0.010, 0.003, 0.007, MAT["Hair_Chestnut"])
    return m, lambda V: skin_rigid(V, "HeadBone")

# ============================================================== ensamblar
def append_mesh(name, m, skin_fn, flip_check=True):
    V = np.asarray(m.V, np.float32); F = np.asarray(m.F, np.int64); Mt = np.asarray(m.M)
    N = normals(V, F).astype(np.float32)
    Jo, Wo = skin_fn(V)
    has_uv = len(m.UV) > 0
    attrs = {"POSITION": add_acc(J, BIN, V, "VEC3", 5126, 34962, True),
             "NORMAL": add_acc(J, BIN, N, "VEC3", 5126, 34962),
             "JOINTS_0": add_acc(J, BIN, Jo.astype(np.uint16), "VEC4", 5123, 34962),
             "WEIGHTS_0": add_acc(J, BIN, Wo.astype(np.float32), "VEC4", 5126, 34962)}
    if has_uv:
        UV = np.zeros((len(V), 2), np.float32)
        for i, t in m.UV.items(): UV[i] = t
        attrs["TEXCOORD_0"] = add_acc(J, BIN, UV, "VEC2", 5126, 34962)
    prims = []
    for mt in sorted(set(Mt.tolist())):
        idx = F[Mt == mt].ravel().astype(np.uint32)
        prims.append({"attributes": dict(attrs), "material": int(mt),
                      "indices": add_acc(J, BIN, idx, "SCALAR", 5125, 34963)})
    J["meshes"].append({"name": name, "primitives": prims})
    J["nodes"].append({"name": name, "mesh": len(J["meshes"]) - 1, "skin": 0})
    J["scenes"][J.get("scene", 0)]["nodes"].append(len(J["nodes"]) - 1)
    print(f"  {name}: {len(V)} vértices, {len(F)} triángulos, materiales:",
          [J["materials"][p['material']]['name'] for p in prims])

if __name__ == "__main__":
    for n in ("Hair_Chestnut", "Hair_Light", "Hair_Dark", "Cotton_Charcoal", "Cotton_Edge", "Cargo_Pearl",
              "Cargo_Pocket", "Cargo_Stitch", "Sneaker_Ivory", "Sole", "Sneaker_Panel", "Button_Pewter"):
        J["materials"][MAT[n]]["doubleSided"] = True
    for n in ("Pelo_Moño", "Ropa_Peto", "Ropa_Pantalon", "Ropa_Zapatillas"):
        if any(m["name"] == n for m in J["meshes"]): sys.exit(f"El archivo ya tiene {n}; usa el .glb sin ropa.")
    for name, fn in (("Ropa_Zapatillas", zapatillas), ("Ropa_Pantalon", pantalon),
                     ("Ropa_Peto", peto), ("Pelo_Moño", pelo)):
        m, sk = fn(); append_mesh(name, m, sk)
    J["buffers"][0]["byteLength"] = len(BIN)
    js = json.dumps(J, separators=(",", ":"), ensure_ascii=False).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    while len(BIN) % 4: BIN += b"\0"
    with open(OUT, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 28 + len(js) + len(BIN)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(BIN), 0x004E4942)); f.write(bytes(BIN))
    print("OK ->", OUT)
