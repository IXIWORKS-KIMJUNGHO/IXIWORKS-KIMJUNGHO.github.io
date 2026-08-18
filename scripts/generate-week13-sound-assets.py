#!/usr/bin/env python3
"""Generate deterministic Week 13 sound-analysis teaching assets."""

from __future__ import annotations

import json
import wave
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "teaching" / "contents-programming" / "assets"

SAMPLE_RATE = 22_050
DURATION_SECONDS = 6.0
SAMPLE_COUNT = int(SAMPLE_RATE * DURATION_SECONDS)
FRAME_LENGTH = 2_048
HOP_LENGTH = 512
MAX_FREQUENCY = 4_000

PAPER = "#f4f0e8"
PANEL = "#fffdf8"
INK = "#1f2725"
MUTED = "#5d6662"
LINE = "#c7cbc4"
TEAL = "#0e716b"
CORAL = "#a44230"
BLUE = "#315f91"

FONT_CANDIDATES = [
    Path("/usr/share/fonts/truetype/nanum/NanumGothic.ttf"),
    Path("/System/Library/Fonts/AppleSDGothicNeo.ttc"),
    Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf"),
    Path("C:/Windows/Fonts/malgun.ttf"),
]
FONT_PATH = next(
    (candidate for candidate in FONT_CANDIDATES if candidate.is_file()),
    Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans.ttf",
)
FONT = font_manager.FontProperties(fname=FONT_PATH)
FONT_BOLD = font_manager.FontProperties(fname=FONT_PATH, weight="bold")


def time_axis() -> np.ndarray:
    """Return the shared six-second sample grid without an extra endpoint."""

    return np.arange(SAMPLE_COUNT, dtype=np.float64) / SAMPLE_RATE


def normalize(signal: np.ndarray, peak: float = 0.95) -> np.ndarray:
    """Scale a floating-point signal to a predictable absolute peak."""

    current_peak = float(np.max(np.abs(signal)))
    if current_peak == 0:
        raise ValueError("A generated sound must contain a non-zero sample.")
    return signal * (peak / current_peak)


def make_regular_pulses() -> np.ndarray:
    """Create six evenly spaced 440 Hz bursts with increasing amplitude."""

    times = time_axis()
    signal = np.zeros(SAMPLE_COUNT, dtype=np.float64)
    centers = np.array([0.55, 1.45, 2.35, 3.25, 4.15, 5.05])
    amplitudes = np.array([0.42, 0.52, 0.62, 0.72, 0.82, 0.95])
    half_width = 0.15

    for center, amplitude in zip(centers, amplitudes, strict=True):
        active = np.abs(times - center) <= half_width
        local = (times[active] - (center - half_width)) / (2 * half_width)
        envelope = np.sin(np.pi * local) ** 2
        carrier = np.sin(2 * np.pi * 440 * times[active])
        signal[active] += amplitude * envelope * carrier

    return normalize(signal)


def make_rising_tone() -> np.ndarray:
    """Create a continuous tone that rises linearly from 180 to 1,200 Hz."""

    times = time_axis()
    start_frequency = 180.0
    end_frequency = 1_200.0
    slope = (end_frequency - start_frequency) / DURATION_SECONDS
    phase = 2 * np.pi * (
        start_frequency * times + 0.5 * slope * times**2
    )
    signal = np.sin(phase)

    fade_seconds = 0.08
    envelope = np.ones_like(signal)
    fade_in = times < fade_seconds
    fade_out = times > DURATION_SECONDS - fade_seconds
    envelope[fade_in] = 0.5 - 0.5 * np.cos(
        np.pi * times[fade_in] / fade_seconds
    )
    remaining = DURATION_SECONDS - times[fade_out]
    envelope[fade_out] = 0.5 - 0.5 * np.cos(
        np.pi * remaining / fade_seconds
    )
    return normalize(0.78 * envelope * signal)


