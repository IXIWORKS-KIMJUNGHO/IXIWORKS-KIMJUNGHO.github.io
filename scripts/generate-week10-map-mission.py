"""Generate the Week 10 goal-based Folium mission notebook and example map."""

from __future__ import annotations

import json
import re
from html import escape
from pathlib import Path
from textwrap import dedent

import folium
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
SOURCE_CSV = ASSET_DIR / "week-10-public-facilities-practice.csv"
NOTEBOOK_PATH = ASSET_DIR / "week-10-interactive-map-mission.ipynb"
EXAMPLE_MAP_PATH = ASSET_DIR / "week-10-interactive-map-example.html"

SITE_ORIGIN = "https://creativeengineer-kimjungho.com"
SHARE_IMAGE_URL = (
    SITE_ORIGIN
    + "/teaching/contents-programming/assets/week-10-location-encoding.png"
)
SHARE_IMAGE_ALT = (
    "위치 데이터의 열이 지도 마커의 위치, 크기, 색상, 문자 정보로 바뀌는 10주차 도해"
)

APPROVED_PALETTES = {
    "해안": {
        "도서관": "#25696f",
        "박물관": "#b94736",
        "문화센터": "#455b92",
    },
    "숲길": {
        "도서관": "#315f49",
        "박물관": "#8a4b2a",
        "문화센터": "#56457a",
    },
    "도시": {
        "도서관": "#2f5d8c",
        "박물관": "#8c3f57",
        "문화센터": "#5a651f",
    },
}
STARTER_CATEGORY_COLORS = {
    "도서관": "#6b7280",
    "박물관": "#6b7280",
    "문화센터": "#6b7280",
}

MAP_OVERLAY_CSS = dedent(
    """
    .week10-map-panel {
      box-sizing: border-box;
      position: fixed;
      z-index: 800;
      border: 2px solid #1c1f1e;
      border-radius: 4px;
      background: rgba(252, 250, 245, 0.96);
      color: #1c1f1e;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
      font: 14px/1.45 Arial, sans-serif;
    }

    .week10-map-info {
      top: 12px;
      left: 64px;
      width: min(410px, calc(100vw - 84px));
    }

    .week10-map-info summary {
      min-height: 44px;
      padding: 10px 42px 10px 14px;
      display: grid;
      gap: 2px;
      align-content: center;
      position: relative;
      cursor: pointer;
      list-style: none;
      font-size: 17px;
      font-weight: 700;
    }

    .week10-map-info summary::-webkit-details-marker { display: none; }

    .week10-map-info summary::after {
      content: "+";
      position: absolute;
      top: 50%;
      right: 15px;
      transform: translateY(-50%);
      font-size: 20px;
      font-weight: 400;
    }

    .week10-map-info[open] summary::after { content: "−"; }

    .week10-map-info summary small {
      color: #555b57;
      font-size: 11px;
      font-weight: 400;
    }

    .week10-map-info summary:focus-visible {
      outline: 3px solid #25696f;
      outline-offset: 3px;
    }

    .week10-map-panel-body {
      max-height: min(42vh, 330px);
      padding: 0 16px 14px;
      overflow: auto;
    }

    .week10-map-panel-body p { margin: 8px 0; }
    .week10-map-panel-body > small { color: #555b57; }

    .week10-map-legend {
      right: 16px;
      bottom: 32px;
      min-width: 164px;
      padding: 13px 15px;
    }

    .week10-map-legend ul {
      margin: 8px 0;
      padding: 0;
      display: grid;
      gap: 7px;
      list-style: none;
    }

    .week10-map-legend li {
      margin: 0;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .week10-map-swatch {
      width: 14px;
      height: 14px;
      border: 1px solid #1c1f1e;
      border-radius: 50%;
      display: inline-block;
      background: var(--marker-color);
    }

    @media (max-width: 760px) {
      .week10-map-info {
        top: 64px;
        left: 12px;
        width: calc(100vw - 24px);
      }

      .week10-map-panel-body { max-height: 28vh; }

      .week10-map-legend {
        right: auto;
        bottom: 42px;
        left: 12px;
        max-width: calc(100vw - 24px);
      }
    }
    """
).strip()


def source_lines(text: str) -> list[str]:
    """Convert a readable multiline string into Jupyter source lines."""

    normalized = dedent(text).strip("\n") + "\n"
    return normalized.splitlines(keepends=True)


def markdown_cell(text: str) -> dict[str, object]:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source_lines(text),
    }


def code_cell(text: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source_lines(text),
    }


