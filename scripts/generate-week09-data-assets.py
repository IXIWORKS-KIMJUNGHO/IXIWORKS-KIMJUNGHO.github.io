"""Generate deterministic Week 9 CSV data and data-literacy visuals."""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import asdict, dataclass
from html import escape
from io import StringIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"

INK = (28, 31, 30, 255)
PAPER = (244, 241, 232, 255)
PANEL = (252, 250, 245, 255)
MUTED = (91, 94, 89, 255)
LINE = (166, 164, 154, 255)
TEAL = (37, 105, 111, 255)
CORAL = (219, 91, 74, 255)
YELLOW = (235, 184, 61, 255)
BLUE = (69, 91, 146, 255)
MINT = (132, 177, 151, 255)


@dataclass(frozen=True)
class CreativeActivityRecord:
    record_id: int
    date: str
    activity: str
    duration_min: int
    focus_level: int | str
    mood_before: str
    mood_after: str
    location_type: str
    used_reference: bool
    note: str


RECORDS = [
    CreativeActivityRecord(1, "2026-05-04", "스케치", 35, 3, "피곤함", "차분함", "집", True, "인물 손 연습"),
    CreativeActivityRecord(2, "2026-05-05", "코딩", 55, 4, "보통", "몰입함", "학교", True, "반복 패턴 수정"),
    CreativeActivityRecord(3, "2026-05-06", "읽기", 25, 2, "산만함", "보통", "이동 중", False, "전시 서문 읽기"),
    CreativeActivityRecord(4, "2026-05-07", "편집", 70, 5, "보통", "만족함", "학교", True, "중간 포스터 색 보정"),
    CreativeActivityRecord(5, "2026-05-08", "음악", 40, 3, "피곤함", "활기참", "집", False, "리듬 스케치"),
    CreativeActivityRecord(6, "2026-05-09", "스케치", 20, "", "산만함", "", "카페", True, "집중도 기록 누락"),
    CreativeActivityRecord(7, "2026-05-10", "코딩", 65, 4, "차분함", "만족함", "집", True, "함수 이름 정리"),
    CreativeActivityRecord(8, "2026-05-11", "읽기", 30, 3, "보통", "차분함", "도서관", False, "데이터 아트 사례"),
    CreativeActivityRecord(9, "2026-05-12", "편집", 45, 4, "피곤함", "보통", "학교", True, "레이어 순서 비교"),
    CreativeActivityRecord(10, "2026-05-13", "음악", 50, 5, "활기참", "몰입함", "연습실", False, "소리 질감 기록"),
    CreativeActivityRecord(11, "2026-05-14", "스케치", 28, 3, "보통", "차분함", "카페", True, "공간 형태 관찰"),
    CreativeActivityRecord(12, "2026-05-15", "코딩", 80, 5, "차분함", "만족함", "학교", True, "자동 검사 수정"),
    CreativeActivityRecord(13, "2026-05-16", "읽기", 18, 2, "피곤함", "보통", "이동 중", False, "짧은 논문 메모"),
    CreativeActivityRecord(14, "2026-05-17", "편집", 60, 4, "보통", "몰입함", "집", True, "포스터 여백 조정"),
    CreativeActivityRecord(15, "2026-05-18", "음악", 35, "", "산만함", "활기참", "연습실", False, "집중도 기록 누락"),
    CreativeActivityRecord(16, "2026-05-19", "스케치", 42, 4, "차분함", "만족함", "학교", True, "도형 변형 아이디어"),
    CreativeActivityRecord(17, "2026-05-20", "코딩", 75, 5, "보통", "몰입함", "집", True, "CSV 읽기 연습"),
    CreativeActivityRecord(18, "2026-05-21", "읽기", 32, 3, "피곤함", "차분함", "도서관", False, "데이터 윤리 사례"),
    CreativeActivityRecord(19, "2026-05-22", "편집", 48, 4, "보통", "만족함", "카페", True, "문장 길이 줄이기"),
    CreativeActivityRecord(20, "2026-05-23", "음악", 58, 4, "활기참", "몰입함", "연습실", False, "박자 변주 기록"),
    CreativeActivityRecord(21, "2026-05-24", "스케치", 24, 2, "산만함", "보통", "이동 중", False, "창문 형태 메모"),
    CreativeActivityRecord(22, "2026-05-25", "코딩", 68, 5, "차분함", "만족함", "학교", True, "데이터 카드 출력"),
    CreativeActivityRecord(23, "2026-05-26", "읽기", 38, 3, "보통", "차분함", "도서관", False, "공공데이터 설명서"),
    CreativeActivityRecord(24, "2026-05-27", "편집", 52, 4, "피곤함", "만족함", "집", True, "제출 파일 점검"),
]

