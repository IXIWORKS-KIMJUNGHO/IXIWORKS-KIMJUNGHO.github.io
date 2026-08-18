#!/usr/bin/env python3
"""Generate the Week 13 goal-based sound-poster mission notebook and seed example."""

from __future__ import annotations

import base64
from hashlib import sha256
from html import escape
import json
from pathlib import Path
from textwrap import dedent
import zlib


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"
NOTEBOOK_PATH = ASSET_DIR / "week-13-sound-poster-mission.ipynb"
SEED_EXAMPLE_PATH = ASSET_DIR / "week-13-project-seed-example.html"

AUDIO_LIBRARY = {
    "regular_pulses": {
        "title": "규칙적인 펄스",
        "filename": "week-13-regular-pulses.wav",
        "source": "Contents Programming Practice Week 13 · 교수자 창작 음원",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "generation": "약 440Hz의 짧은 펄스 여섯 개를 6초 안에 배치한 합성음",
        "expected": {
            "peak_sample_index": 111_340,
            "peak_time_sec": 5.049433106575964,
            "peak_amplitude": -0.949981689453125,
            "rms_peak_index": 217,
            "rms_peak_time_sec": 5.038730158730159,
            "rms_peak_value": 0.6166670322418213,
            "dominant_bin": 41,
            "dominant_frequency_hz": 441.4306640625,
        },
    },
    "rising_tone": {
        "title": "상승하는 음",
        "filename": "week-13-rising-tone.wav",
        "source": "Contents Programming Practice Week 13 · 교수자 창작 음원",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "generation": "약 180Hz에서 1,200Hz 방향으로 올라가는 6초 길이의 합성음",
        "expected": {
            "peak_sample_index": 2_966,
            "peak_time_sec": 0.13451247165532879,
            "peak_amplitude": -0.949981689453125,
            "rms_peak_index": 18,
            "rms_peak_time_sec": 0.4179591836734694,
            "rms_peak_value": 0.6738117337226868,
            "dominant_bin": 109,
            "dominant_frequency_hz": 1173.5595703125,
        },
    },
    "alternating_bands": {
        "title": "저음·고음이 교차하는 리듬",
        "filename": "week-13-alternating-bands.wav",
        "source": "Contents Programming Practice Week 13 · 교수자 창작 음원",
        "usage": "수업 목적의 분석·시각화·제출 허용",
        "generation": "약 220Hz와 880Hz의 구간이 번갈아 나타나는 6초 길이의 합성음",
        "expected": {
            "peak_sample_index": 877,
            "peak_time_sec": 0.03977324263038549,
            "peak_amplitude": -0.949981689453125,
            "rms_peak_index": 233,
            "rms_peak_time_sec": 5.410249433106576,
            "rms_peak_value": 0.6727915406227112,
            "dominant_bin": 82,
            "dominant_frequency_hz": 882.861328125,
        },
    },
}


def source_lines(text: str) -> list[str]:
    """Convert readable multiline text to Jupyter source lines."""

    normalized = dedent(text).strip("\n") + "\n"
    return normalized.splitlines(keepends=True)


def markdown_cell(text: str) -> dict[str, object]:
    return {"cell_type": "markdown", "metadata": {}, "source": source_lines(text)}


def code_cell(text: str) -> dict[str, object]:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source_lines(text),
    }


def embedded_audio_library() -> dict[str, dict[str, object]]:
    """Return metadata and compressed bytes for the three exact class WAV files."""

    library: dict[str, dict[str, object]] = {}
    for audio_id, record in AUDIO_LIBRARY.items():
        source_path = ASSET_DIR / str(record["filename"])
        if not source_path.is_file():
            raise FileNotFoundError(
                f"Missing {source_path.name}. Run generate-week13-sound-assets.py first."
            )
        raw_bytes = source_path.read_bytes()
        library[audio_id] = {
            **record,
            "sha256": sha256(raw_bytes).hexdigest(),
            "compressed_wav_base64": base64.b64encode(
                zlib.compress(raw_bytes, level=9)
            ).decode("ascii"),
            "expected": {
                **dict(record["expected"]),
                "sample_rate": 22_050,
                "sample_count": 132_300,
                "duration_sec": 6.0,
                "channels": 1,
                "sample_width_bits": 16,
                "rms_frame_count": 259,
                "stft_shape": (1_025, 259),
                "db_min": -80.0,
                "db_max": 0.0,
            },
        }
    return library


