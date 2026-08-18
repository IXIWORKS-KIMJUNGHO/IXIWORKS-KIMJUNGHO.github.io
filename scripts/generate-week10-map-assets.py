"""Generate deterministic Week 10 location data and teaching visuals."""

from __future__ import annotations

import argparse
import csv
from dataclasses import asdict, dataclass
from pathlib import Path

import PIL
from PIL import Image, ImageDraw, ImageFont
from PIL import features

from week10_asset_runtime import PINNED_VERSIONS


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
FONT_PATH = ROOT / "assets" / "fonts" / "inter-latin-variable.woff2"

INK = (28, 31, 30, 255)
PAPER = (244, 241, 232, 255)
PANEL = (252, 250, 245, 255)
WHITE = (255, 255, 255, 255)
MUTED = (91, 94, 89, 255)
LINE = (166, 164, 154, 255)
TEAL = (37, 105, 111, 255)
CORAL = (219, 91, 74, 255)
YELLOW = (235, 184, 61, 255)
CORAL_TEXT = (166, 54, 43, 255)
OCHRE_TEXT = (117, 82, 0, 255)
BLUE = (69, 91, 146, 255)
MINT = (132, 177, 151, 255)
PALE_BLUE = (217, 231, 236, 255)
ROAD = (211, 207, 195, 255)


@dataclass(frozen=True)
class PlaceRecord:
    place_id: str
    place_name: str
    category: str
    program_count: int | str
    latitude: float | str
    longitude: float | str


VALID_RECORDS = [
    PlaceRecord("C001", "햇살도서관", "도서관", 48, 37.5665, 126.9780),
    PlaceRecord("C002", "나무도서관", "도서관", 35, 37.5720, 126.9900),
    PlaceRecord("C003", "구름도서관", "도서관", 62, 37.5840, 127.0120),
    PlaceRecord("C004", "샘물도서관", "도서관", 29, 37.5510, 126.9650),
    PlaceRecord("C005", "새봄도서관", "도서관", 54, 37.5380, 126.9920),
    PlaceRecord("C006", "한강도서관", "도서관", 41, 37.5200, 126.9400),
    PlaceRecord("C007", "별빛도서관", "도서관", 67, 37.6030, 127.0250),
    PlaceRecord("C008", "마루도서관", "도서관", 33, 37.6120, 126.9580),
    PlaceRecord("C009", "모양박물관", "박물관", 23, 37.5790, 126.9480),
    PlaceRecord("C010", "시간박물관", "박물관", 38, 37.5900, 126.9820),
    PlaceRecord("C011", "기록박물관", "박물관", 57, 37.5610, 127.0280),
    PlaceRecord("C012", "생활박물관", "박물관", 31, 37.5430, 127.0550),
    PlaceRecord("C013", "도시박물관", "박물관", 72, 37.5280, 127.0180),
    PlaceRecord("C014", "소리박물관", "박물관", 26, 37.5110, 126.9740),
    PlaceRecord("C015", "빛박물관", "박물관", 45, 37.5960, 127.0670),
    PlaceRecord("C016", "종이박물관", "박물관", 34, 37.6170, 127.0020),
    PlaceRecord("C017", "푸른문화센터", "문화센터", 52, 37.5700, 127.0440),
    PlaceRecord("C018", "열린문화센터", "문화센터", 64, 37.5480, 126.9250),
    PlaceRecord("C019", "다온문화센터", "문화센터", 28, 37.5320, 126.9550),
    PlaceRecord("C020", "누리문화센터", "문화센터", 49, 37.5150, 127.0410),
    PlaceRecord("C021", "이음문화센터", "문화센터", 70, 37.5880, 126.9300),
    PlaceRecord("C022", "마을문화센터", "문화센터", 37, 37.6070, 127.0480),
    PlaceRecord("C023", "함께문화센터", "문화센터", 58, 37.6250, 126.9850),
    PlaceRecord("C024", "오늘문화센터", "문화센터", 42, 37.5020, 127.0120),
]

