import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const periodAssets = [
  "week-03-period1-script-component.webp",
  "week-03-period2-lifecycle-time.webp",
  "week-03-period3-motion-mission.webp",
];

const readWeekThree = async () => Promise.all([
  readFile(resolve(courseDirectory, "week-03-period1.html"), "utf8"),
  readFile(resolve(courseDirectory, "week-03-period2.html"), "utf8"),
  readFile(resolve(courseDirectory, "week-03-period3.html"), "utf8"),
]);

test("Game Engine I index presents week 3 as two theory periods and one mission", async () => {
  const courseIndex = await readFile(resolve(courseDirectory, "index.html"), "utf8");

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp('href="week-03-period' + period + '\\.html"'));
  }

  assert.match(courseIndex, /1교시 · 이론과 설명/);
  assert.match(courseIndex, /2교시 · 이론과 설명/);
  assert.match(courseIndex, /3교시 · 완료 기준이 있는 개인 실습/);
  assert.match(courseIndex, /필수 기준 8개로 검증/);
  assert.match(courseIndex, /주 3시간: 교수자 설명 \+ 완료 기준이 있는 제작 실습/);
  assert.doesNotMatch(courseIndex, /매주 수업은 이론 1시간과 실습 2시간/);
});

test("week 3 handouts form a sourced and navigable three-period sequence", async () => {
  const pages = await readWeekThree();

  pages.forEach((page, index) => {
    const period = index + 1;
    assert.match(page, new RegExp("Game Engine I / Week 03 / Period 0" + period));
    assert.match(page, new RegExp("week-03-period" + period + "\\.html"));
    assert.match(page, /assets\/week-03\.css\?v=week3-2/);
    assert.match(page, /assets\/week-03\.js/);
    assert.match(page, new RegExp("assets/" + periodAssets[index]));
    assert.match(page, /type="image\/webp"/);
    assert.match(page, /width="1586" height="992"/);
    assert.doesNotMatch(page, /week-03-csharp-loop\.svg/);
    assert.match(page, /data-week-three-toc/);
    assert.match(page, /https:\/\/docs\.unity3d\.com\/6000\.6\/Documentation\//);
    assert.match(page, /질문이 남았다면/);
  });

  assert.match(pages[0], /href="week-03-period2\.html" rel="next"/);
  assert.match(pages[1], /href="week-03-period1\.html" rel="prev"/);
  assert.match(pages[1], /href="week-03-period3\.html" rel="next"/);
  assert.match(pages[2], /href="week-03-period2\.html" rel="prev"/);
  assert.match(pages[0], /href="week-02-period3\.html" rel="prev"/);
  assert.match(pages[2], /href="week-04-period1\.html" rel="next"/);
});

test("period 1 is teacher-led theory for reading C# structures", async () => {
  const [period1] = await readWeekThree();

  for (const requiredText of [
    "교수자 설명 자료",
    "이 교시에는 Unity 프로젝트를 따라 만들지 않습니다",
    "Script는 GameObject의 행동 Component입니다",
    "변수는 값을 기억하는 이름표입니다",
    "함수는 이름 붙인 행동 묶음입니다",
    "조건문은 실행할 길을 나눕니다",
    "class 전체를 세 층으로 읽습니다",
    "int",
    "float",
    "bool",
    "Vector3",
    "parameter",
    "return",
    '[<span class="code-type">SerializeField</span>]',
  ]) {
    assert.ok(period1.includes(requiredText), "missing period 1 theory concept: " + requiredText);
  }

  assert.equal(
    [...period1.matchAll(/class="knowledge-check"/g)].length,
    3,
    "period 1 should include three short retrieval checks",
  );
  assert.doesNotMatch(period1, /class="practice-route"/);
  assert.doesNotMatch(period1, /data-persistent-checklist/);
  assert.match(period1, /https:\/\/learn\.microsoft\.com\/dotnet\/csharp\//);
});

test("period 2 is teacher-led explanation with a complete demonstration", async () => {
  const [, period2] = await readWeekThree();

  for (const requiredText of [
    "교수자 설명과 시연",
    "MonoBehaviour는 Unity와 맺은 호출 약속입니다",
    "Inspector는 instance의 설정을 저장합니다",
    "속도는 ‘프레임당’이 아니라 ‘초당’으로 정의합니다",
    "Translate와 Rotate는 Transform의 상태를 바꿉니다",
    "교수자 시연 완성본",
    "public class</span> MotionController",
    "Move();",
    "RotateWhenEnabled();",
    "WrapAtBoundary();",
    "Time.deltaTime",
    "Space.World",
    "transform.position.x &lt;= resetAtX",
    "시연 단서",
  ]) {
    assert.ok(period2.includes(requiredText), "missing period 2 explanation: " + requiredText);
  }

  assert.equal(
    [...period2.matchAll(/class="knowledge-check"/g)].length,
    3,
    "period 2 should include three prediction checks",
  );
  assert.match(period2, /data-motion-lab/);
  assert.match(period2, /data-motion-speed/);
  assert.match(period2, /data-rotation-speed/);
  assert.doesNotMatch(period2, /class="practice-route"/);
  assert.doesNotMatch(period2, /data-persistent-checklist/);
});

test("period 3 is a finite goal-directed independent mission", async () => {
  const [, , period3] = await readWeekThree();

  for (const requiredText of [
    "학생 목표지향 독립 실습",
    "정해진 클릭 순서는 없습니다",
    "미션: Motion Test Lane",
    "출발점은 주어지지만, 구현 순서는 주어지지 않습니다",
    "시작 코드 골격",
    "TODO: 오른쪽으로 시간 기반 이동을 만듭니다",
    "해결 방법을 선명하게 만드는 기술 제약",
    "완료는 여덟 가지 관찰로 판정합니다",
    "필요한 만큼만 힌트를 엽니다",
    "설명하지 못하는 코드는 제출물에 남기지 않습니다",
    "과제 1 패키지의 핵심 결과",
    "코드 설명 다섯 문장 틀",
    "Library",
    "ProjectSettings",
  ]) {
    assert.ok(period3.includes(requiredText), "missing period 3 mission element: " + requiredText);
  }

  assert.equal(
    [...period3.matchAll(/class="pass-gate"/g)].length,
    1,
    "the mission should have one canonical pass gate",
  );
  assert.equal(
    [...period3.matchAll(/<article><span>0[1-8]<\/span><strong>/g)].length,
    8,
    "the pass gate should define eight observable criteria",
  );
  assert.equal(
    [...period3.matchAll(/class="assignment-check"/g)].length,
    8,
    "the self-review checklist should mirror all eight criteria",
  );
  assert.equal(
    [...period3.matchAll(/<details>/g)].length,
    5,
    "the mission should offer five progressively specific hints",
  );
  assert.doesNotMatch(period3, /class="practice-route"/);
  assert.doesNotMatch(period3, /Mover_Calm|Mover_Signal|Mover_Rush/);
});

test("week 3 uses three generated raster assets and maps them for social metadata", async () => {
  const [siteConfig, ...assetStats] = await Promise.all([
    readFile(resolve(root, "scripts", "site-config.mjs"), "utf8"),
    ...periodAssets.map((asset) => stat(resolve(assetDirectory, asset))),
  ]);

  periodAssets.forEach((asset, index) => {
    assert.match(siteConfig, new RegExp("/teaching/game-engine-1/assets/" + asset));
    assert.ok(assetStats[index].size > 45_000, asset + " should contain the generated raster artwork");
  });
});

test("week 3 shared assets support the teaching, mission, accessibility, and print states", async () => {
  const [css, script] = await Promise.all([
    readFile(resolve(assetDirectory, "week-03.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-03.js"), "utf8"),
  ]);

  for (const requiredSelector of [
    ".teaching-mode",
    ".mission-mode",
    ".calculation-table",
    ".lecture-cues",
    ".mission-contract",
    ".constraint-grid",
    ".pass-gate",
    ".test-matrix",
    ".hint-ladder",
  ]) {
    assert.ok(css.includes(requiredSelector), "missing week 3 style: " + requiredSelector);
  }

  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media print/);
  assert.match(css, /a\[aria-current="location"\]/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /localStorage/);
  assert.match(script, /navigator\.clipboard/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /prefers-reduced-motion/);
});

test("week 3 mobile anchors clear both sticky navigation bars", async () => {
  const css = await readFile(resolve(assetDirectory, "week-03.css"), "utf8");

  assert.match(css, /--w3-lesson-header-height: 58px/);
  assert.match(css, /--w3-sticky-toc-height: 48px/);
  assert.match(
    css,
    /scroll-margin-top: calc\(var\(--w3-lesson-header-height\) \+ var\(--w3-sticky-toc-height\) \+ 24px\)/,
  );
  assert.match(css, /top: var\(--w3-lesson-header-height\)/);
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*--w3-lesson-header-height: 68px/,
  );
});

