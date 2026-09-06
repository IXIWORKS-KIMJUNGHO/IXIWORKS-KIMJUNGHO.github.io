import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const readWeekFour = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-03-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-04-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-04-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-04-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-04-input-physics.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-04.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-04.js"), "utf8"),
  ]);

test("Game Engine I week 4 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3, legacy] =
    await readWeekFour();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-04-period${period}\\.html"`));
    assert.match(
      siteConfig,
      new RegExp(`teaching/game-engine-1/week-04-period${period}\\.html`),
    );
    assert.match(siteConfig, new RegExp(`week-04-period${period}-hero\\.webp`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-04-period${period}\\.html`));

    const hero = await stat(resolve(assetDirectory, `week-04-period${period}-hero.webp`));
    assert.ok(hero.size > 100_000, `period ${period} generated hero should be present`);
  }

  assert.match(previousLesson, /href="week-04-period1\.html" rel="next"/);
  assert.match(period1, /href="week-03-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-04-period2\.html" rel="next"/);
  assert.match(period2, /href="week-04-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-04-period3\.html" rel="next"/);
  assert.match(period3, /href="week-04-period2\.html" rel="prev"/);
  assert.match(legacy, /http-equiv="refresh" content="0; url=week-04-period1\.html"/);
});

test("periods 1 and 2 are professor-led, while period 3 is goal-oriented individual work", async () => {
  const [, , period1, period2, period3] = await readWeekFour();

  for (const [period, expected] of [
    [period1, "교수자 설명 중심"],
    [period2, "교수자 설명 · 코드 시연"],
  ]) {
    assert.ok(period.includes(expected));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다") || period.includes("Script 작성과 Scene 제작은 아직 시작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /180 min|180분의 흐름|Practice \/ 2 hours/);
  }

  for (const requiredText of [
    "개인 목표지향 실습",
    "목표는 고정하고 방법은 선택합니다",
    "작업 순서를 스스로 고릅니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
    "학생 개인 실습",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }

  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
  assert.doesNotMatch(period3, /180 min|Practice \/ 2 hours/);
});

test("period 1 explains device-independent actions and Vector2 in beginner language", async () => {
  const [, , period1] = await readWeekFour();

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "model",
    "actions",
    "vector",
    "bindings",
    "reading",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const requiredText of [
    "Device, Control, Binding, Action",
    "물건 → 부분 → 연결 규칙 → 게임 속 의미",
    "Action Type = Value",
    "Control Type = Vector2",
    "2D Vector Composite",
    "Vector2.ClampMagnitude",
    "WASD · Arrows · Stick",
  ]) {
    assert.ok(period1.includes(requiredText), `period 1 missing: ${requiredText}`);
  }

  assert.match(period1, /assets\/week-04-period1-hero\.webp/);
  assert.match(period1, /00–07[\s\S]*54–60/);
});

test("period 2 explains the complete input-to-physics controller", async () => {
  const [, , , period2] = await readWeekFour();

  for (const pattern of [
    /using UnityEngine\.InputSystem;/,
    /\[RequireComponent\(typeof\(Rigidbody2D\)\)\]/,
    /InputActionReference moveAction/,
    /private void Awake\(\)/,
    /private void OnEnable\(\)/,
    /private void OnDisable\(\)/,
    /private void Update\(\)[\s\S]*ReadValue&lt;Vector2&gt;\(\)[\s\S]*Vector2\.ClampMagnitude/,
    /private void FixedUpdate\(\)[\s\S]*body\.linearVelocity = moveInput \* moveSpeed;/,
    /linearVelocity[\s\S]*Time\.deltaTime[\s\S]*곱하지 않습니다/,
    /Gravity Scale<\/dt><dd>0/,
    /Freeze Rotation Z/,
    /Is Trigger<\/dt><dd>Off/,
    /2D는 2D 물리 Component/,
  ]) {
    assert.match(period2, pattern);
  }

  for (const sectionId of [
    "clock",
    "body",
    "velocity",
    "controller",
    "wire",
    "collision",
    "mistakes",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  assert.match(period2, /assets\/week-04-period2-hero\.webp/);
  assert.match(period2, /00–06[\s\S]*54–60/);
});

test("period 2 explains controller responsibilities before the full reference script", async () => {
  const [, , , period2, , , stylesheet] = await readWeekFour();
  const controllerStart = period2.indexOf('id="controller"');
  const controllerEnd = period2.indexOf('id="wire"');
  const controller = period2.slice(controllerStart, controllerEnd);

  assert.ok(controllerStart >= 0 && controllerEnd > controllerStart);
  assert.ok(
    controller.indexOf('<div class="line-reasons">') <
      controller.indexOf('<details class="reference-code">'),
    "responsibility explanations should precede the complete script",
  );
  assert.match(controller, /<summary>[\s\S]*전체 PlayerController 코드 펼쳐보기/);
  assert.match(
    stylesheet,
    /\.reference-code \.code-panel \{[\s\S]*?box-shadow: none;/,
  );
});

test("period 3 has measurable gates, persistent tests, and reproducible evidence", async () => {
  const [, , , , period3, , stylesheet, script] = await readWeekFour();

  assert.equal(
    [...period3.matchAll(/data-test-id=/g)].length,
    9,
    "test table should contain eight required tests and one optional test",
  );
  assert.equal(
    [...period3.matchAll(/data-required="true"/g)].length,
    8,
    "eight tests should be required",
  );
  assert.equal(
    [...period3.matchAll(/data-check-id=/g)].length,
    8,
    "final gate should contain eight checks",
  );
  assert.match(
    period3,
    /role="region" aria-label="4주차 이동과 충돌 테스트표" aria-describedby="test-table-scroll-hint" tabindex="0"/,
  );
  assert.match(period3, /data-test-status-message role="status" aria-live="polite"/);
  assert.match(period3, /assets\/week-04-period3-hero\.webp/);
  assert.match(period3, /week04_학번_이름_test\.csv/);
  assert.match(
    period3,
    /href="week-05-period1\.html" rel="next"[\s\S]*Next/,
  );
  assert.doesNotMatch(period3, /href="\.\/"[\s\S]*Course index/);

  for (const pattern of [
    /localStorage/,
    /game-engine-1-week-04-build-v1/,
    /game-engine-1-week-04-tests-v1/,
    /new Blob/,
    /text\/csv;charset=utf-8/,
    /week04_\$\{identityParts\.join\("_"\)\}_test\.csv/,
    /spreadsheetSafe/,
    /navigator\.clipboard/,
    /IntersectionObserver/,
  ]) {
    assert.match(script, pattern);
  }

  for (const pattern of [
    /@media \(max-width: 760px\)/,
    /@media \(prefers-color-scheme: dark\)/,
    /@media \(prefers-reduced-motion: reduce\)/,
    /@media print/,
    /\.test-table tr\[data-result="pass"\]/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("mobile section links clear both sticky navigation bars", async () => {
  const [, , , , , , stylesheet, script] = await readWeekFour();

  assert.match(
    stylesheet,
    /@media \(max-width: 980px\)[\s\S]*?game-engine-week-four \[id\] \{[\s\S]*?scroll-margin-top: 148px;/,
  );
  assert.doesNotMatch(script, /scrollIntoView/);
  assert.match(script, /navigation\.scrollTo\(\{[\s\S]*?left:/);
});

test("practice records are reversible and student identity stays in the current tab", async () => {
  const [, , , , period3, , , script] = await readWeekFour();

  for (const publicControl of [
    "data-build-undo",
    "data-undo-tests",
    "data-undo-identity",
    "data-reset-identity",
  ]) {
    assert.ok(period3.includes(publicControl), `period 3 missing: ${publicControl}`);
  }

  assert.match(period3, /학번과 이름은 현재 탭에서만 유지/);
  assert.match(
    period3,
    /data-test-progress role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(
    period3,
    /data-build-progress-label role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(script, /const undoWindowMs = 8_000;/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /writeStorage\(testStorageKey, \{ tests: data\.tests \}\);/);
  assert.match(script, /let testUndoTimer = 0;[\s\S]*?let identityUndoTimer = 0;/);
  assert.match(script, /readSessionStorage\(buildStorageKey, \[\]\)/);
  assert.doesNotMatch(script, /readStorage\(buildStorageKey, \[\]\)/);
});

test("lecture code copy controls identify the instructor action and confirm it in place", async () => {
  const [, , period1, period2, , , , script] = await readWeekFour();

  for (const lecture of [period1, period2]) {
    assert.match(lecture, />교수자 시연용 복사<\/button>/);
  }

  assert.match(script, /button\.textContent = copied \? "복사됨" : "복사 실패";/);
  assert.match(script, /button\.dataset\.copyState = copied \? "success" : "error";/);
  assert.match(script, /typeof document\.execCommand === "function"/);
  assert.match(script, /catch \{[\s\S]*?copied = false;/);
});

test("each period carries its semantic accent into navigation and primary actions", async () => {
  const [, , , , , , stylesheet] = await readWeekFour();

  assert.match(
    stylesheet,
    /week-four-period-two \{[\s\S]*?--w4-accent: var\(--w4-cyan\);/,
  );
  assert.match(
    stylesheet,
    /week-four-period-three \{[\s\S]*?--w4-accent: var\(--w4-lime\);/,
  );
  assert.match(stylesheet, /outline: 3px solid color-mix\(in srgb, var\(--w4-accent\)/);
  assert.match(
    stylesheet,
    /\.hero-action-primary \{[\s\S]*?background: var\(--w4-accent-dark\);/,
  );
  assert.match(
    stylesheet,
    /\.week-four-toc a\[aria-current="location"\] \{[\s\S]*?var\(--w4-accent-soft\)/,
  );
});

test("mobile handouts keep code and test controls readable and discoverable", async () => {
  const [, , , , period3, , stylesheet] = await readWeekFour();

  assert.match(period3, /id="test-table-scroll-hint"[\s\S]*?좌우로 이동/);
  assert.match(
    period3,
    /aria-label="4주차 이동과 충돌 테스트표" aria-describedby="test-table-scroll-hint"/,
  );
  assert.match(
    stylesheet,
    /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.hero-action:hover/,
  );
  assert.match(
    stylesheet,
    /@media \(hover: none\), \(pointer: coarse\) \{[\s\S]*?\.lesson-sequence a:hover[\s\S]*?\.week-four-toc a\[aria-current="location"\]:hover \{[\s\S]*?background: color-mix\(in srgb, var\(--w4-accent-soft\) 67%, var\(--paper\)\);/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 980px\)[\s\S]*?\.table-scroll-hint \{[\s\S]*?display: block;[\s\S]*?\.test-table :is\(th, td\):first-child \{[\s\S]*?position: sticky;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\)[\s\S]*?\.equation-strip \{[\s\S]*?flex-direction: column;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\)[\s\S]*?\.code-panel pre \{[\s\S]*?font-size: 12\.5px;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.week-four-hero-visual img \{[\s\S]*?aspect-ratio: 16 \/ 9;[\s\S]*?object-fit: cover;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\)[\s\S]*?\.week-four-hero-visual figcaption \{[\s\S]*?display: none;/,
  );
});

test("the three periods cite version-matched Unity primary sources", async () => {
  const [, , period1, period2, period3] = await readWeekFour();
  const combined = `${period1}\n${period2}\n${period3}`;

  for (const officialUrl of [
    "https://docs.unity3d.com/6000.6/Documentation/Manual/com.unity.inputsystem.html",
    "https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/Installation.html",
    "https://docs.unity3d.com/Packages/com.unity.inputsystem@1.20/manual/Actions.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/time-per-frame-updates.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/fixed-updates.html",
    "https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Rigidbody2D-linearVelocity.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/2d-physics/rigidbody/introduction-to-rigidbody-2d.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/2d-physics/collider/collider-2d-landing.html",
  ]) {
    assert.ok(combined.includes(officialUrl), `missing official Unity source: ${officialUrl}`);
  }
});