def make_alternating_bands() -> np.ndarray:
    """Create alternating half-second low and high tone segments."""

    times = time_axis()
    signal = np.zeros(SAMPLE_COUNT, dtype=np.float64)
    segment_seconds = 0.5
    fade_seconds = 0.035
    segment_count = int(DURATION_SECONDS / segment_seconds)

    for segment_index in range(segment_count):
        start = segment_index * segment_seconds
        end = start + segment_seconds
        active = (times >= start) & (times < end)
        local = times[active] - start
        frequency = 220.0 if segment_index % 2 == 0 else 880.0
        envelope = np.ones_like(local)
        fade_in = local < fade_seconds
        fade_out = local > segment_seconds - fade_seconds
        envelope[fade_in] = 0.5 - 0.5 * np.cos(
            np.pi * local[fade_in] / fade_seconds
        )
        remaining = segment_seconds - local[fade_out]
        envelope[fade_out] = 0.5 - 0.5 * np.cos(
            np.pi * remaining / fade_seconds
        )
        signal[active] = 0.82 * envelope * np.sin(
            2 * np.pi * frequency * times[active]
        )

    return normalize(signal)


def write_pcm16_wav(path: Path, signal: np.ndarray) -> None:
    """Write one mono PCM16 WAV with the shared class sample rate."""

    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.round(np.clip(signal, -1.0, 1.0) * 32_767).astype("<i2")
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(pcm.tobytes())


def analyze_frames(signal: np.ndarray) -> dict[str, np.ndarray | float | int]:
    """Match librosa's centered frame count for the teaching visual."""

    padding = FRAME_LENGTH // 2
    padded = np.pad(signal, (padding, padding), mode="constant")
    frame_count = 1 + (len(padded) - FRAME_LENGTH) // HOP_LENGTH
    frames = np.stack(
        [
            padded[
                frame_index * HOP_LENGTH :
                frame_index * HOP_LENGTH + FRAME_LENGTH
            ]
            for frame_index in range(frame_count)
        ]
    )
    frame_times = np.arange(frame_count) * HOP_LENGTH / SAMPLE_RATE
    rms = np.sqrt(np.mean(frames**2, axis=1))

    window = np.hanning(FRAME_LENGTH)
    magnitude = np.abs(np.fft.rfft(frames * window, axis=1)).T
    reference = float(np.max(magnitude))
    spectrogram_db = 20 * np.log10(np.maximum(magnitude, 1e-10) / reference)
    spectrogram_db = np.clip(spectrogram_db, -80, 0)
    frequencies = np.fft.rfftfreq(FRAME_LENGTH, d=1 / SAMPLE_RATE)

    peak_sample_index = int(np.argmax(np.abs(signal)))
    peak_rms_index = int(np.argmax(rms))
    dominant_bin = np.unravel_index(
        int(np.argmax(magnitude)), magnitude.shape
    )[0]

    return {
        "frame_count": frame_count,
        "frame_times": frame_times,
        "rms": rms,
        "spectrogram_db": spectrogram_db,
        "frequencies": frequencies,
        "peak_sample_index": peak_sample_index,
        "peak_time": peak_sample_index / SAMPLE_RATE,
        "peak_rms_index": peak_rms_index,
        "peak_rms_time": float(frame_times[peak_rms_index]),
        "dominant_frequency": float(frequencies[dominant_bin]),
    }


def apply_style() -> None:
    plt.rcParams.update(
        {
            "font.family": FONT.get_name(),
            "axes.facecolor": PANEL,
            "figure.facecolor": PAPER,
            "savefig.facecolor": PAPER,
            "text.color": INK,
            "axes.labelcolor": INK,
            "axes.edgecolor": LINE,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "axes.unicode_minus": False,
        }
    )


def style_axis(axis: plt.Axes) -> None:
    axis.spines[["top", "right"]].set_visible(False)
    axis.spines[["left", "bottom"]].set_color(LINE)
    axis.grid(color=LINE, linewidth=0.7, alpha=0.45)
    axis.set_axisbelow(True)


