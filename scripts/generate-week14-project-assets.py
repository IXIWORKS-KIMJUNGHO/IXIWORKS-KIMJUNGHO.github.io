#!/usr/bin/env python3
"""Generate deterministic Week 14 project-prototype visuals and notebook."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from textwrap import dedent

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib import font_manager, ft2font
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
RUNTIME_REQUIREMENTS_PATH = ROOT / "requirements-week14-assets.txt"

PAPER = "#f3efe5"
PANEL = "#fffdf8"
INK = "#202523"
MUTED = "#59615e"
LINE = "#c7c8be"
TEAL = "#116e68"
CORAL = "#a23d34"
BLUE = "#365f91"
GOLD = "#9a7010"
PALE_TEAL = "#dcebe6"
PALE_CORAL = "#f0ddd8"
PALE_BLUE = "#dce5ef"
PALE_GOLD = "#eee3c5"

FONT_PATH = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
FONT_BOLD_PATH = (
    Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans-Bold.ttf"
)
FONT = font_manager.FontProperties(fname=FONT_PATH)
FONT_BOLD = font_manager.FontProperties(fname=FONT_BOLD_PATH)


def pinned_runtime_versions() -> dict[str, str]:
    """Read the render toolchain pins from one requirements file."""

    pins: dict[str, str] = {}
    for raw_line in RUNTIME_REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line.startswith("# runtime:"):
            line = line.removeprefix("# runtime:").strip()
        elif not line or line.startswith("#"):
            continue
        package_name, separator, package_version = line.partition("==")
        if not separator or not package_name or not package_version:
            raise ValueError(f"Week 14 runtime requirement must be pinned: {line}")
        pins[package_name] = package_version
    return pins


def validate_runtime() -> dict[str, str]:
    """Reject generation when a render-affecting dependency differs."""

    installed_versions: dict[str, str] = {}
    mismatches: list[str] = []
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
        raise SystemExit("Week 14 runtime mismatch: " + "; ".join(mismatches))
    return installed_versions


def apply_style() -> None:
    """Apply a fixed editorial style using Matplotlib's bundled fonts."""

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


def save_figure(figure: plt.Figure, path: Path, *, dpi: int = 100) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        path,
        dpi=dpi,
        facecolor=PAPER,
        metadata={"Software": "Contents Programming Week 14"},
    )
    plt.close(figure)


def add_card(
    axis: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    label: str,
    title: str,
    body: str,
    facecolor: str,
    accent: str,
) -> None:
    """Draw one labeled card in normalized axis coordinates."""

    axis.add_patch(
        FancyBboxPatch(
            (x, y),
            width,
            height,
            boxstyle="round,pad=0.012,rounding_size=0.018",
            linewidth=1.4,
            edgecolor=accent,
            facecolor=facecolor,
        )
    )
    axis.text(
        x + 0.024,
        y + height - 0.052,
        label,
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=10,
        color=accent,
        va="top",
    )
    axis.text(
        x + 0.024,
        y + height - 0.105,
        title,
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=15,
        color=INK,
        va="top",
    )
    axis.text(
        x + 0.024,
        y + height - 0.17,
        body,
        transform=axis.transAxes,
        fontproperties=FONT,
        fontsize=10.5,
        color=MUTED,
        va="top",
        linespacing=1.45,
    )


