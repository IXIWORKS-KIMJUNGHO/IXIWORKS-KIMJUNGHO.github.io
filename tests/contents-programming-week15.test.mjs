import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");

function assertIncludesAll(source, requiredValues) {
  for (const value of requiredValues) {
    assert.ok(source.includes(value), `expected the lesson to include “${value}”`);
  }
}

function assertTimeline(source, expectedRanges) {
  const sessionGrid = source.match(
    /<ul class="session-grid[^"]*"[^>]*aria-label="[^"]*시간 구성"[\s\S]*?<\/ul>/,
  );
  assert.ok(sessionGrid, "the lesson should publish a session timeline");
  const ranges = [...sessionGrid[0].matchAll(/(\d+)-(\d+)분/g)].map(
    ([, start, end]) => [Number(start), Number(end)],
  );
  assert.deepEqual(ranges, expectedRanges);
  for (let index = 1; index < ranges.length; index += 1) {
    assert.equal(ranges[index][0], ranges[index - 1][1]);
  }
}

function assertIndividualOnly(source) {
  assert.doesNotMatch(source, /짝 활동|짝과|조별|팀 활동|동료 피드백/);
}

function assertPolishedCopy(source) {
  assert.doesNotMatch(source, /—|–/);
  assert.doesNotMatch(source, /\[(?:LMS|이메일|정확한 시각|강사 안내)/);
  assert.doesNotMatch(source, /점수가 잘 나옵니다|멍하니 있지 않기/);
}

test("Contents Programming week 15 publishes three connected lessons", async () => {
  const [courseIndex, sitemap, week14Period3, period1, period2, period3] =
    await Promise.all([
      readFile(resolve(courseDirectory, "index.html"), "utf8"),
      readFile(resolve(root, "sitemap.xml"), "utf8"),
      readFile(resolve(courseDirectory, "week-14-period3.html"), "utf8"),
      readFile(resolve(courseDirectory, "week-15-period1.html"), "utf8"),
      readFile(resolve(courseDirectory, "week-15-period2.html"), "utf8"),
      readFile(resolve(courseDirectory, "week-15-period3.html"), "utf8"),
    ]);

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-15-period${period}\\.html"`));
    assert.match(
      sitemap,
      new RegExp(`contents-programming/week-15-period${period}\\.html`),
    );
  }
  assertIncludesAll(courseIndex, [
    "30% 프로토타입에서 70% 프로토타입으로",
    "수정 전후 증거",
    "목표 달성형 개인 실습",
    "완료하면 즉시 귀가",
  ]);

  assert.match(week14Period3, /href="week-15-period1\.html" rel="next"/);
  assert.match(period1, /href="week-14-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-15-period2\.html" rel="next"/);
  assert.match(period2, /href="week-15-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-15-period3\.html" rel="next"/);
  assert.match(period3, /href="week-15-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /rel="next"/);
});

test("week 15 lesson shells match the teaching navigation generator", () => {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "scripts", "refresh-teaching-navigation.mjs"),
      "--check",
      "--course",
      "contents-programming",
      "--documents",
      "week-15-period1.html,week-15-period2.html,week-15-period3.html",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /0 document shell changes required/);

  const unsafeGlobalCheck = spawnSync(
    process.execPath,
    [resolve(root, "scripts", "refresh-teaching-navigation.mjs"), "--check"],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(unsafeGlobalCheck.status, 0);
  assert.match(
    `${unsafeGlobalCheck.stdout}\n${unsafeGlobalCheck.stderr}`,
    /--check requires --course/,
  );
});

