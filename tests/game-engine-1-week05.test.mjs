import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const periodAssets = [
  "week-05-period1-trigger-event.webp",
  "week-05-period2-tilemap-system.webp",
  "week-05-period3-interaction-mission.webp",
];

const readWeekFive = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-04-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-05-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-05-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-05-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-05.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-05.js"), "utf8"),
  ]);

const readZipEntries = async (archivePath) => {
  const archive = await readFile(archivePath);
  const earliestEnd = Math.max(0, archive.length - 65_557);
  let endOffset = -1;

  for (let offset = archive.length - 22; offset >= earliestEnd; offset--) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }

  assert.notEqual(endOffset, -1, "starter archive should have a ZIP end record");
  const entryCount = archive.readUInt16LE(endOffset + 10);
  let centralOffset = archive.readUInt32LE(endOffset + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index++) {
    assert.equal(archive.readUInt32LE(centralOffset), 0x02014b50);
    const method = archive.readUInt16LE(centralOffset + 10);
    const compressedSize = archive.readUInt32LE(centralOffset + 20);
    const uncompressedSize = archive.readUInt32LE(centralOffset + 24);
    const nameLength = archive.readUInt16LE(centralOffset + 28);
    const extraLength = archive.readUInt16LE(centralOffset + 30);
    const commentLength = archive.readUInt16LE(centralOffset + 32);
    const localOffset = archive.readUInt32LE(centralOffset + 42);
    const name = archive
      .subarray(centralOffset + 46, centralOffset + 46 + nameLength)
      .toString("utf8");

    assert.equal(archive.readUInt32LE(localOffset), 0x04034b50);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
    let contents;
    if (method === 0) contents = Buffer.from(compressed);
    else if (method === 8) contents = inflateRawSync(compressed);
    else assert.fail(`unsupported ZIP method for ${name}`);

    assert.equal(contents.length, uncompressedSize, `${name} should decompress completely`);
    entries.set(name, contents);
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
};