def make_scope_to_slice(path: Path) -> None:
    """Show how broad project ideas become one buildable project slice."""

    apply_style()
    figure, axis = plt.subplots(figsize=(14.4, 9), dpi=100)
    axis.set_axis_off()
    figure.subplots_adjust(left=0.04, right=0.96, top=0.96, bottom=0.05)

    axis.text(
        0.04,
        0.93,
        "FROM BROAD IDEA TO BUILDABLE SLICE",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=29,
        color=INK,
    )
    axis.text(
        0.04,
        0.875,
        "A 30% prototype proves one complete path. It does not imitate 30% of every feature.",
        transform=axis.transAxes,
        fontproperties=FONT,
        fontsize=14,
        color=MUTED,
    )

    add_card(
        axis,
        0.04,
        0.57,
        0.245,
        0.23,
        label="TOO BROAD",
        title="Show every facility",
        body="All categories\nAll years\nMap + dashboard + filters",
        facecolor=PALE_CORAL,
        accent=CORAL,
    )
    add_card(
        axis,
        0.375,
        0.57,
        0.245,
        0.23,
        label="BUILDABLE DATA SLICE",
        title="Compare one measure",
        body="One approved table\nOne group total\nOne readable bar chart",
        facecolor=PALE_TEAL,
        accent=TEAL,
    )
    add_card(
        axis,
        0.71,
        0.57,
        0.245,
        0.23,
        label="EVIDENCE",
        title="A file that opens",
        body="Raw input preserved\nCounts printed\nPNG exported",
        facecolor=PANEL,
        accent=INK,
    )

    for start, end in ((0.285, 0.375), (0.62, 0.71)):
        axis.add_patch(
            FancyArrowPatch(
                (start + 0.012, 0.685),
                (end - 0.012, 0.685),
                transform=axis.transAxes,
                arrowstyle="-|>",
                mutation_scale=18,
                linewidth=1.8,
                color=INK,
            )
        )

    examples = [
        (
            "TEXT",
            "Interpret a whole novel",
            "Count repeated words in one permitted excerpt",
            PALE_BLUE,
            BLUE,
        ),
        (
            "SOUND",
            "Build a live performance system",
            "Show energy change in one short permitted clip",
            PALE_GOLD,
            GOLD,
        ),
        (
            "RULE-BASED IMAGE",
            "Make an infinite generative world",
            "Export one composition from one parameter rule",
            PALE_TEAL,
            TEAL,
        ),
    ]
    for index, (label, before, after, facecolor, accent) in enumerate(examples):
        y = 0.405 - index * 0.135
        axis.add_patch(
            FancyBboxPatch(
                (0.04, y),
                0.915,
                0.105,
                boxstyle="round,pad=0.010,rounding_size=0.014",
                linewidth=1,
                edgecolor=LINE,
                facecolor=facecolor,
            )
        )
        axis.text(0.065, y + 0.073, label, transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=10, color=accent, va="top")
        axis.text(0.20, y + 0.073, before, transform=axis.transAxes, fontproperties=FONT, fontsize=11.5, color=MUTED, va="top")
        axis.text(0.47, y + 0.073, "→", transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=16, color=INK, va="top")
        axis.text(0.53, y + 0.073, after, transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=11.5, color=INK, va="top")

    axis.text(
        0.04,
        0.035,
        "KEEP: one question · one input · one rule · one mapping · one output",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=13,
        color=CORAL,
    )
    save_figure(figure, path)


def make_prototype_contract(path: Path) -> None:
    """Visualize the five-stage path and the evidence produced at each stage."""

    apply_style()
    figure, axis = plt.subplots(figsize=(14.4, 9), dpi=100)
    axis.set_axis_off()
    figure.subplots_adjust(left=0.04, right=0.96, top=0.96, bottom=0.05)
    axis.text(0.04, 0.93, "30% = ONE COMPLETE PATH", transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=31, color=INK)
    axis.text(0.04, 0.872, "Every stage leaves evidence that the next stage can use and a reviewer can check.", transform=axis.transAxes, fontproperties=FONT, fontsize=14, color=MUTED)

    cards = [
        ("01", "INPUT", "One approved\nsource", PALE_BLUE, BLUE),
        ("02", "PRESERVE", "Raw copy +\ndigest", PALE_GOLD, GOLD),
        ("03", "PROCESS", "One count, rule,\nor measure", PALE_TEAL, TEAL),
        ("04", "MAP", "Value → position,\nlength, color", PALE_CORAL, CORAL),
        ("05", "EXPORT", "Openable PNG\nor HTML", PANEL, INK),
    ]
    width = 0.158
    gap = 0.026
    start_x = 0.04
    for index, (number, title, body, facecolor, accent) in enumerate(cards):
        x = start_x + index * (width + gap)
        axis.add_patch(FancyBboxPatch((x, 0.50), width, 0.245, boxstyle="round,pad=0.010,rounding_size=0.018", linewidth=1.5, edgecolor=accent, facecolor=facecolor))
        axis.text(x + 0.020, 0.705, number, transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=11, color=accent)
        axis.text(x + 0.020, 0.650, title, transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=15, color=INK)
        axis.text(x + 0.020, 0.585, body, transform=axis.transAxes, fontproperties=FONT, fontsize=10.5, color=MUTED, linespacing=1.5)
        if index < len(cards) - 1:
            axis.add_patch(FancyArrowPatch((x + width + 0.005, 0.62), (x + width + gap - 0.005, 0.62), transform=axis.transAxes, arrowstyle="-|>", mutation_scale=15, linewidth=1.5, color=INK))

    evidence = [
        ("QUESTION", "The source can answer it"),
        ("CONSOLE", "Counts before and after"),
        ("VISUAL", "Marks match processed values"),
        ("FILE", "1600 × 1000 and opens"),
        ("NOTE", "Observation + limitation + next steps"),
    ]
    axis.text(0.04, 0.405, "REVIEW EVIDENCE", transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=12, color=MUTED)
    for index, (label, body) in enumerate(evidence):
        y = 0.335 - index * 0.061
        axis.add_patch(Rectangle((0.04, y), 0.17, 0.043, transform=axis.transAxes, facecolor=INK, edgecolor=INK))
        axis.text(0.055, y + 0.0215, label, transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=9, color=PANEL, va="center")
        axis.text(0.235, y + 0.0215, body, transform=axis.transAxes, fontproperties=FONT, fontsize=11, color=INK, va="center")

    axis.text(0.62, 0.235, "NOT A 30% PROTOTYPE", transform=axis.transAxes, fontproperties=FONT_BOLD, fontsize=12, color=CORAL)
    axis.text(0.62, 0.185, "A polished title with no data path", transform=axis.transAxes, fontproperties=FONT, fontsize=11.5, color=MUTED)
    axis.text(0.62, 0.140, "Many unfinished features", transform=axis.transAxes, fontproperties=FONT, fontsize=11.5, color=MUTED)
    axis.text(0.62, 0.095, "A screenshot that cannot be reproduced", transform=axis.transAxes, fontproperties=FONT, fontsize=11.5, color=MUTED)
    save_figure(figure, path)


