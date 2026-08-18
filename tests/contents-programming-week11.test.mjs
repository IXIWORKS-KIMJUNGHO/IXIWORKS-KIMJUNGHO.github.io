import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const courseIndexPath = resolve(courseDirectory, "index.html");

function assertIncludesAll(source, requiredValues) {
  for (const value of requiredValues) {
    assert.ok(source.includes(value), `expected the lesson to include “${value}”`);
  }
}

function assertTimeline(source, expectedRanges) {
  const sessionGrid = source.match(
    /<ul class="session-grid[^"]*"[\s\S]*?<\/ul>/,
  );

  assert.ok(sessionGrid, "the lesson should publish a session timeline");
  const ranges = [...sessionGrid[0].matchAll(/(\d+)-(\d+)분/g)].map(
    ([, start, end]) => [Number(start), Number(end)],
  );
  assert.deepEqual(ranges, expectedRanges);

  for (const [start, end] of ranges) {
    assert.ok(end > start, "every time block should have a positive duration");
  }
  for (let index = 1; index < ranges.length; index += 1) {
    assert.equal(ranges[index][0], ranges[index - 1][1]);
  }
}

test("Contents Programming week 11 period 1 teaches beginners to choose an honest visual encoding", async () => {
  const [period1, courseIndex] = await Promise.all([
    readFile(resolve(courseDirectory, "week-11-period1.html"), "utf8"),
    readFile(courseIndexPath, "utf8"),
  ]);

  const lessonOrder = [
    ...new Set(
      [...courseIndex.matchAll(/href="(week-\d+-period\d+\.html)"/g)].map(
        ([, href]) => href,
      ),
    ),
  ];
  const currentIndex = lessonOrder.indexOf("week-11-period1.html");
  assert.ok(currentIndex > 0, "week 11 period 1 should follow a published lesson");
  const previousLessonName = lessonOrder[currentIndex - 1];
  const previousLesson = await readFile(
    resolve(courseDirectory, previousLessonName),
    "utf8",
  );

  assert.match(previousLesson, /href="week-11-period1\.html" rel="next"/);
  assert.match(
    period1,
    new RegExp(`href="${previousLessonName.replaceAll(".", "\\.")}" rel="prev"`),
  );
  assert.match(period1, /href="week-11-period2\.html" rel="next"/);
  assertTimeline(period1, [
    [0, 6],
    [6, 15],
    [15, 25],
    [25, 35],
    [35, 44],
    [44, 50],
    [50, 60],
  ]);
  assert.ok(
    [...period1.matchAll(/<details\b/gi)].length >= 8,
    "period 1 should include at least eight individual beginner checks",
  );
  assert.doesNotMatch(period1, /짝 활동|짝과|조별|팀 활동/);

  assertIncludesAll(period1, [
    "질문을 시각적 인코딩으로 번역하기",
    "비교 질문",
    "분포 질문",
    "관계 질문",
    "공간 질문",
    "가로 막대그래프",
    "히스토그램",
    "관계 산점도",
    "좌표 산점도",
    "duration_min",
    "focus_level",
    "경도와 위도의 상관관계",
    "위치",
    "길이",
    "색상",
    "크기",
    "문자",
    "0에서 시작",
    "분모",
    "결측값",
    "W.E.B. Du Bois",
    "1900년 파리 만국박람회",
    "Library of Congress",
    "week-11-question-to-chart.png",
    "week-11-honest-chart-cases.png",
    "+ 10 MIN EXTENSION",
    "기본 50분 / 확장 60분",
    "수업 후 개별 복습",
  ]);
  assert.match(
    period1,
    /https:\/\/www\.loc\.gov\/pictures\/item\/2005679642\/" target="_blank" rel="noopener noreferrer"/,
  );
});

