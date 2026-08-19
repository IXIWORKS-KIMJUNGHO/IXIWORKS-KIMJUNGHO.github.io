import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const validateStructure = (html, label) => {
  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const stack = [];

  for (const match of source.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const raw = match[0];
    const name = match[1].toLowerCase();

    if (raw.startsWith("</")) {
      assert.equal(stack.at(-1), name, `${label}: ${raw} closes <${stack.at(-1)}> instead`);
      stack.pop();
    } else if (!voidElements.has(name) && !raw.endsWith("/>")) {
      if (name === "li") {
        assert.ok(["ol", "ul", "menu"].includes(stack.at(-1)), `${label}: <li> must be a direct child of a list`);
      }
      stack.push(name);
    }
  }

  assert.deepEqual(stack, [], `${label}: unclosed elements remain`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${label}: IDs must be unique`);

  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(match[1]), `${label}: missing target for #${match[1]}`);
  }
};

const readWeekTen = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-09-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-10-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-10-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-10-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-10.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-10.js"), "utf8"),
  ]);

test("Game Engine I week 10 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3] = await readWeekTen();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-10-period1-asset-readiness.webp",
    "week-10-period2-integration-pipeline.webp",
    "week-10-period3-asset-kit-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-10-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-10-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-10-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 100_000, `period ${period} generated WebP should be present`);
  }

  assert.match(previousLesson, /href="week-10-period1\.html" rel="next"/);
  assert.match(period1, /href="week-09-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-10-period2\.html" rel="next"/);
  assert.match(period2, /href="week-10-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-10-period3\.html" rel="next"/);
  assert.match(period3, /href="week-10-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /href="week-11-period1\.html" rel="next"/);
});

test("week 10 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, , period1, period2, period3] = await readWeekTen();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("periods 1 and 2 are professor-led while period 3 is a goal-directed individual lab", async () => {
  const [, , period1, period2, period3] = await readWeekTen();

  for (const period of [period1, period2]) {
    assert.ok(period.includes("교수자"));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /짝 활동|짝과|조별 활동/);
  }

  for (const requiredText of [
    "학생 개인 목표지향 실습",
    "목표는 고정하고 구현 경로는 선택합니다",
    "클릭 순서 대신 중간 도착점을 확인합니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
    "작업 속도와 생성 횟수는 평가하지 않습니다",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
});

test("period 1 defines asset readiness, PPU, frame consistency, and human correction", async () => {
  const [, , period1, , , , script] = await readWeekTen();

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "contract",
    "pixels",
    "frames",
    "gates",
    "correction",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /Sprite 한 변의 픽셀[\s\S]*Pixels Per Unit[\s\S]*Unity 월드 크기/,
    /128 PX \/ 128 PPU[\s\S]*1 unit/,
    /data-ppu-lab/,
    /같은 셀[\s\S]*같은 발 위치[\s\S]*같은 원점[\s\S]*같은 몸집[\s\S]*같은 세계/,
    /G01 \/ READ[\s\S]*G05 \/ TRACE/,
    /생성 횟수.*평가하지 않습니다/,
    /assets\/week-10-period1-asset-readiness\.webp/,
  ]) {
    assert.match(period1, pattern);
  }

  assert.match(script, /data-sprite-pixels/);
  assert.match(script, /const units = pixels \/ ppu/);
});

test("period 2 demonstrates a complete post-process to Unity integration pipeline", async () => {
  const [, , , period2] = await readWeekTen();

  for (const sectionId of [
    "pipeline",
    "tools",
    "sheet",
    "import",
    "animator",
    "ui",
    "handoff",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /Remove Background[\s\S]*Inpaint[\s\S]*Recolor[\s\S]*Pixelate[\s\S]*Upscale/,
    /Player_Walk_4x1\.png[\s\S]*512×128px[\s\S]*128×128px/,
    /Sprite \(2D and UI\)/,
    /Sprite Mode[\s\S]*Multiple/,
    /Pixels Per Unit[\s\S]*128/,
    /Grid By Cell Size/,
    /4 frames, 8 Samples/,
    /IMAGE \/ SPRITE[\s\S]*RAWIMAGE \/ TEXTURE/,
    /REPLACE, DO NOT REBUILD/,
    /AI_ASSET_LOG\.md/,
    /assets\/week-10-period2-integration-pipeline\.webp/,
  ]) {
    assert.match(period2, pattern);
  }
});

