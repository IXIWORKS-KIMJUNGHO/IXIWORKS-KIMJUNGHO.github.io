import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(
  root,
  "teaching",
  "contents-programming",
  "index.html",
);
const courseDirectory = resolve(root, "teaching", "contents-programming");
const week9GeneratedFilenames = [
  "week-09-creative-activity.csv",
  "week-09-data-literacy-mission.ipynb",
  "week-09-observation-to-table.png",
  "week-09-dataframe-anatomy.png",
  "week-09-data-reading-card-example.html",
];
const week9PngFilenames = week9GeneratedFilenames.filter((filename) =>
  filename.endsWith(".png")
);

test("Contents Programming week 9 introduces data as recorded and situated material", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week9Match = courseIndex.match(
    /<section class="week-group" id="week-09"[\s\S]*?<\/section>/,
  );

  assert.ok(week9Match, "the course index should include week 9");
  const week9 = week9Match[0];
  const lessonSections = new Map(
    [...week9.matchAll(/<p><strong>([^<]+)<\/strong>([\s\S]*?)<\/p>/g)].map(
      ([, label, content]) => [label, content],
    ),
  );

  assert.match(
    week9,
    /<h3>중간 프로젝트에서 데이터 아트로: 관찰을 표로 바꾸기<\/h3>/,
  );
  assert.equal(lessonSections.size, 5);

  const requiredConceptsBySection = new Map([
    [
      "8주차 연결",
      ["생성 포스터 시리즈", "매개변수", "행", "열"],
    ],
    [
      "1교시 · 데이터는 발견되는가, 만들어지는가",
      [
        "관찰 단위",
        "변수",
        "값",
        "메타데이터",
        "Dear Data",
        "The Library of Missing Datasets",
        "선택",
        "누락",
        "중립",
      ],
    ],
    [
      "2교시 · CSV와 DataFrame의 구조 읽기",
      [
        "행",
        "열",
        "헤더",
        "인덱스",
        "수치",
        "범주",
        "문자열",
        "날짜",
        "결측값",
        "pd.read_csv()",
        "head()",
        "shape",
        "columns",
        "dtypes",
        "isna().sum()",
        "시각화와 통계 계산보다",
        "무엇을 담고 있는지",
      ],
    ],
    [
      "3교시 · 목표 달성형 개인 실습",
      [
        "수업용 창작 활동 기록 CSV",
        "원본을 수정하지",
        "제목",
        "출처",
        "이용 조건",
        "관찰 단위",
        "시간 범위",
        "답할 수 있는 질문",
        "답할 수 없는 질문",
        "자동 검사 PASS",
        "Colab 노트북",
        "데이터 읽기 카드 HTML",
        "두 파일 제출",
        "즉시 귀가",
      ],
    ],
    [
      "10주차 연결",
      ["수집 단위", "열", "자료형", "개인정보"],
    ],
  ]);

  for (const [section, requiredConcepts] of requiredConceptsBySection) {
    const content = lessonSections.get(section);
    assert.ok(content, `week 9 should include the ${section} section`);
    for (const concept of requiredConcepts) {
      assert.ok(
        content.includes(concept),
        `${section} should include ${concept}`,
      );
    }
  }

  assert.match(
    week9,
    /<span class="assignment-label">제출 · CSV 탐색 Colab 노트북 및 데이터 읽기 카드 HTML<\/span>/,
  );
  assert.doesNotMatch(week9, /짝 활동|짝과|조별 활동/);
});