def make_three_track_preview(path: Path) -> None:
    """Preview the equivalent visual outputs for data, text, and sound tracks."""

    apply_style()
    figure, axes = plt.subplots(1, 3, figsize=(16, 9), dpi=100)
    figure.subplots_adjust(left=0.06, right=0.97, top=0.79, bottom=0.14, wspace=0.35)
    figure.text(0.06, 0.93, "THREE INPUTS · ONE PROTOTYPE CONTRACT", fontproperties=FONT_BOLD, fontsize=29, color=INK)
    figure.text(0.06, 0.87, "Choose the track that serves your question. Each track still preserves, processes, maps, and exports.", fontproperties=FONT, fontsize=14, color=MUTED)

    categories = ["Archive", "Studio", "Screening"]
    values = [84, 63, 49]
    axes[0].barh(categories[::-1], values[::-1], color=[CORAL, GOLD, TEAL])
    axes[0].set_xlim(0, 95)
    axes[0].set_xlabel("Total visits")
    axes[0].set_title("DATA · group and compare", loc="left", fontproperties=FONT_BOLD, fontsize=14)

    words = ["record", "place", "sound", "memory", "walk"]
    counts = [8, 6, 5, 4, 3]
    axes[1].barh(words[::-1], counts[::-1], color=BLUE)
    axes[1].set_xlim(0, 9)
    axes[1].set_xlabel("Token count")
    axes[1].set_title("TEXT · count and rank", loc="left", fontproperties=FONT_BOLD, fontsize=14)

    sample_rate = 8000
    seconds = 4
    time = np.arange(sample_rate * seconds) / sample_rate
    signal = (0.20 + 0.13 * np.sin(2 * np.pi * 0.42 * time)) * np.sin(2 * np.pi * 220 * time)
    frame_size = 400
    hop = 200
    starts = np.arange(0, len(signal) - frame_size + 1, hop)
    rms = np.array([np.sqrt(np.mean(signal[start : start + frame_size] ** 2)) for start in starts])
    frame_times = (starts + frame_size / 2) / sample_rate
    axes[2].plot(frame_times, rms, color=TEAL, linewidth=2.3)
    axes[2].fill_between(frame_times, rms, color=PALE_TEAL)
    axes[2].set_ylim(0, max(rms) * 1.25)
    axes[2].set_xlabel("Time (seconds)")
    axes[2].set_ylabel("RMS energy")
    axes[2].set_title("SOUND · measure over time", loc="left", fontproperties=FONT_BOLD, fontsize=14)

    for axis in axes:
        axis.spines[["top", "right"]].set_visible(False)
        axis.spines[["left", "bottom"]].set_color(LINE)
        axis.grid(axis="x", color=LINE, linewidth=0.8, alpha=0.55)
        axis.set_axisbelow(True)

    figure.text(0.06, 0.055, "SAME EXIT EVIDENCE · approved source · raw copy · processed values · readable mapping · openable file", fontproperties=FONT_BOLD, fontsize=12.5, color=CORAL)
    save_figure(figure, path)


def source_lines(source: str) -> list[str]:
    """Normalize a cell source into nbformat-compatible lines."""

    return dedent(source).strip("\n").splitlines(keepends=True)


def markdown_cell(source: str) -> dict[str, object]:
    return {"cell_type": "markdown", "metadata": {}, "source": source_lines(source)}


def code_cell(source: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source_lines(source),
    }


