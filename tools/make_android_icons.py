#!/usr/bin/env python3
"""Regenerate the Android launcher icons from the chip-and-star art.

Reuses the drawing code in tools/make_icons.py (same original art, no
copied brands, no external assets) and writes the mipmap PNGs that the
Gradle build expects:

  mipmap-mdpi     48 x 48     launcher, round, foreground 108 x 108
  mipmap-hdpi     72 x 72     launcher, round, foreground 162 x 162
  mipmap-xhdpi    96 x 96     launcher, round, foreground 216 x 216
  mipmap-xxhdpi   144 x 144   launcher, round, foreground 324 x 324
  mipmap-xxxhdpi  192 x 192   launcher, round, foreground 432 x 432

Launcher icons carry the full art with its dark background. Round icons
are the same art under a circular mask. Foreground icons are the art on
a transparent background for adaptive icons: the background color comes
from res/values/colors.xml (#06080e) via the mipmap-anydpi-v26 XML.

Usage:
  pip install pillow
  python3 tools/make_android_icons.py [--res FOLDER]

Run from the repo root. --res defaults to
android/app/src/main/res relative to the repo root.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.stderr.write("Pillow is required: pip install pillow\n")
    raise

from make_icons import draw_chip_art

# (density folder, launcher size, foreground layer size)
DENSITIES = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

# Foreground art scale: the 108dp layer shows only the middle 66dp
# fully, so the art is drawn to fill about 62% of the layer.
FOREGROUND_SCALE = 0.62


def circular_mask(size):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size - 1, size - 1], fill=255)
    return mask


def main(argv=None):
    here = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(here)
    default_res = os.path.join(repo_root, "android", "app",
                               "src", "main", "res")
    parser = argparse.ArgumentParser(
        description="Regenerate the Android launcher icons.")
    parser.add_argument("--res", default=default_res,
                        help="Android res folder to write into.")
    args = parser.parse_args(argv)

    for folder, launcher_size, fg_size in DENSITIES:
        out_dir = os.path.join(args.res, folder)
        os.makedirs(out_dir, exist_ok=True)

        art = draw_chip_art(launcher_size, art_scale=1.0)
        art.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")

        rounded = art.copy()
        rounded.putalpha(circular_mask(launcher_size))
        rounded.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")

        fg = draw_chip_art(fg_size, art_scale=FOREGROUND_SCALE,
                           background=None)
        fg.save(os.path.join(out_dir, "ic_launcher_foreground.png"), "PNG")

        print("wrote %s (launcher %d, foreground %d)"
              % (folder, launcher_size, fg_size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