test("Contents Programming week 9 theory lessons explain situated data and table structure for beginners", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period1 = await readFile(
    resolve(courseDirectory, "week-09-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-09-period2.html"),
    "utf8",
  );

  for (const lesson of ["period1", "period2", "period3"]) {
    assert.match(courseIndex, new RegExp(`href="week-09-${lesson}\\.html"`));
  }
  assert.match(period1, /href="week-09-period2\.html" rel="next"/);
  assert.match(period2, /href="week-09-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-09-period3\.html" rel="next"/);

  for (const [html, timeRanges] of [
    [
      period1,
      ["0-6분", "6-15분", "15-25분", "25-35분", "35-43분", "43-50분", "50-60분"],
    ],
    [
      period2,
      ["0-5분", "5-14분", "14-25분", "25-35분", "35-44분", "44-50분", "50-60분"],
    ],
  ]) {
    for (const timeRange of timeRanges) {
      assert.match(html, new RegExp(timeRange));
    }
    assert.doesNotMatch(html, /짝 활동|짝과|조별 활동/);
    assert.ok(
      [...html.matchAll(/<details\b/gi)].length >= 5,
      "each week 9 theory lesson should include individual answer checks",
    );
    assert.match(html, /확장 10분/);
    assert.match(html, /기본 50분 \/ 확장 60분/);
    assert.match(html, /수업 후 개별 복습/);
  }

  for (const pattern of [
    /8주차.*생성 포스터.*매개변수.*행.*열/s,
    /데이터.*질문.*관찰.*기록/s,
    /관찰 단위.*변수.*값.*메타데이터/s,
    /사실.*해석.*구분/s,
    /Dear Data/,
    /The Library of Missing Datasets/,
    /선택.*누락.*중립/s,
    /class="observation-flow-diagram"/,
    /class="case-lens-visual"/,
    /https:\/\/www\.dear-data\.com\/theproject/,
    /https:\/\/www\.moma\.org\/collection\/works\/215813/,
    /https:\/\/www\.mimionuoha\.com\//,
    /https:\/\/art21\.org\/artist\/mimi-onuoha\//,
  ]) {
    assert.match(period1, pattern);
  }

  for (const pattern of [
    /CSV.*쉼표.*텍스트 파일/s,
    /DataFrame.*2차원.*표/s,
    /행.*열.*헤더.*인덱스.*셀/s,
    /수치.*범주.*문자열.*날짜/s,
    /결측값.*0.*같지/s,
    /pd\.read_csv\(\).*head\(\).*shape.*columns.*dtypes.*isna\(\)\.sum\(\)/s,
    /시각화와 통계 계산보다.*구조.*확인/s,
    /class="dataframe-anatomy-diagram"/,
    /class="reading-card-preview"/,
    /week-09-data-reading-card-example\.html/,
    /week-09-creative-activity\.csv/,
    /https:\/\/pandas\.pydata\.org\/docs\/reference\/api\/pandas\.read_csv\.html/,
    /https:\/\/data\.seoul\.go\.kr\//,
    /3교시 고정 미션 계약/,
    /데이터 읽기 카드.*HTML/s,
  ]) {
    assert.match(period2, pattern);
  }
});

