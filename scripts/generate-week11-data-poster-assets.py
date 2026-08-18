#!/usr/bin/env python3
"""Generate deterministic Week 11 data-poster teaching assets."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from collections import defaultdict
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from textwrap import dedent

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib import font_manager, ft2font
from matplotlib.patches import Rectangle


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
RUNTIME_REQUIREMENTS_PATH = ROOT / "requirements-week11-assets.txt"

PAPER = "#f3efe5"
PANEL = "#fffdf8"
INK = "#202523"
MUTED = "#59615e"
LINE = "#c7c8be"
TEAL = "#116e68"
CORAL = "#a23d34"
BLUE = "#365f91"
GOLD = "#b78916"
PALE_TEAL = "#dcebe6"
PALE_CORAL = "#f0ddd8"

FONT_PATH = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
FONT_BOLD_PATH = (
    Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans-Bold.ttf"
)
FONT = font_manager.FontProperties(fname=FONT_PATH)
FONT_BOLD = font_manager.FontProperties(fname=FONT_BOLD_PATH)


@dataclass(frozen=True)
class Facility:
    place_id: str
    place_name: str
    category: str
    program_count: int
    latitude: float
    longitude: float


FACILITIES = [
    Facility("C001", "햇살도서관", "도서관", 48, 37.5665, 126.9780),
    Facility("C002", "나무도서관", "도서관", 35, 37.5720, 126.9900),
    Facility("C003", "구름도서관", "도서관", 62, 37.5840, 127.0120),
    Facility("C004", "샘물도서관", "도서관", 29, 37.5510, 126.9650),
    Facility("C005", "새봄도서관", "도서관", 54, 37.5380, 126.9920),
    Facility("C006", "한강도서관", "도서관", 41, 37.5200, 126.9400),
    Facility("C007", "별빛도서관", "도서관", 67, 37.6030, 127.0250),
    Facility("C008", "마루도서관", "도서관", 33, 37.6120, 126.9580),
    Facility("C009", "모양박물관", "박물관", 23, 37.5790, 126.9480),
    Facility("C010", "시간박물관", "박물관", 38, 37.5900, 126.9820),
    Facility("C011", "기록박물관", "박물관", 57, 37.5610, 127.0280),
    Facility("C012", "생활박물관", "박물관", 31, 37.5430, 127.0550),
    Facility("C013", "도시박물관", "박물관", 72, 37.5280, 127.0180),
    Facility("C014", "소리박물관", "박물관", 26, 37.5110, 126.9740),
    Facility("C015", "빛박물관", "박물관", 45, 37.5960, 127.0670),
    Facility("C016", "종이박물관", "박물관", 34, 37.6170, 127.0020),
    Facility("C017", "푸른문화센터", "문화센터", 52, 37.5700, 127.0440),
    Facility("C018", "열린문화센터", "문화센터", 64, 37.5480, 126.9250),
    Facility("C019", "다온문화센터", "문화센터", 28, 37.5320, 126.9550),
    Facility("C020", "누리문화센터", "문화센터", 49, 37.5150, 127.0410),
    Facility("C021", "이음문화센터", "문화센터", 70, 37.5880, 126.9300),
    Facility("C022", "마을문화센터", "문화센터", 37, 37.6070, 127.0480),
    Facility("C023", "함께문화센터", "문화센터", 58, 37.6250, 126.9850),
    Facility("C024", "오늘문화센터", "문화센터", 42, 37.5020, 127.0120),
]

CATEGORY_DISPLAY = {
    "도서관": "Library",
    "박물관": "Museum",
    "문화센터": "Culture center",
}
CATEGORY_COLORS = {
    "도서관": TEAL,
    "박물관": CORAL,
    "문화센터": BLUE,
}
CATEGORY_MARKERS = {
    "도서관": "o",
    "박물관": "s",
    "문화센터": "^",
}


def pinned_runtime_versions() -> dict[str, str]:
    """Read the visual toolchain pins from its single requirements file."""

    pins: dict[str, str] = {}
    for raw_line in RUNTIME_REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line.startswith("# runtime:"):
            line = line.removeprefix("# runtime:").strip()
        elif not line or line.startswith("#"):
            continue
        package_name, separator, package_version = line.partition("==")
        if not separator or not package_name or not package_version:
            raise ValueError(f"Week 11 runtime requirement must be pinned: {line}")
        pins[package_name] = package_version
    return pins


def validate_runtime() -> dict[str, str]:
    """Reject generation when any render-affecting runtime pin differs."""

    installed_versions: dict[str, str] = {}
    mismatches = []
    for package_name, required_version in pinned_runtime_versions().items():
        if package_name == "freetype":
            installed_version = ft2font.__freetype_version__
        else:
            try:
                installed_version = version(package_name)
            except PackageNotFoundError:
                installed_version = "not installed"
        installed_versions[package_name] = installed_version
        if installed_version != required_version:
            mismatches.append(
                f"{package_name} {required_version} required; found {installed_version}"
            )
    if mismatches:
        raise SystemExit("Week 11 runtime mismatch: " + "; ".join(mismatches))
    return installed_versions


def apply_figure_style() -> None:
    """Use only bundled fonts and fixed colors for portable output."""

    plt.rcParams.update(
        {
            "font.family": FONT.get_name(),
            "font.size": 13,
            "axes.labelcolor": INK,
            "axes.edgecolor": LINE,
            "axes.titlecolor": INK,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "text.color": INK,
            "figure.facecolor": PAPER,
            "axes.facecolor": PANEL,
            "savefig.facecolor": PAPER,
            "axes.unicode_minus": False,
        }
    )


def style_axes(axis: plt.Axes) -> None:
    axis.spines[["top", "right"]].set_visible(False)
    axis.spines[["left", "bottom"]].set_color(LINE)
    axis.grid(axis="y", color=LINE, linewidth=0.8, alpha=0.55)
    axis.set_axisbelow(True)


def save_figure(figure: plt.Figure, path: Path, *, dpi: int = 100) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        path,
        dpi=dpi,
        facecolor=PAPER,
        metadata={"Software": "Contents Programming Week 11"},
    )
    plt.close(figure)


def make_question_to_chart(path: Path) -> None:
    """Show how four data questions lead to four chart structures."""

    apply_figure_style()
    figure, axes = plt.subplots(2, 2, figsize=(14.4, 9), dpi=100)
    figure.subplots_adjust(left=0.075, right=0.965, top=0.80, bottom=0.09, hspace=0.48, wspace=0.30)
    figure.text(
        0.075,
        0.94,
        "ONE DATASET · FOUR QUESTIONS",
        fontproperties=FONT_BOLD,
        fontsize=30,
        color=INK,
    )
    figure.text(
        0.075,
        0.885,
        "Choose the chart after naming what you need to compare, distribute, relate, or locate.",
        fontproperties=FONT,
        fontsize=15,
        color=MUTED,
    )

    comparison = axes[0, 0]
    categories = ["Museum", "Library", "Culture"]
    totals = [326, 369, 400]
    comparison.barh(categories, totals, color=[CORAL, TEAL, BLUE], height=0.55)
    comparison.set_xlim(0, 440)
    comparison.set_xlabel("Total programs")
    comparison.set_title("COMPARISON · Which category is larger?", loc="left", fontproperties=FONT_BOLD, fontsize=15)
    for row, value in enumerate(totals):
        comparison.text(value + 8, row, str(value), va="center", fontproperties=FONT_BOLD, fontsize=11)
    style_axes(comparison)

    distribution = axes[0, 1]
    program_counts = [23, 26, 28, 29, 31, 33, 34, 35, 37, 38, 41, 42, 45, 48, 49, 52, 54, 57, 58, 62, 64, 67, 70, 72]
    distribution.hist(program_counts, bins=[20, 30, 40, 50, 60, 70, 80], color=GOLD, edgecolor=INK, linewidth=1.2)
    distribution.set_xlabel("Programs per facility")
    distribution.set_ylabel("Facility count")
    distribution.set_title("DISTRIBUTION · Where do values gather?", loc="left", fontproperties=FONT_BOLD, fontsize=15)
    style_axes(distribution)

    relationship = axes[1, 0]
    duration = [20, 28, 35, 42, 49, 55, 63, 70, 78]
    focus = [2.0, 2.4, 2.7, 3.1, 3.0, 3.8, 4.1, 4.0, 4.6]
    relationship.scatter(duration, focus, s=90, color=TEAL, edgecolor=INK, linewidth=1)
    relationship.set_xlabel("duration_min")
    relationship.set_ylabel("focus_level")
    relationship.set_title("RELATIONSHIP · Do two measures vary together?", loc="left", fontproperties=FONT_BOLD, fontsize=15)
    style_axes(relationship)

    spatial = axes[1, 1]
    longitude = [126.925, 126.948, 126.978, 126.990, 127.012, 127.028, 127.048, 127.067]
    latitude = [37.548, 37.579, 37.566, 37.572, 37.584, 37.561, 37.607, 37.596]
    spatial.scatter(longitude, latitude, s=[120, 70, 95, 82, 140, 110, 88, 130], color=BLUE, edgecolor=INK, linewidth=1)
    spatial.set_xlabel("longitude")
    spatial.set_ylabel("latitude")
    spatial.set_title("SPATIAL · Where are the records?", loc="left", fontproperties=FONT_BOLD, fontsize=15)
    spatial.set_aspect("equal", adjustable="datalim")
    style_axes(spatial)

    figure.text(
        0.075,
        0.025,
        "A coordinate scatterplot restores relative position. It does not claim that longitude causes latitude.",
        fontproperties=FONT_BOLD,
        fontsize=12,
        color=CORAL,
    )
    save_figure(figure, path)


def make_figure_axes(path: Path) -> None:
    """Explain Figure, Axes, and Axis using a two-panel poster sketch."""

    apply_figure_style()
    figure = plt.figure(figsize=(14.4, 9), dpi=100)
    figure.text(0.055, 0.93, "FIGURE → AXES → AXIS", fontproperties=FONT_BOLD, fontsize=32)
    figure.text(
        0.055,
        0.875,
        "The Figure is the whole output. Each Axes is one chart area. An Axis measures one direction.",
        fontproperties=FONT,
        fontsize=15,
        color=MUTED,
    )
    figure.patches.append(
        Rectangle(
            (0.05, 0.10),
            0.90,
            0.70,
            transform=figure.transFigure,
            facecolor=PANEL,
            edgecolor=INK,
            linewidth=3,
            zorder=-10,
        )
    )
    figure.text(0.075, 0.755, "FIGURE · 8 × 5.5 inches", fontproperties=FONT_BOLD, fontsize=13, color=CORAL)

    bar_axis = figure.add_axes((0.14, 0.22, 0.30, 0.43))
    bar_axis.barh(["Museum", "Library", "Culture"], [326, 369, 400], color=[CORAL, TEAL, BLUE])
    bar_axis.set_xlim(0, 440)
    bar_axis.set_xlabel("program total · x Axis")
    bar_axis.set_title("Axes 01 · comparison", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    style_axes(bar_axis)

    scatter_axis = figure.add_axes((0.58, 0.22, 0.27, 0.43))
    for category in CATEGORY_DISPLAY:
        records = [record for record in FACILITIES if record.category == category]
        scatter_axis.scatter(
            [record.longitude for record in records],
            [record.latitude for record in records],
            s=[record.program_count * 2.5 for record in records],
            c=CATEGORY_COLORS[category],
            marker=CATEGORY_MARKERS[category],
            label=CATEGORY_DISPLAY[category],
            edgecolor=INK,
            linewidth=0.8,
            alpha=0.82,
        )
    scatter_axis.set_xlabel("longitude · x Axis")
    scatter_axis.set_ylabel("latitude · y Axis")
    scatter_axis.set_title("Axes 02 · relative position", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    scatter_axis.set_xticks([126.92, 126.96, 127.00, 127.04, 127.08])
    scatter_legend = scatter_axis.legend(
        bbox_to_anchor=(1.02, 1.0),
        loc="upper left",
        borderaxespad=0,
        frameon=False,
        fontsize=9,
    )
    style_axes(scatter_axis)

    figure.canvas.draw()
    renderer = figure.canvas.get_renderer()
    figure_width = figure.bbox.width
    figure_height = figure.bbox.height
    for chart_axis in (bar_axis, scatter_axis):
        chart_bounds = chart_axis.get_tightbbox(renderer)
        if not (
            chart_bounds.x0 >= figure_width * 0.05
            and chart_bounds.y0 >= figure_height * 0.10
            and chart_bounds.x1 <= figure_width * 0.95
            and chart_bounds.y1 <= figure_height * 0.80
        ):
            raise AssertionError("Figure/Axes teaching diagram crossed its Figure frame")
    if scatter_legend.get_window_extent(renderer).overlaps(
        scatter_axis.get_window_extent(renderer)
    ):
        raise AssertionError("Figure/Axes legend overlaps the coordinate chart")

    figure.text(
        0.50,
        0.16,
        "two chart areas inside one output",
        ha="center",
        fontproperties=FONT_BOLD,
        fontsize=13,
        color=TEAL,
    )
    figure.text(
        0.055,
        0.035,
        "fig, axes = plt.subplots(1, 2) gives one Figure and two Axes objects.",
        fontproperties=FONT_BOLD,
        fontsize=14,
        color=INK,
    )
    save_figure(figure, path)


def category_totals() -> dict[str, int]:
    totals: defaultdict[str, int] = defaultdict(int)
    for record in FACILITIES:
        totals[record.category] += record.program_count
    return dict(totals)


def clean_csv_text() -> str:
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(
        [
            "place_id",
            "place_name",
            "category",
            "program_count",
            "latitude",
            "longitude",
        ]
    )
    for record in FACILITIES:
        writer.writerow(
            [
                record.place_id,
                record.place_name,
                record.category,
                record.program_count,
                f"{record.latitude:.4f}",
                f"{record.longitude:.4f}",
            ]
        )
    return output.getvalue()


def write_clean_csv(path: Path) -> None:
    path.write_text(clean_csv_text(), encoding="utf-8")


def source_lines(text: str) -> list[str]:
    normalized = dedent(text).strip("\n") + "\n"
    return normalized.splitlines(keepends=True)


def markdown_cell(text: str) -> dict[str, object]:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source_lines(text),
    }


def code_cell(text: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source_lines(text),
    }


def build_notebook(sample_csv: str) -> dict[str, object]:
    sample_csv_sha256 = hashlib.sha256(sample_csv.encode("utf-8")).hexdigest()
    runtime_versions = pinned_runtime_versions()
    setup_code = f'''\
    # STEP 0 · 실행 환경과 수업용 데이터 준비 — 이 셀은 수정하지 않습니다.
    from pathlib import Path
    import hashlib
    import importlib.util
    from importlib.metadata import PackageNotFoundError, version as package_version
    import re
    import subprocess
    import sys

    required_packages = {{
        "pandas": ("pandas", "{runtime_versions['pandas']}"),
        "matplotlib": ("matplotlib", "{runtime_versions['matplotlib']}"),
        "seaborn": ("seaborn", "{runtime_versions['seaborn']}"),
        "PIL": ("Pillow", "{runtime_versions['Pillow']}"),
    }}
    packages_to_install = []
    for module_name, (package_name, required_version) in required_packages.items():
        try:
            installed_version = package_version(package_name)
        except PackageNotFoundError:
            installed_version = None
        if (
            importlib.util.find_spec(module_name) is None
            or installed_version != required_version
        ):
            packages_to_install.append(f"{{package_name}}=={{required_version}}")
    if packages_to_install:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", *packages_to_install]
        )

    import pandas as pd
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    from matplotlib import image as mpimg
    from matplotlib.colors import to_rgba
    from matplotlib.markers import MarkerStyle
    import seaborn as sns

    try:
        from google.colab import files
    except ImportError:
        files = None

    mission_step0_execution = get_ipython().execution_count

    SAMPLE_CSV_PATH = "week11_public_facilities_clean.csv"
    SAMPLE_CSV = {sample_csv!r}
    EXPECTED_CSV_SHA256 = "{sample_csv_sha256}"
    Path(SAMPLE_CSV_PATH).write_text(SAMPLE_CSV, encoding="utf-8")

    dataset_title = "수업용 가상 공공문화시설 정제 데이터"
    dataset_source = "Contents Programming Practice Week 11 · 교수자 제공 가상 자료"
    dataset_license = "수업 목적 사용 허용"
    reference_date = "2026-08-18"
    observation_unit = "공공문화시설 한 곳"
    expected_metadata = (
        dataset_title,
        dataset_source,
        dataset_license,
        reference_date,
        observation_unit,
    )

    POSTER_PAPER = "{PAPER}"
    POSTER_INK = "{INK}"
    POSTER_MUTED = "{MUTED}"
    POSTER_CORAL = "{CORAL}"

    category_markers = {{
        "도서관": "o",
        "박물관": "s",
        "문화센터": "^",
    }}


    def font_has_korean_glyphs(font_path):
        try:
            font = font_manager.get_font(font_path)
        except (OSError, RuntimeError):
            return False
        return all(
            font.get_char_index(ord(character))
            for character in "한글이름출처"
        )


    def find_korean_font():
        preferred_tokens = (
            "nanumgothic",
            "notosanscjk",
            "notosanskr",
            "applesdgothic",
            "malgun",
            "pretendard",
        )
        supporting_fonts = [
            font_path
            for font_path in sorted(font_manager.findSystemFonts())
            if font_has_korean_glyphs(font_path)
        ]
        for font_path in supporting_fonts:
            compact_name = Path(font_path).name.lower().replace(" ", "")
            if any(token in compact_name for token in preferred_tokens):
                return font_path
        return supporting_fonts[0] if supporting_fonts else None


    korean_font_path = find_korean_font()
    if korean_font_path is None and Path("/etc/debian_version").exists():
        subprocess.check_call(["apt-get", "update", "-qq"])
        subprocess.check_call(["apt-get", "install", "-y", "-qq", "fonts-nanum"])
        korean_font_path = find_korean_font()

    if korean_font_path is None:
        raise RuntimeError(
            "한글 글꼴을 찾지 못했습니다. Colab 새 런타임에서 STEP 0부터 다시 실행하세요."
        )

    font_manager.fontManager.addfont(korean_font_path)
    korean_font_name = font_manager.FontProperties(
        fname=korean_font_path
    ).get_name()
    plt.rcParams["font.family"] = korean_font_name
    plt.rcParams["axes.unicode_minus"] = False
    sns.set_theme(style="whitegrid", font=korean_font_name)

    print("준비 파일:", SAMPLE_CSV_PATH)
    print("데이터:", dataset_title)
    print("한글 글꼴:", korean_font_name)
    '''

    settings_code = '''
    # STEP 1 · EDIT — 학번·이름, 질문형 제목과 세 범주 색상을 수정합니다.
    mission_step1_execution = get_ipython().execution_count

    student_id = "학번"
    student_name = "이름"
    poster_title = "EDIT: 어느 시설 범주의 프로그램 수 합계가 큰가?"

    category_palette = {
        "도서관": "#6b7280",
        "박물관": "#6b7280",
        "문화센터": "#6b7280",
    }

    print("제출자:", student_id, student_name)
    print("포스터 질문:", poster_title)
    print("범주 색상:", category_palette)
    '''

    load_code = '''
    # STEP 2 · 정제 CSV 불러오기와 구조 확인 — 이 셀은 수정하지 않습니다.
    mission_step2_execution = get_ipython().execution_count

    source_path = Path(SAMPLE_CSV_PATH)
    source_bytes_before = source_path.read_bytes()
    assert (
        hashlib.sha256(source_bytes_before).hexdigest() == EXPECTED_CSV_SHA256
    ), "제공 CSV 내용이 수업 기준과 다릅니다. 새 런타임에서 다시 실행하세요."
    facility_df = pd.read_csv(source_path)
    source_snapshot = facility_df.copy(deep=True)

    required_columns = {
        "place_id",
        "place_name",
        "category",
        "program_count",
        "latitude",
        "longitude",
    }
    missing_columns = sorted(required_columns - set(facility_df.columns))
    if missing_columns:
        raise KeyError("필요한 열이 없습니다: " + ", ".join(missing_columns))

    assert len(facility_df) == 24, "수업용 정제 데이터는 24행이어야 합니다."
    assert facility_df["category"].nunique() == 3, "시설 범주는 세 개여야 합니다."
    assert facility_df["place_id"].nunique() == 24, "place_id가 중복되었습니다."
    assert facility_df[["program_count", "latitude", "longitude"]].notna().all().all()
    assert facility_df["latitude"].between(-90, 90).all()
    assert facility_df["longitude"].between(-180, 180).all()

    print("데이터 크기:", facility_df.shape)
    print("범주별 시설 수:")
    print(facility_df["category"].value_counts().sort_index())
    print("앞 5행:")
    print(facility_df.head().to_string(index=False))
    '''

    aggregate_code = '''
    # STEP 3 · 범주별 프로그램 수 합계 만들기 — 이 셀은 수정하지 않습니다.
    mission_step3_execution = get_ipython().execution_count

    category_summary = (
        facility_df
        .groupby("category", as_index=False)["program_count"]
        .sum()
        .sort_values("program_count")
        .reset_index(drop=True)
    )

    expected_totals = {
        "박물관": 326,
        "도서관": 369,
        "문화센터": 400,
    }
    actual_totals = dict(
        zip(
            category_summary["category"],
            category_summary["program_count"],
        )
    )
    assert actual_totals == expected_totals, "범주별 합계가 수업 기준과 다릅니다."

    print(category_summary.to_string(index=False))
    '''

    charts_code = '''
    # STEP 4 · 가로 막대그래프와 위치 좌표 산점도 만들기 — 이 셀은 수정하지 않습니다.
    mission_step4_execution = get_ipython().execution_count

    fig, axes = plt.subplots(
        nrows=2,
        ncols=1,
        figsize=(8, 11),
        gridspec_kw={"height_ratios": [0.82, 1.28]},
    )
    fig.patch.set_facecolor(POSTER_PAPER)
    fig.subplots_adjust(
        left=0.14,
        right=0.74,
        top=0.77,
        bottom=0.18,
        hspace=0.58,
    )

    sns.barplot(
        data=category_summary,
        x="program_count",
        y="category",
        hue="category",
        palette=category_palette,
        errorbar=None,
        legend=False,
        edgecolor=POSTER_INK,
        ax=axes[0],
    )
    axes[0].set_xlim(left=0)
    axes[0].set_xlabel("프로그램 수 합계")
    axes[0].set_ylabel("")
    axes[0].set_title(
        "어느 시설 범주의 프로그램 수 합계가 큰가?",
        loc="left",
        fontweight="bold",
    )

    for bar in axes[0].patches:
        value = int(round(bar.get_width()))
        axes[0].text(
            value + 6,
            bar.get_y() + bar.get_height() / 2,
            str(value),
            va="center",
            fontweight="bold",
        )

    bar_count = len(axes[0].patches)
    bar_axis_left_limit = axes[0].get_xlim()[0]

    scatter_plot = sns.scatterplot(
        data=facility_df,
        x="longitude",
        y="latitude",
        hue="category",
        style="category",
        size="program_count",
        palette=category_palette,
        markers=category_markers,
        sizes=(60, 300),
        alpha=0.82,
        edgecolor=POSTER_INK,
        linewidth=0.8,
        legend="brief",
        ax=axes[1],
    )
    axes[1].set_xlabel("경도")
    axes[1].set_ylabel("위도")
    axes[1].set_title(
        "시설 24개는 서로 어디에 놓였는가?",
        loc="left",
        fontweight="bold",
    )
    axes[1].set_xticks([126.90, 126.95, 127.00, 127.05, 127.10])
    axes[1].set_aspect("equal", adjustable="datalim")
    scatter_legend = axes[1].legend(
        bbox_to_anchor=(1.02, 1.0),
        loc="upper left",
        borderaxespad=0,
        frameon=True,
        framealpha=0.94,
        fontsize=8,
    )
    legend_label_map = {
        "category": "시설 범주",
        "program_count": "프로그램 수",
    }
    for legend_text in scatter_legend.get_texts():
        legend_text.set_text(
            legend_label_map.get(legend_text.get_text(), legend_text.get_text())
        )

    plotted_collections = [
        collection
        for collection in axes[1].collections
        if len(collection.get_offsets()) > 0
    ]
    plotted_offsets = [
        collection.get_offsets() for collection in plotted_collections
    ]
    scatter_point_count = sum(len(offsets) for offsets in plotted_offsets)


    def marker_path_signature(path):
        return (
            path.codes.tobytes() if path.codes is not None else b"",
            path.vertices.round(6).tobytes(),
        )


    scatter_unique_sizes = len({
        round(float(size), 6)
        for collection in plotted_collections
        for size in collection.get_sizes()
    })
    scatter_unique_colors = len({
        tuple(round(float(channel), 6) for channel in color)
        for collection in plotted_collections
        for color in collection.get_facecolors()
    })
    scatter_marker_signatures = {
        marker_path_signature(path)
        for collection in plotted_collections
        for path in collection.get_paths()
    }
    scatter_unique_markers = len(scatter_marker_signatures)
    primary_scatter_collection = (
        plotted_collections[0] if len(plotted_collections) == 1 else None
    )
    if primary_scatter_collection is None:
        actual_scatter_offsets = []
        actual_scatter_colors = []
        actual_scatter_markers = []
        actual_scatter_sizes = []
    else:
        actual_scatter_offsets = [
            tuple(round(float(coordinate), 6) for coordinate in point)
            for point in primary_scatter_collection.get_offsets()
        ]
        actual_scatter_colors = [
            tuple(round(float(channel), 6) for channel in color)
            for color in primary_scatter_collection.get_facecolors()
        ]
        actual_scatter_markers = [
            marker_path_signature(path)
            for path in primary_scatter_collection.get_paths()
        ]
        actual_scatter_sizes = [
            round(float(size), 6)
            for size in primary_scatter_collection.get_sizes()
        ]

    expected_scatter_offsets = [
        (round(float(longitude), 6), round(float(latitude), 6))
        for longitude, latitude in zip(
            facility_df["longitude"],
            facility_df["latitude"],
        )
    ]
    expected_scatter_colors = [
        tuple(
            round(float(channel), 6)
            for channel in to_rgba(category_palette[category], alpha=0.82)
        )
        for category in facility_df["category"]
    ]
    expected_marker_signatures = {}
    for category, marker_symbol in category_markers.items():
        marker_style = MarkerStyle(marker_symbol)
        marker_path = marker_style.get_path().transformed(
            marker_style.get_transform()
        )
        expected_marker_signatures[category] = marker_path_signature(marker_path)
    expected_scatter_markers = [
        expected_marker_signatures[category]
        for category in facility_df["category"]
    ]
    program_counts = facility_df["program_count"].tolist()
    expected_size_order = sorted(
        range(len(program_counts)),
        key=program_counts.__getitem__,
    )
    actual_size_order = sorted(
        range(len(actual_scatter_sizes)),
        key=actual_scatter_sizes.__getitem__,
    )
    scatter_offsets_match_rows = actual_scatter_offsets == expected_scatter_offsets
    scatter_colors_follow_category = actual_scatter_colors == expected_scatter_colors
    scatter_markers_follow_category = actual_scatter_markers == expected_scatter_markers
    scatter_sizes_follow_program_count = (
        len(actual_scatter_sizes) == len(program_counts)
        and actual_size_order == expected_size_order
    )
    plotted_place_ids = facility_df["place_id"].tolist()

    print("막대 수:", bar_count)
    print("좌표 점 수:", scatter_point_count)
    print(
        "좌표 표현:",
        f"색상 {scatter_unique_colors} · 표식 {scatter_unique_markers} · "
        f"크기 단계 {scatter_unique_sizes}",
    )
    '''

    writing_code = '''
    # STEP 5 · EDIT — 그래프에서 확인한 관찰과 해석의 한계를 작성합니다.
    mission_step5_execution = get_ipython().execution_count

    main_observation = (
        "EDIT: 합계 326·369·400 중 하나를 근거로 30자 이상 관찰하세요."
    )
    limitation_statement = (
        "EDIT: 가상 자료만으로 단정할 수 없는 내용을 30자 이상 적으세요."
    )

    print("관찰:", main_observation)
    print("한계:", limitation_statement)
    '''

    save_code = '''
    # STEP 6 · 포스터 설명 배치와 1600 × 2200 PNG 저장 — 이 셀은 수정하지 않습니다.
    mission_step6_execution = get_ipython().execution_count

    safe_student_id = str(student_id).strip()
    safe_student_name = str(student_name).strip()
    if "\\n" in poster_title or "\\r" in poster_title:
        raise AssertionError("질문형 제목은 줄바꿈 없이 한 줄로 작성하세요.")
    if any(
        line_break in text
        for text in (main_observation, limitation_statement)
        for line_break in ("\\n", "\\r")
    ):
        raise AssertionError("관찰과 한계는 줄바꿈 없이 각각 한 줄로 작성하세요.")
    safe_name_pattern = re.compile(r"^[0-9A-Za-z가-힣_-]+$")
    if not (
        safe_name_pattern.fullmatch(safe_student_id)
        and safe_name_pattern.fullmatch(safe_student_name)
    ):
        raise AssertionError(
            "학번과 이름에는 한글·영문·숫자·밑줄·하이픈만 사용할 수 있습니다."
        )
    input_text_lengths_safe = (
        len(poster_title.strip()) <= 50
        and len(main_observation.strip()) <= 90
        and len(limitation_statement.strip()) <= 90
    )
    if not input_text_lengths_safe:
        raise AssertionError(
            "제목은 50자, 관찰과 한계는 각각 90자 이내로 다듬어 주세요."
        )
    output_filename = (
        f"week11_{safe_student_id}_{safe_student_name}_data_poster.png"
    )

    title_artist = fig.suptitle(
        poster_title,
        x=0.10,
        y=0.95,
        ha="left",
        fontsize=22,
        fontweight="bold",
    )
    subtitle_artist = fig.text(
        0.10,
        0.865,
        "같은 24행 데이터를 범주별 합계와 상대적 위치로 다시 읽기",
        fontsize=11,
        color=POSTER_MUTED,
    )
    observation_label_artist = fig.text(
        0.10, 0.125, "핵심 관찰", fontsize=10, fontweight="bold", color=POSTER_CORAL
    )
    observation_artist = fig.text(
        0.10, 0.098, main_observation, fontsize=9.5, wrap=True
    )
    limitation_label_artist = fig.text(
        0.10, 0.068, "해석의 한계", fontsize=10, fontweight="bold", color=POSTER_CORAL
    )
    limitation_artist = fig.text(
        0.10, 0.041, limitation_statement, fontsize=9.5, wrap=True
    )
    source_artist = fig.text(
        0.10,
        0.012,
        f"출처 · {dataset_source} · 기준일 {reference_date} · {len(facility_df)}행",
        fontsize=7.5,
        color=POSTER_MUTED,
    )

    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    figure_bounds = fig.bbox
    poster_text_artists = (
        title_artist,
        subtitle_artist,
        observation_label_artist,
        observation_artist,
        limitation_label_artist,
        limitation_artist,
        source_artist,
    )
    poster_text_inside_canvas = all(
        text_artist.get_window_extent(renderer).x0 >= figure_bounds.x0
        and text_artist.get_window_extent(renderer).y0 >= figure_bounds.y0
        and text_artist.get_window_extent(renderer).x1 <= figure_bounds.x1
        and text_artist.get_window_extent(renderer).y1 <= figure_bounds.y1
        for text_artist in poster_text_artists
    )
    observation_bounds = observation_artist.get_window_extent(renderer)
    limitation_label_bounds = limitation_label_artist.get_window_extent(renderer)
    limitation_bounds = limitation_artist.get_window_extent(renderer)
    source_bounds = source_artist.get_window_extent(renderer)
    footer_blocks_separated = (
        observation_bounds.y0 > limitation_label_bounds.y1
        and limitation_bounds.y0 > source_bounds.y1
    )
    if not poster_text_inside_canvas or not footer_blocks_separated:
        raise AssertionError(
            "제목·관찰·한계가 포스터 경계를 넘거나 서로 겹칩니다. 문장을 줄여 주세요."
        )

    fig.savefig(
        output_filename,
        dpi=200,
        facecolor=POSTER_PAPER,
    )
    output_path = Path(output_filename)
    output_bytes = output_path.read_bytes()
    saved_image = mpimg.imread(output_path)

    print("저장 파일:", output_filename)
    print("저장 크기:", saved_image.shape[:2])
    plt.show()
    '''

    final_check_code = '''
    # STEP 7 · FINAL CHECK — 이 셀은 수정하지 않습니다.
    mission_step7_execution = get_ipython().execution_count

    execution_sequence = (
        mission_step0_execution,
        mission_step1_execution,
        mission_step2_execution,
        mission_step3_execution,
        mission_step4_execution,
        mission_step5_execution,
        mission_step6_execution,
        mission_step7_execution,
    )
    hex_color_pattern = re.compile(r"^#[0-9A-Fa-f]{6}$")
    palette_values = list(category_palette.values())
    title_data_terms = (
        "프로그램",
        "범주",
        "합계",
        "개수",
        "시설 수",
        "위도",
        "경도",
        "좌표",
        "위치",
        "어디",
    )
    common_unsupported_title_terms = (
        "좋은",
        "최고",
        "인기",
        "만족",
        "추천",
        "유익",
        "우수",
        "효율",
    )
    title_has_data_clue = (
        any(term in poster_title for term in title_data_terms)
        and not any(term in poster_title for term in common_unsupported_title_terms)
    )
    current_metadata = (
        dataset_title,
        dataset_source,
        dataset_license,
        reference_date,
        observation_unit,
    )

    checks = [
        (
            execution_sequence == (1, 2, 3, 4, 5, 6, 7, 8),
            "새 런타임에서 STEP 0부터 여덟 셀을 순서대로 실행",
        ),
        (
            safe_student_id != ""
            and safe_student_name != ""
            and "학번" not in safe_student_id
            and "이름" not in safe_student_name
            and safe_name_pattern.fullmatch(safe_student_id)
            and safe_name_pattern.fullmatch(safe_student_name),
            "학번·이름과 안전한 파일명",
        ),
        (
            not poster_title.strip().startswith("EDIT:")
            and len(poster_title.strip()) >= 15
            and len(poster_title.strip()) <= 50
            and poster_title.strip().endswith(("?", "？"))
            and title_has_data_clue,
            "15–50자이며 데이터 단서를 포함한 질문형 제목 형식",
        ),
        (
            len(palette_values) == 3
            and len(set(palette_values)) == 3
            and all(hex_color_pattern.fullmatch(color) for color in palette_values),
            "세 범주의 서로 다른 HEX 색상",
        ),
        (
            source_path.read_bytes() == source_bytes_before
            and hashlib.sha256(source_bytes_before).hexdigest()
            == EXPECTED_CSV_SHA256
            and facility_df.equals(source_snapshot),
            "제공 CSV와 불러온 24행 원본 보존",
        ),
        (
            len(facility_df) == 24
            and facility_df["category"].nunique() == 3
            and facility_df["place_id"].nunique() == 24,
            "시설 24행과 세 범주",
        ),
        (
            actual_totals == {"박물관": 326, "도서관": 369, "문화센터": 400},
            "범주별 프로그램 수 합계 326·369·400",
        ),
        (
            bar_count == 3 and abs(bar_axis_left_limit) < 1e-9,
            "0에서 시작하는 막대 세 개",
        ),
        (
            scatter_point_count == len(facility_df) == 24
            and len(plotted_place_ids) == len(set(plotted_place_ids)) == 24,
            "정제 24행과 좌표 점 24개",
        ),
        (
            scatter_unique_colors == 3
            and scatter_unique_markers == 3
            and scatter_unique_sizes > 1,
            "색상·표식·크기로 구분한 좌표 점",
        ),
        (
            scatter_offsets_match_rows
            and scatter_colors_follow_category
            and scatter_markers_follow_category
            and scatter_sizes_follow_program_count,
            "원본 데이터와 색상·표식·크기의 대응",
        ),
        (
            not main_observation.strip().startswith("EDIT:")
            and len(main_observation.strip()) >= 30
            and re.search(r"326|369|400", main_observation),
            "실제 합계를 포함한 30자 이상의 관찰 문장",
        ),
        (
            not limitation_statement.strip().startswith("EDIT:")
            and len(limitation_statement.strip()) >= 30,
            "30자 이상의 해석 한계",
        ),
        (
            input_text_lengths_safe
            and poster_text_inside_canvas
            and footer_blocks_separated,
            "글자 수와 포스터 경계 안의 제목·관찰·한계",
        ),
        (
            output_path.exists()
            and len(output_bytes) > 50000
            and saved_image.shape[:2] == (2200, 1600),
            "1600 × 2200 데이터 포스터 PNG",
        ),
        (
            current_metadata == expected_metadata,
            "출처·이용 조건·기준일·관찰 단위",
        ),
    ]

    failed_checks = []
    for passed, label in checks:
        if passed:
            print("✅", label)
        else:
            print("❌", label)
            failed_checks.append(label)

    if failed_checks:
        raise AssertionError(
            "위의 빨간 조건을 수정한 뒤 새 런타임에서 모두 실행하세요: "
            + ", ".join(failed_checks)
        )

    print("🎉 WEEK 11 DATA POSTER COMPLETE")
    print("※ 자동 검사 PASS입니다. 제목의 의미는 교수 확인 후 최종 승인됩니다.")
    if files is not None:
        files.download(output_filename)
    '''

    return {
        "cells": [
            markdown_cell(
                """
                # WEEK 11 · 질문에 맞는 데이터 포스터 미션

                이 노트북은 **범주별 프로그램 수 합계 가로 막대그래프**와 **시설 24개의 위치 좌표 산점도**를 한 장의 1600 × 2200 포스터로 만듭니다.

                - 수정할 곳은 `STEP 1 · EDIT`와 `STEP 5 · EDIT` 두 셀뿐입니다.
                - 나머지 셀은 위에서 아래로 실행하고 코드를 수정하지 않습니다.
                - 마지막에 모든 초록 확인과 `WEEK 11 DATA POSTER COMPLETE`가 보이면 자동 검사를 통과한 것입니다.
                - 최종 완료와 귀가는 두 파일을 제출하고, 제목이 현재 데이터로 답할 수 있다는 교수 확인을 받은 뒤 승인됩니다.
                """
            ),
            code_cell(setup_code),
            markdown_cell(
                """
                ## STEP 1 · 제출 정보와 시각 규칙

                학번·이름을 입력하고, 데이터로 답할 수 있는 질문형 제목을 작성합니다. 세 범주에는 서로 다른 여섯 자리 HEX 색상을 지정합니다.
                """
            ),
            code_cell(settings_code),
            markdown_cell(
                """
                ## STEP 2 · 정제 데이터 확인

                수업용 24행 CSV를 불러오고 열, 행, 범주, 좌표의 유효성을 확인합니다. 제공 파일과 DataFrame은 수정하지 않습니다.
                """
            ),
            code_cell(load_code),
            markdown_cell(
                """
                ## STEP 3 · 범주별 합계

                시설 24행을 세 범주로 묶고 프로그램 수를 더한 뒤 작은 값부터 정렬합니다.
                """
            ),
            code_cell(aggregate_code),
            markdown_cell(
                """
                ## STEP 4 · 두 그래프

                위쪽 Axes에는 0에서 시작하는 막대 세 개를, 아래쪽 Axes에는 시설 24개의 좌표 점을 만듭니다. 좌표 점의 색상과 표식은 범주, 면적은 프로그램 수를 나타냅니다.
                """
            ),
            code_cell(charts_code),
            markdown_cell(
                """
                ## STEP 5 · 관찰과 한계

                그래프에서 실제로 확인한 합계를 포함해 관찰 문장을 작성합니다. 그다음 가상 자료와 좌표 그래프로 단정할 수 없는 내용을 한계로 적습니다. 두 문장은 줄바꿈 없이 각각 한 줄로 작성합니다.
                """
            ),
            code_cell(writing_code),
            markdown_cell(
                """
                ## STEP 6 · 포스터 저장

                제목, 두 그래프, 관찰, 한계, 출처를 Figure 안에 배치하고 1600 × 2200 PNG로 저장합니다.
                """
            ),
            code_cell(save_code),
            markdown_cell(
                """
                ## STEP 7 · 자동 검사와 내려받기

                수정하지 않습니다. 실패한 조건의 한글 설명을 읽고 STEP 1 또는 STEP 5만 고친 뒤, 새 런타임에서 모두 실행합니다.
                """
            ),
            code_cell(final_check_code),
        ],
        "metadata": {
            "colab": {
                "name": "week-11-data-poster-mission.ipynb",
                "provenance": [],
            },
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {
                "name": "python",
                "version": "3",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def write_notebook(path: Path) -> None:
    notebook = build_notebook(clean_csv_text())
    path.write_text(
        json.dumps(notebook, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )


def make_data_poster_example(path: Path) -> None:
    """Create the 1600 × 2200 reference poster used in periods 2 and 3."""

    apply_figure_style()
    figure = plt.figure(figsize=(8, 11), dpi=200)
    grid = figure.add_gridspec(
        20,
        1,
        left=0.19,
        right=0.75,
        top=0.78,
        bottom=0.16,
        hspace=1.20,
    )
    figure.text(0.10, 0.945, "WHERE IS CULTURAL PROGRAM", fontproperties=FONT_BOLD, fontsize=22, color=INK)
    figure.text(0.10, 0.910, "ACTIVITY CONCENTRATED?", fontproperties=FONT_BOLD, fontsize=22, color=INK)
    figure.text(
        0.10,
        0.865,
        "The same 24 facilities become a category comparison and a coordinate view.",
        fontproperties=FONT,
        fontsize=9.5,
        color=MUTED,
    )
    figure.text(0.10, 0.820, "01 · COMPARE TOTALS", fontproperties=FONT_BOLD, fontsize=9.5, color=CORAL)

    bar_axis = figure.add_subplot(grid[0:6, 0])
    totals = category_totals()
    ordered = sorted(totals, key=totals.get)
    colors = [CATEGORY_COLORS[category] for category in ordered]
    bars = bar_axis.barh(
        [CATEGORY_DISPLAY[category] for category in ordered],
        [totals[category] for category in ordered],
        color=colors,
        height=0.56,
    )
    bar_axis.set_xlim(0, 440)
    bar_axis.set_xlabel("Total number of programs")
    bar_axis.set_title("Culture centers record the largest total", loc="left", fontproperties=FONT_BOLD, fontsize=12)
    for bar, category in zip(bars, ordered, strict=True):
        bar_axis.text(
            totals[category] + 8,
            bar.get_y() + bar.get_height() / 2,
            str(totals[category]),
            va="center",
            fontproperties=FONT_BOLD,
            fontsize=9,
        )
    style_axes(bar_axis)

    figure.text(0.10, 0.555, "02 · RESTORE RELATIVE POSITION", fontproperties=FONT_BOLD, fontsize=9.5, color=CORAL)
    scatter_axis = figure.add_subplot(grid[8:17, 0])
    for category in CATEGORY_DISPLAY:
        records = [record for record in FACILITIES if record.category == category]
        scatter_axis.scatter(
            [record.longitude for record in records],
            [record.latitude for record in records],
            s=[record.program_count * 4 for record in records],
            c=CATEGORY_COLORS[category],
            marker=CATEGORY_MARKERS[category],
            label=CATEGORY_DISPLAY[category],
            edgecolor=INK,
            linewidth=0.65,
            alpha=0.80,
        )
    scatter_axis.set_xlabel("Longitude")
    scatter_axis.set_ylabel("Latitude")
    scatter_axis.set_title("24 points · color + marker = category · area = programs", loc="left", fontproperties=FONT_BOLD, fontsize=11)
    scatter_legend = scatter_axis.legend(
        bbox_to_anchor=(1.02, 1.0),
        loc="upper left",
        borderaxespad=0,
        frameon=False,
        fontsize=8,
    )
    scatter_axis.set_aspect("equal", adjustable="datalim")
    style_axes(scatter_axis)

    figure.canvas.draw()
    if scatter_legend.get_window_extent(figure.canvas.get_renderer()).overlaps(
        scatter_axis.get_window_extent(figure.canvas.get_renderer())
    ):
        raise AssertionError("example poster legend overlaps a facility point")

    figure.text(0.10, 0.105, "OBSERVATION", fontproperties=FONT_BOLD, fontsize=9, color=CORAL)
    figure.text(
        0.10,
        0.081,
        "Culture centers total 400 programs, 31 more than libraries and 74 more than museums.",
        fontproperties=FONT,
        fontsize=8.5,
        color=INK,
    )
    figure.text(0.10, 0.052, "LIMIT", fontproperties=FONT_BOLD, fontsize=9, color=CORAL)
    figure.text(
        0.10,
        0.029,
        "Fictional facilities cannot explain access, quality, demand, or causes. Coordinates show position, not correlation.",
        fontproperties=FONT,
        fontsize=7.8,
        color=INK,
    )
    figure.text(
        0.10,
        0.012,
        "SOURCE · Contents Programming Practice Week 11 fictional dataset · 24 facilities · reference date 2026-08-18",
        fontproperties=FONT,
        fontsize=6.5,
        color=MUTED,
    )
    save_figure(figure, path, dpi=200)


def make_honest_chart_cases(path: Path) -> None:
    """Contrast three misleading choices with clearer alternatives."""

    apply_figure_style()
    figure, axes = plt.subplots(2, 3, figsize=(14.4, 9), dpi=100)
    figure.subplots_adjust(left=0.06, right=0.97, top=0.78, bottom=0.08, hspace=0.55, wspace=0.30)
    figure.text(0.06, 0.94, "SAME VALUES · DIFFERENT IMPRESSIONS", fontproperties=FONT_BOLD, fontsize=30)
    figure.text(
        0.06,
        0.885,
        "Check the baseline, the visual scale, and the missing context before believing the first impression.",
        fontproperties=FONT,
        fontsize=15,
        color=MUTED,
    )
    figure.text(0.018, 0.56, "MISLEADING", rotation=90, va="center", fontproperties=FONT_BOLD, fontsize=13, color=CORAL)
    figure.text(0.018, 0.20, "CLEARER", rotation=90, va="center", fontproperties=FONT_BOLD, fontsize=13, color=TEAL)

    totals = [326, 369, 400]
    labels = ["Museum", "Library", "Culture"]

    cropped = axes[0, 0]
    cropped.bar(labels, totals, color=CORAL)
    cropped.set_ylim(300, 410)
    cropped.set_title("A · Cropped baseline", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    cropped.text(0.03, 0.88, "Small gaps feel huge", transform=cropped.transAxes, color=CORAL, fontproperties=FONT_BOLD, fontsize=9)
    style_axes(cropped)

    honest = axes[1, 0]
    honest.bar(labels, totals, color=TEAL)
    honest.set_ylim(0, 440)
    honest.set_title("A · Baseline begins at 0", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    honest.text(0.03, 0.88, "Lengths stay proportional", transform=honest.transAxes, color=TEAL, fontproperties=FONT_BOLD, fontsize=9)
    style_axes(honest)

    bad_area = axes[0, 1]
    bad_area.scatter([0, 1], [0, 0], s=[600, 9600], color=[GOLD, CORAL], alpha=0.82, edgecolor=INK)
    bad_area.set_xlim(-0.55, 1.55)
    bad_area.set_ylim(-0.65, 0.65)
    bad_area.set_xticks([0, 1], ["25", "100"])
    bad_area.set_yticks([])
    bad_area.set_title("B · Radius follows value", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    bad_area.text(0.03, 0.08, "Area becomes 16×, not 4×", transform=bad_area.transAxes, color=CORAL, fontproperties=FONT_BOLD, fontsize=10)

    good_area = axes[1, 1]
    good_area.scatter([0, 1], [0, 0], s=[900, 3600], color=[GOLD, TEAL], alpha=0.82, edgecolor=INK)
    good_area.set_xlim(-0.55, 1.55)
    good_area.set_ylim(-0.65, 0.65)
    good_area.set_xticks([0, 1], ["25", "100"])
    good_area.set_yticks([])
    good_area.set_title("B · Area follows value", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    good_area.text(0.03, 0.08, "Area becomes 4× with the data", transform=good_area.transAxes, color=TEAL, fontproperties=FONT_BOLD, fontsize=10)

    missing = axes[0, 2]
    missing.add_patch(Rectangle((0.08, 0.18), 0.84, 0.62, facecolor=PALE_CORAL, edgecolor=CORAL, linewidth=2))
    missing.text(0.14, 0.68, "PROGRAMS INCREASED", transform=missing.transAxes, fontproperties=FONT_BOLD, fontsize=14)
    missing.text(0.14, 0.50, "+23%", transform=missing.transAxes, fontproperties=FONT_BOLD, fontsize=34, color=CORAL)
    missing.text(0.14, 0.30, "No period · no denominator · no source", transform=missing.transAxes, fontsize=10, color=MUTED)
    missing.set_title("C · Context removed", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    missing.axis("off")

    complete = axes[1, 2]
    complete.add_patch(Rectangle((0.08, 0.12), 0.84, 0.72, facecolor=PALE_TEAL, edgecolor=TEAL, linewidth=2))
    complete.text(0.14, 0.70, "TOTAL PROGRAM COUNT", transform=complete.transAxes, fontproperties=FONT_BOLD, fontsize=13)
    complete.text(0.14, 0.53, "1,095", transform=complete.transAxes, fontproperties=FONT_BOLD, fontsize=32, color=TEAL)
    complete.text(0.14, 0.35, "24 facilities · sum", transform=complete.transAxes, fontsize=9.5, color=INK)
    complete.text(0.14, 0.26, "Reference date · 2026-08-18", transform=complete.transAxes, fontsize=9.5, color=INK)
    complete.text(0.14, 0.17, "Source · fictional class dataset", transform=complete.transAxes, fontsize=9.5, color=MUTED)
    complete.set_title("C · Context restored", loc="left", fontproperties=FONT_BOLD, fontsize=14)
    complete.axis("off")

    save_figure(figure, path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-dir", type=Path, default=DEFAULT_ASSET_DIR)
    parser.add_argument("--check-runtime", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    installed_versions = validate_runtime()
    if args.check_runtime:
        summary = " · ".join(
            f"{package_name} {package_version}"
            for package_name, package_version in installed_versions.items()
        )
        print("Week 11 visual runtime OK:", summary)
        return

    args.asset_dir.mkdir(parents=True, exist_ok=True)
    write_clean_csv(args.asset_dir / "week-11-public-facilities-clean.csv")
    make_question_to_chart(args.asset_dir / "week-11-question-to-chart.png")
    make_honest_chart_cases(args.asset_dir / "week-11-honest-chart-cases.png")
    make_figure_axes(args.asset_dir / "week-11-figure-axes.png")
    make_data_poster_example(args.asset_dir / "week-11-data-poster-example.png")
    write_notebook(args.asset_dir / "week-11-data-poster-mission.ipynb")
    print(f"Generated Week 11 teaching visuals in {args.asset_dir}")


if __name__ == "__main__":
    main()
