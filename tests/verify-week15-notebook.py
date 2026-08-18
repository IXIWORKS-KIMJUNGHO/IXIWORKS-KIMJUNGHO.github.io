#!/usr/bin/env python3
"""Execute the Week 15 guided paths and representative final-check failures."""

from __future__ import annotations

import contextlib
import copy
import io
import json
import os
import re
import tempfile
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_PATH = (
    ROOT
    / "teaching"
    / "contents-programming"
    / "assets"
    / "week-15-project-refinement-mission.ipynb"
)


def set_assignment(source: str, name: str, value: object) -> str:
    """Replace one simple top-level assignment in a notebook cell."""

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


def edited_cells(
    notebook_cells: list[dict[str, object]],
    *,
    track: str,
    baseline_mode: str = "provided",
    baseline_source_filename: str = "",
    teacher_gate: str = "confirmed",
    duplicate_actions: bool = False,
) -> list[dict[str, object]]:
    """Return one fully edited student copy without changing the source notebook."""

    first_action = "전체 입력의 수량과 처리 뒤 시각 요소의 수를 비교한다"
    second_action = (
        first_action
        if duplicate_actions
        else "제목과 축 단위, 출처가 저장 이미지에서 읽히도록 정리한다"
    )
    values = {
        "student_id": "20261234",
        "student_name": "김수정",
        "project_track": track,
        "project_mode": "provided",
        "baseline_mode": baseline_mode,
        "baseline_source_filename": baseline_source_filename,
        "approval_status": "provided path approved",
        "project_question": "선택한 자료의 핵심 패턴은 화면에서 어떻게 드러나는가?",
        "intended_audience": "처음 프로젝트 결과를 읽는 수강생",
        "source_title": "Contents Programming Practice Week 15 제공 자료",
        "usage_rights": "수업 실습과 제출을 위해 사용할 수 있는 교수자 제공 자료",
        "reference_date": "2026-08-18 수업 기준 자료",
        "privacy_check": "실명과 연락처를 포함하지 않는 가상 자료임을 확인했다",
        "revision_action_1": first_action,
        "revision_action_2": second_action,
        "main_observation": "수정 결과에는 처리한 모든 항목과 값 레이블이 함께 표시된다",
        "limitation_statement": "제공된 짧은 입력만으로 실제 이용자 전체의 경향을 일반화할 수 없다",
        "teacher_feedback": "질문과 출처를 유지하고 결과 파일의 단위 표시를 확인했다",
        "teacher_gate": teacher_gate,
    }

    cells = copy.deepcopy(notebook_cells)
    replaced: set[str] = set()
    for cell in cells:
        source = "".join(cell["source"])
        for name, value in values.items():
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_assignment(source, name, value)
                replaced.add(name)
        cell["source"] = source.splitlines(keepends=True)

    if replaced != set(values):
        missing = ", ".join(sorted(set(values) - replaced))
        raise AssertionError(f"could not replace every editable value: {missing}")
    return cells


def execute_cells(cells: list[dict[str, object]], directory: Path) -> tuple[dict[str, object], str, BaseException | None]:
    """Execute code cells in order and capture their public output."""

    namespace: dict[str, object] = {}
    output = io.StringIO()
    failure: BaseException | None = None
    previous_directory = Path.cwd()
    os.chdir(directory)
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            for index, cell in enumerate(cells):
                try:
                    exec(
                        compile(
                            "".join(cell["source"]),
                            f"<week15-cell-{index}>",
                            "exec",
                        ),
                        namespace,
                    )
                except BaseException as error:  # noqa: BLE001 - failures are test evidence
                    failure = error
                    break
    finally:
        os.chdir(previous_directory)
    return namespace, output.getvalue(), failure


