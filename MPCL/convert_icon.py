import sys
import os
from PIL import Image

src = r"C:\Users\Administrator\Desktop\magic-wand.png"
dst = r"C:\Users\Administrator\Desktop\MPCL\src\renderer\assets\icon.ico"

img = Image.open(src).convert("RGBA")
print(f"Source: {img.size}, mode: {img.mode}")

# ICO requires sizes: 16, 32, 48, 256
sizes = [16, 32, 48, 256]
imgs = [img.resize((s, s), Image.LANCZOS) for s in sizes]

os.makedirs(os.path.dirname(dst), exist_ok=True)
imgs[0].save(dst, format="ICO", sizes=[(s, s) for s in sizes])
print(f"Saved ICO: {dst}")
print("Done!")
