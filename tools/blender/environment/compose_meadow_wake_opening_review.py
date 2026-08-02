"""Compose canonical Meadow Wake art-review sheets with locked evidence roles."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
TARGET = ROOT / "assets/references/terrain/meadow-wake-production-quality-target.jpeg"
CURRENT = ROOT / "assets/references/terrain/meadow-wake-current-deployment.png"
REVIEW = ROOT / "art-review/meadow-wake-opening"


def sha256(path):
    digest = hashlib.sha256(path.read_bytes()).hexdigest().upper()
    return digest


def font(size=26):
    candidates = (
        Path("C:/Windows/Fonts/seguisb.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def load_panel(path):
    image = Image.open(path).convert("RGB")
    if image.size != (1536, 864):
        raise ValueError(f"{path} is {image.size}; expected 1536x864")
    return image


def label(image, text, color=(255, 255, 255)):
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((18, 16, 520, 66), radius=9, fill=(10, 22, 26, 205), outline=(255, 255, 255, 80), width=2)
    draw.text((38, 25), text, font=font(26), fill=(*color, 255), stroke_width=1, stroke_fill=(0, 0, 0, 180))
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.parse_args()
    REVIEW.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(CURRENT, REVIEW / "01_current-deployment.png")

    target = label(load_panel(TARGET), "QUALITY TARGET — supplied reference", (255, 214, 88))
    current = label(load_panel(CURRENT), "CURRENT GAMEPLAY — comparison only", (119, 207, 255))
    clay = label(load_panel(REVIEW / "03_clay-render.png"), "BLENDER CLAY — locked camera", (220, 198, 174))
    final = label(load_panel(REVIEW / "05_final-lighting-render.png"), "BLENDER ART GATE — revision 4", (157, 237, 146))

    side = Image.new("RGB", (3072, 864), (16, 23, 23))
    side.paste(target, (0, 0))
    side.paste(final, (1536, 0))
    side.save(REVIEW / "07_side-by-side-target-comparison.png", optimize=True)

    four = Image.new("RGB", (3072, 1728), (16, 23, 23))
    four.paste(target, (0, 0))
    four.paste(current, (1536, 0))
    four.paste(clay, (0, 864))
    four.paste(final, (1536, 864))
    four.save(REVIEW / "08_four-up-review-sheet.png", optimize=True)

    evidence = {
        "role_lock": {
            "quality_target": str(TARGET.relative_to(ROOT)).replace("\\", "/"),
            "current_gameplay": str(CURRENT.relative_to(ROOT)).replace("\\", "/"),
            "target_is_always_left_in_side_by_side": True,
        },
        "target": {"sha256": sha256(TARGET), "dimensions": list(load_panel(TARGET).size)},
        "current": {"sha256": sha256(CURRENT), "dimensions": list(load_panel(CURRENT).size)},
        "outputs": {
            "side_by_side": {"dimensions": list(side.size)},
            "four_up": {"dimensions": list(four.size)},
        },
    }
    (ROOT / ".art-work/meadow-wake-opening/comparison-evidence.json").write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
