import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

test("Contents Programming week 14 period 1 turns broad ideas into buildable project sentences", async () => {
  const [courseIndex, period1] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period1.html"), "utf8"),
  ]);

  assert.match(courseIndex, /href="week-14-period1\.html"/);
  assert.match(courseIndex, /14–24분에는 네 가지 축소 사례/);
  const lessonOrder = [
    ...new Set(
      [...courseIndex.matchAll(/href="(week-\d+-period\d+\.html)"/g)].map(
        ([, href]) => href,
      ),
    ),
  ];
  const currentIndex = lessonOrder.indexOf("week-14-period1.html");
  assert.ok(currentIndex > 0, "week 14 period 1 should follow a published lesson");
  const previousLessonName = lessonOrder[currentIndex - 1];
  const previousLesson = await readFile(
    resolve(courseDirectory, previousLessonName),
    "utf8",
  );
  assert.match(
    period1,
    new RegExp(`href="${previousLessonName.replaceAll(".", "\\.")}" rel="prev"`),
  );
  assert.match(previousLesson, /href="week-14-period1\.html" rel="next"/);
  assert.match(period1, /href="week-14-period2\.html" rel="next"/);
  assertTimeline(period1, [
    [0, 6],
    [6, 14],
    [14, 24],
    [24, 34],
    [34, 43],
    [43, 50],
    [50, 60],
  ]);
  assert.ok(
    [...period1.matchAll(/<details\b/gi)].length >= 10,
    "period 1 should include at least ten beginner checks",
  );
  assert.doesNotMatch(period1, /짝 활동|짝과|조별|팀 활동/);
  assertIncludesAll(period1, [
    "13주차의 씨앗 카드",
    "13주차 씨앗 카드의 다섯 매체",
    "최종 매체와 14주차 제작 경로",
    "map",
    "hybrid",
    "프로젝트 문장 틀",
    "한 질문, 한 입력, 한 규칙, 한 매핑, 한 출력",
    "week-14-scope-to-slice.png",
    "데이터·텍스트·사운드·규칙 이미지 계획",
    "네 가지 프로젝트의 범위 축소 사례",
    "관찰 단위",
    "직접 관찰 가능",
    "현재 자료만으로 단정 불가",
    "핵심",
    "보완",
    "확장",
    "대체 경로",
    "프로젝트 카드 일곱 항목",
    "Dear Data",
    "W.E.B. Du Bois",
    "Casey Reas",
    "기본 50분 / 확장 60분",
    "수업 후 개별 복습",
  ]);
  for (const href of [
    "https://www.dear-data.com/theproject",
    "https://www.loc.gov/pictures/item/2005679642/",
    "https://whitney.org/exhibitions/programmed/art?section=1&amp;subsection=14",
  ]) {
    assert.match(
      period1,
      new RegExp(
        `href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" target="_blank" rel="noopener noreferrer"`,
      ),
    );
  }
});

test("Contents Programming week 14 period 2 makes code structure and review evidence explicit", async () => {
  const [period1, period2] = await Promise.all([
    readFile(resolve(courseDirectory, "week-14-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period2.html"), "utf8"),
  ]);

  assert.match(period1, /href="week-14-period2\.html" rel="next"/);
  assert.match(period2, /href="week-14-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-14-period3\.html" rel="next"/);
  assert.match(
    await readFile(resolve(courseDirectory, "index.html"), "utf8"),
    /35–41분에는[\s\S]*41–50분에는/,
  );
  assertTimeline(period2, [
    [0, 7],
    [7, 17],
    [17, 27],
    [27, 35],
    [35, 41],
    [41, 50],
    [50, 60],
  ]);
  assert.ok(
    [...period2.matchAll(/<details\b/gi)].length >= 11,
    "period 2 should include at least eleven beginner checks",
  );
  assert.doesNotMatch(period2, /짝 활동|짝과|조별|팀 활동/);
  assertIncludesAll(period2, [
    "week-14-prototype-contract.png",
    "data / text / sound / image",
    "최종 매체와 기본 경로",
    "위치 지도",
    "다섯 매체와 복합 프로젝트",
    "준비, 입력 확인, 처리, 시각화, 저장, 최종 점검",
    "한 셀은 한 질문에 답합니다",
    "9–13주차 코드",
    "assert",
    "입력 검증",
    "처리 검증",
    "표현 검증",
    "출력 검증",
    "자동 검사",
    "교수 확인",
    "SHA-256",
    "출처, 이용 권한, 개인정보",
    "승인",
    "범위 축소 후 승인",
    "대체 자료로 전환",
    "60–90초",
    "수강 인원에 따른 1차 면담 시간 계산",
    "15분에는 약 10–15명",
    "APPROVED REUSE ZONE",
    "mapping_source_values",
    "새 런타임",
    "기본 50분과 선택 확장",
    "수업 후 개별 복습",
  ]);
});