FIELDNAMES = list(asdict(RECORDS[0]).keys())


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Return the repository-pinned Inter font for deterministic diagrams."""

    font_path = ROOT / "assets" / "fonts" / "inter-latin-variable.woff2"
    selected_font = ImageFont.truetype(str(font_path), size=size)
    selected_font.set_variation_by_name("Bold" if bold else "Regular")
    return selected_font


def rounded_panel(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int, int] = PANEL,
    outline: tuple[int, int, int, int] = INK,
    width: int = 3,
    radius: int = 24,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    color: tuple[int, int, int, int] = INK,
) -> None:
    draw.line((*start, *end), fill=color, width=5)
    x, y = end
    draw.polygon([(x, y), (x - 18, y - 11), (x - 18, y + 11)], fill=color)


def write_sample_csv(path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        writer.writerows(asdict(record) for record in RECORDS)


def sample_csv_text() -> str:
    csv_buffer = StringIO(newline="")
    writer = csv.DictWriter(csv_buffer, fieldnames=FIELDNAMES, lineterminator="\n")
    writer.writeheader()
    writer.writerows(asdict(record) for record in RECORDS)
    return csv_buffer.getvalue()


def make_observation_to_table() -> Image.Image:
    image = Image.new("RGBA", (1440, 820), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((58, 42), "FROM OBSERVATION TO A TABLE", fill=INK, font=font(40, bold=True))
    draw.text(
        (58, 94),
        "A question decides what we notice, record, and leave out.",
        fill=MUTED,
        font=font(23),
    )

    panels = [
        (48, 165, 330, 690),
        (390, 165, 672, 690),
        (732, 165, 1014, 690),
        (1074, 165, 1392, 690),
    ]
    labels = [
        ("01 QUESTION", "What happened?"),
        ("02 OBSERVE", "One session"),
        ("03 RECORD", "Named values"),
        ("04 TABLE", "One new row"),
    ]
    colors = [CORAL, TEAL, YELLOW, BLUE]

    for panel, (kicker, title), color in zip(panels, labels, colors, strict=True):
        rounded_panel(draw, panel, outline=color, width=5)
        draw.text((panel[0] + 24, panel[1] + 24), kicker, fill=color, font=font(19, bold=True))
        draw.text((panel[0] + 24, panel[1] + 58), title, fill=INK, font=font(27, bold=True))

    draw.text((78, 290), "Which activity", fill=INK, font=font(23, bold=True))
    draw.text((78, 326), "helps me focus?", fill=INK, font=font(23, bold=True))
    draw.text((78, 415), "The question", fill=MUTED, font=font(19))
    draw.text((78, 447), "comes first.", fill=MUTED, font=font(19))

    draw.ellipse((452, 288, 610, 446), fill=YELLOW, outline=INK, width=4)
    draw.rectangle((430, 450, 632, 520), fill=BLUE, outline=INK, width=4)
    draw.text((454, 545), "coding session", fill=MUTED, font=font(19))

    record_lines = [
        ("activity", "coding"),
        ("duration", "55 min"),
        ("focus", "4 / 5"),
        ("place", "school"),
    ]
    y = 275
    for key, value in record_lines:
        draw.text((764, y), key, fill=MUTED, font=font(18))
        draw.text((890, y), value, fill=INK, font=font(19, bold=True))
        draw.line((762, y + 31, 976, y + 31), fill=LINE, width=2)
        y += 72

    table_box = (1102, 275, 1364, 558)
    draw.rectangle(table_box, fill=(255, 255, 255, 255), outline=INK, width=3)
    row_height = 55
    column_x = [1102, 1180, 1276, 1364]
    for x in column_x[1:-1]:
        draw.line((x, table_box[1], x, table_box[3]), fill=LINE, width=2)
    for row in range(1, 5):
        y_line = table_box[1] + row * row_height
        draw.line((table_box[0], y_line, table_box[2], y_line), fill=LINE, width=2)
    draw.rectangle((1102, 275, 1364, 330), fill=(225, 233, 229, 255), outline=None)
    headers = ["id", "activity", "min"]
    header_x = [1118, 1192, 1290]
    for x, header in zip(header_x, headers, strict=True):
        draw.text((x, 291), header, fill=INK, font=font(15, bold=True))
    rows = [("1", "sketch", "35"), ("2", "coding", "55"), ("3", "reading", "25"), ("4", "editing", "70")]
    for row_index, row in enumerate(rows, start=1):
        y_text = 291 + row_index * row_height
        for x, value in zip(header_x, row, strict=True):
            draw.text((x, y_text), value, fill=INK, font=font(14))
    draw.rectangle((1102, 385, 1364, 440), outline=CORAL, width=5)
    draw.text((1126, 590), "one observation", fill=CORAL, font=font(18, bold=True))
    draw.text((1144, 618), "= one row", fill=CORAL, font=font(18, bold=True))

    for x in (342, 684, 1026):
        draw_arrow(draw, (x, 430), (x + 34, 430))

    draw.text((58, 742), "QUESTION > UNIT > VARIABLES > VALUES > ROW", fill=TEAL, font=font(23, bold=True))
    return image


def make_dataframe_anatomy() -> Image.Image:
    image = Image.new("RGBA", (1440, 900), PAPER)
    draw = ImageDraw.Draw(image)
    draw.text((58, 40), "ANATOMY OF A DATAFRAME", fill=INK, font=font(40, bold=True))
    draw.text(
        (58, 92),
        "Read the structure before calculating or drawing anything.",
        fill=MUTED,
        font=font(23),
    )

    table_left, table_top = 190, 220
    widths = [90, 190, 220, 210, 210]
    headers = ["index", "date", "activity", "duration_min", "focus_level"]
    rows = [
        ["0", "2026-05-04", "sketch", "35", "3"],
        ["1", "2026-05-05", "coding", "55", "4"],
        ["2", "2026-05-06", "reading", "25", "2"],
        ["3", "2026-05-07", "editing", "70", "5"],
        ["4", "2026-05-08", "music", "40", "NA"],
    ]
    row_height = 72
    x_positions = [table_left]
    for column_width in widths:
        x_positions.append(x_positions[-1] + column_width)
    table_right = x_positions[-1]
    table_bottom = table_top + row_height * (len(rows) + 1)

    draw.rectangle((table_left, table_top, table_right, table_bottom), fill=(255, 255, 255, 255), outline=INK, width=3)
    draw.rectangle((table_left, table_top, table_right, table_top + row_height), fill=(222, 232, 228, 255))
    draw.rectangle((table_left, table_top, x_positions[1], table_bottom), fill=(240, 229, 215, 255))
    for x in x_positions[1:-1]:
        draw.line((x, table_top, x, table_bottom), fill=LINE, width=2)
    for row_index in range(1, len(rows) + 1):
        y = table_top + row_index * row_height
        draw.line((table_left, y, table_right, y), fill=LINE, width=2)

    for column_index, header in enumerate(headers):
        draw.text((x_positions[column_index] + 15, table_top + 24), header, fill=INK, font=font(17, bold=True))
    for row_index, row in enumerate(rows, start=1):
        y = table_top + row_index * row_height + 24
        for column_index, value in enumerate(row):
            color = CORAL if value == "NA" else INK
            draw.text((x_positions[column_index] + 15, y), value, fill=color, font=font(17, bold=value == "NA"))

    draw.rectangle((table_left, table_top, table_right, table_top + row_height), outline=TEAL, width=6)
    draw.text((1020, 195), "HEADER", fill=TEAL, font=font(19, bold=True))
    draw.line((1002, 218, 918, 256), fill=TEAL, width=4)

    draw.rectangle((table_left, table_top + row_height, x_positions[1], table_bottom), outline=CORAL, width=6)
    draw.text((62, 408), "INDEX", fill=CORAL, font=font(19, bold=True))
    draw.line((132, 425, 188, 425), fill=CORAL, width=4)

    selected_row_top = table_top + row_height * 3
    draw.rectangle((table_left, selected_row_top, table_right, selected_row_top + row_height), outline=YELLOW, width=6)
    draw.text((1090, 428), "ONE ROW", fill=(169, 119, 17, 255), font=font(19, bold=True))
    draw.line((1072, 445, table_right + 4, selected_row_top + 36), fill=YELLOW, width=4)

    selected_column_left = x_positions[3]
    draw.rectangle((selected_column_left, table_top, x_positions[4], table_bottom), outline=BLUE, width=6)
    draw.text((795, 712), "ONE COLUMN", fill=BLUE, font=font(19, bold=True))

    na_box = (
        x_positions[4],
        table_top + row_height * 5,
        x_positions[5],
        table_top + row_height * 6,
    )
    draw.rectangle(na_box, outline=CORAL, width=7)
    draw.text((1090, 650), "MISSING VALUE", fill=CORAL, font=font(18, bold=True))

    dtype_y = 790
    dtype_items = [
        ("date", "text/date"),
        ("activity", "category/text"),
        ("duration_min", "number"),
        ("focus_level", "number + NA"),
    ]
    x = 190
    for name, dtype in dtype_items:
        rounded_panel(draw, (x, dtype_y, x + 260, dtype_y + 72), fill=PANEL, outline=LINE, width=2, radius=14)
        draw.text((x + 15, dtype_y + 12), name, fill=INK, font=font(15, bold=True))
        draw.text((x + 15, dtype_y + 39), dtype, fill=MUTED, font=font(14))
        x += 280
    return image


def reading_card_html() -> str:
    missing_focus = sum(record.focus_level == "" for record in RECORDS)
    missing_mood = sum(record.mood_after == "" for record in RECORDS)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Week 09 Data Reading Card Example</title>
  <meta name="description" content="A sample data reading card that records a dataset's structure, context, answerable question, and missing information before visualization.">
  <link rel="canonical" href="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-09-data-reading-card-example.html">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <meta property="og:title" content="Week 09 Data Reading Card Example">
  <meta property="og:description" content="A sample card for reading a dataset's structure, context, questions, and limits before visualization.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-09-data-reading-card-example.html">
  <meta property="og:image" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/python-data-art.svg">
  <meta property="og:image:alt" content="Python code, plotted points, bars, and a waveform composed as data art">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Week 09 Data Reading Card Example">
  <meta name="twitter:description" content="A sample card for reading a dataset before visualization.">
  <meta name="twitter:image" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/python-data-art.svg">
  <style>
    :root {{ color-scheme: light; --ink:#1c1f1e; --paper:#f4f1e8; --panel:#fcfaf5; --teal:#25696f; --coral:#a83e32; --line:#aaa69b; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; padding:36px; background:var(--paper); color:var(--ink); font-family:Arial,"Apple SD Gothic Neo",sans-serif; }}
    .skip-link {{ position:absolute; left:12px; top:-80px; padding:10px 14px; color:white; background:var(--ink); z-index:10; }}
    .skip-link:focus {{ top:12px; }}
    main {{ max-width:980px; margin:auto; border:3px solid var(--ink); background:var(--panel); padding:38px; }}
    .kicker {{ color:var(--coral); font-weight:800; letter-spacing:.12em; }}
    h1 {{ margin:.25rem 0 1rem; font-size:clamp(2rem,6vw,4.6rem); line-height:.95; }}
    .meta {{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); }}
    .meta div {{ background:var(--panel); padding:18px; }}
    .meta span,.question span {{ display:block; color:var(--teal); font-size:.78rem; font-weight:800; letter-spacing:.08em; margin-bottom:6px; }}
    .columns {{ display:flex; flex-wrap:wrap; gap:8px; margin:22px 0; }}
    .columns code {{ border:1px solid var(--ink); background:white; padding:8px 10px; }}
    .questions {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
    .question {{ border:2px solid var(--ink); padding:20px; min-height:140px; }}
    .question.missing {{ border-color:var(--coral); }}
    footer {{ margin-top:24px; padding-top:16px; border-top:2px solid var(--ink); display:flex; justify-content:space-between; font-weight:800; }}
    @media (max-width:720px) {{ body{{padding:16px}} .meta,.questions{{grid-template-columns:1fr}} main{{padding:24px}} }}
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <main id="main-content">
    <p class="kicker">DATA READING CARD / WEEK 09</p>
    <h1>Creative Activity Log</h1>
    <div class="meta">
      <div><span>SIZE</span><strong>{len(RECORDS)} rows × {len(FIELDNAMES)} columns</strong></div>
      <div><span>OBSERVATION UNIT</span><strong>one creative session</strong></div>
      <div><span>TIME RANGE</span><strong>2026-05-04 — 2026-05-27</strong></div>
      <div><span>SOURCE</span><strong>course-provided sample</strong></div>
      <div><span>USE</span><strong>course use / provided asset</strong></div>
      <div><span>MISSING</span><strong>focus {missing_focus} / mood_after {missing_mood}</strong></div>
    </div>
    <div class="columns">{''.join(f'<code>{escape(column)}</code>' for column in FIELDNAMES)}</div>
    <div class="questions">
      <article class="question">
        <span>ANSWERABLE QUESTION</span>
        <strong>How does average duration differ by activity?</strong>
        <p>Needed columns: activity + duration_min</p>
      </article>
      <article class="question missing">
        <span>NOT ANSWERABLE YET</span>
        <strong>Which sessions included another person?</strong>
        <p>No collaborator column was recorded.</p>
      </article>
    </div>
    <footer><span>READ BEFORE VISUALIZE</span><span>structure → context → question</span></footer>
  </main>
</body>
</html>
"""