test("period 1 teaches evidence-led revision with four concrete cases", async () => {
  const period1 = await readFile(
    resolve(courseDirectory, "week-15-period1.html"),
    "utf8",
  );

  assertTimeline(period1, [
    [0, 6],
    [6, 14],
    [14, 24],
    [24, 34],
    [34, 43],
    [43, 50],
    [50, 60],
  ]);
  assertIndividualOnly(period1);
  assertPolishedCopy(period1);
  assert.ok(
    [...period1.matchAll(/<details\b/gi)].length >= 10,
    "period 1 should include at least ten beginner checks and disclosures",
  );
  assertIncludesAll(period1, [
    "14주차 30% 프로토타입",
    "70%는 기능을 70%만 만들었다는 뜻이 아닙니다",
    "정확성",
    "가독성",
    "재현성",
    "책임성",
    "발표 가능성",
    "수정 우선순위",
    "데이터 경로",
    "텍스트 경로",
    "사운드 경로",
    "규칙 기반 이미지 경로",
    "수정 전",
    "수정 후",
    "week-15-progress-ladder.png",
    "week-15-before-after.png",
    "수정 계약서",
    "기본 50분 / 확장 60분",
    "수업 후 개별 복습",
  ]);
  for (const label of ["강의 개요", "학습 목표", "학습 성과"]) {
    assert.match(period1, new RegExp(`<summary[^>]*>${label}</summary>`));
  }
  for (const href of [
    "https://matplotlib.org/stable/gallery/lines_bars_and_markers/bar_label_demo.html",
    "https://pandas.pydata.org/docs/user_guide/missing_data.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html",
  ]) {
    assert.match(
      period1,
      new RegExp(
        `href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" target="_blank" rel="noopener noreferrer"`,
      ),
    );
  }
});

test("period 2 teaches final QA and uses a bounded review queue", async () => {
  const period2 = await readFile(
    resolve(courseDirectory, "week-15-period2.html"),
    "utf8",
  );

  assertTimeline(period2, [
    [0, 7],
    [7, 16],
    [16, 26],
    [26, 36],
    [36, 43],
    [43, 50],
    [50, 60],
  ]);
  assertIndividualOnly(period2);
  assertPolishedCopy(period2);
  assert.ok(
    [...period2.matchAll(/<details\b/gi)].length >= 10,
    "period 2 should include at least ten diagnostic checks",
  );
  assertIncludesAll(period2, [
    "전체 입력 검증",
    "새 런타임",
    "오류 메시지",
    "제목, 축, 단위, 범례",
    "출처, 이용 조건, 기준일, 한계",
    "결과 파일을 노트북 밖에서 열기",
    "제출 패키지",
    "week-15-submission-package.png",
    "신청자 면담",
    "60-90초",
    "최대 10명",
    "나머지 학생은 기다리지 않습니다",
    "30명도 최대 15분",
    "수정 계약서",
    "3교시 준비",
    "기본 50분 / 확장 60분",
    "수업 후 개별 복습",
  ]);
  assert.doesNotMatch(period2, /한 명당 5~6분|한 명당 5-6분/);
});

test("period 3 is a persistent, finite, goal-based 70 percent mission", async () => {
  const period3 = await readFile(
    resolve(courseDirectory, "week-15-period3.html"),
    "utf8",
  );

  assertTimeline(period3, [
    [0, 3],
    [3, 7],
    [7, 13],
    [13, 19],
    [19, 24],
    [24, 28],
    [28, 43],
    [43, 47],
    [47, 50],
  ]);
  assertIndividualOnly(period3);
  assertPolishedCopy(period3);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 14,
    "period 3 should include at least fourteen troubleshooting checks",
  );
  assertIncludesAll(period3, [
    "목표 달성형 개인 실습",
    "70% 프로젝트 프로토타입",
    "자동 검사 PASS + 수정 전후 증거 + 결과 파일 열림 + 출처 확인 + 교수 증거 확인 + 필수 파일 제출 = 즉시 귀가",
    "작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다",
    "week-15-project-refinement-mission.ipynb",
    "week15_학번_이름_project.ipynb",
    "week15_학번_이름_refined.png",
    "week15_학번_이름_revision_log.html",
    "APPROVED PROJECT CODE ZONE",
    "project_input.read_text()",
    "구조화된 수정 동작",
    "show_count_check",
    "clarify_title_unit",
    "stamp_run_id",
    "show_source_context",
    "strengthen_contrast",
    "자동 검사는 자연어 문장의 의미를 판정하지 않습니다",
    "검사용 입력",
    "own_source_filename",
    "approval_status = \"approved\"",
    "AUTOMATIC EVIDENCE READY",
    "teacher_gate = &quot;confirmed&quot;",
    "새 런타임",
    "완성 순서대로 최대 30초",
    "교수 확인 대기열은 19분부터 열립니다",
    "30명도 최대 15분",
    "WEEK 15 PROJECT REFINEMENT COMPLETE",
    "선택 확장",
    "추가 점수에 포함하지 않습니다",
    "16주차 연결",
  ]);
  assert.match(period3, /data-mission-progress data-complete="false"/);
  assert.match(period3, /aria-live="polite">완료 0\/16<\/strong>/);
  assert.match(period3, /data-mission-checklist/);
  assert.equal(
    (period3.match(/class="completion-check"[^>]+type="checkbox"/g) ?? [])
      .length,
    16,
  );
});