test("Contents Programming week 9 period 3 produces a verified data reading card", async () => {
  const period3 = await readFile(
    resolve(courseDirectory, "week-09-period3.html"),
    "utf8",
  );
  const notebook = JSON.parse(
    await readFile(
      resolve(courseDirectory, "assets", "week-09-data-literacy-mission.ipynb"),
      "utf8",
    ),
  );
  const notebookCode = notebook.cells
    .filter((cell) => cell.cell_type === "code")
    .flatMap((cell) => cell.source)
    .join("");
  const sampleCsv = await readFile(
    resolve(courseDirectory, "assets", "week-09-creative-activity.csv"),
    "utf8",
  );
  const sampleCard = await readFile(
    resolve(
      courseDirectory,
      "assets",
      "week-09-data-reading-card-example.html",
    ),
    "utf8",
  );

  assert.match(period3, /href="week-09-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동/);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 8,
    "the week 9 mission should include on-demand beginner help",
  );
  for (const timeRange of [
    "0-6분",
    "6-12분",
    "12-20분",
    "20-30분",
    "30-38분",
    "38-44분",
    "44-48분",
    "48-50분",
  ]) {
    assert.match(period3, new RegExp(timeRange));
  }
  for (const pattern of [
    /목표 달성형 개인 실습/,
    /자동 검사 PASS.*두 파일 제출.*즉시 귀가/s,
    /week-09-data-literacy-mission\.ipynb/,
    /week-09-creative-activity\.csv/,
    /week09_학번_이름\.ipynb/,
    /week09_학번_이름_data_reading_card\.html/,
    /제목.*출처.*이용 조건.*관찰 단위.*시간 범위/s,
    /행.*열.*자료형.*결측값/s,
    /답할 수 있는 질문.*답할 수 없는 질문/s,
    /자동 검사는 질문의 미적 취향을 채점하지 않는다/,
    /WEEK 09 DATA READING COMPLETE/,
    /작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다/,
    /class="quick-start"/,
    /href="#step-zero"/,
    /class="reading-card-preview"/,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  ]) {
    assert.match(period3, pattern);
  }

  assert.equal(notebook.nbformat, 4);
  assert.equal(
    notebook.cells.filter((cell) => cell.cell_type === "code").length,
    6,
  );
  for (const pattern of [
    /import pandas as pd/,
    /pd\.read_csv\(source_path\)/,
    /df\.head\(\)/,
    /df\.shape/,
    /df\.columns/,
    /df\.dtypes/,
    /df\.isna\(\)\.sum\(\)/,
    /source_bytes_before/,
    /dataset_title.*dataset_source.*dataset_license.*observation_unit.*time_range/s,
    /answerable_question.*needed_columns.*unanswerable_question.*missing_information/s,
    /selected_row_index.*selected_column.*selected_value_explanation/s,
    /EDIT: 현재 열로 답할 수 있는 질문/,
    /EDIT: 선택한 행·열·값/,
    /not answerable_question\.strip\(\)\.startswith\("EDIT:"\)/,
    /not selected_value_explanation\.strip\(\)\.startswith\("EDIT:"\)/,
    /len\(needed_columns\) >= 1/,
    /<div class="question">/,
    /--coral:#a83e32/,
    /build_data_reading_card/,
    /Path\(output_filename\)\.write_text/,
    /mission_step0_execution = get_ipython\(\)\.execution_count/,
    /mission_final_execution = get_ipython\(\)\.execution_count/,
    /== \(1, 2, 3, 4, 5, 6\)/,
    /WEEK 09 DATA READING COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }
  assert.doesNotMatch(notebookCode, /len\(needed_columns\) >= 2/);
  assert.doesNotMatch(notebookCode, /selected_value_token/);
  assert.doesNotMatch(notebookCode, /<article class="question/);
  assert.doesNotMatch(notebookCode, /CARD_CSS_CUSTOM_PROPERTIES\s*=/);
  assert.doesNotMatch(
    notebookCode,
    /ANSWERABLE QUESTION|NOT ANSWERABLE YET|COLUMNS \/|MISSING VALUES|ONE VALUE IN CONTEXT|READ BEFORE VISUALIZE/,
  );
  assert.match(notebookCode, /답할 수 있는 질문.*아직 답할 수 없는 질문/s);
  assert.match(period3, /질문에 필요한 열 한 개 이상/);

  const csvLines = sampleCsv.trimEnd().split(/\r?\n/);
  assert.equal(csvLines.length, 25, "the sample should contain 24 records");
  assert.equal(
    csvLines[0],
    "record_id,date,activity,duration_min,focus_level,mood_before,mood_after,location_type,used_reference,note",
  );
  assert.match(sampleCsv, /,,/);
  assert.doesNotMatch(csvLines[0], /name|email|phone|address|latitude|longitude/i);

  for (const pattern of [
    /<!doctype html>/i,
    /데이터 읽기 카드/,
    /24행/,
    /10열/,
    /답할 수 있는 질문/,
    /아직 답할 수 없는 질문/,
    /시각화 전에 읽기/,
    /<html lang="ko">/,
    /<span>작성자<\/span><strong>20261234 · 김데이터<\/strong>/,
    /<h2>결측값<\/h2>/,
    /<h2>실제 값 읽기<\/h2>/,
    /인덱스 1 · duration_min = 55/,
    /두 번째 창작 활동인 코딩을 55분 동안 진행했다는 뜻입니다/,
  ]) {
    assert.match(sampleCard, pattern);
  }
  assert.match(sampleCard, /<div class="question">/);
  assert.doesNotMatch(sampleCard, /<(?:article|section) class="question/);
  assert.doesNotMatch(sampleCard, /DATA READING CARD|ANSWERABLE QUESTION|NOT ANSWERABLE YET|READ BEFORE VISUALIZE/);
  assert.doesNotMatch(sampleCard, /[—–]/);

  const runtimeCheck = spawnSync(
    "python3",
    [
      resolve(root, "tests", "verify-week09-notebook.py"),
      resolve(
        courseDirectory,
        "assets",
        "week-09-data-literacy-mission.ipynb",
      ),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    runtimeCheck.status,
    0,
    `week 9 notebook runtime scenarios failed:\n${runtimeCheck.stdout}\n${runtimeCheck.stderr}`,
  );
  assert.match(runtimeCheck.stdout, /week09 notebook scenarios PASS/);
});

test("Contents Programming week 9 presentation is localized, responsive, and action-oriented", async () => {
  const lessonFilenames = [
    "week-09-period1.html",
    "week-09-period2.html",
    "week-09-period3.html",
  ];
  const lessons = await Promise.all(
    lessonFilenames.map((filename) =>
      readFile(resolve(courseDirectory, filename), "utf8"),
    ),
  );
  const week9Styles = await readFile(
    resolve(courseDirectory, "assets", "week-09.css"),
    "utf8",
  );
  const week9Navigation = await readFile(
    resolve(courseDirectory, "assets", "week-09-navigation.js"),
    "utf8",
  );
  const shellGenerator = await readFile(
    resolve(root, "scripts", "refresh-teaching-navigation.mjs"),
    "utf8",
  );

  for (const lesson of lessons) {
    assert.match(lesson, /<html lang="ko" class="week-09-page">/);
    assert.match(lesson, /<body class="[^"]*week-09[^"]*">/);
    assert.match(lesson, /href="assets\/week-09\.css"/);
    assert.match(lesson, /src="assets\/week-09-navigation\.js" defer/);
    assert.match(lesson, /<details class="toc lesson-toc" open>/);
    assert.match(lesson, /<summary class="toc-title">이 페이지의 목차<\/summary>/);
    assert.match(lesson, /<nav class="toc-links" aria-label="단원 바로가기">/);
    assert.match(lesson, /<span class="sequence-label">이전<\/span>/);
    assert.match(lesson, /<span class="sequence-label">다음<\/span>/);
    assert.doesNotMatch(lesson, /On this page|Lesson Spec|Mission Spec/);
    assert.doesNotMatch(lesson, /<img[^>]+week-09-(?:observation-to-table|dataframe-anatomy|data-reading-card-example)\.png/);
    assert.doesNotMatch(lesson, /[—–]/);
  }

  assert.match(
    lessons[0],
    /class="diagram-mini-row" role="group" aria-label="표에 추가된 한 행"/,
  );
  assert.match(
    lessons[1],
    /class="anatomy-legend" role="list" aria-label="표 구조 강조 표시 설명"/,
  );
  assert.match(lessons[1], /<span role="listitem"><strong>헤더<\/strong>/);

  assert.match(week9Styles, /html\.week-09-page\s*\{[^}]*scroll-behavior:\s*auto/s);
  assert.match(week9Styles, /\.week-09[^\n]*h2\[id\][^\n]*h3\[id\]/);
  assert.match(week9Styles, /scroll-margin-top:\s*8[0-9]px/);
  assert.match(week9Styles, /\.toc a\[aria-current="location"\]/);
  assert.match(week9Styles, /@media \(max-width:\s*980px\)/);
  assert.match(week9Styles, /\.observation-flow-diagram/);
  assert.match(week9Styles, /\.dataframe-anatomy-diagram/);
  assert.match(week9Styles, /@media \(prefers-color-scheme:\s*dark\)/);
  assert.match(week9Styles, /@media print/);
  assert.match(week9Styles, /details:not\(\[open\]\)\s*>\s*\.details-motion-content/);
  assert.match(
    week9Styles,
    /@media \(hover: none\), \(pointer: coarse\)[\s\S]*?\.toc a\[aria-current="location"\][\s\S]*?background:\s*var\(--accent-soft\)\s*!important[\s\S]*?color:\s*var\(--accent-strong\)\s*!important/,
  );
  const quickStartStyles = week9Styles.match(
    /\/\* Put the first lab action above explanatory material\. \*\/[\s\S]*?@media \(hover: hover\)/,
  )?.[0];
  assert.ok(quickStartStyles, "week 9 should define quick-start styles");
  assert.match(quickStartStyles, /var\(--accent(?:-strong)?\)/);
  assert.doesNotMatch(quickStartStyles, /var\(--success-ink\)/);

  assert.match(week9Navigation, /IntersectionObserver/);
  assert.match(week9Navigation, /aria-current/);
  assert.match(week9Navigation, /matchMedia\("\(max-width: 980px\)"\)/);
  assert.match(week9Navigation, /function syncTocToViewport\(mediaQuery\)/);
  assert.doesNotMatch(week9Navigation, /syncTocToViewport\(event\)/);
  assert.doesNotMatch(week9Navigation, /addEventListener\(["']scroll["']/);

  assert.match(
    shellGenerator,
    /usesKoreanCopy\s*=\s*course === "contents-programming"/,
  );
  assert.match(shellGenerator, /navigationLabel:\s*"강의 이동"/);
  assert.match(shellGenerator, /previousText:\s*"이전"/);
  assert.match(shellGenerator, /nextText:\s*"다음"/);
});

test("Contents Programming week 9 declares deterministic asset inputs", async () => {
  const generatorPath = resolve(root, "scripts", "generate-week09-data-assets.py");
  const generator = await readFile(
    generatorPath,
    "utf8",
  );
  const requirements = await readFile(
    resolve(root, "requirements-week09-assets.txt"),
    "utf8",
  );

  for (const filename of week9GeneratedFilenames) {
    assert.match(generator, new RegExp(filename.replaceAll(".", "\\.")));
  }
  assert.match(generator, /def make_observation_to_table/);
  assert.match(generator, /def make_dataframe_anatomy/);
  assert.doesNotMatch(generator, /def make_reading_card/);
  assert.doesNotMatch(generator, /week-09-data-reading-card-example\.png/);
  assert.match(generator, /def render_data_reading_card/);
  assert.match(generator, /inspect\.getsource\(render_data_reading_card\)/);
  assert.match(generator, /PROVIDED_DATASET_METADATA/);
  assert.equal(
    generator.match(/수업용 예시 데이터 - 교수자 제공/g)?.length,
    1,
    "provided metadata should have one source of truth",
  );
  assert.match(generator, /inter-latin-variable\.woff2/);
  assert.match(generator, /def parse_visual_runtime_requirements/);
  assert.match(generator, /--check-runtime/);
  assert.doesNotMatch(generator, /^PILLOW_VERSION\s*=|^FREETYPE_VERSION\s*=/m);
  assert.match(generator, /CORAL = CARD_COLORS\["coral"\]/);
  assert.match(generator, /GOLD_TEXT = \(139, 94, 0, 255\)/);
  assert.match(generator, /CARD_CSS_CUSTOM_PROPERTIES/);
  assert.doesNotMatch(generator, /System\/Library\/Fonts|DejaVuSans/);
  assert.match(requirements, /^Pillow==\d+\.\d+\.\d+$/m);
  assert.match(requirements, /^# FreeType==\d+\.\d+\.\d+/m);
});

test("Contents Programming week 9 generated assets stay reproducible", async (t) => {
  const generatorPath = resolve(root, "scripts", "generate-week09-data-assets.py");
  const runtimeProbe = spawnSync(
    "python3",
    [generatorPath, "--check-runtime"],
    { cwd: root, encoding: "utf8" },
  );
  if (runtimeProbe.status !== 0) {
    if (process.env.WEEK09_STRICT_ASSET_TEST === "1") {
      assert.fail(
        `pinned Week 9 visual runtime is unavailable:\n${runtimeProbe.stdout}\n${runtimeProbe.stderr}`,
      );
    }
    t.skip(
      "install the pinned visual toolchain with `npm run setup:week09-assets`",
    );
    return;
  }

  const outputDirectory = await mkdtemp(join(tmpdir(), "week09-assets-"));
  try {
    const generated = spawnSync(
      "python3",
      [generatorPath, "--asset-dir", outputDirectory],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(
      generated.status,
      0,
      `week 9 asset generation failed:\n${generated.stdout}\n${generated.stderr}`,
    );
    for (const filename of week9GeneratedFilenames.filter(
      (candidate) => !candidate.endsWith(".png"),
    )) {
      const [expected, actual] = await Promise.all([
        readFile(resolve(courseDirectory, "assets", filename)),
        readFile(resolve(outputDirectory, filename)),
      ]);
      assert.deepEqual(actual, expected, `${filename} should regenerate byte-for-byte`);
    }
    const pixelComparison = spawnSync(
      "python3",
      [
        resolve(root, "tests", "compare-week09-png.py"),
        ...week9PngFilenames.flatMap((filename) => [
          resolve(courseDirectory, "assets", filename),
          resolve(outputDirectory, filename),
        ]),
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(
      pixelComparison.status,
      0,
      `week 9 PNG pixels differ:\n${pixelComparison.stdout}\n${pixelComparison.stderr}`,
    );
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