def make_reading_card() -> Image.Image:
    image = Image.new("RGBA", (1200, 900), PAPER)
    draw = ImageDraw.Draw(image)
    rounded_panel(draw, (48, 42, 1152, 858), fill=PANEL, width=4, radius=12)
    draw.text((88, 78), "DATA READING CARD / WEEK 09", fill=CORAL, font=font(20, bold=True))
    draw.text((88, 118), "CREATIVE ACTIVITY LOG", fill=INK, font=font(45, bold=True))
    draw.text((88, 176), "Read the dataset before you visualize it.", fill=MUTED, font=font(22))

    stats = [
        ("SIZE", "24 rows", "10 columns"),
        ("UNIT", "one creative", "session"),
        ("RANGE", "May 04", "— May 27"),
    ]
    x = 88
    for label, line1, line2 in stats:
        rounded_panel(draw, (x, 230, x + 300, 360), fill=(248, 246, 239, 255), outline=LINE, width=2, radius=14)
        draw.text((x + 18, 248), label, fill=TEAL, font=font(16, bold=True))
        draw.text((x + 18, 278), line1, fill=INK, font=font(24, bold=True))
        draw.text((x + 18, 310), line2, fill=INK, font=font(21))
        x += 330

    draw.text((88, 400), "COLUMNS", fill=TEAL, font=font(17, bold=True))
    column_labels = ["date", "activity", "duration_min", "focus_level", "mood_before", "mood_after"]
    x, y = 88, 438
    for label in column_labels:
        label_width = int(draw.textlength(label, font=font(17))) + 34
        if x + label_width > 1110:
            x, y = 88, y + 58
        rounded_panel(draw, (x, y, x + label_width, y + 42), fill=(255, 255, 255, 255), outline=INK, width=2, radius=10)
        draw.text((x + 16, y + 11), label, fill=INK, font=font(17))
        x += label_width + 12

    question_top = 555
    rounded_panel(draw, (88, question_top, 566, 754), fill=(247, 250, 246, 255), outline=TEAL, width=4, radius=16)
    draw.text((116, question_top + 24), "ANSWERABLE QUESTION", fill=TEAL, font=font(17, bold=True))
    draw.text((116, question_top + 64), "How does average", fill=INK, font=font(24, bold=True))
    draw.text((116, question_top + 96), "duration differ", fill=INK, font=font(24, bold=True))
    draw.text((116, question_top + 128), "by activity?", fill=INK, font=font(24, bold=True))
    draw.text((116, question_top + 166), "activity + duration_min", fill=MUTED, font=font(17))

    rounded_panel(draw, (594, question_top, 1112, 754), fill=(253, 246, 242, 255), outline=CORAL, width=4, radius=16)
    draw.text((622, question_top + 24), "NOT ANSWERABLE YET", fill=CORAL, font=font(17, bold=True))
    draw.text((622, question_top + 64), "Which sessions", fill=INK, font=font(24, bold=True))
    draw.text((622, question_top + 96), "included another", fill=INK, font=font(24, bold=True))
    draw.text((622, question_top + 128), "person?", fill=INK, font=font(24, bold=True))
    draw.text((622, question_top + 166), "collaborator column is missing", fill=MUTED, font=font(17))

    draw.line((88, 793, 1112, 793), fill=INK, width=3)
    draw.text((88, 812), "READ BEFORE VISUALIZE", fill=CORAL, font=font(20, bold=True))
    draw.text((778, 812), "structure > context > question", fill=TEAL, font=font(18, bold=True))
    return image


