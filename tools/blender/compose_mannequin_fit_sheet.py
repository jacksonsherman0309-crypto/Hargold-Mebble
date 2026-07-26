"""Compose fixed-scale mannequin-fit review sheets and 40% overlay audits."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from animation_mannequin_spec import (
    REVIEW_FRAMES,
    REVIEW_SHEET_GROUPS,
    review_frame,
)


ROOT = Path(__file__).resolve().parents[2]
MANNEQUIN = ROOT / "assets" / "previews" / "mannequins"
FITTED = ROOT / "assets" / "previews" / "mannequin-fit"
PREVIEW = ROOT / "assets" / "previews"
OUTPUT = PREVIEW / "character-mannequin-comparison-sheet.png"
SPLIT_OUTPUTS = {
    "neutral": PREVIEW / "character-fit-neutral-alignment.png",
    "locomotion": PREVIEW / "character-fit-locomotion-frames.png",
    "air-actions": PREVIEW / "character-fit-air-action-frames.png",
}

COLUMNS = (
    ("Hargold", "mannequin", "COMPACT MANNEQUIN"),
    ("Hargold", "fitted", "HARGOLD FIT"),
    ("Mebble", "mannequin", "TALL MANNEQUIN"),
    ("Mebble", "fitted", "MEBBLE FIT"),
)


def font(size: int, bold: bool = False):
    candidates = (
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def row_by_key(key: str):
    return next(row for row in REVIEW_FRAMES if row["key"] == key)


def source_path(hero: str, kind: str, row: str) -> Path:
    directory = MANNEQUIN if kind == "mannequin" else FITTED
    return directory / f"{hero.lower()}-{kind}-{row}.png"


def fitted_with_locked_overlay(hero: str, row: str) -> Image.Image:
    fitted = Image.open(source_path(hero, "fitted", row)).convert("RGB")
    mannequin = Image.open(source_path(hero, "mannequin", row)).convert("RGB")
    if mannequin.size != fitted.size:
        raise ValueError(
            f"Locked overlay size mismatch for {hero} {row}: "
            f"{mannequin.size} != {fitted.size}"
        )
    return Image.blend(fitted, mannequin, 0.40)


def draw_na(draw, box, hero, row):
    x0, y0, x1, y1 = box
    draw.rectangle(box, fill="#252a25", outline="#697269", width=2)
    exclusive = row.get("exclusive")
    label = (
        "N/A\nHARGOLD-EXCLUSIVE ACTION"
        if exclusive == "Hargold"
        else "N/A\nMEBBLE-EXCLUSIVE ACTION"
    )
    draw.multiline_text(
        ((x0 + x1) // 2, (y0 + y1) // 2),
        label,
        anchor="mm",
        align="center",
        spacing=8,
        font=font(max(14, round((x1 - x0) * 0.052)), True),
        fill="#d9dfd5",
    )


def compose_sheet(
    rows,
    output: Path,
    *,
    panel_size: int,
    overlay_fitted: bool,
    subtitle: str,
):
    label_width = round(panel_size * 0.90)
    title_height = round(panel_size * 0.27)
    column_height = round(panel_size * 0.18)
    width = label_width + len(COLUMNS) * panel_size
    height = title_height + column_height + len(rows) * panel_size
    sheet = Image.new("RGB", (width, height), "#101510")
    draw = ImageDraw.Draw(sheet)
    title_font = font(round(panel_size * 0.085), True)
    heading_font = font(round(panel_size * 0.055), True)
    row_font = font(round(panel_size * 0.050), True)
    small_font = font(round(panel_size * 0.040))

    draw.rectangle((0, 0, width, title_height), fill="#0b0f0b")
    draw.text(
        (width // 2, round(title_height * 0.31)),
        "HARGOLD & MEBBLE — LOCKED MANNEQUIN FIT",
        anchor="ma",
        font=title_font,
        fill="#ffffff",
    )
    draw.text(
        (width // 2, round(title_height * 0.72)),
        subtitle,
        anchor="ma",
        font=small_font,
        fill="#c7d7c0",
    )

    heading_top = title_height
    draw.rectangle((0, heading_top, width, heading_top + column_height), fill="#183918")
    for column_index, (_, kind, label) in enumerate(COLUMNS):
        if overlay_fitted and kind == "fitted":
            label += " + 40% FRAME"
        x = label_width + column_index * panel_size + panel_size // 2
        draw.text(
            (x, heading_top + column_height // 2),
            label,
            anchor="mm",
            font=heading_font,
            fill="#ffffff",
        )

    missing = []
    for row_index, row in enumerate(rows):
        row_key = row["key"]
        y = title_height + column_height + row_index * panel_size
        row_fill = "#edf0e8" if row_index % 2 == 0 else "#e3e8dd"
        draw.rectangle((0, y, width, y + panel_size), fill=row_fill)
        draw.multiline_text(
            (18, y + panel_size // 2),
            row["label"].replace("  ", "\n", 1),
            anchor="lm",
            spacing=6,
            font=row_font,
            fill="#183918",
        )
        for column_index, (hero, kind, _) in enumerate(COLUMNS):
            x = label_width + column_index * panel_size
            box = (x + 6, y + 6, x + panel_size - 6, y + panel_size - 6)
            if review_frame(hero, row_key) is None:
                draw_na(draw, box, hero, row)
                continue
            source = source_path(hero, kind, row_key)
            if not source.exists():
                missing.append(str(source))
                draw.rectangle(box, outline="#9b2828", width=4)
                draw.text(
                    (x + panel_size // 2, y + panel_size // 2),
                    "MISSING",
                    anchor="mm",
                    font=heading_font,
                    fill="#9b2828",
                )
                continue
            panel = (
                fitted_with_locked_overlay(hero, row_key)
                if overlay_fitted and kind == "fitted"
                else Image.open(source).convert("RGB")
            )
            panel.thumbnail((panel_size - 12, panel_size - 12), Image.Resampling.LANCZOS)
            panel_x = x + (panel_size - panel.width) // 2
            panel_y = y + (panel_size - panel.height) // 2
            sheet.paste(panel, (panel_x, panel_y))
        draw.line(
            (0, y + panel_size - 1, width, y + panel_size - 1),
            fill="#b6c0af",
            width=1,
        )

    if missing:
        raise FileNotFoundError("Missing comparison panels:\n" + "\n".join(missing))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, optimize=True)
    print(f"HM_MANNEQUIN_FIT_SHEET {output} {sheet.width}x{sheet.height}")


def compose():
    compose_sheet(
        REVIEW_FRAMES,
        OUTPUT,
        panel_size=260,
        overlay_fitted=False,
        subtitle=(
            "One world-scale orthographic camera · true side · fixed floor/crop · "
            "exclusive cells remain N/A"
        ),
    )
    subtitles = {
        "neutral": "Neutral proportions, pure silhouette, and complete connected skeleton",
        "locomotion": "Locked contact, passing, extension, reversal, and slide frames",
        "air-actions": "Locked jump, ability, attack, recoil, landing, and victory frames",
    }
    for group, keys in REVIEW_SHEET_GROUPS.items():
        compose_sheet(
            [row_by_key(key) for key in keys],
            SPLIT_OUTPUTS[group],
            panel_size=360,
            overlay_fitted=True,
            subtitle=subtitles[group] + " · fitted columns include 40% mannequin overlay",
        )


if __name__ == "__main__":
    compose()
