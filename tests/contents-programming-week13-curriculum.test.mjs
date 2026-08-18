import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(
  root,
  "teaching",
  "contents-programming",
  "index.html",
);
const lessonRoot = resolve(root, "teaching", "contents-programming");
const assetRoot = resolve(lessonRoot, "assets");
const teachingCssPath = resolve(root, "assets", "teaching.css");
const week13UiPath = resolve(root, "assets", "week-13-ui.js");
const soundAssetGeneratorPath = resolve(
  root,
  "scripts",
  "generate-week13-sound-assets.py",
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readWeek13() {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week13Match = courseIndex.match(
    /<section class="week-group" id="week-13"[\s\S]*?<\/section>/,
  );

  assert.ok(week13Match, "the course index should include week 13");
  return week13Match[0];
}

function paragraphByLabel(week, label) {
  const paragraph = week.match(
    new RegExp(
      `<p><strong>${escapeRegExp(label)}</strong>([\\s\\S]*?)<\\/p>`,
    ),
  );

  assert.ok(paragraph, `week 13 should include the “${label}” paragraph`);
  return paragraph[0];
}

function visibleText(fragment) {
  return fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function assertIncludesAll(fragment, values) {
  const text = visibleText(fragment);

  for (const value of values) {
    assert.ok(text.includes(value), `expected “${value}” inside: ${text}`);
  }
}

function assertContinuousFiftyMinutePlan(fragment) {
  const ranges = [...visibleText(fragment).matchAll(/(\d+)–(\d+)분/g)].map(
    ([, start, end]) => [Number(start), Number(end)],
  );

  assert.ok(ranges.length > 1, "a period should contain a detailed time plan");
  assert.equal(ranges[0][0], 0, "a period should begin at minute 0");

  for (const [start, end] of ranges) {
    assert.ok(end > start, "every time block should have a positive duration");
  }

  for (let index = 1; index < ranges.length; index += 1) {
    assert.equal(
      ranges[index][0],
      ranges[index - 1][1],
      "adjacent time blocks should not leave gaps or overlap",
    );
  }

  assert.equal(ranges.at(-1)[1], 50, "a period should end at minute 50");
}

function assertExternalLink(fragment, href) {
  assert.match(
    fragment,
    new RegExp(
      `<a href="${escapeRegExp(href)}" target="_blank" rel="noopener noreferrer">`,
    ),
  );
}

test("week 13 turns ordered text points into sampled sound over real time", async () => {
  const week13 = await readWeek13();
  const connection = paragraphByLabel(week13, "12주차 연결");

  assert.match(
    week13,
    /<h3>파형과 스펙트로그램으로 소리의 시간·주파수 구조 읽기<\/h3>/,
  );
  assertIncludesAll(connection, [
    "한 문장의 공백 기준 토큰 수",
    "시간이 아니라 원문에 등장한 순서",
    "실제 초 단위 가로축",
    "샘플링 레이트·채널·프레임 길이·프레임 이동 간격",
    "6초",
    "22,050Hz",
    "모노",
    "132,300샘플",
    "교수자 창작 WAV 세 편",
  ]);
});

test("period 1 explains waveform, frames, RMS, and spectrogram without overclaiming", async () => {
  const week13 = await readWeek13();
  const period1 = paragraphByLabel(
    week13,
    "1교시 · 소리는 어떻게 시간 데이터가 되는가",
  );

  assertIncludesAll(period1, [
    "재생 화면, 파형, RMS 에너지 곡선, 스펙트로그램",
    "샘플",
    "샘플링 레이트",
    "모노와 스테레오 채널",
    "22,050Hz로 6초",
    "132,300개의 샘플",
    "세로축이 정규화된 진폭",
    "사람이 느끼는 음량",
    "frame_length=2048",
    "hop_length=512",
    "절대 음압 레벨과 같지 않다",
    "Hz",
    "STFT",
    "가로축은 시간",
    "세로축은 주파수",
    "상대 dB 값",
    "소리의 정체나 감정을 자동으로 증명하지 않는다",
    "타인의 목소리",
    "당사자의 동의",
    "기억에서 꺼내 정리",
  ]);
  assertContinuousFiftyMinutePlan(period1);
});

test("period 2 uses current librosa APIs to build three honest audio views", async () => {
  const week13 = await readWeek13();
  const period2 = paragraphByLabel(
    week13,
    "2교시 · librosa로 파형·RMS·스펙트로그램 그리기",
  );

  assertIncludesAll(period2, [
    "source_path",
    "원본 파일을 변경하지 않은 채",
    "IPython.display.Audio",
    "y, sr = librosa.load(source_path, sr=None, mono=True)",
    "y.shape",
    "y.dtype",
    "len(y) / sr",
    "sample_times = np.arange(len(y)) / sr",
    "np.argmax(np.abs(y)) / sr",
    "librosa.feature.rms()",
    "librosa.times_like()",
    "time_sec",
    "rms",
    "librosa.stft()",
    "librosa.amplitude_to_db()",
    "ref=np.max",
    "librosa.display.specshow()",
    "-80~0dB",
    "1600 × 2200",
    "시간 범위, 주파수 범위와 dB 색상 범위를 고정",
    "savefig()",
  ]);
  assertContinuousFiftyMinutePlan(period2);

  for (const href of [
    "https://librosa.org/doc/latest/generated/librosa.load.html",
    "https://librosa.org/doc/latest/generated/librosa.display.waveshow.html",
    "https://librosa.org/doc/latest/generated/librosa.feature.rms.html",
    "https://librosa.org/doc/latest/generated/librosa.stft.html",
    "https://librosa.org/doc/latest/generated/librosa.amplitude_to_db.html",
    "https://librosa.org/doc/latest/generated/librosa.display.specshow.html",
  ]) {
    assertExternalLink(period2, href);
  }
});

test("period 3 is a measurable sound-poster and final-project seed mission", async () => {
  const week13 = await readWeek13();
  const period3 = paragraphByLabel(
    week13,
    "3교시 · 목표 달성형 개인 실습",
  );

  assertIncludesAll(period3, [
    "규칙적인 펄스",
    "상승하는 음",
    "저음·고음이 교차하는 리듬",
    "22,050Hz",
    "모노 한 채널",
    "132,300샘플",
    "6초",
    "최대 절대 진폭 시점",
    "2048샘플 프레임",
    "512샘플 이동 간격",
    "최대 RMS 프레임의 시간",
    "-80~0dB 상대 스펙트로그램",
    "1600 × 2200 사운드 패턴 포스터",
    "수치 근거 세 문장",
    "기말 프로젝트 씨앗 카드 HTML",
    "입력 자료",
    "출처와 이용 권한",
    "변환 또는 시각화 규칙",
    "14주차 첫 제작 행동",
    "자동 검사 PASS",
    "week13_학번_이름.ipynb",
    "week13_학번_이름_sound_poster.png",
    "week13_학번_이름_project_seed.html",
    "세 파일을 제출",
    "즉시 귀가",
  ]);
  assertContinuousFiftyMinutePlan(period3);
});

test("week 13 keeps optional personal audio separate and hands a fixed seed to week 14", async () => {
  const week13 = await readWeek13();
  const optional = paragraphByLabel(
    week13,
    "선택 확장 · 자신의 소리를 같은 척도로 비교하기",
  );
  const connection = paragraphByLabel(week13, "14주차 연결");

  assertIncludesAll(optional, [
    "필수 결과 세 파일을 먼저 제출",
    "직접 생성·녹음했거나 분석·제출 권한을 확인",
    "같은 0–6초 시간축",
    "-80~0dB 색상 범위",
    "타인의 음악과 동의받지 않은 음성은 사용하지 않으며",
    "필수 귀가 조건과 추가 점수에 포함하지 않는다",
  ]);
  assertIncludesAll(connection, [
    "14주차 1차 면담의 출발 문서",
    "출처와 이용 권한",
    "한 가지 핵심 변환 규칙",
    "첫 제작 행동",
    "30% 프로토타입",
  ]);
  assert.match(
    week13,
    /제출 · 사운드 패턴 포스터 PNG, 기말 프로젝트 씨앗 카드 HTML 및 Colab 노트북/,
  );
  assert.doesNotMatch(week13, /짝 활동|짝과|조별|팀 활동/);
});

test("week 13 period 1 and 2 are linked, timed, and substantial beginner lessons", async () => {
  const [courseIndex, period1, period2] = await Promise.all([
    readFile(courseIndexPath, "utf8"),
    readFile(resolve(lessonRoot, "week-13-period1.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period2.html"), "utf8"),
  ]);

  assert.match(courseIndex, /href="week-13-period1\.html">강의 자료 ↗<\/a>/);
  assert.match(courseIndex, /href="week-13-period2\.html">강의 자료 ↗<\/a>/);
  assert.match(period1, /13주차 1교시: 소리는 어떻게 시간 데이터가 되는가/);
  assert.match(period2, /13주차 2교시: librosa로 파형·RMS·스펙트로그램 그리기/);

  for (const [lesson, expectedRanges] of [
    [period1, ["0-6분", "6-15분", "15-25분", "25-34분", "34-43분", "43-48분", "48-50분"]],
    [period2, ["0-7분", "7-16분", "16-25분", "25-34분", "34-43분", "43-48분", "48-50분"]],
  ]) {
    for (const range of expectedRanges) assert.ok(lesson.includes(range));
    assert.match(lesson, /50-60분/);
    assert.match(lesson, /오늘의 학습 목표/);
    assert.match(lesson, /핵심 정리/);
    assert.match(lesson, /공식 자료와 추가 읽기/);
  }

  assert.ok((period1.match(/<details class="callout callout-question">/g) ?? []).length >= 12);
  assert.ok((period2.match(/<details class="callout callout-question">/g) ?? []).length >= 18);
  assert.ok((await stat(resolve(lessonRoot, "week-13-period1.html"))).size > 40_000);
  assert.ok((await stat(resolve(lessonRoot, "week-13-period2.html"))).size > 60_000);
});

test("week 13 provides three exact six-second mono WAV sources", async () => {
  for (const filename of [
    "week-13-regular-pulses.wav",
    "week-13-rising-tone.wav",
    "week-13-alternating-bands.wav",
  ]) {
    const wav = await readFile(resolve(assetRoot, filename));

    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    assert.equal(wav.toString("ascii", 8, 12), "WAVE");
    assert.equal(wav.toString("ascii", 12, 16), "fmt ");
    assert.equal(wav.readUInt16LE(20), 1, `${filename} should be PCM`);
    assert.equal(wav.readUInt16LE(22), 1, `${filename} should be mono`);
    assert.equal(wav.readUInt32LE(24), 22_050);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.toString("ascii", 36, 40), "data");

    const dataBytes = wav.readUInt32LE(40);
    const sampleCount = dataBytes / 2;
    assert.equal(sampleCount, 132_300);
    assert.equal(sampleCount / 22_050, 6);
    assert.equal(wav.length, 264_644);
  }
});

test("week 13 visual assets have the documented pixel dimensions", async () => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const expectedDimensions = new Map([
    ["week-13-sound-four-views.png", [1_440, 1_200]],
    ["week-13-sound-pattern-poster-example.png", [1_600, 2_200]],
  ]);

  for (const [filename, [expectedWidth, expectedHeight]] of expectedDimensions) {
    const png = await readFile(resolve(assetRoot, filename));
    assert.deepEqual(png.subarray(0, 8), pngSignature);
    assert.equal(png.toString("ascii", 12, 16), "IHDR");
    assert.equal(png.readUInt32BE(16), expectedWidth);
    assert.equal(png.readUInt32BE(20), expectedHeight);
    assert.ok(png.length > 100_000, `${filename} should contain a rendered visual`);
  }
});

