"""Generate deterministic Week 06 teaching visuals for Contents Programming."""

import random
from pathlib import Path

from PIL import Image, ImageDraw


SCALE = 2
ASSET_DIRECTORY = (
    Path(__file__).resolve().parents[1]
    / "teaching"
    / "contents-programming"
    / "assets"
)

PAPER = "#F5F0E4"
PAPER_DARK = "#E7DFCF"
INK = "#243F50"
WHITE = "#FFFDF7"


def scaled(value: float) -> int:
    return round(value * SCALE)


def rounded_rectangle(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(
        tuple(scaled(value) for value in box),
        radius=scaled(radius),
        fill=fill,
        outline=outline,
        width=scaled(width),
    )


def rectangle(draw, box, fill, outline=None, width=1):
    draw.rectangle(
        tuple(scaled(value) for value in box),
        fill=fill,
        outline=outline,
        width=scaled(width),
    )


def ellipse(draw, box, fill, outline=None, width=1):
    draw.ellipse(
        tuple(scaled(value) for value in box),
        fill=fill,
        outline=outline,
        width=scaled(width),
    )


def line(draw, points, fill, width=1):
    draw.line(
        [(scaled(x), scaled(y)) for x, y in points],
        fill=fill,
        width=scaled(width),
    )


def draw_variant(
    draw,
    left,
    seed_number,
    shape_count,
    medium_threshold,
    large_threshold,
    palette,
):
    panel_top = 82
    panel_width = 320
    panel_height = 516
    rounded_rectangle(
        draw,
        (left, panel_top, left + panel_width, panel_top + panel_height),
        18,
        WHITE,
        PAPER_DARK,
        2,
    )

    background_color = palette[0]
    base_palette = palette[1:4]
    accent_color = palette[3]
    outline_color = palette[4]
    art_left = left + 20
    art_top = panel_top + 20
    art_size = 280
    rounded_rectangle(
        draw,
        (art_left, art_top, art_left + art_size, art_top + art_size),
        10,
        background_color,
    )

    generator = random.Random(seed_number)
    min_size = 12
    max_size = 42
    margin = 14

    for _ in range(shape_count):
        size = generator.randint(min_size, max_size)
        x = generator.randint(
            art_left + margin,
            art_left + art_size - margin - size,
        )
        y = generator.randint(
            art_top + margin,
            art_top + art_size - margin - size,
        )
        base_color = generator.choice(base_palette)

        if size >= large_threshold:
            rectangle(
                draw,
                (x, y, x + size, y + size),
                accent_color,
                outline_color,
                2,
            )
        elif size >= medium_threshold:
            ellipse(draw, (x, y, x + size, y + size), base_color)
        else:
            ellipse(
                draw,
                (x, y, x + size, y + size),
                background_color,
                base_color,
                3,
            )

    meter_top = art_top + art_size + 42
    meter_width = 250
    meter_left = left + 35
    line(draw, [(meter_left, meter_top), (meter_left + meter_width, meter_top)], PAPER_DARK, 6)
    seed_position = meter_left + (seed_number % 101) / 100 * meter_width
    ellipse(
        draw,
        (seed_position - 7, meter_top - 7, seed_position + 7, meter_top + 7),
        outline_color,
    )

    density_top = meter_top + 44
    density_columns = 10
    active_blocks = round(shape_count / 8)
    for index in range(density_columns):
        block_left = meter_left + index * 25
        fill = accent_color if index < active_blocks else PAPER_DARK
        rounded_rectangle(
            draw,
            (block_left, density_top, block_left + 17, density_top + 17),
            4,
            fill,
        )

    threshold_top = density_top + 47
    line(
        draw,
        [(meter_left, threshold_top), (meter_left + meter_width, threshold_top)],
        PAPER_DARK,
        6,
    )
    for threshold, color in (
        (medium_threshold, base_palette[1]),
        (large_threshold, accent_color),
    ):
        threshold_position = meter_left + (threshold - min_size) / (max_size - min_size) * meter_width
        rectangle(
            draw,
            (
                threshold_position - 5,
                threshold_top - 10,
                threshold_position + 5,
                threshold_top + 10,
            ),
            color,
        )


def generate_function_variations():
    width, height = 1200, 680
    image = Image.new("RGB", (scaled(width), scaled(height)), PAPER)
    draw = ImageDraw.Draw(image)

    variants = (
        (
            70,
            73,
            42,
            24,
            34,
            ("#EBF1FA", "#3070A6", "#5C9676", "#E65348", "#232A37"),
        ),
        (
            440,
            91,
            64,
            20,
            31,
            ("#F7EFD8", "#385A7C", "#B75E78", "#E5A839", "#202B38"),
        ),
        (
            810,
            127,
            52,
            28,
            37,
            ("#F1EAF6", "#62518B", "#318E88", "#E98245", "#302A3C"),
        ),
    )

    for variant in variants:
        draw_variant(draw, *variant)

    output = image.resize((width, height), Image.Resampling.LANCZOS)
    output.save(ASSET_DIRECTORY / "week-06-function-variations.png", optimize=True)


def main():
    ASSET_DIRECTORY.mkdir(parents=True, exist_ok=True)
    generate_function_variations()


if __name__ == "__main__":
    main()
