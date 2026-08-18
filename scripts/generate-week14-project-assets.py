#!/usr/bin/env python3
"""Generate deterministic Week 14 project-prototype visuals and notebook."""

from __future__ import annotations

import argparse
import hashlib
import inspect
import json
from collections import Counter
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from textwrap import dedent, indent

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
GOLD = "#6f4f00"
PALE_TEAL = "#dcebe6"
PALE_CORAL = "#f0ddd8"
PALE_BLUE = "#dce5ef"
PALE_GOLD = "#eee3c5"

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
PROVIDED_SOUND_SECONDS = 4
PROVIDED_SOUND_PARAMETERS = {
    "base_amplitude": 0.20,
    "modulation_amplitude": 0.13,
    "modulation_hz": 0.42,
    "carrier_hz": 220.0,
}
PROVIDED_IMAGE_CSV = """x,y,size,color
0.18,0.24,58,#116e68
0.38,0.68,92,#365f91
0.58,0.40,74,#a23d34
0.76,0.70,48,#6f4f00
0.84,0.28,66,#116e68
"""

FONT_PATH = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
FONT_BOLD_PATH = (
    Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans-Bold.ttf"
)
FONT = font_manager.FontProperties(fname=FONT_PATH)
FONT_BOLD = font_manager.FontProperties(fname=FONT_BOLD_PATH)


def synthesize_provided_sound(
    time_values: np.ndarray,
    parameters: dict[str, float],
) -> np.ndarray:
    """Synthesize the shared teaching signal from explicit parameters."""

    return (
        (
            parameters["base_amplitude"]
            + parameters["modulation_amplitude"]
            * np.sin(2 * np.pi * parameters["modulation_hz"] * time_values)
        )
        * np.sin(2 * np.pi * parameters["carrier_hz"] * time_values)
    ).astype(np.float64)


def provided_sound() -> np.ndarray:
    """Return the deterministic four-second teaching signal."""

    time_values = (
        np.arange(PROVIDED_SAMPLE_RATE * PROVIDED_SOUND_SECONDS, dtype=np.float64)
        / PROVIDED_SAMPLE_RATE
    )
    return synthesize_provided_sound(time_values, PROVIDED_SOUND_PARAMETERS)


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


def assert_figure_content_inside_canvas(
    figure: plt.Figure,
    axes: list[plt.Axes] | np.ndarray,
) -> None:
    """Fail generation when labels or chart bounds cross the image frame."""

    figure.canvas.draw()
    renderer = figure.canvas.get_renderer()
    figure_bounds = figure.bbox
    for axis in np.asarray(axes, dtype=object).flat:
        bounds = axis.get_tightbbox(renderer)
        if not (
            bounds.x0 >= figure_bounds.x0
            and bounds.y0 >= figure_bounds.y0
            and bounds.x1 <= figure_bounds.x1
            and bounds.y1 <= figure_bounds.y1
        ):
            raise AssertionError("Week 14 preview label crossed the image frame")
    for artist in figure.texts:
        bounds = artist.get_window_extent(renderer)
        if not (
            bounds.x0 >= figure_bounds.x0
            and bounds.y0 >= figure_bounds.y0
            and bounds.x1 <= figure_bounds.x1
            and bounds.y1 <= figure_bounds.y1
        ):
            raise AssertionError("Week 14 preview text crossed the image frame")


def make_project_path_preview(path: Path) -> None:
    """Preview equivalent outputs for the four supported project paths."""

    apply_style()
    figure, axes = plt.subplots(2, 2, figsize=(16, 9), dpi=100)
    figure.subplots_adjust(
        left=0.105,
        right=0.965,
        top=0.78,
        bottom=0.105,
        hspace=0.50,
        wspace=0.30,
    )
    figure.text(
        0.06,
        0.93,
        "FOUR PATHS · ONE PROTOTYPE CONTRACT",
        fontproperties=FONT_BOLD,
        fontsize=29,
        color=INK,
    )
    figure.text(
        0.06,
        0.87,
        "Data, text, sound, or rule-based image: preserve one input, apply one rule, map it, and export it.",
        fontproperties=FONT,
        fontsize=14,
        color=MUTED,
    )

    data_frame = pd.read_csv(pd.io.common.StringIO(PROVIDED_DATA_CSV))
    data_totals = data_frame.groupby("category")["value"].sum().sort_values()
    axes[0, 0].barh(data_totals.index, data_totals.values, color=[TEAL, GOLD, CORAL])
    axes[0, 0].set_xlim(0, 95)
    axes[0, 0].set_xlabel("Total visits")
    axes[0, 0].set_title(
        "DATA · group and compare",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=13,
    )

    token_counts = Counter(PROVIDED_TEXT.split())
    top_words = sorted(token_counts.items(), key=lambda item: (-item[1], item[0]))[:5]
    words = [item[0] for item in top_words][::-1]
    counts = [item[1] for item in top_words][::-1]
    axes[0, 1].barh(words, counts, color=BLUE)
    axes[0, 1].set_xlim(0, max(counts) + 1)
    axes[0, 1].set_xlabel("Token count")
    axes[0, 1].set_title(
        "TEXT · count and rank",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=13,
    )

    signal = provided_sound()
    frame_size = int(PROVIDED_SAMPLE_RATE * 0.05)
    hop = int(PROVIDED_SAMPLE_RATE * 0.025)
    starts = np.arange(0, len(signal) - frame_size + 1, hop)
    rms = np.array(
        [np.sqrt(np.mean(signal[start : start + frame_size] ** 2)) for start in starts]
    )
    frame_times = (starts + frame_size / 2) / PROVIDED_SAMPLE_RATE
    axes[1, 0].plot(frame_times, rms, color=TEAL, linewidth=2.3)
    axes[1, 0].fill_between(frame_times, rms, color=PALE_TEAL)
    axes[1, 0].set_ylim(0, max(rms) * 1.25)
    axes[1, 0].set_xlabel("Time (seconds)")
    axes[1, 0].set_ylabel("RMS energy")
    axes[1, 0].set_title(
        "SOUND · measure over time",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=13,
    )

    image_frame = pd.read_csv(pd.io.common.StringIO(PROVIDED_IMAGE_CSV))
    axes[1, 1].scatter(
        image_frame["x"],
        image_frame["y"],
        s=image_frame["size"] ** 2 / 3,
        c=image_frame["color"],
        edgecolors=INK,
        linewidths=0.8,
    )
    axes[1, 1].set(xlim=(0, 1), ylim=(0, 1), xlabel="x position", ylabel="y position")
    axes[1, 1].set_aspect("equal", adjustable="box")
    axes[1, 1].set_title(
        "RULE IMAGE · parameters to form",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=13,
    )

    for axis in axes.flat:
        axis.spines[["top", "right"]].set_visible(False)
        axis.spines[["left", "bottom"]].set_color(LINE)
        axis.grid(color=LINE, linewidth=0.8, alpha=0.45)
        axis.set_axisbelow(True)

    figure.text(
        0.06,
        0.032,
        "SAME EXIT EVIDENCE · approved source · raw copy · processed values · readable mapping · openable file",
        fontproperties=FONT_BOLD,
        fontsize=12.5,
        color=CORAL,
    )
    assert_figure_content_inside_canvas(figure, axes)
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
    """Calculate immutable digests from the shared four-path fixtures."""

    return {
        "data": hashlib.sha256(PROVIDED_DATA_CSV.encode("utf-8")).hexdigest(),
        "text": hashlib.sha256(PROVIDED_TEXT.encode("utf-8")).hexdigest(),
        "sound": hashlib.sha256(provided_sound().tobytes()).hexdigest(),
        "image": hashlib.sha256(PROVIDED_IMAGE_CSV.encode("utf-8")).hexdigest(),
    }


