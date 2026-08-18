"""Generate deterministic Week 04 teaching visuals for Contents Programming."""

from math import cos, pi, sin
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


def rotated_square(draw, center_x, center_y, size, angle, fill):
    radius = size / 2
    points = []
    for corner in range(4):
        theta = angle + pi / 4 + corner * pi / 2
        points.append(
            (
                scaled(center_x + cos(theta) * radius),
                scaled(center_y + sin(theta) * radius),
            )
        )
    draw.polygon(points, fill=fill)


def save(image, filename, width, height):
    output = image.resize((width, height), Image.Resampling.LANCZOS)
    output.save(ASSET_DIRECTORY / filename, optimize=True)


def generate_rule_grid():
    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    rounded_rectangle(draw, (80, 70, 1120, 610), 18, WHITE, GRAY, 2)

    for row in range(4):
        for column in range(7):
            x = 190 + column * 135
            y = 175 + row * 105
            angle = (column - 3) * 0.045 + row * 0.025
            offset = 20 if (row, column) == (2, 4) else 0
            color = OCHRE if (row, column) == (2, 4) else INK
            rotated_square(draw, x + offset, y, 54, angle, color)

    line(draw, [(140, 545), (1060, 545)], GREEN_LIGHT, 3)
    for column in range(8):
        x = 140 + column * 131
        ellipse(draw, (x - 6, 539, x + 6, 551), GREEN)

    save(image, "week-04-case-rule-grid.png", width, height)


def generate_rhythm_compression():
    width, height = 1200, 680
    image, draw = new_canvas(width, height, INK)
    rounded_rectangle(draw, (75, 65, 1125, 615), 18, "#1B3443", GREEN_LIGHT, 2)

    x = 145
    for index in range(13):
        diameter = 62 + abs(6 - index) * 4
        y = 340 - diameter / 2
        ellipse(
            draw,
            (x, y, x + diameter, y + diameter),
            GREEN if index % 2 == 0 else OCHRE,
        )
        x += max(48, 108 - index * 5)

    line(draw, [(145, 500), (1050, 500)], "#557181", 2)
    for index in range(12):
        marker_x = 170 + index * (76 - min(index, 8) * 3)
        line(draw, [(marker_x, 488), (marker_x, 512)], PAPER_DARK, 3)

    save(image, "week-04-case-rhythm-compression.png", width, height)


def generate_instruction_system():
    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    rounded_rectangle(draw, (95, 70, 1105, 610), 18, WHITE, GRAY, 2)

    cell_size = 150
    start_x, start_y = 225, 110
    directions = [
        ((20, 75), (130, 75)),
        ((75, 20), (75, 130)),
        ((25, 125), (125, 25)),
        ((25, 25), (125, 125)),
    ]
    colors = [INK, GREEN, OCHRE, CORAL]

    for row in range(3):
        for column in range(5):
            left = start_x + column * cell_size
            top = start_y + row * cell_size
            rounded_rectangle(
                draw,
                (left, top, left + 126, top + 126),
                8,
                PAPER,
                GRAY,
                1,
            )
            line_count = 1 + ((row + column) % 3)
            for direction_index in range(line_count):
                start, end = directions[(row + column + direction_index) % 4]
                shift = direction_index * 10 - 6
                line(
                    draw,
                    [
                        (left + start[0] + shift, top + start[1]),
                        (left + end[0] + shift, top + end[1]),
                    ],
                    colors[(row + column) % len(colors)],
                    5,
                )

    save(image, "week-04-case-instruction-system.png", width, height)


def generate_linear_variations():
    width, height = 1200, 680
    image, draw = new_canvas(width, height)

    panels = [(70, 55, 1130, 235), (70, 250, 1130, 430), (70, 445, 1130, 625)]
    for panel in panels:
        rounded_rectangle(draw, panel, 16, WHITE, GRAY, 2)

    for index in range(6):
        x = 180 + index * 165
        ellipse(draw, (x, 110, x + 70, 180), GREEN)

    for index in range(6):
        size = 34 + index * 10
        x = 180 + index * 165
        y = 340 - size / 2
        ellipse(draw, (x, y, x + size, y + size), GREEN)

    x = 160
    for index in range(6):
        ellipse(draw, (x, 505, x + 58, 563), GREEN)
        x += 200 - index * 20

    save(image, "week-04-linear-variations.png", width, height)


def generate_palette_grid():
    width, height = 1200, 900
    image, draw = new_canvas(width, height)
    rounded_rectangle(draw, (100, 70, 1100, 830), 20, WHITE, GRAY, 2)

    palette = [INK, GREEN, OCHRE, CORAL]
    rows, columns = 4, 6
    start_x, start_y = 185, 160
    gap_x, gap_y = 150, 160

    for row in range(rows):
        color = palette[row]
        for column in range(columns):
            size = 58 + column * 5
            x = start_x + column * gap_x
            y = start_y + row * gap_y
            ellipse(
                draw,
                (x - size / 2, y - size / 2, x + size / 2, y + size / 2),
                color,
            )

    save(image, "week-04-palette-grid.png", width, height)


def draw_variation_panel(draw, left, top, palette, size_step, gap):
    rounded_rectangle(draw, (left, top, left + 320, top + 500), 14, WHITE, GRAY, 2)
    for row in range(4):
        for column in range(4):
            size = 34 + (column + row) * size_step
            x = left + 57 + column * gap
            y = top + 72 + row * 105
            ellipse(
                draw,
                (x - size / 2, y - size / 2, x + size / 2, y + size / 2),
                palette[row % len(palette)],
            )


def generate_grid_variations():
    width, height = 1200, 680
    image, draw = new_canvas(width, height)
    draw_variation_panel(draw, 70, 90, [INK, GREEN], 0, 72)
    draw_variation_panel(draw, 440, 90, [GREEN, OCHRE, CORAL, INK], 3, 72)
    draw_variation_panel(draw, 810, 90, [CORAL, OCHRE], 1, 78)
    save(image, "week-04-grid-variations.png", width, height)


def main():
    ASSET_DIRECTORY.mkdir(parents=True, exist_ok=True)
    generate_rule_grid()
    generate_rhythm_compression()
    generate_instruction_system()
    generate_linear_variations()
    generate_palette_grid()
    generate_grid_variations()


if __name__ == "__main__":
    main()
