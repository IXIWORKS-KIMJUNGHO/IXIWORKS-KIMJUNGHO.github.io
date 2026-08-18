import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");

test("Contents Programming week 4 develops visual rhythm through loops and lists", async () => {
  const courseIndex = await readFile(resolve(courseDirectory, "index.html"), "utf8");
  const period1 = await readFile(
    resolve(courseDirectory, "week-04-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-04-period2.html"),
    "utf8",
  );

  assert.match(courseIndex, /href="week-04-period1\.html"/);
  assert.match(courseIndex, /href="week-04-period2\.html"/);
  assert.match(period1, /href="week-04-period2\.html" rel="next"/);
  assert.match(period2, /href="week-04-period1\.html" rel="prev"/);

  const lessonNames = [
    ...new Set(
      [...courseIndex.matchAll(/href="(week-\d{2}-(?:ot|period\d+)\.html)"/g)]
        .map((match) => match[1]),
    ),
  ];
  const period1Index = lessonNames.indexOf("week-04-period1.html");
  const previousName = lessonNames[period1Index - 1];

  assert.ok(period1Index > 0, "week 4 period 1 should have a previous lesson");
  const previousPeriod = await readFile(
    resolve(courseDirectory, previousName),
    "utf8",
  );

  assert.match(previousPeriod, /href="week-04-period1\.html" rel="next"/);
  assert.ok(
    period1.includes(`href="${previousName}" rel="prev"`),
    `week 4 period 1 should link back to ${previousName}`,
  );

  for (const [html, timeRanges] of [
    [
      period1,
      ["0-5분", "5-17분", "17-28분", "28-38분", "38-46분", "46-50분", "50-60분"],
    ],
    [
      period2,
      ["0-5분", "5-16분", "16-26분", "26-39분", "39-46분", "46-50분", "50-60분"],
    ],
  ]) {
    for (const timeRange of timeRanges) {
      assert.match(html, new RegExp(timeRange));
    }
    assert.doesNotMatch(html, /짝 활동|짝과|조별 활동/);
    assert.ok(
      [...html.matchAll(/<details\b/gi)].length >= 4,
      "each week 4 theory lesson should include individual answer checks",
    );
    assert.match(html, /\+ 10 MIN EXTENSION/);
    assert.match(html, /기본 50분 \/ 확장 60분/);
  }

  for (const pattern of [
    /3주차.*좌표.*RGB.*도형/s,
    /반복.*패턴.*리듬/s,
    /수동 반복.*같은 출력/s,
    /for i in range/,
    /콜론.*들여쓰기/s,
    /반복 변수.*매번 새로운 값/s,
    /range.*끝값.*포함하지/s,
    /week-04-case-rule-grid\.png/,
    /week-04-case-rhythm-compression\.png/,
    /week-04-case-instruction-system\.png/,
    /https:\/\/www\.labiennale\.org\/en\/art\/2022\/milk-dreams\/vera-moln%C3%A1r/,
    /https:\/\/bridget-riley\.publications\.britishart\.yale\.edu\/catalogue\/1\//,
    /https:\/\/www\.moma\.org\/collection\/works\/99388/,
    /Untitled from Squares with a Different Line Direction in Each Half Square/,
    /반복 횟수와 색은 여섯 번, 한 가지 색으로 고정/,
    /수업 후 개별 복습/,
  ]) {
    assert.match(period1, pattern);
  }

  for (const pattern of [
    /대괄호.*리스트/s,
    /인덱스.*0/s,
    /palette = \[/,
    /for row.*for column/s,
    /palette\[row\]/,
    /rows \* columns/,
    /week-04-palette-grid\.png/,
    /week-04-grid-variations\.png/,
    /image\.save\(output_filename\)/,
    /IndentationError/,
    /IndexError/,
    /3교시 연결: 나만의 리듬 그리드/,
    /이번 시간에 아직 다루지 않는 것/,
    /while.*조건문.*난수/s,
    /https:\/\/docs\.python\.org\/3\/tutorial\/controlflow\.html#for-statements/,
    /https:\/\/docs\.python\.org\/3\/tutorial\/introduction\.html#lists/,
    /https:\/\/pillow\.readthedocs\.io\/en\/stable\/reference\/ImageDraw\.html/,
  ]) {
    assert.match(period2, pattern);
  }
});

test("Contents Programming week 4 period 3 is a goal-based rhythm grid mission", async () => {
  const courseIndex = await readFile(resolve(courseDirectory, "index.html"), "utf8");
  const period2 = await readFile(
    resolve(courseDirectory, "week-04-period2.html"),
    "utf8",
  );
  const period3 = await readFile(
    resolve(courseDirectory, "week-04-period3.html"),
    "utf8",
  );
  const notebook = JSON.parse(
    await readFile(
      resolve(
        courseDirectory,
        "assets",
        "week-04-rhythm-grid-mission.ipynb",
      ),
      "utf8",
    ),
  );
  const notebookCode = notebook.cells
    .filter((cell) => cell.cell_type === "code")
    .flatMap((cell) => cell.source)
    .join("");

  assert.match(courseIndex, /href="week-04-period3\.html"/);
  assert.match(period2, /href="week-04-period3\.html" rel="next"/);
  assert.match(period3, /href="week-04-period2\.html" rel="prev"/);
  assert.match(period2, /3교시 고정 미션 계약/);
  assert.match(period2, /팔레트.*4.*6.*기준.*두/s);
  assert.match(period2, /columns.*6.*size_step.*4.*10/s);
  assert.match(period2, /3교시 편집 경계/);
  assert.match(period2, /rows.*자동.*DO NOT EDIT/s);
  assert.match(period2, /gap_x.*gap_y.*DO NOT EDIT/s);
  assert.doesNotMatch(period2, /색, 크기, 간격 가운데 두 속성/);
  assert.doesNotMatch(period2, /행·열·간격·크기·팔레트 초안/);
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동/);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 6,
    "the week 4 mission should include on-demand beginner help",
  );

  for (const timeRange of [
    "0-6분",
    "6-12분",
    "12-18분",
    "18-32분",
    "32-40분",
    "40-46분",
    "46-50분",
  ]) {
    assert.match(period3, new RegExp(timeRange));
  }

  for (const pattern of [
    /목표 달성형 개인 실습/,
    /자동 검사 통과 \+ 두 파일 제출 확인 = 즉시 귀가/,
    /week-04-rhythm-grid-mission\.ipynb/,
    /week04_학번_이름\.ipynb/,
    /week04_학번_이름\.png/,
    /색상 리스트.*최소 두/s,
    /rows \* columns.*20/s,
    /중첩 반복/,
    /색과 크기.*두 속성/s,
    /자동 검사는 작품의 미적 취향을 채점하지 않는다/,
    /WEEK 04 RHYTHM GRID COMPLETE/,
    /작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다/,
    /week-04-palette-grid\.png/,
  ]) {
    assert.match(period3, pattern);
  }

  assert.equal(
    notebook.cells.filter((cell) => cell.cell_type === "code").length,
    6,
  );
  for (const pattern of [
    /STARTER_PALETTE/,
    /palette = \[/,
    /rows = len\(palette\)/,
    /for row.*for column/s,
    /color = palette\[row\]/,
    /drawn_shape_count \+= 1/,
    /rows \* columns >= 20/,
    /changed_palette_count >= 2/,
    /columns == 6/,
    /4 <= size_step <= 10/,
    /image\.save\(output_filename\)/,
    /checked_file\.tobytes\(\) == image\.tobytes\(\)/,
    /== \(1, 2, 3, 4, 5, 6\)/,
    /WEEK 04 RHYTHM GRID COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }
});