test("period 3 has a measurable eight-piece asset kit, eight tests, and durable evidence", async () => {
  const [, , , , period3, stylesheet, script] = await readWeekTen();

  assert.equal([...period3.matchAll(/data-test-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/data-required="true"/g)].length, 8);
  assert.equal([...period3.matchAll(/data-check-id=/g)].length, 8);

  for (const pattern of [
    /role="region" aria-label="10주차 Sprite와 UI 에셋 통합 테스트표" tabindex="0"/,
    /Player_Walk_4x1\.png[\s\S]*512×128px/,
    /Interactables_3x1\.png[\s\S]*384×128px/,
    /UI_Panel_512x256\.png[\s\S]*512×256px/,
    /Collectible[\s\S]*Hazard[\s\S]*Goal/,
    /사람의 수정 두 가지 이상/,
    /AI-ASSISTED[\s\S]*MANUAL OR OFFLINE/,
    /Error 0.*Missing Reference 0/,
    /45-60초/,
    /week10_학번_이름_test\.csv/,
    /week-10-asset-kit-starter\.zip/,
    /assets\/week-10-period3-asset-kit-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /game-engine-1-week-10-build-v1/,
    /game-engine-1-week-10-tests-v1/,
    /week10_학번_이름_test\.csv/,
    /localStorage/,
  ]) {
    assert.match(script, pattern);
  }

  for (const pattern of [/\.ppu-lab/, /\.sprite-strip/, /\.asset-pack-grid/, /\.starter-download/]) {
    assert.match(stylesheet, pattern);
  }

  assert.ok((await stat(resolve(assetDirectory, "week-10-asset-kit-starter.zip"))).size > 2_000);
  for (const file of ["README.md", "AI_ASSET_LOG-template.md", "asset-spec-template.csv"]) {
    assert.ok((await stat(resolve(assetDirectory, "week-10-starter", file))).size > 300);
  }
});

test("week 10 generated visuals have a reproducible built-in generation log", async () => {
  const log = await readFile(resolve(courseDirectory, "research", "week-10-visual-generation-log.md"), "utf8");
  assert.match(log, /Mode: OpenAI built-in image generation/);
  assert.match(log, /week-10-period1-asset-readiness\.webp/);
  assert.match(log, /week-10-period2-integration-pipeline\.webp/);
  assert.match(log, /week-10-period3-asset-kit-mission\.webp/);
  assert.match(log, /exactly four character frames/i);
  assert.match(log, /eight total/);
});

test("week 10 passes the editorial design and interaction preflight", async () => {
  const [, , period1, period2, period3, stylesheet, script] = await readWeekTen();
  const starterReadme = await readFile(resolve(assetDirectory, "week-10-starter", "README.md"), "utf8");
  const pages = [period1, period2, period3];

  for (const [index, page] of pages.entries()) {
    assert.doesNotMatch(page, /class="section-index"/, `period ${index + 1}: repeated section labels should be removed`);
    assert.doesNotMatch(page, /class="hero-facts"/, `period ${index + 1}: hero should stay within four content groups`);
    assert.match(page, /data-toc-toggle/);
    assert.match(page, /aria-controls="week-ten-toc-list"/);

    const lead = page.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";
    assert.ok(lead.split(/\s+/).filter(Boolean).length <= 20, `period ${index + 1}: hero lead should be concise`);
  }

  const fontSizes = [
    ...[...stylesheet.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1])),
    ...[...stylesheet.matchAll(/font:\s*[^;\n]*?(\d+(?:\.\d+)?)px\//g)].map((match) => Number(match[1])),
  ];
  assert.ok(fontSizes.every((size) => size >= 11), `smallest week 10 font is ${Math.min(...fontSizes)}px`);
  assert.doesNotMatch(stylesheet, /#(?:fff|ffffff)(?=\s*;)/i);
  assert.match(stylesheet, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.ok(stylesheet.indexOf("@media (hover: hover) and (pointer: fine)") < stylesheet.indexOf(":hover"));
  assert.match(stylesheet, /:active/);
  assert.doesNotMatch(stylesheet, /transition-duration:\s*0\.01ms/);
  assert.match(stylesheet, /--w10-on-accent:\s*#161a1a/);
  assert.match(stylesheet, /\.lesson-breadcrumb,[\s\S]*?\.lesson-sequence a\s*\{\s*font-size:\s*11px/);
  assert.doesNotMatch(
    stylesheet,
    /clock-compare|collision-note|code-anatomy|line-reasons|wire-steps|state-(?:loop|lab|controls|readout)/,
  );

  for (const source of [...pages, script, starterReadme]) {
    assert.doesNotMatch(source, /[·–—]/);
  }
});

test("week 10 storage and reset controls complete the interaction cycle", async () => {
  const [, , , , period3, , script] = await readWeekTen();

  assert.match(period3, /data-build-status-message role="status" aria-live="polite"/);
  assert.match(period3, /data-toc-current/);
  assert.match(script, /const writeStorage = \(key, value\) =>/);
  assert.match(script, /return false/);
  assert.match(script, /announceStorageFailure/);
  assert.match(script, /announceStorageRecovery/);
  assert.match(script, /attachConfirmingReset/);
  assert.match(script, /document\.addEventListener\("keydown"/);
  assert.match(script, /entry\.target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(script, /aria-expanded/);
});
