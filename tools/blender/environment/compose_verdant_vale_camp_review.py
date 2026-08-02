"""Compose the sole quality target beside the current Blender camp gate render."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
TARGET = ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg"


def font(size: int):
    for candidate in (
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/seguisb.ttf"),
    ):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--render", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    target = Image.open(TARGET).convert("RGB").resize((1536, 864), Image.Resampling.LANCZOS)
    current = Image.open(args.render).convert("RGB").resize((1536, 864), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (3072, 958), (18, 28, 24))
    draw = ImageDraw.Draw(canvas)
    label_font = font(34)
    note_font = font(22)
    draw.text((32, 20), "SOLE QUALITY TARGET — environment craftsmanship benchmark", fill=(245, 235, 196), font=label_font)
    draw.text((1568, 20), "CURRENT BLENDER CAMP GATE — visual approval pending", fill=(245, 235, 196), font=label_font)
    canvas.paste(target, (0, 74))
    canvas.paste(current, (1536, 74))
    draw.line((1535, 0, 1535, 958), fill=(215, 181, 92), width=3)
    draw.text(
        (32, 922),
        "Comparison scope: camp craftsmanship only. Background remains the approved static layer; gameplay and later kit assets remain frozen.",
        fill=(190, 205, 192),
        font=note_font,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, optimize=True)
    print(args.output)


if __name__ == "__main__":
    main()
