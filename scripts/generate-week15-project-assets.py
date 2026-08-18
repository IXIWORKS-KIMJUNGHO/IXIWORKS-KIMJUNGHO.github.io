#!/usr/bin/env python3
"""Generate deterministic Week 15 revision visuals and the student notebook."""

from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from textwrap import dedent

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager, ft2font
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
RUNTIME_REQUIREMENTS_PATH = ROOT / "requirements-week15-assets.txt"

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

FONT_PATH = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
FONT_BOLD_PATH = (
    Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans-Bold.ttf"
)
FONT = font_manager.FontProperties(fname=FONT_PATH)
FONT_BOLD = font_manager.FontProperties(fname=FONT_BOLD_PATH)

# Korean subset derived from NotoSansCJKkr-VF.ttf at notofonts/noto-cjk
# commit f8d157532fbfaeda587e826d4cd5b21a49186f7c under the SIL OFL 1.1.
NOTEBOOK_FONT_PATH = ROOT / "assets" / "fonts" / "week15-korean-visual.ttf"
NOTEBOOK_FONT_SHA256 = (
    "87fd90eac183d32c2ce542cce8d4b72facc315a5adb05669e7074f89b370c900"
)
NOTEBOOK_FONT_GZIP_PATH = ROOT / "assets" / "fonts" / "week15-korean-visual.ttf.gz"
NOTEBOOK_FONT_GZIP_SHA256 = (
    "2e287ff9f26edec4fd7e1cfc03a35933f79abea80cb7bd5a1ba16152f0a02e04"
)
NOTEBOOK_FONT_LICENSE_PATH = ROOT / "assets" / "fonts" / "OFL-NotoSansCJK.txt"
NOTEBOOK_FONT_LICENSE_SHA256 = (
    "6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2"
)


def validate_notebook_font_asset() -> bytes:
    """Validate the embedded OFL Korean font and its full Hangul coverage."""

    required_files = (
        (NOTEBOOK_FONT_PATH, NOTEBOOK_FONT_SHA256, "font"),
        (NOTEBOOK_FONT_GZIP_PATH, NOTEBOOK_FONT_GZIP_SHA256, "compressed font"),
        (NOTEBOOK_FONT_LICENSE_PATH, NOTEBOOK_FONT_LICENSE_SHA256, "font license"),
    )
    for file_path, expected_digest, label in required_files:
        if not file_path.is_file():
            raise RuntimeError(f"Week 15 notebook {label} is missing: {file_path}")
        actual_digest = hashlib.sha256(file_path.read_bytes()).hexdigest()
        if actual_digest != expected_digest:
            raise RuntimeError(
                f"Week 15 notebook {label} checksum mismatch: {actual_digest}"
            )

    font = font_manager.get_font(NOTEBOOK_FONT_PATH)
    missing_hangul = [
        chr(codepoint)
        for codepoint in range(0xAC00, 0xD7A4)
        if not font.get_char_index(codepoint)
    ]
    if missing_hangul:
        raise RuntimeError(
            f"Week 15 notebook font is missing {len(missing_hangul)} Hangul glyphs."
        )
    if gzip.decompress(NOTEBOOK_FONT_GZIP_PATH.read_bytes()) != NOTEBOOK_FONT_PATH.read_bytes():
        raise RuntimeError("Week 15 compressed notebook font does not match its TTF.")
    return NOTEBOOK_FONT_GZIP_PATH.read_bytes()


def pinned_runtime_versions() -> dict[str, str]:
    """Read image-rendering pins from one requirements file."""

    pins: dict[str, str] = {}
    for raw_line in RUNTIME_REQUIREMENTS_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line.startswith("# runtime:"):
            line = line.removeprefix("# runtime:").strip()
        elif not line or line.startswith("#"):
            continue
        package_name, separator, package_version = line.partition("==")
        if not separator or not package_name or not package_version:
            raise ValueError(f"Week 15 runtime requirement must be pinned: {line}")
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
        raise SystemExit("Week 15 runtime mismatch: " + "; ".join(mismatches))
    return installed_versions


