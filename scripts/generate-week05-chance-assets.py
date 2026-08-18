"""Generate deterministic Week 05 teaching visuals for Contents Programming."""

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
GREEN = "#6F8F7E"
GREEN_LIGHT = "#A9BDAF"
OCHRE = "#D39B2A"
CORAL = "#C96F5D"
GRAY = "#CBC4B5"
WHITE = "#FFFDF7"


def scaled(value: float) -> int:
    return round(value * SCALE)


def new_canvas(width: int, height: int, color: str = PAPER):
    image = Image.new("RGB", (scaled(width), scaled(height)), color)
    return image, ImageDraw.Draw(image)


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


def save(image, filename, width, height):
    output = image.resize((width, height), Image.Resampling.LANCZOS)
    output.save(ASSET_DIRECTORY / filename, optimize=True)


def panel(draw, left, top, width=320, height=500):
    rounded_rectangle(
        draw,
        (left, top, left + width, top + height),
        16,
        WHITE,
        GRAY,
        2,
    )


def generate_chance_spectrum():
    """Contrast fixed repetition, weak constraints, and controlled chance."""

    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    palette = [INK, GREEN, OCHRE, CORAL]
    panel_lefts = [70, 440, 810]

    for left in panel_lefts:
        panel(draw, left, 90)

    # Fixed order: the next color and position are fully predictable.
    for row in range(5):
        for column in range(5):
            left = panel_lefts[0] + 42 + column * 57
            top = 135 + row * 83
            rectangle(
                draw,
                (left, top, left + 39, top + 39),
                palette[(row + column) % len(palette)],
            )

    # Weak constraints: positions and sizes are allowed to collide and crop.
    loose_random = random.Random(13)
    for _ in range(30):
        size = loose_random.randint(18, 105)
        left = loose_random.randint(panel_lefts[1] - 30, panel_lefts[1] + 295)
        top = loose_random.randint(65, 555)
        color = loose_random.choice(palette)
        ellipse(draw, (left, top, left + size, top + size), color)

    # Controlled chance: choices vary, but every element stays on a grid.
    rule_random = random.Random(13)
    for row in range(5):
        for column in range(5):
            center_x = panel_lefts[2] + 48 + column * 56
            center_y = 154 + row * 83
            size = rule_random.randint(22, 46)
            color = rule_random.choice(palette)
            ellipse(
                draw,
                (
                    center_x - size / 2,
                    center_y - size / 2,
                    center_x + size / 2,
                    center_y + size / 2,
                ),
                color,
            )

    line(draw, [(110, 620), (1090, 620)], GREEN_LIGHT, 2)
    save(image, "week-05-chance-spectrum.png", width, height)


def draw_seed_panel(draw, left, seed):
    panel(draw, left, 90)
    generator = random.Random(seed)
    palette = [INK, GREEN, OCHRE, CORAL]
    inner_left = left + 24
    inner_top = 114
    inner_width = 272
    inner_height = 452

    for _ in range(32):
        size = generator.randint(18, 64)
        x = generator.randint(inner_left, inner_left + inner_width - size)
        y = generator.randint(inner_top, inner_top + inner_height - size)
        color = generator.choice(palette)
        ellipse(draw, (x, y, x + size, y + size), color)


def generate_seed_variations():
    """Show three outputs made from one rule and three seed values."""

    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    for left, seed in zip((70, 440, 810), (7, 21, 42)):
        draw_seed_panel(draw, left, seed)
    save(image, "week-05-seed-variations.png", width, height)


def generate_condition_branches():
    """Map small, medium, and large values to three visual branches."""

    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    rounded_rectangle(draw, (70, 75, 1130, 605), 18, WHITE, GRAY, 2)

    generator = random.Random(29)
    sizes = [generator.randint(20, 78) for _ in range(42)]

    for index, size in enumerate(sizes):
        column = index % 14
        row = index // 14
        center_x = 125 + column * 73
        center_y = 175 + row * 155

        if size >= 60:
            color = CORAL
            rectangle(
                draw,
                (
                    center_x - size / 2,
                    center_y - size / 2,
                    center_x + size / 2,
                    center_y + size / 2,
                ),
                color,
            )
        elif size >= 40:
            color = OCHRE
            ellipse(
                draw,
                (
                    center_x - size / 2,
                    center_y - size / 2,
                    center_x + size / 2,
                    center_y + size / 2,
                ),
                color,
            )
        else:
            color = GREEN
            ellipse(
                draw,
                (
                    center_x - size / 2,
                    center_y - size / 2,
                    center_x + size / 2,
                    center_y + size / 2,
                ),
                color,
                INK,
                2,
            )

    save(image, "week-05-condition-branches.png", width, height)


def main():
    ASSET_DIRECTORY.mkdir(parents=True, exist_ok=True)
    generate_chance_spectrum()
    generate_seed_variations()
    generate_condition_branches()


if __name__ == "__main__":
    main()