def build_notebook() -> dict[str, object]:
    """Build a complete, self-checking notebook with two explicit edit cells."""

    library = embedded_audio_library()

    setup_code = fr'''
    # STEP 0 · 실행 환경과 수업용 WAV 세 편 준비 — 이 셀은 수정하지 않습니다.
    from hashlib import sha256
    from html import escape
    from importlib.metadata import PackageNotFoundError, version as package_version
    from pathlib import Path
    from textwrap import fill
    import base64
    import importlib.util
    import subprocess
    import sys
    import zlib

    requirements = [
        ("numpy", "numpy"),
        ("pandas", "pandas"),
        ("matplotlib", "matplotlib"),
        ("PIL", "pillow"),
    ]
    install_requests = [
        package_name
        for module_name, package_name in requirements
        if importlib.util.find_spec(module_name) is None
    ]
    pinned_packages = {{
        "librosa": "0.11.0",
        "soundfile": "0.13.1",
    }}
    for package_name, required_version in pinned_packages.items():
        try:
            installed_version = package_version(package_name)
        except PackageNotFoundError:
            installed_version = None
        if installed_version != required_version:
            install_requests.append(f"{{package_name}}=={{required_version}}")

    if install_requests:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", *install_requests]
        )

    import librosa
    import librosa.display
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    import numpy as np
    import pandas as pd
    from PIL import Image
    import soundfile as sf
    from IPython.display import Audio, display

    mission_step0_execution = get_ipython().execution_count

    colab_available = importlib.util.find_spec("google.colab") is not None
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
        font_manager.fontManager.addfont(resolved_font_path)
        korean_font_name = font_manager.FontProperties(
            fname=resolved_font_path
        ).get_name()
    else:
        korean_font_name = "DejaVu Sans"
        print("한글 글꼴을 찾지 못했습니다. Colab에서 STEP 0을 다시 실행하세요.")

    plt.rcParams["font.family"] = korean_font_name
    plt.rcParams["axes.unicode_minus"] = False

    AUDIO_LIBRARY = {library!r}
    AUDIO_CHOICES = {{
        audio_id: record["title"]
        for audio_id, record in AUDIO_LIBRARY.items()
    }}

    for audio_id, record in AUDIO_LIBRARY.items():
        wav_bytes = zlib.decompress(
            base64.b64decode(record["compressed_wav_base64"])
        )
        wav_path = Path(record["filename"])
        wav_path.write_bytes(wav_bytes)
        if sha256(wav_bytes).hexdigest() != record["sha256"]:
            raise RuntimeError(f"{{wav_path.name}} 복원 중 원본 검증에 실패했습니다.")

    print("선택 가능한 수업 창작 음원")
    for audio_id, title in AUDIO_CHOICES.items():
        print("-", audio_id, "→", title)
    print("준비 완료: 6초 WAV", len(AUDIO_LIBRARY), "편")
    '''

    settings_code = r'''
    # STEP 1 · EDIT — 학번·이름과 분석할 음원 ID를 수정합니다.
    mission_step1_execution = get_ipython().execution_count

    student_id = "20260000"
    student_name = "김학생"
    audio_choice = "regular_pulses"

    if audio_choice not in AUDIO_LIBRARY:
        raise KeyError(
            "audio_choice는 regular_pulses, rising_tone, alternating_bands 중 하나여야 합니다."
        )

    print("제출자:", student_id, student_name)
    print("선택한 음원:", audio_choice, "·", AUDIO_CHOICES[audio_choice])
    '''

    preserve_code = r'''
    # STEP 2 · 원본 보존, 출처 기록, 재생과 입력 검증 — 이 셀은 수정하지 않습니다.
    mission_step2_execution = get_ipython().execution_count

    selected_record = AUDIO_LIBRARY[audio_choice]
    audio_title = selected_record["title"]
    audio_source = selected_record["source"]
    audio_usage = selected_record["usage"]
    audio_generation = selected_record["generation"]
    expected = selected_record["expected"]
    source_path = Path(selected_record["filename"])

    original_bytes = source_path.read_bytes()
    original_sha256 = sha256(original_bytes).hexdigest()
    original_snapshot = bytes(original_bytes)
    source_snapshot = {
        "title": audio_title,
        "source": audio_source,
        "usage": audio_usage,
        "generation": audio_generation,
        "sha256": selected_record["sha256"],
    }

    audio_info = sf.info(source_path)
    y, sr = librosa.load(source_path, sr=None, mono=True)
    y_snapshot = y.copy()
    sr_snapshot = int(sr)
    duration_sec = len(y) / sr

    display(Audio(y, rate=sr))
    print("제목:", audio_title)
    print("출처:", audio_source)
    print("이용 조건:", audio_usage)
    print("생성 방식:", audio_generation)
    print("샘플링 레이트:", f"{sr:,} Hz")
    print("채널:", audio_info.channels)
    print("샘플 수:", f"{len(y):,}")
    print("재생 시간:", f"{duration_sec:.3f}초")
    print("배열 모양·자료형:", y.shape, y.dtype)

    assert sr == 22_050
    assert audio_info.channels == 1
    assert len(y) == 132_300
    assert np.isclose(duration_sec, 6.0)
    '''

    waveform_code = r'''
    # STEP 3 · 파형과 최대 절대 진폭 시점 — 이 셀은 수정하지 않습니다.
    mission_step3_execution = get_ipython().execution_count

    sample_times = np.arange(len(y), dtype=float) / sr
    peak_sample_index = int(np.argmax(np.abs(y)))
    peak_time_sec = float(peak_sample_index / sr)
    peak_amplitude = float(y[peak_sample_index])

    fig_wave, ax_wave = plt.subplots(figsize=(11, 3.2), dpi=120)
    ax_wave.plot(sample_times, y, color="#1f5f67", linewidth=0.8)
    ax_wave.axvline(peak_time_sec, color="#d65a3a", linewidth=1.4)
    ax_wave.scatter(
        [peak_time_sec], [peak_amplitude], color="#d65a3a", s=34, zorder=3
    )
    ax_wave.set(xlim=(0, 6), ylim=(-1, 1), xlabel="시간 (초)", ylabel="정규화 진폭")
    ax_wave.set_title(f"{audio_title} · 전체 파형")
    ax_wave.grid(alpha=0.18)
    plt.tight_layout()
    plt.show()

    print("최대 절대 진폭 샘플:", f"{peak_sample_index:,}")
    print("최대 절대 진폭 시점:", f"{peak_time_sec:.3f}초")
    print("그 시점의 진폭:", f"{peak_amplitude:.6f}")
    '''

    rms_code = r'''
    # STEP 4 · 프레임 RMS 곡선과 가장 큰 프레임 — 이 셀은 수정하지 않습니다.
    mission_step4_execution = get_ipython().execution_count

    frame_length = 2_048
    hop_length = 512
    rms_values = librosa.feature.rms(
        y=y,
        frame_length=frame_length,
        hop_length=hop_length,
        center=True,
    )[0]
    rms_times = librosa.times_like(rms_values, sr=sr, hop_length=hop_length)
    rms_df = pd.DataFrame({"time_sec": rms_times, "rms": rms_values})
    rms_peak_index = int(np.argmax(rms_values))
    rms_peak_time_sec = float(rms_times[rms_peak_index])
    rms_peak_value = float(rms_values[rms_peak_index])

    display(rms_df.head())
    print("RMS 프레임 수:", len(rms_df))
    print("최대 RMS 프레임:", rms_peak_index)
    print("최대 RMS 시점:", f"{rms_peak_time_sec:.3f}초")
    print("최대 RMS 값:", f"{rms_peak_value:.6f}")

    fig_rms, ax_rms = plt.subplots(figsize=(11, 3.2), dpi=120)
    ax_rms.plot(rms_times, rms_values, color="#7352a3", linewidth=2)
    ax_rms.scatter(
        [rms_peak_time_sec], [rms_peak_value], color="#d65a3a", s=38, zorder=3
    )
    ax_rms.set(xlim=(0, 6), ylim=(0, 0.75), xlabel="시간 (초)", ylabel="RMS")
    ax_rms.set_title("2,048샘플 프레임 · 512샘플 이동 간격")
    ax_rms.grid(alpha=0.18)
    plt.tight_layout()
    plt.show()
    '''

    spectrogram_code = r'''
    # STEP 5 · STFT와 -80~0dB 상대 스펙트로그램 — 이 셀은 수정하지 않습니다.
    mission_step5_execution = get_ipython().execution_count

    stft_matrix = librosa.stft(
        y,
        n_fft=frame_length,
        hop_length=hop_length,
        win_length=frame_length,
        window="hann",
        center=True,
    )
    magnitude = np.abs(stft_matrix)
    spectrogram_db = librosa.amplitude_to_db(magnitude, ref=np.max, top_db=80)
    frequencies = librosa.fft_frequencies(sr=sr, n_fft=frame_length)
    mean_magnitude_by_frequency = magnitude.mean(axis=1)
    dominant_bin = int(np.argmax(mean_magnitude_by_frequency))
    dominant_frequency_hz = float(frequencies[dominant_bin])

    fig_spec, ax_spec = plt.subplots(figsize=(11, 4.2), dpi=120)
    spec_image = librosa.display.specshow(
        spectrogram_db,
        sr=sr,
        hop_length=hop_length,
        x_axis="time",
        y_axis="hz",
        cmap="magma",
        vmin=-80,
        vmax=0,
        ax=ax_spec,
    )
    ax_spec.set(xlim=(0, 6), ylim=(0, 4_000), xlabel="시간 (초)", ylabel="주파수 (Hz)")
    ax_spec.set_title("STFT 상대 스펙트로그램 · 파일 내부 최댓값 = 0dB")
    colorbar = fig_spec.colorbar(spec_image, ax=ax_spec, format="%+2.0f dB")
    colorbar.set_label("상대 진폭 (dB)")
    plt.tight_layout()
    plt.show()

    print("STFT 행렬 모양:", stft_matrix.shape)
    print("상대 dB 범위:", f"{spectrogram_db.min():.1f} ~ {spectrogram_db.max():.1f} dB")
    print("전체 평균 진폭이 가장 큰 주파수 빈:", f"약 {dominant_frequency_hz:.0f} Hz")
    '''

    writing_code = r'''
    # STEP 6 · EDIT — 포스터 해석과 기말 프로젝트 씨앗 카드 내용을 수정합니다.
    mission_step6_execution = get_ipython().execution_count

    poster_question = "선택한 소리는 6초 동안 시간·에너지·주파수 구조가 어떻게 달라지는가?"
    waveform_observation = "파형의 최대 절대 진폭은 0.000초에 나타나며 한 샘플의 가장 큰 봉우리를 보여 준다."
    rms_observation = "프레임 RMS는 0.000초에서 가장 크며 짧은 구간의 상대적인 에너지 변화를 보여 준다."
    frequency_observation = "전체 평균 진폭이 가장 큰 주파수 빈은 약 000Hz이며 밝은 띠의 위치와 함께 읽을 수 있다."
    limitation_statement = "이 상대 시각화만으로 소리의 정체나 감정, 실제 음압의 크기까지 단정할 수 없다."

    project_medium = "sound"
    project_question = "일상에서 반복되는 소리의 시간 패턴은 장소에 따라 어떻게 달라지는가?"
    project_input = "직접 생성하거나 동의를 받아 녹음한 6초 WAV 세 편"
    project_rights = "직접 제작한 자료만 사용하고 녹음에 사람이 포함되면 제출 동의를 먼저 확인한다."
    project_rule = "모든 소리를 같은 길이와 프레임 규칙으로 분석해 파형·RMS·스펙트로그램을 비교한다."
    project_output = "세 소리의 차이를 보여 주는 세로형 비교 포스터 PNG"
    week14_first_action = "WAV 한 편을 Colab에 불러와 0~6초 파형이 화면에 나타나는 첫 프로토타입을 만든다."

    print("[포스터 문장]")
    print("질문:", poster_question)
    print("파형:", waveform_observation)
    print("RMS:", rms_observation)
    print("주파수:", frequency_observation)
    print("한계:", limitation_statement)
    print("\n[기말 프로젝트 씨앗]")
    print("매체:", project_medium)
    print("질문:", project_question)
    print("입력:", project_input)
    print("권한:", project_rights)
    print("규칙:", project_rule)
    print("출력:", project_output)
    print("14주차 첫 행동:", week14_first_action)
    '''

    save_code = r'''
    # STEP 7 · 포스터 PNG와 프로젝트 씨앗 카드 HTML 저장 — 이 셀은 수정하지 않습니다.
    mission_step7_execution = get_ipython().execution_count

    def safe_filename_part(value):
        cleaned = "".join(
            character
            for character in str(value).strip()
            if character.isalnum() or character in "-_"
        )
        if not cleaned:
            raise ValueError("학번과 이름에는 파일명에 사용할 수 있는 문자가 필요합니다.")
        return cleaned

    safe_student_id = safe_filename_part(student_id)
    safe_student_name = safe_filename_part(student_name)
    poster_filename = f"week13_{safe_student_id}_{safe_student_name}_sound_poster.png"
    seed_filename = f"week13_{safe_student_id}_{safe_student_name}_project_seed.html"

    poster_figure = plt.figure(figsize=(8, 11), dpi=200, facecolor="#f3efe3")
    poster_figure.text(0.08, 0.955, "사운드 패턴 · 13주차", color="#a44230", fontsize=10, weight="bold")
    poster_figure.text(0.08, 0.915, fill(poster_question, width=29), color="#172321", fontsize=20, weight="bold", va="top")
    poster_figure.text(0.08, 0.852, f"{audio_title}  ·  {duration_sec:.1f}초  ·  {sr:,}Hz  ·  모노", color="#1f5f67", fontsize=9, weight="bold")

    poster_wave = poster_figure.add_axes([0.09, 0.665, 0.82, 0.16], facecolor="#fbfaf5")
    poster_wave.plot(sample_times, y, color="#1f5f67", linewidth=0.65)
    poster_wave.axvline(peak_time_sec, color="#d65a3a", linewidth=1.2)
    poster_wave.scatter([peak_time_sec], [peak_amplitude], color="#d65a3a", s=18, zorder=3)
    poster_wave.set(xlim=(0, 6), ylim=(-1, 1), xlabel="시간 (초)", ylabel="정규화 진폭")
    poster_wave.set_title("01 / 파형 · 한 샘플씩 기록한 진폭", loc="left", fontsize=10, weight="bold")
    poster_wave.grid(alpha=0.16)

    poster_rms = poster_figure.add_axes([0.09, 0.495, 0.82, 0.115], facecolor="#fbfaf5")
    poster_rms.plot(rms_times, rms_values, color="#7352a3", linewidth=1.7)
    poster_rms.scatter([rms_peak_time_sec], [rms_peak_value], color="#d65a3a", s=20, zorder=3)
    poster_rms.set(xlim=(0, 6), ylim=(0, 0.75), xlabel="시간 (초)", ylabel="RMS")
    poster_rms.set_title("02 / 프레임 RMS · 2,048샘플 / 512샘플 이동", loc="left", fontsize=10, weight="bold")
    poster_rms.grid(alpha=0.16)

    poster_spec = poster_figure.add_axes([0.09, 0.295, 0.72, 0.145], facecolor="#fbfaf5")
    poster_spec_image = librosa.display.specshow(
        spectrogram_db,
        sr=sr,
        hop_length=hop_length,
        x_axis="time",
        y_axis="hz",
        cmap="magma",
        vmin=-80,
        vmax=0,
        ax=poster_spec,
    )
    poster_spec.set(xlim=(0, 6), ylim=(0, 4_000), xlabel="시간 (초)", ylabel="주파수 (Hz)")
    poster_spec.set_title("03 / STFT 상대 스펙트로그램 · 최댓값 = 0dB", loc="left", fontsize=10, weight="bold")
    poster_colorbar_axis = poster_figure.add_axes([0.83, 0.295, 0.025, 0.145])
    poster_colorbar = poster_figure.colorbar(poster_spec_image, cax=poster_colorbar_axis, format="%+2.0f")
    poster_colorbar.set_label("상대 dB", fontsize=8)

    observation_text = (
        "수치 근거\n"
        f"파형  {fill(waveform_observation, width=52)}\n"
        f"RMS   {fill(rms_observation, width=52)}\n"
        f"주파수  {fill(frequency_observation, width=52)}"
    )
    poster_figure.text(0.09, 0.258, observation_text, va="top", fontsize=8.1, linespacing=1.45, color="#172321")
    poster_figure.text(0.09, 0.105, "해석의 한계", fontsize=8.5, weight="bold", color="#a44230")
    poster_figure.text(0.09, 0.088, fill(limitation_statement, width=69), va="top", fontsize=7.8, color="#172321")
    footer_text = (
        f"출처 · {audio_source} / {audio_usage}\n"
        f"생성 · {audio_generation}\n"
        "분석 · sr=None, mono=True / frame=2,048 / hop=512 / STFT 상대 -80~0dB"
    )
    poster_figure.text(0.09, 0.047, footer_text, va="top", fontsize=6.8, color="#4c5956", linespacing=1.35)
    poster_figure.savefig(poster_filename, dpi=200, facecolor=poster_figure.get_facecolor())
    plt.close(poster_figure)

    escaped = {
        "student_id": escape(str(student_id)),
        "student_name": escape(str(student_name)),
        "medium": escape(project_medium),
        "question": escape(project_question),
        "input": escape(project_input),
        "rights": escape(project_rights),
        "rule": escape(project_rule),
        "output": escape(project_output),
        "action": escape(week14_first_action),
    }
    seed_html = f"""<!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>13주차 기말 프로젝트 씨앗 카드 · {escaped["student_name"]}</title>
      <style>
        :root {{ color-scheme:light; --ink:#172321; --paper:#f3efe3; --panel:#fbfaf5; --teal:#1f5f67; --orange:#a44230; --line:#a9afab; --soft:#e4ebe6; }}
        * {{ box-sizing:border-box; }}
        body {{ margin:0; padding:clamp(14px,4vw,42px); color:var(--ink); background:var(--paper); font-family:"Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif; }}
        .skip-link {{ position:absolute; left:12px; top:-80px; padding:10px 14px; color:white; background:var(--ink); z-index:10; }}
        .skip-link:focus {{ top:12px; }}
        .project-brief {{ max-width:1040px; margin:auto; border:2px solid var(--ink); background:var(--panel); padding:clamp(24px,5vw,54px); }}
        .kicker,.section-label {{ margin:0; color:var(--orange); font-size:.76rem; font-weight:800; letter-spacing:.08em; }}
        h1 {{ max-width:900px; margin:.6rem 0 1.6rem; font-size:clamp(2.25rem,7vw,5.3rem); letter-spacing:-.055em; line-height:1.02; word-break:keep-all; }}
        .identity {{ display:flex; gap:10px 24px; flex-wrap:wrap; padding:14px 0; border-block:1px solid var(--line); }}
        .identity strong {{ color:var(--teal); }}
        .brief-layout {{ margin-top:34px; display:grid; grid-template-columns:minmax(0,1.55fr) minmax(220px,.65fr); gap:clamp(24px,5vw,58px); align-items:start; }}
        .brief-intent h2,.output-note h2,.next-action h2 {{ margin:8px 0 12px; color:var(--teal); font-size:1rem; }}
        p,dd {{ margin:0; font-size:clamp(1rem,2vw,1.16rem); line-height:1.68; word-break:keep-all; }}
        .output-note {{ padding-left:22px; border-left:4px solid var(--teal); }}
        .brief-fields {{ margin:36px 0 0; border-bottom:1px solid var(--line); }}
        .brief-fields>div {{ padding:18px 0; border-top:1px solid var(--line); display:grid; grid-template-columns:minmax(180px,.38fr) minmax(0,1fr); gap:24px; }}
        dt {{ color:var(--teal); font-size:.82rem; font-weight:800; }}
        dd {{ margin:0; }}
        .next-action {{ margin-top:38px; padding:25px 28px 28px; background:var(--soft); border-top:5px solid var(--orange); }}
        .next-action h2 {{ color:var(--ink); font-size:clamp(1.25rem,3vw,1.7rem); }}
        footer {{ display:flex; justify-content:space-between; gap:12px; margin-top:30px; padding-top:16px; border-top:2px solid var(--ink); font-size:.92rem; font-weight:800; }}
        @media (max-width:700px) {{ .project-brief{{padding:24px}} .brief-layout{{grid-template-columns:1fr}} .output-note{{padding:18px 0 0;border-top:1px solid var(--line);border-left:0}} .brief-fields>div{{grid-template-columns:1fr;gap:7px}} .next-action{{padding:22px}} footer{{flex-direction:column}} }}
      </style>
    </head>
    <body>
      <a class="skip-link" href="#main-content">본문 바로가기</a>
      <main id="main-content" class="project-brief">
        <p class="kicker">기말 프로젝트 씨앗 · 13주차</p>
        <h1>{escaped["question"]}</h1>
        <div class="identity"><span><strong>학번</strong> {escaped["student_id"]}</span><span><strong>이름</strong> {escaped["student_name"]}</span><span><strong>매체</strong> {escaped["medium"]}</span></div>
        <div class="brief-layout">
          <section class="brief-intent" aria-labelledby="input-title"><p class="section-label">프로젝트의 출발점</p><h2 id="input-title">입력 자료</h2><p>{escaped["input"]}</p></section>
          <aside class="output-note" aria-labelledby="output-title"><p class="section-label">보여 줄 결과</p><h2 id="output-title">최종 출력 형식</h2><p>{escaped["output"]}</p></aside>
        </div>
        <dl class="brief-fields">
          <div><dt>출처와 이용 권한</dt><dd>{escaped["rights"]}</dd></div>
          <div><dt>변환 또는 시각화 규칙</dt><dd>{escaped["rule"]}</dd></div>
        </dl>
        <section class="next-action" aria-labelledby="action-title"><p class="section-label">다음 수업에서 바로 실행</p><h2 id="action-title">14주차 첫 제작 행동</h2><p>{escaped["action"]}</p></section>
        <footer><span>질문 → 입력 → 규칙 → 출력</span><span>14주차 1차 면담에 지참</span></footer>
      </main>
    </body>
    </html>
    """
    Path(seed_filename).write_text(seed_html, encoding="utf-8")

    saved_poster_size = Image.open(poster_filename).size
    saved_seed_html = Path(seed_filename).read_text(encoding="utf-8")
    display(Image.open(poster_filename).resize((400, 550)))
    print("포스터 저장:", poster_filename, saved_poster_size)
    print("씨앗 카드 저장:", seed_filename, f"{len(saved_seed_html):,}자")
    '''

    final_check_code = r'''
    # FINAL CHECK · 새 런타임에서 위부터 순서대로 실행한 뒤 이 셀을 실행합니다.
    mission_step8_execution = get_ipython().execution_count

    default_responses = {
        "poster_question": "선택한 소리는 6초 동안 시간·에너지·주파수 구조가 어떻게 달라지는가?",
        "waveform_observation": "파형의 최대 절대 진폭은 0.000초에 나타나며 한 샘플의 가장 큰 봉우리를 보여 준다.",
        "rms_observation": "프레임 RMS는 0.000초에서 가장 크며 짧은 구간의 상대적인 에너지 변화를 보여 준다.",
        "frequency_observation": "전체 평균 진폭이 가장 큰 주파수 빈은 약 000Hz이며 밝은 띠의 위치와 함께 읽을 수 있다.",
        "limitation_statement": "이 상대 시각화만으로 소리의 정체나 감정, 실제 음압의 크기까지 단정할 수 없다.",
        "project_question": "일상에서 반복되는 소리의 시간 패턴은 장소에 따라 어떻게 달라지는가?",
        "project_input": "직접 생성하거나 동의를 받아 녹음한 6초 WAV 세 편",
        "project_rights": "직접 제작한 자료만 사용하고 녹음에 사람이 포함되면 제출 동의를 먼저 확인한다.",
        "project_rule": "모든 소리를 같은 길이와 프레임 규칙으로 분석해 파형·RMS·스펙트로그램을 비교한다.",
        "project_output": "세 소리의 차이를 보여 주는 세로형 비교 포스터 PNG",
        "week14_first_action": "WAV 한 편을 Colab에 불러와 0~6초 파형이 화면에 나타나는 첫 프로토타입을 만든다.",
    }

    checks = []

    def check(condition, label):
        if not bool(condition):
            raise AssertionError(f"FAIL · {label}")
        checks.append(label)
        print(f"PASS {len(checks):02d} · {label}")

    execution_order = [
        mission_step0_execution,
        mission_step1_execution,
        mission_step2_execution,
        mission_step3_execution,
        mission_step4_execution,
        mission_step5_execution,
        mission_step6_execution,
        mission_step7_execution,
        mission_step8_execution,
    ]
    check(
        execution_order == list(range(execution_order[0], execution_order[0] + 9)),
        "새 런타임에서 STEP 0부터 FINAL CHECK까지 한 번씩 순서대로 실행",
    )
    check(
        str(student_id).strip() not in {"", "20260000", "학번"}
        and str(student_name).strip() not in {"", "김학생", "이름"},
        "자신의 학번과 이름 입력",
    )
    check(audio_choice in AUDIO_LIBRARY, "수업 WAV 세 편 중 한 편 선택")
    check(
        source_snapshot == {
            "title": selected_record["title"],
            "source": selected_record["source"],
            "usage": selected_record["usage"],
            "generation": selected_record["generation"],
            "sha256": selected_record["sha256"],
        }
        and source_path.read_bytes() == original_snapshot
        and original_sha256 == selected_record["sha256"],
        "원본 WAV와 출처 메타데이터 보존",
    )
    check(
        sr == expected["sample_rate"]
        and audio_info.channels == expected["channels"]
        and audio_info.frames == expected["sample_count"]
        and audio_info.subtype == "PCM_16"
        and len(y) == expected["sample_count"]
        and np.isclose(duration_sec, expected["duration_sec"])
        and np.array_equal(y, y_snapshot)
        and sr == sr_snapshot,
        "22,050Hz·모노·PCM16·132,300샘플·6초 입력",
    )
    check(
        len(sample_times) == len(y)
        and np.isclose(sample_times[0], 0)
        and sample_times[-1] < 6
        and peak_sample_index == expected["peak_sample_index"]
        and np.isclose(peak_time_sec, expected["peak_time_sec"], atol=1e-9)
        and np.isclose(peak_amplitude, expected["peak_amplitude"], atol=1e-7),
        "0~6초 파형과 최대 절대 진폭 시점",
    )
    check(
        frame_length == 2_048
        and hop_length == 512
        and list(rms_df.columns) == ["time_sec", "rms"]
        and len(rms_df) == expected["rms_frame_count"]
        and rms_peak_index == expected["rms_peak_index"]
        and np.isclose(rms_peak_time_sec, expected["rms_peak_time_sec"], atol=1e-9)
        and np.isclose(rms_peak_value, expected["rms_peak_value"], atol=1e-6),
        "2,048/512 규칙의 259개 RMS 프레임과 최댓값",
    )
    check(
        stft_matrix.shape == tuple(expected["stft_shape"])
        and np.isclose(spectrogram_db.min(), expected["db_min"], atol=1e-6)
        and np.isclose(spectrogram_db.max(), expected["db_max"], atol=1e-6)
        and dominant_bin == expected["dominant_bin"]
        and np.isclose(dominant_frequency_hz, expected["dominant_frequency_hz"], atol=1e-6),
        "1,025×259 STFT와 -80~0dB 상대 스펙트로그램",
    )
    check(
        20 <= len(poster_question.strip()) <= 80
        and "?" in poster_question
        and poster_question != default_responses["poster_question"],
        "직접 쓴 20~80자 질문형 포스터 제목",
    )
    check(
        30 <= len(waveform_observation.strip()) <= 120
        and f"{peak_time_sec:.3f}" in waveform_observation
        and "진폭" in waveform_observation
        and waveform_observation != default_responses["waveform_observation"],
        "최대 진폭 시점을 포함한 파형 관찰",
    )
    check(
        30 <= len(rms_observation.strip()) <= 120
        and f"{rms_peak_time_sec:.3f}" in rms_observation
        and "RMS" in rms_observation
        and rms_observation != default_responses["rms_observation"],
        "최대 RMS 시점을 포함한 프레임 관찰",
    )
    check(
        30 <= len(frequency_observation.strip()) <= 120
        and str(round(dominant_frequency_hz)) in frequency_observation
        and "Hz" in frequency_observation
        and frequency_observation != default_responses["frequency_observation"],
        "대표 주파수 수치를 포함한 관찰",
    )
    check(
        30 <= len(limitation_statement.strip()) <= 120
        and any(word in limitation_statement for word in ["정체", "감정", "음압", "상대"])
        and limitation_statement != default_responses["limitation_statement"],
        "상대 시각화로 단정할 수 없는 해석 한계",
    )
    check(
        project_medium in {"image", "map", "text", "sound", "hybrid"},
        "기말 프로젝트 매체 선택",
    )
    check(
        20 <= len(project_question.strip()) <= 100
        and "?" in project_question
        and project_question != default_responses["project_question"]
        and 15 <= len(project_input.strip()) <= 120
        and project_input != default_responses["project_input"],
        "프로젝트 질문과 실제 입력 자료 작성",
    )
    check(
        20 <= len(project_rights.strip()) <= 140
        and any(word in project_rights for word in ["직접", "수업", "공공", "허용", "라이선스", "동의"])
        and project_rights != default_responses["project_rights"]
        and 20 <= len(project_rule.strip()) <= 140
        and project_rule != default_responses["project_rule"],
        "출처·이용 권한과 한 가지 변환 규칙 작성",
    )
    check(
        10 <= len(project_output.strip()) <= 100
        and project_output != default_responses["project_output"]
        and 20 <= len(week14_first_action.strip()) <= 140
        and any(word in week14_first_action for word in ["불러", "만들", "그리", "계산", "저장", "연결", "배치", "구현"])
        and week14_first_action != default_responses["week14_first_action"],
        "최종 출력 형식과 14주차 첫 제작 행동 작성",
    )
    check(
        Path(poster_filename).is_file()
        and saved_poster_size == (1_600, 2_200)
        and poster_filename == f"week13_{safe_student_id}_{safe_student_name}_sound_poster.png",
        "1600×2200 사운드 패턴 포스터 파일",
    )
    check(
        Path(seed_filename).is_file()
        and seed_filename == f"week13_{safe_student_id}_{safe_student_name}_project_seed.html"
        and '<html lang="ko">' in saved_seed_html
        and all(escape(value) in saved_seed_html for value in [
            project_question,
            project_input,
            project_rights,
            project_rule,
            project_output,
            week14_first_action,
        ]),
        "여섯 필드를 담은 기말 프로젝트 씨앗 카드 HTML",
    )

    print("\n🎉 WEEK 13 SOUND POSTER MISSION COMPLETE")
    print("PASS:", len(checks), "개 조건을 모두 충족했습니다.")
    print("제출 1 · week13_학번_이름.ipynb")
    print("제출 2 ·", poster_filename)
    print("제출 3 ·", seed_filename)
    print("세 파일의 업로드를 확인하면 즉시 귀가할 수 있습니다.")
    '''

    download_code = r'''
    # DOWNLOAD · FINAL CHECK 완료 뒤 생성된 두 파일을 내려받습니다.
    try:
        from google.colab import files
    except ImportError:
        print("로컬 환경입니다. 현재 폴더에서 아래 두 파일을 확인하세요.")
        print("-", poster_filename)
        print("-", seed_filename)
    else:
        files.download(poster_filename)
        files.download(seed_filename)

    print("노트북은 Colab 메뉴의 파일 → 다운로드 → .ipynb 다운로드를 사용하세요.")
    '''

    cells = [
        markdown_cell(
            """
            # Week 13 · 사운드 패턴 포스터와 기말 프로젝트 씨앗 미션

            **목표:** 수업 창작 WAV 한 편을 파형·RMS·스펙트로그램으로 분석하고, 수치 근거가 있는 포스터와 14주차에 바로 사용할 프로젝트 씨앗 카드를 완성합니다.

            **귀가 계약:** `FINAL CHECK`의 19개 조건이 모두 `PASS`이고 아래 세 파일의 제출이 확인되면 즉시 귀가할 수 있습니다.

            1. `week13_학번_이름.ipynb`
            2. `week13_학번_이름_sound_poster.png`
            3. `week13_학번_이름_project_seed.html`

            학생이 수정할 곳은 **STEP 1**과 **STEP 6**뿐입니다. 나머지 셀은 삭제하거나 수정하지 않습니다. 실행 순서는 STEP 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → FINAL CHECK → DOWNLOAD입니다.
            """
        ),
        code_cell(setup_code),
        markdown_cell(
            """
            ## STEP 1 · 제출자와 음원 선택

            `student_id`, `student_name`을 자신의 정보로 바꾸고, `audio_choice`에는 아래 ID 중 하나를 정확히 입력합니다.

            - `regular_pulses` — 규칙적인 펄스
            - `rising_tone` — 상승하는 음
            - `alternating_bands` — 저음·고음이 교차하는 리듬
            """
        ),
        code_cell(settings_code),
        markdown_cell(
            """
            ## STEP 2 · 원본을 보존하며 듣고 확인하기

            음원을 재생한 뒤 **22,050Hz / 모노 / 132,300샘플 / 6초**가 출력되는지 확인합니다. `source_path`는 파일 위치이고, `y`는 읽어 온 진폭 배열이며, `sr`은 1초당 샘플 수입니다.
            """
        ),
        code_cell(preserve_code),
        markdown_cell(
            """
            ## STEP 3 · 파형

            파형은 모든 샘플의 시간과 진폭을 보여 줍니다. 붉은 선은 절댓값이 가장 큰 한 샘플의 시점입니다. 이 값만으로 사람이 느끼는 음량을 단정하지 않습니다.
            """
        ),
        code_cell(waveform_code),
        markdown_cell(
            """
            ## STEP 4 · 프레임 RMS

            132,300개의 샘플을 2,048샘플씩 보고 512샘플만큼 이동하며 259개의 RMS 값을 만듭니다. RMS는 짧은 구간의 상대적인 에너지 크기를 비교하는 값이며 절대 음압이 아닙니다.
            """
        ),
        code_cell(rms_code),
        markdown_cell(
            """
            ## STEP 5 · STFT 상대 스펙트로그램

            가로축은 시간, 세로축은 주파수, 색은 파일 내부 최댓값을 0dB로 둔 상대 진폭입니다. 색상 범위는 -80~0dB, 주파수 범위는 0~4,000Hz로 고정합니다.
            """
        ),
        code_cell(spectrogram_code),
        markdown_cell(
            """
            ## STEP 6 · 자신의 문장과 프로젝트 씨앗 작성

            이 셀의 예시 문장을 모두 자신의 문장으로 바꿉니다. 출력된 실제 수치를 복사해 파형 문장에는 최대 진폭 시점, RMS 문장에는 최대 RMS 시점, 주파수 문장에는 대표 Hz를 넣습니다. 프로젝트 씨앗에는 질문·입력·권한·규칙·출력·14주차 첫 행동을 구체적으로 적습니다.

            `project_medium`은 `image`, `map`, `text`, `sound`, `hybrid` 중 하나입니다.
            """
        ),
        code_cell(writing_code),
        markdown_cell(
            """
            ## STEP 7 · 결과 파일 저장

            이 셀은 사운드 패턴 포스터 PNG와 프로젝트 씨앗 카드 HTML을 만듭니다. 미리보기에서 글자가 잘리지 않았는지 확인합니다.
            """
        ),
        code_cell(save_code),
        markdown_cell(
            """
            ## FINAL CHECK · 자동 종료 검사

            먼저 **런타임 → 세션 다시 시작**을 선택한 뒤 STEP 0부터 이 셀까지 한 번씩 순서대로 실행합니다. 실패하면 `FAIL · 조건 이름`을 읽고 STEP 1 또는 STEP 6만 고친 뒤 다시 검사합니다.
            """
        ),
        code_cell(final_check_code),
        markdown_cell(
            """
            ## DOWNLOAD · 제출 파일 받기

            완료 문구가 나온 뒤 이 셀을 실행합니다. 생성된 PNG와 HTML이 내려받아집니다. 노트북은 Colab의 **파일 → 다운로드 → .ipynb 다운로드**로 받습니다.
            """
        ),
        code_cell(download_code),
    ]

    return {
        "cells": cells,
        "metadata": {
            "colab": {"name": "week-13-sound-poster-mission.ipynb", "provenance": []},
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


def build_seed_example() -> str:
    """Return a public, accessible example of the final-project seed card."""

    values = {
        "question": "도시의 짧은 소리에서 반복과 변화는 시간에 따라 어떻게 나타나는가?",
        "input": "수업 제공 6초 WAV 세 편과 각 파일의 제목·생성 방식 메타데이터",
        "rights": "교수자 창작 수업 자료이며 교육 목적의 분석·시각화·제출이 허용됨",
        "rule": "모든 파일을 22,050Hz·모노로 유지하고 2,048/512 프레임 규칙과 -80~0dB 척도로 비교함",
        "output": "세 소리의 파형·RMS·스펙트로그램 차이를 보여 주는 1600×2200 비교 포스터",
        "action": "첫 WAV를 Colab에 불러와 0~6초 파형 한 개가 화면에 나타나는 코드 경로를 완성함",
    }
    escaped = {key: escape(value) for key, value in values.items()}
    return dedent(
        f'''\
        <!doctype html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>13주차 기말 프로젝트 씨앗 카드 예시 | Contents Programming Practice</title>
          <meta name="description" content="질문, 입력 자료, 이용 권한, 변환 규칙, 출력 형식과 14주차 첫 행동을 한 장에 정리한 기말 프로젝트 씨앗 카드 예시입니다.">
          <link rel="canonical" href="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-13-project-seed-example.html">
          <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
          <meta property="og:title" content="13주차 기말 프로젝트 씨앗 카드 예시">
          <meta property="og:description" content="기말 프로젝트의 질문부터 14주차 첫 제작 행동까지 연결하는 한 장의 예시 카드입니다.">
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-13-project-seed-example.html">
          <meta property="og:image" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-13-sound-pattern-poster-example.png">
          <meta property="og:image:alt" content="파형, 프레임 RMS, 상대 스펙트로그램과 근거 문장을 한 장에 구성한 사운드 패턴 포스터 예시">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="13주차 기말 프로젝트 씨앗 카드 예시">
          <meta name="twitter:description" content="질문, 입력, 권한, 규칙, 출력과 첫 행동을 정리한 프로젝트 계획 예시입니다.">
          <meta name="twitter:image" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-13-sound-pattern-poster-example.png">
          <style>
            :root {{ color-scheme:light; --ink:#172321; --paper:#f3efe3; --panel:#fbfaf5; --teal:#1f5f67; --orange:#a44230; --line:#a9afab; --soft:#e4ebe6; }}
            * {{ box-sizing:border-box; }}
            body {{ margin:0; padding:clamp(14px,4vw,42px); color:var(--ink); background:var(--paper); font-family:"Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif; }}
            .skip-link {{ position:absolute; left:12px; top:-80px; padding:10px 14px; color:white; background:var(--ink); z-index:10; }}
            .skip-link:focus {{ top:12px; }}
            .project-brief {{ max-width:1040px; margin:auto; border:2px solid var(--ink); background:var(--panel); padding:clamp(24px,5vw,54px); }}
            .kicker,.section-label {{ margin:0; color:var(--orange); font-size:.76rem; font-weight:800; letter-spacing:.08em; }}
            h1 {{ max-width:900px; margin:.6rem 0 1.6rem; font-size:clamp(2.25rem,7vw,5.3rem); letter-spacing:-.055em; line-height:1.02; word-break:keep-all; }}
            .identity {{ display:flex; gap:10px 24px; flex-wrap:wrap; padding:14px 0; border-block:1px solid var(--line); }}
            .identity strong {{ color:var(--teal); }}
            .brief-layout {{ margin-top:34px; display:grid; grid-template-columns:minmax(0,1.55fr) minmax(220px,.65fr); gap:clamp(24px,5vw,58px); align-items:start; }}
            .brief-intent h2,.output-note h2,.next-action h2 {{ margin:8px 0 12px; color:var(--teal); font-size:1rem; }}
            p,dd {{ margin:0; font-size:clamp(1rem,2vw,1.16rem); line-height:1.68; word-break:keep-all; }}
            .output-note {{ padding-left:22px; border-left:4px solid var(--teal); }}
            .brief-fields {{ margin:36px 0 0; border-bottom:1px solid var(--line); }}
            .brief-fields>div {{ padding:18px 0; border-top:1px solid var(--line); display:grid; grid-template-columns:minmax(180px,.38fr) minmax(0,1fr); gap:24px; }}
            dt {{ color:var(--teal); font-size:.82rem; font-weight:800; }}
            dd {{ margin:0; }}
            .next-action {{ margin-top:38px; padding:25px 28px 28px; background:var(--soft); border-top:5px solid var(--orange); }}
            .next-action h2 {{ color:var(--ink); font-size:clamp(1.25rem,3vw,1.7rem); }}
            footer {{ display:flex; justify-content:space-between; gap:12px; margin-top:30px; padding-top:16px; border-top:2px solid var(--ink); font-size:.92rem; font-weight:800; }}
            @media (max-width:700px) {{ .project-brief{{padding:24px}} .brief-layout{{grid-template-columns:1fr}} .output-note{{padding:18px 0 0;border-top:1px solid var(--line);border-left:0}} .brief-fields>div{{grid-template-columns:1fr;gap:7px}} .next-action{{padding:22px}} footer{{flex-direction:column}} }}
          </style>
        </head>
        <body>
          <a class="skip-link" href="#main-content">본문 바로가기</a>
          <main id="main-content" class="project-brief">
            <p class="kicker">기말 프로젝트 씨앗 · 13주차</p>
            <h1>{escaped["question"]}</h1>
            <div class="identity"><span><strong>작성자</strong> 예시 학생</span><span><strong>매체</strong> sound</span><span><strong>상태</strong> 14주차 면담 준비</span></div>
            <div class="brief-layout">
              <section class="brief-intent" aria-labelledby="input-title"><p class="section-label">프로젝트의 출발점</p><h2 id="input-title">입력 자료</h2><p>{escaped["input"]}</p></section>
              <aside class="output-note" aria-labelledby="output-title"><p class="section-label">보여 줄 결과</p><h2 id="output-title">최종 출력 형식</h2><p>{escaped["output"]}</p></aside>
            </div>
            <dl class="brief-fields">
              <div><dt>출처와 이용 권한</dt><dd>{escaped["rights"]}</dd></div>
              <div><dt>변환 또는 시각화 규칙</dt><dd>{escaped["rule"]}</dd></div>
            </dl>
            <section class="next-action" aria-labelledby="action-title"><p class="section-label">다음 수업에서 바로 실행</p><h2 id="action-title">14주차 첫 제작 행동</h2><p>{escaped["action"]}</p></section>
            <footer><span>질문 → 입력 → 규칙 → 출력</span><span>14주차에는 첫 코드 경로부터</span></footer>
          </main>
        </body>
        </html>
        '''
    )


def validate_notebook(notebook: dict[str, object]) -> None:
    """Fail generation when the notebook contract is incomplete."""

    cells = notebook["cells"]
    code_cells = [cell for cell in cells if cell["cell_type"] == "code"]
    all_source = "".join("".join(cell["source"]) for cell in cells)
    if len(code_cells) != 10:
        raise AssertionError("The mission notebook must contain exactly ten code cells.")
    required_fragments = [
        "regular_pulses",
        "rising_tone",
        "alternating_bands",
        "librosa.feature.rms",
        "librosa.stft",
        "librosa.amplitude_to_db",
        "1_600, 2_200",
        "project_seed.html",
        "WEEK 13 SOUND POSTER MISSION COMPLETE",
        "세 파일의 업로드를 확인하면 즉시 귀가",
    ]
    for fragment in required_fragments:
        if fragment not in all_source:
            raise AssertionError(f"Notebook is missing contract fragment: {fragment}")
    human_source = "\n".join(
        line for line in all_source.splitlines() if len(line) < 500
    )
    for banned in ["TODO", "implement here", "rest of code", "similar to above"]:
        if banned.lower() in human_source.lower():
            raise AssertionError(f"Notebook contains incomplete-code marker: {banned}")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    notebook = build_notebook()
    validate_notebook(notebook)
    NOTEBOOK_PATH.write_text(
        json.dumps(notebook, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    SEED_EXAMPLE_PATH.write_text(build_seed_example(), encoding="utf-8")
    print(f"Generated {NOTEBOOK_PATH.relative_to(ROOT)}")
    print(f"Generated {SEED_EXAMPLE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
