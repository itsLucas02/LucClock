"""Outline the LucClock wordmark into SVG paths.

The brand lockup draws its wordmark as SVG <text> in a system-font stack
("-apple-system, 'Segoe UI', Roboto"). That is right for the extension, which
should look native on each OS, but it means a rasteriser has no idea which font
to use: sharp/libvips cannot see webfonts or resolve -apple-system, so it would
silently substitute whatever it has and the tile would ship in the wrong face.

So we instance the real SF Pro (the face the lockup renders as on macOS) at
weight 700 and convert the glyphs to outlines. Emits "Luc" and "Clock" as
separate paths so each half keeps its own brand colour.
"""
import json

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

# SFNS.ttf is the variable system font; pin it to the weight/optical size the
# lockup asks for. Falls back to Helvetica if SF is unavailable (Linux CI).
FONT_CANDIDATES = [
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
]

WORDS = [("Luc", "ink"), ("Clock", "blue")]
TRACKING_EM = -1 / 58.0   # the lockup's letter-spacing:-1 at font-size:58
TARGET_EM = 1000.0


def load_font():
    for path in FONT_CANDIDATES:
        try:
            f = TTFont(path, fontNumber=0) if path.endswith((".ttc", ".otc")) else TTFont(path)
            if "fvar" in f:
                f = instantiateVariableFont(
                    f, {"wght": 700, "opsz": 96, "wdth": 100}, inplace=False, updateFontNames=False
                )
            return f
        except Exception:
            continue
    raise SystemExit("no outline-able system font found")


font = load_font()
glyphset = font.getGlyphSet()
cmap = font.getBestCmap()
upem = font["head"].unitsPerEm
hmtx = font["hmtx"]
scale = TARGET_EM / upem

results = {}
x = 0.0
ink_bounds = None
for word, slot in WORDS:
    d_parts = []
    for ch in word:
        gname = cmap.get(ord(ch))
        if gname is None:
            continue
        glyph = glyphset[gname]
        spen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.2f}")
        glyph.draw(TransformPen(spen, Transform(scale, 0, 0, -scale, x, 0)))
        cmd = spen.getCommands()
        if cmd:
            d_parts.append(cmd)
        bp = BoundsPen(glyphset)
        glyph.draw(TransformPen(bp, Transform(scale, 0, 0, -scale, x, 0)))
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            if ink_bounds is None:
                ink_bounds = [x0, y0, x1, y1]
            else:
                ink_bounds[0] = min(ink_bounds[0], x0)
                ink_bounds[1] = min(ink_bounds[1], y0)
                ink_bounds[2] = max(ink_bounds[2], x1)
                ink_bounds[3] = max(ink_bounds[3], y1)
        x += hmtx[gname][0] * scale + TRACKING_EM * TARGET_EM
    results[slot] = " ".join(d_parts)

print(json.dumps({
    "ink": results["ink"],
    "blue": results["blue"],
    "advance": round(x, 2),
    "bounds": {
        "xMin": round(ink_bounds[0], 2), "yMin": round(ink_bounds[1], 2),
        "xMax": round(ink_bounds[2], 2), "yMax": round(ink_bounds[3], 2),
    },
}))