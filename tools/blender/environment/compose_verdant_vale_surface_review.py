"""Compose the frozen before and current after surface close-ups."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[3]
BEFORE = ROOT / ".art-work/verdant-vale-kit/terrain-bank/final3-detail.png"
AFTER = ROOT / "art-review/verdant-vale-kit/terrain-bank/surface-material.png"
OUTPUT = ROOT / "art-review/verdant-vale-kit/terrain-bank/surface-before-after.png"


def font(size: int):
    for candidate in (Path("C:/Windows/Fonts/arialbd.ttf"), Path("C:/Windows/Fonts/seguisb.ttf")):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def main() -> None:
    frame_size = (1440, 810)
    before = ImageOps.fit(Image.open(BEFORE).convert("RGB"), frame_size, Image.Resampling.LANCZOS)
    after = ImageOps.fit(Image.open(AFTER).convert("RGB"), frame_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (1440, 1740), (17, 25, 20))
    draw = ImageDraw.Draw(canvas)
    label = font(38)
    note = font(22)
    draw.text((34, 22), "BEFORE — manufactured edge", fill=(246, 220, 185), font=label)
    canvas.paste(before, (0, 78))
    draw.text((34, 918), "AFTER — clustered living surface", fill=(214, 244, 184), font=label)
    canvas.paste(after, (0, 974))
    draw.line((0, 906, 1440, 906), fill=(174, 197, 116), width=3)
    draw.text(
        (34, 1700),
        "Surface-layer scope only: frozen soil body, thickness, background, cameras, lighting, gameplay, and collision are unchanged.",
        fill=(190, 205, 192), font=note,
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, optimize=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()
