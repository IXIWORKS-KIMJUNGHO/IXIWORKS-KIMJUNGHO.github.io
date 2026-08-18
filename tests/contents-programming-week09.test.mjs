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
  "week-09-data-reading-card-example.png",
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
    assert.match(html, /\+ 10 MIN EXTENSION/);
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
    /week-09-observation-to-table\.png/,
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
    /week-09-dataframe-anatomy\.png/,
    /week-09-data-reading-card-example\.png/,
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
    /week-09-data-reading-card-example\.png/,
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
    /DATA READING CARD/,
    /24 rows/,
    /10 columns/,
    /ANSWERABLE QUESTION/,
    /NOT ANSWERABLE YET/,
    /READ BEFORE VISUALIZE/,
    /<html lang="en">/,
  ]) {
    assert.match(sampleCard, pattern);
  }
  assert.match(sampleCard, /<div class="question">/);
  assert.doesNotMatch(sampleCard, /<(?:article|section) class="question/);
  assert.doesNotMatch(sampleCard, /필요한 열|답할 수 있는 질문|아직 답할 수 없는 질문/);

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
  assert.match(generator, /def make_reading_card/);
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