def build_notebook() -> dict[str, object]:
    """Build the self-checking four-path project starter notebook."""

    digests = provided_input_digests()
    step_two_source = """
    # STEP 2 · 입력 불러오기와 원본 보존
    PROVIDED_DATA_CSV = __PROVIDED_DATA_CSV__
    PROVIDED_TEXT = __PROVIDED_TEXT__
    PROVIDED_SAMPLE_RATE = __PROVIDED_SAMPLE_RATE__
    PROVIDED_SOUND_SECONDS = __PROVIDED_SOUND_SECONDS__
    PROVIDED_SOUND_PARAMETERS = __PROVIDED_SOUND_PARAMETERS__
__PROVIDED_SOUND_FUNCTION__
    PROVIDED_TIME = (
        np.arange(PROVIDED_SAMPLE_RATE * PROVIDED_SOUND_SECONDS, dtype=np.float64)
        / PROVIDED_SAMPLE_RATE
    )
    PROVIDED_SOUND = synthesize_provided_sound(
        PROVIDED_TIME,
        PROVIDED_SOUND_PARAMETERS,
    )
    PROVIDED_IMAGE_CSV = __PROVIDED_IMAGE_CSV__
    EXPECTED_PROVIDED_DIGESTS = __EXPECTED_PROVIDED_DIGESTS__

    def sha256_bytes(payload):
        return hashlib.sha256(payload).hexdigest()

    def read_checked_table(payload, required_columns, *, label):
        table = pd.read_csv(pd.io.common.BytesIO(payload))
        missing_columns = set(required_columns) - set(table.columns)
        assert not missing_columns, f"{label}에 필요한 열이 없습니다: {sorted(missing_columns)}"
        return table[list(required_columns)].copy(deep=True)

    assert project_track in {"data", "text", "sound", "image"}, (
        "project_track은 data, text, sound, image 가운데 하나여야 합니다."
    )
    assert input_mode in {"provided", "own"}, "input_mode는 provided 또는 own이어야 합니다."
    assert output_format in {"png", "html"}, "output_format은 png 또는 html이어야 합니다."

    source_path = None
    source_bytes_before = None
    if input_mode == "own":
        assert Path(own_source_filename).name == own_source_filename, (
            "own_source_filename에는 폴더가 아닌 업로드한 파일명만 입력하세요."
        )
        assert own_source_filename == expected_own_source_filename, (
            f"자신의 입력 파일명을 {expected_own_source_filename}(으)로 바꾸고 STEP 1부터 다시 실행하세요."
        )
    if project_track == "data":
        if input_mode == "provided":
            raw_payload = PROVIDED_DATA_CSV.encode("utf-8")
        else:
            source_path = Path(own_source_filename)
            assert source_path.is_file(), "지정한 CSV 파일을 찾을 수 없습니다."
            source_bytes_before = source_path.read_bytes()
            raw_payload = source_bytes_before
        candidate_data = read_checked_table(
            raw_payload,
            ("category", "value"),
            label="데이터 CSV",
        )
        assert candidate_data["category"].notna().all(), "category 열에 결측값이 있습니다."
        category_values = candidate_data["category"].astype(str).str.strip()
        assert category_values.ne("").all(), "category 열에 빈 문자열이 있습니다."
        numeric_values = pd.to_numeric(candidate_data["value"], errors="coerce")
        assert numeric_values.notna().all(), "value 열에 결측값 또는 숫자가 아닌 값이 있습니다."
        assert np.isfinite(numeric_values.to_numpy(dtype=float)).all(), "value 열에는 유한한 숫자만 사용할 수 있습니다."
        assert numeric_values.ge(0).all(), "value 열에는 0 이상의 값만 사용할 수 있습니다."
        raw_data = pd.DataFrame({"category": category_values, "value": numeric_values})
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
        assert raw_text.strip(), "텍스트 입력이 비어 있습니다."
        raw_snapshot = raw_text
    elif project_track == "sound":
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
                assert sample_rate > 0, "WAV 샘플링 레이트가 올바르지 않습니다."
                frames = sound_file.readframes(sound_file.getnframes())
            raw_signal = np.frombuffer(frames, dtype="<i2").astype(np.float64) / 32768.0
            raw_payload = source_bytes_before
        assert len(raw_signal) > 0, "소리 입력이 비어 있습니다."
        assert np.isfinite(raw_signal).all(), "소리 입력에 유한하지 않은 값이 있습니다."
        raw_snapshot = raw_signal.copy()
    else:
        if input_mode == "provided":
            raw_payload = PROVIDED_IMAGE_CSV.encode("utf-8")
        else:
            source_path = Path(own_source_filename)
            assert source_path.is_file(), "지정한 이미지 매개변수 CSV를 찾을 수 없습니다."
            source_bytes_before = source_path.read_bytes()
            raw_payload = source_bytes_before
        candidate_image = read_checked_table(
            raw_payload,
            ("x", "y", "size", "color"),
            label="이미지 매개변수 CSV",
        )
        assert candidate_image.notna().all().all(), "이미지 매개변수에 결측값이 있습니다."
        for numeric_column in ("x", "y", "size"):
            candidate_image[numeric_column] = pd.to_numeric(
                candidate_image[numeric_column],
                errors="coerce",
            )
            assert candidate_image[numeric_column].notna().all(), f"{numeric_column} 열에는 숫자만 입력하세요."
            assert np.isfinite(candidate_image[numeric_column]).all(), f"{numeric_column} 열에는 유한한 숫자만 사용하세요."
        assert candidate_image["x"].between(0, 1).all(), "x 값은 0과 1 사이여야 합니다."
        assert candidate_image["y"].between(0, 1).all(), "y 값은 0과 1 사이여야 합니다."
        assert candidate_image["size"].between(10, 180).all(), "size 값은 10과 180 사이여야 합니다."
        color_values = candidate_image["color"].astype(str).str.strip()
        assert color_values.str.fullmatch(r"#[0-9A-Fa-f]{6}").all(), "color는 #RRGGBB 형식이어야 합니다."
        candidate_image["color"] = color_values
        raw_image_params = candidate_image
        raw_snapshot = raw_image_params.copy(deep=True)

    source_digest_before = sha256_bytes(raw_payload)
    if input_mode == "provided":
        assert source_digest_before == EXPECTED_PROVIDED_DIGESTS[project_track], "수업 제공 원본이 변경되었습니다."
    _run_order.append(2)
    print(f"STEP 2 PASS · {project_track} 원본 보존 · digest {source_digest_before[:12]}")
    """
    step_two_source = (
        step_two_source.replace("__PROVIDED_DATA_CSV__", repr(PROVIDED_DATA_CSV))
        .replace("__PROVIDED_TEXT__", repr(PROVIDED_TEXT))
        .replace("__PROVIDED_SAMPLE_RATE__", repr(PROVIDED_SAMPLE_RATE))
        .replace("__PROVIDED_SOUND_SECONDS__", repr(PROVIDED_SOUND_SECONDS))
        .replace("__PROVIDED_SOUND_PARAMETERS__", repr(PROVIDED_SOUND_PARAMETERS))
        .replace(
            "__PROVIDED_SOUND_FUNCTION__",
            indent(dedent(inspect.getsource(synthesize_provided_sound)), "    ").rstrip(),
        )
        .replace("__PROVIDED_IMAGE_CSV__", repr(PROVIDED_IMAGE_CSV))
        .replace("__EXPECTED_PROVIDED_DIGESTS__", repr(digests))
    )
    cells = [
        markdown_cell(
            """
            # Week 14 · 30% Project Prototype Mission

            이 노트북은 **입력 하나 → 원본 보존 → 처리 규칙 하나 → 시각화 규칙 하나 → 열리는 PNG 또는 HTML 하나**를 완성하는 개인 실습입니다.

            - 공통 시작 경로에서 수정하는 셀: **STEP 1**, **STEP 5**
            - 선택 경로: `data`, `text`, `sound`, `image`
            - 막히면 `input_mode = "provided"`를 유지하고 수업 제공 가상 자료로 먼저 완성합니다.
            - 자신의 파일을 쓰려면 프로젝트 면담에서 승인받고, 아래 규격에 맞춘 뒤 `input_mode = "own"`으로 바꿉니다.
            - 9–13주차의 개인 코드를 재사용하려면 2교시 신청자 면담에서 처리·매핑 규칙을 승인받고 `reuse_status`를 `approved` 또는 `scoped`로 기록한 뒤 STEP 3·4의 **APPROVED REUSE ZONE**만 교체합니다. 제공 입력을 쓰면서 승인 코드를 재사용할 수도 있습니다. 이 구역은 Matplotlib Figure를 만드는 계약이며 Folium·별도 웹페이지 전체를 넣지 않습니다.
            - 마지막에는 새 런타임에서 **모두 실행**하고 `WEEK 14 PROJECT PROTOTYPE COMPLETE`를 확인합니다.
            """
        ),
        code_cell(
            """
            # STEP 0 · 준비: 라이브러리와 실행 순서
            from pathlib import Path
            from collections import Counter
            import base64
            import hashlib
            import html as html_module
            import importlib.util
            from importlib.metadata import PackageNotFoundError, version as package_version
            import io
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
            from matplotlib.colors import to_rgba

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

            따옴표 안의 `EDIT:` 문장을 자신의 프로젝트 정보로 바꿉니다. 처음에는 `project_track`만 선택하고 `input_mode = "provided"`, `reuse_status = "guided"`를 유지하는 것이 가장 안전합니다. 입력 판정과 코드 재사용 판정은 서로 다릅니다. 제공 입력은 `approval_status = "provided"`, 자기 입력은 승인 뒤 `approved` 또는 `scoped`를 기록합니다. 공통 코드를 유지하면 `reuse_status = "guided"`, STEP 3·4를 바꾸면 승인 뒤 `approved` 또는 `scoped`를 기록합니다. 최종 30–45초 증거 확인을 받은 뒤에만 `teacher_gate`를 `"confirmed"`로 바꿉니다.

            자신의 입력을 사용할 때의 규격은 다음과 같습니다.

            - 데이터: `category`, `value` 열이 있는 UTF-8 CSV (`value`는 0 이상의 수)
            - 텍스트: UTF-8 TXT
            - 소리: 모노 PCM WAV
            - 규칙 기반 이미지: `x`, `y`, `size`, `color` 열이 있는 UTF-8 CSV (`x`, `y`는 0–1, `color`는 `#RRGGBB`)
            """
        ),
        code_cell(
            """
            # STEP 1 · EDIT: 프로젝트 카드와 입력 선택
            student_id = "학번"
            student_name = "이름"

            project_track = "data"  # data, text, sound, image 가운데 하나
            input_mode = "provided"  # provided 또는 own
            own_source_filename = ""  # own일 때 week14_학번_이름_source.확장자 입력
            output_format = "png"  # png 또는 html

            approval_status = "EDIT: approved / scoped / provided 가운데 1차 면담 판정"
            approval_note = "EDIT: 승인된 핵심 범위 또는 줄인 기능을 한 문장으로 기록"
            reuse_status = "guided"  # guided, approved, scoped 가운데 하나
            reuse_note = "EDIT: 공통 코드를 유지하거나 승인받아 교체한 STEP 3·4 범위를 기록"
            teacher_gate = "pending"  # 최종 교수 확인 뒤에만 confirmed로 변경

            project_question = "EDIT: 이 입력에서 어떤 차이나 변화가 보이는가?"
            intended_audience = "EDIT: 이 결과를 가장 먼저 볼 사람"
            project_source = "EDIT: 자료의 제목, 작성자 또는 제공자, 주소"
            usage_rights = "EDIT: 직접 제작, 공개 라이선스, 허가 등 이용 근거"
            reference_date = "EDIT: 자료를 수집하거나 제작한 날짜 또는 기간"
            privacy_check = "EDIT: 개인정보를 제외하거나 동의를 확인한 방법"
            observation_unit = "EDIT: 입력 한 행, 토큰, 프레임 또는 매개변수 한 건의 의미"
            value_unit = "EDIT: 합계, 횟수, RMS, px 등 화면 값의 단위"
            scope_decision = "EDIT: 이번 주에는 구현하지 않기로 한 기능 한 가지"
            processing_rule = "EDIT: 입력에서 무엇을 계산하거나 변환하는가"
            visual_rule = "EDIT: 어떤 값을 위치, 길이, 색상 또는 시간에 연결하는가"

            def safe_filename_part(value):
                return re.sub(r"[^0-9A-Za-z가-힣_-]+", "-", str(value).strip()).strip("-")

            safe_student_id = safe_filename_part(student_id)
            safe_student_name = safe_filename_part(student_name)
            own_source_suffix = {
                "data": ".csv",
                "text": ".txt",
                "sound": ".wav",
                "image": ".csv",
            }.get(project_track, "")
            expected_own_source_filename = (
                f"week14_{safe_student_id}_{safe_student_name}_source{own_source_suffix}"
            )

            _run_order.append(1)
            print("STEP 1 READY · 프로젝트 카드 입력 완료")
            """
        ),
        markdown_cell(
            """
            ## STEP 2 · 입력 불러오기와 원본 보존

            네 경로는 입력 모양이 다르지만, **처리하기 전 원본을 별도 변수에 보존하고 지문(digest)을 기록한다**는 원칙은 같습니다. 제공 자료는 수업을 위해 만든 가상 자료입니다. 데이터와 이미지 CSV는 결측값·빈 범주·무한대까지 먼저 검사하며, 데이터 막대 경로의 `value`는 0 이상이어야 합니다. `own` 파일은 업로드 전에 `week14_학번_이름_source.확장자`로 이름을 바꾸고 STEP 1에도 같은 이름을 기록합니다.
            """
        ),
        code_cell(step_two_source),
        markdown_cell(
            """
            ## STEP 3 · 처리 규칙 하나 실행

            - 데이터 경로는 같은 범주의 값을 더합니다.
            - 텍스트 경로는 단어를 소문자로 정리한 뒤 빈도를 셉니다.
            - 소리 경로는 짧은 구간마다 RMS 에너지를 계산합니다.
            - 규칙 기반 이미지 경로는 위치·크기·색 매개변수를 유효한 도형 값으로 준비합니다.

            출력되는 숫자는 장식이 아니라 시각화가 어떤 값을 사용했는지 보여 주는 증거입니다. 2교시 신청자 면담에서 다른 처리 규칙을 승인받았다면 `reuse_status`와 `reuse_note`를 기록하고 아래 `APPROVED REUSE ZONE`의 해당 분기만 이전 주차 코드로 교체하되, 마지막에 비어 있지 않은 1차원 수치 배열 `processed_values`를 남깁니다. Folium·별도 HTML 저장은 이번 구역에 넣지 않고 15주차 행동으로 기록합니다.
            """
        ),
        code_cell(
            """
            # STEP 3 · 처리 규칙 하나
            # APPROVED REUSE ZONE · 승인받은 경우 해당 분기 내부만 이전 주차 코드로 교체
            if project_track == "data":
                processed = (
                    raw_data.groupby("category", as_index=False)["value"]
                    .sum()
                    .sort_values("value", ascending=True)
                    .reset_index(drop=True)
                )
                processed_labels = processed["category"].tolist()
                processed_values = processed["value"].to_numpy(dtype=float)
                input_count = len(raw_data)
                print(f"입력 {input_count}행 → 범주 {len(processed)}개")
            elif project_track == "text":
                tokens = re.findall(r"[0-9A-Za-z가-힣]+", raw_text.lower())
                token_counts = Counter(tokens)
                ranked_tokens = sorted(token_counts.items(), key=lambda item: (-item[1], item[0]))[:8]
                processed_labels = [item[0] for item in ranked_tokens][::-1]
                processed_values = np.array([item[1] for item in ranked_tokens][::-1], dtype=float)
                input_count = len(tokens)
                print(f"입력 {input_count}토큰 → 상위 단어 {len(ranked_tokens)}개")
            elif project_track == "sound":
                frame_size = max(64, int(sample_rate * 0.05))
                hop_size = max(32, int(sample_rate * 0.025))
                frame_starts = np.arange(0, len(raw_signal) - frame_size + 1, hop_size)
                processed_values = np.array([
                    np.sqrt(np.mean(raw_signal[start:start + frame_size] ** 2))
                    for start in frame_starts
                ])
                processed_times = (frame_starts + frame_size / 2) / sample_rate
                assert len(processed_values) > 0, "소리가 너무 짧아 구간 에너지를 계산할 수 없습니다."
                input_count = len(raw_signal)
                print(f"입력 {input_count}샘플 → 에너지 구간 {len(processed_values)}개")
            else:
                processed_x = raw_image_params["x"].to_numpy(dtype=float)
                processed_y = raw_image_params["y"].to_numpy(dtype=float)
                processed_values = raw_image_params["size"].to_numpy(dtype=float)
                processed_colors = raw_image_params["color"].tolist()
                input_count = len(raw_image_params)
                print(f"입력 {input_count}개 매개변수 → 도형 {len(processed_values)}개")

            processed_values = np.asarray(processed_values, dtype=float)
            assert processed_values.ndim == 1 and len(processed_values) > 0, "처리 결과는 비어 있지 않은 1차원 값이어야 합니다."
            assert np.isfinite(processed_values).all(), "처리 결과에 유한하지 않은 값이 있습니다."
            processing_evidence_values = processed_values.copy()
            _run_order.append(3)
            print("STEP 3 PASS · 처리 결과 확인")
            """
        ),
        markdown_cell(
            """
            ## STEP 4 · 처리 결과를 한 가지 시각 규칙에 연결

            네 경로 모두 같은 크기의 Figure를 사용합니다. 막대 경로는 처리된 값을 **길이**에, 소리 경로는 시간과 에너지를 **가로·세로 위치**에, 규칙 이미지 경로는 값을 **위치·크기·색**에 연결합니다. 승인받은 개인 표현은 아래 공통 어댑터 계약을 모두 지킵니다.

            - 모든 경로: `mapping_source_values`, `mapping_visual_values`
            - 데이터·텍스트: `mapping_source_labels`, `mapping_visual_labels`
            - 소리·이미지: `mapping_source_positions`, `mapping_visual_positions`
            - 이미지: `mapping_source_colors`, `mapping_visual_colors`

            사용하지 않는 쌍은 `None`으로 둡니다. FINAL CHECK는 이 공개 변수만 읽으며 `visual_element_count`는 화면 값의 길이에서 자동 계산합니다.
            """
        ),
        code_cell(
            """
            # STEP 4 · 핵심 시각화 한 화면
            # APPROVED REUSE ZONE · 승인받은 경우 해당 분기 내부와 증거 추출만 교체
            mapping_source_labels = None
            mapping_visual_labels = None
            mapping_source_positions = None
            mapping_visual_positions = None
            mapping_source_colors = None
            mapping_visual_colors = None

            figure, axis = plt.subplots(figsize=(8, 5), dpi=200)
            figure.subplots_adjust(left=0.18, right=0.95, top=0.69, bottom=0.30)
            figure.suptitle("30% PROJECT PROTOTYPE", x=0.08, y=0.96, ha="left", fontsize=20, fontweight="bold")
            figure.text(0.08, 0.895, f"Track: {project_track.upper()} · one input / one rule / one output", fontsize=10, color="#59615e")
            figure.text(0.08, 0.84, textwrap.fill(project_question, width=48), fontsize=11.5, fontweight="bold", va="top")

            if project_track in {"data", "text"}:
                visual_artists = axis.barh(processed_labels, processed_values, color="#116e68", height=0.62)
                axis.set_xlim(left=0)
                axis.set_xlabel(value_unit)
                for bar, value in zip(visual_artists, processed_values):
                    axis.text(value, bar.get_y() + bar.get_height() / 2, f" {value:g}", va="center", fontsize=9)
                mapping_visual_values = np.array([bar.get_width() for bar in visual_artists], dtype=float)
                mapping_source_labels = [str(label) for label in processed_labels]
                mapping_visual_labels = [tick.get_text() for tick in axis.get_yticklabels()]
            elif project_track == "sound":
                (visual_artist,) = axis.plot(processed_times, processed_values, color="#116e68", linewidth=2.2)
                axis.fill_between(processed_times, processed_values, color="#dcebe6")
                axis.set_xlim(processed_times.min(), processed_times.max())
                axis.set_ylim(bottom=0)
                axis.set_xlabel("Time (seconds)")
                axis.set_ylabel(value_unit)
                mapping_visual_values = np.asarray(visual_artist.get_ydata(), dtype=float)
                mapping_source_positions = np.asarray(processed_times, dtype=float)
                mapping_visual_positions = np.asarray(visual_artist.get_xdata(), dtype=float)
            else:
                visual_artist = axis.scatter(
                    processed_x,
                    processed_y,
                    s=processed_values ** 2 / 3,
                    c=processed_colors,
                    edgecolors="#202523",
                    linewidths=0.8,
                )
                axis.set(xlim=(0, 1), ylim=(0, 1), xlabel="x position", ylabel="y position")
                axis.set_aspect("equal", adjustable="box")
                mapping_visual_values = np.sqrt(np.asarray(visual_artist.get_sizes(), dtype=float) * 3)
                mapping_source_positions = np.column_stack((processed_x, processed_y))
                mapping_visual_positions = np.asarray(visual_artist.get_offsets(), dtype=float)
                mapping_source_colors = np.asarray([to_rgba(color) for color in processed_colors], dtype=float)
                mapping_visual_colors = np.asarray(visual_artist.get_facecolors(), dtype=float)

            axis.set_title("Processed evidence", loc="left", fontsize=13, fontweight="bold")
            axis.spines[["top", "right"]].set_visible(False)
            axis.grid(axis="x" if project_track in {"data", "text"} else "both", color="#c7c8be", linewidth=0.8, alpha=0.55)
            axis.set_axisbelow(True)
            mapping_source_values = np.asarray(processed_values, dtype=float)
            mapping_visual_values = np.asarray(mapping_visual_values, dtype=float)
            _run_order.append(4)
            print("STEP 4 PASS · 처리값을 시각 요소에 연결")
            plt.show()
            """
        ),
        markdown_cell(
            """
            ## STEP 5 · 관찰, 한계, 다음 행동 작성

            관찰 근거에는 화면에서 가리킬 수 있는 수치·단어·시간·도형 위치를 짧게 적고, 같은 근거를 관찰 문장에 포함합니다. 한계는 현재 입력만으로 단정할 수 없는 내용을 씁니다. 다음 행동은 “더 예쁘게 만들기” 대신 어떤 요소를 어떻게 수정할지 동사로 시작합니다. 교수는 네 문장이 실제 결과와 맞는지 확인한 뒤 피드백을 남깁니다.
            """
        ),
        code_cell(
            """
            # STEP 5 · EDIT: 관찰, 한계, 15주차 수정 두 가지
            observation_evidence = "EDIT: 화면에서 직접 가리킬 수 있는 수치, 단어, 시간 또는 위치"
            main_observation = (
                "EDIT: 위 관찰 근거를 그대로 포함한 직접 관찰 한 문장"
            )
            limitation_statement = (
                "EDIT: 현재 자료만으로 단정할 수 없는 내용 한 문장"
            )
            next_step_1 = "EDIT: 15주차에 먼저 실행할 구체적인 수정"
            next_step_2 = "EDIT: 15주차에 이어서 실행할 구체적인 수정"
            teacher_feedback = "EDIT: 교수가 확인한 관찰·한계·수정 행동에 대한 짧은 기록"

            _run_order.append(5)
            print("STEP 5 READY · 해석과 다음 행동 입력 완료")
            """
        ),
        markdown_cell(
            """
            ## STEP 6 · PNG 또는 HTML 저장

            `output_format`에 따라 1600 × 1000 PNG 또는 같은 PNG와 질문·관찰·한계·출처를 내부에 포함한 반응형 HTML을 저장합니다. 이 HTML은 정적 증거 문서이며 Folium·별도 인터랙티브 웹페이지를 합치는 옵션이 아닙니다. 저장한 뒤 노트북 밖에서 직접 열어 빈 화면, 글자 잘림, 지나치게 작은 글자가 없는지 확인합니다.
            """
        ),
        code_cell(
            """
            # STEP 6 · 1600 × 1000 PNG 또는 독립 HTML 저장
            output_filename = f"week14_{safe_student_id}_{safe_student_name}_preview.{output_format}"
            output_path = Path(output_filename)

            figure.text(0.08, 0.20, textwrap.fill(main_observation, width=58), fontsize=8.7, color="#202523", va="top")
            figure.text(0.08, 0.12, textwrap.fill(f"LIMIT · {limitation_statement}", width=64), fontsize=7.7, color="#59615e", va="top")
            source_display = textwrap.shorten(project_source, width=78, placeholder="…")
            figure.text(0.08, 0.025, f"SOURCE · {source_display} · {reference_date}", fontsize=7.2, color="#59615e")

            preview_buffer = io.BytesIO()
            figure.savefig(preview_buffer, format="png", dpi=200, facecolor="#f3efe5")
            preview_png_bytes = preview_buffer.getvalue()
            if output_format == "png":
                output_path.write_bytes(preview_png_bytes)
            else:
                encoded_preview = base64.b64encode(preview_png_bytes).decode("ascii")
                html_title = html_module.escape(project_question)
                html_source = html_module.escape(project_source)
                html_rights = html_module.escape(usage_rights)
                html_limit = html_module.escape(limitation_statement)
                html_observation = html_module.escape(main_observation)
                html_alt = html_module.escape(
                    f"{project_track} 경로의 핵심 시각화. {main_observation}",
                    quote=True,
                )
                html_output = f'''<!doctype html>
            <html lang="ko">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html_title}</title><style>body{{margin:0;background:#f3efe5;color:#202523;font-family:system-ui,sans-serif}}main{{width:min(92vw,68rem);margin:0 auto;padding:2rem 0 4rem}}img{{display:block;max-width:100%;height:auto}}figcaption{{line-height:1.6}}figure{{margin:1.5rem 0}}</style></head>
            <body><main><h1>{html_title}</h1><figure><img src="data:image/png;base64,{encoded_preview}" width="1600" height="1000" alt="{html_alt}"><figcaption><p><strong>관찰:</strong> {html_observation}</p><p><strong>한계:</strong> {html_limit}</p></figcaption></figure><p><strong>출처:</strong> {html_source}</p><p><strong>이용 근거:</strong> {html_rights}</p></main></body>
            </html>'''
                output_path.write_text(html_output, encoding="utf-8")
            _run_order.append(6)
            print(f"STEP 6 PASS · {output_filename} 저장")
            """
        ),
        markdown_cell(
            """
            ## STEP 7 · FINAL CHECK

            이 셀의 코드는 수정하지 않습니다. 새 런타임에서 **모두 실행**했을 때 모든 조건을 통과해야 합니다. 자동 검사는 파일과 수치의 일관성, 관찰 근거의 포함 여부를 확인합니다. 질문의 의미·자료 이용 권한·관찰과 한계의 타당성·수정 행동·시각적 가독성은 교수 확인을 거치며, 확인 전에는 `teacher_gate = "pending"`이라 PASS가 나오지 않습니다.
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
            assert approval_status in {"approved", "scoped", "provided"}, "1차 면담 판정을 approved, scoped, provided 가운데 하나로 기록하세요."
            if input_mode == "provided":
                assert approval_status == "provided", "제공 경로는 approval_status를 provided로 기록하세요."
            else:
                assert approval_status in {"approved", "scoped"}, "자신의 입력은 1차 면담 승인 또는 범위 축소 승인이 필요합니다."
            assert is_finished_text(approval_note, 10, 180), "승인 또는 축소 범위를 10~180자로 기록하세요."
            assert reuse_status in {"guided", "approved", "scoped"}, "코드 재사용 판정을 guided, approved, scoped 가운데 하나로 기록하세요."
            assert is_finished_text(reuse_note, 10, 180), "공통 코드 유지 또는 승인 재사용 범위를 10~180자로 기록하세요."
            assert is_finished_text(project_question, 15, 70), "질문을 15~70자의 한 줄로 작성하세요."
            assert project_question.rstrip().endswith(("?", "？")), "프로젝트 질문은 물음표로 끝내세요."
            assert is_finished_text(intended_audience, 5, 80), "예상 독자를 5~80자로 작성하세요."
            assert is_finished_text(project_source, 10, 180), "자료 출처를 10~180자로 작성하세요."
            assert is_finished_text(usage_rights, 10, 180), "자료 이용 근거를 10~180자로 작성하세요."
            assert is_finished_text(reference_date, 4, 80), "자료의 수집·제작 날짜 또는 기간을 기록하세요."
            assert is_finished_text(privacy_check, 10, 180), "개인정보 제외 또는 동의 확인 방법을 기록하세요."
            assert is_finished_text(observation_unit, 8, 120), "입력 한 건의 관찰 단위를 기록하세요."
            assert is_finished_text(value_unit, 1, 60), "화면 값의 단위를 기록하세요."
            assert is_finished_text(scope_decision, 10, 180), "이번 주에 제외한 기능을 구체적으로 작성하세요."
            assert is_finished_text(processing_rule, 12, 180), "입력 처리 규칙을 작성하세요."
            assert is_finished_text(visual_rule, 12, 180), "값과 시각 요소의 연결 규칙을 작성하세요."
            assert is_finished_text(observation_evidence, 1, 50), "화면에서 가리킬 관찰 근거를 1~50자로 작성하세요."
            assert is_finished_text(main_observation, 20, 70), "관찰을 20~70자의 한 줄로 작성하세요."
            assert observation_evidence in main_observation, "관찰 문장에 화면에서 가리킬 관찰 근거를 그대로 포함하세요."
            assert is_finished_text(limitation_statement, 20, 70), "한계를 20~70자의 한 줄로 작성하세요."
            assert any(token in limitation_statement for token in ("없", "못", "한계", "제한", "단정", "아니")), "한계 문장에는 현재 단정할 수 없는 내용을 분명히 쓰세요."
            assert is_finished_text(next_step_1, 12, 120), "첫 번째 다음 행동을 12~120자로 작성하세요."
            assert is_finished_text(next_step_2, 12, 120), "두 번째 다음 행동을 12~120자로 작성하세요."
            assert next_step_1 != next_step_2, "서로 다른 두 수정 행동을 작성하세요."
            action_tokens = ("추가", "수정", "교체", "조정", "확인", "검사", "줄", "늘", "배치", "표시", "기록", "분리", "비교")
            assert any(token in next_step_1 for token in action_tokens), "첫 번째 다음 행동에는 구체적인 수정 동사를 쓰세요."
            assert any(token in next_step_2 for token in action_tokens), "두 번째 다음 행동에는 구체적인 수정 동사를 쓰세요."

            if project_track == "data":
                pd.testing.assert_frame_equal(raw_data, raw_snapshot)
            elif project_track == "text":
                assert raw_text == raw_snapshot, "텍스트 원본이 변경되었습니다."
            elif project_track == "sound":
                assert np.array_equal(raw_signal, raw_snapshot), "소리 원본이 변경되었습니다."
            else:
                pd.testing.assert_frame_equal(raw_image_params, raw_snapshot)
            if input_mode == "provided":
                assert source_digest_before == EXPECTED_PROVIDED_DIGESTS[project_track], "제공 입력의 내용이 달라졌습니다."
            else:
                assert source_path.name == expected_own_source_filename, "제출 원본 파일명이 STEP 1의 표준 파일명과 다릅니다."
                assert source_path.read_bytes() == source_bytes_before, "외부 입력 파일이 실행 중 변경되었습니다."

            visual_element_count = len(mapping_visual_values)
            assert visual_element_count == len(mapping_source_values), "처리 결과와 화면 요소 수가 다릅니다."
            assert np.allclose(mapping_visual_values, mapping_source_values), "화면에 매핑된 값이 처리 결과와 일치하지 않습니다."

            def assert_adapter_pair(source_values, visual_values, label, *, required, textual=False):
                if required:
                    assert source_values is not None and visual_values is not None, f"{label} 증거 쌍이 없습니다."
                assert (source_values is None) == (visual_values is None), f"{label} 증거는 처리 쪽과 화면 쪽을 함께 남기세요."
                if source_values is None:
                    return
                if textual:
                    assert [str(value) for value in visual_values] == [str(value) for value in source_values], f"{label}이 처리 결과와 일치하지 않습니다."
                    return
                source_array = np.asarray(source_values, dtype=float)
                visual_array = np.asarray(visual_values, dtype=float)
                assert source_array.shape == visual_array.shape, f"{label} 증거의 모양이 다릅니다."
                assert np.allclose(visual_array, source_array), f"{label}이 처리 결과와 일치하지 않습니다."

            assert_adapter_pair(
                mapping_source_labels,
                mapping_visual_labels,
                "막대 레이블",
                required=project_track in {"data", "text"},
                textual=True,
            )
            assert_adapter_pair(
                mapping_source_positions,
                mapping_visual_positions,
                "화면 위치",
                required=project_track in {"sound", "image"},
            )
            assert_adapter_pair(
                mapping_source_colors,
                mapping_visual_colors,
                "도형의 색",
                required=project_track == "image",
            )

            assert output_path.is_file() and output_path.stat().st_size > 20_000, "미리보기 파일을 찾을 수 없거나 비어 있습니다."
            if output_format == "png":
                checked_preview_bytes = output_path.read_bytes()
            else:
                checked_html = output_path.read_text(encoding="utf-8")
                assert checked_html.lower().startswith("<!doctype html>"), "HTML 결과에 문서 선언이 없습니다."
                assert "max-width:100%;height:auto" in checked_html, "HTML 이미지에 반응형 크기 규칙이 없습니다."
                assert "<figcaption>" in checked_html and html_observation in checked_html, "HTML 결과에 관찰 설명이 없습니다."
                assert f'alt="{html_alt}"' in checked_html, "HTML 이미지 대체 설명이 결과와 일치하지 않습니다."
                encoded_match = re.search(r"data:image/png;base64,([A-Za-z0-9+/=]+)", checked_html)
                assert encoded_match, "HTML 결과에 미리보기 이미지가 포함되지 않았습니다."
                checked_preview_bytes = base64.b64decode(encoded_match.group(1), validate=True)
            with Image.open(io.BytesIO(checked_preview_bytes)) as saved_image:
                assert saved_image.format == "PNG", "결과 안의 미리보기는 PNG여야 합니다."
                assert saved_image.size == (1600, 1000), "결과 크기는 1600 × 1000이어야 합니다."

            print("AUTOMATIC EVIDENCE READY · TEACHER CHECK REQUIRED")
            assert teacher_gate == "confirmed", "교수의 최종 확인 뒤 teacher_gate를 confirmed로 바꾸세요."
            assert is_finished_text(teacher_feedback, 8, 180), "교수 확인에서 받은 피드백을 8~180자로 기록하세요."

            _run_order.append(7)
            print("=" * 52)
            print("WEEK 14 PROJECT PROTOTYPE COMPLETE")
            print(f"TRACK · {project_track} / INPUT · {input_mode}")
            print(f"REUSE · {reuse_status}")
            print(f"OUTPUT · {output_filename}")
            print("교수 확인 · 질문-입력 / 권한 / 관찰-한계 / 다음 행동 / 가독성")
            print("=" * 52)
            """
        ),
        markdown_cell(
            """
            ## 제출 파일

            1. `week14_학번_이름_prototype.ipynb`
            2. `week14_학번_이름_preview.png` 또는 `week14_학번_이름_preview.html`
            3. `input_mode = "own"`이면 실행에 사용한 원본 파일

            `own`이면 노트북이 실제로 읽은 표준 이름의 원본 파일을 이름을 바꾸지 않고 함께 제출합니다. 결과 파일과 STEP 1·5를 한 화면에 준비해 교수에게 30–45초 증거 확인을 받고, `teacher_gate`를 변경한 뒤 새 런타임에서 모두 실행해 PASS를 받은 다음 제출합니다.
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
    make_project_path_preview(args.asset_dir / "week-14-four-path-preview.png")
    write_notebook(args.asset_dir / "week-14-project-prototype-mission.ipynb")
    print("Generated Week 14 scope, prototype, four-path, and notebook assets.")


if __name__ == "__main__":
    main()
