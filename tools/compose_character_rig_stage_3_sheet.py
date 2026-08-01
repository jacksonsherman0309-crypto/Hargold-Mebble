"""Compose Stage 3 deformation stress frames into per-hero review sheets."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "assets/blender/production"


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=("Hargold", "Mebble"), required=True)
    return parser.parse_args()


def font(size: int):
    paths = (
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    )
    for path in paths:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main():
    hero = arguments().hero
    inventory_path = PRODUCTION / f"{hero.lower()}_stage-3-deformation-inventory.json"
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    results = inventory["stressPoseReview"]["results"]
    columns = 5
    rows = (len(results) + columns - 1) // columns
    cell_w, cell_h = 560, 745
    header = 105
    sheet = Image.new("RGB", (columns*cell_w, header+rows*cell_h), (239, 236, 228))
    draw = ImageDraw.Draw(sheet)
    draw.text((32, 22), f"{hero.upper()} — STAGE 3 PRODUCTION SKIN & CORRECTIVE STRESS", fill=(24,42,25), font=font(34))
    draw.text((32, 66), "Actual locked surface • production weights • driven correctives • true-side view • static controls only", fill=(64,73,63), font=font(17))
    label_font = font(17)
    for index, result in enumerate(results):
        image = Image.open(ROOT / result["frame"]).convert("RGB")
        x = (index % columns) * cell_w
        y = header + (index // columns) * cell_h
        sheet.paste(image, (x, y))
        draw.rectangle((x, y, x+cell_w-1, y+cell_h-1), outline=(124,132,117), width=2)
        draw.rectangle((x, y, x+cell_w, y+48), fill=(22,57,29))
        draw.text((x+16, y+13), result["pose"].replace("_", " ").upper(), fill=(248,242,218), font=label_font)
    output = ROOT / inventory["stressPoseReview"]["sheet"]
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "PNG", optimize=True)
    inventory["stressPoseReview"]["framesRequireComposition"] = False
    inventory["stressPoseReview"]["sheetComposed"] = True
    inventory_path.write_text(json.dumps(inventory, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"hero": hero, "sheet": output.relative_to(ROOT).as_posix(), "poses": len(results), "size": sheet.size}))


if __name__ == "__main__":
    main()
