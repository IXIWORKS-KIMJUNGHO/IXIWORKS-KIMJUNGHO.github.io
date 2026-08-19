import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const readWeekTwelve = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-12-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-12-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-12-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-12.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-12.js"), "utf8"),
  ]);

test("Game Engine I week 12 is published as three connected periods", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekTwelve();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const weekTwelveIndex = courseIndex.match(
    /<section class="week-group" id="week-12"[\s\S]*?<\/section>/,
  )?.[0];
  const imageNames = [
    "week-12-period1-control-surfaces.webp",
    "week-12-period2-bounded-automation.webp",
    "week-12-period3-readiness-mission.webp",
  ];

  assert.ok(weekTwelveIndex, "the course index should include week 12");
  assert.match(weekTwelveIndex, /1교시 · 이론과 설명/);
  assert.match(weekTwelveIndex, /2교시 · 이론과 설명·시연/);
  assert.match(weekTwelveIndex, /3교시 · 목표지향 개인 실습/);
  assert.doesNotMatch(weekTwelveIndex, /이론\(1시간\)|실습\(2시간\)/);

  for (const period of [1, 2, 3]) {
    assert.match(weekTwelveIndex, new RegExp(`href="week-12-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-12-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-12-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 100_000, `period ${period} generated WebP should be present`);

    const htmlPath = resolve(courseDirectory, `week-12-period${period}.html`);
    const html = [period1, period2, period3][period - 1];
    const shareImage = shareImageMetadataForHtml(root, htmlPath);
    assert.match(html, new RegExp(`<meta property="og:image" content="${shareImage.url}">`));
    assert.ok(
      html.includes(`<meta property="og:image:alt" content="${shareImage.alt}">`),
      `period ${period} should publish the configured social image alt`,
    );
    assert.match(html, new RegExp(`<meta name="twitter:image" content="${shareImage.url}">`));
  }

  assert.match(period1, /href="week-12-period2\.html" rel="next"/);
  assert.match(period2, /href="week-12-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-12-period3\.html" rel="next"/);
  assert.match(period3, /href="week-12-period2\.html" rel="prev"/);
});

test("week 12 teaches bounded automation without asking students to repeat the one write", async () => {
  const [, period1, period2, period3] = await readWeekTwelve();

  for (const period of [period1, period2]) {
    assert.ok(period.includes("교수자"));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
  }

  for (const requiredText of [
    "학생 개인 목표지향 실습",
    "목표는 고정하고 구현 경로는 선택합니다",
    "작업 속도",
    "필수 테스트 8개",
    "8 / 8 PASS",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }

  assert.match(period2, /unity -V/);
  assert.match(period2, /unity list --project-path=/);
  assert.doesNotMatch(period2, /unity --version|unity eval/);

  assert.match(period3, /첫 쓰기 전에 녹화를 시작/);
  assert.match(period3, /rollback 확인 뒤 녹화를 종료/);
  assert.match(period3, /증거 영상을 위해 쓰기를 다시 실행하지 않습니다/);
  assert.match(period3, /<time>52–60<\/time>[\s\S]*M8 · 증거 묶기/);

  assert.equal((period3.match(/data-test-id="T\d{2}"/g) ?? []).length, 8);
  assert.equal((period3.match(/data-required="true"/g) ?? []).length, 8);
});

test("week 12 interactions protect student identity and keep feedback next to its control", async () => {
  const [, , period2, period3, , script] = await readWeekTwelve();

  assert.match(period3, /학번과 이름은 저장하지 않습니다/);
  assert.match(script, /writeStorage\(testStorageKey, serializeTestResults\(\)\)/);
  assert.doesNotMatch(script, /saved\.identity/);
  assert.equal((script.match(/if \(!window\.confirm\(/g) ?? []).length, 2);

  const copyButtons = period2.match(/data-copy-code=/g) ?? [];
  const copyStatuses = period2.match(/data-copy-status/g) ?? [];
  assert.ok(copyButtons.length > 1, "period 2 should expose several copy controls");
  assert.equal(copyStatuses.length, copyButtons.length);
  assert.match(
    script,
    /button\.closest\("\.code-panel"\)\?\.querySelector\("\[data-copy-status\]"\)/,
  );
  assert.match(script, /button\.textContent = copied \? "복사됨"/);
});

test("week 12 stays legible and operable across pointer and color preferences", async () => {
  const [, , , , styles] = await readWeekTwelve();

  assert.match(styles, /--w12-micro: 11px;/);
  assert.ok(
    (styles.match(/font-size: var\(--w12-micro\);/g) ?? []).length >= 20,
    "the readable micro token should be applied, not only declared",
  );
  const undersizedFontDeclarations = [
    ...styles.matchAll(/font-size:\s*([\d.]+)px;/g),
    ...styles.matchAll(/font:\s*\d+\s+([\d.]+)px\//g),
  ]
    .map((match) => Number(match[1]))
    .filter((size) => size < 11);
  assert.deepEqual(undersizedFontDeclarations, []);
  assert.match(styles, /--w12-on-accent: #fffaf7;/);
  assert.match(styles, /--w12-on-accent: #17211d;/);
  assert.ok(
    (styles.match(/color: var\(--w12-on-accent\);/g) ?? []).length >= 3,
    "accent buttons should use a theme-aware foreground",
  );

  assert.match(
    styles,
    /:is\(\.code-panel-bar button, \.test-action, \.completion-panel button, \.starter-download a, \.week-twelve-toc a\)[\s\S]*?min-height: 44px;/,
  );

  const hoverMedia = "@media (hover: hover) and (pointer: fine)";
  assert.ok(styles.includes(hoverMedia));
  assert.doesNotMatch(styles.slice(0, styles.indexOf(hoverMedia)), /:hover/);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?:active[\s\S]*?transform: scale\(0\.98\);/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?:active[\s\S]*?opacity: 0\.78;/);
});

test("week 12 uses section labels only for major phase changes", async () => {
  const [, period1, period2, period3] = await readWeekTwelve();

  for (const [period, html] of [period1, period2, period3].entries()) {
    assert.ok(
      (html.match(/class="section-index"/g) ?? []).length <= 6,
      `period ${period + 1} repeats section labels too often`,
    );
    const eyebrow = html.match(/<p class="eyebrow">([^<]+)<\/p>/)?.[1] ?? "";
    assert.match(eyebrow, /^Week 12 \/ Period 0[1-3] \/ /);
    assert.doesNotMatch(eyebrow, /·/);
  }

  for (const label of [
    "00 / ARRIVAL",
    "03 / FOUR CONTROL SURFACES",
    "05 / AUTHORIZATION CONTRACT",
    "08 / PROFESSOR PREFLIGHT",
    "10 / PRIMARY SOURCES",
  ]) {
    assert.ok(period1.includes(label), `period 1 should retain phase label: ${label}`);
  }
});

test("week 12 stylesheet contains no abandoned component classes", async () => {
  const [, period1, period2, period3, styles, script] = await readWeekTwelve();
  const implementation = `${period1}\n${period2}\n${period3}\n${script}`;
  const styleClasses = [
    ...new Set([...styles.matchAll(/\.([a-z][a-z0-9_-]*)/gi)].map((match) => match[1])),
  ].sort();
  const runtimeOnlyClasses = new Set(["game-engine-week-twelve-root"]);
  const unused = styleClasses.filter((className) => {
    if (runtimeOnlyClasses.has(className)) return false;
    const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(
      `class=["'][^"']*\\b${escaped}\\b|["']\\.${escaped}["']|["']${escaped}["']`,
    ).test(implementation);
  });

  assert.deepEqual(unused, []);
});

test("week 12 is self-contained and does not publish local identity paths", async () => {
  const [, period1, , period3] = await readWeekTwelve();
  const generationLog = await readFile(
    resolve(courseDirectory, "research", "week-12-visual-generation-log.md"),
    "utf8",
  );

  assert.doesNotMatch(period1, /href="week-11-period3\.html"/);
  assert.doesNotMatch(period3, /href="week-13-period1\.html"/);
  assert.match(period3, /<input type="text" autocomplete="off" placeholder="이름" data-student-name>/);
  assert.doesNotMatch(generationLog, /\/Users\/|codex-accounts|generated_images/);
});