test("week 15 lessons use one responsive, accessible visual system", async () => {
  const [css, ui, period1, period2, period3] = await Promise.all([
    readFile(resolve(assetDirectory, "week-15.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-15-ui.js"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period3.html"), "utf8"),
  ]);

  const lessons = [period1, period2, period3];
  for (const lesson of lessons) {
    assert.match(
      lesson,
      /<html class="week-15-root" lang="ko">[\s\S]*?<body class="teaching-document course-contents-programming week-15-document">/,
    );
    assert.match(lesson, /<link rel="stylesheet" href="assets\/week-15\.css">/);
    assert.match(lesson, /<details class="toc week-15-toc" open>/);
    assert.match(lesson, /<script src="assets\/week-15-ui\.js" defer><\/script>/);
    assert.match(lesson, /<script src="\/assets\/details-motion\.js" defer><\/script>/);
    assert.doesNotMatch(lesson, /assets\/7week\/09_finished-examples-gallery\.png/);
    for (const image of lesson.matchAll(/<img\b([^>]*)>/g)) {
      assert.match(image[1], /\bwidth="\d+"/);
      assert.match(image[1], /\bheight="\d+"/);
      assert.match(image[1], /\balt="[^"]+"/);
      assert.match(image[1], /\bdecoding="async"/);
    }
    assert.doesNotMatch(
      lesson,
      /<div\b(?![^>]*\brole=)[^>]*\baria-label=/,
      "generic divs with accessible names need an explicit role",
    );
  }

  assert.match(css, /body\.week-15-document \.article h2::before\s*{[^}]*content:\s*none/);
  assert.match(css, /body\.week-15-document \.article img\s*{[^}]*max-width:\s*100%;[^}]*height:\s*auto/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /body\.week-15-document \.inline-resource-card:active\s*{[^}]*transform:\s*scale\(0\.985\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*?body\.week-15-document \.doc-card\s*{[^}]*display:\s*block/,
  );
  assert.doesNotMatch(css, /transition:\s*all/);

  assert.match(ui, /matchMedia\("\(max-width: 980px\)"\)/);
  assert.match(ui, /toc\.removeAttribute\("open"\)/);
  assert.match(ui, /contents-programming-week15-checklist-v1/);
  assert.match(ui, /localStorage\.getItem/);
  assert.match(ui, /localStorage\.setItem/);
  assert.doesNotMatch(ui, /addEventListener\(["']scroll/);
});

test("week 15 notebook exposes a self-checking refinement contract", async () => {
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-15-project-refinement-mission.ipynb"),
      "utf8",
    ),
  );
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");
  const notebookCode = codeCells.flatMap((cell) => cell.source).join("");
  const finalCheckCode = codeCells.at(-1).source.join("");

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.nbformat_minor, 5);
  assert.ok(codeCells.length >= 7);
  assert.equal(
    [...notebookCode.matchAll(/# STEP \d · EDIT/g)].length,
    3,
    "the mission should expose exactly three required edit zones",
  );
  for (const pattern of [
    /student_id = "학번"/,
    /student_name = "이름"/,
    /project_track = "data"/,
    /project_mode = "provided"/,
    /own_source_filename = ""/,
    /baseline_mode = "provided"/,
    /approval_status = "EDIT:/,
    /approval_status in \{"provided", "approved"\}/,
    /approval_status == expected_approval/,
    /project_question = "EDIT:/,
    /source_title = "EDIT:/,
    /usage_rights = "EDIT:/,
    /reference_date = "EDIT:/,
    /privacy_check = "EDIT:/,
    /revision_action_1 = "EDIT:/,
    /revision_action_2 = "EDIT:/,
    /revision_focus_1 = "accuracy"/,
    /revision_focus_2 = "readability"/,
    /revision_operation_1 = "show_count_check"/,
    /revision_operation_2 = "clarify_title_unit"/,
    /REVISION_OPERATIONS = \{/,
    /REVISION_LENS_LABELS = \{/,
    /"responsibility": "책임성"/,
    /"reproducibility": "재현성"/,
    /"presentation": "발표 가능성"/,
    /main_observation = "EDIT:/,
    /limitation_statement = "EDIT:/,
    /teacher_feedback = "EDIT:/,
    /teacher_gate = "pending"/,
    /APPROVED PROJECT CODE ZONE/,
    /def build_project_outputs\(project_input=None\)/,
    /class TrackedProjectInput:/,
    /project_input\.read_count/,
    /def make_probe\(self, track\):/,
    /own_input_response_digests/,
    /def apply_revision_contract\(/,
    /if project_track == "data"/,
    /elif project_track == "text"/,
    /elif project_track == "sound"/,
    /"track": project_track/,
    /"input_origin": project_mode/,
    /"input_digest": own_source_digest/,
    /"revision_evidence_id": revision_evidence_id/,
    /"revision_render_proofs": revision_render_proofs/,
    /"rendered_revision_markers": rendered_revision_markers/,
    /"revision_render_digests": revision_render_digests/,
    /"applied_revision_operations": list\(selected_revision_operations\)/,
    /baseline_snapshot_digest = sha256_file/,
    /refined_output_digest = sha256_file/,
    /baseline_snapshot_digest != refined_output_digest/,
    /f"\{revision_action_1\}\\n\{revision_action_2\}"\.encode\("utf-8"\)/,
    /baseline_suffix in \{"\.png", "\.html"\}/,
    /base64\.b64decode/,
    /data:image\/png;base64,/,
    /base64\.b64encode/,
    /<dt>관찰<\/dt>/,
    /<dt>한계<\/dt>/,
    /<dt>수정 증거 ID<\/dt>/,
    /baseline_alt = f/,
    /refined_alt = \(/,
    /Image\.open\(refined_output_path\)/,
    /saved_image\.size == \(1600, 1000\)/,
    /week15_\{safe_student_id\}_\{safe_student_name\}_baseline\.png/,
    /week15_\{safe_student_id\}_\{safe_student_name\}_refined\.png/,
    /week15_\{safe_student_id\}_\{safe_student_name\}_revision_log\.html/,
    /AUTOMATIC EVIDENCE READY · TEACHER CHECK REQUIRED/,
    /teacher_gate == "confirmed"/,
    /sha256_file\(own_source_path\) == own_source_digest/,
    /font_manager\.fontManager\.addfont/,
    /font_manager\.get_font/,
    /get_char_index/,
    /require_korean_glyphs/,
    /_week15_step0_runs == 1/,
    /_run_order == \[0, 1, 2, 3, 4, 5, 6\]/,
    /WEEK 15 PROJECT REFINEMENT COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }
  assert.doesNotMatch(
    finalCheckCode,
    /\b(?:figure|axis|raw_values|refined_values)\b/,
    "FINAL CHECK should depend on published evidence rather than hidden plot state",
  );
  assert.doesNotMatch(notebookCode, /alt="수정 (?:전|후) 결과"/);
});

test("week 15 visual assets have the published dimensions", async () => {
  const expectedDimensions = new Map([
    ["week-15-progress-ladder.png", [1440, 900]],
    ["week-15-before-after.png", [1600, 1000]],
    ["week-15-submission-package.png", [1440, 900]],
  ]);
  for (const [filename, [width, height]] of expectedDimensions) {
    const path = resolve(assetDirectory, filename);
    const buffer = await readFile(path);
    assert.equal(buffer.toString("ascii", 1, 4), "PNG");
    assert.equal(buffer.readUInt32BE(16), width);
    assert.equal(buffer.readUInt32BE(20), height);
    assert.ok((await stat(path)).size > 20_000);
  }

  const font = await readFile(
    resolve(root, "assets", "fonts", "week15-korean-visual.ttf"),
  );
  assert.ok(font.length > 2_000_000);
  assert.equal(
    createHash("sha256").update(font).digest("hex"),
    "87fd90eac183d32c2ce542cce8d4b72facc315a5adb05669e7074f89b370c900",
  );
  const compressedFont = await readFile(
    resolve(root, "assets", "fonts", "week15-korean-visual.ttf.gz"),
  );
  assert.equal(
    createHash("sha256").update(compressedFont).digest("hex"),
    "2e287ff9f26edec4fd7e1cfc03a35933f79abea80cb7bd5a1ba16152f0a02e04",
  );
});

test("week 15 generated assets stay reproducible in the pinned environment", async (t) => {
  if (process.env.WEEK15_STRICT_ASSET_TEST !== "1") {
    t.skip("set WEEK15_STRICT_ASSET_TEST=1 to regenerate and compare assets");
    return;
  }
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "week15-assets-"));
  try {
    const python = process.env.WEEK15_ASSET_PYTHON || "python3";
    const result = spawnSync(
      python,
      [
        resolve(root, "scripts", "generate-week15-project-assets.py"),
        "--asset-dir",
        temporaryDirectory,
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    for (const filename of [
      "week-15-progress-ladder.png",
      "week-15-before-after.png",
      "week-15-submission-package.png",
      "week-15-project-refinement-mission.ipynb",
    ]) {
      const [committed, regenerated] = await Promise.all([
        readFile(resolve(assetDirectory, filename)),
        readFile(resolve(temporaryDirectory, filename)),
      ]);
      assert.deepEqual(regenerated, committed, `${filename} should be deterministic`);
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("week 15 notebook executes four guided paths and rejects false completion", (t) => {
  if (process.env.WEEK15_STRICT_NOTEBOOK_TEST !== "1") {
    t.skip("set WEEK15_STRICT_NOTEBOOK_TEST=1 to execute notebook scenarios");
    return;
  }
  const python = process.env.WEEK15_NOTEBOOK_PYTHON || "python3";
  const result = spawnSync(
    python,
    [resolve(root, "tests", "verify-week15-notebook.py")],
    { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  for (const track of ["data", "text", "sound", "image"]) {
    assert.match(result.stdout, new RegExp(`"track": "${track}"`));
  }
  assert.match(result.stdout, /"baseline_mode": "upload"/);
  assert.match(result.stdout, /"baseline_source_suffix": "\.html"/);
  assert.match(result.stdout, /"project_mode": "own"/);
  assert.match(
    result.stdout,
    /"revision_focuses": \["responsibility", "presentation"\]/,
  );
  assert.match(
    result.stdout,
    /"revision_focuses": \["reproducibility", "accuracy"\]/,
  );
  assert.match(result.stdout, /교수의 증거 확인 뒤 teacher_gate를 confirmed로 바꾸세요/);
  assert.match(result.stdout, /서로 다른 두 수정 행동을 기록하세요/);
  assert.match(result.stdout, /own 경로의 승인 코드는 project_input을 실제로 읽어야 합니다/);
  assert.match(result.stdout, /own 입력 내용을 바꾸면 수정 결과도 달라져야 합니다/);
  assert.match(result.stdout, /approval_status는 provided 또는 approved여야 합니다/);
  assert.match(result.stdout, /마지막 검사는 새 런타임에서 모두 실행해야 합니다/);
});