def make_four_views(
    path: Path,
    signal: np.ndarray,
    analysis: dict[str, np.ndarray | float | int],
) -> None:
    """Render one sound as samples, waveform, RMS, and a spectrogram."""

    apply_style()
    times = time_axis()
    frame_times = np.asarray(analysis["frame_times"])
    rms = np.asarray(analysis["rms"])
    spectrogram_db = np.asarray(analysis["spectrogram_db"])
    frequencies = np.asarray(analysis["frequencies"])

    figure = plt.figure(figsize=(14.4, 12), dpi=100)
    grid = figure.add_gridspec(
        4,
        1,
        left=0.085,
        right=0.94,
        bottom=0.075,
        top=0.84,
        hspace=0.62,
        height_ratios=[0.9, 1.0, 0.9, 1.55],
    )
    figure.text(
        0.085,
        0.94,
        "한 소리, 네 가지 데이터 화면",
        fontproperties=FONT_BOLD,
        fontsize=30,
    )
    figure.text(
        0.085,
        0.89,
        "6초 · 초당 22,050샘플 · 모노 · 전체 132,300샘플",
        fontproperties=FONT,
        fontsize=15,
        color=MUTED,
    )

    sample_axis = figure.add_subplot(grid[0])
    zoom = (times >= 4.985) & (times <= 5.015)
    sample_axis.plot(times[zoom], signal[zoom], color=TEAL, linewidth=1.2)
    sample_axis.scatter(times[zoom][::8], signal[zoom][::8], color=CORAL, s=22, zorder=3)
    sample_axis.axhline(0, color=LINE, linewidth=1)
    sample_axis.set_title(
        "샘플 · 한 시점에 기록한 진폭 측정값",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=15,
    )
    sample_axis.set_xlabel("시간(초) · 0.03초 구간 확대")
    sample_axis.set_ylabel("진폭")
    style_axis(sample_axis)

    waveform_axis = figure.add_subplot(grid[1])
    waveform_axis.plot(times[::8], signal[::8], color=TEAL, linewidth=0.9)
    waveform_axis.set_xlim(0, DURATION_SECONDS)
    waveform_axis.set_ylim(-1, 1)
    waveform_axis.set_title(
        "파형 · 신호가 움직인 시간과 진폭 범위",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=15,
    )
    waveform_axis.set_xlabel("시간(초)")
    waveform_axis.set_ylabel("정규화된 진폭")
    style_axis(waveform_axis)

    rms_axis = figure.add_subplot(grid[2])
    rms_axis.plot(frame_times, rms, color=CORAL, linewidth=2.1)
    rms_axis.fill_between(frame_times, rms, color=CORAL, alpha=0.15)
    rms_axis.set_xlim(0, DURATION_SECONDS)
    rms_axis.set_ylim(0, max(rms) * 1.12)
    rms_axis.set_title(
        "프레임 RMS · 겹치는 짧은 구간마다 계산한 대표 크기",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=15,
    )
    rms_axis.set_xlabel("프레임 시간(초)")
    rms_axis.set_ylabel("RMS")
    style_axis(rms_axis)

    spectrum_axis = figure.add_subplot(grid[3])
    visible = frequencies <= MAX_FREQUENCY
    image = spectrum_axis.imshow(
        spectrogram_db[visible],
        origin="lower",
        aspect="auto",
        extent=[
            float(frame_times[0]),
            float(frame_times[-1]),
            float(frequencies[visible][0]),
            float(frequencies[visible][-1]),
        ],
        cmap="magma",
        vmin=-80,
        vmax=0,
    )
    spectrum_axis.set_xlim(0, DURATION_SECONDS)
    spectrum_axis.set_ylim(0, MAX_FREQUENCY)
    spectrum_axis.set_title(
        "상대 스펙트로그램 · 시간마다 강해지는 주파수 대역",
        loc="left",
        fontproperties=FONT_BOLD,
        fontsize=15,
    )
    spectrum_axis.set_xlabel("시간(초)")
    spectrum_axis.set_ylabel("주파수(Hz)")
    colorbar = figure.colorbar(image, ax=spectrum_axis, pad=0.015)
    colorbar.set_label("상대 진폭(dB, 최댓값 = 0)")

    figure.text(
        0.085,
        0.025,
        "네 화면은 서로 다른 질문에 답합니다. 어느 화면도 소리의 정체나 감정을 단독으로 증명하지 않습니다.",
        fontproperties=FONT_BOLD,
        fontsize=12,
        color=BLUE,
    )
    figure.savefig(path, dpi=100, metadata={"Software": "Week 13 sound assets"})
    plt.close(figure)


