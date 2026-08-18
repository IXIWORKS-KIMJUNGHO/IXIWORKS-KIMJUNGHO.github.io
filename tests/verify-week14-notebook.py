#!/usr/bin/env python3
"""Execute every Week 14 guided path and representative failure cases."""

from __future__ import annotations

import contextlib
import copy
import io
import json
import math
import os
import re
import struct
import tempfile
import wave
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


def project_sentences(track: str) -> dict[str, str]:
    return {
        "data": {
            "question": "세 공간의 기록 합계는 어떻게 다른가?",
            "evidence": "Archive 84",
            "observation": "Archive 84는 세 공간의 기록 합계 가운데 가장 큰 값이다.",
            "limitation": "관찰 기간과 이용 인원이 없어 이 합계만으로 공간 이용률을 판단할 수 없다.",
            "unit": "한 행은 한 공간에서 한 번 집계한 기록값을 뜻한다",
            "value_unit": "기록 합계",
            "processing": "category가 같은 행의 value 값을 모두 합산한다",
        },
        "text": {
            "question": "제공 발췌문에서 어떤 단어가 가장 자주 반복되는가?",
            "evidence": "record 8회",
            "observation": "record 8회는 제공 발췌문에서 가장 높은 단어 빈도이다.",
            "limitation": "짧은 가상 발췌문이므로 단어 빈도만으로 긴 글의 의미나 의도를 판단할 수 없다.",
            "unit": "한 토큰은 공백과 문장부호 규칙으로 나눈 단어 한 개를 뜻한다",
            "value_unit": "등장 횟수",
            "processing": "본문을 소문자로 바꾸고 토큰을 나눈 뒤 같은 단어의 빈도를 센다",
        },
        "sound": {
            "question": "4초 소리에서 상대 에너지는 시간에 따라 어떻게 변하는가?",
            "evidence": "3.0초",
            "observation": "상대 에너지는 3.0초 부근에서 두 번째로 높은 구간을 만든다.",
            "limitation": "합성 신호의 RMS만으로 실제 청취 음량이나 소리의 감정을 판단할 수 없다.",
            "unit": "한 프레임은 약 50밀리초 동안 모은 소리 샘플 묶음을 뜻한다",
            "value_unit": "상대 RMS 에너지",
            "processing": "50밀리초 프레임마다 샘플 제곱의 평균에 제곱근을 적용한다",
        },
        "image": {
            "question": "다섯 매개변수는 위치와 크기가 다른 구성을 어떻게 만드는가?",
            "evidence": "원 5개",
            "observation": "원 5개는 서로 다른 x·y 위치와 크기로 한 화면에 배치된다.",
            "limitation": "다섯 매개변수만으로 무한한 생성 규칙의 모든 변주를 판단할 수 없다.",
            "unit": "한 행은 원 하나의 x·y 위치와 크기·색 매개변수를 뜻한다",
            "value_unit": "도형 크기 매개변수",
            "processing": "각 행의 위치·크기·색을 유효한 생성 매개변수로 적용한다",
        },
    }[track]


def edited_cells(
    notebook_cells: list[dict[str, object]],
    *,
    track: str,
    input_mode: str,
    source_filename: str,
    output_format: str,
) -> list[dict[str, object]]:
    cells = copy.deepcopy(notebook_cells)
    sentences = project_sentences(track)
    simple_values = {
        "student_id": "20261234",
        "student_name": "김프로토",
        "project_track": track,
        "input_mode": input_mode,
        "own_source_filename": source_filename,
        "output_format": output_format,
        "approval_status": "provided" if input_mode == "provided" else "approved",
        "approval_note": "질문에 필요한 입력 하나와 처리·표현 규칙 하나로 핵심 범위를 확정했다",
        "teacher_gate": "confirmed",
        "project_question": sentences["question"],
        "intended_audience": "처음 결과를 읽는 콘텐츠 프로그래밍 수강생",
        "project_source": "Contents Programming Practice Week 14 교수자 제공 또는 승인 자료",
        "usage_rights": "수업 실습과 제출을 위해 제공되거나 직접 제작해 이용 권한을 확인한 자료",
        "reference_date": "2026-08-18 수업용 제작 또는 확인 자료",
        "privacy_check": "실제 개인정보를 포함하지 않으며 자신의 자료는 동의와 제외 기준을 확인했다",
        "observation_unit": sentences["unit"],
        "value_unit": sentences["value_unit"],
        "scope_decision": "이번 주에는 실시간 입력과 인터랙티브 필터를 구현하지 않는다",
        "processing_rule": sentences["processing"],
        "visual_rule": "처리한 값을 길이·시간 위치 또는 도형의 위치·크기·색에 연결한다",
        "observation_evidence": sentences["evidence"],
        "next_step_1": "축 단위와 출처를 결과 화면에서 더 분명하게 표시한다",
        "next_step_2": "긴 레이블과 관찰 문장의 여백을 실제 화면에서 다시 확인한다",
        "teacher_feedback": "관찰 근거는 유지하고 입력 범위의 한계를 출처 가까이에 배치한다",
    }
    multiline_values = {
        "main_observation": sentences["observation"],
        "limitation_statement": sentences["limitation"],
    }
    replaced: set[str] = set()
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


