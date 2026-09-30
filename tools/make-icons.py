"""Build the app icons from the in-game helicopter sprite and palette (run: python3 tools/make-icons.py)."""
from pathlib import Path
from PIL import Image

HELI = [
"......kkk......", ".....kgggk.....", "....kgggggk....", "..s.kgggggk.s..", "..s.kbgggbk.s..",
"..s.kbbbbbk.s..", "..skbbbbbbbks..", "..skbbbbbbbks..", "..s.kbbbbbk.s..", "..s.kbbbbbk.s..",
"..s..kbbbk..s..", "......kbk......", "......kbk......", "......kbk......", "......kbk......",
"......kbk......", "......kbk......", "....kkkbkkk....", "....kbbbbbk....", "....kkkbkkk....",
"......kbk......", ".......k.......",
]
PAL = {"k": "#1b120d", "b": "#cf5a3e", "g": "#86c9da", "s": "#34342e"}
SEA, WAVE, LAND, COAST, ROTOR, SHADOW = "#1e3a6c", "#2c5395", "#4e8c34", "#8acb5a", "#dcdccb", "#14210e"
N = 36  # icon pixel grid

def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def build():
    im = Image.new("RGB", (N, N), hexrgb(SEA))
    px = im.load()
    for y in range(N):  # sea-wave marks, like the map
        for x in range(N):
            if (y % 6 == 2) and ((x + (y // 6) * 3) % 8 in (0, 1)): px[x, y] = hexrgb(WAVE)
    # a blocky island in the lower left
    island = [(2, 24, 12), (3, 22, 14), (4, 21, 15), (5, 21, 15), (6, 22, 14), (7, 23, 13), (8, 25, 11)]
    land = set()
    for dy, x0, x1 in island:
        for x in range(x0 - 20, x1 - 2): land.add((x, 20 + dy))
    for (x, y) in land:
        if 0 <= x < N and 0 <= y < N:
            edge = any((x + a, y + b) not in land for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            px[x, y] = hexrgb(COAST if edge else LAND)
    ox, oy = 11, 6
    for sy, row in enumerate(HELI):  # shadow, then body
        for sx, ch in enumerate(row):
            if ch != ".": px[ox + sx + 3, oy + sy + 3] = hexrgb(SHADOW)
    for sy, row in enumerate(HELI):
        for sx, ch in enumerate(row):
            if ch != ".": px[ox + sx, oy + sy] = hexrgb(PAL[ch])
    cx, cy = ox + 7, oy + 7  # rotor blades as an X over the hub
    for i in range(-9, 10):
        for x, y in ((cx + i, cy + i), (cx + i, cy - i)):
            if 0 <= x < N and 0 <= y < N and abs(i) > 1: px[x, y] = hexrgb(ROTOR)
    return im

out = Path(__file__).resolve().parent.parent / "site" / "icons"
base = build()
for size, name in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")):
    base.resize((size, size), Image.NEAREST).save(out / name)
# maskable: same art with a sea margin so the safe zone keeps the helicopter
m = Image.new("RGB", (N + 12, N + 12), hexrgb(SEA)); m.paste(base, (6, 6))
m.resize((512, 512), Image.NEAREST).save(out / "icon-maskable-512.png")
print("icons written to", out)
