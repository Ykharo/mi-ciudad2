#!/usr/bin/env python3
"""
armar_expresiones.py — Convierte caras completas (PNG con transparencia) en los atlas de
expresiones del avatar y los reemplaza dentro del .glb.

Cada cara se separa en capas:  ojos · cejas · boca · rubor
  - ojos, cejas y boca van a un atlas 4×2 (una casilla por expresión), igual que el original,
    así que el KHR_texture_transform del modelo (scale 0.25 × 0.5) no cambia.
  - el rubor es igual en todas, así que se toma de la primera cara y va a la capa Face_Blush.

Uso:  python3 armar_expresiones.py entrada.glb salida.glb cara0.png cara1.png ... (hasta 8)
Orden de casillas: (0,0) (1,0) (2,0) (3,0) (0,1) (1,1) (2,1) (3,1)
"""
import sys, json, struct, io
import numpy as np
from PIL import Image
from scipy import ndimage

CELL = 512                       # píxeles por casilla -> atlas 2048×1024
BLUSH_SIZE = 512
# Desplazamiento vertical (fracción de la casilla) para calzar con la posición original
# de cada rasgo en la cabeza. Medido: ojos originales centrados en y=0.445, boca en y=0.77.
SHIFT = {"eyes": -0.088, "brows": -0.088, "mouth": +0.064, "blush": -0.037}
BROW_MAX_Y = 0.43                # componentes cuyo centro está sobre esta línea = cejas
MOUTH_MIN_Y = 0.62               # centro bajo esta línea y cerca del centro = boca


def split_layers(path):
    """Separa una cara completa (PNG con transparencia) en ojos, cejas, boca y rubor.
    El rubor se reconoce por color (rosado) y posición (mejillas); todo lo demás opaco son rasgos,
    incluido el blanco de los ojos y la lengua."""
    im = np.array(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0
    rgb, a = im[..., :3], im[..., 3]
    H, W = a.shape
    yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
    pinkness = np.clip((rgb[..., 0] - rgb[..., 1] - 0.06) / 0.22, 0, 1)
    cheek = (np.abs(xx - 0.5) > 0.15) & (yy > 0.52) & (yy < 0.82)
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    ink = (a > 0.5) & (lum < 0.35)
    near_ink = ndimage.binary_dilation(ink, iterations=5)
    sclera = (lum > 0.80) & (pinkness < 0.45) & (a > 0.5)
    allowed = cheek & (pinkness > 0.03) & ~near_ink & ~ndimage.binary_dilation(sclera, iterations=2) & (a > 0.003)
    core = cheek & (pinkness > 0.6) & (a > 0.3) & ~near_ink
    lab, n = ndimage.label(core)
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    core = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 0.004 * H * W])
    blush = ndimage.binary_propagation(core, mask=allowed)      # crece solo por zonas rosadas
    feature = (a > 0.003) & ~blush
    grp, m = ndimage.label(ndimage.binary_dilation(feature, iterations=2))
    layers = {k: np.zeros_like(a, bool) for k in ("eyes", "brows", "mouth")}
    for i in range(1, m + 1):
        sel = (grp == i) & feature
        if sel.sum() < 30: continue
        ys, xs = np.nonzero(sel)
        cy, cx = ys.mean() / H, xs.mean() / W
        if cy < BROW_MAX_Y: layers["brows"] |= sel
        elif cy > MOUTH_MIN_Y and abs(cx - 0.5) < 0.18: layers["mouth"] |= sel
        else: layers["eyes"] |= sel
    out = {}
    for k, mask in layers.items():
        rgba = im.copy(); rgba[..., 3] *= mask; out[k] = rgba
    rb = im.copy(); rb[..., 3] *= blush * np.clip(pinkness * 1.5, 0, 1); out["blush"] = rb
    return out


def to_cell(rgba, size, shift):
    """Escala a size×size (premultiplicando alfa para no crear bordes claros) y desplaza en y."""
    pm = rgba.copy(); pm[..., :3] *= pm[..., 3:4]
    img = Image.fromarray((pm * 255 + 0.5).clip(0, 255).astype(np.uint8), "RGBA")
    img = img.resize((size, size), Image.LANCZOS)
    arr = np.array(img).astype(np.float32) / 255.0
    dy = int(round(shift * size))
    arr = np.roll(arr, dy, axis=0)
    if dy > 0: arr[:dy] = 0
    elif dy < 0: arr[dy:] = 0
    al = arr[..., 3:4]
    arr[..., :3] = np.where(al > 1e-4, arr[..., :3] / np.maximum(al, 1e-4), 0)
    return arr


def png_bytes(arr):
    b = io.BytesIO()
    Image.fromarray((arr * 255 + 0.5).clip(0, 255).astype(np.uint8), "RGBA").save(b, "PNG", optimize=True)
    return b.getvalue()


def build(faces):
    atlas = {k: np.zeros((CELL * 2, CELL * 4, 4), np.float32) for k in ("eyes", "brows", "mouth")}
    blush = None
    for idx, path in enumerate(faces):
        c, r = idx % 4, idx // 4
        L = split_layers(path)
        for k in atlas:
            atlas[k][r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL] = to_cell(L[k], CELL, SHIFT[k])
        if blush is None:
            blush = to_cell(L["blush"], BLUSH_SIZE, SHIFT["blush"])
    return atlas, blush


def replace_images(glb_in, glb_out, images_by_name):
    d = open(glb_in, "rb").read()
    jl = struct.unpack("<I", d[12:16])[0]
    j = json.loads(d[20:20 + jl]); B = d[20 + jl + 8:]
    img_bv = {im["bufferView"]: im["name"] for im in j["images"]}
    nb, views = bytearray(), []
    for i, v in enumerate(j["bufferViews"]):
        v = dict(v); o = v.get("byteOffset", 0)
        chunk = images_by_name.get(img_bv.get(i)) or B[o:o + v["byteLength"]]
        while len(nb) % 4: nb += b"\0"
        v["byteOffset"], v["byteLength"] = len(nb), len(chunk)
        nb += chunk; views.append(v)
    j["bufferViews"] = views; j["buffers"] = [{"byteLength": len(nb)}]
    for im in j["images"]:
        if im["name"] in images_by_name: im["mimeType"] = "image/png"
    js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((4 - len(js) % 4) % 4)
    nb += b"\0" * ((4 - len(nb) % 4) % 4)
    with open(glb_out, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 28 + len(js) + len(nb)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(nb), 0x004E4942)); f.write(bytes(nb))


if __name__ == "__main__":
    glb_in, glb_out, *faces = sys.argv[1:]
    atlas, blush = build(faces)
    imgs = {"Face_Eyes": png_bytes(atlas["eyes"]), "Face_Eyebrows": png_bytes(atlas["brows"]),
            "Face_Mouth": png_bytes(atlas["mouth"]), "Face_Blush": png_bytes(blush)}
    for n, b in imgs.items():
        open(f"atlas_{n}.png", "wb").write(b)
    replace_images(glb_in, glb_out, imgs)
    print("OK", glb_out, {n: f"{len(b)//1024} KB" for n, b in imgs.items()})
