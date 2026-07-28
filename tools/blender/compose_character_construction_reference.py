"""Compose clean-room Hargold/Mebble construction-reference boards."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "assets" / "previews" / "construction-reference"
MANNEQUIN = ROOT / "assets" / "previews" / "mannequins"
BENCHMARK = ROOT / "assets" / "blender" / "character-construction-benchmark.json"


def font(size: int, bold=False):
    candidates = (
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def fit(image, box):
    copy = image.copy()
    copy.thumbnail((box[2] - box[0], box[3] - box[1]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2] - box[0] - copy.width) // 2
    y = box[1] + (box[3] - box[1] - copy.height) // 2
    return copy, (x, y)


def wrap(draw, text, width, used_font):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=used_font) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def compose_current_audit(hero: str, benchmark: dict):
    hero_data = benchmark["characters"][hero]
    board = Image.new("RGB", (2100, 1280), (239, 239, 232))
    draw = ImageDraw.Draw(board)
    dark = (14, 23, 18)
    green = (25, 75, 37)
    muted = (70, 82, 72)
    draw.rectangle((0, 0, board.width, 150), fill=dark)
    draw.text((56, 28), f"{hero.upper()} — CURRENT CONNECTED-BODY AUDIT", font=font(48, True), fill="white")
    draw.text(
        (58, 94),
        "Diagnostic render of the active body · not the target silhouette and not final topology",
        font=font(23),
        fill=(205, 218, 202),
    )

    labels = (
        ("neutral-front", "NEUTRAL FRONT"),
        ("neutral-side", "TRUE SIDE"),
        ("topology-front", "BODY WIREFRAME"),
        ("silhouette-side", "SOLID SILHOUETTE"),
        ("run-deformation-side", "RUN DEFORMATION"),
    )
    panel_width = 386
    left = 34
    top = 184
    for index, (key, label) in enumerate(labels):
        x0 = left + index * 410
        box = (x0, top, x0 + panel_width, top + 680)
        draw.rounded_rectangle(box, radius=14, fill=(31, 38, 34), outline=(118, 132, 119), width=2)
        path = INPUT / f"{hero.lower()}-{key}.png"
        image = Image.open(path).convert("RGB")
        fitted, location = fit(image, (x0 + 8, top + 8, x0 + panel_width - 8, top + 625))
        board.paste(fitted, location)
        draw.text((x0 + 18, top + 635), label, font=font(21, True), fill="white")

    detail_top = 910
    draw.rectangle((0, detail_top - 22, board.width, detail_top + 2), fill=green)
    draw.text((48, detail_top + 20), "LOCKED PROPORTION FRAME", font=font(27, True), fill=green)
    normalized = hero_data["normalized"]
    detail = (
        f"Frame: {hero_data['frame']}   ·   Height vs Hargold: {hero_data['heightRelativeToHargold']:.2f}×"
        + (f"   ·   Approx. heads tall: {hero_data['headsTall']:.2f}" if "headsTall" in hero_data else "")
        + f"   ·   Head: {normalized['headHeight']:.3f}   ·   Torso: {normalized['torsoHeight']:.3f}"
        + f"   ·   Visible legs: {normalized['visibleLegLength']:.3f}   ·   Arm: {normalized['armLengthShoulderToHand']:.3f}"
        + f"   ·   Foot: {normalized['footLength']:.3f}"
    )
    draw.text((48, detail_top + 62), detail, font=font(21), fill=dark)
    draw.text((48, detail_top + 112), "SILHOUETTE READ", font=font(23, True), fill=green)
    draw.text((270, detail_top + 112), " · ".join(hero_data["read"]), font=font(23), fill=dark)

    draw.text((48, detail_top + 164), "CONSTRUCTION PRIORITIES", font=font(23, True), fill=green)
    y = detail_top + 207
    for priority in hero_data["constructionPriorities"]:
        lines = wrap(draw, priority, 1880, font(21))
        draw.ellipse((60, y + 8, 70, y + 18), fill=green)
        for line in lines:
            draw.text((86, y), line, font=font(21), fill=muted)
            y += 29
        y += 4

    output = INPUT / f"{hero.lower()}-current-body-audit.png"
    board.save(output, quality=95)
    print(f"HM_CURRENT_BODY_AUDIT_BOARD {output} {board.width}x{board.height}")


def compose_target_reference(hero: str, benchmark: dict):
    hero_data = benchmark["characters"][hero]
    board = Image.new("RGB", (2100, 1280), (239, 239, 232))
    draw = ImageDraw.Draw(board)
    dark = (14, 23, 18)
    green = (25, 75, 37)
    muted = (70, 82, 72)
    draw.rectangle((0, 0, board.width, 150), fill=dark)
    draw.text((56, 28), f"{hero.upper()} — LOCKED CONSTRUCTION SOURCE REFERENCE", font=font(46, True), fill="white")
    draw.text(
        (58, 94),
        "Original featureless project frame · authoritative proportions, pivots, silhouette and action readability",
        font=font(23),
        fill=(205, 218, 202),
    )

    labels = (
        ("neutral", "NEUTRAL"),
        ("run-contact", "RUN CONTACT"),
        ("run-extension", "RUN EXTENSION"),
        ("jump-apex", "JUMP APEX"),
        ("landing-compression", "LANDING"),
        ("solid-silhouette", "SIDE SILHOUETTE"),
    )
    panel_width = 320
    left = 30
    top = 184
    for index, (key, label) in enumerate(labels):
        x0 = left + index * 342
        box = (x0, top, x0 + panel_width, top + 680)
        draw.rounded_rectangle(box, radius=14, fill=(31, 38, 34), outline=(118, 132, 119), width=2)
        path = MANNEQUIN / f"{hero.lower()}-mannequin-{key}.png"
        image = Image.open(path).convert("RGB")
        fitted, location = fit(image, (x0 + 8, top + 8, x0 + panel_width - 8, top + 625))
        board.paste(fitted, location)
        draw.text((x0 + 16, top + 635), label, font=font(19, True), fill="white")

    detail_top = 910
    draw.rectangle((0, detail_top - 22, board.width, detail_top + 2), fill=green)
    draw.text((48, detail_top + 20), "AUTHORITATIVE PROPORTION FRAME", font=font(27, True), fill=green)
    normalized = hero_data["normalized"]
    detail = (
        f"Frame: {hero_data['frame']}   ·   Height vs Hargold: {hero_data['heightRelativeToHargold']:.2f}×"
        + (f"   ·   Approx. heads tall: {hero_data['headsTall']:.2f}" if "headsTall" in hero_data else "")
        + f"   ·   Head: {normalized['headHeight']:.3f}   ·   Torso: {normalized['torsoHeight']:.3f}"
        + f"   ·   Visible legs: {normalized['visibleLegLength']:.3f}   ·   Arm: {normalized['armLengthShoulderToHand']:.3f}"
        + f"   ·   Foot: {normalized['footLength']:.3f}"
    )
    draw.text((48, detail_top + 62), detail, font=font(21), fill=dark)
    draw.text((48, detail_top + 112), "SILHOUETTE READ", font=font(23, True), fill=green)
    draw.text((270, detail_top + 112), " · ".join(hero_data["read"]), font=font(23), fill=dark)
    draw.text((48, detail_top + 164), "CONSTRUCTION PRIORITIES", font=font(23, True), fill=green)
    y = detail_top + 207
    for priority in hero_data["constructionPriorities"]:
        lines = wrap(draw, priority, 1880, font(21))
        draw.ellipse((60, y + 8, 70, y + 18), fill=green)
        for line in lines:
            draw.text((86, y), line, font=font(21), fill=muted)
            y += 29
        y += 4

    output = INPUT / f"{hero.lower()}-construction-reference.png"
    board.save(output, quality=95)
    print(f"HM_CONSTRUCTION_REFERENCE_BOARD {output} {board.width}x{board.height}")


def main():
    benchmark = json.loads(BENCHMARK.read_text(encoding="utf-8"))
    heroes = sys.argv[1:] or ["Hargold", "Mebble"]
    for hero in heroes:
        compose_current_audit(hero, benchmark)
        compose_target_reference(hero, benchmark)


if __name__ == "__main__":
    main()