def markdown_cell(source: str) -> dict[str, object]:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source.strip().splitlines(keepends=True),
    }


def code_cell(source: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.strip().splitlines(keepends=True),
    }


def make_notebook() -> dict[str, object]:
    sample_csv = sample_csv_text()
    step_0 = f'''
# STEP 0 · 수업용 데이터와 도구 준비 — 이 셀은 수정하지 않습니다.
from pathlib import Path
from html import escape

import pandas as pd
from IPython.display import HTML, display

mission_step0_execution = get_ipython().execution_count
FALLBACK_SOURCE_PATH = "week09_creative_activity.csv"
SAMPLE_CSV = {sample_csv!r}

fallback_path = Path(FALLBACK_SOURCE_PATH)
if not fallback_path.exists():
    fallback_path.write_text(SAMPLE_CSV, encoding="utf-8")

print("준비 완료:", fallback_path, "|", len(SAMPLE_CSV.splitlines()) - 1, "records")
'''
    step_1 = '''
# STEP 1 · EDIT — 제출 정보, 데이터 맥락, 질문을 자신의 내용으로 바꿉니다.
mission_step1_execution = get_ipython().execution_count

student_id = "학번"                       # 예: "20261234"
student_name = "이름"                     # 예: "김데이터"

source_choice = "provided"                # "provided" 또는 "own"
source_path = FALLBACK_SOURCE_PATH         # own이면 업로드한 CSV 파일명

dataset_title = "창작 활동 기록"
dataset_source = "수업용 예시 데이터 — 교수자 제공"
dataset_license = "수업 목적 사용 허용"
observation_unit = "한 번의 창작 활동"
time_range = "2026-05-04부터 2026-05-27까지"

answerable_question = "EDIT: 현재 열로 답할 수 있는 질문을 15자 이상 작성하세요."
needed_columns = ["activity", "duration_min"]
unanswerable_question = "EDIT: 현재 열로 답할 수 없는 질문을 15자 이상 작성하세요."
missing_information = "EDIT: 어떤 열이나 정보가 더 필요한지 15자 이상 설명하세요."

output_filename = f"week09_{student_id}_{student_name}_data_reading_card.html"
print("출력 예정:", output_filename)
'''
    step_2 = '''
# STEP 2 · 데이터 불러오기와 여섯 가지 구조 검사 — 이 셀은 수정하지 않습니다.
mission_step2_execution = get_ipython().execution_count

source_path = Path(source_path)
if not source_path.exists():
    raise FileNotFoundError(
        f"{source_path} 파일을 찾을 수 없습니다. 왼쪽 파일 패널과 철자를 확인하세요."
    )

source_bytes_before = source_path.read_bytes()
df = pd.read_csv(source_path)

preview = df.head()
dataset_shape = df.shape
column_names = df.columns.tolist()
column_types = df.dtypes.astype(str).to_dict()
missing_counts = df.isna().sum().astype(int).to_dict()

display(preview)
print("shape (rows, columns):", dataset_shape)
print("columns:", column_names)
print("dtypes:", column_types)
print("missing values:", missing_counts)
'''
    step_3 = '''
# STEP 3 · EDIT — 실제 행·열·값 하나를 골라 자신의 문장으로 설명합니다.
mission_step3_execution = get_ipython().execution_count

selected_row_index = 1
selected_column = "duration_min"
selected_value_explanation = (
    "EDIT: 선택한 행·열·값이 현실에서 무엇을 뜻하는지 20자 이상 설명하세요."
)

selected_value = df.loc[selected_row_index, selected_column]
print("선택한 행:", selected_row_index)
print("선택한 열:", selected_column)
print("선택한 값:", selected_value)
print("나의 설명:", selected_value_explanation)
'''
    step_4 = '''
# STEP 4 · 데이터 읽기 카드 HTML 생성 — 이 셀은 수정하지 않습니다.
mission_step4_execution = get_ipython().execution_count

def build_data_reading_card(metadata, dataframe, questions, evidence):
    safe_columns = "".join(
        f"<code>{escape(str(name))}</code>" for name in dataframe.columns
    )
    safe_missing = "".join(
        f"<li><code>{escape(str(name))}</code><strong>{int(count)}</strong></li>"
        for name, count in dataframe.isna().sum().items()
        if int(count) > 0
    ) or "<li><span>결측값 없음</span><strong>0</strong></li>"
    safe_needed = " + ".join(
        escape(str(name)) for name in questions["needed_columns"]
    )

    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(str(metadata['title']))} · Data Reading Card</title>
  <style>
    :root {{ color-scheme: light; --ink:#1c1f1e; --paper:#f4f1e8; --panel:#fcfaf5; --teal:#25696f; --coral:#a83e32; --line:#aaa69b; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; padding:36px; color:var(--ink); background:var(--paper); font-family:Arial,"Apple SD Gothic Neo",sans-serif; }}
    .skip-link {{ position:absolute; left:12px; top:-80px; padding:10px 14px; color:white; background:var(--ink); z-index:10; }}
    .skip-link:focus {{ top:12px; }}
    main {{ max-width:1000px; margin:auto; padding:40px; border:3px solid var(--ink); background:var(--panel); }}
    .kicker {{ color:var(--coral); font-weight:800; letter-spacing:.12em; }}
    h1 {{ margin:.2rem 0 1.4rem; font-size:clamp(2rem,6vw,4.5rem); line-height:1; }}
    h2 {{ margin-top:2rem; font-size:1rem; color:var(--teal); letter-spacing:.08em; }}
    .meta {{ display:grid; grid-template-columns:repeat(2,1fr); border:1px solid var(--line); background:var(--line); gap:1px; }}
    .meta div {{ padding:16px; background:var(--panel); }}
    .meta span,.question span {{ display:block; margin-bottom:6px; color:var(--teal); font-size:.76rem; font-weight:800; letter-spacing:.08em; }}
    .columns {{ display:flex; flex-wrap:wrap; gap:8px; }}
    .columns code {{ padding:7px 9px; border:1px solid var(--ink); background:white; }}
    .questions {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
    .question {{ min-height:160px; padding:20px; border:2px solid var(--teal); }}
    .question.missing {{ border-color:var(--coral); }}
    .question.missing span {{ color:var(--coral); }}
    .missing-list {{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; padding:0; list-style:none; }}
    .missing-list li {{ display:flex; justify-content:space-between; padding:10px; border:1px solid var(--line); }}
    .evidence {{ padding:18px; border-left:5px solid var(--teal); background:white; }}
    footer {{ display:flex; justify-content:space-between; gap:16px; margin-top:26px; padding-top:16px; border-top:2px solid var(--ink); font-weight:800; }}
    @media (max-width:720px) {{ body {{ padding:14px; }} main {{ padding:24px; }} .meta,.questions,.missing-list {{ grid-template-columns:1fr; }} footer {{ display:block; }} }}
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">본문 바로가기</a>
  <main id="main-content">
    <p class="kicker">DATA READING CARD / WEEK 09</p>
    <h1>{escape(str(metadata['title']))}</h1>
    <div class="meta">
      <div><span>SIZE</span><strong>{dataframe.shape[0]} rows × {dataframe.shape[1]} columns</strong></div>
      <div><span>OBSERVATION UNIT</span><strong>{escape(str(metadata['unit']))}</strong></div>
      <div><span>TIME RANGE</span><strong>{escape(str(metadata['period']))}</strong></div>
      <div><span>SOURCE</span><strong>{escape(str(metadata['source']))}</strong></div>
      <div><span>USE CONDITION</span><strong>{escape(str(metadata['license']))}</strong></div>
      <div><span>AUTHOR</span><strong>{escape(str(metadata['student_id']))} · {escape(str(metadata['student_name']))}</strong></div>
    </div>
    <h2>COLUMNS / 열</h2>
    <div class="columns">{safe_columns}</div>
    <h2>MISSING VALUES / 결측값</h2>
    <ul class="missing-list">{safe_missing}</ul>
    <div class="questions">
      <article class="question">
        <span>ANSWERABLE QUESTION</span>
        <strong>{escape(str(questions['answerable']))}</strong>
        <p>필요한 열: {safe_needed}</p>
      </article>
      <article class="question missing">
        <span>NOT ANSWERABLE YET</span>
        <strong>{escape(str(questions['unanswerable']))}</strong>
        <p>{escape(str(questions['missing_reason']))}</p>
      </article>
    </div>
    <h2>ONE VALUE IN CONTEXT / 실제 값 읽기</h2>
    <p class="evidence"><strong>index {evidence['row_index']} · {escape(str(evidence['column']))} = {escape(str(evidence['value']))}</strong><br>{escape(str(evidence['explanation']))}</p>
    <footer><span>READ BEFORE VISUALIZE</span><span>structure → context → question</span></footer>
  </main>
</body>
</html>"""

card_metadata = {
    "title": dataset_title,
    "source": dataset_source,
    "license": dataset_license,
    "unit": observation_unit,
    "period": time_range,
    "student_id": student_id,
    "student_name": student_name,
}
card_questions = {
    "answerable": answerable_question,
    "needed_columns": needed_columns,
    "unanswerable": unanswerable_question,
    "missing_reason": missing_information,
}
card_evidence = {
    "row_index": selected_row_index,
    "column": selected_column,
    "value": selected_value,
    "explanation": selected_value_explanation,
}
card_html = build_data_reading_card(card_metadata, df, card_questions, card_evidence)

Path(output_filename).write_text(card_html, encoding="utf-8")
display(HTML(card_html))
print("카드 저장 완료:", output_filename)
'''
    final_check = '''
# FINAL CHECK · 런타임 재시작 후 STEP 0부터 여기까지 모두 실행합니다.
mission_final_execution = get_ipython().execution_count

execution_order_ok = (
    mission_step0_execution,
    mission_step1_execution,
    mission_step2_execution,
    mission_step3_execution,
    mission_step4_execution,
    mission_final_execution,
) == (1, 2, 3, 4, 5, 6)

safe_student_id = str(student_id).strip()
safe_student_name = str(student_name).strip()
expected_output_filename = (
    f"week09_{safe_student_id}_{safe_student_name}_data_reading_card.html"
)
provided_source_ok = (
    source_choice == "provided"
    and source_path.name == FALLBACK_SOURCE_PATH
    and source_bytes_before == SAMPLE_CSV.encode("utf-8")
    and dataset_title == "창작 활동 기록"
    and dataset_source == "수업용 예시 데이터 — 교수자 제공"
    and dataset_license == "수업 목적 사용 허용"
    and observation_unit == "한 번의 창작 활동"
    and time_range == "2026-05-04부터 2026-05-27까지"
)
own_source_ok = (
    source_choice == "own"
    and source_path.name != FALLBACK_SOURCE_PATH
    and dataset_title != "창작 활동 기록"
    and dataset_source != "수업용 예시 데이터 — 교수자 제공"
    and dataset_license != "수업 목적 사용 허용"
    and observation_unit != "한 번의 창작 활동"
    and time_range != "2026-05-04부터 2026-05-27까지"
)
selected_value_token = str(selected_value)

checks = {
    "새 런타임에서 STEP 0부터 순서대로 실행": execution_order_ok,
    "학번 수정": safe_student_id not in {"", "학번", "20260000"},
    "이름 수정": safe_student_name not in {"", "이름", "홍길동"},
    "파일명에 사용할 수 없는 / 제외": "/" not in safe_student_id + safe_student_name,
    "provided 또는 own 출처 선택": provided_source_ok or own_source_ok,
    "출처·이용 조건·관찰 단위·기간 기록": all(
        isinstance(value, str) and len(value.strip()) >= 4
        for value in [
            dataset_title,
            dataset_source,
            dataset_license,
            observation_unit,
            time_range,
        ]
    ),
    "원본 CSV 보존": source_path.read_bytes() == source_bytes_before,
    "최소 5행 4열": df.shape[0] >= 5 and df.shape[1] >= 4,
    "수치형 열 포함": len(df.select_dtypes(include="number").columns) >= 1,
    "문자 또는 범주형 열 포함": len(df.select_dtypes(exclude="number").columns) >= 1,
    "답할 수 있는 질문 직접 작성": not answerable_question.strip().startswith("EDIT:")
    and len(answerable_question.strip()) >= 15,
    "질문에 필요한 열 한 개 이상": len(needed_columns) >= 1
    and set(needed_columns).issubset(df.columns),
    "답할 수 없는 질문 직접 작성": not unanswerable_question.strip().startswith("EDIT:")
    and len(unanswerable_question.strip()) >= 15,
    "누락 정보 직접 설명": not missing_information.strip().startswith("EDIT:")
    and len(missing_information.strip()) >= 15,
    "선택한 행이 실제 인덱스에 존재": selected_row_index in df.index,
    "선택한 열이 실제 열에 존재": selected_column in df.columns,
    "선택한 값 설명 직접 작성": not selected_value_explanation.strip().startswith("EDIT:")
    and len(selected_value_explanation.strip()) >= 20,
    "설명과 선택한 행·열·값 일치": str(selected_row_index) in selected_value_explanation
    and selected_column in selected_value_explanation
    and selected_value_token in selected_value_explanation,
    "정확한 HTML 파일명": output_filename == expected_output_filename,
    "HTML 파일 생성": Path(output_filename).exists(),
    "카드에 데이터 제목 포함": escape(dataset_title) in card_html,
    "카드에 두 질문 포함": escape(answerable_question) in card_html
    and escape(unanswerable_question) in card_html,
    "카드에 실제 값 설명 포함": escape(selected_value_explanation) in card_html,
}

failed_checks = [label for label, passed in checks.items() if not passed]
for label, passed in checks.items():
    print("PASS" if passed else "FIX ", "·", label)

if failed_checks:
    raise AssertionError("수정할 항목: " + ", ".join(failed_checks))

print("\\n🎉 WEEK 09 DATA READING COMPLETE")
print("제출 1:", f"week09_{safe_student_id}_{safe_student_name}.ipynb")
print("제출 2:", output_filename)
'''

    return {
        "cells": [
            markdown_cell(
                """
# Week 09 · 데이터 읽기 카드 미션

CSV를 시각화하기 전에 구조와 맥락을 읽고, 독립적으로 열 수 있는 HTML 카드를 만듭니다.
코드 경험이 없어도 **STEP 1과 STEP 3의 값만 수정**하면 완성할 수 있습니다.

## 귀가 조건

1. 파일명을 `week09_학번_이름.ipynb`로 바꿉니다.
2. **런타임 → 런타임 다시 시작** 후 STEP 0부터 FINAL CHECK까지 순서대로 모두 실행합니다.
3. `🎉 WEEK 09 DATA READING COMPLETE`를 확인합니다.
4. 실행 결과가 보이는 `.ipynb`와 생성된 `_data_reading_card.html` 두 파일을 제출합니다.
"""
            ),
            markdown_cell(
                """
## STEP 0 · 준비

수업용 CSV가 없다면 같은 내용의 파일을 자동으로 만듭니다. 이 셀은 수정하지 않습니다.
"""
            ),
            code_cell(step_0),
            markdown_cell(
                """
## STEP 1 · 나와 데이터에 관한 정보

`EDIT` 영역의 학번·이름을 반드시 바꿉니다. 자신의 CSV를 쓰는 경우 `source_choice`를 `own`으로 바꾸고, 파일명·제목·출처·이용 조건·관찰 단위·기간·질문을 모두 자신의 자료에 맞게 수정합니다. 이름·연락처·정확한 위치 같은 개인정보가 포함된 파일은 사용하지 않습니다.
"""
            ),
            code_cell(step_1),
            markdown_cell(
                """
## STEP 2 · 구조 확인

이 셀은 원본 CSV의 바이트를 기억한 뒤 pandas로 읽습니다. 앞부분, 크기, 열 이름, 자료형, 결측값을 차례대로 확인합니다. 출력의 `(24, 10)`은 **24행, 10열**이라는 뜻입니다.
"""
            ),
            code_cell(step_2),
            markdown_cell(
                """
## STEP 3 · 실제 값 하나를 문장으로 읽기

표에 실제로 존재하는 인덱스와 열을 하나 고릅니다. 설명에는 **어느 행, 어느 열, 어떤 값이며 현실에서 무엇을 뜻하는지**를 20자 이상으로 적습니다.
"""
            ),
            code_cell(step_3),
            markdown_cell(
                """
## STEP 4 · HTML 카드 생성

작성한 정보와 검사 결과를 하나의 웹 문서로 만듭니다. 화면에 카드가 보이고 파일 저장 메시지가 나오면 정상입니다. 이 셀은 수정하지 않습니다.
"""
            ),
            code_cell(step_4),
            markdown_cell(
                """
## FINAL CHECK · PASS 확인

먼저 **런타임 → 런타임 다시 시작**을 누릅니다. 그다음 **런타임 → 모두 실행**을 눌러 실행 번호가 1부터 6까지 이어지게 합니다. 실패한 줄은 `FIX`로 표시됩니다. 해당 STEP만 고친 뒤 다시 처음부터 실행합니다.
"""
            ),
            code_cell(final_check),
            markdown_cell(
                """
## 제출

- `week09_학번_이름.ipynb`
- `week09_학번_이름_data_reading_card.html`

두 파일의 이름과 업로드 상태를 확인한 뒤 제출합니다. 작업 속도는 평가하지 않습니다.
"""
            ),
        ],
        "metadata": {
            "colab": {"provenance": []},
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {"name": "python", "version": "3.x"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def generate_assets(asset_dir: Path) -> None:
    asset_dir.mkdir(parents=True, exist_ok=True)
    write_sample_csv(asset_dir / "week-09-creative-activity.csv")
    (asset_dir / "week-09-data-reading-card-example.html").write_text(
        reading_card_html(),
        encoding="utf-8",
    )
    (asset_dir / "week-09-data-literacy-mission.ipynb").write_text(
        json.dumps(make_notebook(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    images = {
        "week-09-observation-to-table.png": make_observation_to_table(),
        "week-09-dataframe-anatomy.png": make_dataframe_anatomy(),
        "week-09-data-reading-card-example.png": make_reading_card(),
    }
    for filename, image in images.items():
        image.save(asset_dir / filename, optimize=True)
        print(f"generated {filename}: {image.width}x{image.height}")
    print(f"generated week-09-creative-activity.csv: {len(RECORDS)} records")
    print("generated week-09-data-reading-card-example.html")
    print("generated week-09-data-literacy-mission.ipynb")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--asset-dir",
        type=Path,
        default=DEFAULT_ASSET_DIR,
        help="output directory (defaults to the course asset directory)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    generate_assets(parse_args().asset_dir.resolve())
