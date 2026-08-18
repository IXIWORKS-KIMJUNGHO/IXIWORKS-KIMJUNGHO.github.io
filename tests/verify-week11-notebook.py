"""Execute the Week 11 Colab notebook through pass and rejection scenarios."""

from __future__ import annotations

import contextlib
import copy
import io
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager


def set_assignment(source: str, name: str, value: object) -> str:
    updated, count = re.subn(
        rf"^{re.escape(name)}\s*=.*$",
        f"{name} = {value!r}",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace {name}")
    return updated


def set_multiline_assignment(source: str, name: str, value: str) -> str:
    updated, count = re.subn(
        rf"^{re.escape(name)}\s*=\s*\([\s\S]*?^\)",
        f"{name} = {value!r}",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace multiline {name}")
    return updated


def set_palette(source: str, palette: dict[str, str]) -> str:
    replacement = (
        "category_palette = {\n"
        + "".join(
            f"    {category!r}: {color!r},\n"
            for category, color in palette.items()
        )
        + "}"
    )
    updated, count = re.subn(
        r"^category_palette\s*=\s*\{[\s\S]*?^\}",
        replacement,
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError("could not replace category_palette")
    return updated


def edited_cells(
    notebook_cells: list[dict[str, object]],
) -> list[dict[str, object]]:
    cells = copy.deepcopy(notebook_cells)
    assignments = {
        "student_id": "20261234",
        "student_name": "김포스터",
        "poster_title": "프로그램 수 합계가 가장 큰 시설 범주는 무엇인가?",
    }
    palette = {
        "도서관": "#177f78",
        "박물관": "#b94b40",
        "문화센터": "#365f91",
    }
    observation = (
        "문화센터의 프로그램 수 합계는 400으로 세 범주 가운데 가장 크며 "
        "큰 점은 여러 좌표에 나뉘어 나타난다."
    )
    limitation = (
        "이 자료에는 이용자 수와 인구, 이동 시간이 없어 프로그램 수만으로 "
        "문화 서비스의 충분함이나 접근성을 판단할 수 없다."
    )

    remaining = dict(assignments)
    palette_replaced = False
    observation_replaced = False
    limitation_replaced = False
    for cell in cells:
        source = "".join(cell["source"])
        for name, value in list(remaining.items()):
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_assignment(source, name, value)
                del remaining[name]
        if re.search(r"^category_palette\s*=", source, re.MULTILINE):
            source = set_palette(source, palette)
            palette_replaced = True
        if re.search(r"^main_observation\s*=", source, re.MULTILINE):
            source = set_multiline_assignment(
                source,
                "main_observation",
                observation,
            )
            observation_replaced = True
        if re.search(r"^limitation_statement\s*=", source, re.MULTILINE):
            source = set_multiline_assignment(
                source,
                "limitation_statement",
                limitation,
            )
            limitation_replaced = True
        cell["source"] = source.splitlines(keepends=True)

    if remaining:
        raise AssertionError(
            "could not replace assignments: " + ", ".join(sorted(remaining))
        )
    if not all((palette_replaced, observation_replaced, limitation_replaced)):
        raise AssertionError("could not replace every editable visual or writing value")
    return cells


def run_scenario(
    notebook_cells: list[dict[str, object]],
    *,
    use_valid_edits: bool,
    tamper_csv: bool = False,
    tamper_metadata: bool = False,
    should_pass: bool,
    expected_failure_label: str | None = None,
) -> None:
    cells = (
        edited_cells(notebook_cells)
        if use_valid_edits
        else copy.deepcopy(notebook_cells)
    )
    shell = SimpleNamespace(execution_count=0)
    namespace = {"get_ipython": lambda: shell}

    with tempfile.TemporaryDirectory(prefix="week11-notebook-test-") as temp_dir:
        temp_path = Path(temp_dir)
        fake_korean_font = temp_path / "NanumGothic.ttf"
        bundled_font = (
            Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf"
        )
        shutil.copy2(bundled_font, fake_korean_font)

        original_find_system_fonts = font_manager.findSystemFonts

        def deterministic_system_fonts(*_args, **_kwargs):
            return [str(fake_korean_font)]

        font_manager.findSystemFonts = deterministic_system_fonts
        previous_directory = Path.cwd()
        os.chdir(temp_path)
        output = io.StringIO()
        failure: AssertionError | None = None
        try:
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                for execution_count, cell in enumerate(cells, start=1):
                    shell.execution_count = execution_count
                    try:
                        exec(
                            compile(
                                "".join(cell["source"]),
                                f"<week11-cell-{execution_count}>",
                                "exec",
                            ),
                            namespace,
                        )
                    except AssertionError as error:
                        failure = error
                        break

                    if execution_count == 1 and tamper_csv:
                        source_path = temp_path / "week11_public_facilities_clean.csv"
                        source_csv = source_path.read_text(encoding="utf-8")
                        changed_csv = source_csv.replace("햇살도서관", "햇빛도서관", 1)
                        if changed_csv == source_csv:
                            raise AssertionError("could not create a harmless CSV mutation")
                        source_path.write_text(changed_csv, encoding="utf-8")
                    if execution_count == 1 and tamper_metadata:
                        namespace["dataset_source"] = "출처가 바뀐 자료"

            captured = output.getvalue()
            if should_pass:
                if failure is not None:
                    raise failure
                if "WEEK 11 DATA POSTER COMPLETE" not in captured:
                    raise AssertionError("the completion message is missing")
                output_path = Path(namespace["output_path"])
                if not output_path.exists() or output_path.stat().st_size <= 50_000:
                    raise AssertionError("the poster output is missing or incomplete")
                if tuple(namespace["saved_image"].shape[:2]) != (2200, 1600):
                    raise AssertionError("the poster dimensions are incorrect")
                if namespace["bar_count"] != 3:
                    raise AssertionError("the bar chart does not contain three bars")
                if namespace["scatter_point_count"] != 24:
                    raise AssertionError("the coordinate chart does not contain 24 points")
                if namespace["source_path"].read_bytes() != namespace["source_bytes_before"]:
                    raise AssertionError("the source CSV changed during execution")
            elif failure is None:
                raise AssertionError("scenario should fail but produced PASS")
            elif (
                expected_failure_label is not None
                and expected_failure_label not in str(failure)
            ):
                raise AssertionError(
                    "scenario failed for the wrong reason: " + str(failure)
                )
        finally:
            plt.close("all")
            font_manager.findSystemFonts = original_find_system_fonts
            os.chdir(previous_directory)


def main() -> None:
    notebook_path = Path(sys.argv[1])
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    code_cells = [
        cell for cell in notebook["cells"] if cell["cell_type"] == "code"
    ]

    run_scenario(
        code_cells,
        use_valid_edits=False,
        should_pass=False,
        expected_failure_label="학번·이름",
    )
    run_scenario(
        code_cells,
        use_valid_edits=True,
        should_pass=True,
    )
    run_scenario(
        code_cells,
        use_valid_edits=True,
        tamper_csv=True,
        should_pass=False,
        expected_failure_label="제공 CSV 내용이 수업 기준과 다릅니다",
    )
    run_scenario(
        code_cells,
        use_valid_edits=True,
        tamper_metadata=True,
        should_pass=False,
        expected_failure_label="출처·이용 조건·기준일·관찰 단위",
    )
    print("week11 notebook scenarios PASS")


if __name__ == "__main__":
    main()
