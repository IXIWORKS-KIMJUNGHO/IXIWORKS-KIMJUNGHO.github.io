import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(
  root,
  "teaching",
  "contents-programming",
  "index.html",
);
const courseDirectory = resolve(root, "teaching", "contents-programming");

test("Contents Programming week 7 transforms generated images into a midterm prototype", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week7Match = courseIndex.match(
    /<section class="week-group" id="week-07"[\s\S]*?<\/section>/,
  );

  assert.ok(week7Match, "the course index should include week 7");
  const week7 = week7Match[0];

  for (const pattern of [
    /Image transformation/,
    /href="week-07-period1\.html"/,
    /href="week-07-period2\.html"/,
    /href="week-07-period3\.html"/,
    /7주차 1교시: 원본을 보존하며 이미지 변형하기/,
    /7주차 2교시: RGBA 레이어 합성과 책임 있는 이미지 이용/,
    /7주차 3교시: 변형·합성 프로토타입 미션/,
  ]) {
    assert.match(week7, pattern);
  }

  assert.doesNotMatch(week7, /짝 활동|짝과|조별 활동/);
});

test("Contents Programming week 7 theory lessons explain transformation and composition for beginners", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period1 = await readFile(
    resolve(courseDirectory, "week-07-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-07-period2.html"),
    "utf8",
  );
  const linkedLessons = [
    ...courseIndex.matchAll(/href="(week-\d{2}-period[123]\.html)"/g),
  ].map((match) => match[1]);
  const period1Index = linkedLessons.indexOf("week-07-period1.html");

  assert.ok(
    period1Index > 0,
    "week 7 period 1 should follow an earlier published lesson",
  );
  const previousLesson = linkedLessons[period1Index - 1];
  const previousPeriod = await readFile(
    resolve(courseDirectory, previousLesson),
    "utf8",
  );

  assert.match(courseIndex, /href="week-07-period1\.html"/);
  assert.match(courseIndex, /href="week-07-period2\.html"/);
  assert.ok(
    period1.includes(`href="${previousLesson}" rel="prev"`),
    `week 7 period 1 should link back to ${previousLesson}`,
  );
  assert.ok(
    previousPeriod.includes('href="week-07-period1.html" rel="next"'),
    `${previousLesson} should link forward to week 7 period 1`,
  );
  assert.match(period1, /href="week-07-period2\.html" rel="next"/);
  assert.match(period2, /href="week-07-period1\.html" rel="prev"/);

  for (const [html, timeRanges] of [
    [
      period1,
      ["0-5분", "5-14분", "14-25분", "25-35분", "35-44분", "44-50분", "50-60분"],
    ],
    [
      period2,
      ["0-5분", "5-15분", "15-27분", "27-38분", "38-44분", "44-50분", "50-60분"],
    ],
  ]) {
    for (const timeRange of timeRanges) {
      assert.match(html, new RegExp(timeRange));
    }
    assert.doesNotMatch(html, /짝 활동|짝과|조별 활동/);
    assert.ok(
      [...html.matchAll(/<details\b/gi)].length >= 5,
      "each week 7 theory lesson should include at least five individual answer checks",
    );
    assert.match(html, /\+ 10 MIN EXTENSION/);
    assert.match(html, /기본 50분 \/ 확장 60분/);
  }

  for (const pattern of [
    /6주차.*create_poster\(\).*출력.*입력/s,
    /파일.*Image 객체/s,
    /Image\.open\(/,
    /convert\("RGBA"\)/,
    /copy\(\).*원본.*작업본/s,
    /crop\(\).*left.*top.*right.*bottom/s,
    /resize\(\).*가로세로 비율/s,
    /Image\.Resampling\.LANCZOS/,
    /rotate\(\).*expand=True/s,
    /원본.*작업본.*결과물/s,
    /FileNotFoundError/,
    /UnidentifiedImageError/,
    /week-07-transform-operations\.png/,
    /https:\/\/www\.moma\.org\/collection\/terms\/photomontage/,
    /https:\/\/pillow\.readthedocs\.io\/en\/stable\/reference\/Image\.html/,
    /수업 후 개별 복습/,
  ]) {
    assert.match(period1, pattern);
  }

  for (const pattern of [
    /RGB.*RGBA.*알파/s,
    /0.*완전.*투명.*255.*완전.*불투명/s,
    /캔버스.*레이어.*같은 좌표계/s,
    /alpha_composite\(/,
    /dest=\(x, y\)/,
    /레이어.*순서.*결과/s,
    /제목.*창작자.*원본 주소.*라이선스/s,
    /변형 내용/,
    /TASL/,
    /week-07-alpha-composite\.png/,
    /week-07-prototype-example\.png/,
    /https:\/\/creativecommons\.org\/reusing-cc-licensed-content\//,
    /https:\/\/pillow\.readthedocs\.io\/en\/stable\/reference\/Image\.html/,
    /3교시 고정 미션 계약/,
    /변형 레이어.*세 개.*1000 × 1000/s,
    /수업 후 개별 복습/,
  ]) {
    assert.match(period2, pattern);
  }
});

test("Contents Programming week 7 period 3 is an executable goal-based transformation mission", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period2 = await readFile(
    resolve(courseDirectory, "week-07-period2.html"),
    "utf8",
  );
  const period3 = await readFile(
    resolve(courseDirectory, "week-07-period3.html"),
    "utf8",
  );
  const notebook = JSON.parse(
    await readFile(
      resolve(
        courseDirectory,
        "assets",
        "week-07-transformation-mission.ipynb",
      ),
      "utf8",
    ),
  );
  const notebookCode = notebook.cells
    .filter((cell) => cell.cell_type === "code")
    .flatMap((cell) => cell.source)
    .join("");

  assert.match(courseIndex, /href="week-07-period3\.html"/);
  assert.match(period2, /href="week-07-period3\.html" rel="next"/);
  assert.match(period3, /href="week-07-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동/);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 8,
    "the week 7 mission should include on-demand beginner help",
  );

  for (const timeRange of [
    "0-6분",
    "6-12분",
    "12-20분",
    "20-32분",
    "32-40분",
    "40-46분",
    "46-50분",
  ]) {
    assert.match(period3, new RegExp(timeRange));
  }

  for (const pattern of [
    /목표 달성형 개인 실습/,
    /자동 검사 통과 \+ 두 파일 제출 확인 = 즉시 귀가/,
    /week-07-transformation-mission\.ipynb/,
    /week07_학번_이름\.ipynb/,
    /week07_학번_이름\.png/,
    /1000 × 1000.*RGBA/s,
    /변형 레이어.*세 개/s,
    /자르기.*크기 변경.*회전/s,
    /제목.*창작자.*원본 주소.*라이선스.*변형 내용/s,
    /자동 검사는 작품의 미적 취향을 채점하지 않는다/,
    /WEEK 07 TRANSFORMATION PROTOTYPE COMPLETE/,
    /작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다/,
    /week-07-prototype-example\.png/,
  ]) {
    assert.match(period3, pattern);
  }

  assert.equal(notebook.nbformat, 4);
  assert.equal(
    notebook.cells.filter((cell) => cell.cell_type === "code").length,
    6,
  );
  for (const pattern of [
    /Image\.new\("RGBA", \(1000, 1000\)/,
    /Image\.open\(source_path\)\.convert\("RGBA"\)/,
    /source_image\.copy\(\)/,
    /\.crop\(crop_box\)/,
    /\.resize\(target_size, Image\.Resampling\.LANCZOS\)/,
    /\.rotate\(angle, expand=True/,
    /putalpha\(alpha\)/,
    /canvas\.alpha_composite\(layer, dest=position\)/,
    /len\(layers\) >= 3/,
    /angles.*any\(angle < 0.*any\(angle > 0/s,
    /len\(set\(alphas\)\) >= 2/,
    /source_title.*source_creator.*source_url.*source_license.*change_description/s,
    /mission_step0_execution = get_ipython\(\)\.execution_count/,
    /mission_step1_execution = get_ipython\(\)\.execution_count/,
    /mission_step2_execution = get_ipython\(\)\.execution_count/,
    /mission_step3_execution = get_ipython\(\)\.execution_count/,
    /mission_step4_execution = get_ipython\(\)\.execution_count/,
    /mission_final_execution = get_ipython\(\)\.execution_count/,
    /if source_choice == "provided"/,
    /else:.*Path\(source_path\)\.resolve\(\) != Path\(FALLBACK_SOURCE_PATH\)\.resolve\(\)/s,
    /source_title != provided_source_record\[0\]/,
    /source_creator != provided_source_record\[1\]/,
    /source_url != provided_source_record\[2\]/,
    /source_license != provided_source_record\[3\]/,
    /canvas\.save\(output_filename\)/,
    /checked_file\.tobytes\(\) == canvas\.tobytes\(\)/,
    /== \(1, 2, 3, 4, 5, 6\)/,
    /WEEK 07 TRANSFORMATION PROTOTYPE COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }

  assert.doesNotMatch(notebookCode, /EXECUTION_ORDER/);
  assert.doesNotMatch(notebookCode, /len\(field_value\.strip\(\)\) >= 5/);
});

test("Contents Programming week 7 visuals preserve transparent rotation corners and use named layer values", async () => {
  const generator = await readFile(
    resolve(root, "scripts", "generate-week07-transformation-assets.py"),
    "utf8",
  );

  assert.match(generator, /@dataclass\(frozen=True\)/);
  assert.match(generator, /class LayerSpec:/);
  for (const field of [
    "crop_box",
    "target_size",
    "angle",
    "alpha",
    "position",
  ]) {
    assert.match(generator, new RegExp(`\\n    ${field}:`));
  }
  assert.doesNotMatch(generator, /spec\[\d+\]/);

  const putAlphaIndex = generator.indexOf("layer.putalpha(spec.alpha)");
  const rotateIndex = generator.indexOf("layer = layer.rotate(", putAlphaIndex);
  assert.ok(putAlphaIndex >= 0, "the generated layer should apply its alpha value");
  assert.ok(
    rotateIndex > putAlphaIndex,
    "rotation should happen after alpha so transparent corners stay transparent",
  );
});