test("Contents Programming week 11 period 2 builds two readable charts and one poster step by step", async () => {
  const [period1, period2] = await Promise.all([
    readFile(resolve(courseDirectory, "week-11-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-11-period2.html"), "utf8"),
  ]);

  assert.match(period1, /href="week-11-period2\.html" rel="next"/);
  assert.match(period2, /href="week-11-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-11-period3\.html" rel="next"/);
  assertTimeline(period2, [
    [0, 7],
    [7, 18],
    [18, 28],
    [28, 37],
    [37, 45],
    [45, 50],
    [50, 60],
  ]);
  assert.ok(
    [...period2.matchAll(/<details\b/gi)].length >= 10,
    "period 2 should include at least ten individual beginner checks",
  );
  assert.doesNotMatch(period2, /짝 활동|짝과|조별|팀 활동/);

  assertIncludesAll(period2, [
    "Matplotlib·Seaborn으로 그래프와 포스터 구성하기",
    "Figure",
    "Axes",
    "Axis",
    "fig, axes = plt.subplots",
    "groupby",
    "sort_values",
    "reset_index",
    "문화센터",
    "400",
    "도서관",
    "369",
    "박물관",
    "326",
    "sns.barplot",
    "errorbar=None",
    "관계 산점도",
    "duration_min",
    "focus_level",
    "원인",
    "좌표 산점도",
    "longitude",
    "latitude",
    "hue",
    "style",
    "size",
    "경도와 위도의 상관관계로 해석하지 않습니다",
    "색상과 표식 모양",
    "질문형 제목",
    "핵심 관찰",
    "해석의 한계",
    "데이터 출처",
    "figsize=(8, 11)",
    "dpi=200",
    "1600 × 2200",
    "savefig",
    "week-11-figure-axes.png",
    "week-11-data-poster-example.png",
    "3교시 고정 미션 계약",
    "+ 10 MIN EXTENSION",
    "기본 50분 / 확장 60분",
    "수업 후 개별 복습",
  ]);
  for (const href of [
    "https://matplotlib.org/stable/users/explain/axes/index.html",
    "https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.savefig.html",
    "https://seaborn.pydata.org/generated/seaborn.barplot.html",
    "https://seaborn.pydata.org/generated/seaborn.scatterplot.html",
  ]) {
    assert.match(
      period2,
      new RegExp(
        `href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" target="_blank" rel="noopener noreferrer"`,
      ),
    );
  }
});

test("Contents Programming week 11 period 3 is a finite individual data-poster mission", async () => {
  const [period2, period3] = await Promise.all([
    readFile(resolve(courseDirectory, "week-11-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-11-period3.html"), "utf8"),
  ]);

  assert.match(period2, /href="week-11-period3\.html" rel="next"/);
  assert.match(period3, /href="week-11-period2\.html" rel="prev"/);
  assertTimeline(period3, [
    [0, 5],
    [5, 12],
    [12, 22],
    [22, 32],
    [32, 41],
    [41, 46],
    [46, 50],
  ]);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 14,
    "period 3 should include at least fourteen beginner troubleshooting checks",
  );
  assert.doesNotMatch(period3, /짝 활동|짝과|조별|팀 활동/);

  assertIncludesAll(period3, [
    "목표 달성형 개인 실습",
    "자동 검사 PASS + 두 파일 제출·제목 확인 = 즉시 귀가",
    "작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다",
    "week-11-data-poster-mission.ipynb",
    "week-11-public-facilities-clean.csv",
    "week-11-data-poster-example.png",
    "week11_학번_이름.ipynb",
    "week11_학번_이름_data_poster.png",
    "24행",
    "도서관 8개",
    "박물관 8개",
    "문화센터 8개",
    "박물관 326",
    "도서관 369",
    "문화센터 400",
    "막대 3개",
    "점 24개",
    "서로 다른 HEX 색상",
    "색상과 표식 모양",
    "1600 × 2200",
    "질문형 제목",
    "데이터 단서",
    "근거 없는 평가어",
    "줄바꿈 없이 한 줄",
    "줄바꿈 없이 각각 한 줄",
    "제목의 의미는 교수 확인",
    "관찰 문장",
    "해석의 한계",
    "데이터 출처",
    "기준일",
    "새 런타임",
    "모두 실행",
    "준비 · 노트북 사본 저장과 파일명 변경",
    "기준 실행 · STEP 0부터 STEP 7까지 한 번 실행",
    "STEP 1 · 제출 정보와 질문형 제목 작성",
    "STEP 1 계속 · 세 범주의 HEX 색상 정하기",
    "STEP 2와 3 · 24행과 범주별 합계 검증",
    "STEP 4 · 막대 3개와 점 24개 읽기",
    "STEP 5 · 관찰 문장과 해석의 한계 작성",
    "STEP 6 · 1600 × 2200 PNG 저장과 육안 점검",
    "STEP 7 · 새 런타임 모두 실행과 FINAL CHECK",
    "제출 · 두 파일 확인 후 즉시 귀가",
    "category_palette",
    "WEEK 11 DATA POSTER COMPLETE",
    "자동 검사는 미적 취향을 채점하지 않는다",
    "FINAL CHECK 코드는 수정하지 않는다",
    "선택 확장",
    "귀가 조건이 아니며 추가 점수도 없습니다",
    "12주차 연결",
  ]);
  assert.doesNotMatch(period3, /category_colors/);
});

