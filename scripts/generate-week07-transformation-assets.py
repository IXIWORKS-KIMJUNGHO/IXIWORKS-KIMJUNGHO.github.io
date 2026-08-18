"""Generate deterministic Week 7 teaching visuals for image transformation lessons."""

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"

INK = (29, 33, 31, 255)
PAPER = (242, 238, 226, 255)
CREAM = (225, 217, 196, 255)
TEAL = (38, 104, 111, 255)
CORAL = (218, 92, 74, 255)
YELLOW = (234, 184, 62, 255)
BLUE = (70, 91, 145, 255)
MINT = (133, 177, 151, 255)


@dataclass(frozen=True)
class LayerSpec:
    """Describe one transformed layer without relying on tuple positions."""

    crop_box: tuple[int, int, int, int]
    target_size: tuple[int, int]
    angle: float
    alpha: int
    position: tuple[int, int]


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Return an available sans-serif font and keep the script portable."""

    names = (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        if bold
        else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    )
    for name in names:
        path = Path(name)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def rounded_panel(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int] = INK,
    width: int = 3,
    radius: int = 24,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def checkerboard(size: tuple[int, int], cell: int = 28) -> Image.Image:
    board = Image.new("RGBA", size, (248, 246, 240, 255))
    draw = ImageDraw.Draw(board)
    for row, y in enumerate(range(0, size[1], cell)):
        for column, x in enumerate(range(0, size[0], cell)):
            if (row + column) % 2:
                draw.rectangle(
                    (x, y, min(x + cell, size[0]), min(y + cell, size[1])),
                    fill=(218, 216, 209, 255),
                )
    return board


def source_poster(size: int = 900) -> Image.Image:
    image = Image.new("RGBA", (size, size), PAPER)
    draw = ImageDraw.Draw(image)

    margin = int(size * 0.07)
    draw.rectangle((margin, margin, size - margin, size - margin), outline=INK, width=6)
    draw.rectangle((margin, margin, int(size * 0.35), size - margin), fill=TEAL)
    draw.ellipse(
        (int(size * 0.18), int(size * 0.15), int(size * 0.72), int(size * 0.69)),
        fill=YELLOW,
        outline=INK,
        width=6,
    )
    draw.polygon(
        [
            (int(size * 0.58), int(size * 0.12)),
            (int(size * 0.88), int(size * 0.43)),
            (int(size * 0.54), int(size * 0.59)),
        ],
        fill=CORAL,
        outline=INK,
    )
    draw.rectangle(
        (int(size * 0.39), int(size * 0.55), int(size * 0.85), int(size * 0.84)),
        fill=BLUE,
        outline=INK,
        width=6,
    )
    for offset in range(0, int(size * 0.34), int(size * 0.055)):
        draw.line(
            (
                int(size * 0.1),
                int(size * 0.72) + offset,
                int(size * 0.33),
                int(size * 0.64) + offset,
            ),
            fill=CREAM,
            width=max(4, size // 130),
        )
    draw.ellipse(
        (int(size * 0.46), int(size * 0.61), int(size * 0.67), int(size * 0.82)),
        fill=MINT,
        outline=INK,
        width=5,
    )
    draw.line(
        (int(size * 0.09), int(size * 0.89), int(size * 0.91), int(size * 0.89)),
        fill=INK,
        width=7,
    )
    return image


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


def draw_label(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    kicker: str,
    title: str,
) -> None:
    x, y = position
    draw.text((x, y), kicker, fill=CORAL, font=font(20, bold=True))
    draw.text((x, y + 28), title, fill=INK, font=font(27, bold=True))


def make_transform_operations(source: Image.Image) -> Image.Image:
    width, height = 1440, 820
    image = Image.new("RGBA", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((62, 42), "ONE SOURCE, THREE TRANSFORMATIONS", fill=INK, font=font(38, bold=True))
    draw.text(
        (62, 91),
        "The source stays intact while each operation returns a new image.",
        fill=(75, 78, 72, 255),
        font=font(22),
    )

    panels = [
        (55, 145, 360, 750),
        (395, 145, 700, 750),
        (735, 145, 1040, 750),
        (1075, 145, 1380, 750),
    ]
    labels = [
        ("SOURCE", "Original"),
        ("CROP", "Select"),
        ("RESIZE", "Scale"),
        ("ROTATE", "Reframe"),
    ]

    crop = source.crop((170, 170, 730, 730))
    resized = crop.resize((300, 190), Image.Resampling.LANCZOS)
    rotated = resized.rotate(18, expand=True, resample=Image.Resampling.BICUBIC)
    previews = [source, crop, resized, rotated]

    for panel, label, preview in zip(panels, labels, previews, strict=True):
        rounded_panel(draw, panel, (250, 248, 241, 255), width=2)
        draw_label(draw, (panel[0] + 25, panel[1] + 26), *label)
        preview_area = (panel[0] + 25, panel[1] + 110, panel[2] - 25, panel[3] - 45)
        board = checkerboard(
            (preview_area[2] - preview_area[0], preview_area[3] - preview_area[1]),
            24,
        )
        image.alpha_composite(board, dest=(preview_area[0], preview_area[1]))
        fitted = contain(preview, (preview_area[2] - preview_area[0] - 24, preview_area[3] - preview_area[1] - 24))
        px = preview_area[0] + (preview_area[2] - preview_area[0] - fitted.width) // 2
        py = preview_area[1] + (preview_area[3] - preview_area[1] - fitted.height) // 2
        image.alpha_composite(fitted, dest=(px, py))
        draw.rectangle(preview_area, outline=(110, 111, 104, 255), width=2)

    for x in (371, 711, 1051):
        draw.line((x, 445, x + 14, 445), fill=INK, width=4)
        draw.polygon([(x + 14, 437), (x + 27, 445), (x + 14, 453)], fill=INK)

    return image


def transformed_layer(
    source: Image.Image,
    spec: LayerSpec,
) -> Image.Image:
    layer = source.copy().crop(spec.crop_box)
    layer = layer.resize(spec.target_size, Image.Resampling.LANCZOS)
    layer.putalpha(spec.alpha)
    layer = layer.rotate(
        spec.angle,
        expand=True,
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )
    return layer


def make_alpha_composite(source: Image.Image) -> Image.Image:
    width, height = 1440, 820
    image = Image.new("RGBA", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((58, 40), "RGBA LAYERS BECOME ONE COMPOSITION", fill=INK, font=font(38, bold=True))
    draw.text(
        (58, 88),
        "Position, opacity, and stacking order change what remains visible.",
        fill=(75, 78, 72, 255),
        font=font(22),
    )

    layer_specs = [
        LayerSpec((80, 80, 650, 650), (255, 255), -14, 145, (20, 30)),
        LayerSpec((250, 90, 830, 620), (255, 255), 17, 185, (175, 75)),
        LayerSpec((190, 300, 710, 820), (255, 255), -4, 220, (105, 215)),
    ]
    cards = [(48, 180), (300, 255), (552, 330)]
    colors = [TEAL, CORAL, YELLOW]
    layers: list[Image.Image] = []

    for index, (spec, card, color) in enumerate(zip(layer_specs, cards, colors, strict=True), start=1):
        layer = transformed_layer(source, spec)
        layers.append(layer)
        x, y = card
        rounded_panel(draw, (x, y, x + 310, y + 330), (250, 248, 241, 255), outline=color, width=5)
        board = checkerboard((250, 230), 20)
        image.alpha_composite(board, dest=(x + 30, y + 62))
        preview = contain(layer, (220, 200))
        image.alpha_composite(
            preview,
            dest=(x + 45 + (220 - preview.width) // 2, y + 77 + (200 - preview.height) // 2),
        )
        draw.text((x + 30, y + 20), f"LAYER {index}", fill=color, font=font(22, bold=True))
        draw.text((x + 30, y + 300), f"alpha {spec.alpha}", fill=INK, font=font(18))

    canvas = Image.new("RGBA", (500, 500), (29, 33, 31, 255))
    for layer, spec in zip(layers, layer_specs, strict=True):
        canvas.alpha_composite(layer, dest=spec.position)

    draw.line((880, 430, 945, 430), fill=INK, width=6)
    draw.polygon([(945, 415), (970, 430), (945, 445)], fill=INK)
    draw.text((865, 380), "COMPOSITE", fill=INK, font=font(20, bold=True))
    rounded_panel(draw, (985, 165, 1390, 735), (250, 248, 241, 255), width=3)
    final = contain(canvas, (355, 500))
    image.alpha_composite(final, dest=(1010, 205))
    draw.text((1010, 680), "1000 × 1000 RGBA", fill=CORAL, font=font(22, bold=True))
    return image


def make_prototype(source: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", (1000, 1000), INK)
    shared_crop_box = (140, 120, 760, 780)
    specs = [
        LayerSpec(shared_crop_box, (420, 420), -16, 150, (40, 70)),
        LayerSpec(shared_crop_box, (340, 340), 19, 190, (540, 110)),
        LayerSpec(shared_crop_box, (260, 260), -6, 225, (345, 555)),
    ]
    for spec in specs:
        layer = transformed_layer(source, spec)
        canvas.alpha_composite(layer, dest=spec.position)

    draw = ImageDraw.Draw(canvas)
    draw.rectangle((56, 56, 944, 944), outline=PAPER, width=4)
    draw.line((80, 870, 920, 870), fill=YELLOW, width=12)
    draw.rectangle((80, 890, 370, 920), fill=CORAL)
    draw.rectangle((390, 890, 920, 920), fill=TEAL)

    presentation = Image.new("RGBA", (1200, 900), PAPER)
    presentation_draw = ImageDraw.Draw(presentation)
    presentation_draw.text((58, 44), "TRANSFORMATION PROTOTYPE", fill=INK, font=font(38, bold=True))
    presentation_draw.text(
        (58, 92),
        "One crop, three scales, three rotations — one source image.",
        fill=(75, 78, 72, 255),
        font=font(22),
    )
    prototype = contain(canvas, (730, 730))
    presentation.alpha_composite(prototype, dest=(58, 145))

    rounded_panel(presentation_draw, (835, 160, 1145, 665), (250, 248, 241, 255), width=2)
    presentation_draw.text((870, 195), "SOURCE", fill=CORAL, font=font(19, bold=True))
    source_preview = contain(source, (240, 240))
    presentation.alpha_composite(source_preview, dest=(870, 235))
    presentation_draw.text((870, 510), "CROP", fill=INK, font=font(20, bold=True))
    presentation_draw.text((870, 548), "RESIZE", fill=INK, font=font(20, bold=True))
    presentation_draw.text((870, 586), "ROTATE", fill=INK, font=font(20, bold=True))
    presentation_draw.text((870, 624), "COMPOSITE", fill=INK, font=font(20, bold=True))
    presentation_draw.text((835, 715), "A prototype tests a visual rule,", fill=TEAL, font=font(23, bold=True))
    presentation_draw.text((835, 750), "not a finished midterm series.", fill=TEAL, font=font(23, bold=True))
    return presentation


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    source = source_poster()
    outputs = {
        "week-07-source-poster.png": source,
        "week-07-transform-operations.png": make_transform_operations(source),
        "week-07-alpha-composite.png": make_alpha_composite(source),
        "week-07-prototype-example.png": make_prototype(source),
    }
    for filename, image in outputs.items():
        image.convert("RGBA").save(ASSET_DIR / filename, optimize=True)
        print(f"generated {filename}: {image.width}x{image.height}")


if __name__ == "__main__":
    main()