test("period 2 includes complete cells and fixed numerical verification", async () => {
  const period2 = await readFile(
    resolve(lessonRoot, "week-13-period2.html"),
    "utf8",
  );
  const codeBlocks = [...period2.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(
    ([, code]) => code,
  );

  assert.equal(codeBlocks.length, 9);
  assert.match(codeBlocks[1], /original_sha256/);
  assert.match(codeBlocks[2], /y, sr = librosa\.load\(/);
  assert.match(codeBlocks[3], /peak_sample_index == 111_340/);
  assert.match(codeBlocks[4], /len\(rms_df\) == 259/);
  assert.match(codeBlocks[5], /stft_matrix\.shape == \(1_025, 259\)/);
  assert.match(codeBlocks[6], /figsize=\(8, 11\)/);
  assert.match(codeBlocks[7], /saved_poster_size == \(1_600, 2_200\)/);
  assert.match(codeBlocks[8], /common_reference = max\(/);

  for (const code of codeBlocks) {
    assert.doesNotMatch(code, /TODO|implement here|rest of code|similar to above/iu);
    assert.doesNotMatch(code, /^\s*\.\.\.\s*$/mu);
  }
});

test("period 3 is a substantial goal-based handout linked from the course sequence", async () => {
  const [courseIndex, period2, period3] = await Promise.all([
    readFile(courseIndexPath, "utf8"),
    readFile(resolve(lessonRoot, "week-13-period2.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period3.html"), "utf8"),
  ]);

  assert.match(
    courseIndex,
    /href="week-13-period3\.html">사운드 패턴 포스터 미션 ↗<\/a>/,
  );
  assert.match(period2, /href="week-13-period3\.html" rel="next"/);
  assert.match(period3, /href="week-13-period2\.html" rel="prev"/);
  assert.match(period3, /href="week-14-period1\.html" rel="next"/);
  assert.match(
    period3,
    /13주차 3교시: 사운드 패턴 포스터와 기말 프로젝트 씨앗 미션/,
  );
  assert.match(period3, /PASS와 세 파일 제출이 끝을 결정한다/);
  assert.match(period3, /19 PASS \+ IPYNB \+ PNG \+ HTML = 즉시 귀가/);
  assert.match(period3, /학생이 수정하는 곳은 <code>EDIT<\/code>가 표시된 STEP 1과 STEP 6뿐/);

  for (const range of [
    "0-5분",
    "5-11분",
    "11-18분",
    "18-26분",
    "26-34분",
    "34-40분",
    "40-43분",
    "43-45분",
    "45-48분",
    "48-50분",
  ]) {
    assert.ok(period3.includes(range), `period 3 should include ${range}`);
  }

  for (const filename of [
    "week13_학번_이름.ipynb",
    "week13_학번_이름_sound_poster.png",
    "week13_학번_이름_project_seed.html",
  ]) {
    assert.ok(period3.includes(filename));
  }

  const criteria = period3.match(
    /<ol class="completion-criteria"[^>]*>([\s\S]*?)<\/ol>/,
  );
  assert.ok(criteria);
  assert.equal((criteria[1].match(/<li>/g) ?? []).length, 19);
  assert.equal((period3.match(/<li><span>\d{2}<\/span>/g) ?? []).length, 9);
  assert.ok(
    (period3.match(/<details class="callout callout-question">/g) ?? []).length >=
      20,
  );
  assert.ok((await stat(resolve(lessonRoot, "week-13-period3.html"))).size > 60_000);
});

test("period 3 supplies a complete self-checking notebook with exactly two edit cells", async () => {
  const notebookPath = resolve(
    assetRoot,
    "week-13-sound-poster-mission.ipynb",
  );
  const notebookText = await readFile(notebookPath, "utf8");
  const notebook = JSON.parse(notebookText);
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");
  const codeSources = codeCells.map((cell) => cell.source.join(""));
  const allSource = notebook.cells.map((cell) => cell.source.join("")).join("\n");

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.cells.length, 20);
  assert.equal(codeCells.length, 10);
  assert.equal(
    codeSources.filter((source) => source.includes("· EDIT")).length,
    2,
  );
  assert.match(codeSources[0], /librosa": "0\.11\.0"/);
  assert.match(codeSources[0], /soundfile": "0\.13\.1"/);
  assert.match(codeSources[0], /compressed_wav_base64/);
  assert.match(codeSources[1], /audio_choice = "regular_pulses"/);
  assert.match(codeSources[2], /librosa\.load\(source_path, sr=None, mono=True\)/);
  assert.match(codeSources[3], /np\.argmax\(np\.abs\(y\)\)/);
  assert.match(codeSources[4], /frame_length = 2_048/);
  assert.match(codeSources[4], /hop_length = 512/);
  assert.match(codeSources[5], /librosa\.amplitude_to_db\(magnitude, ref=np\.max, top_db=80\)/);
  assert.match(codeSources[6], /project_medium = "sound"/);
  assert.match(codeSources[7], /figsize=\(8, 11\), dpi=200/);
  assert.match(codeSources[7], /html\.escape|escape\(/);
  assert.match(codeSources[8], /WEEK 13 SOUND POSTER MISSION COMPLETE/);
  assert.equal((codeSources[8].match(/^\s*check\(/gm) ?? []).length, 19);

  for (const audioId of [
    "regular_pulses",
    "rising_tone",
    "alternating_bands",
  ]) {
    assert.ok(allSource.includes(audioId));
  }
  for (const marker of [
    "TODO",
    "implement here",
    "rest of code",
    "similar to above",
  ]) {
    const humanReadableSource = allSource
      .split("\n")
      .filter((line) => line.length < 500)
      .join("\n");
    assert.doesNotMatch(humanReadableSource, new RegExp(marker, "iu"));
  }

  assert.ok((await stat(notebookPath)).size > 500_000);
});

test("the project seed example is a complete accessible handoff to week 14", async () => {
  const seedPath = resolve(assetRoot, "week-13-project-seed-example.html");
  const seed = await readFile(seedPath, "utf8");

  assert.match(seed, /<html lang="ko">/);
  assert.match(seed, /<meta name="description"/);
  assert.match(seed, /<link rel="canonical"/);
  assert.match(seed, /본문 바로가기/);
  for (const label of [
    "입력 자료",
    "출처와 이용 권한",
    "변환 또는 시각화 규칙",
    "최종 출력 형식",
    "14주차 첫 제작 행동",
  ]) {
    assert.ok(seed.includes(label));
  }
  assert.match(seed, /질문 → 입력 → 규칙 → 출력/);
  assert.ok((await stat(seedPath)).size > 4_000);
});

test("week 13 keeps its visual system readable on small screens", async () => {
  const [css, ui, period1, period2, period3] = await Promise.all([
    readFile(teachingCssPath, "utf8"),
    readFile(week13UiPath, "utf8"),
    readFile(resolve(lessonRoot, "week-13-period1.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period2.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period3.html"), "utf8"),
  ]);

  for (const lesson of [period1, period2, period3]) {
    assert.match(lesson, /<html lang="ko" class="week-13-root">/);
    assert.match(
      lesson,
      /<body class="teaching-document course-contents-programming week-13-document">/,
    );
    assert.match(lesson, /<details class="toc week-13-toc" open>/);
    assert.match(
      lesson,
      /<script src="\/assets\/week-13-ui\.js" defer><\/script>[\s\S]*?<script src="\/assets\/details-motion\.js" defer><\/script>/,
    );
    assert.doesNotMatch(lesson, /assets\/python-data-art\.svg/);
  }

  assert.match(
    css,
    /body\.week-13-document \.article img\s*{[^}]*max-width:\s*100%;[^}]*height:\s*auto;/,
  );
  assert.match(
    css,
    /body\.week-13-document \.article h2::before\s*{[^}]*content:\s*none;/,
  );
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*?body\.week-13-document \.doc-card\s*{[^}]*display:\s*block;/,
  );
  assert.match(ui, /matchMedia\("\(max-width: 980px\)"\)/);
  assert.match(ui, /toc\.removeAttribute\("open"\)/);

  assert.equal(
    (period1.match(/<audio[^>]+aria-label="[^"]+"/g) ?? []).length,
    4,
  );
});

test("period 3 exposes one measurable, persistent nineteen-step finish line", async () => {
  const [css, ui, period3] = await Promise.all([
    readFile(teachingCssPath, "utf8"),
    readFile(week13UiPath, "utf8"),
    readFile(resolve(lessonRoot, "week-13-period3.html"), "utf8"),
  ]);

  assert.match(period3, /class="goal-contract-copy"/);
  assert.match(period3, /class="exit-pass"[^>]*>PASS<\/span>/);
  assert.equal((period3.match(/class="exit-gate-copy"/g) ?? []).length, 2);
  assert.match(period3, /data-mission-progress data-complete="false"/);
  assert.match(period3, /aria-live="polite">완료 0\/19<\/strong>/);
  assert.match(period3, /data-mission-checklist/);
  assert.equal(
    (period3.match(/class="completion-check"[^>]+type="checkbox"/g) ?? [])
      .length,
    19,
  );
  assert.match(ui, /contents-programming-week13-checklist-v1/);
  assert.match(ui, /localStorage\.getItem/);
  assert.match(ui, /localStorage\.setItem/);
  assert.match(css, /body\.week-13-document \.mission-progress/);

  const stepRanges = [
    ...period3.matchAll(
      /<h2 id="step-[^"]+">[^<]*(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*?<small>(\d+)-(\d+)분<\/small><\/h2>/g,
    ),
  ].map(([, start, end]) => [Number(start), Number(end)]);

  assert.equal(stepRanges.length, 11);
  for (let index = 1; index < stepRanges.length; index += 1) {
    assert.equal(
      stepRanges[index][0],
      stepRanges[index - 1][1],
      "step headings should form one continuous, non-overlapping route",
    );
  }
  assert.deepEqual(stepRanges.at(-1), [48, 50]);
});

test("week 13 visuals speak the same Korean editorial language as the lesson", async () => {
  const [generator, period1, period2, period3, seed] = await Promise.all([
    readFile(soundAssetGeneratorPath, "utf8"),
    readFile(resolve(lessonRoot, "week-13-period1.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period2.html"), "utf8"),
    readFile(resolve(lessonRoot, "week-13-period3.html"), "utf8"),
    readFile(resolve(assetRoot, "week-13-project-seed-example.html"), "utf8"),
  ]);

  for (const label of [
    "한 소리, 네 가지 데이터 화면",
    "파형",
    "프레임 RMS",
    "상대 스펙트로그램",
    "관찰 근거",
    "해석의 한계",
  ]) {
    assert.ok(generator.includes(label), `asset generator should include ${label}`);
  }
  assert.doesNotMatch(generator, /SUPPORTED OBSERVATIONS|READING LIMIT/);

  assert.match(
    period1,
    /og:image" content="[^"]*week-13-sound-four-views\.png"/,
  );
  for (const lesson of [period2, period3]) {
    assert.match(
      lesson,
      /og:image" content="[^"]*week-13-sound-pattern-poster-example\.png"/,
    );
  }

  assert.match(seed, /class="project-brief"/);
  assert.match(seed, /class="brief-fields"/);
  assert.match(seed, /class="next-action"/);
  assert.doesNotMatch(seed, /<h2>0[1-5] \/ /);
  assert.doesNotMatch(seed, /class="grid"/);
});
