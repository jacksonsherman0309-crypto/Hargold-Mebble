"""Compose the joint-deformation stress renders into review boards."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "assets" / "previews" / "joint-deformation"
ZONES = ("shoulders", "elbows", "hips", "knees", "ankles")


def font(size: int, bold=False):
    candidates = (
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def fit(image, width, height):
    copy = image.copy()
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    return copy


def compose(hero: str):
    board = Image.new("RGB", (2260, 1420), (236, 238, 232))
    draw = ImageDraw.Draw(board)
    dark = (13, 22, 17)
    green = (29, 88, 43)
    amber = (205, 133, 20)
    draw.rectangle((0, 0, board.width, 158), fill=dark)
    draw.text(
        (54, 25),
        f"{hero.upper()} — JOINT DEFORMATION STRESS GATE",
        font=font(45, True),
        fill="white",
    )
    draw.text(
        (56, 96),
        "Neutral vs diagnostic extreme pose · preserve-volume + localized correction · visual approval pending",
        font=font(22),
        fill=(208, 220, 207),
    )

    left = 34
    top = 196
    column_width = 426
    image_height = 494
    for index, zone in enumerate(ZONES):
        x = left + index * 444
        draw.rounded_rectangle(
            (x, top, x + column_width, 1258),
            radius=15,
            fill=(31, 38, 34),
            outline=(111, 128, 113),
            width=2,
        )
        draw.text(
            (x + 18, top + 15),
            zone.upper(),
            font=font(24, True),
            fill="white",
        )
        for state_index, state in enumerate(("neutral", "stress")):
            path = INPUT / f"{hero.lower()}-{zone}-{state}.png"
            image = Image.open(path).convert("RGB")
            image = fit(image, column_width - 20, image_height)
            y = top + 56 + state_index * 510
            board.paste(image, (x + (column_width - image.width) // 2, y))
            label = "NEUTRAL" if state == "neutral" else "EXTREME STRESS"
            draw.rectangle((x + 12, y + image_height - 38, x + 190, y + image_height - 5), fill=dark)
            draw.text(
                (x + 22, y + image_height - 34),
                label,
                font=font(17, True),
                fill=(207, 226, 208) if state == "neutral" else (255, 211, 118),
            )

    draw.rectangle((0, 1280, board.width, 1420), fill=(245, 246, 240))
    draw.rectangle((0, 1280, board.width, 1288), fill=green)
    draw.text((48, 1310), "GATE STATUS", font=font(23, True), fill=green)
    draw.text(
        (218, 1310),
        "IN PROGRESS — structural implementation is validated separately; this board still requires senior visual review.",
        font=font(22),
        fill=dark,
    )
    draw.text(
        (48, 1353),
        "Reject any candy-wrapper twist, flattened deltoid, pinched elbow/hip/knee, sleeve or pant collapse, or broken ankle-to-boot flow.",
        font=font(20),
        fill=amber,
    )
    output = INPUT / f"{hero.lower()}-joint-deformation-stress.png"
    board.save(output, quality=95)
    print(f"HM_JOINT_STRESS_BOARD {output} {board.width}x{board.height}")


def main():
    heroes = sys.argv[1:] or ["Hargold", "Mebble"]
    for hero in heroes:
        compose(hero)


if __name__ == "__main__":
    main()