test("Contents Programming week 11 mission notebook contains a self-checking poster workflow", async () => {
  const assetDirectory = resolve(courseDirectory, "assets");
  const notebookPath = resolve(
    assetDirectory,
    "week-11-data-poster-mission.ipynb",
  );
  const notebook = JSON.parse(await readFile(notebookPath, "utf8"));
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");
  const notebookCode = codeCells.flatMap((cell) => cell.source).join("");

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.nbformat_minor, 5);
  assert.equal(codeCells.length, 8);
  assert.equal(
    [...notebookCode.matchAll(/# STEP \d · EDIT/g)].length,
    2,
    "students should edit only STEP 1 and STEP 5",
  );

  for (const pattern of [
    /import pandas as pd/,
    /import seaborn as sns/,
    /import matplotlib\.pyplot as plt/,
    /import hashlib/,
    /def font_has_korean_glyphs/,
    /font_manager\.get_font\(font_path\)/,
    /font_manager\.fontManager\.addfont\(korean_font_path\)/,
    /POSTER_PAPER = "#f3efe5"/,
    /POSTER_INK = "#202523"/,
    /POSTER_MUTED = "#59615e"/,
    /POSTER_CORAL = "#a23d34"/,
    /SAMPLE_CSV_PATH = "week11_public_facilities_clean\.csv"/,
    /Path\(SAMPLE_CSV_PATH\)\.write_text\(SAMPLE_CSV, encoding="utf-8"\)/,
    /EXPECTED_CSV_SHA256 = "[0-9a-f]{64}"/,
    /dataset_source.*dataset_license.*reference_date.*observation_unit/s,
    /expected_metadata = \(/,
    /student_id = "학번".*student_name = "이름"/s,
    /poster_title = "EDIT:/,
    /"도서관": "#6b7280".*"박물관": "#6b7280".*"문화센터": "#6b7280"/s,
    /source_bytes_before = source_path\.read_bytes\(\)/,
    /hashlib\.sha256\(source_bytes_before\)\.hexdigest\(\) == EXPECTED_CSV_SHA256/,
    /facility_df = pd\.read_csv\(source_path\)/,
    /len\(facility_df\) == 24/,
    /facility_df\["category"\]\.nunique\(\) == 3/,
    /groupby\("category", as_index=False\)/,
    /sort_values\("program_count"\)/,
    /reset_index\(drop=True\)/,
    /"박물관": 326.*"도서관": 369.*"문화센터": 400/s,
    /sns\.barplot\(/,
    /errorbar=None/,
    /set_xlim\(left=0\)/,
    /sns\.scatterplot\(/,
    /x="longitude".*y="latitude".*hue="category".*style="category".*size="program_count"/s,
    /sizes=\(60, 300\)/,
    /figsize=\(8, 11\)/,
    /main_observation\s*=\s*\([\s\S]*?"EDIT:/,
    /limitation_statement\s*=\s*\([\s\S]*?"EDIT:/,
    /fig\.savefig\(/,
    /dpi=200/,
    /week11_\{safe_student_id\}_\{safe_student_name\}_data_poster\.png/,
    /== \(1, 2, 3, 4, 5, 6, 7, 8\)/,
    /source_path\.read_bytes\(\) == source_bytes_before/,
    /current_metadata == expected_metadata/,
    /bar_count == 3/,
    /scatter_point_count == len\(facility_df\) == 24/,
    /scatter_unique_colors == 3/,
    /scatter_unique_markers == 3/,
    /scatter_unique_sizes > 1/,
    /scatter_offsets_match_rows/,
    /scatter_colors_follow_category/,
    /scatter_markers_follow_category/,
    /scatter_sizes_follow_program_count/,
    /title_data_terms/,
    /common_unsupported_title_terms/,
    /"학번" not in safe_student_id/,
    /"이름" not in safe_student_name/,
    /poster_title\.strip\(\)\.endswith\(\(\"\?\", \"？\"\)\)/,
    /poster_text_inside_canvas/,
    /footer_blocks_separated/,
    /saved_image\.shape\[:2\] == \(2200, 1600\)/,
    /WEEK 11 DATA POSTER COMPLETE/,
    /제목의 의미는 교수 확인 후 최종 승인/,
    /files\.download\(output_filename\)/,
  ]) {
    assert.match(notebookCode, pattern);
  }
  assert.doesNotMatch(
    notebookCode,
    /TODO|rest of code|similar to above|continue pattern|add more as needed/i,
  );

  const syntaxCheck = spawnSync(
    "python3",
    [
      "-c",
      [
        "import json, sys",
        "notebook = json.load(open(sys.argv[1], encoding='utf-8'))",
        "cells = [cell for cell in notebook['cells'] if cell['cell_type'] == 'code']",
        "[compile(''.join(cell['source']), f'cell-{index}', 'exec') for index, cell in enumerate(cells)]",
        "print('week11 notebook syntax PASS')",
      ].join("\n"),
      notebookPath,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    syntaxCheck.status,
    0,
    `week 11 notebook syntax failed:\n${syntaxCheck.stdout}\n${syntaxCheck.stderr}`,
  );
  assert.match(syntaxCheck.stdout, /week11 notebook syntax PASS/);
});

test("Contents Programming week 11 mission notebook passes and rejects real runtime scenarios", async (t) => {
  const notebookPath = resolve(
    courseDirectory,
    "assets",
    "week-11-data-poster-mission.ipynb",
  );
  const runtimeProbe = spawnSync(
    "python3",
    [resolve(root, "scripts", "generate-week11-data-poster-assets.py"), "--check-runtime"],
    { cwd: root, encoding: "utf8" },
  );
  if (runtimeProbe.status !== 0) {
    if (process.env.WEEK11_STRICT_NOTEBOOK_TEST === "1") {
      assert.fail(
        `the Week 11 notebook runtime is unavailable:\n${runtimeProbe.stdout}\n${runtimeProbe.stderr}`,
      );
    }
    t.skip(
      "install the pinned notebook toolchain with `npm run setup:week11-assets`",
    );
    return;
  }
  assert.match(runtimeProbe.stdout, /matplotlib 3\.10\.8/);
  assert.match(runtimeProbe.stdout, /pandas 2\.3\.3/);
  assert.match(runtimeProbe.stdout, /seaborn 0\.13\.2/);
  assert.match(runtimeProbe.stdout, /Pillow 12\.3\.0/);
  assert.match(runtimeProbe.stdout, /freetype 2\.6\.1/);

  const runtimeCheck = spawnSync(
    "python3",
    [resolve(root, "tests", "verify-week11-notebook.py"), notebookPath],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    runtimeCheck.status,
    0,
    `week 11 notebook runtime scenarios failed:\n${runtimeCheck.stdout}\n${runtimeCheck.stderr}`,
  );
  assert.match(runtimeCheck.stdout, /week11 notebook scenarios PASS/);
});

test("Contents Programming week 11 data and generated visuals stay complete and reproducible", async (t) => {
  const assetDirectory = resolve(courseDirectory, "assets");
  const generatorPath = resolve(
    root,
    "scripts",
    "generate-week11-data-poster-assets.py",
  );
  const generatedFilenames = [
    "week-11-public-facilities-clean.csv",
    "week-11-question-to-chart.png",
    "week-11-honest-chart-cases.png",
    "week-11-figure-axes.png",
    "week-11-data-poster-example.png",
    "week-11-data-poster-mission.ipynb",
  ];
  const generator = await readFile(generatorPath, "utf8");
  const requirements = await readFile(
    resolve(root, "requirements-week11-assets.txt"),
    "utf8",
  );
  const sampleCsv = await readFile(
    resolve(assetDirectory, "week-11-public-facilities-clean.csv"),
    "utf8",
  );
  const csvLines = sampleCsv.trimEnd().split(/\r?\n/);

  assert.equal(csvLines.length, 25, "the clean sample should contain 24 records");
  assert.equal(
    csvLines[0],
    "place_id,place_name,category,program_count,latitude,longitude",
  );
  for (const [category, expectedCount] of [
    ["도서관", 8],
    ["박물관", 8],
    ["문화센터", 8],
  ]) {
    assert.equal(
      csvLines.filter((line) => line.includes(`,${category},`)).length,
      expectedCount,
    );
  }

  for (const filename of generatedFilenames) {
    assert.match(generator, new RegExp(filename.replaceAll(".", "\\.")));
  }
  for (const functionName of [
    "write_clean_csv",
    "make_question_to_chart",
    "make_honest_chart_cases",
    "make_figure_axes",
    "make_data_poster_example",
    "build_notebook",
  ]) {
    assert.match(generator, new RegExp(`def ${functionName}`));
  }
  assert.match(requirements, /^matplotlib==3\.10\.8$/m);
  assert.match(requirements, /^pandas==\d+\.\d+\.\d+$/m);
  assert.match(requirements, /^seaborn==\d+\.\d+\.\d+$/m);
  assert.match(requirements, /^Pillow==\d+\.\d+\.\d+$/m);
  assert.match(requirements, /^# runtime:freetype==\d+\.\d+\.\d+$/m);
  assert.match(generator, /def validate_runtime\(\)/);

  const expectedDimensions = new Map([
    ["week-11-question-to-chart.png", [1440, 900]],
    ["week-11-honest-chart-cases.png", [1440, 900]],
    ["week-11-figure-axes.png", [1440, 900]],
    ["week-11-data-poster-example.png", [1600, 2200]],
  ]);
  for (const [filename, [width, height]] of expectedDimensions) {
    const png = await readFile(resolve(assetDirectory, filename));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.ok(png.length > 20_000, `${filename} should contain a complete visual`);
  }

  const runtimeProbe = spawnSync(
    "python3",
    [generatorPath, "--check-runtime"],
    { cwd: root, encoding: "utf8" },
  );
  if (runtimeProbe.status !== 0) {
    if (process.env.WEEK11_STRICT_ASSET_TEST === "1") {
      assert.fail(
        `the pinned Week 11 visual runtime is unavailable:\n${runtimeProbe.stdout}\n${runtimeProbe.stderr}`,
      );
    }
    t.skip(
      "install the pinned visual toolchain with `npm run setup:week11-assets`",
    );
    return;
  }

  const outputDirectory = await mkdtemp(join(tmpdir(), "week11-assets-"));
  try {
    const generated = spawnSync(
      "python3",
      [generatorPath, "--asset-dir", outputDirectory],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(
      generated.status,
      0,
      `Week 11 asset generation failed:\n${generated.stdout}\n${generated.stderr}`,
    );

    for (const filename of generatedFilenames) {
      const [committed, regenerated] = await Promise.all([
        readFile(resolve(assetDirectory, filename)),
        readFile(resolve(outputDirectory, filename)),
      ]);
      assert.ok(
        committed.equals(regenerated),
        `${filename} should match a clean regeneration`,
      );
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test("Contents Programming week 11 publishes all three lesson routes from the course index", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-11-period${period}\\.html"`));
  }
});

test("Contents Programming week 11 keeps reading and navigation usable at every viewport", async () => {
  const [teachingCss, accessibilityCss, ...lessons] = await Promise.all([
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
    readFile(resolve(root, "assets", "accessibility.css"), "utf8"),
    ...[1, 2, 3].map((period) =>
      readFile(resolve(courseDirectory, `week-11-period${period}.html`), "utf8"),
    ),
  ]);

  for (const lesson of lessons) {
    assert.match(lesson, /<html lang="ko" class="week-11-root">/);
    assert.match(
      lesson,
      /<body class="teaching-document course-contents-programming week-11-document">/,
    );
  }

  assert.match(
    teachingCss,
    /html\.week-11-root\s*\{[^}]*scroll-behavior:\s*auto;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.article img\s*\{[^}]*max-width:\s*100%;[^}]*height:\s*auto;[^}]*display:\s*block;/s,
  );
  assert.match(
    teachingCss,
    /@media \(max-width: 980px\)[\s\S]*?body\.course-contents-programming\.teaching-document\.week-11-document \.toc\s*\{[^}]*position:\s*sticky;[^}]*max-height:\s*none;[^}]*overflow-x:\s*auto;/,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.article h2\s*\{[^}]*counter-increment:\s*none;/s,
  );
  assert.match(
    teachingCss,
    /@media \(max-width: 760px\)[\s\S]*?body\.course-contents-programming\.teaching-document\.week-11-document \.toc\s*\{[^}]*top:\s*69px;/,
  );
  assert.match(
    teachingCss,
    /@media \(max-width: 760px\)[\s\S]*?@media print\s*\{[\s\S]*?body\.course-contents-programming\.teaching-document\.week-11-document \.toc\s*\{[^}]*display:\s*none;[\s\S]*?body\.course-contents-programming\.teaching-document\.week-11-document \.course-footer\s*\{[^}]*width:\s*100%;[^}]*margin:\s*32px 0 0;/,
  );
  assert.match(
    accessibilityCss,
    /\.skip-link\s*\{[^}]*transition:\s*none;/s,
  );
  assert.match(
    accessibilityCss,
    /\.toc a:not\(:active\):hover\s*\{[^}]*color:\s*var\(--muted\)/s,
  );
  assert.doesNotMatch(
    accessibilityCss,
    /\.toc a:not\(:active\):hover\s*\{[^}]*color:\s*#364250/s,
  );
});

test("Contents Programming week 11 period 3 presents one clear start and completion path", async () => {
  const [period3, teachingCss] = await Promise.all([
    readFile(resolve(courseDirectory, "week-11-period3.html"), "utf8"),
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
  ]);
  const completionCriteria = period3.match(
    /<ol class="completion-criteria">([\s\S]*?)<\/ol>/,
  );

  assert.ok(completionCriteria, "the mission should publish completion criteria");
  assert.equal(
    [...completionCriteria[1].matchAll(/<li>/g)].length,
    12,
    "the mission should keep exactly twelve completion checks",
  );
  assert.doesNotMatch(completionCriteria[1], /<li><span>\d{2}<\/span>/);
  assert.ok(
    period3.indexOf("resource-primary") < period3.indexOf("goal-contract"),
    "the notebook download should appear before the operating contract",
  );
  assert.match(
    period3,
    /class="inline-resource-card resource-primary" href="assets\/week-11-data-poster-mission\.ipynb" download/,
  );
  assert.match(
    period3,
    /href="assets\/week-11-data-poster-example\.png" target="_blank" rel="noopener noreferrer"/,
  );
  assert.doesNotMatch(
    period3,
    /href="assets\/week-11-data-poster-example\.png" download/,
  );
  assert.doesNotMatch(period3, /class="exit-gate"/);
  assert.match(
    period3,
    /<section class="check-output" aria-labelledby="check-output-title">/,
  );
  assert.doesNotMatch(period3, /class="check-output" role="status"/);
  assert.doesNotMatch(period3, /✅|🎉/u);

  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.resource-primary\s*\{[^}]*grid-column:\s*1 \/ -1;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.submission-strip\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.completion-criteria li\s*\{[^}]*display:\s*list-item;[^}]*counter-increment:\s*none;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.completion-criteria li::before\s*\{[^}]*content:\s*none;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.inline-resource-card:active\s*\{[^}]*transform:\s*scale\(0\.985\);/s,
  );
  assert.match(
    teachingCss,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?body\.course-contents-programming\.teaching-document\.week-11-document \.inline-resource-card:not\(:active\):hover/,
  );
});

test("Contents Programming week 11 gives every lesson a distinct visual identity and quiet reading hierarchy", async () => {
  const [teachingCss, siteConfig, ...lessons] = await Promise.all([
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
    readFile(resolve(root, "scripts", "site-config.mjs"), "utf8"),
    ...[1, 2, 3].map((period) =>
      readFile(resolve(courseDirectory, `week-11-period${period}.html`), "utf8"),
    ),
  ]);
  const lessonImages = [
    "week-11-question-to-chart.png",
    "week-11-figure-axes.png",
    "week-11-data-poster-example.png",
  ];

  lessons.forEach((lesson, index) => {
    const period = index + 1;
    const image = lessonImages[index];
    const title = lesson.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";

    assert.match(lesson, /^<!DOCTYPE html>/);
    assert.ok(title.length <= 70, `period ${period} title should stay concise`);
    assert.match(
      lesson,
      new RegExp(
        `class="hero-visual-link[^"]*" href="assets/${image.replaceAll(".", "\\.")}"`,
      ),
    );
    assert.doesNotMatch(lesson, /<aside class="doc-card"/);
    assert.match(
      lesson,
      new RegExp(
        `property="og:image" content="https://creativeengineer-kimjungho\\.com/teaching/contents-programming/assets/${image.replaceAll(".", "\\.")}"`,
      ),
    );
    assert.match(
      lesson,
      new RegExp(
        `name="twitter:image" content="https://creativeengineer-kimjungho\\.com/teaching/contents-programming/assets/${image.replaceAll(".", "\\.")}"`,
      ),
    );
    assert.match(lesson, /<footer class="course-footer">/);
    assert.doesNotMatch(lesson, /[—–]/u);
    assert.match(
      siteConfig,
      new RegExp(
        `"teaching/contents-programming/week-11-period${period}\\.html"[\\s\\S]*?${image.replaceAll(".", "\\.")}`,
      ),
    );
  });

  assert.match(
    lessons[0],
    /<div class="pipeline" role="group" aria-label="질문에서 검증까지의 시각화 설계 흐름">/,
  );
  assert.match(
    lessons[0],
    /<img src="https:\/\/cdn\.loc\.gov\/service\/pnp\/ppmsca\/33900\/33900r\.jpg" width="609" height="640"[^>]*>/,
  );
  assert.match(
    lessons[0],
    /href="https:\/\/www\.loc\.gov\/pictures\/item\/2013650365\/" target="_blank" rel="noopener noreferrer"/,
  );
  assert.doesNotMatch(lessons[2], /class="footer-note"/);

  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.hero-visual-link\s*\{[^}]*display:\s*grid;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.hero-visual-image\s*\{[^}]*width:\s*100%;[^}]*object-fit:\s*cover;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.article\s*\{[^}]*border:\s*0;[^}]*box-shadow:\s*none;/s,
  );
  assert.match(
    teachingCss,
    /body\.course-contents-programming\.teaching-document\.week-11-document \.course-footer\s*\{[^}]*width:\s*min\(1180px, calc\(100% - 48px\)\);/s,
  );
});
