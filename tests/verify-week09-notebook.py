"""Execute the Week 9 notebook contract without requiring a pandas install."""

from __future__ import annotations

import copy
import csv
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from types import ModuleType, SimpleNamespace


class ColumnList(list):
    def tolist(self) -> list[object]:
        return list(self)


class Series:
    def __init__(self, values: dict[str, object]) -> None:
        self.values = values

    def astype(self, converter: type) -> "Series":
        return Series({key: converter(value) for key, value in self.values.items()})

    def to_dict(self) -> dict[str, object]:
        return dict(self.values)

    def items(self):
        return self.values.items()


class SelectedColumns:
    def __init__(self, columns: list[str]) -> None:
        self.columns = ColumnList(columns)


class MissingFrame:
    def __init__(self, frame: "DataFrame") -> None:
        self.frame = frame

    def sum(self) -> Series:
        return Series(
            {
                column: sum(row[column] is None for row in self.frame.rows)
                for column in self.frame.columns
            }
        )


class LocationAccessor:
    def __init__(self, frame: "DataFrame") -> None:
        self.frame = frame

    def __getitem__(self, key: tuple[int, str]) -> object:
        row_index, column = key
        return self.frame.rows[row_index][column]


class DataFrame:
    def __init__(self, rows: list[dict[str, object]], columns: list[str]) -> None:
        self.rows = rows
        self.columns = ColumnList(columns)
        self.index = range(len(rows))
        self.loc = LocationAccessor(self)

    @property
    def shape(self) -> tuple[int, int]:
        return len(self.rows), len(self.columns)

    @property
    def dtypes(self) -> Series:
        types = {}
        for column in self.columns:
            values = [row[column] for row in self.rows if row[column] is not None]
            sample = values[0] if values else ""
            if isinstance(sample, bool):
                dtype = "bool"
            elif isinstance(sample, int):
                dtype = "int64"
            elif isinstance(sample, float):
                dtype = "float64"
            else:
                dtype = "object"
            types[column] = dtype
        return Series(types)

    def head(self) -> "DataFrame":
        return DataFrame(self.rows[:5], list(self.columns))

    def isna(self) -> MissingFrame:
        return MissingFrame(self)

    def select_dtypes(
        self,
        include: str | None = None,
        exclude: str | None = None,
    ) -> SelectedColumns:
        numeric_columns = []
        for column in self.columns:
            values = [row[column] for row in self.rows if row[column] is not None]
            if values and all(
                isinstance(value, (int, float)) and not isinstance(value, bool)
                for value in values
            ):
                numeric_columns.append(column)
        selected = numeric_columns if include == "number" else [
            column for column in self.columns if column not in numeric_columns
        ]
        if exclude != "number" and include != "number":
            selected = list(self.columns)
        return SelectedColumns(selected)


def parse_value(value: str) -> object:
    if value == "":
        return None
    if value in {"True", "False"}:
        return value == "True"
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    return value