test("week 3 reference tables keep their headers on narrow screens", async () => {
  const [, period2, period3] = await readWeekThree();
  const css = await readFile(resolve(assetDirectory, "week-03.css"), "utf8");

  for (const [page, tableClass, label] of [
    [period2, "calculation-table", "프레임률별 시간 기반 이동 비교"],
    [period3, "test-matrix", "MotionController 필수 테스트"],
  ]) {
    assert.match(
      page,
      new RegExp(
        '<div class="responsive-table" role="region" aria-label="' + label + '" tabindex="0">[\\s\\S]*<table class="' + tableClass + '">',
      ),
    );
    assert.match(page, /<thead>[\s\S]*scope="col"/);
    assert.match(page, /<tbody>[\s\S]*scope="row"/);
  }

  assert.match(css, /\.responsive-table \{[\s\S]*overflow-x: auto/);
  assert.match(css, /\.calculation-table,[\s\S]*\.test-matrix \{[\s\S]*border-collapse: collapse/);
  assert.doesNotMatch(css, /\.calculation-head,[\s\S]*\.test-head \{\s*display: none/);
});

test("week 3 copy and numbered wayfinding stay internally consistent", async () => {
  const pages = await readWeekThree();

  pages.forEach((page, index) => {
    assert.match(page, new RegExp('<p class="eyebrow">Week 03 / Period 0' + (index + 1) + "</p>"));
    assert.doesNotMatch(page, /class="hero-meta"/);
    assert.doesNotMatch(page, /[—–]/);

    const sectionLabels = [...page.matchAll(/class="section-label">([^<]+)</g)]
      .map((match) => match[1]);
    assert.ok(sectionLabels.every((label) => !label.includes("·")));
  });

  assert.match(pages[0], />Script 파일 3개</);
  assert.match(pages[0], />실행 인스턴스 3개</);
  assert.match(pages[0], />회전만 생략됨</);
  assert.doesNotMatch(pages[0], /파일세개|인스턴스셋|회전생략/);

  assert.match(pages[1], /네 연결고리로 설명합니다/);
  assert.match(pages[1], />둘 다 Start</);
  assert.match(pages[1], />저장은 Start, 이동은 Update</);
  assert.doesNotMatch(pages[1], /둘다Start|저장Start·이동Update|저장값이다름/);

  assert.match(pages[2], /class="section-label">06 \/ 힌트</);
  assert.match(pages[2], /class="section-label">07 \/ 제출</);
  assert.match(pages[2], /class="section-label">08 \/ 최종 점검</);
  assert.doesNotMatch(pages[2], /class="section-label">Assignment 01/);
});

test("week 3 styles use readable type and quiet concept cards", async () => {
  const css = await readFile(resolve(assetDirectory, "week-03.css"), "utf8");

  assert.match(css, /\.week-three-lesson-facts dd \{[\s\S]*font-size: 14px/);
  assert.match(css, /\.week-three-section > header > p \{[\s\S]*font-size: 15px/);
  assert.match(css, /\.concept-card p,[\s\S]*\.source-card p \{[\s\S]*font-size: 14px/);
  assert.match(
    css,
    /\.concept-card,[\s\S]*\.source-card \{[\s\S]*border: 0;[\s\S]*border-top: 1px solid var\(--line\);[\s\S]*border-radius: 0;[\s\S]*background: transparent/,
  );
  const fontSizes = [...css.matchAll(/(?:font-size\s*:\s*|font\s*:[^;\n]*?\s)(\d+(?:\.\d+)?)px/g)]
    .map((match) => Number(match[1]));
  assert.ok(fontSizes.every((size) => size >= 12), "week 3 text should never render below 12px");
});

test("week 3 motion lab sleeps when animation cannot be seen", async () => {
  const script = await readFile(resolve(assetDirectory, "week-03.js"), "utf8");

  assert.match(script, /const shouldAnimate = \(\) =>/);
  assert.match(script, /document\.hidden/);
  assert.match(script, /new IntersectionObserver/);
  assert.match(script, /cancelAnimationFrame\(frameRequest\)/);
  assert.match(script, /const syncAnimation = \(\) =>/);
  assert.match(script, /visibilitychange/);
  assert.match(script, /let inViewport = !\("IntersectionObserver" in window\)/);
  assert.match(script, /rootMargin: "0px"/);
});

test("week 3 checklist reports progress and confirms destructive reset", async () => {
  const [, , period3] = await readWeekThree();
  const [css, script] = await Promise.all([
    readFile(resolve(assetDirectory, "week-03.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-03.js"), "utf8"),
  ]);

  assert.match(
    period3,
    /data-checklist-progress role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(script, /reset\.dataset\.confirming/);
  assert.match(script, /다시 눌러 초기화/);
  assert.match(script, /window\.setTimeout/);
  assert.match(script, /reset\.disabled = completed === 0/);
  assert.match(css, /\.checklist-reset\[data-confirming="true"\]/);
  assert.match(css, /\.checklist-reset:disabled/);
});

test("week 3 dark feedback stays legible and hover is pointer-safe", async () => {
  const css = await readFile(resolve(assetDirectory, "week-03.css"), "utf8");
  const hoverMediaStart = css.indexOf("@media (hover: hover) and (pointer: fine)");
  const darkMediaStart = css.indexOf("@media (prefers-color-scheme: dark)");
  const reducedMotionStart = css.indexOf("@media (prefers-reduced-motion: reduce)");

  assert.ok(hoverMediaStart >= 0, "fine-pointer hover rules should be grouped in a media query");
  for (const selector of [
    ".copy-code:hover",
    ".quiz-option:hover",
    ".source-card a:hover",
    ".toc a:hover",
  ]) {
    const selectorIndex = css.indexOf(selector);
    assert.ok(selectorIndex > hoverMediaStart && selectorIndex < darkMediaStart, selector + " must be pointer-safe");
  }

  const darkStyles = css.slice(darkMediaStart, reducedMotionStart);
  assert.match(
    darkStyles,
    /\.quiz-option\[data-state="correct"\] \{[\s\S]*background: color-mix\(in srgb, var\(--w3-success\) 16%, var\(--paper\)\)/,
  );
  assert.match(
    darkStyles,
    /\.quiz-option\[data-state="incorrect"\] \{[\s\S]*background: color-mix\(in srgb, var\(--w3-danger\) 16%, var\(--paper\)\)/,
  );
});