test("Contents Programming week 14 period 3 is a finite four-path individual mission", async () => {
  const [period2, period3] = await Promise.all([
    readFile(resolve(courseDirectory, "week-14-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period3.html"), "utf8"),
  ]);

  assert.match(period2, /href="week-14-period3\.html" rel="next"/);
  assert.match(period3, /href="week-14-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /rel="next"/);
  assertTimeline(period3, [
    [0, 5],
    [5, 12],
    [12, 22],
    [22, 32],
    [32, 38],
    [38, 44],
    [44, 48],
    [48, 50],
  ]);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 18,
    "period 3 should include at least eighteen troubleshooting checks",
  );
  assert.doesNotMatch(period3, /짝 활동|짝과|조별|팀 활동/);
  assertIncludesAll(period3, [
    "목표 달성형 개인 실습",
    "자동 검사 PASS + 결과 파일 열림 + 출처 확인 + 교수 범위 확인 + 필수 파일 제출 = 즉시 귀가",
    "작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다",
    "week-14-project-prototype-mission.ipynb",
    "week-14-three-track-preview.png",
    "week14_학번_이름_prototype.ipynb",
    "week14_학번_이름_preview.png",
    "week14_학번_이름_source.확장자",
    "data",
    "text",
    "sound",
    "image",
    "provided",
    "own",
    "approval_status",
    "approval_note",
    "teacher_gate",
    "category",
    "value",
    "UTF-8 TXT",
    "모노 16-bit PCM WAV",
    "SHA-256",
    "Archive 84",
    "Studio 63",
    "Screening 49",
    "record",
    "28토큰",
    "상위 단어 7개",
    "159개 에너지 값",
    "위치·크기·색 매개변수 5건",
    "PNG 또는 HTML",
    "1600 × 1000",
    "관찰 단위",
    "개인정보 점검",
    "APPROVED REUSE ZONE",
    "AUTOMATIC EVIDENCE READY",
    "관찰",
    "한계",
    "15주차 행동",
    "새 런타임",
    "WEEK 14 PROJECT PROTOTYPE COMPLETE",
    "자동 검사는 프로젝트의 의미와 미적 완성도를 대신 평가하지 않습니다",
    "FINAL CHECK 코드는 수정하지 않습니다",
    "선택 확장",
    "추가 점수에 포함하지 않습니다",
    "15주차 연결",
  ]);
});

