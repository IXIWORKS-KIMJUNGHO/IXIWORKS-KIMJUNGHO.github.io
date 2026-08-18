#!/usr/bin/env python3
"""Execute the Week 15 guided paths and representative final-check failures."""

from __future__ import annotations

import base64
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
    project_mode: str = "provided",
    own_source_filename: str = "",
    valid_own_adapter: bool = False,
    approval_status: str | None = None,
    teacher_gate: str = "confirmed",
    duplicate_actions: bool = False,
    revision_focuses: tuple[str, str] = ("accuracy", "readability"),
) -> list[dict[str, object]]:
    """Return one fully edited student copy without changing the source notebook."""

    lens_labels = {
        "accuracy": "정확성",
        "readability": "가독성",
        "reproducibility": "재현성",
        "responsibility": "책임성",
        "presentation": "발표 가능성",
    }
    first_detail = "전체 입력의 수량과 처리 뒤 시각 요소의 수를 비교한다"
    first_action = f"{lens_labels[revision_focuses[0]]}: {first_detail}"
    second_action = (
        f"{lens_labels[revision_focuses[1]]}: {first_detail}"
        if duplicate_actions
        else f"{lens_labels[revision_focuses[1]]}: 제목과 축 단위, 출처가 저장 이미지에서 읽히도록 정리한다"
    )
    values = {
        "student_id": "20261234",
        "student_name": "김수정",
        "project_track": track,
        "project_mode": project_mode,
        "own_source_filename": own_source_filename,
        "baseline_mode": baseline_mode,
        "baseline_source_filename": baseline_source_filename,
        "approval_status": approval_status
        if approval_status is not None
        else ("provided" if project_mode == "provided" else "approved"),
        "project_question": "선택한 자료의 핵심 패턴은 화면에서 어떻게 드러나는가?",
        "intended_audience": "처음 프로젝트 결과를 읽는 수강생",
        "source_title": "Contents Programming Practice Week 15 제공 자료",
        "usage_rights": "수업 실습과 제출을 위해 사용할 수 있는 교수자 제공 자료",
        "reference_date": "2026-08-18 수업 기준 자료",
        "privacy_check": "실명과 연락처를 포함하지 않는 가상 자료임을 확인했다",
        "revision_focus_1": revision_focuses[0],
        "revision_focus_2": revision_focuses[1],
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

    if valid_own_adapter:
        replacements = {
            "raw_values = [84, 63, 49]": (
                'raw_values = [int(value) for value in '
                'project_input.read_text(encoding="utf-8").split(",")]'
            ),
        }
        for old, new in replacements.items():
            replacement_count = 0
            for cell in cells:
                source = "".join(cell["source"])
                if old in source:
                    cell["source"] = source.replace(old, new, 1).splitlines(
                        keepends=True
                    )
                    replacement_count += 1
            if replacement_count != 1:
                raise AssertionError(f"could not install own adapter for {old!r}")
    return cells


def execute_cells(
    cells: list[dict[str, object]],
    directory: Path,
    namespace: dict[str, object] | None = None,
) -> tuple[dict[str, object], str, BaseException | None]:
    """Execute code cells in order and capture their public output."""

    if namespace is None:
        namespace = {}
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
    baseline_upload_format: str = "png",
    project_mode: str = "provided",
    revision_focuses: tuple[str, str] = ("accuracy", "readability"),
) -> dict[str, object]:
    """Execute one valid guided path and inspect the three submission files."""

    with tempfile.TemporaryDirectory(prefix=f"week15-{track}-") as directory_name:
        directory = Path(directory_name)
        own_source_filename = "approved_own_values.csv"
        if project_mode == "own":
            (directory / own_source_filename).write_text(
                "91,52,37",
                encoding="utf-8",
            )
        baseline_filename = f"uploaded_week14_baseline.{baseline_upload_format}"
        if baseline_mode == "upload":
            baseline_image = Image.new("RGB", (1600, 1000), "#dce5ef")
            if baseline_upload_format == "png":
                baseline_image.save(directory / baseline_filename, format="PNG")
            elif baseline_upload_format == "html":
                image_buffer = io.BytesIO()
                baseline_image.save(image_buffer, format="PNG")
                encoded_image = base64.b64encode(image_buffer.getvalue()).decode(
                    "ascii"
                )
                (directory / baseline_filename).write_text(
                    '<!doctype html><html lang="ko"><body><img '
                    f'src="data:image/png;base64,{encoded_image}" '
                    'alt="14주차 기준 결과"></body></html>',
                    encoding="utf-8",
                )
            else:
                raise AssertionError("unsupported baseline upload format")

        cells = edited_cells(
            notebook_cells,
            track=track,
            baseline_mode=baseline_mode,
            baseline_source_filename=(
                baseline_filename if baseline_mode == "upload" else ""
            ),
            project_mode=project_mode,
            own_source_filename=(
                own_source_filename if project_mode == "own" else ""
            ),
            valid_own_adapter=project_mode == "own",
            revision_focuses=revision_focuses,
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
            "<dt>수정 증거 ID</dt>",
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
        if evidence["input_origin"] != project_mode:
            raise AssertionError("project evidence does not prove its input origin")
        expected_evidence_id = namespace["revision_evidence_id"]
        if evidence["revision_evidence_id"] != expected_evidence_id:
            raise AssertionError("revision text is not connected to the rendered evidence")
        if evidence["applied_revision_focuses"] != list(revision_focuses):
            raise AssertionError("selected revision focuses are not connected to the result")
        if not all(evidence["revision_render_proofs"].values()):
            raise AssertionError("a selected revision focus lacks rendered evidence")
        if len(evidence["rendered_revision_markers"]) != 2:
            raise AssertionError("both revision actions must be rendered")
        if len(evidence["revision_render_digests"]) != 3:
            raise AssertionError("both revision actions need before/after render digests")
        if len(set(evidence["revision_render_digests"])) != 3:
            raise AssertionError("each revision action must change rendered pixels")
        if project_mode == "own" and evidence["input_digest"] != namespace["own_source_digest"]:
            raise AssertionError("own project evidence missed the actual input digest")
        if namespace["baseline_snapshot_digest"] == namespace["refined_output_digest"]:
            raise AssertionError("valid scenario did not create different visual evidence")

        return {
            "track": track,
            "project_mode": project_mode,
            "baseline_mode": baseline_mode,
            "revision_focuses": list(revision_focuses),
            "baseline_source_suffix": (
                f".{baseline_upload_format}" if baseline_mode == "upload" else ""
            ),
            "notebook": notebook_name,
            "refined_bytes": refined_path.stat().st_size,
            "revision_log_bytes": revision_log_path.stat().st_size,
        }


def run_expected_failure(
    notebook_cells: list[dict[str, object]],
    *,
    project_mode: str = "provided",
    approval_status: str | None = None,
    teacher_gate: str = "confirmed",
    duplicate_actions: bool = False,
    expected_message: str,
) -> str:
    """Confirm that a representative false completion is rejected."""

    with tempfile.TemporaryDirectory(prefix="week15-invalid-") as directory_name:
        directory = Path(directory_name)
        own_source_filename = "approved_own_values.csv"
        if project_mode == "own":
            (directory / own_source_filename).write_text(
                "91,52,37",
                encoding="utf-8",
            )
        cells = edited_cells(
            notebook_cells,
            track="data",
            project_mode=project_mode,
            own_source_filename=(
                own_source_filename if project_mode == "own" else ""
            ),
            approval_status=approval_status,
            teacher_gate=teacher_gate,
            duplicate_actions=duplicate_actions,
        )
        _namespace, output, failure = execute_cells(cells, directory)
        if failure is None:
            raise AssertionError(f"invalid scenario unexpectedly passed\n{output}")
        if expected_message not in str(failure):
            raise AssertionError(
                f"expected {expected_message!r}, got {failure!r}\n{output}"
            )
        return str(failure)


def run_repeated_session_failure(
    notebook_cells: list[dict[str, object]],
) -> str:
    """Confirm that Run all in an already-used runtime is not a fresh-run PASS."""

    with tempfile.TemporaryDirectory(prefix="week15-repeated-") as directory_name:
        directory = Path(directory_name)
        cells = edited_cells(notebook_cells, track="data")
        namespace, first_output, first_failure = execute_cells(cells, directory)
        if first_failure is not None:
            raise AssertionError(
                f"first fresh execution failed: {first_failure}\n{first_output}"
            ) from first_failure
        _namespace, second_output, second_failure = execute_cells(
            cells,
            directory,
            namespace,
        )
        expected_message = "마지막 검사는 새 런타임에서 모두 실행해야 합니다"
        if second_failure is None or expected_message not in str(second_failure):
            raise AssertionError(
                f"repeated session was not rejected: {second_failure}\n{second_output}"
            )
        return str(second_failure)


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
        run_valid_scenario(
            code_cells,
            track="data",
            baseline_mode="upload",
            baseline_upload_format="png",
        )
    )
    results.append(
        run_valid_scenario(
            code_cells,
            track="data",
            project_mode="own",
        )
    )
    results.append(
        run_valid_scenario(
            code_cells,
            track="data",
            baseline_mode="upload",
            baseline_upload_format="html",
        )
    )
    results.append(
        run_valid_scenario(
            code_cells,
            track="data",
            revision_focuses=("responsibility", "presentation"),
        )
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
        run_expected_failure(
            code_cells,
            project_mode="own",
            expected_message="own 경로의 승인 코드는 project_input을 실제로 읽어야 합니다",
        ),
        run_expected_failure(
            code_cells,
            approval_status="not approved",
            expected_message="approval_status는 provided 또는 approved여야 합니다",
        ),
        run_repeated_session_failure(code_cells),
    ]
    print(json.dumps({"valid": results, "rejected": failures}, ensure_ascii=False))


if __name__ == "__main__":
    main()
