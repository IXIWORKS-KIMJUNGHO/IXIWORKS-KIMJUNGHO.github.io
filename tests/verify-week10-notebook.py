"""Execute the Week 10 map notebook in fresh pass and rejection scenarios."""

from __future__ import annotations

import contextlib
import copy
import io
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace


def set_assignment(source: str, name: str, value: object) -> str:
    updated, count = re.subn(
        rf"^{re.escape(name)}\s*=.*$",
        lambda _match: f"{name} = {value!r}",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace {name}")
    return updated


def set_multiline_assignment(source: str, name: str, value: str) -> str:
    updated, count = re.subn(
        rf"^{re.escape(name)}\s*=\s*\([\s\S]*?^\s*\)",
        lambda _match: f"{name} = {value!r}",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace multiline {name}")
    return updated


def with_valid_edits(cells: list[dict[str, object]]) -> list[dict[str, object]]:
    edited = copy.deepcopy(cells)
    assignments = {
        "student_id": "20261234",
        "student_name": "김지도",
        "map_title": "서울 공공문화시설 프로그램 분포 지도",
        "map_question": "프로그램 수가 많은 시설은 어느 위치와 범주에 분포하는가?",
        "minimum_radius": 6,
        "maximum_radius": 22,
        "palette_name": "해안",
    }
    writings = {
        "pattern_observation": (
            "프로그램 수가 큰 원은 특정 한 지역에만 모이지 않고 여러 위치와 "
            "세 시설 범주에 나뉘어 나타난다."
        ),
        "limitation_statement": (
            "이 자료에는 이용자 수와 지역 인구, 이동 시간이 없어 프로그램 수만으로 "
            "시설의 접근성과 서비스 수준을 판단할 수 없다."
        ),
    }
    remaining_assignments = dict(assignments)
    remaining_writings = dict(writings)

    for cell in edited:
        source = "".join(cell["source"])
        for name, value in list(remaining_assignments.items()):
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_assignment(source, name, value)
                del remaining_assignments[name]
        for name, value in list(remaining_writings.items()):
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_multiline_assignment(source, name, value)
                del remaining_writings[name]
        cell["source"] = source.splitlines(keepends=True)

    if remaining_assignments or remaining_writings:
        missing = sorted((*remaining_assignments, *remaining_writings))
        raise AssertionError("could not edit notebook values: " + ", ".join(missing))
    return edited


def execute_scenario(
    cells: list[dict[str, object]],
    *,
    should_pass: bool,
) -> None:
    shell = SimpleNamespace(execution_count=0)
    namespace = {"get_ipython": lambda: shell}

    with tempfile.TemporaryDirectory(prefix="week10-notebook-test-") as temp_dir:
        previous_directory = Path.cwd()
        os.chdir(temp_dir)
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
                                f"<week10-cell-{execution_count}>",
                                "exec",
                            ),
                            namespace,
                        )
                    except AssertionError as error:
                        failure = error
                        break

            captured = output.getvalue()
            if should_pass:
                if failure is not None:
                    raise failure
                if "WEEK 10 INTERACTIVE MAP COMPLETE" not in captured:
                    raise AssertionError("the completion message is missing")

                cleaned_path = Path(namespace["cleaned_filename"])
                map_path = Path(namespace["map_filename"])
                if not cleaned_path.is_file() or not map_path.is_file():
                    raise AssertionError("the notebook did not save both output files")
                saved_map = map_path.read_text(encoding="utf-8")
                if saved_map.count("L.circleMarker(") != 24:
                    raise AssertionError("the saved map does not contain 24 markers")
                if "지도 마커의 텍스트 대체 정보" not in saved_map:
                    raise AssertionError("the accessible facility table is missing")
                if "user-scalable=no" in saved_map:
                    raise AssertionError("the saved map blocks browser zoom")
            else:
                if failure is None:
                    raise AssertionError("the unchanged starter notebook should fail")
                if "자신의 지도 제목과 질문" not in captured:
                    raise AssertionError("the expected starter-value failure is missing")
        finally:
            os.chdir(previous_directory)


def main() -> None:
    notebook_path = Path(sys.argv[1]).resolve()
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    code_cells = [
        cell for cell in notebook["cells"] if cell["cell_type"] == "code"
    ]
    if len(code_cells) != 7:
        raise AssertionError("the Week 10 notebook must contain seven code cells")

    execute_scenario(with_valid_edits(code_cells), should_pass=True)
    execute_scenario(copy.deepcopy(code_cells), should_pass=False)
    print("week10 notebook scenarios PASS")


if __name__ == "__main__":
    main()