def write_own_input(directory: Path, track: str) -> str:
    filenames = {
        "data": "week14_20261234_김프로토_source.csv",
        "text": "week14_20261234_김프로토_source.txt",
        "sound": "week14_20261234_김프로토_source.wav",
        "image": "week14_20261234_김프로토_source.csv",
    }
    path = directory / filenames[track]
    if track == "data":
        path.write_text("category,value\nA,4\nB,7\nA,5\n", encoding="utf-8")
    elif track == "text":
        path.write_text("빛 소리 기록 빛 움직임 기록 빛 형태", encoding="utf-8")
    elif track == "sound":
        sample_rate = 8000
        samples = [
            int(0.28 * 32767 * math.sin(2 * math.pi * 180 * index / sample_rate))
            for index in range(sample_rate)
        ]
        with wave.open(str(path), "wb") as sound_file:
            sound_file.setnchannels(1)
            sound_file.setsampwidth(2)
            sound_file.setframerate(sample_rate)
            sound_file.writeframes(b"".join(struct.pack("<h", value) for value in samples))
    else:
        path.write_text(
            "x,y,size,color\n0.2,0.3,44,#116e68\n0.5,0.7,70,#365f91\n0.8,0.4,56,#a23d34\n",
            encoding="utf-8",
        )
    return path.name


def run_scenario(
    notebook_cells: list[dict[str, object]],
    *,
    track: str,
    input_mode: str = "provided",
    output_format: str = "png",
    use_valid_edits: bool,
    mutation: tuple[str, str, str] | None = None,
    invalid_own_payload: bytes | None = None,
    should_pass: bool,
    expected_failure: str | None = None,
) -> dict[str, object]:
    namespace: dict[str, object] = {}
    output = io.StringIO()
    failure: BaseException | None = None
    with tempfile.TemporaryDirectory(prefix=f"week14-{track}-") as temp_dir_name:
        temp_dir = Path(temp_dir_name)
        source_filename = write_own_input(temp_dir, track) if input_mode == "own" else ""
        if invalid_own_payload is not None:
            (temp_dir / source_filename).write_bytes(invalid_own_payload)
        cells = (
            edited_cells(
                notebook_cells,
                track=track,
                input_mode=input_mode,
                source_filename=source_filename,
                output_format=output_format,
            )
            if use_valid_edits
            else copy.deepcopy(notebook_cells)
        )
        if mutation is not None:
            old, new, label = mutation
            mutate_cells(cells, old, new, label=label)

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
                    except BaseException as error:  # noqa: BLE001 - failures are evidence
                        failure = error
                        break
        finally:
            os.chdir(previous_directory)

        rendered_output = output.getvalue()
        if should_pass:
            if failure is not None:
                raise AssertionError(
                    f"{track}/{input_mode}/{output_format} failed: {failure}\n{rendered_output}"
                ) from failure
            if "WEEK 14 PROJECT PROTOTYPE COMPLETE" not in rendered_output:
                raise AssertionError(f"{track} valid scenario missed completion output")
            output_path = temp_dir / str(namespace["output_filename"])
            if not output_path.is_file():
                raise AssertionError(f"{track} valid scenario did not save its preview")
            if output_format == "html":
                html_output = output_path.read_text(encoding="utf-8")
                for required_html in (
                    "max-width:100%;height:auto",
                    "<figcaption>",
                    "<strong>관찰:</strong>",
                    "<strong>한계:</strong>",
                ):
                    if required_html not in html_output:
                        raise AssertionError(
                            f"{track} HTML missed {required_html!r}"
                        )
            return {
                "track": track,
                "input_mode": input_mode,
                "output_format": output_format,
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
            output_format="html" if track == "image" else "png",
            use_valid_edits=True,
            should_pass=True,
        )
        for track in ("data", "text", "sound", "image")
    ]
    results.extend(
        run_scenario(
            code_cells,
            track=track,
            input_mode="own",
            use_valid_edits=True,
            should_pass=True,
        )
        for track in ("data", "text", "sound", "image")
    )
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
            input_mode="own",
            use_valid_edits=True,
            invalid_own_payload=b"category,value\n,4\nStudio,5\n",
            should_pass=False,
            expected_failure="category 열에 결측값",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="data",
            input_mode="own",
            use_valid_edits=True,
            invalid_own_payload=b"category,value\nArchive,-4\nStudio,5\n",
            should_pass=False,
            expected_failure="0 이상의 값",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="text",
            input_mode="own",
            use_valid_edits=True,
            mutation=(
                "own_source_filename = 'week14_20261234_김프로토_source.txt'",
                "own_source_filename = 'renamed-after-run.txt'",
                "own-source-filename",
            ),
            should_pass=False,
            expected_failure="자신의 입력 파일명을",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="data",
            use_valid_edits=True,
            mutation=(
                "mapping_visual_values = np.array([bar.get_width() for bar in visual_artists], dtype=float)",
                "mapping_visual_values = np.array([bar.get_width() for bar in visual_artists], dtype=float)[::-1]",
                "visual-mapping",
            ),
            should_pass=False,
            expected_failure="화면에 매핑된 값",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="text",
            use_valid_edits=True,
            mutation=("teacher_gate = 'confirmed'", "teacher_gate = 'pending'", "teacher-gate"),
            should_pass=False,
            expected_failure="교수의 최종 확인",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="image",
            use_valid_edits=True,
            mutation=(
                "c=processed_colors,",
                "c=['#116e68'] * len(processed_colors),",
                "image-color-mapping",
            ),
            should_pass=False,
            expected_failure="도형의 색",
        )
    )
    results.append(
        run_scenario(
            code_cells,
            track="image",
            use_valid_edits=True,
            mutation=(
                "observation_evidence = '원 5개'",
                "observation_evidence = '화면 오른쪽'",
                "observation-evidence",
            ),
            should_pass=False,
            expected_failure="관찰 근거를 그대로 포함",
        )
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