test("Game Engine I week 5 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3] = await readWeekFive();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");

  for (const [index, asset] of periodAssets.entries()) {
    const period = index + 1;
    assert.match(courseIndex, new RegExp(`href="week-05-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-05-period${period}\\.html`));
    assert.ok(siteConfig.includes(`/teaching/game-engine-1/assets/${asset}`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-05-period${period}\\.html`));

    const hero = await stat(resolve(assetDirectory, asset));
    assert.ok(hero.size > 100_000, `${asset} should contain generated raster artwork`);
  }

  assert.match(previousLesson, /href="week-05-period1\.html" rel="next"/);
  assert.match(period1, /href="week-04-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-05-period2\.html" rel="next"/);
  assert.match(period2, /href="week-05-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-05-period3\.html" rel="next"/);
  assert.match(period3, /href="week-05-period2\.html" rel="prev"/);
});

test("periods 1 and 2 are teacher-led theory while period 3 is a goal-oriented lab", async () => {
  const [, , period1, period2, period3] = await readWeekFive();

  for (const [index, period] of [period1, period2].entries()) {
    assert.ok(period.includes(`5주차 ${index + 1}교시 / 이론과 설명`));
    assert.ok(period.includes("교수자 설명 자료"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /실습\(2시간\)|180 min|180분/);
  }

  for (const requiredText of [
    "5주차 3교시 / 개인 목표지향 실습",
    "학생 개인 실습",
    "목표는 고정하고 경로와 순서는 선택합니다",
    "개인 목표지향 실습",
    "필수 테스트 8개",
    "8 / 8 PASS",
    "정확히 3개의 수집물, 2개의 위험 구역, 1개의 목표",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }

  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
});

test("week 5 keeps the first screen focused and moves lesson facts into the arrival section", async () => {
  const [, , period1, period2, period3] = await readWeekFive();

  for (const period of [period1, period2, period3]) {
    const hero = period.match(/<header class="hero week-five-hero">[\s\S]*?<\/header>/)?.[0];
    const arrival = period.match(/<section class="week-five-arrival"[\s\S]*?<\/section>/)?.[0];

    assert.ok(hero, "the lesson hero should exist");
    assert.ok(arrival, "the arrival section should exist");
    assert.doesNotMatch(hero, /week-five-(?:hero|lesson)-facts/);
    assert.match(arrival, /class="week-five-lesson-facts"/);
  }
});

test("week 5 keeps labels readable and frequent controls tactile without touch hover traps", async () => {
  const [, , , , , stylesheet] = await readWeekFive();

  assert.doesNotMatch(
    stylesheet,
    /(?:font|font-size)\s*:[^;\n]*(?:^|[^\d.])(?:9(?:\.5)?|10|11)px/m,
    "student-facing labels and controls should not fall below 12px",
  );
  assert.doesNotMatch(stylesheet, /transition:\s*all|ease-in(?:\s|,|;)/);
  assert.match(stylesheet, /--w5-ease-out:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\)/);
  assert.match(
    stylesheet,
    /transition:[^;]*transform 150ms var\(--w5-ease-out\)[^;]*border-color 150ms ease[^;]*background-color 150ms ease[^;]*color 150ms ease/,
  );
  assert.match(
    stylesheet,
    /:is\(\.week-five-hero-action,[\s\S]*?\.checklist-reset\):active\s*\{[\s\S]*?transform:\s*scale\(\.97\)/,
  );
  assert.match(
    stylesheet,
    /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.week-five-hero-action:hover[\s\S]*?\.quiz-option:hover[\s\S]*?\.starter-download:hover/,
  );
  assert.match(
    stylesheet,
    /\.lesson-breadcrumb,[\s\S]*?\.lesson-sequence a,[\s\S]*?\.week-five-hero \.eyebrow,[\s\S]*?\.toc-title\s*\{[\s\S]*?font-size:\s*var\(--w5-label-size\)/,
  );
});

test("week 5 uses a restrained reading hierarchy and plain student-facing labels", async () => {
  const [, , period1, period2, period3] = await readWeekFive();
  const expectedEyebrows = [
    "5주차 1교시 / 이론과 설명",
    "5주차 2교시 / 이론과 설명",
    "5주차 3교시 / 개인 목표지향 실습",
  ];

  for (const [index, period] of [period1, period2, period3].entries()) {
    const body = period.match(/<body[\s\S]*?<\/body>/)?.[0];
    const eyebrow = period.match(/<p class="eyebrow">([^<]+)<\/p>/)?.[1];

    assert.ok(body, "the lesson body should exist");
    assert.equal(eyebrow, expectedEyebrows[index]);
    assert.equal([...body.matchAll(/class="section-index"/g)].length, 0);
    assert.doesNotMatch(body, /[—–]/, "visible ranges and joins should use plain punctuation");
    assert.ok(
      [...body.matchAll(/·/g)].length <= 4,
      "middle dots should be reserved for rare compact metadata",
    );
  }
});

test("week 5 separates page accents, semantic colors, and quiet reference rows", async () => {
  const [, , , , , stylesheet] = await readWeekFive();

  assert.match(stylesheet, /--w5-page-accent:\s*var\(--w5-amber\)/);
  assert.match(
    stylesheet,
    /body\.course-game-engine-1\.game-engine-week-five\.week-five-period-two\s*\{[\s\S]*?--w5-page-accent:\s*var\(--w5-cyan\)/,
  );
  assert.match(
    stylesheet,
    /body\.course-game-engine-1\.game-engine-week-five\.week-five-period-three\s*\{[\s\S]*?--w5-page-accent:\s*var\(--w5-violet\)/,
  );
  assert.doesNotMatch(stylesheet, /--w5-page-accent:\s*var\(--w5-(?:lime|coral)\)/);
  assert.match(
    stylesheet,
    /\.starter-download\s*\{[\s\S]*?border:\s*1px solid var\(--w5-page-accent\)[\s\S]*?background:\s*color-mix\(in srgb, var\(--w5-page-accent-soft\)/,
  );
  assert.match(
    stylesheet,
    /\.test-button-primary\s*\{[\s\S]*?background:\s*var\(--w5-page-accent-strong\)[\s\S]*?color:\s*var\(--w5-on-accent\)/,
  );
  assert.match(
    stylesheet,
    /@media \(prefers-color-scheme: dark\)[\s\S]*?--w5-on-accent:\s*#151b19/,
  );
  assert.match(
    stylesheet,
    /:is\(\.concept-card, \.source-card, \.role-grid article, \.prediction-grid article\)\s*\{[\s\S]*?border-top:\s*1px solid var\(--line\)[\s\S]*?border-radius:\s*0[\s\S]*?background:\s*transparent/,
  );
  assert.match(
    stylesheet,
    /:is\(\.comparison-card, \.requirement-grid article, \.constraint-grid article, \.submission-grid article\)\s*\{[\s\S]*?border-radius:\s*var\(--w5-radius-panel\)[\s\S]*?background:\s*var\(--paper\)/,
  );
  assert.match(
    stylesheet,
    /\.pass-gate article\s*\{[\s\S]*?border-radius:\s*0[\s\S]*?background:\s*transparent/,
  );
  assert.match(stylesheet, /--w5-radius-control:\s*4px/);
  assert.match(stylesheet, /--w5-radius-panel:\s*8px/);
  assert.doesNotMatch(stylesheet, /border-radius:\s*(?:5|6|7)px/);
});

test("week 5 keeps explanatory copy larger than compact labels", async () => {
  const [, , , , , stylesheet] = await readWeekFive();

  assert.match(stylesheet, /--w5-reading-small-size:\s*14px/);
  for (const selector of [
    "scope-line p",
    "session-track p",
    "contact-model p",
    "event-timeline p",
    "system-layer > p",
    "code-reading span",
    "pass-gate article > p",
    "test-table td",
    "build-check p",
    "hint-ladder details p",
  ]) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      stylesheet,
      new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?font-size:\\s*var\\(--w5-reading-small-size\\)`),
      `${selector} should use the readable explanatory-copy size`,
    );
  }
});