def build_notebook(sample_csv: str) -> dict[str, object]:
    setup_code = f'''\
    # STEP 0 · 수업용 데이터와 실행 환경 준비 - 이 셀은 수정하지 않습니다.
    from html import escape
    from pathlib import Path
    import importlib.util
    import re
    import subprocess
    import sys

    if importlib.util.find_spec("folium") is None:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "folium"])

    import folium
    import pandas as pd

    mission_step0_execution = get_ipython().execution_count

    SAMPLE_CSV_PATH = "week10_public_facilities_raw.csv"
    SAMPLE_CSV = {sample_csv!r}
    Path(SAMPLE_CSV_PATH).write_text(SAMPLE_CSV, encoding="utf-8")

    dataset_title = "수업용 가상 공공문화시설 위치 데이터"
    dataset_source = "Contents Programming Practice Week 10 · 교수자 제공 가상 자료"
    dataset_license = "수업 목적 사용 허용"
    reference_date = "2026-08-18"
    observation_unit = "공공문화시설 한 곳"
    cleaning_rule_summary = (
        "숫자 변환 실패와 좌표 결측을 제외하고, place_id 중복을 제거한 뒤 "
        "위도 -90~90·경도 -180~180 범위를 적용했다."
    )
    privacy_statement = (
        "개인의 집·학교·이동 경로를 포함하지 않은 가상 공공시설 자료만 사용했다."
    )

    print("준비 파일:", SAMPLE_CSV_PATH)
    print("데이터:", dataset_title)
    print("관찰 단위:", observation_unit)
    '''

    settings_code = '''
    # STEP 1 · EDIT - 제출 정보, 지도 질문, 크기와 팔레트를 수정합니다.
    mission_step1_execution = get_ipython().execution_count

    student_id = "학번"
    student_name = "이름"
    map_title = "공공문화시설 프로그램 지도"
    map_question = "시설의 위치와 프로그램 수는 지도에서 어떤 패턴을 보이는가?"

    minimum_radius = 10
    maximum_radius = 10

    palette_options = __PALETTE_OPTIONS__
    approved_palette_names = set(palette_options)
    palette_name = "선택 전"
    starter_category_colors = __STARTER_CATEGORY_COLORS__
    category_colors = palette_options.get(
        palette_name,
        starter_category_colors,
    ).copy()

    print("제출자:", student_id, student_name)
    print("지도 제목:", map_title)
    print("지도 질문:", map_question)
    print("반지름 범위:", minimum_radius, "부터", maximum_radius)
    print("선택 가능한 팔레트:", sorted(approved_palette_names))
    print("선택한 팔레트:", palette_name)
    print("범주 색상:", category_colors)
    '''
    settings_code = settings_code.replace(
        "__PALETTE_OPTIONS__",
        repr(APPROVED_PALETTES),
    ).replace(
        "__STARTER_CATEGORY_COLORS__",
        repr(STARTER_CATEGORY_COLORS),
    )

    load_code = '''
    # STEP 2 · 원본 CSV 불러오기와 구조 점검 - 이 셀은 수정하지 않습니다.
    mission_step2_execution = get_ipython().execution_count

    source_path = Path(SAMPLE_CSV_PATH)
    source_bytes_before = source_path.read_bytes()
    raw_df = pd.read_csv(source_path)
    raw_snapshot = raw_df.copy(deep=True)

    required_columns = {
        "place_id",
        "place_name",
        "category",
        "program_count",
        "latitude",
        "longitude",
    }
    missing_columns = sorted(required_columns - set(raw_df.columns))
    if missing_columns:
        raise KeyError("필요한 열이 없습니다: " + ", ".join(missing_columns))

    print("원본 크기:", raw_df.shape)
    print("열 이름:", list(raw_df.columns))
    print("열별 결측값:")
    print(raw_df.isna().sum())
    print("place_id 중복 수:", raw_df.duplicated(subset=["place_id"]).sum())
    print("원본 앞 5행:")
    print(raw_df.head().to_string(index=False))
    '''

    cleaning_code = '''
    # STEP 3 · 숫자·결측·중복·좌표 범위 정제 - 이 셀은 수정하지 않습니다.
    mission_step3_execution = get_ipython().execution_count

    clean_df = raw_df.copy(deep=True)
    numeric_columns = ["program_count", "latitude", "longitude"]

    for column_name in numeric_columns:
        clean_df[column_name] = pd.to_numeric(
            clean_df[column_name],
            errors="coerce",
        )

    rows_after_conversion = len(clean_df)
    clean_df = clean_df.dropna(
        subset=["program_count", "latitude", "longitude"],
    )
    rows_after_missing = len(clean_df)
    clean_df = clean_df.drop_duplicates(
        subset=["place_id"],
        keep="first",
    )
    rows_after_duplicates = len(clean_df)

    valid_coordinate_mask = (
        clean_df["latitude"].between(-90, 90)
        & clean_df["longitude"].between(-180, 180)
    )
    clean_df = clean_df.loc[valid_coordinate_mask].copy()
    clean_df["program_count"] = clean_df["program_count"].astype(int)
    clean_df = clean_df.reset_index(drop=True)

    cleaning_counts = {
        "원본": len(raw_df),
        "숫자 변환 직후": rows_after_conversion,
        "결측 처리 후": rows_after_missing,
        "중복 처리 후": rows_after_duplicates,
        "좌표 범위 처리 후": len(clean_df),
    }

    print("행 수 변화:", cleaning_counts)
    print("범주별 시설 수:")
    print(clean_df["category"].value_counts().sort_index())
    print("제외한 행:", len(raw_df) - len(clean_df))
    '''

    map_code = """
    # STEP 4 · 크기·색상·문자 규칙으로 지도 만들기 - 이 셀은 수정하지 않습니다.
    mission_step4_execution = get_ipython().execution_count

    minimum_value = int(clean_df["program_count"].min())
    maximum_value = int(clean_df["program_count"].max())


    def scale_radius(program_count):
        if minimum_value == maximum_value:
            return (minimum_radius + maximum_radius) / 2

        value_ratio = (
            (program_count - minimum_value)
            / (maximum_value - minimum_value)
        )
        return minimum_radius + value_ratio * (
            maximum_radius - minimum_radius
        )


    def category_to_color(category):
        if category not in category_colors:
            raise ValueError("색상이 지정되지 않은 범주입니다: " + str(category))
        return category_colors[category]


    map_center = [
        clean_df["latitude"].mean(),
        clean_df["longitude"].mean(),
    ]
    facility_map = folium.Map(
        location=map_center,
        zoom_start=12,
        tiles="CartoDB positron",
        control_scale=True,
    )
    week10_map_overlay_css = __MAP_OVERLAY_CSS__
    facility_map.get_root().header.add_child(
        folium.Element("<style>" + week10_map_overlay_css + "</style>")
    )

    marker_records = []

    for row_index, row in clean_df.iterrows():
        latitude = float(row["latitude"])
        longitude = float(row["longitude"])
        program_count = int(row["program_count"])
        marker_radius = float(scale_radius(program_count))
        marker_color = category_to_color(row["category"])
        tooltip_text = row["place_name"] + " · " + row["category"]
        popup_text = (
            row["place_name"]
            + " | 범주: "
            + row["category"]
            + " | 프로그램 수: "
            + str(program_count)
        )

        folium.CircleMarker(
            location=[latitude, longitude],
            radius=marker_radius,
            color=marker_color,
            weight=2,
            fill=True,
            fill_color=marker_color,
            fill_opacity=0.78,
            tooltip=tooltip_text,
            popup=popup_text,
        ).add_to(facility_map)

        marker_records.append(
            {
                "place_id": row["place_id"],
                "place_name": row["place_name"],
                "category": row["category"],
                "program_count": program_count,
                "latitude": latitude,
                "longitude": longitude,
                "radius": marker_radius,
                "color": marker_color,
                "tooltip": tooltip_text,
                "popup": popup_text,
            }
        )

    legend_items = "".join(
        (
            '<li>'
            f'<span class="week10-map-swatch" style="--marker-color:{escape(color)}"></span>'
            f'<span>{escape(category)}</span></li>'
        )
        for category, color in category_colors.items()
    )
    legend_html = f'''<aside class="week10-map-panel week10-map-legend" aria-label="시설 범주 범례"><strong>시설 범주</strong><ul>{legend_items}</ul><small>원 크기 = 프로그램 수</small></aside>'''
    facility_map.get_root().html.add_child(folium.Element(legend_html))

    marker_count = len(marker_records)
    print("정제 행 수:", len(clean_df))
    print("생성 마커 수:", marker_count)
    print("지도 중심:", map_center)
    facility_map
    """
    map_code = map_code.replace(
        "__MAP_OVERLAY_CSS__",
        repr(MAP_OVERLAY_CSS),
    )

    save_code = """
    # STEP 5 · EDIT - 지도 관찰과 한계를 작성한 뒤 두 결과 파일을 저장합니다.
    mission_step5_execution = get_ipython().execution_count

    pattern_observation = (
        "수업용 지도를 살펴보고 위치·크기·색상에서 확인한 패턴을 자신의 문장으로 작성하세요."
    )
    limitation_statement = (
        "이 지도로 단정할 수 없는 내용과 데이터의 범위를 자신의 문장으로 작성하세요."
    )

    safe_student_id = str(student_id).strip()
    safe_student_name = str(student_name).strip()
    cleaned_filename = f"week10_{safe_student_id}_{safe_student_name}_cleaned.csv"
    map_filename = f"week10_{safe_student_id}_{safe_student_name}_map.html"

    information_html = f'''<details class="week10-map-panel week10-map-info"><summary>{escape(map_title)}<small>지도 설명 열기</small></summary><div class="week10-map-panel-body"><p><b>질문</b> · {escape(map_question)}</p><p><b>관찰</b> · {escape(pattern_observation)}</p><p><b>한계</b> · {escape(limitation_statement)}</p><small>{escape(dataset_source)} · 기준일 {escape(reference_date)} · 정제 {len(clean_df)}행</small></div></details>'''
    facility_map.get_root().html.add_child(folium.Element(information_html))

    clean_df.to_csv(
        cleaned_filename,
        index=False,
        encoding="utf-8-sig",
    )
    facility_map.save(map_filename)
    saved_map_text = Path(map_filename).read_text(encoding="utf-8")
    saved_map_text = saved_map_text.replace(
        ", maximum-scale=1.0, user-scalable=no",
        "",
    )
    saved_map_text = "\n".join(
        line.rstrip() for line in saved_map_text.splitlines()
    ) + "\n"
    Path(map_filename).write_text(saved_map_text, encoding="utf-8")

    print("정제 CSV 저장:", cleaned_filename)
    print("지도 HTML 저장:", map_filename)
    print("지도 관찰:", pattern_observation)
    print("해석의 한계:", limitation_statement)
    facility_map
    """

    final_check_code = '''
    # FINAL CHECK · 새 런타임에서 STEP 0부터 모두 실행한 뒤 확인합니다.
    mission_final_execution = get_ipython().execution_count

    execution_order_ok = (
        mission_step0_execution,
        mission_step1_execution,
        mission_step2_execution,
        mission_step3_execution,
        mission_step4_execution,
        mission_step5_execution,
        mission_final_execution,
    ) == (1, 2, 3, 4, 5, 6, 7)

    expected_categories = {"도서관", "박물관", "문화센터"}
    expected_clean_ids = {f"C{number:03d}" for number in range(1, 25)}
    expected_cleaned_filename = (
        f"week10_{safe_student_id}_{safe_student_name}_cleaned.csv"
    )
    expected_map_filename = (
        f"week10_{safe_student_id}_{safe_student_name}_map.html"
    )

    identity_ok = (
        safe_student_id not in {"", "학번", "20260000"}
        and safe_student_name not in {"", "이름", "홍길동"}
        and "/" not in safe_student_id + safe_student_name
        and "\\\\" not in safe_student_id + safe_student_name
    )
    title_question_ok = (
        map_title != "공공문화시설 프로그램 지도"
        and len(map_title.strip()) >= 8
        and map_question != "시설의 위치와 프로그램 수는 지도에서 어떤 패턴을 보이는가?"
        and len(map_question.strip()) >= 20
        and ("?" in map_question or "？" in map_question)
    )
    source_context_ok = (
        len(dataset_source.strip()) >= 10
        and len(dataset_license.strip()) >= 5
        and len(reference_date.strip()) >= 8
        and observation_unit == "공공문화시설 한 곳"
        and "개인" in privacy_statement
        and "이동 경로" in privacy_statement
    )
    raw_preserved_ok = (
        len(raw_df) == 29
        and raw_df.equals(raw_snapshot)
        and source_path.read_bytes() == source_bytes_before
    )
    cleaning_ok = (
        cleaning_counts
        == {
            "원본": 29,
            "숫자 변환 직후": 29,
            "결측 처리 후": 27,
            "중복 처리 후": 26,
            "좌표 범위 처리 후": 24,
        }
        and set(clean_df["place_id"]) == expected_clean_ids
        and set(clean_df["category"]) == expected_categories
        and clean_df["latitude"].between(-90, 90).all()
        and clean_df["longitude"].between(-180, 180).all()
        and not clean_df[["program_count", "latitude", "longitude"]].isna().any().any()
        and not clean_df["place_id"].duplicated().any()
    )
    radius_rule_ok = (
        isinstance(minimum_radius, (int, float))
        and isinstance(maximum_radius, (int, float))
        and 4 <= minimum_radius < maximum_radius <= 28
        and maximum_radius - minimum_radius >= 6
        and scale_radius(minimum_value) == minimum_radius
        and scale_radius(maximum_value) == maximum_radius
    )
    color_rule_ok = (
        palette_name in approved_palette_names
        and category_colors == palette_options.get(palette_name)
        and set(category_colors) == expected_categories
        and all(
            re.fullmatch(r"#[0-9a-fA-F]{6}", color) is not None
            for color in category_colors.values()
        )
    )
    marker_rule_ok = (
        marker_count == len(clean_df) == 24
        and len(marker_records) == 24
        and all(
            record["color"] == category_colors[record["category"]]
            and record["radius"] == scale_radius(record["program_count"])
            and record["place_name"] in record["tooltip"]
            and record["category"] in record["tooltip"]
            and record["place_name"] in record["popup"]
            and str(record["program_count"]) in record["popup"]
            for record in marker_records
        )
    )
    explanation_ok = (
        "작성하세요" not in pattern_observation
        and len(pattern_observation.strip()) >= 30
        and "작성하세요" not in limitation_statement
        and len(limitation_statement.strip()) >= 30
    )
    filenames_ok = (
        cleaned_filename == expected_cleaned_filename
        and map_filename == expected_map_filename
        and Path(cleaned_filename).is_file()
        and Path(map_filename).is_file()
        and Path(cleaned_filename).stat().st_size > 0
        and Path(map_filename).stat().st_size > 0
    )

    saved_df = pd.read_csv(cleaned_filename)
    saved_map_html = Path(map_filename).read_text(encoding="utf-8")
    saved_outputs_ok = (
        len(saved_df) == len(clean_df)
        and set(saved_df["place_id"]) == set(clean_df["place_id"])
        and saved_map_html.count("L.circleMarker(") == 24
        and escape(map_title) in saved_map_html
        and escape(map_question) in saved_map_html
        and escape(pattern_observation) in saved_map_html
        and escape(limitation_statement) in saved_map_html
        and all(name in saved_map_html for name in clean_df["place_name"])
        and "week10-map-info" in saved_map_html
        and "week10-map-legend" in saved_map_html
        and "user-scalable=no" not in saved_map_html
    )

    checks = {
        "새 런타임에서 STEP 0부터 일곱 셀 순서대로 실행": execution_order_ok,
        "학번·이름과 안전한 파일명": identity_ok,
        "자신의 지도 제목과 질문": title_question_ok,
        "출처·이용 조건·기준일·관찰 단위·개인정보 기록": source_context_ok,
        "raw_df 29행과 원본 파일 보존": raw_preserved_ok,
        "29→27→26→24행 정제와 세 범주": cleaning_ok,
        "수치가 커질수록 커지는 4~28픽셀 반지름": radius_rule_ok,
        "밝은 바탕지도에서 읽을 수 있는 승인 팔레트": color_rule_ok,
        "정제 24행과 위치·크기·색상·문자가 있는 마커 24개": marker_rule_ok,
        "30자 이상의 지도 관찰과 해석 한계": explanation_ok,
        "규칙에 맞는 정제 CSV와 지도 HTML 파일": filenames_ok,
        "저장 파일과 현재 데이터·지도 상태 일치": saved_outputs_ok,
    }

    failed_checks = [label for label, passed in checks.items() if not passed]

    print("=" * 64)
    print("WEEK 10 FINAL CHECK")
    print("=" * 64)
    for label, passed in checks.items():
        print("✅" if passed else "❌", label)

    if failed_checks:
        print("\\n아직 통과하지 못한 조건:")
        for label in failed_checks:
            print("-", label)
        raise AssertionError(
            "위 조건을 수정한 뒤 런타임을 다시 시작하고 모두 실행하세요."
        )

    print("\\n정제 CSV:", cleaned_filename)
    print("지도 HTML:", map_filename)
    print("🎉 WEEK 10 INTERACTIVE MAP COMPLETE")
    '''

    return {
        "cells": [
            markdown_cell(
                '''
                # Week 10 · 인터랙티브 위치 데이터 지도 미션

                수업용 가상 공공문화시설 CSV를 정제하고, 수치는 원의 크기, 범주는 색상, 장소명과 실제 값은 툴팁·팝업으로 표현한 Folium 지도를 완성합니다.

                **완료 조건:** 마지막 셀의 `🎉 WEEK 10 INTERACTIVE MAP COMPLETE` 확인 + 실행 결과가 남은 노트북·정제 CSV·지도 HTML 세 파일 제출.

                코드 전체를 새로 작성하지 않습니다. `EDIT`라고 적힌 STEP 1과 STEP 5의 값만 자신의 내용으로 수정합니다. 나머지 셀은 삭제하거나 바꾸지 않습니다.
                '''
            ),
            markdown_cell(
                '''
                ## STEP 0 · 환경과 수업용 원본 준비

                수업용 CSV 29행을 현재 세션에 만들고 데이터의 출처·관찰 단위·개인정보 기준을 준비합니다. 이 셀은 수정하지 않습니다.
                '''
            ),
            code_cell(setup_code),
            markdown_cell(
                '''
                ## STEP 1 · 제출 정보와 지도 인코딩 규칙

                학번·이름, 지도 제목과 질문을 자신의 내용으로 바꿉니다. 반지름은 최솟값 4 이상, 최댓값 28 이하로 정하고 두 값의 차이를 6 이상으로 만듭니다. `palette_name`에는 밝은 바탕지도와의 대비를 확인한 `해안`, `숲길`, `도시` 가운데 하나를 입력합니다.
                '''
            ),
            code_cell(settings_code),
            markdown_cell(
                '''
                ## STEP 2 · 원본 구조 확인

                원본 29행, 여섯 열, 결측값과 중복 식별자를 확인합니다. `raw_df`와 원본 파일은 이후 단계에서도 바꾸지 않습니다.
                '''
            ),
            code_cell(load_code),
            markdown_cell(
                '''
                ## STEP 3 · 데이터 정제

                작업 사본에서 숫자 변환, 결측 처리, 중복 처리, 좌표 범위 검사를 차례대로 실행합니다. 출력은 `29 → 27 → 26 → 24`행이어야 합니다.
                '''
            ),
            code_cell(cleaning_code),
            markdown_cell(
                '''
                ## STEP 4 · Folium 지도와 마커 생성

                정제된 한 행을 원형 마커 하나로 바꿉니다. 위도·경도는 위치, 프로그램 수는 반지름, 시설 범주는 색상, 장소명·범주·실제 값은 툴팁과 팝업에 사용됩니다.
                '''
            ),
            code_cell(map_code),
            markdown_cell(
                '''
                ## STEP 5 · 지도 관찰·한계 작성과 파일 저장

                지도를 직접 확대하고 마커를 가리키거나 누른 뒤, 확인한 패턴과 이 지도로 단정할 수 없는 내용을 각각 30자 이상 작성합니다. 셀을 실행하면 정제 CSV와 지도 HTML이 저장됩니다.
                '''
            ),
            code_cell(save_code),
            markdown_cell(
                '''
                ## FINAL CHECK · 새 런타임 전체 실행

                수정이 끝나면 **런타임 → 세션 다시 시작**, 이어서 **런타임 → 모두 실행**을 한 번 선택합니다. 마지막 셀은 실행 순서, 원본 보존, 정제 결과, 지도 인코딩, 설명과 저장 파일을 함께 검사합니다. 검사 코드는 수정하지 않습니다.
                '''
            ),
            code_cell(final_check_code),
            markdown_cell(
                '''
                ## 제출 후 귀가

                1. 마지막 셀에서 `🎉 WEEK 10 INTERACTIVE MAP COMPLETE`를 확인합니다.
                2. **파일 → 다운로드 → .ipynb 다운로드**로 실행 결과가 포함된 노트북을 받습니다.
                3. 왼쪽 파일 목록에서 `week10_학번_이름_cleaned.csv`와 `week10_학번_이름_map.html`을 각각 내려받습니다.
                4. 노트북·정제 CSV·지도 HTML 세 파일을 제출합니다.
                5. 업로드 완료를 확인받으면 남은 시간과 관계없이 즉시 귀가합니다.
                '''
            ),
        ],
        "metadata": {
            "colab": {
                "name": "week-10-interactive-map-mission.ipynb",
                "provenance": [],
            },
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {
                "name": "python",
                "version": "3",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def clean_source_data() -> pd.DataFrame:
    raw_df = pd.read_csv(SOURCE_CSV)
    clean_df = raw_df.copy(deep=True)
    for column_name in ["program_count", "latitude", "longitude"]:
        clean_df[column_name] = pd.to_numeric(
            clean_df[column_name],
            errors="coerce",
        )
    clean_df = clean_df.dropna(
        subset=["program_count", "latitude", "longitude"],
    )
    clean_df = clean_df.drop_duplicates(subset=["place_id"], keep="first")
    coordinate_mask = (
        clean_df["latitude"].between(-90, 90)
        & clean_df["longitude"].between(-180, 180)
    )
    clean_df = clean_df.loc[coordinate_mask].copy()
    clean_df["program_count"] = clean_df["program_count"].astype(int)
    return clean_df.reset_index(drop=True)


def relative_luminance(hex_color: str) -> float:
    """Return WCAG relative luminance for a six-digit HEX color."""

    channels = [
        int(hex_color[index : index + 2], 16) / 255
        for index in (1, 3, 5)
    ]
    linear_channels = [
        channel / 12.92
        if channel <= 0.04045
        else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ]
    return (
        0.2126 * linear_channels[0]
        + 0.7152 * linear_channels[1]
        + 0.0722 * linear_channels[2]
    )


def contrast_ratio(first_color: str, second_color: str) -> float:
    lighter, darker = sorted(
        [relative_luminance(first_color), relative_luminance(second_color)],
        reverse=True,
    )
    return (lighter + 0.05) / (darker + 0.05)


def build_example_map() -> folium.Map:
    clean_df = clean_source_data()
    colors = APPROVED_PALETTES["해안"]
    minimum_value = int(clean_df["program_count"].min())
    maximum_value = int(clean_df["program_count"].max())

    def radius_for(value: int) -> float:
        ratio = (value - minimum_value) / (maximum_value - minimum_value)
        return 6 + ratio * 14

    example_map = folium.Map(
        location=[
            clean_df["latitude"].mean(),
            clean_df["longitude"].mean(),
        ],
        zoom_start=12,
        tiles="CartoDB positron",
        control_scale=True,
    )
    example_map.get_root().header.add_child(
        folium.Element("<style>" + MAP_OVERLAY_CSS + "</style>")
    )

    for _, row in clean_df.iterrows():
        program_count = int(row["program_count"])
        color = colors[row["category"]]
        folium.CircleMarker(
            location=[row["latitude"], row["longitude"]],
            radius=radius_for(program_count),
            color=color,
            weight=2,
            fill=True,
            fill_color=color,
            fill_opacity=0.78,
            tooltip=row["place_name"] + " · " + row["category"],
            popup=(
                row["place_name"]
                + " | 범주: "
                + row["category"]
                + " | 프로그램 수: "
                + str(program_count)
            ),
        ).add_to(example_map)

    legend_items = "".join(
        (
            '<li>'
            f'<span class="week10-map-swatch" style="--marker-color:{color}"></span>'
            f'<span>{escape(category)}</span></li>'
        )
        for category, color in colors.items()
    )
    legend_html = f'''<aside class="week10-map-panel week10-map-legend" aria-label="시설 범주 범례"><strong>시설 범주</strong><ul>{legend_items}</ul><small>원 크기 = 프로그램 수</small></aside>'''
    summary_html = '''<details class="week10-map-panel week10-map-info"><summary>서울 가상 공공문화시설 프로그램 지도<small>지도 설명 열기</small></summary><div class="week10-map-panel-body"><p><b>질문</b> · 프로그램 수가 많은 시설은 어느 위치와 범주에 나타나는가?</p><p><b>관찰</b> · 큰 원은 여러 지역에 흩어져 있으며 세 범주 모두에서 프로그램 수의 차이가 보인다.</p><p><b>한계</b> · 가상 자료이며 시설의 접근성·이용자 수·지역 인구를 포함하지 않아 서비스 수준을 판단할 수 없다.</p><small>교수자 제공 가상 자료 · 기준일 2026-08-18 · 정제 24행</small></div></details>'''
    example_map.get_root().html.add_child(folium.Element(legend_html))
    example_map.get_root().html.add_child(folium.Element(summary_html))
    assign_deterministic_ids(example_map.get_root(), "root")
    return example_map


def assign_deterministic_ids(element: object, path: str) -> None:
    """Give every Branca/Folium element a reproducible identifier."""

    if hasattr(element, "_id"):
        element._id = f"week10_{path}"
    children = getattr(element, "_children", {})
    for index, child in enumerate(children.values()):
        assign_deterministic_ids(child, f"{path}_{index:03d}")


def add_example_page_metadata(html: str) -> str:
    canonical = (
        SITE_ORIGIN
        + "/teaching/contents-programming/assets/"
        + EXAMPLE_MAP_PATH.name
    )
    metadata = f'''
    <title>10주차 인터랙티브 위치 데이터 지도 예시</title>
    <meta name="description" content="정제된 공공문화시설 24행을 위치, 크기, 범주 색상, 툴팁과 팝업으로 표현한 10주차 Folium 지도 예시입니다.">
    <link rel="canonical" href="{canonical}">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <meta property="og:title" content="10주차 인터랙티브 위치 데이터 지도 예시">
    <meta property="og:description" content="정제된 공공문화시설 24행을 크기와 범주 색상이 있는 마커로 표현한 완성 예시입니다.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical}">
    <meta property="og:image" content="{SHARE_IMAGE_URL}">
    <meta property="og:image:alt" content="{SHARE_IMAGE_ALT}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="10주차 인터랙티브 위치 데이터 지도 예시">
    <meta name="twitter:description" content="정제된 위치 데이터 24행을 Folium 마커 24개로 표현한 완성 예시입니다.">
    <meta name="twitter:image" content="{SHARE_IMAGE_URL}">
    <style>
      #main-content {{ width:100%; height:100%; }}
      .skip-link {{ position:fixed; left:12px; top:-80px; z-index:10001; padding:10px 14px; color:#fff; background:#1c1f1e; font:700 14px Arial,sans-serif; }}
      .skip-link:focus {{ top:12px; }}
      .map-visually-hidden {{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }}
    </style>
    '''
    result = html.replace("<html>", '<html lang="ko">', 1)
    result = result.replace(
        ", maximum-scale=1.0, user-scalable=no",
        "",
    )
    result = result.replace("<head>", "<head>" + dedent(metadata), 1)
    result = result.replace(
        "<body>",
        '<body><a class="skip-link" href="#main-content">본문 바로가기</a><main id="main-content"><h1 class="map-visually-hidden">10주차 인터랙티브 위치 데이터 지도 예시</h1>',
        1,
    )
    result = result.replace("</body>", "</main></body>", 1)
    return result


def normalize_generated_html_ids(html: str) -> str:
    """Replace Folium popup content UUIDs with stable sequential identifiers."""

    replacements: dict[str, str] = {}

    def stable_id(match: re.Match[str]) -> str:
        random_id = match.group(0)
        if random_id not in replacements:
            replacements[random_id] = f"html_week10_{len(replacements):03d}"
        return replacements[random_id]

    return re.sub(r"html_[0-9a-f]{32}", stable_id, html)


def normalize_generated_html_whitespace(html: str) -> str:
    """Remove generator-only trailing spaces while preserving one final newline."""

    return "\n".join(line.rstrip() for line in html.splitlines()) + "\n"


def validate_outputs(notebook: dict[str, object], example_html: str) -> None:
    code_cells = [
        cell
        for cell in notebook["cells"]
        if cell["cell_type"] == "code"
    ]
    assert notebook["nbformat"] == 4
    assert len(code_cells) == 7
    assert SOURCE_CSV.read_text(encoding="utf-8").count("\n") == 30
    assert example_html.count("L.circleMarker(") == 24
    assert "maximum-scale" not in example_html
    assert "user-scalable" not in example_html
    assert "week10-map-info" in example_html
    assert "week10-map-legend" in example_html
    for palette in APPROVED_PALETTES.values():
        assert set(palette) == {"도서관", "박물관", "문화센터"}
        assert len(set(palette.values())) == 3
        assert all(
            contrast_ratio(color, "#f8f9f4") >= 4.5
            for color in palette.values()
        )
    assert "WEEK 10 INTERACTIVE MAP COMPLETE" in "".join(
        "".join(cell["source"]) for cell in code_cells
    )


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    sample_csv = SOURCE_CSV.read_text(encoding="utf-8")
    notebook = build_notebook(sample_csv)
    NOTEBOOK_PATH.write_text(
        json.dumps(notebook, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    example_map = build_example_map()
    example_map.save(EXAMPLE_MAP_PATH)
    example_html = EXAMPLE_MAP_PATH.read_text(encoding="utf-8")
    example_html = normalize_generated_html_ids(example_html)
    example_html = add_example_page_metadata(example_html)
    example_html = normalize_generated_html_whitespace(example_html)
    EXAMPLE_MAP_PATH.write_text(example_html, encoding="utf-8")

    validate_outputs(notebook, example_html)
    print("generated", NOTEBOOK_PATH.relative_to(ROOT))
    print("generated", EXAMPLE_MAP_PATH.relative_to(ROOT))


if __name__ == "__main__":
    main()