def provided_input_digests() -> dict[str, str]:
    """Calculate immutable digests for the notebook's three provided inputs."""

    data_csv = "category,value\nArchive,34\nStudio,21\nScreening,18\nArchive,27\nStudio,19\nScreening,14\nArchive,23\nStudio,23\nScreening,17\n"
    text = (
        "record place sound memory walk record image place record sound "
        "archive memory record place sound record image walk record place "
        "archive memory record place sound walk record place"
    )
    sample_rate = 8000
    time = np.arange(sample_rate * 4, dtype=np.float64) / sample_rate
    signal = (
        (0.20 + 0.13 * np.sin(2 * np.pi * 0.42 * time))
        * np.sin(2 * np.pi * 220 * time)
    ).astype(np.float64)
    return {
        "data": hashlib.sha256(data_csv.encode("utf-8")).hexdigest(),
        "text": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "sound": hashlib.sha256(signal.tobytes()).hexdigest(),
    }


def build_notebook() -> dict[str, object]:
    """Build the self-checking three-track project starter notebook."""

    digests = provided_input_digests()
    cells = [
        markdown_cell(
            """
            # Week 14 · 30% Project Prototype Mission

            이 노트북은 **입력 하나 → 원본 보존 → 처리 규칙 하나 → 시각화 규칙 하나 → 열리는 PNG 하나**를 완성하는 개인 실습입니다.

            - 수정하는 코드 셀: **STEP 1**, **STEP 5**
            - 선택 경로: `data`, `text`, `sound`
            - 막히면 `input_mode = "provided"`를 유지하고 수업 제공 가상 자료로 먼저 완성합니다.
            - 자신의 파일을 쓰려면 프로젝트 면담에서 승인받고, 아래 규격에 맞춘 뒤 `input_mode = "own"`으로 바꿉니다.
            - 마지막에는 새 런타임에서 **모두 실행**하고 `WEEK 14 PROJECT PROTOTYPE COMPLETE`를 확인합니다.
            """
        ),
        code_cell(
            """
            # STEP 0 · 준비: 라이브러리와 실행 순서
            from pathlib import Path
            from collections import Counter
            import hashlib
            import importlib.util
            from importlib.metadata import PackageNotFoundError, version as package_version
            import re
            import subprocess
            import sys
            import textwrap
            import wave

            required_packages = {
                "numpy": ("numpy", "2.5.2"),
                "pandas": ("pandas", "2.3.3"),
                "matplotlib": ("matplotlib", "3.10.8"),
                "PIL": ("Pillow", "12.3.0"),
            }
            packages_to_install = []
            for module_name, (package_name, required_version) in required_packages.items():
                try:
                    installed_version = package_version(package_name)
                except PackageNotFoundError:
                    installed_version = None
                if importlib.util.find_spec(module_name) is None or installed_version != required_version:
                    packages_to_install.append(f"{package_name}=={required_version}")
            if packages_to_install:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *packages_to_install])

            import matplotlib.pyplot as plt
            import numpy as np
            import pandas as pd
            from PIL import Image
            from matplotlib import font_manager

            def font_has_korean_glyphs(font_path):
                try:
                    font = font_manager.get_font(font_path)
                except (OSError, RuntimeError):
                    return False
                return all(font.get_char_index(ord(character)) for character in "한글이름출처")

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
                raise RuntimeError("한글 글꼴을 찾지 못했습니다. Colab 새 런타임에서 STEP 0부터 다시 실행하세요.")
            font_manager.fontManager.addfont(korean_font_path)
            korean_font_name = font_manager.FontProperties(fname=korean_font_path).get_name()

            _run_order = [0]
            plt.rcParams.update({
                "font.family": korean_font_name,
                "figure.facecolor": "#f3efe5",
                "axes.facecolor": "#fffdf8",
                "axes.edgecolor": "#c7c8be",
                "text.color": "#202523",
                "axes.labelcolor": "#202523",
                "xtick.color": "#59615e",
                "ytick.color": "#59615e",
                "axes.unicode_minus": False,
            })
            print(f"STEP 0 PASS · 준비 완료 · 한글 글꼴 {korean_font_name}")
            """
        ),
        markdown_cell(
            """
            ## STEP 1 · 프로젝트 카드 입력

            따옴표 안의 `EDIT:` 문장을 자신의 프로젝트 정보로 바꿉니다. 처음에는 `project_track`만 선택하고 `input_mode = "provided"`를 유지하는 것이 가장 안전합니다.

            자신의 입력을 사용할 때의 규격은 다음과 같습니다.

            - 데이터: `category`, `value` 열이 있는 UTF-8 CSV
            - 텍스트: UTF-8 TXT
            - 소리: 모노 PCM WAV
            """
        ),
        code_cell(
            """
            # STEP 1 · EDIT: 프로젝트 카드와 입력 선택
            student_id = "학번"
            student_name = "이름"

            project_track = "data"  # data, text, sound 가운데 하나
            input_mode = "provided"  # provided 또는 own
            own_source_filename = ""  # own일 때만 같은 폴더의 파일명 입력

            project_question = "EDIT: 이 입력에서 어떤 차이나 변화가 보이는가?"
            intended_audience = "EDIT: 이 결과를 가장 먼저 볼 사람"
            project_source = "EDIT: 자료의 제목, 작성자 또는 제공자, 주소"
            usage_rights = "EDIT: 직접 제작, 공개 라이선스, 허가 등 이용 근거"
            scope_decision = "EDIT: 이번 주에는 구현하지 않기로 한 기능 한 가지"
            visual_rule = "EDIT: 어떤 값을 위치, 길이, 색상 또는 시간에 연결하는가"

            _run_order.append(1)
            print("STEP 1 READY · 프로젝트 카드 입력 완료")
            """
        ),
        markdown_cell(
            """
            ## STEP 2 · 입력 불러오기와 원본 보존

            세 경로는 입력 모양이 다르지만, **처리하기 전 원본을 별도 변수에 보존하고 지문(digest)을 기록한다**는 원칙은 같습니다. 제공 자료는 수업을 위해 만든 가상 자료입니다.
            """
        ),
        code_cell(
            f'''
            # STEP 2 · 입력 불러오기와 원본 보존
            PROVIDED_DATA_CSV = """category,value
            Archive,34
            Studio,21
            Screening,18
            Archive,27
            Studio,19
            Screening,14
            Archive,23
            Studio,23
            Screening,17
            """
            PROVIDED_TEXT = (
                "record place sound memory walk record image place record sound "
                "archive memory record place sound record image walk record place "
                "archive memory record place sound walk record place"
            )
            PROVIDED_SAMPLE_RATE = 8000
            PROVIDED_TIME = np.arange(PROVIDED_SAMPLE_RATE * 4, dtype=np.float64) / PROVIDED_SAMPLE_RATE
            PROVIDED_SOUND = (
                (0.20 + 0.13 * np.sin(2 * np.pi * 0.42 * PROVIDED_TIME))
                * np.sin(2 * np.pi * 220 * PROVIDED_TIME)
            ).astype(np.float64)
            EXPECTED_PROVIDED_DIGESTS = {digests!r}

            def sha256_bytes(payload):
                return hashlib.sha256(payload).hexdigest()

            assert project_track in {{"data", "text", "sound"}}, "project_track은 data, text, sound 가운데 하나여야 합니다."
            assert input_mode in {{"provided", "own"}}, "input_mode는 provided 또는 own이어야 합니다."

            source_path = None
            source_bytes_before = None
            if project_track == "data":
                if input_mode == "provided":
                    raw_payload = PROVIDED_DATA_CSV.encode("utf-8")
                    raw_data = pd.read_csv(pd.io.common.StringIO(PROVIDED_DATA_CSV))
                else:
                    source_path = Path(own_source_filename)
                    assert source_path.is_file(), "지정한 CSV 파일을 찾을 수 없습니다."
                    source_bytes_before = source_path.read_bytes()
                    raw_payload = source_bytes_before
                    raw_data = pd.read_csv(source_path)
                assert {{"category", "value"}}.issubset(raw_data.columns), "CSV에는 category와 value 열이 필요합니다."
                raw_data = raw_data[["category", "value"]].copy(deep=True)
                raw_data["category"] = raw_data["category"].astype(str)
                raw_data["value"] = pd.to_numeric(raw_data["value"], errors="raise")
                raw_snapshot = raw_data.copy(deep=True)
            elif project_track == "text":
                if input_mode == "provided":
                    raw_text = PROVIDED_TEXT
                    raw_payload = raw_text.encode("utf-8")
                else:
                    source_path = Path(own_source_filename)
                    assert source_path.is_file(), "지정한 TXT 파일을 찾을 수 없습니다."
                    source_bytes_before = source_path.read_bytes()
                    raw_payload = source_bytes_before
                    raw_text = source_bytes_before.decode("utf-8")
                raw_snapshot = raw_text
            else:
                if input_mode == "provided":
                    sample_rate = PROVIDED_SAMPLE_RATE
                    raw_signal = PROVIDED_SOUND.copy()
                    raw_payload = raw_signal.tobytes()
                else:
                    source_path = Path(own_source_filename)
                    assert source_path.is_file(), "지정한 WAV 파일을 찾을 수 없습니다."
                    source_bytes_before = source_path.read_bytes()
                    with wave.open(str(source_path), "rb") as sound_file:
                        assert sound_file.getnchannels() == 1, "WAV는 모노 파일이어야 합니다."
                        assert sound_file.getsampwidth() == 2, "WAV는 16-bit PCM이어야 합니다."
                        sample_rate = sound_file.getframerate()
                        frames = sound_file.readframes(sound_file.getnframes())
                    raw_signal = np.frombuffer(frames, dtype="<i2").astype(np.float64) / 32768.0
                    raw_payload = source_bytes_before
                raw_snapshot = raw_signal.copy()

            source_digest_before = sha256_bytes(raw_payload)
            if input_mode == "provided":
                assert source_digest_before == EXPECTED_PROVIDED_DIGESTS[project_track], "수업 제공 원본이 변경되었습니다."
            _run_order.append(2)
            print(f"STEP 2 PASS · {{project_track}} 원본 보존 · digest {{source_digest_before[:12]}}")
            '''
        ),
        markdown_cell(
            """
            ## STEP 3 · 처리 규칙 하나 실행

            - 데이터 경로는 같은 범주의 값을 더합니다.
            - 텍스트 경로는 단어를 소문자로 정리한 뒤 빈도를 셉니다.
            - 소리 경로는 짧은 구간마다 RMS 에너지를 계산합니다.

            출력되는 숫자는 장식이 아니라 시각화가 어떤 값을 사용했는지 보여 주는 증거입니다.
            """
        ),
        code_cell(
            """
            # STEP 3 · 처리 규칙 하나
            if project_track == "data":
                processed = (
                    raw_data.groupby("category", as_index=False)["value"]
                    .sum()
                    .sort_values("value", ascending=True)
                    .reset_index(drop=True)
                )
                processed_labels = processed["category"].tolist()
                processed_values = processed["value"].to_numpy(dtype=float)
                print(f"입력 {len(raw_data)}행 → 범주 {len(processed)}개")
            elif project_track == "text":
                tokens = re.findall(r"[0-9A-Za-z가-힣]+", raw_text.lower())
                token_counts = Counter(tokens)
                ranked_tokens = sorted(token_counts.items(), key=lambda item: (-item[1], item[0]))[:8]
                processed_labels = [item[0] for item in ranked_tokens][::-1]
                processed_values = np.array([item[1] for item in ranked_tokens][::-1], dtype=float)
                print(f"입력 {len(tokens)}토큰 → 상위 단어 {len(ranked_tokens)}개")
            else:
                frame_size = max(64, int(sample_rate * 0.05))
                hop_size = max(32, int(sample_rate * 0.025))
                frame_starts = np.arange(0, len(raw_signal) - frame_size + 1, hop_size)
                processed_values = np.array([
                    np.sqrt(np.mean(raw_signal[start:start + frame_size] ** 2))
                    for start in frame_starts
                ])
                processed_times = (frame_starts + frame_size / 2) / sample_rate
                assert len(processed_values) > 0, "소리가 너무 짧아 구간 에너지를 계산할 수 없습니다."
                print(f"입력 {len(raw_signal)}샘플 → 에너지 구간 {len(processed_values)}개")

            assert len(processed_values) > 0, "처리 결과가 비어 있습니다."
            assert np.isfinite(processed_values).all(), "처리 결과에 숫자가 아닌 값이 있습니다."
            _run_order.append(3)
            print("STEP 3 PASS · 처리 결과 확인")
            """
        ),
        markdown_cell(
            """
            ## STEP 4 · 처리 결과를 한 가지 시각 규칙에 연결

            세 경로 모두 같은 크기의 Figure를 사용합니다. 막대 경로는 처리된 값을 **길이**에, 소리 경로는 시간과 에너지를 **가로·세로 위치**에 연결합니다.
            """
        ),
        code_cell(
            """
            # STEP 4 · 핵심 시각화 한 화면
            figure, axis = plt.subplots(figsize=(8, 5), dpi=200)
            figure.subplots_adjust(left=0.18, right=0.95, top=0.69, bottom=0.30)
            figure.suptitle("30% PROJECT PROTOTYPE", x=0.08, y=0.96, ha="left", fontsize=20, fontweight="bold")
            figure.text(0.08, 0.895, f"Track: {project_track.upper()} · one input / one rule / one output", fontsize=10, color="#59615e")
            figure.text(0.08, 0.84, textwrap.fill(project_question, width=48), fontsize=11.5, fontweight="bold", va="top")

            if project_track in {"data", "text"}:
                visual_artists = axis.barh(processed_labels, processed_values, color="#116e68", height=0.62)
                axis.set_xlim(left=0)
                axis.set_xlabel("Aggregated value" if project_track == "data" else "Token count")
                for bar, value in zip(visual_artists, processed_values):
                    axis.text(value, bar.get_y() + bar.get_height() / 2, f" {value:g}", va="center", fontsize=9)
            else:
                (visual_artist,) = axis.plot(processed_times, processed_values, color="#116e68", linewidth=2.2)
                axis.fill_between(processed_times, processed_values, color="#dcebe6")
                axis.set_xlim(processed_times.min(), processed_times.max())
                axis.set_ylim(bottom=0)
                axis.set_xlabel("Time (seconds)")
                axis.set_ylabel("RMS energy")

            axis.set_title("Processed evidence", loc="left", fontsize=13, fontweight="bold")
            axis.spines[["top", "right"]].set_visible(False)
            axis.grid(axis="x" if project_track in {"data", "text"} else "y", color="#c7c8be", linewidth=0.8, alpha=0.55)
            axis.set_axisbelow(True)
            _run_order.append(4)
            print("STEP 4 PASS · 처리값을 시각 요소에 연결")
            plt.show()
            """
        ),
        markdown_cell(
            """
            ## STEP 5 · 관찰, 한계, 다음 행동 작성

            관찰은 화면에서 확인할 수 있는 수치나 위치를 포함합니다. 한계는 현재 입력만으로 단정할 수 없는 내용을 씁니다. 다음 행동은 “더 예쁘게 만들기” 대신 어떤 요소를 어떻게 수정할지 동사로 시작합니다.
            """
        ),
        code_cell(
            """
            # STEP 5 · EDIT: 관찰, 한계, 15주차 수정 두 가지
            main_observation = (
                "EDIT: 처리 결과에서 직접 확인한 수치 또는 변화 한 문장"
            )
            limitation_statement = (
                "EDIT: 현재 자료만으로 단정할 수 없는 내용 한 문장"
            )
            next_step_1 = "EDIT: 15주차에 먼저 실행할 구체적인 수정"
            next_step_2 = "EDIT: 15주차에 이어서 실행할 구체적인 수정"

            _run_order.append(5)
            print("STEP 5 READY · 해석과 다음 행동 입력 완료")
            """
        ),
        markdown_cell(
            """
            ## STEP 6 · PNG 저장

            저장한 뒤 노트북 밖에서 파일을 직접 열어 빈 화면, 글자 잘림, 지나치게 작은 글자가 없는지 확인합니다.
            """
        ),
        code_cell(
            """
            # STEP 6 · 1600 × 1000 PNG 저장
            def safe_filename_part(value):
                return re.sub(r"[^0-9A-Za-z가-힣_-]+", "-", str(value).strip()).strip("-")

            safe_student_id = safe_filename_part(student_id)
            safe_student_name = safe_filename_part(student_name)
            output_filename = f"week14_{safe_student_id}_{safe_student_name}_preview.png"
            output_path = Path(output_filename)

            figure.text(0.08, 0.20, textwrap.fill(main_observation, width=58), fontsize=8.7, color="#202523", va="top")
            figure.text(0.08, 0.12, textwrap.fill(f"LIMIT · {limitation_statement}", width=64), fontsize=7.7, color="#59615e", va="top")
            source_display = textwrap.shorten(project_source, width=78, placeholder="…")
            figure.text(0.08, 0.025, f"SOURCE · {source_display}", fontsize=7.2, color="#59615e")
            figure.savefig(output_path, dpi=200, facecolor="#f3efe5")
            _run_order.append(6)
            print(f"STEP 6 PASS · {output_filename} 저장")
            """
        ),
        markdown_cell(
            """
            ## STEP 7 · FINAL CHECK

            이 셀의 코드는 수정하지 않습니다. 새 런타임에서 **모두 실행**했을 때 모든 조건을 통과해야 합니다. 자동 검사는 파일과 수치의 일관성을 확인하며, 질문의 의미·자료 이용 권한·시각적 가독성은 교수 확인을 거칩니다.
            """
        ),
        code_cell(
            """
            # STEP 7 · FINAL CHECK: 이 셀은 수정하지 않습니다
            assert _run_order == [0, 1, 2, 3, 4, 5, 6], "새 런타임에서 STEP 0부터 모두 실행하세요."

            def is_finished_text(value, minimum, maximum=180):
                text = str(value).strip()
                return minimum <= len(text) <= maximum and "EDIT:" not in text and "\\n" not in text

            assert safe_student_id and student_id not in {"학번", "student_id"}, "실제 학번을 입력하세요."
            assert safe_student_name and student_name not in {"이름", "student_name"}, "실제 이름을 입력하세요."
            assert is_finished_text(project_question, 15, 70), "질문을 15~70자의 한 줄로 작성하세요."
            assert project_question.rstrip().endswith(("?", "？")), "프로젝트 질문은 물음표로 끝내세요."
            assert is_finished_text(intended_audience, 5, 80), "예상 독자를 5~80자로 작성하세요."
            assert is_finished_text(project_source, 10, 180), "자료 출처를 10~180자로 작성하세요."
            assert is_finished_text(usage_rights, 10, 180), "자료 이용 근거를 10~180자로 작성하세요."
            assert is_finished_text(scope_decision, 10, 180), "이번 주에 제외한 기능을 구체적으로 작성하세요."
            assert is_finished_text(visual_rule, 12, 180), "값과 시각 요소의 연결 규칙을 작성하세요."
            assert is_finished_text(main_observation, 20, 70), "관찰을 20~70자의 한 줄로 작성하세요."
            assert is_finished_text(limitation_statement, 20, 70), "한계를 20~70자의 한 줄로 작성하세요."
            assert is_finished_text(next_step_1, 12, 120), "첫 번째 다음 행동을 12~120자로 작성하세요."
            assert is_finished_text(next_step_2, 12, 120), "두 번째 다음 행동을 12~120자로 작성하세요."
            assert next_step_1 != next_step_2, "서로 다른 두 수정 행동을 작성하세요."

            if project_track == "data":
                pd.testing.assert_frame_equal(raw_data, raw_snapshot)
            elif project_track == "text":
                assert raw_text == raw_snapshot, "텍스트 원본이 변경되었습니다."
            else:
                assert np.array_equal(raw_signal, raw_snapshot), "소리 원본이 변경되었습니다."
            if input_mode == "provided":
                assert source_digest_before == EXPECTED_PROVIDED_DIGESTS[project_track], "제공 입력의 내용이 달라졌습니다."
            else:
                assert source_path.read_bytes() == source_bytes_before, "외부 입력 파일이 실행 중 변경되었습니다."

            if project_track in {"data", "text"}:
                rendered_values = np.array([bar.get_width() for bar in visual_artists], dtype=float)
                rendered_labels = [tick.get_text() for tick in axis.get_yticklabels()]
                assert len(visual_artists) == len(processed_values), "처리 결과와 막대 수가 다릅니다."
                assert np.allclose(rendered_values, processed_values), "막대 길이가 처리 결과와 일치하지 않습니다."
                assert rendered_labels == [str(label) for label in processed_labels], "막대 레이블이 처리 결과와 일치하지 않습니다."
            else:
                assert np.allclose(visual_artist.get_xdata(), processed_times), "가로 위치가 처리 시간과 일치하지 않습니다."
                assert np.allclose(visual_artist.get_ydata(), processed_values), "세로 위치가 에너지 값과 일치하지 않습니다."

            assert output_path.is_file() and output_path.stat().st_size > 20_000, "미리보기 PNG를 찾을 수 없거나 비어 있습니다."
            with Image.open(output_path) as saved_image:
                assert saved_image.format == "PNG", "결과 파일은 PNG여야 합니다."
                assert saved_image.size == (1600, 1000), "결과 크기는 1600 × 1000이어야 합니다."

            _run_order.append(7)
            print("=" * 52)
            print("WEEK 14 PROJECT PROTOTYPE COMPLETE")
            print(f"TRACK · {project_track} / INPUT · {input_mode}")
            print(f"OUTPUT · {output_filename}")
            print("교수 확인 · 질문-입력 대응 / 이용 권한 / 범위 / 가독성")
            print("=" * 52)
            """
        ),
        markdown_cell(
            """
            ## 제출 파일

            1. `week14_학번_이름_prototype.ipynb`
            2. `week14_학번_이름_preview.png`
            3. `input_mode = "own"`이면 실행에 사용한 원본 파일

            자동 검사 PASS 뒤 결과 파일을 직접 열고 교수의 범위 확인을 받은 다음 제출합니다.
            """
        ),
    ]
    return {
        "cells": cells,
        "metadata": {
            "colab": {"provenance": []},
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def write_notebook(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(build_notebook(), ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset-dir", type=Path, default=DEFAULT_ASSET_DIR)
    parser.add_argument("--check-runtime", action="store_true")
    args = parser.parse_args()

    runtime = validate_runtime()
    if args.check_runtime:
        print(json.dumps(runtime, sort_keys=True))
        return

    args.asset_dir.mkdir(parents=True, exist_ok=True)
    make_scope_to_slice(args.asset_dir / "week-14-scope-to-slice.png")
    make_prototype_contract(args.asset_dir / "week-14-prototype-contract.png")
    make_three_track_preview(args.asset_dir / "week-14-three-track-preview.png")
    write_notebook(args.asset_dir / "week-14-project-prototype-mission.ipynb")
    print("Generated Week 14 scope, prototype, track, and notebook assets.")


if __name__ == "__main__":
    main()
