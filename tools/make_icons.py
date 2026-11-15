#!/usr/bin/env python3
"""Regenerate the Multi Games Casino web icons with Python PIL.

The art is original: a gold casino chip ring with edge dots on a dark
background, a black center disc, and a teal-outlined gold star. No
copied brands, no JILI art, no external assets. Everything is drawn
with code, so the icons can be rebuilt from this file alone.

Outputs (written to the output folder, default is the current folder):
  icon-192.png            192 x 192, standard icon
  icon-512.png            512 x 512, standard icon
  apple-touch-icon.png    180 x 180, iOS home screen icon
  icon-maskable-512.png   512 x 512, maskable icon with the art scaled
                          down so it survives circular and squircle masks

Usage:
  pip install pillow
  python3 tools/make_icons.py [--out FOLDER]

The Android launcher icons are built by tools/make_android_icons.py,
which reuses the drawing code in this file.
"""

import argparse
import math
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.stderr.write("Pillow is required: pip install pillow\n")
    raise

BACKGROUND = (6, 8, 14, 255)       # Page background, matches manifest theme
DISC_NAVY = (16, 24, 40, 255)      # Outer disc behind the gold ring
GOLD_DARK = (184, 122, 14, 255)    # Ring outer edge
GOLD = (242, 193, 78, 255)         # Ring face
GOLD_DOT = (245, 184, 29, 255)     # Edge dot centers
INNER_DISC = (4, 6, 10, 255)       # Black center disc
TEAL = (45, 212, 191, 255)         # Star outline
STAR_GOLD = (253, 230, 138, 255)   # Star fill
WHITE = (255, 255, 255, 255)       # Edge dots

SUPERSAMPLE = 4


def star_points(cx, cy, r_outer, r_inner, points=5, start_deg=-90.0):
    """Return the polygon points of a star centered at (cx, cy)."""
    pts = []
    step = math.pi / points
    start = math.radians(start_deg)
    for i in range(2 * points):
        r = r_outer if i % 2 == 0 else r_inner
        a = start + i * step
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw_chip_art(size, art_scale=1.0, background=BACKGROUND):
    """Draw the chip-and-star art at `size` pixels square.

    art_scale shrinks the art inside the canvas (used for the maskable
    icon). background may be an RGBA tuple or None for transparency.
    Returns an RGBA image drawn at 4x and downscaled for smooth edges.
    """
    big = size * SUPERSAMPLE
    img = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = big / 2.0
    u = big * art_scale  # art unit: the full art box edge

    def circle(radius, fill):
        d.ellipse([c - radius, c - radius, c + radius, c + radius],
                  fill=fill)

    # Outer navy disc, gold ring with a darker edge, black center disc.
    circle(0.485 * u, DISC_NAVY)
    circle(0.425 * u, GOLD_DARK)
    circle(0.415 * u, GOLD)
    circle(0.292 * u, GOLD_DARK)
    circle(0.284 * u, INNER_DISC)

    # Eight edge dots on the ring: white ring with a gold center.
    ring_mid = (0.415 + 0.292) / 2.0 * u
    for k in range(8):
        a = math.radians(-90.0 + 45.0 * k)
        x = c + ring_mid * math.cos(a)
        y = c + ring_mid * math.sin(a)
        r_out = 0.033 * u
        r_in = 0.016 * u
        d.ellipse([x - r_out, y - r_out, x + r_out, y + r_out], fill=WHITE)
        d.ellipse([x - r_in, y - r_in, x + r_in, y + r_in], fill=GOLD_DOT)

    # Star: teal outline star with a smaller pale gold star on top.
    d.polygon(star_points(c, c, 0.238 * u, 0.098 * u), fill=TEAL)
    d.polygon(star_points(c, c, 0.172 * u, 0.071 * u), fill=STAR_GOLD)

    return img.resize((size, size), Image.LANCZOS)


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Regenerate the Multi Games Casino web icons.")
    parser.add_argument("--out", default=".",
                        help="Folder to write the icons into.")
    args = parser.parse_args(argv)
    os.makedirs(args.out, exist_ok=True)

    jobs = [
        ("icon-192.png", 192, 1.0),
        ("icon-512.png", 512, 1.0),
        ("apple-touch-icon.png", 180, 1.0),
        ("icon-maskable-512.png", 512, 0.80),
    ]
    for name, size, scale in jobs:
        img = draw_chip_art(size, art_scale=scale)
        path = os.path.join(args.out, name)
        img.convert("RGB").save(path, "PNG")
        print("wrote %s (%dx%d)" % (path, size, size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
