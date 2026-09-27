#!/usr/bin/env python3
"""
armar_juego.py — Une el código del juego con el modelo .glb en un solo HTML.

  python3 armar_juego.py                              (usa avatar_vestido.glb)
  python3 armar_juego.py otro_modelo.glb salida.html

El código (juego_fuente.html) tiene la marca @@NINA_GLB@@ donde va el modelo en base64.
"""
import base64, sys, pathlib
aqui = pathlib.Path(__file__).parent
glb = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else aqui / "avatar_vestido.glb"
out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else aqui.parent / "ciudad-arcoiris-nina.html"
src = (aqui / "juego_fuente.html").read_text(encoding="utf-8")
assert src.count("@@NINA_GLB@@") == 1, "no encuentro la marca @@NINA_GLB@@"
b64 = base64.b64encode(glb.read_bytes()).decode()
out.write_text(src.replace("@@NINA_GLB@@", b64), encoding="utf-8")
print(f"OK -> {out} ({out.stat().st_size / 1e6:.1f} MB)")