test("mobile section links clear the lesson header and sticky table of contents", async () => {
  const [, , , , , stylesheet] = await readWeekFive();

  assert.match(
    stylesheet,
    /@media \(max-width: 1040px\)[\s\S]*?body\.course-game-engine-1\.game-engine-week-five \[id\]\s*\{[\s\S]*?scroll-margin-top:\s*128px/,
  );
});

test("the required test record stacks into labeled rows on narrow screens", async () => {
  const [, , , , , stylesheet] = await readWeekFive();
  const mobile = stylesheet.match(
    /@media \(max-width: 760px\) \{[\s\S]*?(?=@media \(prefers-color-scheme: dark\))/,
  )?.[0];

  assert.ok(mobile, "the narrow-screen rules should exist");
  assert.match(mobile, /\.test-table-wrap\s*\{[\s\S]*?overflow-x:\s*visible/);
  assert.match(mobile, /\.test-table\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(
    mobile,
    /\.test-table thead\s*\{[\s\S]*?position:\s*absolute[\s\S]*?clip-path:\s*inset\(50%\)/,
  );
  assert.match(
    mobile,
    /\.test-table,[\s\S]*?\.test-table tbody,[\s\S]*?\.test-table tr,[\s\S]*?\.test-table th,[\s\S]*?\.test-table td\s*\{[\s\S]*?display:\s*block/,
  );

  for (const [column, label] of [
    [1, "조작과 조건"],
    [2, "기대 결과"],
    [3, "판정"],
    [4, "관찰과 수정 기록"],
  ]) {
    assert.match(
      mobile,
      new RegExp(`\\.test-table td:nth-of-type\\(${column}\\)::before\\s*\\{[^}]*content:\\s*"${label}"`),
    );
  }
});

test("destructive resets require a second press and announce their state", async () => {
  const [, , , , period3, , script] = await readWeekFive();

  assert.match(period3, /data-build-status-message aria-live="polite"/);
  assert.match(period3, /data-test-status-message aria-live="polite"/);
  assert.match(
    period3,
    /data-test-progress role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(
    period3,
    /data-build-progress-label role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(script, /const setupGuardedReset = \(\{/);
  assert.match(script, /한 번 더 눌러 초기화/);
  assert.match(
    script,
    /if \(button\.dataset\.confirm !== "true"\) \{[\s\S]*?button\.dataset\.confirm = "true";[\s\S]*?return;[\s\S]*?onConfirm\(\);/,
  );
  assert.match(script, /delete button\.dataset\.confirm/);
  assert.equal([...script.matchAll(/setupGuardedReset\(\{/g)].length, 2);
  assert.doesNotMatch(script, /reset\?\.addEventListener\("click"/);
  assert.doesNotMatch(script, /resetButton\?\.addEventListener\("click"/);
});

test("student identity stays in the current tab while anonymous test evidence persists", async () => {
  const [, , , , period3, , script] = await readWeekFive();

  assert.match(period3, /학번과 이름은 현재 탭에서만 유지/);
  assert.match(period3, /data-student-name[^>]*autocomplete="off"|autocomplete="off"[^>]*data-student-name/);
  assert.match(script, /const readSessionStorage =/);
  assert.match(script, /const writeSessionStorage =/);
  assert.match(script, /writeStorage\(storageKey, \{ tests: data\.tests \}\);/);
  assert.match(script, /writeSessionStorage\(identityStorageKey, data\.identity\);/);
  assert.match(script, /removeSessionStorage\(identityStorageKey\);/);
  assert.doesNotMatch(script, /writeStorage\(storageKey, serialize\(\)\)/);
  assert.doesNotMatch(script, /saved\.identity\?\./);
});

test("period 1 explains how 2D contact becomes a trigger event", async () => {
  const [, , period1] = await readWeekFive();

  for (const sectionId of [
    "contact",
    "compare",
    "callback",
    "identity",
    "code",
    "exit",
    "sources",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const requiredText of [
    "Collider2D",
    "Rigidbody2D",
    "Layer Matrix",
    "Is Trigger",
    "OnTriggerEnter2D",
    "Collider2D other",
    "Layer는 만남을 거르고, Tag는 상대를 확인합니다",
    "Sorting Layer",
    "CompareTag",
    "Rigidbody2D의 Simulated 끄기",
    "collected =",
    "gameObject.SetActive",
  ]) {
    assert.ok(period1.includes(requiredText), `period 1 missing: ${requiredText}`);
  }

  assert.equal([...period1.matchAll(/data-quiz /g)].length, 3);
  assert.match(period1, /00-08[\s\S]*54-60/);
});

test("period 2 connects Tilemap structure, Prefabs, layers, and complete scripts", async () => {
  const [, , , period2] = await readWeekFive();

  for (const requiredText of [
    "Grid",
    "Tile Asset",
    "Tile Palette",
    "Tilemap Renderer",
    "Tilemap Collider 2D",
    "Ground Tilemap",
    "Collision Tilemap",
    "PF_Collectible",
    "PF_HazardZone",
    "PF_GoalZone",
    "PlayerProgress.cs",
    "Collectible.cs",
    "HazardZone.cs",
    "GoalZone.cs",
    "TryGetComponent",
    "HasAllCollectibles",
    "body.linearVelocity",
    "body.position",
    "LEVEL COMPLETE",
  ]) {
    assert.ok(period2.includes(requiredText), `period 2 missing: ${requiredText}`);
  }

  assert.equal([...period2.matchAll(/data-quiz /g)].length, 3);
  assert.equal([...period2.matchAll(/class="code-card"/g)].length, 4);
  assert.match(period2, /00-08[\s\S]*55-60/);
  assert.doesNotMatch(period2, /transform\.position/);
  assert.doesNotMatch(period2, /data-test-table|data-build-checklist/);
});

test("teacher-led code controls remain clearly instructor-facing", async () => {
  const [, , period1, period2, , , script] = await readWeekFive();

  assert.equal([...period1.matchAll(/data-copy-code>교수자 시연용 복사<\/button>/g)].length, 3);
  assert.equal([...period2.matchAll(/data-copy-code>교수자 시연용 복사<\/button>/g)].length, 4);
  assert.match(script, /button\.textContent = "교수자 시연용 복사"/);
});

test("period 3 provides finite requirements, persistent evidence, and progressive hints", async () => {
  const [, , , , period3, stylesheet, script] = await readWeekFive();

  assert.equal([...period3.matchAll(/data-test-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/data-required="true"/g)].length, 8);
  assert.equal([...period3.matchAll(/data-check-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/<details>/g)].length, 5);
  assert.match(period3, /data-test-table data-storage-key="game-engine-1-week-05-tests-v1"/);
  assert.match(period3, /data-build-checklist data-storage-key="game-engine-1-week-05-build-v1"/);
  assert.match(period3, /assets\/week-05-interaction-starter\.zip/);
  assert.match(period3, /45-60초 화면 기록/);
  assert.match(period3, /설명하지 못하는 코드는 제출물에 남기지 않습니다/);

  const starter = await stat(resolve(assetDirectory, "week-05-interaction-starter.zip"));
  assert.ok(starter.size > 1_500, "the compiling TODO starter archive should be present");

  for (const pattern of [
    /localStorage/,
    /game-engine-1-week-05-build-v1/,
    /game-engine-1-week-05-tests-v1/,
    /new Blob/,
    /text\/csv;charset=utf-8/,
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
    /\.hint-ladder/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("the Korean starter folder and downloadable archive stay byte-for-byte aligned", async () => {
  const starterDirectory = resolve(assetDirectory, "week-05-starter");
  const archivePath = resolve(assetDirectory, "week-05-interaction-starter.zip");
  const expectedNames = [
    "README.md",
    "PlayerProgress.cs",
    "Collectible.cs",
    "HazardZone.cs",
    "GoalZone.cs",
  ];
  const entries = await readZipEntries(archivePath);
  const archiveFiles = [...entries.keys()].filter((name) => !name.endsWith("/"));

  assert.deepEqual(
    archiveFiles.map((name) => name.split("/").at(-1)).sort(),
    [...expectedNames].sort(),
  );

  for (const name of expectedNames) {
    const archiveName = archiveFiles.find(
      (entry) => entry === name || entry.endsWith("/" + name),
    );
    assert.ok(archiveName, `${name} should be present in the starter archive`);
    assert.deepEqual(entries.get(archiveName), await readFile(resolve(starterDirectory, name)));
  }

  const playerProgress = await readFile(resolve(starterDirectory, "PlayerProgress.cs"), "utf8");
  const starterGuide = await readFile(resolve(starterDirectory, "README.md"), "utf8");
  const starterScripts = await Promise.all(
    expectedNames
      .filter((name) => name.endsWith(".cs"))
      .map((name) => readFile(resolve(starterDirectory, name), "utf8")),
  );

  assert.match(starterGuide, /5주차 상호작용 시작 파일/);
  assert.match(playerProgress, /Rigidbody2D body/);
  assert.match(playerProgress, /body\.linearVelocity/);
  assert.match(playerProgress, /body\.position/);
  assert.doesNotMatch(playerProgress, /transform\.position/);
  assert.doesNotMatch(
    starterScripts.join("\n"),
    /Remember the|Increase collected|Return whether|Move the Player|Ignore repeated|Find PlayerProgress|Record one collection|Ignore non-Player|Log success only/,
  );
});

test("week 5 cites version-matched Unity primary sources and records image generation", async () => {
  const [, , period1, period2, period3] = await readWeekFive();
  const combined = `${period1}\n${period2}\n${period3}`;
  const visualLog = await readFile(
    resolve(courseDirectory, "research", "week-05-visual-generation-log.md"),
    "utf8",
  );

  for (const officialUrl of [
    "https://docs.unity3d.com/6000.6/Documentation/ScriptReference/MonoBehaviour.OnTriggerEnter2D.html",
    "https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Component.CompareTag.html",
    "https://docs.unity3d.com/6000.6/Documentation/ScriptReference/Component.TryGetComponent.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/class-Physics2DSettings.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/tilemaps/tilemaps.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/tilemaps/work-with-tilemaps/tilemap-collider-2d.html",
    "https://docs.unity3d.com/6000.6/Documentation/Manual/Prefabs.html",
  ]) {
    assert.ok(combined.includes(officialUrl), `missing official Unity source: ${officialUrl}`);
  }

  assert.match(visualLog, /Mode: built-in ImageGen/);
  assert.doesNotMatch(visualLog, /\/Users\/|codex-accounts/);
  assert.equal([...visualLog.matchAll(/Primary request:/g)].length, 3);
  for (const asset of periodAssets) assert.ok(visualLog.includes(asset));
});