def read_csv(path: str | Path) -> DataFrame:
    with Path(path).open(encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        rows = [
            {key: parse_value(value) for key, value in row.items()}
            for row in reader
        ]
        return DataFrame(rows, list(reader.fieldnames or []))


class HTML:
    def __init__(self, data: str) -> None:
        self.data = data


def display(_value: object) -> None:
    return None


def install_runtime_stubs() -> None:
    pandas = ModuleType("pandas")
    pandas.read_csv = read_csv  # type: ignore[attr-defined]
    ipython = ModuleType("IPython")
    ipython_display = ModuleType("IPython.display")
    ipython_display.HTML = HTML  # type: ignore[attr-defined]
    ipython_display.display = display  # type: ignore[attr-defined]
    ipython.display = ipython_display  # type: ignore[attr-defined]
    sys.modules["pandas"] = pandas
    sys.modules["IPython"] = ipython
    sys.modules["IPython.display"] = ipython_display


def set_assignment(source: str, name: str, value: object) -> str:
    replacement = f"{name} = {value!r}"
    updated, count = re.subn(
        rf"^{re.escape(name)}\s*=.*$",
        replacement,
        source,
        count=1,
        flags=re.MULTILINE,
    )
    if count != 1:
        raise AssertionError(f"could not replace {name}")
    return updated


def set_explanation(source: str, value: str) -> str:
    updated, count = re.subn(
        r"selected_value_explanation\s*=\s*\([\s\S]*?\n\)",
        f"selected_value_explanation = {value!r}",
        source,
        count=1,
    )
    if count != 1:
        raise AssertionError("could not replace selected_value_explanation")
    return updated


def edited_cells(
    notebook_cells: list[dict[str, object]],
    assignments: dict[str, object],
    explanation: str | None = None,
) -> list[dict[str, object]]:
    cells = copy.deepcopy(notebook_cells)
    remaining_assignments = dict(assignments)
    for cell in cells:
        source = "".join(cell["source"])
        for name, value in list(remaining_assignments.items()):
            if re.search(rf"^{re.escape(name)}\s*=", source, re.MULTILINE):
                source = set_assignment(source, name, value)
                del remaining_assignments[name]
        if explanation is not None and re.search(
            r"^selected_value_explanation\s*=",
            source,
            re.MULTILINE,
        ):
            source = set_explanation(source, explanation)
        cell["source"] = source.splitlines(keepends=True)
    if remaining_assignments:
        raise AssertionError(
            "could not replace assignments: "
            + ", ".join(sorted(remaining_assignments))
        )
    return cells


def run_scenario(
    notebook_cells: list[dict[str, object]],
    assignments: dict[str, object],
    *,
    explanation: str | None = None,
    own_csv: str | None = None,
    tamper_provided: bool = False,
    should_pass: bool,
    escaped_text: str | None = None,
    expected_failure_label: str | None = None,
) -> None:
    cells = edited_cells(notebook_cells, assignments, explanation)
    shell = SimpleNamespace(execution_count=0)
    namespace = {"get_ipython": lambda: shell}

    with tempfile.TemporaryDirectory(prefix="week09-notebook-test-") as temp_dir:
        previous_directory = Path.cwd()
        os.chdir(temp_dir)
        try:
            if own_csv is not None:
                Path("own.csv").write_text(own_csv, encoding="utf-8")
            failure = None
            for execution_count, cell in enumerate(cells, start=1):
                shell.execution_count = execution_count
                try:
                    exec(
                        compile(
                            "".join(cell["source"]),
                            f"<week09-cell-{execution_count}>",
                            "exec",
                        ),
                        namespace,
                    )
                    if execution_count == 1 and tamper_provided:
                        provided_path = Path("week09_creative_activity.csv")
                        provided_csv = provided_path.read_text(encoding="utf-8")
                        tampered_csv = provided_csv.replace(
                            "인물 손 연습",
                            "인물 손 연습 수정",
                            1,
                        )
                        if tampered_csv == provided_csv:
                            raise AssertionError("could not create a harmless CSV mutation")
                        provided_path.write_text(tampered_csv, encoding="utf-8")
                except AssertionError as error:
                    failure = error
                    break

            if should_pass:
                if failure is not None:
                    raise failure
                output = Path(namespace["output_filename"])
                if not output.exists():
                    raise AssertionError("expected HTML output was not created")
                if Path(namespace["source_path"]).read_bytes() != namespace["source_bytes_before"]:
                    raise AssertionError("source CSV changed during execution")
                output_html = output.read_text(encoding="utf-8")
                if '<div class="question' not in output_html:
                    raise AssertionError("question cards are not layout containers")
                if re.search(r'<(?:article|section) class="question', output_html):
                    raise AssertionError("question cards misuse sectioning elements")
                if '--coral:#a83e32' not in output_html:
                    raise AssertionError("card does not use the accessible accent color")
                if (
                    'class="skip-link"' not in output_html
                    or 'id="main-content"' not in output_html
                ):
                    raise AssertionError("card has no keyboard shortcut to its main content")
                if escaped_text is not None:
                    if escaped_text in output_html:
                        raise AssertionError("unescaped HTML input reached the output")
                    if "&lt;script&gt;" not in output_html:
                        raise AssertionError("escaped HTML input is missing")
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
            os.chdir(previous_directory)


def main() -> None:
    install_runtime_stubs()
    notebook_path = Path(sys.argv[1])
    notebook = json.loads(notebook_path.read_text(encoding="utf-8"))
    code_cells = [
        cell for cell in notebook["cells"] if cell["cell_type"] == "code"
    ]

    identity = {"student_id": "20261234", "student_name": "김데이터"}
    run_scenario(code_cells, identity, should_pass=False)

    provided_answers = {
        **identity,
        "answerable_question": (
            "activity 열의 <script>alert(1)</script> 문자열은 어떤 활동을 가리키는가?"
        ),
        "needed_columns": ["activity"],
        "unanswerable_question": "누구와 함께한 활동에서 집중도가 더 높았는가?",
        "missing_information": (
            "함께 작업한 사람을 기록한 열이 없으므로 현재 데이터만으로는 답할 수 없다."
        ),
    }
    explanation = "두 번째 창작 활동은 모두 쉰다섯 분 동안 이어진 것으로 기록되었다."
    run_scenario(
        code_cells,
        provided_answers,
        explanation=explanation,
        should_pass=True,
        escaped_text="<script>",
    )
    run_scenario(
        code_cells,
        provided_answers,
        explanation=explanation,
        tamper_provided=True,
        should_pass=False,
        expected_failure_label="provided 또는 own 출처 선택",
    )

    own_csv = (
        "activity,duration_min,focus_level,note\n"
        "sketch,20,3,a\npainting,40,4,b\ncode,50,5,c\n"
        "reading,25,3,d\nediting,45,4,e\n"
    )
    own_base = {
        **provided_answers,
        "source_choice": "own",
        "source_path": "own.csv",
        "dataset_title": "개인 색채 연구 기록",
        "dataset_source": "작성자 본인의 익명화된 관찰 기록",
    }
    own_explanation = "두 번째 색채 연구 활동은 사십 분 동안 이어진 것으로 기록되었다."
    run_scenario(
        code_cells,
        own_base,
        explanation=own_explanation,
        own_csv=own_csv,
        should_pass=False,
    )
    run_scenario(
        code_cells,
        {
            **own_base,
            "dataset_license": "작성자 허락 아래 수업 제출만 허용",
            "observation_unit": "한 번의 색채 연구 활동",
            "time_range": "2026-06-01부터 2026-06-05까지",
        },
        explanation=own_explanation,
        own_csv=own_csv,
        should_pass=True,
    )
    print("week09 notebook scenarios PASS")


if __name__ == "__main__":
    main()