def make_poster(
    path: Path,
    signal: np.ndarray,
    analysis: dict[str, np.ndarray | float | int],
) -> None:
    """Render the exact 1600 × 2200 reference poster used in Period 2."""

    apply_style()
    times = time_axis()
    frame_times = np.asarray(analysis["frame_times"])
    rms = np.asarray(analysis["rms"])
    spectrogram_db = np.asarray(analysis["spectrogram_db"])
    frequencies = np.asarray(analysis["frequencies"])
    peak_time = float(analysis["peak_time"])
    peak_rms_time = float(analysis["peak_rms_time"])
    dominant_frequency = float(analysis["dominant_frequency"])

    figure = plt.figure(figsize=(8, 11), dpi=200)
    grid = figure.add_gridspec(
        6,
        1,
        left=0.11,
        right=0.90,
        bottom=0.12,
        top=0.77,
        hspace=0.78,
        height_ratios=[1.0, 0.75, 1.6, 0.1, 0.1, 0.1],
    )
    figure.text(
        0.11,
        0.93,
        "이 소리는 언제\n가장 강해지는가?",
        fontproperties=FONT_BOLD,
        fontsize=25,
        linespacing=1.0,
    )
    figure.text(
        0.11,
        0.845,
        "규칙적인 펄스 · 수업을 위해 생성한 6초 창작 음원",
        fontproperties=FONT,
        fontsize=10,
        color=MUTED,
    )
    figure.text(
        0.11,
        0.81,
        (
            f"최대 진폭: {peak_time:.3f}초   ·   "
            f"최대 RMS: {peak_rms_time:.3f}초   ·   "
            f"대표 대역: 약 {dominant_frequency:.0f}Hz"
        ),
        fontproperties=FONT_BOLD,
        fontsize=9.3,
        color=CORAL,
    )

    waveform_axis = figure.add_subplot(grid[0])
    waveform_axis.plot(times[::8], signal[::8], color=TEAL, linewidth=0.75)
    waveform_axis.axvline(peak_time, color=CORAL, linewidth=1.0, linestyle="--")
    waveform_axis.set_xlim(0, DURATION_SECONDS)
    waveform_axis.set_ylim(-1, 1)
    waveform_axis.set_title("파형", loc="left", fontproperties=FONT_BOLD, fontsize=10)
    waveform_axis.set_xlabel("시간(초)", fontsize=8)
    waveform_axis.set_ylabel("진폭", fontsize=8)
    waveform_axis.tick_params(labelsize=7)
    style_axis(waveform_axis)

    rms_axis = figure.add_subplot(grid[1])
    rms_axis.plot(frame_times, rms, color=CORAL, linewidth=1.6)
    rms_axis.fill_between(frame_times, rms, color=CORAL, alpha=0.15)
    rms_axis.axvline(peak_rms_time, color=INK, linewidth=0.9, linestyle="--")
    rms_axis.set_xlim(0, DURATION_SECONDS)
    rms_axis.set_ylim(0, max(rms) * 1.12)
    rms_axis.set_title("프레임 RMS", loc="left", fontproperties=FONT_BOLD, fontsize=10)
    rms_axis.set_xlabel("프레임 시간(초)", fontsize=8)
    rms_axis.set_ylabel("RMS", fontsize=8)
    rms_axis.tick_params(labelsize=7)
    style_axis(rms_axis)

    spectrum_axis = figure.add_subplot(grid[2])
    visible = frequencies <= MAX_FREQUENCY
    image = spectrum_axis.imshow(
        spectrogram_db[visible],
        origin="lower",
        aspect="auto",
        extent=[
            float(frame_times[0]),
            float(frame_times[-1]),
            float(frequencies[visible][0]),
            float(frequencies[visible][-1]),
        ],
        cmap="magma",
        vmin=-80,
        vmax=0,
    )
    spectrum_axis.set_xlim(0, DURATION_SECONDS)
    spectrum_axis.set_ylim(0, MAX_FREQUENCY)
    spectrum_axis.set_title("상대 스펙트로그램", loc="left", fontproperties=FONT_BOLD, fontsize=10)
    spectrum_axis.set_xlabel("시간(초)", fontsize=8)
    spectrum_axis.set_ylabel("주파수(Hz)", fontsize=8)
    spectrum_axis.tick_params(labelsize=7)
    colorbar = figure.colorbar(image, ax=spectrum_axis, pad=0.02)
    colorbar.set_label("dB", fontsize=8)
    colorbar.ax.tick_params(labelsize=7)

    figure.text(
        0.11,
        0.238,
        "관찰 근거",
        fontproperties=FONT_BOLD,
        fontsize=8,
        color=TEAL,
    )
    figure.text(
        0.11,
        0.210,
        f"파형 · 마지막 펄스의 {peak_time:.3f}초에서 최대 절대 진폭이 나타납니다.",
        fontproperties=FONT,
        fontsize=7.5,
        color=INK,
    )
    figure.text(
        0.11,
        0.183,
        f"RMS · {peak_rms_time:.3f}초를 중심으로 한 프레임의 RMS가 가장 큽니다.",
        fontproperties=FONT,
        fontsize=7.5,
        color=INK,
    )
    figure.text(
        0.11,
        0.156,
        f"주파수 · 여섯 펄스의 상대 에너지가 약 {dominant_frequency:.0f}Hz 빈에 모입니다.",
        fontproperties=FONT,
        fontsize=7.5,
        color=INK,
    )
    figure.text(
        0.11,
        0.118,
        "해석의 한계",
        fontproperties=FONT_BOLD,
        fontsize=8,
        color=BLUE,
    )
    figure.text(
        0.11,
        0.093,
        (
            "이 화면은 시간, 상대 크기, 주파수 구조를 설명합니다. "
            "소리의 정체, 의미, 감정까지 증명하지는 않습니다."
        ),
        fontproperties=FONT,
        fontsize=7.5,
        color=MUTED,
        wrap=True,
    )
    figure.text(
        0.11,
        0.043,
        (
            "출처 · 교수자 창작 WAV  |  22,050Hz 모노  |  "
            "프레임 2,048  |  이동 512  |  표시 범위 0-4,000Hz, -80-0dB"
        ),
        fontproperties=FONT,
        fontsize=6.8,
        color=MUTED,
    )
    figure.savefig(path, dpi=200, metadata={"Software": "Week 13 sound assets"})
    plt.close(figure)