def apply_style() -> None:
    """Apply a stable editorial style using Matplotlib's bundled fonts."""

    plt.rcParams.update(
        {
            "font.family": FONT.get_name(),
            "font.size": 12,
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
    """Save one PNG without timestamps or environment-specific metadata."""

    path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(
        path,
        dpi=dpi,
        facecolor=PAPER,
        metadata={"Software": "Contents Programming Week 15"},
    )
    plt.close(figure)


def draw_card(
    axis: plt.Axes,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    label: str,
    title: str,
    lines: list[str],
    accent: str,
    facecolor: str,
) -> None:
    axis.add_patch(
        FancyBboxPatch(
            (x, y),
            width,
            height,
            boxstyle="round,pad=0.012,rounding_size=0.016",
            linewidth=1.5,
            edgecolor=accent,
            facecolor=facecolor,
            transform=axis.transAxes,
        )
    )
    axis.text(
        x + 0.022,
        y + height - 0.052,
        label,
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=9.5,
        color=accent,
        va="top",
    )
    axis.text(
        x + 0.022,
        y + height - 0.105,
        title,
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=15,
        color=INK,
        va="top",
    )
    for index, line in enumerate(lines):
        axis.text(
            x + 0.022,
            y + height - 0.17 - index * 0.043,
            line,
            transform=axis.transAxes,
            fontproperties=FONT,
            fontsize=10.5,
            color=MUTED,
            va="top",
        )


def generate_progress_ladder(path: Path) -> None:
    figure, axis = plt.subplots(figsize=(14.4, 9), dpi=100)
    axis.set_axis_off()
    figure.subplots_adjust(left=0.055, right=0.945, top=0.91, bottom=0.08)

    axis.text(
        0.0,
        1.03,
        "FROM WORKING PATH TO PRESENTABLE PROJECT",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=28,
        color=INK,
        va="top",
    )
    axis.text(
        0.0,
        0.955,
        "Progress means stronger evidence, not a larger pile of features.",
        transform=axis.transAxes,
        fontproperties=FONT,
        fontsize=13,
        color=MUTED,
        va="top",
    )

    cards = [
        (
            0.0,
            "30%",
            "CORE PATH WORKS",
            ["one approved input", "one processing rule", "one openable output"],
            CORAL,
            PALE_CORAL,
        ),
        (
            0.345,
            "70%",
            "PROJECT CAN BE REVIEWED",
            ["full input is stable", "two revisions are evidenced", "source and limits are visible"],
            TEAL,
            PALE_TEAL,
        ),
        (
            0.69,
            "100%",
            "FINAL PRESENTATION READY",
            ["final copy is preserved", "presentation route is rehearsed", "submission package is complete"],
            BLUE,
            PALE_BLUE,
        ),
    ]
    for x, label, title, lines, accent, facecolor in cards:
        draw_card(
            axis,
            x,
            0.49,
            0.285,
            0.31,
            label=label,
            title=title,
            lines=lines,
            accent=accent,
            facecolor=facecolor,
        )
    for start, end in [(0.285, 0.345), (0.63, 0.69)]:
        axis.add_patch(
            FancyArrowPatch(
                (start + 0.005, 0.645),
                (end - 0.005, 0.645),
                arrowstyle="-|>",
                mutation_scale=18,
                linewidth=1.8,
                color=INK,
                transform=axis.transAxes,
            )
        )

    criteria = [
        ("ACCURATE", "values and mapping agree"),
        ("READABLE", "title, unit, contrast, order"),
        ("REPRODUCIBLE", "run all and reopen"),
        ("RESPONSIBLE", "source, rights, privacy, limits"),
        ("PRESENTABLE", "one-minute explanation route"),
    ]
    axis.text(
        0.0,
        0.395,
        "THE FIVE WEEK 15 REVIEW LENSES",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=12,
        color=INK,
    )
    for index, (label, body) in enumerate(criteria):
        x = index * 0.196
        axis.add_patch(
            Rectangle(
                (x, 0.095),
                0.18,
                0.22,
                linewidth=1,
                edgecolor=LINE,
                facecolor=PANEL,
                transform=axis.transAxes,
            )
        )
        axis.text(
            x + 0.014,
            0.275,
            f"0{index + 1}",
            transform=axis.transAxes,
            fontproperties=FONT_BOLD,
            fontsize=10,
            color=TEAL,
            va="top",
        )
        axis.text(
            x + 0.014,
            0.225,
            label,
            transform=axis.transAxes,
            fontproperties=FONT_BOLD,
            fontsize=11.5,
            color=INK,
            va="top",
        )
        axis.text(
            x + 0.014,
            0.165,
            body,
            transform=axis.transAxes,
            fontproperties=FONT,
            fontsize=9.5,
            color=MUTED,
            va="top",
            wrap=True,
        )

    save_figure(figure, path)


def style_small_axis(axis: plt.Axes, title: str) -> None:
    axis.set_title(title, loc="left", fontproperties=FONT_BOLD, fontsize=10.5, pad=8)
    axis.spines[["top", "right"]].set_visible(False)
    axis.grid(axis="x", color=LINE, alpha=0.45, linewidth=0.7)
    axis.set_axisbelow(True)


def generate_before_after(path: Path) -> None:
    figure = plt.figure(figsize=(16, 10), dpi=100)
    grid = figure.add_gridspec(
        3,
        4,
        height_ratios=[0.24, 1, 1],
        hspace=0.52,
        wspace=0.48,
        left=0.07,
        right=0.95,
        top=0.93,
        bottom=0.08,
    )
    title_axis = figure.add_subplot(grid[0, :])
    title_axis.set_axis_off()
    title_axis.text(
        0,
        0.92,
        "REVISION CHANGES WHAT A READER CAN VERIFY",
        fontproperties=FONT_BOLD,
        fontsize=26,
        color=INK,
        va="top",
    )
    title_axis.text(
        0,
        0.35,
        "Four project paths, each with one concrete before-and-after decision.",
        fontproperties=FONT,
        fontsize=13,
        color=MUTED,
        va="top",
    )

    categories = ["Archive", "Studio", "Screening"]
    values = [84, 63, 49]
    before_data = figure.add_subplot(grid[1, 0])
    before_data.barh(categories, values, color="#b8b9b2")
    before_data.set_yticklabels([])
    before_data.set_xticklabels([])
    style_small_axis(before_data, "DATA · BEFORE")
    after_data = figure.add_subplot(grid[1, 1])
    bars = after_data.barh(categories[::-1], values[::-1], color=[TEAL, GOLD, CORAL][::-1])
    after_data.bar_label(bars, labels=[str(value) for value in values[::-1]], padding=4)
    after_data.set_xlabel("Total visits")
    style_small_axis(after_data, "DATA · AFTER")

    words = ["record", "place", "sound", "memory"]
    counts = [8, 6, 4, 3]
    before_text = figure.add_subplot(grid[1, 2])
    before_text.bar(words, counts, color="#b8b9b2")
    before_text.tick_params(axis="x", labelrotation=55)
    before_text.set_yticklabels([])
    style_small_axis(before_text, "TEXT · BEFORE")
    after_text = figure.add_subplot(grid[1, 3])
    after_text.barh(words[::-1], counts[::-1], color=BLUE)
    after_text.set_xlabel("Token count")
    style_small_axis(after_text, "TEXT · AFTER")

    time_values = np.linspace(0, 4, 180)
    energy = 0.13 + 0.08 * np.sin(time_values * 2.5) + 0.025 * np.sin(time_values * 8)
    before_sound = figure.add_subplot(grid[2, 0])
    before_sound.plot(time_values, energy, color="#b8b9b2", linewidth=2)
    before_sound.set_xticklabels([])
    before_sound.set_yticklabels([])
    style_small_axis(before_sound, "SOUND · BEFORE")
    after_sound = figure.add_subplot(grid[2, 1])
    after_sound.plot(time_values, energy, color=TEAL, linewidth=2.4)
    peak_index = int(np.argmax(energy))
    after_sound.scatter([time_values[peak_index]], [energy[peak_index]], color=CORAL, zorder=3)
    after_sound.annotate(
        f"peak {time_values[peak_index]:.2f}s",
        (time_values[peak_index], energy[peak_index]),
        xytext=(-48, -34),
        textcoords="offset points",
        fontsize=8.5,
        arrowprops={"arrowstyle": "->", "color": CORAL},
    )
    after_sound.set_xlabel("Time (seconds)")
    after_sound.set_ylabel("Relative RMS")
    style_small_axis(after_sound, "SOUND · AFTER")

    positions = np.array([[0.03, 0.1], [0.24, 0.72], [0.57, 0.46], [0.84, 0.76], [0.97, 0.2]])
    sizes = np.array([1700, 900, 1350, 650, 1500])
    before_image = figure.add_subplot(grid[2, 2])
    before_image.scatter(positions[:, 0], positions[:, 1], s=sizes, c="#d6d5cb", edgecolors="#c8c8c0")
    before_image.set_xlim(0, 1)
    before_image.set_ylim(0, 1)
    before_image.set_xticks([])
    before_image.set_yticks([])
    style_small_axis(before_image, "RULE IMAGE · BEFORE")
    after_image = figure.add_subplot(grid[2, 3])
    safe_positions = np.clip(positions, 0.14, 0.86)
    after_image.scatter(
        safe_positions[:, 0],
        safe_positions[:, 1],
        s=sizes * 0.68,
        c=[TEAL, BLUE, CORAL, GOLD, TEAL],
        edgecolors=INK,
        linewidths=0.8,
    )
    after_image.set_xlim(0, 1)
    after_image.set_ylim(0, 1)
    after_image.set_xlabel("x position")
    after_image.set_ylabel("y position")
    style_small_axis(after_image, "RULE IMAGE · AFTER")

    figure.text(
        0.07,
        0.025,
        "Revision evidence: labels · units · order · annotations · contrast · safe margins",
        fontproperties=FONT_BOLD,
        fontsize=11.5,
        color=CORAL,
    )
    save_figure(figure, path)


def generate_submission_package(path: Path) -> None:
    figure, axis = plt.subplots(figsize=(14.4, 9), dpi=100)
    axis.set_axis_off()
    figure.subplots_adjust(left=0.055, right=0.945, top=0.91, bottom=0.08)
    axis.text(
        0,
        1.03,
        "ONE PROJECT, FOUR FILE ROLES, ONE REVIEW GATE",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=27,
        color=INK,
        va="top",
    )
    axis.text(
        0,
        0.955,
        "A submission package lets another person rerun, inspect, and explain the project.",
        transform=axis.transAxes,
        fontproperties=FONT,
        fontsize=13,
        color=MUTED,
        va="top",
    )

    files = [
        ("IPYNB", "PROJECT NOTEBOOK", ["ordered cells", "saved outputs", "final PASS"], BLUE, PALE_BLUE),
        ("SOURCE", "APPROVED INPUT", ["only when needed", "matching filename", "rights recorded"], GOLD, PALE_GOLD),
        ("PNG / HTML", "REFINED OUTPUT", ["opens alone", "title and unit", "source and limit"], TEAL, PALE_TEAL),
        ("HTML", "REVISION LOG", ["before and after", "two decisions", "teacher feedback"], CORAL, PALE_CORAL),
    ]
    for index, (label, title, lines, accent, facecolor) in enumerate(files):
        draw_card(
            axis,
            index * 0.245,
            0.54,
            0.225,
            0.28,
            label=label,
            title=title,
            lines=lines,
            accent=accent,
            facecolor=facecolor,
        )

    gate_x = 0.29
    gate_y = 0.14
    gate_width = 0.42
    gate_height = 0.23
    axis.add_patch(
        FancyBboxPatch(
            (gate_x, gate_y),
            gate_width,
            gate_height,
            boxstyle="round,pad=0.018,rounding_size=0.018",
            linewidth=2,
            edgecolor=TEAL,
            facecolor=PANEL,
            transform=axis.transAxes,
        )
    )
    axis.text(
        0.5,
        0.315,
        "FINAL EVIDENCE GATE",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=16,
        color=INK,
        ha="center",
    )
    axis.text(
        0.5,
        0.255,
        "run all · reopen · compare · cite · explain",
        transform=axis.transAxes,
        fontproperties=FONT,
        fontsize=12,
        color=MUTED,
        ha="center",
    )
    axis.text(
        0.5,
        0.19,
        "PASS + teacher confirmation = submit and leave",
        transform=axis.transAxes,
        fontproperties=FONT_BOLD,
        fontsize=11,
        color=TEAL,
        ha="center",
    )
    for x in [0.115, 0.36, 0.605, 0.85]:
        axis.add_patch(
            FancyArrowPatch(
                (x, 0.53),
                (0.5, 0.385),
                arrowstyle="-|>",
                mutation_scale=14,
                linewidth=1.2,
                color=LINE,
                transform=axis.transAxes,
            )
        )
    save_figure(figure, path)


def notebook_cell(cell_type: str, source: str) -> dict[str, object]:
    cell: dict[str, object] = {
        "cell_type": cell_type,
        "metadata": {},
        "source": dedent(source).strip("\n").splitlines(keepends=True),
    }
    if cell_type == "code":
        cell.update({"execution_count": None, "outputs": []})
    return cell


def build_notebook() -> dict[str, object]:
    """Build the student-facing Week 15 refinement mission notebook."""

    compressed_notebook_font = validate_notebook_font_asset()
    embedded_font_payload = base64.b64encode(compressed_notebook_font).decode(
        "ascii"
    )

    cells = [
        notebook_cell(
            "markdown",
            """
            # 15주차 70% 프로젝트 프로토타입 미션

            14주차의 작동 경로를 보존한 뒤 서로 다른 두 수정 행동을 적용하고, 수정 전후 결과와 재실행 가능한 증거를 남깁니다. 기본 `provided` 경로는 외부 파일 없이 실행됩니다. 자신의 프로젝트를 이어갈 때에는 교수에게 승인받은 입력과 코드만 `APPROVED PROJECT CODE ZONE`에 연결합니다.

            필수 제출 파일은 실행 결과가 남은 노트북, 개선 결과 PNG, 수정 기록 HTML입니다. 자신의 입력 파일이 필요하면 같은 이름으로 함께 제출합니다.
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 0 · 실행 환경과 공통 도구
            from pathlib import Path
            from hashlib import sha256
            from html import escape
            import base64
            import gzip
            import re
            import shutil

            import matplotlib.pyplot as plt
            from matplotlib import font_manager
            from PIL import Image

            EMBEDDED_KOREAN_FONT_GZIP_BASE64 = "__WEEK15_FONT_GZIP_BASE64__"
            EMBEDDED_KOREAN_FONT_SHA256 = "87fd90eac183d32c2ce542cce8d4b72facc315a5adb05669e7074f89b370c900"
            korean_font_path = Path("week15-korean-visual.ttf")
            korean_font_bytes = gzip.decompress(
                base64.b64decode(EMBEDDED_KOREAN_FONT_GZIP_BASE64)
            )
            assert sha256(korean_font_bytes).hexdigest() == EMBEDDED_KOREAN_FONT_SHA256
            if (
                not korean_font_path.is_file()
                or sha256(korean_font_path.read_bytes()).hexdigest()
                != EMBEDDED_KOREAN_FONT_SHA256
            ):
                korean_font_path.write_bytes(korean_font_bytes)
            font_manager.fontManager.addfont(korean_font_path)
            korean_font_name = font_manager.FontProperties(
                fname=korean_font_path
            ).get_name()
            plt.rcParams["font.family"] = korean_font_name
            plt.rcParams["axes.unicode_minus"] = False

            def require_korean_glyphs(*values):
                font = font_manager.get_font(korean_font_path)
                required_characters = {
                    character
                    for value in values
                    for character in str(value)
                    if not character.isspace()
                }
                missing_characters = sorted(
                    character
                    for character in required_characters
                    if not font.get_char_index(ord(character))
                )
                assert not missing_characters, (
                    "고정 한글 글꼴에 없는 문자가 있습니다: "
                    + "".join(missing_characters)
                )

            _week15_step0_runs = globals().get("_week15_step0_runs", 0) + 1
            _run_order = [0]

            def safe_fragment(value):
                cleaned = re.sub(r"[^0-9A-Za-z가-힣_-]+", "_", str(value).strip())
                return cleaned.strip("_")

            def sha256_file(path):
                return sha256(Path(path).read_bytes()).hexdigest()

            def ensure_written(value, label, minimum=8):
                text = str(value).strip()
                assert text and "EDIT:" not in text, f"{label}을 자신의 문장으로 작성하세요."
                assert len(text) >= minimum, f"{label}을 더 구체적으로 작성하세요."
                return text

            print("STEP 0 READY")
            """.replace(
                "__WEEK15_FONT_GZIP_BASE64__", embedded_font_payload
            ),
        ),
        notebook_cell(
            "code",
            """
            # STEP 1 · EDIT: 제출 정보, 프로젝트 계약, 자료 책임
            student_id = "학번"
            student_name = "이름"
            project_track = "data"  # data / text / sound / image
            project_mode = "provided"  # provided / own
            own_source_filename = ""  # own일 때 승인된 실제 입력 파일명
            own_probe_filename = ""  # own일 때 같은 형식의 검사용 입력 파일명
            baseline_mode = "provided"  # provided / upload
            baseline_source_filename = ""  # upload일 때 14주차 PNG 또는 HTML

            approval_status = "EDIT: provided 또는 approved"
            project_question = "EDIT: 결과가 답할 수 있는 질문 한 문장"
            intended_audience = "EDIT: 이 결과를 읽을 구체적인 대상"
            source_title = "EDIT: 입력 자료의 제목과 제공자"
            usage_rights = "EDIT: 수업 제출에 사용할 수 있는 근거"
            reference_date = "EDIT: 자료의 기준일 또는 제작일"
            privacy_check = "EDIT: 개인정보 포함 여부와 제외 기준"

            assert project_track in {"data", "text", "sound", "image"}
            assert project_mode in {"provided", "own"}
            assert baseline_mode in {"provided", "upload"}
            assert approval_status in {"provided", "approved"}, "approval_status는 provided 또는 approved여야 합니다."
            expected_approval = "provided" if project_mode == "provided" else "approved"
            assert approval_status == expected_approval, "provided 경로는 provided, own 경로는 approved 판정이 필요합니다."
            _run_order.append(1)
            print("STEP 1 RECORDED")
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 2 · 14주차 기준점과 15주차 파일명 준비
            safe_student_id = safe_fragment(student_id)
            safe_student_name = safe_fragment(student_name)
            assert safe_student_id not in {"", "학번"}, "실제 학번을 입력하세요."
            assert safe_student_name not in {"", "이름"}, "실제 이름을 입력하세요."

            baseline_output_path = Path(
                f"week15_{safe_student_id}_{safe_student_name}_baseline.png"
            )
            refined_output_path = Path(
                f"week15_{safe_student_id}_{safe_student_name}_refined.png"
            )
            revision_log_path = Path(
                f"week15_{safe_student_id}_{safe_student_name}_revision_log.html"
            )

            class TrackedProjectInput:
                def __init__(self, path):
                    self.path = Path(path)
                    self._bytes = self.path.read_bytes()
                    self.digest = sha256(self._bytes).hexdigest()
                    self.read_count = 0

                def read_bytes(self):
                    self.read_count += 1
                    return self._bytes

                def read_text(self, encoding="utf-8"):
                    return self.read_bytes().decode(encoding)

            own_source_path = None
            own_source_digest = None
            project_input = None
            own_probe_path = None
            own_probe_digest = None
            own_probe_input = None
            if project_mode == "own":
                own_source_path = Path(own_source_filename)
                own_probe_path = Path(own_probe_filename)
                assert own_source_path.is_file(), "own 경로의 승인된 실제 입력 파일을 찾을 수 없습니다."
                assert own_probe_path.is_file(), "own 경로의 같은 형식 검사용 입력 파일을 찾을 수 없습니다."
                project_input = TrackedProjectInput(own_source_path)
                own_probe_input = TrackedProjectInput(own_probe_path)
                own_source_digest = project_input.digest
                own_probe_digest = own_probe_input.digest
                assert own_source_digest != own_probe_digest, "own 원본과 검사용 입력은 실제 내용이 달라야 합니다."

            if baseline_mode == "upload":
                baseline_source_path = Path(baseline_source_filename)
                assert baseline_source_path.is_file(), "14주차 기준점 파일을 찾을 수 없습니다."
                baseline_suffix = baseline_source_path.suffix.lower()
                assert baseline_suffix in {".png", ".html"}, "기준점은 14주차 PNG 또는 HTML이어야 합니다."
                if baseline_suffix == ".png":
                    shutil.copyfile(baseline_source_path, baseline_output_path)
                else:
                    baseline_html = baseline_source_path.read_text(encoding="utf-8")
                    encoded_match = re.search(
                        r"data:image/png;base64,([A-Za-z0-9+/=]+)", baseline_html
                    )
                    assert encoded_match, "14주차 HTML에서 포함된 PNG 기준점을 찾을 수 없습니다."
                    baseline_png_bytes = base64.b64decode(
                        encoded_match.group(1), validate=True
                    )
                    assert baseline_png_bytes.startswith(b"\\x89PNG\\r\\n\\x1a\\n"), "HTML 기준점의 포함 이미지는 PNG여야 합니다."
                    baseline_output_path.write_bytes(baseline_png_bytes)

            _run_order.append(2)
            print("STEP 2 PATHS READY")
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 3 · EDIT: 두 수정 행동과 승인된 프로젝트 코드
            revision_focus_1 = "accuracy"
            revision_focus_2 = "readability"
            revision_operation_1 = "show_count_check"
            revision_operation_2 = "clarify_title_unit"
            revision_action_1 = "EDIT: 정확성: show_count_check로 값과 화면의 일치를 표시한다"
            revision_action_2 = "EDIT: 가독성: clarify_title_unit로 제목과 단위를 명확하게 한다"

            REVISION_LENS_LABELS = {
                "accuracy": "정확성",
                "readability": "가독성",
                "reproducibility": "재현성",
                "responsibility": "책임성",
                "presentation": "발표 가능성",
            }
            REVISION_OPERATIONS = {
                "accuracy": "show_count_check",
                "readability": "clarify_title_unit",
                "reproducibility": "stamp_run_id",
                "responsibility": "show_source_context",
                "presentation": "strengthen_contrast",
            }
            selected_revision_focuses = [revision_focus_1, revision_focus_2]
            selected_revision_operations = [
                revision_operation_1,
                revision_operation_2,
            ]
            assert all(
                focus in REVISION_LENS_LABELS for focus in selected_revision_focuses
            ), "수정 초점은 다섯 검토 렌즈 가운데 선택하세요."
            assert len(set(selected_revision_focuses)) == 2, "서로 다른 두 수정 초점을 선택하세요."
            assert all(
                REVISION_OPERATIONS[focus] == operation
                for focus, operation in zip(
                    selected_revision_focuses,
                    selected_revision_operations,
                )
            ), "수정 초점과 구조화된 수정 동작이 일치해야 합니다."
            ensure_written(revision_action_1, "수정 행동 1")
            ensure_written(revision_action_2, "수정 행동 2")
            expected_prefix_1 = f"{REVISION_LENS_LABELS[revision_focus_1]}:"
            expected_prefix_2 = f"{REVISION_LENS_LABELS[revision_focus_2]}:"
            assert revision_action_1.startswith(expected_prefix_1), f"수정 행동 1은 '{expected_prefix_1}'으로 시작하세요."
            assert revision_action_2.startswith(expected_prefix_2), f"수정 행동 2는 '{expected_prefix_2}'으로 시작하세요."
            revision_action_detail_1 = revision_action_1.split(":", 1)[1].strip()
            revision_action_detail_2 = revision_action_2.split(":", 1)[1].strip()
            assert revision_operation_1 in revision_action_detail_1, "수정 행동 1에 구조화된 수정 동작을 포함하세요."
            assert revision_operation_2 in revision_action_detail_2, "수정 행동 2에 구조화된 수정 동작을 포함하세요."
            revision_action_claim_1 = revision_action_detail_1.replace(
                revision_operation_1, ""
            ).strip()
            revision_action_claim_2 = revision_action_detail_2.replace(
                revision_operation_2, ""
            ).strip()
            ensure_written(revision_action_detail_1, "수정 행동 1의 구체적 내용")
            ensure_written(revision_action_detail_2, "수정 행동 2의 구체적 내용")
            assert revision_action_claim_1 != revision_action_claim_2, "서로 다른 두 수정 행동을 기록하세요."
            revision_evidence_id = sha256(
                f"{revision_action_1}\\n{revision_action_2}".encode("utf-8")
            ).hexdigest()[:12]
            require_korean_glyphs(
                project_question,
                source_title,
                reference_date,
                revision_action_1,
                revision_action_2,
                *REVISION_LENS_LABELS.values(),
            )

            # APPROVED PROJECT CODE ZONE
            # 자신의 프로젝트를 이어갈 때에는 이 함수 안의 제공 예시만 승인된 코드로 교체합니다.
            # own 경로는 project_input.read_bytes() 또는 read_text()로 승인 입력을 읽습니다.
            # 함수는 수정 전 Figure, 수정 후 Figure, 핵심 값 증거를 반환합니다.
            def build_project_outputs(project_input=None):
                baseline_figure, baseline_axis = plt.subplots(figsize=(8, 5), dpi=200)
                refined_figure, refined_axis = plt.subplots(figsize=(8, 5), dpi=200)

                if project_track == "data":
                    labels = ["Archive", "Studio", "Screening"]
                    raw_values = [84, 63, 49]
                    refined_values = list(raw_values)
                    baseline_axis.barh(labels, raw_values, color="#b8b9b2")
                    bars = refined_axis.barh(
                        labels[::-1],
                        refined_values[::-1],
                        color=["#116e68", "#6f4f00", "#a23d34"][::-1],
                    )
                    refined_axis.bar_label(
                        bars,
                        labels=[str(value) for value in refined_values[::-1]],
                        padding=5,
                    )
                    refined_axis.set_xlim(0, 95)
                    refined_axis.set_xlabel("Total visits")
                    unit = "Total visits"
                elif project_track == "text":
                    labels = ["room", "record", "trace", "light"]
                    raw_values = [3, 8, 4, 6]
                    baseline_axis.bar(labels, raw_values, color="#b8b9b2")
                    ranked = sorted(zip(labels, raw_values), key=lambda item: item[1])
                    refined_labels = [label for label, _value in ranked]
                    refined_values = [value for _label, value in ranked]
                    bars = refined_axis.barh(
                        refined_labels, refined_values, color="#365f91"
                    )
                    refined_axis.bar_label(bars, padding=5)
                    refined_axis.set_xlim(0, 9)
                    refined_axis.set_xlabel("Occurrences")
                    unit = "Occurrences"
                elif project_track == "sound":
                    labels = ["0.0", "0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5"]
                    raw_values = [0.08, 0.16, 0.58, 0.22, 0.13, 0.31, 0.72, 0.18]
                    refined_values = list(raw_values)
                    time_values = [index * 0.5 for index in range(len(raw_values))]
                    baseline_axis.plot(time_values, raw_values, color="#b8b9b2")
                    refined_axis.plot(
                        time_values,
                        refined_values,
                        color="#116e68",
                        marker="o",
                        linewidth=2,
                    )
                    peak_index = max(
                        range(len(refined_values)), key=refined_values.__getitem__
                    )
                    refined_axis.annotate(
                        f"peak {time_values[peak_index]:.1f}s",
                        (time_values[peak_index], refined_values[peak_index]),
                        xytext=(-54, 20),
                        textcoords="offset points",
                        arrowprops={"arrowstyle": "->", "color": "#202523"},
                    )
                    refined_axis.set_xlabel("Time (seconds)")
                    refined_axis.set_ylabel("Relative RMS")
                    refined_axis.set_ylim(0, 0.82)
                    unit = "Relative RMS"
                else:
                    labels = ["A", "B", "C", "D", "E"]
                    raw_values = [52, 76, 44, 66, 58]
                    refined_values = list(raw_values)
                    x_values = [0.16, 0.34, 0.52, 0.70, 0.84]
                    y_values = [0.26, 0.68, 0.43, 0.72, 0.31]
                    colors = ["#116e68", "#365f91", "#a23d34", "#6f4f00", "#116e68"]
                    baseline_axis.scatter(
                        x_values, y_values, s=[value * 10 for value in raw_values], c=colors
                    )
                    refined_axis.scatter(
                        x_values,
                        y_values,
                        s=[value * 10 for value in refined_values],
                        c=colors,
                        edgecolors="#202523",
                        linewidths=1.5,
                    )
                    for label, x_value, y_value in zip(labels, x_values, y_values):
                        refined_axis.text(x_value, y_value, label, ha="center", va="center", color="white", fontweight="bold")
                    refined_axis.set_xlim(0, 1)
                    refined_axis.set_ylim(0, 1)
                    refined_axis.set_aspect("equal")
                    refined_axis.set_xlabel("Normalized x position")
                    refined_axis.set_ylabel("Normalized y position")
                    unit = "Shape size"

                baseline_axis.set_title(f"{project_track.upper()} · BASELINE")
                refined_axis.set_title(f"{project_track.upper()} · REFINED")

                evidence = {
                    "track": project_track,
                    "input_count": len(raw_values),
                    "visual_count": len(refined_values),
                    "value_match": sorted(raw_values) == sorted(refined_values),
                    "unit": unit,
                }
                return baseline_figure, refined_figure, evidence

            baseline_figure, refined_figure, core_project_evidence = build_project_outputs(
                project_input
            )
            required_core_fields = {
                "track",
                "input_count",
                "visual_count",
                "value_match",
                "unit",
            }
            assert required_core_fields <= core_project_evidence.keys(), "승인 코드의 핵심 값 증거가 부족합니다."
            assert core_project_evidence["track"] == project_track
            assert core_project_evidence["input_count"] == core_project_evidence["visual_count"]
            assert core_project_evidence["value_match"] is True
            def figure_pixel_digest(figure):
                figure.canvas.draw()
                return sha256(bytes(figure.canvas.buffer_rgba())).hexdigest()

            own_input_response_digests = []
            same_input_render_digests = []
            if project_mode == "own":
                assert project_input.read_count > 0, "own 경로의 승인 코드는 project_input을 실제로 읽어야 합니다."
                (
                    own_repeat_baseline_figure,
                    own_repeat_refined_figure,
                    own_repeat_evidence,
                ) = build_project_outputs(project_input)
                (
                    own_probe_baseline_figure,
                    own_probe_refined_figure,
                    own_probe_evidence,
                ) = build_project_outputs(own_probe_input)
                assert own_probe_input.read_count > 0, "own 경로의 승인 코드는 검사용 입력도 실제로 읽어야 합니다."
                assert required_core_fields <= own_repeat_evidence.keys()
                assert required_core_fields <= own_probe_evidence.keys()
                same_input_render_digests = [
                    figure_pixel_digest(refined_figure),
                    figure_pixel_digest(own_repeat_refined_figure),
                ]
                own_input_response_digests = [
                    *same_input_render_digests,
                    figure_pixel_digest(own_probe_refined_figure),
                ]
                plt.close(own_repeat_baseline_figure)
                plt.close(own_repeat_refined_figure)
                plt.close(own_probe_baseline_figure)
                plt.close(own_probe_refined_figure)
                assert same_input_render_digests[0] == same_input_render_digests[1], "동일 own 입력은 같은 결과를 만들어야 합니다."
                assert own_input_response_digests[0] != own_input_response_digests[2], "own 입력 내용을 바꾸면 수정 결과도 달라져야 합니다."

            def apply_revision_contract(figure, core_evidence):
                axis = figure.axes[0]
                actions = [revision_action_1, revision_action_2]
                rendered_markers = []
                render_proofs = {}
                figure.tight_layout(rect=(0, 0.13, 1, 0.97))
                figure.canvas.draw()
                render_digests = [
                    sha256(bytes(figure.canvas.buffer_rgba())).hexdigest()
                ]
                input_binding_id = (
                    own_source_digest[:12]
                    if own_source_digest
                    else sha256(f"provided:{project_track}".encode("utf-8")).hexdigest()[:12]
                )

                for index, (focus, operation, action) in enumerate(
                    zip(
                        selected_revision_focuses,
                        selected_revision_operations,
                        actions,
                    )
                ):
                    action_detail = action.split(":", 1)[1].strip()
                    marker = f"{REVISION_LENS_LABELS[focus]} · {action_detail}"
                    marker_artist = figure.text(
                        0.01,
                        0.09 - index * 0.027,
                        marker,
                        fontsize=6.5,
                        color="#202523",
                    )
                    rendered_markers.append(marker)
                    proof = marker_artist in figure.texts and marker_artist.get_text() == marker

                    if operation == "show_count_check":
                        axis.grid(axis="x", color="#c7c8be", linewidth=0.6, alpha=0.6)
                        check_text = f"COUNT CHECK {core_evidence['input_count']} = {core_evidence['visual_count']}"
                        check_artist = axis.text(
                            0.99,
                            0.02,
                            check_text,
                            transform=axis.transAxes,
                            ha="right",
                            va="bottom",
                            fontsize=7,
                        )
                        proof = proof and check_artist.get_text() == check_text
                    elif operation == "clarify_title_unit":
                        axis.set_title(project_question)
                        proof = proof and axis.get_title() == project_question and bool(core_evidence["unit"])
                    elif operation == "stamp_run_id":
                        reproducibility_artist = figure.text(
                            0.99,
                            0.012,
                            f"RUN {revision_evidence_id} · INPUT {input_binding_id}",
                            ha="right",
                            fontsize=6.5,
                        )
                        proof = proof and revision_evidence_id in reproducibility_artist.get_text()
                    elif operation == "show_source_context":
                        responsibility_artist = figure.text(
                            0.01,
                            0.012,
                            f"SOURCE {source_title} · {reference_date}",
                            fontsize=6.5,
                        )
                        proof = proof and source_title in responsibility_artist.get_text()
                    elif operation == "strengthen_contrast":
                        figure.set_facecolor("#f3efe5")
                        axis.set_facecolor("#fffdf8")
                        axis.spines[["top", "right"]].set_visible(False)
                        axis.tick_params(colors="#202523")
                        proof = proof and not axis.spines["top"].get_visible() and not axis.spines["right"].get_visible()

                    render_proofs[operation] = bool(proof)
                    figure.canvas.draw()
                    render_digests.append(
                        sha256(bytes(figure.canvas.buffer_rgba())).hexdigest()
                    )

                binding_artist = figure.text(
                    0.5,
                    0.012,
                    f"INPUT BINDING {input_binding_id}",
                    ha="center",
                    fontsize=6.5,
                )
                rendered_text = {artist.get_text() for artist in figure.texts}
                assert all(marker in rendered_text for marker in rendered_markers), "선택한 수정 행동이 결과 화면에 적용되지 않았습니다."
                assert binding_artist.get_text() in rendered_text, "실제 입력의 지문이 결과 화면에 연결되지 않았습니다."
                assert all(render_proofs.values()), "선택한 수정 초점의 화면 증거가 부족합니다."
                assert len(set(render_digests)) == 3, "각 수정 행동이 화면 픽셀을 실제로 바꾸어야 합니다."
                return render_proofs, rendered_markers, render_digests, input_binding_id

            (
                revision_render_proofs,
                rendered_revision_markers,
                revision_render_digests,
                input_binding_id,
            ) = apply_revision_contract(refined_figure, core_project_evidence)
            project_evidence = {
                **core_project_evidence,
                "input_origin": project_mode,
                "input_digest": own_source_digest,
                "probe_input_digest": own_probe_digest,
                "input_binding_id": input_binding_id,
                "source_read_count": project_input.read_count if project_input else 0,
                "own_input_response_digests": own_input_response_digests,
                "same_input_render_digests": same_input_render_digests,
                "revision_evidence_id": revision_evidence_id,
                "applied_revision_focuses": list(selected_revision_focuses),
                "applied_revision_operations": list(selected_revision_operations),
                "revision_render_proofs": revision_render_proofs,
                "rendered_revision_markers": rendered_revision_markers,
                "revision_render_digests": revision_render_digests,
            }
            if baseline_mode == "provided":
                baseline_figure.savefig(baseline_output_path, dpi=200, facecolor="#f3efe5")
            plt.close(baseline_figure)
            refined_figure.savefig(refined_output_path, dpi=200, facecolor="#f3efe5")
            plt.close(refined_figure)

            baseline_snapshot_digest = sha256_file(baseline_output_path)
            refined_output_digest = sha256_file(refined_output_path)
            _run_order.append(3)
            print("STEP 3 OUTPUTS SAVED")
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 4 · 자동 증거와 수정 기록 HTML 만들기
            with Image.open(baseline_output_path) as baseline_image:
                assert baseline_image.size == (1600, 1000), "기준점 PNG는 1600 x 1000이어야 합니다."
                baseline_format = baseline_image.format
            with Image.open(refined_output_path) as saved_image:
                assert saved_image.size == (1600, 1000), "개선 PNG는 1600 x 1000이어야 합니다."
                refined_format = saved_image.format

            assert baseline_format == "PNG" and refined_format == "PNG"
            assert baseline_snapshot_digest != refined_output_digest, "수정 전후 파일이 같습니다. 두 수정 행동을 실제 화면에 반영하세요."
            required_evidence_fields = {
                "track",
                "input_origin",
                "input_digest",
                "probe_input_digest",
                "input_binding_id",
                "source_read_count",
                "own_input_response_digests",
                "same_input_render_digests",
                "revision_evidence_id",
                "applied_revision_focuses",
                "applied_revision_operations",
                "revision_render_proofs",
                "rendered_revision_markers",
                "revision_render_digests",
                "input_count",
                "visual_count",
                "value_match",
                "unit",
            }
            assert required_evidence_fields <= project_evidence.keys(), "승인 코드의 화면 증거 필드가 부족합니다."
            assert project_evidence["track"] == project_track
            assert project_evidence["input_origin"] == project_mode, "own 경로는 승인 코드가 input_origin='own' 증거를 반환해야 합니다."
            assert project_evidence["input_digest"] == own_source_digest, "own 경로는 실제 입력 파일의 SHA-256 증거를 반환해야 합니다."
            assert project_evidence["probe_input_digest"] == own_probe_digest, "own 경로는 검사용 입력 파일의 SHA-256 증거를 반환해야 합니다."
            assert project_evidence["revision_evidence_id"] == revision_evidence_id, "수정 행동 문장과 결과의 증거 ID가 일치해야 합니다."
            assert project_evidence["applied_revision_focuses"] == selected_revision_focuses, "선택한 두 수정 초점이 실제 결과와 일치해야 합니다."
            assert project_evidence["applied_revision_operations"] == selected_revision_operations, "구조화된 두 수정 동작이 실제 결과와 일치해야 합니다."
            assert all(project_evidence["revision_render_proofs"].values()), "선택한 수정 초점의 화면 증거가 부족합니다."
            assert len(project_evidence["rendered_revision_markers"]) == 2, "두 수정 행동이 결과 화면에 표시되어야 합니다."
            assert len(set(project_evidence["revision_render_digests"])) == 3, "각 수정 행동이 화면 픽셀을 실제로 바꾸어야 합니다."
            if project_mode == "own":
                assert project_evidence["source_read_count"] > 0, "own 경로의 승인 코드는 project_input을 실제로 읽어야 합니다."
                assert project_evidence["same_input_render_digests"][0] == project_evidence["same_input_render_digests"][1], "동일 own 입력은 같은 결과를 만들어야 합니다."
                assert project_evidence["own_input_response_digests"][0] != project_evidence["own_input_response_digests"][2], "own 입력 내용을 바꾸면 수정 결과도 달라져야 합니다."
            assert project_evidence["input_count"] == project_evidence["visual_count"]
            assert project_evidence["value_match"] is True

            evidence_report = {
                "baseline_digest": baseline_snapshot_digest,
                "refined_digest": refined_output_digest,
                "baseline_size": (1600, 1000),
                "refined_size": (1600, 1000),
                "input_count": project_evidence["input_count"],
                "visual_count": project_evidence["visual_count"],
                "value_match": project_evidence["value_match"],
                "input_origin": project_evidence["input_origin"],
                "input_digest": project_evidence["input_digest"],
                "probe_input_digest": project_evidence["probe_input_digest"],
                "input_binding_id": project_evidence["input_binding_id"],
                "own_input_response_digests": project_evidence[
                    "own_input_response_digests"
                ],
                "same_input_render_digests": project_evidence[
                    "same_input_render_digests"
                ],
                "revision_evidence_id": project_evidence[
                    "revision_evidence_id"
                ],
                "applied_revision_focuses": project_evidence[
                    "applied_revision_focuses"
                ],
                "applied_revision_operations": project_evidence[
                    "applied_revision_operations"
                ],
                "revision_render_proofs": project_evidence[
                    "revision_render_proofs"
                ],
                "rendered_revision_markers": project_evidence[
                    "rendered_revision_markers"
                ],
                "revision_render_digests": project_evidence[
                    "revision_render_digests"
                ],
            }

            _run_order.append(4)
            print("AUTOMATIC EVIDENCE READY · TEACHER CHECK REQUIRED")
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 5 · EDIT: 관찰, 한계, 교수 피드백과 확인 상태
            main_observation = "EDIT: 수정 후 화면에서 직접 가리킬 수 있는 관찰"
            limitation_statement = "EDIT: 현재 입력과 표현만으로 단정할 수 없는 한계"
            teacher_feedback = "EDIT: 교수 확인에서 합의한 유지 또는 수정 내용"
            teacher_gate = "pending"  # 확인 뒤 confirmed

            baseline_data_uri = "data:image/png;base64," + base64.b64encode(
                baseline_output_path.read_bytes()
            ).decode("ascii")
            refined_data_uri = "data:image/png;base64," + base64.b64encode(
                refined_output_path.read_bytes()
            ).decode("ascii")
            track_labels = {
                "data": "데이터",
                "text": "텍스트",
                "sound": "사운드",
                "image": "규칙 기반 이미지",
            }
            baseline_alt = f"{track_labels[project_track]} 경로의 수정 전 기준 화면. 프로젝트 질문: {project_question}"
            refined_alt = (
                f"{track_labels[project_track]} 경로의 수정 후 결과. "
                f"적용한 수정은 {revision_action_1}, {revision_action_2}. "
                f"핵심 관찰: {main_observation}"
            )

            revision_log_html = f'''<!doctype html>
            <html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
            <title>{escape(project_question)}</title><style>
            body{{max-width:1080px;margin:0 auto;padding:32px;font:16px/1.65 system-ui,sans-serif;color:#202523;background:#f3efe5}}
            main{{padding:28px;border:1px solid #c7c8be;background:#fffdf8}}img{{width:100%;height:auto;border:1px solid #c7c8be}}
            .compare{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}dt{{font-weight:700}}dd{{margin:0 0 12px}}@media(max-width:760px){{.compare{{grid-template-columns:1fr}}}}
            </style></head><body><main><h1>{escape(project_question)}</h1>
            <div class="compare"><figure><img src="{baseline_data_uri}" alt="{escape(baseline_alt)}"><figcaption>수정 전 기준점</figcaption></figure>
            <figure><img src="{refined_data_uri}" alt="{escape(refined_alt)}"><figcaption>두 수정 행동이 적용된 결과</figcaption></figure></div>
            <dl><dt>수정 행동 1</dt><dd>{escape(revision_action_1)}</dd><dt>수정 행동 2</dt><dd>{escape(revision_action_2)}</dd>
            <dt>수정 증거 ID</dt><dd>{revision_evidence_id}</dd><dt>관찰</dt><dd>{escape(main_observation)}</dd><dt>한계</dt><dd>{escape(limitation_statement)}</dd>
            <dt>출처</dt><dd>{escape(source_title)} / {escape(usage_rights)} / {escape(reference_date)}</dd>
            <dt>개인정보 점검</dt><dd>{escape(privacy_check)}</dd><dt>교수 피드백</dt><dd>{escape(teacher_feedback)}</dd></dl></main></body></html>'''
            revision_log_path.write_text(revision_log_html, encoding="utf-8")

            _run_order.append(5)
            print("STEP 5 INTERPRETATION RECORDED")
            """,
        ),
        notebook_cell(
            "code",
            """
            # STEP 6 · FINAL CHECK: 수정하지 않습니다
            _run_order.append(6)
            assert _week15_step0_runs == 1, "마지막 검사는 새 런타임에서 모두 실행해야 합니다."
            assert _run_order == [0, 1, 2, 3, 4, 5, 6], "새 런타임에서 위에서 아래로 한 번씩 실행하세요."

            for value, label in [
                (approval_status, "승인 상태"),
                (project_question, "프로젝트 질문"),
                (intended_audience, "예상 독자"),
                (source_title, "자료 제목과 제공자"),
                (usage_rights, "이용 근거"),
                (reference_date, "기준일"),
                (privacy_check, "개인정보 점검"),
                (revision_action_1, "수정 행동 1"),
                (revision_action_2, "수정 행동 2"),
                (main_observation, "관찰"),
                (limitation_statement, "한계"),
                (teacher_feedback, "교수 피드백"),
            ]:
                ensure_written(value, label)

            assert revision_action_1.startswith(expected_prefix_1), f"수정 행동 1은 '{expected_prefix_1}'으로 시작하세요."
            assert revision_action_2.startswith(expected_prefix_2), f"수정 행동 2는 '{expected_prefix_2}'으로 시작하세요."
            assert revision_operation_1 in revision_action_detail_1
            assert revision_operation_2 in revision_action_detail_2
            assert revision_action_claim_1 != revision_action_claim_2, "서로 다른 두 수정 행동을 기록하세요."
            assert evidence_report["baseline_digest"] != evidence_report["refined_digest"]
            assert evidence_report["value_match"] is True
            assert evidence_report["input_origin"] == project_mode
            assert evidence_report["input_digest"] == own_source_digest
            assert evidence_report["revision_evidence_id"] == revision_evidence_id
            if project_mode == "own":
                assert sha256_file(own_source_path) == own_source_digest, "실행 중 own 입력 파일이 변경되었습니다."
                assert sha256_file(own_probe_path) == own_probe_digest, "실행 중 own 검사용 입력 파일이 변경되었습니다."
            assert evidence_report["applied_revision_focuses"] == selected_revision_focuses
            assert evidence_report["applied_revision_operations"] == selected_revision_operations
            assert all(evidence_report["revision_render_proofs"].values())
            assert len(evidence_report["rendered_revision_markers"]) == 2
            assert len(set(evidence_report["revision_render_digests"])) == 3
            if project_mode == "own":
                assert evidence_report["same_input_render_digests"][0] == evidence_report["same_input_render_digests"][1]
                assert evidence_report["own_input_response_digests"][0] != evidence_report["own_input_response_digests"][2]
            assert baseline_output_path.is_file()
            assert refined_output_path.is_file()
            assert revision_log_path.is_file()
            assert teacher_gate == "confirmed", "교수의 증거 확인 뒤 teacher_gate를 confirmed로 바꾸세요."

            print("PASS 16/16")
            print("WEEK 15 PROJECT REFINEMENT COMPLETE")
            print("제출:", refined_output_path.name, revision_log_path.name)
            """,
        ),
    ]
    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-dir", type=Path, default=DEFAULT_ASSET_DIR)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    validate_runtime()
    apply_style()
    asset_dir = args.asset_dir.resolve()
    generate_progress_ladder(asset_dir / "week-15-progress-ladder.png")
    generate_before_after(asset_dir / "week-15-before-after.png")
    generate_submission_package(asset_dir / "week-15-submission-package.png")
    write_notebook(asset_dir / "week-15-project-refinement-mission.ipynb")
    print(f"Generated Week 15 assets in {asset_dir}")


if __name__ == "__main__":
    main()
