#!/usr/bin/env python3
"""Execute the Week 14 notebook through three pass paths and key failures."""

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


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_PATH = (
    ROOT
    / "teaching"
    / "contents-programming"
    / "assets"
    / "week-14-project-prototype-mission.ipynb"
)


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
        rf"^{re.escape(name)}\s*=\s*\([\s\S]*?^\)",
        lambda _match: f"{name} = ({value!r})",
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace multiline {name}")
    return updated


def edited_cells(
    notebook_cells: list[dict[str, object]],
    track: str,
) -> list[dict[str, object]]:
    cells = copy.deepcopy(notebook_cells)
    questions = {
        "data": "세 공간의 기록 합계는 어떻게 다른가?",
        "text": "제공 발췌문에서 어떤 단어가 가장 자주 반복되는가?",
        "sound": "4초 소리에서 상대 에너지는 시간에 따라 어떻게 변하는가?",
    }
    observations = {
        "data": "Archive의 기록 합계는 84로 세 범주 가운데 가장 크다.",
        "text": "record는 제공 발췌문에서 8회 나타나 가장 높은 빈도를 보인다.",
        "sound": "상대 에너지는 약 0.7초와 3.0초 부근에서 높은 구간을 만든다.",
    }
    limitations = {
        "data": "관찰 기간과 이용 인원이 없어 이 합계만으로 공간 이용률을 판단할 수 없다.",
        "text": "짧은 가상 발췌문이므로 단어 빈도만으로 긴 글의 의미나 의도를 판단할 수 없다.",
        "sound": "합성 신호의 RMS만으로 실제 청취 음량이나 소리의 감정을 판단할 수 없다.",
    }
    simple_values = {
        "student_id": "20261234",
        "student_name": "김프로토",
        "project_track": track,
        "input_mode": "provided",
        "own_source_filename": "",
        "project_question": questions[track],
        "intended_audience": "처음 결과를 읽는 콘텐츠 프로그래밍 수강생",
        "project_source": "Contents Programming Practice Week 14 교수자 제공 가상 자료",
        "usage_rights": "수업 실습과 제출을 위해 제공된 교수자 창작 가상 자료",
        "scope_decision": "이번 주에는 실시간 입력과 인터랙티브 필터를 구현하지 않는다",
        "visual_rule": "처리한 값을 막대 길이 또는 시간과 에너지의 위치에 연결한다",
        "next_step_1": "축 단위와 출처를 결과 화면에서 더 분명하게 배치한다",
        "next_step_2": "긴 레이블과 관찰 문장의 여백을 실제 화면에서 다시 점검한다",
    }
    multiline_values = {
        "main_observation": observations[track],
        "limitation_statement": limitations[track],
    }
    replaced = set()
    for cell in cells:
        source = "".join(cell["source"])
        for name, value in simple_values.items():
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_assignment(source, name, value)
                replaced.add(name)
        for name, value in multiline_values.items():
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_multiline_assignment(source, name, value)
                replaced.add(name)
        cell["source"] = source.splitlines(keepends=True)

    expected = set(simple_values) | set(multiline_values)
    if replaced != expected:
        missing = ", ".join(sorted(expected - replaced))
        raise AssertionError(f"could not replace every editable value: {missing}")
    return cells


def mutate_cells(
    cells: list[dict[str, object]],
    old: str,
    new: str,
    *,
    label: str,
) -> None:
    replacements = 0
    for cell in cells:
        source = "".join(cell["source"])
        if old in source:
            cell["source"] = source.replace(old, new, 1).splitlines(keepends=True)
            replacements += 1
    if replacements != 1:
        raise AssertionError(f"could not apply {label} mutation")


def run_scenario(
    notebook_cells: list[dict[str, object]],
    *,
    track: str,
    use_valid_edits: bool,
    mutation: tuple[str, str, str] | None = None,
    should_pass: bool,
    expected_failure: str | None = None,
) -> dict[str, object]:
    cells = (
        edited_cells(notebook_cells, track)
        if use_valid_edits
        else copy.deepcopy(notebook_cells)
    )
    if mutation is not None:
        old, new, label = mutation
        mutate_cells(cells, old, new, label=label)

    namespace: dict[str, object] = {}
    output = io.StringIO()
    failure: BaseException | None = None
    with tempfile.TemporaryDirectory(prefix=f"week14-{track}-") as temp_dir:
        previous_directory = Path.cwd()
        os.chdir(temp_dir)
        try:
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                for index, cell in enumerate(cells):
                    try:
                        exec(
                            compile(
                                "".join(cell["source"]),
                                f"<week14-{track}-cell-{index}>",
                                "exec",
                            ),
                            namespace,
                        )
                    except BaseException as error:  # noqa: BLE001 - exercise failures are evidence
                        failure = error
                        break
        finally:
            os.chdir(previous_directory)

        rendered_output = output.getvalue()
        if should_pass:
            if failure is not None:
                raise AssertionError(
                    f"{track} valid scenario failed: {failure}\n{rendered_output}"
                ) from failure
            if "WEEK 14 PROJECT PROTOTYPE COMPLETE" not in rendered_output:
                raise AssertionError(f"{track} valid scenario missed completion output")
            output_path = Path(temp_dir) / str(namespace["output_filename"])
            if not output_path.is_file():
                raise AssertionError(f"{track} valid scenario did not save its PNG")
            return {
                "track": track,
                "output_size": output_path.stat().st_size,
                "processed_count": len(namespace["processed_values"]),
            }

        if failure is None:
            raise AssertionError(f"{track} invalid scenario unexpectedly passed")
        combined_failure = f"{failure}\n{rendered_output}"
        if expected_failure and expected_failure not in combined_failure:
            raise AssertionError(
                f"{track} failure did not mention {expected_failure!r}: {combined_failure}"
            )
        return {"track": track, "failure": str(failure)}


def main() -> None:
    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
    code_cells = [
        cell for cell in notebook["cells"] if cell["cell_type"] == "code"
    ]
    if len(code_cells) != 8:
        raise AssertionError("Week 14 notebook must contain exactly eight code cells")

    results = [
        run_scenario(
            code_cells,
            track=track,
            use_valid_edits=True,
            should_pass=True,
        )
        for track in ("data", "text", "sound")
    ]
    results.append(
        run_scenario(
            code_cells,
            track="data",
            use_valid_edits=False,
            should_pass=False,
            expected_failure="실제 학번",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="data",
            use_valid_edits=True,
            mutation=("Archive,34", "Archive,35", "provided-input"),
            should_pass=False,
            expected_failure="수업 제공 원본",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="data",
            use_valid_edits=True,
            mutation=(
                "processed_labels, processed_values, color=\"#116e68\"",
                "processed_labels, processed_values[::-1], color=\"#116e68\"",
                "visual-mapping",
            ),
            should_pass=False,
            expected_failure="막대 길이",
        )
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