test("Week 14 notebook publishes a complete self-checking four-path workflow", async () => {
  const notebookPath = resolve(
    assetDirectory,
    "week-14-project-prototype-mission.ipynb",
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
    "the guided path should mark only STEP 1 and STEP 5 as required edits",
  );
  for (const pattern of [
    /required_packages = \{/,
    /numpy.*2\.5\.2/s,
    /pandas.*2\.3\.3/s,
    /matplotlib.*3\.10\.8/s,
    /Pillow.*12\.3\.0/s,
    /def font_has_korean_glyphs/,
    /student_id = "학번"/,
    /project_track = "data"/,
    /input_mode = "provided"/,
    /own_source_filename = ""/,
    /output_format = "png"/,
    /approval_status = "EDIT:/,
    /approval_note = "EDIT:/,
    /teacher_gate = "pending"/,
    /project_question = "EDIT:/,
    /reference_date = "EDIT:/,
    /privacy_check = "EDIT:/,
    /observation_unit = "EDIT:/,
    /value_unit = "EDIT:/,
    /processing_rule = "EDIT:/,
    /APPROVED REUSE ZONE/,
    /EXPECTED_PROVIDED_DIGESTS = \{[^}]+\}/,
    /source_digest_before = sha256_bytes/,
    /raw_snapshot = raw_data\.copy\(deep=True\)/,
    /raw_snapshot = raw_signal\.copy\(\)/,
    /PROVIDED_IMAGE_CSV =/,
    /raw_snapshot = raw_image_params\.copy\(deep=True\)/,
    /groupby\("category", as_index=False\)/,
    /Counter\(tokens\)/,
    /np\.sqrt\(np\.mean\(raw_signal/,
    /processed_values/,
    /axis\.barh\(/,
    /axis\.plot\(/,
    /axis\.scatter\(/,
    /processed_x = raw_image_params\["x"\]/,
    /processed_colors = raw_image_params\["color"\]/,
    /main_observation\s*=\s*\([\s\S]*?EDIT:/,
    /limitation_statement\s*=\s*\([\s\S]*?EDIT:/,
    /next_step_1 = "EDIT:/,
    /next_step_2 = "EDIT:/,
    /output_filename = f"week14_\{safe_student_id\}_\{safe_student_name\}_preview\.\{output_format\}"/,
    /figure\.savefig\(/,
    /output_path\.write_text\(html_output, encoding="utf-8"\)/,
    /dpi=200/,
    /saved_image\.size == \(1600, 1000\)/,
    /pd\.testing\.assert_frame_equal\(raw_data, raw_snapshot\)/,
    /pd\.testing\.assert_frame_equal\(raw_image_params, raw_snapshot\)/,
    /source_path\.read_bytes\(\) == source_bytes_before/,
    /candidate_data\["category"\]\.notna\(\)\.all\(\)/,
    /np\.isfinite\(numeric_values\.to_numpy\(dtype=float\)\)\.all\(\)/,
    /np\.allclose\(mapping_visual_values, mapping_source_values\)/,
    /mapping_position_values.*processed_times/s,
    /observation_evidence = "EDIT:/,
    /observation_evidence in main_observation/,
    /teacher_feedback = "EDIT:/,
    /AUTOMATIC EVIDENCE READY · TEACHER CHECK REQUIRED/,
    /teacher_gate == "confirmed"/,
    /_run_order == \[0, 1, 2, 3, 4, 5, 6\]/,
    /WEEK 14 PROJECT PROTOTYPE COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }
});

test("Week 14 generated visual assets have the published dimensions", async () => {
  const expectedDimensions = new Map([
    ["week-14-scope-to-slice.png", [1440, 900]],
    ["week-14-prototype-contract.png", [1440, 900]],
    ["week-14-three-track-preview.png", [1600, 900]],
  ]);
  for (const [filename, [width, height]] of expectedDimensions) {
    const buffer = await readFile(resolve(assetDirectory, filename));
    assert.equal(buffer.toString("ascii", 1, 4), "PNG");
    assert.equal(buffer.readUInt32BE(16), width);
    assert.equal(buffer.readUInt32BE(20), height);
    assert.ok((await stat(resolve(assetDirectory, filename))).size > 20_000);
  }
});

test("Week 14 preview generation guards contrast, bounds, and shared fixtures", async () => {
  const generator = await readFile(
    resolve(root, "scripts", "generate-week14-project-assets.py"),
    "utf8",
  );
  assert.match(generator, /GOLD = "#6f4f00"/);
  assert.match(generator, /def assert_figure_content_inside_canvas/);
  assert.match(generator, /assert_figure_content_inside_canvas\(figure, axes\)/);
  assert.match(
    generator,
    /data_frame = pd\.read_csv\(pd\.io\.common\.StringIO\(PROVIDED_DATA_CSV\)\)/,
  );
  assert.match(generator, /token_counts = Counter\(PROVIDED_TEXT\.split\(\)\)/);
  assert.match(generator, /signal = provided_sound\(\)/);
});

test("Week 14 generated assets stay reproducible in the pinned environment", async (t) => {
  if (process.env.WEEK14_STRICT_ASSET_TEST !== "1") {
    t.skip("set WEEK14_STRICT_ASSET_TEST=1 to regenerate and compare assets");
    return;
  }
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "week14-assets-"));
  try {
    const python = process.env.WEEK14_ASSET_PYTHON || "python3";
    const result = spawnSync(
      python,
      [
        resolve(root, "scripts", "generate-week14-project-assets.py"),
        "--asset-dir",
        temporaryDirectory,
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    for (const filename of [
      "week-14-scope-to-slice.png",
      "week-14-prototype-contract.png",
      "week-14-three-track-preview.png",
      "week-14-project-prototype-mission.ipynb",
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

test("Week 14 notebook passes four valid paths and rejects corrupted evidence", (t) => {
  if (process.env.WEEK14_STRICT_NOTEBOOK_TEST !== "1") {
    t.skip("set WEEK14_STRICT_NOTEBOOK_TEST=1 to execute notebook scenarios");
    return;
  }
  const python = process.env.WEEK14_NOTEBOOK_PYTHON || "python3";
  const result = spawnSync(
    python,
    [resolve(root, "tests", "verify-week14-notebook.py")],
    { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /"track": "data"/);
  assert.match(result.stdout, /"track": "text"/);
  assert.match(result.stdout, /"track": "sound"/);
  assert.match(result.stdout, /"track": "image"/);
  assert.match(result.stdout, /"input_mode": "own"/);
  assert.match(result.stdout, /"output_format": "html"/);
  assert.match(result.stdout, /수업 제공 원본이 변경되었습니다/);
  assert.match(result.stdout, /category 열에 결측값이 있습니다/);
  assert.match(result.stdout, /화면에 매핑된 값이 처리 결과와 일치하지 않습니다/);
  assert.match(result.stdout, /교수의 최종 확인 뒤 teacher_gate를 confirmed로 바꾸세요/);
  assert.match(result.stdout, /관찰 문장에 화면에서 가리킬 관찰 근거를 그대로 포함하세요/);
});