PROBLEM_RECORDS = [
    PlaceRecord("X001", "누락좌표문화센터", "문화센터", 27, "", 127.0100),
    PlaceRecord("X002", "잘못된경도박물관", "박물관", 31, 37.5550, 226.9900),
    PlaceRecord("X003", "문자수치도서관", "도서관", "unknown", 37.5630, 126.9600),
    VALID_RECORDS[3],
    PlaceRecord("X004", "잘못된위도문화센터", "문화센터", 45, 95.0000, 127.0200),
]

ALL_RECORDS = VALID_RECORDS + PROBLEM_RECORDS
FIELDNAMES = list(asdict(ALL_RECORDS[0]).keys())


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Load the repository font at a fixed weight for reproducible diagrams."""

    if not FONT_PATH.is_file():
        raise FileNotFoundError(f"missing generated-asset font: {FONT_PATH}")
    loaded_font = ImageFont.truetype(str(FONT_PATH), size=size)
    loaded_font.set_variation_by_name("Bold" if bold else "Regular")
    return loaded_font


def validate_runtime() -> None:
    """Require the image stack used to create the committed PNG bytes."""

    freetype_version = features.version_module("freetype2")
    versions = {
        "Pillow": PIL.__version__,
        "freetype": freetype_version,
    }
    expected = {
        "Pillow": PINNED_VERSIONS["Pillow"],
        "freetype": PINNED_VERSIONS["freetype"],
    }
    if versions != expected:
        raise RuntimeError(
            "Week 10 asset runtime mismatch: "
            + ", ".join(
                f"{name} {versions[name]} (expected {expected[name]})"
                for name in expected
            )
        )
    print(
        "Week 10 asset runtime:",
        ", ".join(f"{name} {version}" for name, version in versions.items()),
    )


def rounded_panel(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    *,
    fill: tuple[int, int, int, int] = PANEL,
    outline: tuple[int, int, int, int] = INK,
    width: int = 3,
    radius: int = 24,
) -> None:
    draw.rounded_rectangle(
        box,
        radius=radius,
        fill=fill,
        outline=outline,
        width=width,
    )


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    color: tuple[int, int, int, int] = INK,
) -> None:
    draw.line((*start, *end), fill=color, width=5)
    x, y = end
    draw.polygon([(x, y), (x - 18, y - 11), (x - 18, y + 11)], fill=color)


def write_practice_csv(path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        writer.writerows(asdict(record) for record in ALL_RECORDS)


def marker_radius(program_count: int) -> int:
    minimum = min(record.program_count for record in VALID_RECORDS if isinstance(record.program_count, int))
    maximum = max(record.program_count for record in VALID_RECORDS if isinstance(record.program_count, int))
    return int(9 + (program_count - minimum) / (maximum - minimum) * 18)


def project_point(latitude: float, longitude: float) -> tuple[int, int]:
    min_latitude, max_latitude = 37.49, 37.64
    min_longitude, max_longitude = 126.90, 127.09
    x = 722 + int((longitude - min_longitude) / (max_longitude - min_longitude) * 636)
    y = 724 - int((latitude - min_latitude) / (max_latitude - min_latitude) * 478)
    return x, y


def make_location_encoding() -> Image.Image:
    image = Image.new("RGBA", (1440, 900), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((54, 38), "LOCATION DATA > VISUAL VARIABLES", fill=INK, font=font(44, bold=True))
    draw.text(
        (54, 91),
        "A map is a visual encoding system, not a neutral container.",
        fill=MUTED,
        font=font(27),
    )

    rounded_panel(draw, (48, 158, 642, 782), outline=TEAL, width=5)
    draw.text((78, 184), "TABLE: ONE PLACE PER ROW", fill=TEAL, font=font(26, bold=True))
    headers = ["place", "category", "value", "lat", "lon"]
    column_x = [78, 205, 350, 432, 515]
    table_top = 228
    row_height = 60
    draw.rectangle((70, table_top, 620, table_top + row_height * 6), fill=WHITE, outline=INK, width=3)
    draw.rectangle((70, table_top, 620, table_top + row_height), fill=(222, 232, 228, 255))
    for x in (192, 338, 421, 505):
        draw.line((x, table_top, x, table_top + row_height * 6), fill=LINE, width=2)
    for row_index in range(1, 6):
        y = table_top + row_height * row_index
        draw.line((70, y, 620, y), fill=LINE, width=2)
    for x, label in zip(column_x, headers, strict=True):
        draw.text((x, table_top + 18), label, fill=INK, font=font(19, bold=True))

    table_rows = [
        ("Sun", "library", "48", "37.57", "126.98"),
        ("Tree", "library", "35", "37.57", "126.99"),
        ("Shape", "museum", "23", "37.58", "126.95"),
        ("Open", "culture", "64", "37.55", "126.93"),
        ("Together", "culture", "58", "37.63", "126.99"),
    ]
    for row_index, row in enumerate(table_rows, start=1):
        y = table_top + row_height * row_index + 20
        for x, value in zip(column_x, row, strict=True):
            draw.text((x, y), value, fill=INK, font=font(18))

    draw.text((78, 624), "COLUMN ROLES", fill=CORAL_TEXT, font=font(24, bold=True))
    role_lines = [
        "lat + lon  -> position",
        "value      -> radius",
        "category   -> color",
        "name       -> tooltip",
    ]
    for index, line in enumerate(role_lines):
        draw.text((78, 658 + index * 30), line, fill=INK, font=font(22, bold=index == 0))

    rounded_panel(draw, (684, 158, 1392, 782), outline=BLUE, width=5)
    draw.text((714, 184), "MAP: ONE MARKER PER VALID ROW", fill=BLUE, font=font(26, bold=True))
    map_box = (710, 236, 1364, 742)
    draw.rectangle(map_box, fill=(234, 236, 226, 255), outline=INK, width=3)
    draw.polygon(
        [(710, 560), (840, 510), (980, 535), (1110, 490), (1240, 525), (1364, 470), (1364, 610), (1220, 640), (1080, 612), (940, 665), (810, 630), (710, 680)],
        fill=PALE_BLUE,
    )
    for offset in (45, 145, 245, 345, 445, 545):
        draw.line((710 + offset, 250, 745 + offset, 730), fill=ROAD, width=13)
    for offset in (60, 160, 260, 360, 460):
        draw.line((720, 250 + offset, 1350, 285 + offset), fill=ROAD, width=11)

    colors = {"도서관": TEAL, "박물관": CORAL, "문화센터": BLUE}
    for record in VALID_RECORDS:
        assert isinstance(record.latitude, float)
        assert isinstance(record.longitude, float)
        assert isinstance(record.program_count, int)
        x, y = project_point(record.latitude, record.longitude)
        radius = marker_radius(record.program_count)
        marker_color = colors[record.category]
        draw.ellipse(
            (x - radius, y - radius, x + radius, y + radius),
            fill=(*marker_color[:3], 205),
            outline=INK,
            width=2,
        )

    tooltip_box = (1000, 330, 1308, 432)
    rounded_panel(draw, tooltip_box, fill=WHITE, outline=CORAL, width=4, radius=16)
    draw.text((1022, 344), "Open Culture Center", fill=INK, font=font(22, bold=True))
    draw.text((1022, 378), "category: culture", fill=MUTED, font=font(19))
    draw.text((1022, 404), "programs: 64", fill=CORAL_TEXT, font=font(19, bold=True))

    draw_arrow(draw, (646, 450), (676, 450), TEAL)
    draw.text((54, 838), "POSITION · SIZE · COLOR · TEXT", fill=CORAL_TEXT, font=font(27, bold=True))
    draw.text((510, 840), "Each choice must answer the data question.", fill=MUTED, font=font(24))
    return image


def make_cleaning_to_map() -> Image.Image:
    image = Image.new("RGBA", (1440, 900), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((54, 38), "RAW CSV > CLEAN TABLE > FOLIUM MAP", fill=INK, font=font(44, bold=True))
    draw.text(
        (54, 91),
        "Cleaning decisions change which places can appear on the map.",
        fill=MUTED,
        font=font(27),
    )

    panels = [
        (48, 180, 348, 730),
        (394, 180, 694, 730),
        (740, 180, 1040, 730),
        (1086, 180, 1392, 730),
    ]
    labels = [
        ("01 RAW CSV", "29 rows", CORAL),
        ("02 CONVERT", "numeric types", YELLOW),
        ("03 FILTER", "24 valid rows", TEAL),
        ("04 MAP", "24 markers", BLUE),
    ]
    for box, (kicker, title, color) in zip(panels, labels, strict=True):
        rounded_panel(draw, box, outline=color, width=5)
        text_color = (
            CORAL_TEXT
            if color == CORAL
            else OCHRE_TEXT
            if color == YELLOW
            else color
        )
        draw.text((box[0] + 24, box[1] + 24), kicker, fill=text_color, font=font(22, bold=True))
        draw.text((box[0] + 24, box[1] + 62), title, fill=INK, font=font(30, bold=True))

    problems = [
        ("missing latitude", "X001"),
        ("longitude 226", "X002"),
        ("value = unknown", "X003"),
        ("duplicate C004", "C004"),
        ("latitude 95", "X004"),
    ]
    y = 304
    for problem, record_id in problems:
        draw.rectangle((74, y, 322, y + 56), fill=WHITE, outline=LINE, width=2)
        draw.text((88, y + 10), record_id, fill=CORAL_TEXT, font=font(19, bold=True))
        draw.text((152, y + 11), problem, fill=INK, font=font(17))
        y += 70

    convert_lines = [
        "program_count",
        "latitude",
        "longitude",
        "",
        "pd.to_numeric",
        "errors = coerce",
        "",
        "unknown -> NaN",
    ]
    y = 302
    for line in convert_lines:
        if line:
            draw.text(
                (422, y),
                line,
                fill=INK if "->" not in line else CORAL_TEXT,
                font=font(21, bold="numeric" in line or "NaN" in line),
            )
        y += 42

    filter_lines = [
        ("drop missing", "2 removed"),
        ("drop duplicate", "1 removed"),
        ("latitude range", "1 removed"),
        ("longitude range", "1 removed"),
        ("", ""),
        ("29 - 5", "24 rows"),
    ]
    y = 302
    for label, result in filter_lines:
        if label:
            draw.text((768, y), label, fill=INK, font=font(19))
            draw.text((922, y), result, fill=TEAL, font=font(18, bold=True))
        y += 58

    map_box = (1112, 286, 1366, 642)
    draw.rectangle(map_box, fill=(234, 236, 226, 255), outline=INK, width=3)
    for offset in (36, 98, 160, 222):
        draw.line((1114 + offset, 294, 1138 + offset, 635), fill=ROAD, width=8)
    for offset in (52, 122, 192, 262):
        draw.line((1118, 294 + offset, 1358, 318 + offset), fill=ROAD, width=8)
    marker_colors = [TEAL, CORAL, BLUE]
    for index in range(24):
        column = index % 6
        row = index // 6
        x = 1140 + column * 39 + (row % 2) * 8
        y = 330 + row * 73 + (column % 2) * 9
        radius = 7 + (index % 5) * 2
        color = marker_colors[index % 3]
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color, outline=INK, width=1)

    for x in (358, 704, 1050):
        draw_arrow(draw, (x, 455), (x + 26, 455))

    checklist = [
        "SOURCE PRESERVED AS raw_df",
        "INVALID ROWS DOCUMENTED",
        "ONE MARKER PER CLEAN ROW",
        "CSV AND HTML SAVED",
    ]
    for index, item in enumerate(checklist):
        draw.text((60 + index * 345, 790), item, fill=TEAL, font=font(18, bold=True))
    draw.text((54, 845), "29 RAW ROWS - 5 PROBLEMS = 24 VALID PLACES = 24 MAP MARKERS", fill=INK, font=font(24, bold=True))
    return image


def make_map_mission_preview() -> Image.Image:
    image = Image.new("RGBA", (1440, 900), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((54, 38), "INTERACTIVE MAP MISSION", fill=INK, font=font(44, bold=True))
    draw.text(
        (54, 91),
        "Clean 29 rows, encode 24 places, verify three files, then leave.",
        fill=MUTED,
        font=font(27),
    )

    rounded_panel(draw, (48, 158, 958, 782), outline=BLUE, width=5)
    draw.text((78, 184), "24 VALID ROWS = 24 MAP MARKERS", fill=BLUE, font=font(27, bold=True))
    map_box = (76, 238, 930, 742)
    draw.rectangle(map_box, fill=(234, 236, 226, 255), outline=INK, width=3)
    draw.polygon(
        [(76, 570), (230, 510), (390, 548), (548, 488), (720, 530), (930, 455), (930, 625), (742, 660), (560, 615), (372, 680), (200, 635), (76, 690)],
        fill=PALE_BLUE,
    )
    for offset in (72, 218, 364, 510, 656, 802):
        draw.line((76 + offset, 250, 112 + offset, 730), fill=ROAD, width=12)
    for offset in (68, 168, 268, 368):
        draw.line((88, 250 + offset, 916, 286 + offset), fill=ROAD, width=10)

    category_colors = {"도서관": TEAL, "박물관": CORAL, "문화센터": BLUE}
    for record in VALID_RECORDS:
        assert isinstance(record.latitude, float)
        assert isinstance(record.longitude, float)
        assert isinstance(record.program_count, int)
        x = 108 + int((record.longitude - 126.90) / 0.19 * 786)
        y = 700 - int((record.latitude - 37.49) / 0.15 * 424)
        radius = marker_radius(record.program_count)
        color = category_colors[record.category]
        draw.ellipse(
            (x - radius, y - radius, x + radius, y + radius),
            fill=(*color[:3], 212),
            outline=INK,
            width=2,
        )

    rounded_panel(draw, (594, 274, 898, 392), fill=WHITE, outline=TEAL, width=4, radius=14)
    draw.text((616, 292), "OPEN CULTURE CENTER", fill=INK, font=font(20, bold=True))
    draw.text((616, 326), "category  culture", fill=MUTED, font=font(18))
    draw.text((616, 354), "programs  64", fill=CORAL_TEXT, font=font(19, bold=True))

    rounded_panel(draw, (994, 158, 1392, 782), outline=TEAL, width=5)
    draw.text((1024, 184), "EXIT GATE", fill=TEAL, font=font(24, bold=True))
    draw.text((1024, 224), "PASS", fill=INK, font=font(54, bold=True))
    draw.text((1024, 286), "Complete every proof.", fill=MUTED, font=font(20))

    checks = [
        ("01", "SOURCE PRESERVED", "raw_df stays 29 rows"),
        ("02", "CLEAN DATA", "29 > 27 > 26 > 24"),
        ("03", "VISUAL ENCODING", "position · size · color · text"),
        ("04", "INTERPRETATION", "observation + limitation"),
        ("05", "THREE FILES", "notebook · CSV · HTML"),
    ]
    y = 338
    for number, title, note in checks:
        draw.rectangle((1022, y, 1364, y + 72), fill=WHITE, outline=LINE, width=2)
        draw.ellipse((1038, y + 20, 1070, y + 52), fill=TEAL, outline=INK, width=1)
        draw.text((1044, y + 28), "OK", fill=WHITE, font=font(11, bold=True))
        draw.text((1086, y + 12), number + "  " + title, fill=INK, font=font(18, bold=True))
        draw.text((1086, y + 40), note, fill=MUTED, font=font(16))
        y += 84

    draw.text((54, 838), "CLEAN · ENCODE · MAP · VERIFY", fill=CORAL_TEXT, font=font(27, bold=True))
    draw.text((608, 840), "A finite individual mission with visible evidence.", fill=MUTED, font=font(23))
    return image


def main(asset_dir: Path = ASSET_DIR) -> None:
    asset_dir.mkdir(parents=True, exist_ok=True)
    write_practice_csv(asset_dir / "week-10-public-facilities-practice.csv")
    make_location_encoding().convert("RGB").save(
        asset_dir / "week-10-location-encoding.png",
        optimize=True,
    )
    make_cleaning_to_map().convert("RGB").save(
        asset_dir / "week-10-cleaning-to-map.png",
        optimize=True,
    )
    make_map_mission_preview().convert("RGB").save(
        asset_dir / "week-10-map-mission-preview.png",
        optimize=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-dir", type=Path, default=ASSET_DIR)
    parser.add_argument("--check-runtime", action="store_true")
    arguments = parser.parse_args()
    validate_runtime()
    if not arguments.check_runtime:
        main(arguments.asset_dir)