def run_valid_scenario(
    notebook_cells: list[dict[str, object]],
    *,
    track: str,
    baseline_mode: str = "provided",
) -> dict[str, object]:
    """Execute one valid guided path and inspect the three submission files."""

    with tempfile.TemporaryDirectory(prefix=f"week15-{track}-") as directory_name:
        directory = Path(directory_name)
        baseline_filename = "uploaded_week14_baseline.png"
        if baseline_mode == "upload":
            Image.new("RGB", (1600, 1000), "#dce5ef").save(
                directory / baseline_filename,
                format="PNG",
            )

        cells = edited_cells(
            notebook_cells,
            track=track,
            baseline_mode=baseline_mode,
            baseline_source_filename=(
                baseline_filename if baseline_mode == "upload" else ""
            ),
        )
        namespace, output, failure = execute_cells(cells, directory)
        if failure is not None:
            raise AssertionError(
                f"{track}/{baseline_mode} failed: {failure}\n{output}"
            ) from failure
        if "WEEK 15 PROJECT REFINEMENT COMPLETE" not in output:
            raise AssertionError(f"{track}/{baseline_mode} missed completion output")

        refined_path = directory / Path(namespace["refined_output_path"]).name
        revision_log_path = directory / Path(namespace["revision_log_path"]).name
        notebook_name = "week15_20261234_김수정_project.ipynb"
        if refined_path.name != "week15_20261234_김수정_refined.png":
            raise AssertionError("refined output filename does not match the contract")
        if revision_log_path.name != "week15_20261234_김수정_revision_log.html":
            raise AssertionError("revision log filename does not match the contract")

        with Image.open(refined_path) as refined_image:
            if refined_image.size != (1600, 1000) or refined_image.format != "PNG":
                raise AssertionError("refined output does not match the PNG contract")

        revision_log = revision_log_path.read_text(encoding="utf-8")
        required_log_fragments = (
            "data:image/png;base64,",
            "<dt>수정 행동 1</dt>",
            "<dt>수정 행동 2</dt>",
            "<dt>관찰</dt>",
            "<dt>한계</dt>",
            "<dt>개인정보 점검</dt>",
            "<dt>교수 피드백</dt>",
        )
        for fragment in required_log_fragments:
            if fragment not in revision_log:
                raise AssertionError(f"revision log missed {fragment!r}")
        if revision_log.count("data:image/png;base64,") != 2:
            raise AssertionError("revision log must embed both comparison images")
        if re.search(r'<img src="week15_[^"]+\.png"', revision_log):
            raise AssertionError("revision log still depends on an external image")

        evidence = namespace["project_evidence"]
        if evidence["track"] != track or evidence["value_match"] is not True:
            raise AssertionError("project evidence does not match the selected track")
        if namespace["baseline_snapshot_digest"] == namespace["refined_output_digest"]:
            raise AssertionError("valid scenario did not create different visual evidence")

        return {
            "track": track,
            "baseline_mode": baseline_mode,
            "notebook": notebook_name,
            "refined_bytes": refined_path.stat().st_size,
            "revision_log_bytes": revision_log_path.stat().st_size,
        }


def run_expected_failure(
    notebook_cells: list[dict[str, object]],
    *,
    teacher_gate: str = "confirmed",
    duplicate_actions: bool = False,
    expected_message: str,
) -> str:
    """Confirm that a representative false completion is rejected."""

    with tempfile.TemporaryDirectory(prefix="week15-invalid-") as directory_name:
        cells = edited_cells(
            notebook_cells,
            track="data",
            teacher_gate=teacher_gate,
            duplicate_actions=duplicate_actions,
        )
        _namespace, output, failure = execute_cells(cells, Path(directory_name))
        if failure is None:
            raise AssertionError(f"invalid scenario unexpectedly passed\n{output}")
        if expected_message not in str(failure):
            raise AssertionError(
                f"expected {expected_message!r}, got {failure!r}\n{output}"
            )
        return str(failure)


def main() -> None:
    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
    code_cells = [
        cell for cell in notebook["cells"] if cell.get("cell_type") == "code"
    ]

    results = [
        run_valid_scenario(code_cells, track=track)
        for track in ("data", "text", "sound", "image")
    ]
    results.append(
        run_valid_scenario(code_cells, track="data", baseline_mode="upload")
    )
    failures = [
        run_expected_failure(
            code_cells,
            teacher_gate="pending",
            expected_message="교수의 증거 확인 뒤 teacher_gate를 confirmed로 바꾸세요",
        ),
        run_expected_failure(
            code_cells,
            duplicate_actions=True,
            expected_message="서로 다른 두 수정 행동을 기록하세요",
        ),
    ]
    print(json.dumps({"valid": results, "rejected": failures}, ensure_ascii=False))


if __name__ == "__main__":
    main()