def inspect_wav(path: Path) -> dict[str, int | float | str]:
    with wave.open(str(path), "rb") as wav_file:
        frames = wav_file.getnframes()
        sample_rate = wav_file.getframerate()
        return {
            "filename": path.name,
            "channels": wav_file.getnchannels(),
            "sample_width_bytes": wav_file.getsampwidth(),
            "sample_rate": sample_rate,
            "sample_count": frames,
            "duration_seconds": frames / sample_rate,
        }


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    sounds = {
        "week-13-regular-pulses.wav": make_regular_pulses(),
        "week-13-rising-tone.wav": make_rising_tone(),
        "week-13-alternating-bands.wav": make_alternating_bands(),
    }

    metadata = []
    for filename, signal in sounds.items():
        output_path = ASSET_DIR / filename
        write_pcm16_wav(output_path, signal)
        metadata.append(inspect_wav(output_path))

    regular_signal = sounds["week-13-regular-pulses.wav"]
    regular_analysis = analyze_frames(regular_signal)
    make_four_views(
        ASSET_DIR / "week-13-sound-four-views.png",
        regular_signal,
        regular_analysis,
    )
    make_poster(
        ASSET_DIR / "week-13-sound-pattern-poster-example.png",
        regular_signal,
        regular_analysis,
    )

    report = {
        "audio": metadata,
        "analysis": {
            "frame_length": FRAME_LENGTH,
            "hop_length": HOP_LENGTH,
            "frame_count": int(regular_analysis["frame_count"]),
            "peak_sample_index": int(regular_analysis["peak_sample_index"]),
            "peak_time_seconds": round(float(regular_analysis["peak_time"]), 6),
            "peak_rms_index": int(regular_analysis["peak_rms_index"]),
            "peak_rms_time_seconds": round(
                float(regular_analysis["peak_rms_time"]), 6
            ),
            "dominant_frequency_hz": round(
                float(regular_analysis["dominant_frequency"]), 6
            ),
        },
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
