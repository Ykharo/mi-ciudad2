#!/usr/bin/env python3
"""
ajustar_cara.py — Aplica al .glb el mismo "Ajuste de la cara" del Probador:
escala cada casilla de los atlas de ojos, cejas y boca (y opcionalmente el rubor)
alrededor de su centro y la desplaza verticalmente.

Uso: python3 ajustar_cara.py entrada.glb salida.glb H V Y [--rubor]
     ej.  python3 ajustar_cara.py avatar.glb avatar_ajustado.glb 0.97 1.40 0.010
"""
import sys, json, struct, io
import numpy as np
from PIL import Image

def load(p):
    d = open(p, "rb").read(); l = struct.unpack("<I", d[12:16])[0]
    return json.loads(d[20:20 + l]), d[20 + l + 8:]

def fit(img, cols, rows, sh, sv, dy):
    W, H = img.size; cw, ch = W // cols, H // rows
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            # premultiplica alfa para escalar sin bordes claros
            a = np.array(cell).astype(np.float32) / 255; a[..., :3] *= a[..., 3:4]
            pm = Image.fromarray((a * 255 + .5).astype(np.uint8), "RGBA")
            dw, dh = max(1, round(cw * sh)), max(1, round(ch * sv))
            pm = pm.resize((dw, dh), Image.LANCZOS)
            layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
            layer.paste(pm, (round((cw - dw) / 2), round((ch - dh) / 2 - dy * ch)))   # recorta a la casilla
            b = np.array(layer).astype(np.float32) / 255
            al = b[..., 3:4]; b[..., :3] = np.where(al > 1e-4, b[..., :3] / np.maximum(al, 1e-4), 0)
            out.paste(Image.fromarray((b * 255 + .5).clip(0, 255).astype(np.uint8), "RGBA"), (c * cw, r * ch))
    return out

def main():
    src, dst, sh, sv, dy = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:6])
    rubor = "--rubor" in sys.argv
    j, B = load(src)
    targets = {"Face_Eyes": (4, 2), "Face_Eyebrows": (4, 2), "Face_Mouth": (4, 2)}
    if rubor: targets["Face_Blush"] = (1, 1)
    new = {}
    for im in j["images"]:
        if im["name"] in targets:
            bv = j["bufferViews"][im["bufferView"]]; o = bv.get("byteOffset", 0)
            img = Image.open(io.BytesIO(B[o:o + bv["byteLength"]])).convert("RGBA")
            res = fit(img, *targets[im["name"]], sh, sv, dy)
            buf = io.BytesIO(); res.save(buf, "PNG", optimize=True); new[im["name"]] = buf.getvalue()
            res.save(f"atlas_{im['name']}.png")
    # reescribe el buffer reemplazando solo esas imágenes
    ib = {im["bufferView"]: im["name"] for im in j["images"]}
    nb, views = bytearray(), []
    for i, v in enumerate(j["bufferViews"]):
        v = dict(v); o = v.get("byteOffset", 0)
        chunk = new.get(ib.get(i)) or B[o:o + v["byteLength"]]
        while len(nb) % 4: nb += b"\0"
        v["byteOffset"], v["byteLength"] = len(nb), len(chunk); nb += chunk; views.append(v)
    j["bufferViews"] = views; j["buffers"] = [{"byteLength": len(nb)}]
    js = json.dumps(j, separators=(",", ":"), ensure_ascii=False).encode(); js += b" " * ((4 - len(js) % 4) % 4)
    nb += b"\0" * ((4 - len(nb) % 4) % 4)
    with open(dst, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 28 + len(js) + len(nb)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(nb), 0x004E4942)); f.write(bytes(nb))
    print("OK", dst, f"H {sh} V {sv} Y {dy:+.3f}", "(con rubor)" if rubor else "")

if __name__ == "__main__":
    main()
