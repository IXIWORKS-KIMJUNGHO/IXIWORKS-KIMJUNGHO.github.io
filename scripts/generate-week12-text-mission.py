#!/usr/bin/env python3
"""Generate the Week 12 goal-based text-pattern mission notebook."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
NOTEBOOK_PATH = ASSET_DIR / "week-12-text-pattern-mission.ipynb"

TEXT_LIBRARY = {
    "library_night": {
        "title": "밤의 도서관",
        "source": "Contents Programming Practice Week 12 · 교수자 창작 자료",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "raw_text": (
            "밤의 도서관은 조용히 문을 연다. 작은 빛 하나가 긴 책상 위에 머문다. "
            "학생은 빛 아래에서 오래된 지도를 펼친다. 지도에는 사라진 골목과 낯선 이름이 남아 있다. "
            "학생은 지도 옆에 작은 메모를 남긴다. 메모에는 빛, 골목, 질문이라는 세 단어가 적힌다. "
            "질문은 길을 만들고 길은 새로운 이야기를 부른다. 이야기는 창가의 빛을 따라 천천히 길어진다. "
            "도서관은 늦은 시간에도 조용한 이야기를 품는다. 학생은 마지막 문장을 읽고 지도를 접는다. "
            "문은 닫히지만 질문은 메모 속에 남는다. 다음 밤이 오면 빛은 다시 문을 연다."
        ),
        "excluded_tokens": ("위에", "아래에서", "옆에", "속에"),
    },
    "rain_garden": {
        "title": "비 온 뒤의 정원",
        "source": "Contents Programming Practice Week 12 · 교수자 창작 자료",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "raw_text": (
            "비가 그친 정원에는 작은 물방울이 남아 있다. 정원사는 젖은 흙 위에 새 씨앗을 놓는다. "
            "씨앗 옆에는 이름을 적은 작은 표지가 서 있다. 바람은 잎 사이로 천천히 지나간다. "
            "잎은 물방울을 흔들어 흙으로 돌려보낸다. 정원사는 물방울이 모인 길을 따라 걷는다. "
            "길 끝에서는 노란 꽃 세 송이가 고개를 든다. 작은 벌 한 마리가 꽃 사이를 둥글게 돈다. "
            "정원은 비가 오기 전보다 선명한 색을 품는다. 정원사는 달라진 빛과 냄새를 짧게 기록한다. "
            "기록에는 씨앗, 물방울, 꽃이라는 세 단어가 반복된다. 다음 비가 오면 정원은 또 다른 기록을 만든다."
        ),
        "excluded_tokens": ("위에", "옆에는", "사이로", "끝에서는"),
    },
    "morning_market": {
        "title": "아침 시장의 목소리",
        "source": "Contents Programming Practice Week 12 · 교수자 창작 자료",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "raw_text": (
            "아침 시장은 첫 가게의 불빛과 함께 문을 연다. 상인은 붉은 사과를 나무 상자 위에 가지런히 놓는다. "
            "옆 가게에서는 따뜻한 빵 냄새가 천천히 퍼진다. 손님은 사과와 빵 사이에서 잠시 걸음을 멈춘다. "
            "상인은 오늘 들어온 사과의 맛과 산지를 설명한다. 손님은 작은 사과 세 개와 둥근 빵 하나를 고른다. "
            "시장 안쪽에서는 생선 상자와 꽃 바구니가 나란히 놓인다. 사람들은 필요한 물건을 찾으며 짧은 질문을 주고받는다. "
            "질문은 가격과 수량을 확인하는 말로 이어진다. 가게마다 다른 목소리가 좁은 길을 채운다. "
            "손님은 마지막 가게에서 작은 꽃 한 송이를 더 산다. 해가 높아지면 시장의 첫 번째 이야기는 새로운 이야기로 바뀐다."
        ),
        "excluded_tokens": ("위에", "가게에서는", "사이에서", "안쪽에서는"),
    },
}


def analyze_text(raw_text: str, excluded_tokens: tuple[str, ...]) -> dict[str, object]:
    """Return the exact quantities used by the mission checker."""

    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?]+", raw_text)
        if sentence.strip()
    ]
    normalized_text = re.sub(r"[^0-9A-Za-z가-힣\s]", " ", raw_text)
    raw_tokens = normalized_text.split()
    excluded = set(excluded_tokens)
    tokens = [token for token in raw_tokens if token not in excluded]
    token_counter = Counter(tokens)
    sentence_lengths = [
        len(re.sub(r"[^0-9A-Za-z가-힣\s]", " ", sentence).split())
        for sentence in sentences
    ]
    return {
        "raw_characters": len(raw_text),
        "sentence_count": len(sentences),
        "raw_token_count": len(raw_tokens),
        "raw_type_count": len(set(raw_tokens)),
        "analysis_token_count": len(tokens),
        "analysis_type_count": len(set(tokens)),
        "top10": token_counter.most_common(10),
        "sentence_lengths": sentence_lengths,
    }


def notebook_library() -> dict[str, dict[str, object]]:
    """Add deterministic expected statistics to each supplied text."""

    library: dict[str, dict[str, object]] = {}
    for text_id, record in TEXT_LIBRARY.items():
        library[text_id] = {
            **record,
            "expected": analyze_text(
                str(record["raw_text"]),
                tuple(record["excluded_tokens"]),
            ),
        }
    return library


def source_lines(text: str) -> list[str]:
    """Convert readable multiline text to Jupyter source lines."""

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


def build_notebook() -> dict[str, object]:
    library = notebook_library()

    setup_code = f'''\
    # STEP 0 · 실행 환경과 수업용 텍스트 세 편 준비 — 이 셀은 수정하지 않습니다.
    from collections import Counter
    from pathlib import Path
    from textwrap import fill
    import importlib.util
    import re
    import subprocess
    import sys

    requirements = [
        ("pandas", "pandas"),
        ("matplotlib", "matplotlib"),
        ("PIL", "pillow"),
    ]
    missing_packages = [
        package_name
        for module_name, package_name in requirements
        if importlib.util.find_spec(module_name) is None
    ]
    if missing_packages:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", *missing_packages]
        )

    import pandas as pd
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    from PIL import Image
    from IPython.display import display

    mission_step0_execution = get_ipython().execution_count

    google_module_available = importlib.util.find_spec("google") is not None
    colab_available = (
        google_module_available
        and importlib.util.find_spec("google.colab") is not None
    )
    nanum_path = Path("/usr/share/fonts/truetype/nanum/NanumGothic.ttf")
    if colab_available and not nanum_path.is_file():
        subprocess.run(
            ["apt-get", "-qq", "install", "fonts-nanum"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    font_candidates = [
        nanum_path,
        Path("/System/Library/Fonts/AppleSDGothicNeo.ttc"),
        Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf"),
        Path("C:/Windows/Fonts/malgun.ttf"),
    ]
    korean_font_path = next(
        (candidate for candidate in font_candidates if candidate.is_file()),
        None,
    )
    if korean_font_path is not None:
        resolved_font_path = str(korean_font_path.resolve())
        registered_font_paths = {{
            str(Path(font_entry.fname).resolve())
            for font_entry in font_manager.fontManager.ttflist
        }}
        if resolved_font_path not in registered_font_paths:
            font_manager.fontManager.addfont(resolved_font_path)
        korean_font_name = font_manager.FontProperties(
            fname=resolved_font_path
        ).get_name()
    else:
        korean_font_name = "DejaVu Sans"
        print("한글 글꼴을 찾지 못했습니다. Colab에서 STEP 0을 다시 실행하세요.")

    plt.rcParams["font.family"] = korean_font_name
    plt.rcParams["axes.unicode_minus"] = False

    TEXT_LIBRARY = {library!r}
    TEXT_CHOICES = {{
        text_id: record["title"]
        for text_id, record in TEXT_LIBRARY.items()
    }}

    print("선택 가능한 수업 창작 텍스트")
    for text_id, title in TEXT_CHOICES.items():
        print("-", text_id, "→", title)
    print("준비 완료: 텍스트", len(TEXT_LIBRARY), "편")
    '''

    settings_code = '''
    # STEP 1 · EDIT — 학번·이름과 분석할 텍스트 ID를 수정합니다.
    mission_step1_execution = get_ipython().execution_count

    student_id = "학번"
    student_name = "이름"
    text_choice = "library_night"

    if text_choice not in TEXT_LIBRARY:
        raise KeyError(
            "text_choice는 library_night, rain_garden, morning_market 중 하나여야 합니다."
        )

    print("제출자:", student_id, student_name)
    print("선택한 텍스트:", text_choice, "·", TEXT_CHOICES[text_choice])
    '''

    preserve_code = '''
    # STEP 2 · 원문과 출처 정보를 별도 변수에 보존 — 이 셀은 수정하지 않습니다.
    mission_step2_execution = get_ipython().execution_count

    selected_record = TEXT_LIBRARY[text_choice]
    text_title = selected_record["title"]
    text_source = selected_record["source"]
    text_usage = selected_record["usage"]
    excluded_tokens = set(selected_record["excluded_tokens"])
    expected = selected_record["expected"]

    raw_text = selected_record["raw_text"]
    raw_snapshot = raw_text
    source_snapshot = {
        "title": text_title,
        "source": text_source,
        "usage": text_usage,
        "excluded_tokens": tuple(selected_record["excluded_tokens"]),
    }

    preliminary_sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?]+", raw_text)
        if sentence.strip()
    ]

    print("제목:", text_title)
    print("출처:", text_source)
    print("이용 조건:", text_usage)
    print("원문 글자 수:", len(raw_text))
    print("문장 수:", len(preliminary_sentences))
    print("지정 제외 토큰:", sorted(excluded_tokens))
    print("원문 미리보기:", raw_text[:90])
    '''

    analysis_code = '''
    # STEP 3 · 문장 분리, 정규화, 공백 기준 토큰화와 빈도 계산 — 수정하지 않습니다.
    mission_step3_execution = get_ipython().execution_count

    sentences = [
        sentence.strip()
        for sentence in re.split(r"[.!?]+", raw_text)
        if sentence.strip()
    ]
    normalized_text = re.sub(r"[^0-9A-Za-z가-힣\\s]", " ", raw_text)
    raw_tokens = normalized_text.split()
    tokens = [
        token
        for token in raw_tokens
        if token not in excluded_tokens
    ]

    token_counter = Counter(tokens)
    frequency_df = pd.DataFrame(
        token_counter.most_common(),
        columns=["word", "count"],
    )
    top10_df = frequency_df.head(10).copy()

    sentence_lengths = [
        len(re.sub(r"[^0-9A-Za-z가-힣\\s]", " ", sentence).split())
        for sentence in sentences
    ]
    sentence_df = pd.DataFrame(
        {
            "sentence_order": range(1, len(sentences) + 1),
            "token_count": sentence_lengths,
        }
    )

    top_word = str(top10_df.iloc[0]["word"])
    top_count = int(top10_df.iloc[0]["count"])
    maximum_sentence_length = max(sentence_lengths)
    minimum_sentence_length = min(sentence_lengths)
    longest_sentence_orders = [
        order
        for order, length in enumerate(sentence_lengths, start=1)
        if length == maximum_sentence_length
    ]
    shortest_sentence_orders = [
        order
        for order, length in enumerate(sentence_lengths, start=1)
        if length == minimum_sentence_length
    ]

    print("원문:", len(raw_tokens), "토큰 ·", len(set(raw_tokens)), "종")
    print("분석용:", len(tokens), "토큰 ·", len(set(tokens)), "종")
    print("상위 10개 토큰:")
    print(top10_df.to_string(index=False))
    print("문장별 토큰 수:", sentence_lengths)
    print("가장 긴 문장:", longest_sentence_orders, "·", maximum_sentence_length, "토큰")
    print("가장 짧은 문장:", shortest_sentence_orders, "·", minimum_sentence_length, "토큰")
    '''

    chart_code = '''
    # STEP 4 · 상위 단어 막대와 문장 길이 흐름 확인 — 이 셀은 수정하지 않습니다.
    mission_step4_execution = get_ipython().execution_count

    preview_figure, (bar_axis, line_axis) = plt.subplots(
        2,
        1,
        figsize=(8, 9),
        gridspec_kw={"height_ratios": [1.2, 1]},
    )
    preview_figure.patch.set_facecolor("#f4f0e7")

    bar_frame = top10_df.iloc[::-1].reset_index(drop=True)
    bar_axis.barh(
        bar_frame["word"],
        bar_frame["count"],
        color="#1e716d",
        height=0.66,
    )
    maximum_count = int(top10_df["count"].max())
    bar_axis.set_xlim(0, maximum_count + 0.8)
    bar_axis.set_xlabel("빈도 · 반복 횟수")
    bar_axis.set_title("상위 10개 토큰", loc="left", fontweight="bold")
    for row_index, count in enumerate(bar_frame["count"]):
        bar_axis.text(
            count + 0.08,
            row_index,
            str(int(count)),
            va="center",
            fontweight="bold",
        )

    line_axis.plot(
        sentence_df["sentence_order"],
        sentence_df["token_count"],
        color="#a44336",
        marker="o",
        linewidth=2.4,
        markersize=7,
    )
    line_axis.set_xticks(range(1, 13))
    line_axis.set_xlabel("문장 순서 · 시간 아님")
    line_axis.set_ylabel("공백 기준 토큰 수")
    line_axis.set_title("문장 순서에 따른 길이", loc="left", fontweight="bold")
    line_axis.grid(axis="y", alpha=0.25)
    for order, length in zip(
        sentence_df["sentence_order"],
        sentence_df["token_count"],
    ):
        line_axis.text(order, length + 0.12, str(length), ha="center", fontsize=9)

    for axis in (bar_axis, line_axis):
        axis.spines[["top", "right"]].set_visible(False)

    preview_figure.suptitle(text_title, fontsize=20, fontweight="bold")
    preview_figure.tight_layout()
    plt.show()
    plt.close(preview_figure)
    '''

    writing_code = '''
    # STEP 5 · EDIT — 수치 근거가 있는 질문·관찰·한계를 자신의 문장으로 씁니다.
    mission_step5_execution = get_ipython().execution_count

    poster_question = (
        "선택한 텍스트의 반복 단어와 문장 흐름은 어떤 특징을 보이는가?"
    )
    frequency_observation = (
        "상위 단어와 반복 횟수를 확인한 뒤 수치를 포함한 관찰 문장으로 바꾸세요."
    )
    rhythm_observation = (
        "가장 긴 문장 또는 가장 짧은 문장의 순서와 토큰 수를 포함해 바꾸세요."
    )
    limitation_statement = (
        "공백 기준 토큰화의 한계를 선택한 텍스트의 실제 토큰 예와 함께 바꾸세요."
    )

    print("관찰에 사용할 근거")
    print("- 최상위 토큰:", top_word, "·", top_count, "회")
    print("- 가장 긴 문장:", longest_sentence_orders, "·", maximum_sentence_length, "토큰")
    print("- 가장 짧은 문장:", shortest_sentence_orders, "·", minimum_sentence_length, "토큰")
    print("- 공백 기준에서 서로 다른 토큰 예를 원문 목록에서 직접 찾으세요.")
    '''

    save_code = '''
    # STEP 6 · 전체 빈도표 CSV와 1600×2200 포스터 저장 — 수정하지 않습니다.
    mission_step6_execution = get_ipython().execution_count

    safe_student_id = str(student_id).strip()
    safe_student_name = str(student_name).strip()
    notebook_filename = f"week12_{safe_student_id}_{safe_student_name}.ipynb"
    frequency_filename = (
        f"week12_{safe_student_id}_{safe_student_name}_word_frequency.csv"
    )
    poster_filename = (
        f"week12_{safe_student_id}_{safe_student_name}_text_poster.png"
    )

    frequency_df.to_csv(
        frequency_filename,
        index=False,
        encoding="utf-8-sig",
    )

    poster_figure = plt.figure(figsize=(8, 11), dpi=200)
    poster_figure.patch.set_facecolor("#f4f0e7")
    grid = poster_figure.add_gridspec(
        100,
        1,
        left=0.12,
        right=0.92,
        top=0.82,
        bottom=0.25,
    )
    poster_bar_axis = poster_figure.add_subplot(grid[:52, 0])
    poster_line_axis = poster_figure.add_subplot(grid[64:, 0])

    poster_bar_axis.barh(
        bar_frame["word"],
        bar_frame["count"],
        color="#1e716d",
        height=0.66,
    )
    poster_bar_axis.set_xlim(0, maximum_count + 0.8)
    poster_bar_axis.set_xlabel("빈도 · 반복 횟수")
    poster_bar_axis.set_title("01 · 상위 10개 토큰 빈도", loc="left", fontweight="bold")
    for row_index, count in enumerate(bar_frame["count"]):
        poster_bar_axis.text(
            count + 0.08,
            row_index,
            str(int(count)),
            va="center",
            fontweight="bold",
        )

    poster_line_axis.plot(
        sentence_df["sentence_order"],
        sentence_df["token_count"],
        color="#a44336",
        marker="o",
        linewidth=2.4,
        markersize=7,
    )
    poster_line_axis.set_xticks(range(1, 13))
    poster_line_axis.set_xlabel("문장 순서 · 시간 아님")
    poster_line_axis.set_ylabel("공백 기준 토큰 수")
    poster_line_axis.set_title("02 · 문장 순서에 따른 길이", loc="left", fontweight="bold")
    poster_line_axis.grid(axis="y", alpha=0.25)
    for order, length in zip(
        sentence_df["sentence_order"],
        sentence_df["token_count"],
    ):
        poster_line_axis.text(
            order,
            length + 0.12,
            str(length),
            ha="center",
            fontsize=8,
        )

    for axis in (poster_bar_axis, poster_line_axis):
        axis.set_facecolor("#fffdf8")
        axis.spines[["top", "right"]].set_visible(False)

    poster_figure.text(
        0.08,
        0.945,
        "TEXT PATTERN REPORT",
        fontsize=11,
        fontweight="bold",
        color="#1e716d",
    )
    poster_figure.text(
        0.08,
        0.905,
        text_title,
        fontsize=24,
        fontweight="bold",
        color="#202523",
    )
    poster_figure.text(
        0.08,
        0.855,
        fill(poster_question, width=45),
        fontsize=12,
        color="#414846",
    )

    information_text = (
        "OBSERVATION 01 · " + frequency_observation + "\\n\\n"
        "OBSERVATION 02 · " + rhythm_observation + "\\n\\n"
        "LIMIT · " + limitation_statement + "\\n\\n"
        "SOURCE · " + text_source + "\\n"
        "USAGE · " + text_usage + "\\n"
        "RULE · 문장부호를 공백으로 바꾸고 공백 기준으로 토큰화한 뒤 "
        + ", ".join(sorted(excluded_tokens))
        + "을 제외함"
    )
    poster_figure.text(
        0.08,
        0.205,
        fill(information_text, width=68, replace_whitespace=False),
        fontsize=8.8,
        linespacing=1.35,
        va="top",
        color="#303634",
    )
    poster_figure.text(
        0.92,
        0.045,
        safe_student_id + " · " + safe_student_name,
        ha="right",
        fontsize=8,
        color="#59615e",
    )

    poster_figure.savefig(
        poster_filename,
        dpi=200,
        facecolor=poster_figure.get_facecolor(),
    )
    plt.close(poster_figure)

    saved_poster_size = Image.open(poster_filename).size
    print("예상 노트북 이름:", notebook_filename)
    print("전체 빈도표 저장:", frequency_filename, "·", len(frequency_df), "행")
    print("포스터 저장:", poster_filename, "·", saved_poster_size)
    display(Image.open(poster_filename))
    '''

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
        mission_step6_execution,
        mission_final_execution,
    ) == (1, 2, 3, 4, 5, 6, 7, 8)

    identity_ok = (
        safe_student_id not in {"", "학번", "20260000"}
        and safe_student_name not in {"", "이름", "홍길동"}
        and re.fullmatch(r"[0-9A-Za-z가-힣_-]+", safe_student_id) is not None
        and re.fullmatch(r"[0-9A-Za-z가-힣_-]+", safe_student_name) is not None
    )
    selection_ok = text_choice in TEXT_LIBRARY and len(TEXT_LIBRARY) == 3
    source_ok = (
        text_title == selected_record["title"]
        and text_source == selected_record["source"]
        and text_usage == selected_record["usage"]
        and "교수자 창작 자료" in text_source
        and "수업 목적" in text_usage
    )
    raw_preserved_ok = (
        raw_text == raw_snapshot == selected_record["raw_text"]
        and source_snapshot["title"] == text_title
        and source_snapshot["source"] == text_source
        and source_snapshot["usage"] == text_usage
        and source_snapshot["excluded_tokens"]
        == tuple(selected_record["excluded_tokens"])
    )
    sentence_ok = (
        len(sentences) == expected["sentence_count"] == 12
        and sentence_lengths == expected["sentence_lengths"]
        and sentence_df["sentence_order"].tolist() == list(range(1, 13))
        and sentence_df["token_count"].tolist() == sentence_lengths
    )
    token_ok = (
        len(raw_tokens) == expected["raw_token_count"]
        and len(set(raw_tokens)) == expected["raw_type_count"]
        and len(tokens) == expected["analysis_token_count"]
        and len(set(tokens)) == expected["analysis_type_count"]
        and set(excluded_tokens) == set(selected_record["excluded_tokens"])
        and not set(tokens).intersection(excluded_tokens)
    )
    frequency_ok = (
        list(frequency_df.columns) == ["word", "count"]
        and len(frequency_df) == len(set(tokens))
        and int(frequency_df["count"].sum()) == len(tokens)
        and [tuple(item) for item in top10_df.values.tolist()]
        == [tuple(item) for item in expected["top10"]]
        and top10_df["count"].is_monotonic_decreasing
    )
    chart_ok = (
        len(top10_df) == 10
        and len(bar_frame) == 10
        and len(sentence_df) == 12
        and int(bar_frame.iloc[-1]["count"]) == top_count
        and sentence_df["token_count"].min() == minimum_sentence_length
        and sentence_df["token_count"].max() == maximum_sentence_length
    )

    default_question = "선택한 텍스트의 반복 단어와 문장 흐름은 어떤 특징을 보이는가?"
    default_frequency = "상위 단어와 반복 횟수를 확인한 뒤 수치를 포함한 관찰 문장으로 바꾸세요."
    default_rhythm = "가장 긴 문장 또는 가장 짧은 문장의 순서와 토큰 수를 포함해 바꾸세요."
    default_limit = "공백 기준 토큰화의 한계를 선택한 텍스트의 실제 토큰 예와 함께 바꾸세요."
    question_ok = (
        poster_question != default_question
        and len(poster_question.strip()) >= 20
        and ("?" in poster_question or "？" in poster_question)
    )
    frequency_observation_ok = (
        frequency_observation != default_frequency
        and len(frequency_observation.strip()) >= 30
        and top_word in frequency_observation
        and str(top_count) in frequency_observation
    )
    rhythm_observation_ok = (
        rhythm_observation != default_rhythm
        and len(rhythm_observation.strip()) >= 30
        and str(maximum_sentence_length) in rhythm_observation
        and any(str(order) in rhythm_observation for order in longest_sentence_orders)
    )
    limitation_ok = (
        limitation_statement != default_limit
        and len(limitation_statement.strip()) >= 30
        and ("공백" in limitation_statement or "형태소" in limitation_statement)
    )

    expected_notebook_filename = (
        f"week12_{safe_student_id}_{safe_student_name}.ipynb"
    )
    expected_frequency_filename = (
        f"week12_{safe_student_id}_{safe_student_name}_word_frequency.csv"
    )
    expected_poster_filename = (
        f"week12_{safe_student_id}_{safe_student_name}_text_poster.png"
    )
    filenames_ok = (
        notebook_filename == expected_notebook_filename
        and frequency_filename == expected_frequency_filename
        and poster_filename == expected_poster_filename
        and Path(frequency_filename).is_file()
        and Path(poster_filename).is_file()
    )

    saved_frequency_df = pd.read_csv(frequency_filename)
    saved_outputs_ok = (
        list(saved_frequency_df.columns) == ["word", "count"]
        and saved_frequency_df.equals(frequency_df)
        and int(saved_frequency_df["count"].sum()) == len(tokens)
        and Image.open(poster_filename).size == (1600, 2200)
        and Path(frequency_filename).stat().st_size > 0
        and Path(poster_filename).stat().st_size > 0
    )

    checks = {
        "새 런타임에서 STEP 0부터 여덟 코드 셀 순서대로 실행": execution_order_ok,
        "학번·이름과 안전한 파일명": identity_ok,
        "수업 창작 텍스트 세 편 중 한 편 선택": selection_ok,
        "제목·출처·이용 조건 기록": source_ok,
        "raw_text와 지정 제외 목록 보존": raw_preserved_ok,
        "열두 문장과 문장별 토큰 수": sentence_ok,
        "제외 전후 전체 토큰 수와 고유 토큰 수": token_ok,
        "word·count 전체 빈도표와 상위 열 개": frequency_ok,
        "막대 열 개와 문장 점 열두 개": chart_ok,
        "물음표가 있는 20자 이상의 분석 질문": question_ok,
        "최상위 토큰과 횟수가 있는 30자 이상의 빈도 관찰": frequency_observation_ok,
        "문장 순서와 토큰 수가 있는 30자 이상의 흐름 관찰": rhythm_observation_ok,
        "공백 기준 토큰화의 30자 이상 한계": limitation_ok,
        "규칙에 맞는 노트북·CSV·PNG 파일명": filenames_ok,
        "현재 분석과 일치하는 전체 CSV와 1600×2200 PNG": saved_outputs_ok,
    }

    failed_checks = [label for label, passed in checks.items() if not passed]

    print("=" * 68)
    print("WEEK 12 FINAL CHECK")
    print("=" * 68)
    for label, passed in checks.items():
        print("✅" if passed else "❌", label)

    if failed_checks:
        print("\\n아직 통과하지 못한 조건:")
        for label in failed_checks:
            print("-", label)
        raise AssertionError(
            "표시된 조건을 수정한 뒤 런타임을 다시 시작하고 모두 실행하세요."
        )

    print("\\n제출 노트북:", notebook_filename)
    print("제출 빈도표:", frequency_filename)
    print("제출 포스터:", poster_filename)
    print("🎉 WEEK 12 TEXT PATTERN MISSION COMPLETE")
    '''

    download_code = '''
    # DOWNLOAD · FINAL CHECK가 PASS인 뒤 CSV와 PNG를 내려받습니다.
    if colab_available:
        from google.colab import files

        files.download(frequency_filename)
        files.download(poster_filename)
    else:
        print("저장 위치:", Path(frequency_filename).resolve())
        print("저장 위치:", Path(poster_filename).resolve())

    print("노트북은 파일 → 다운로드 → .ipynb 다운로드로 받습니다.")
    '''

    return {
        "cells": [
            markdown_cell(
                '''
                # Week 12 · 텍스트 패턴 포스터 미션

                수업용 창작 텍스트 세 편 중 한 편을 선택하고, 원문을 보존한 채 전체 단어 빈도표와 문장 길이 흐름을 계산하여 1600×2200 포스터로 완성합니다.

                **완료 조건:** 마지막 셀의 `🎉 WEEK 12 TEXT PATTERN MISSION COMPLETE` 확인 + 실행 결과가 남은 노트북·전체 빈도표 CSV·포스터 PNG 세 파일 제출.

                `EDIT`라고 적힌 STEP 1과 STEP 5만 수정합니다. 다른 코드 셀을 고치면 고정된 분석 조건과 자동 검사가 달라질 수 있습니다.
                '''
            ),
            markdown_cell(
                '''
                ## STEP 0 · 환경과 수업용 텍스트 준비

                분석과 시각화에 필요한 도구, 한글 글꼴, 저작권과 개인정보 문제가 없는 수업 창작 텍스트 세 편을 준비합니다. 이 셀은 수정하지 않습니다.
                '''
            ),
            code_cell(setup_code),
            markdown_cell(
                '''
                ## STEP 1 · 제출 정보와 텍스트 선택

                학번과 이름을 입력하고 `library_night`, `rain_garden`, `morning_market` 중 하나를 `text_choice`에 적습니다. 따옴표는 남겨 둡니다.
                '''
            ),
            code_cell(settings_code),
            markdown_cell(
                '''
                ## STEP 2 · 원문과 출처 보존

                선택한 원문을 `raw_text`에 그대로 보존하고 제목, 출처, 이용 조건, 지정 제외 토큰을 별도 변수로 기록합니다. 이 셀은 수정하지 않습니다.
                '''
            ),
            code_cell(preserve_code),
            markdown_cell(
                '''
                ## STEP 3 · 텍스트를 세고 표로 바꾸기

                문장부호를 공백으로 바꾼 뒤 공백 기준으로 토큰화합니다. 지정 토큰을 제외하기 전후의 전체 토큰 수와 고유 토큰 수를 비교하고, 모든 분석 토큰의 빈도표와 열두 문장의 길이표를 만듭니다.
                '''
            ),
            code_cell(analysis_code),
            markdown_cell(
                '''
                ## STEP 4 · 두 그래프의 수치 확인

                상위 열 개 토큰의 가로 막대그래프와 열두 문장의 순서별 토큰 수 그래프를 확인합니다. 가로축의 문장 순서는 시간이 아닙니다. 이 셀은 수정하지 않습니다.
                '''
            ),
            code_cell(chart_code),
            markdown_cell(
                '''
                ## STEP 5 · 질문, 관찰 두 문장과 한계 작성

                네 문자열을 모두 자신의 문장으로 바꿉니다. 빈도 관찰에는 최상위 토큰과 실제 횟수를, 흐름 관찰에는 가장 긴 문장의 순서와 토큰 수를 포함합니다. 한계에는 공백 기준 토큰화가 한국어를 충분히 나누지 못하는 이유나 실제 토큰 예를 적습니다.
                '''
            ),
            code_cell(writing_code),
            markdown_cell(
                '''
                ## STEP 6 · CSV와 포스터 저장

                전체 빈도표를 `word`, `count` 두 열의 CSV로 저장하고, 그래프 두 개와 질문·관찰·한계·출처·분석 규칙을 1600×2200 PNG에 배치합니다. 이 셀은 수정하지 않습니다.
                '''
            ),
            code_cell(save_code),
            markdown_cell(
                '''
                ## FINAL CHECK · 새 런타임 전체 실행

                수정이 끝나면 **런타임 → 세션 다시 시작**, 이어서 **런타임 → 모두 실행**을 한 번 선택합니다. 마지막 셀은 원문 보존, 수량, 그래프 데이터, 자신의 문장, 저장 파일을 함께 검사합니다. 검사 코드는 수정하지 않습니다.
                '''
            ),
            code_cell(final_check_code),
            markdown_cell(
                '''
                ## DOWNLOAD · PASS 뒤 결과 파일 받기

                FINAL CHECK가 모두 초록색인지 먼저 확인합니다. 아래 셀은 CSV와 PNG를 내려받습니다. 노트북은 Colab 상단의 **파일 → 다운로드 → .ipynb 다운로드**로 별도 저장합니다.
                '''
            ),
            code_cell(download_code),
        ],
        "metadata": {
            "colab": {
                "name": "week-12-text-pattern-mission.ipynb",
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


def validate_notebook(notebook: dict[str, object]) -> None:
    """Fail generation if a required mission contract is missing."""

    cells = notebook["cells"]
    assert isinstance(cells, list)
    code_cells = [cell for cell in cells if cell["cell_type"] == "code"]
    notebook_text = "\n".join(
        "".join(cell["source"])
        for cell in cells
    )

    assert notebook["nbformat"] == 4
    assert len(code_cells) == 9
    assert len(TEXT_LIBRARY) == 3
    assert all(
        analyze_text(record["raw_text"], record["excluded_tokens"])["sentence_count"]
        == 12
        for record in TEXT_LIBRARY.values()
    )
    for required in (
        "raw_text",
        "normalized_text",
        "Counter(tokens)",
        'columns=["word", "count"]',
        "top10_df",
        "sentence_lengths",
        "figsize=(8, 11)",
        "dpi=200",
        "saved_poster_size",
        "(1600, 2200)",
        "WEEK 12 TEXT PATTERN MISSION COMPLETE",
    ):
        assert required in notebook_text


def main() -> None:
    notebook = build_notebook()
    validate_notebook(notebook)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    NOTEBOOK_PATH.write_text(
        json.dumps(notebook, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Generated", NOTEBOOK_PATH.relative_to(ROOT))


if __name__ == "__main__":
    main()
