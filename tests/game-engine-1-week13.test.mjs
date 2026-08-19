import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");
const execFileAsync = promisify(execFile);

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

const readWeekThirteen = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-13-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-13-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-13-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-13.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-13.js"), "utf8"),
  ]);

test("Game Engine I week 13 is published as three connected periods", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekThirteen();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-13-period1-feedback-orchestra.webp",
    "week-13-period2-playtest-evidence.webp",
    "week-13-period3-alpha-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-13-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-13-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-13-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 100_000, `period ${period} generated WebP should be present`);
  }

  assert.match(period1, /href="week-13-period2\.html" rel="next"/);
  assert.match(period1, /href="week-12-period3\.html" rel="prev"/);
  assert.match(period2, /href="week-13-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-13-period3\.html" rel="next"/);
  assert.match(period3, /href="week-13-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /rel="next"/);
  assert.match(period3, /href="index\.html#week-14">14주차 개요 보기/);
  assert.doesNotMatch(period3, /href="week-14-period1\.html"/);
});

test("period 3 keeps identity ephemeral and reports storage failures", async () => {
  const [, , , period3, , script] = await readWeekThirteen();

  assert.match(period3, /data-storage-notice/);
  assert.match(period3, /이름과 학번은 저장하지 않습니다/);
  assert.match(script, /Object\.hasOwn\(savedTests, "identity"\)/);
  assert.match(script, /return \{ tests \};/);
  assert.doesNotMatch(script, /savedTests\.identity/);
  assert.match(script, /const writeStorage[\s\S]*return true;[\s\S]*return false;/);
  assert.match(script, /const removeStorage[\s\S]*return true;[\s\S]*return false;/);
  assert.match(script, /브라우저 저장소에 기록하지 못했습니다/);
});

test("period 3 completion requires observations, decisions, PASS, and notes", async () => {
  const [, , , period3, , script] = await readWeekThirteen();

  assert.match(period3, /data-evidence-progress-label/);
  assert.match(period3, /0 \/ 8 PASS · 0 \/ 8 기록/);
  assert.match(script, /status === "pass" && note\.length > 0/);
  assert.match(script, /completedObservations === observationRows\.length/);
  assert.match(script, /completedIssueFields === issueControls\.length/);
  assert.match(script, /testsComplete && observationsComplete && issueComplete/);
});

test("period 3 destructive resets require a second click and announce the result", async () => {
  const [, , , period3, , script] = await readWeekThirteen();

  assert.match(period3, /data-build-status[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(script, /createResetConfirmation/);
  assert.match(script, /5_000/);
  assert.match(script, /한 번 더 누르면/);
  assert.match(script, /초기화를 취소했습니다/);
});

test("week 13 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, period1, period2, period3] = await readWeekThirteen();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("week 13 uses a quiet learning hierarchy without decorative metadata", async () => {
  const [, period1, period2, period3] = await readWeekThirteen();

  for (const [index, period] of [period1, period2, period3].entries()) {
    assert.doesNotMatch(period, /class="(?:hero-facts|section-index)"/);
    assert.doesNotMatch(period, /[–—]/);
    assert.match(period, new RegExp(`Game Engine I / 13주차 / ${index + 1}교시`));

    const lead = period.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";
    assert.ok(lead.length > 0, `period ${index + 1}: hero lead should exist`);
    assert.ok(
      lead.trim().split(/\s+/).length <= 20,
      `period ${index + 1}: hero lead should stay within 20 words`,
    );
  }
});

test("week 13 action colors, focus rings, labels, and controls meet interaction contrast", async () => {
  const [, , , , stylesheet] = await readWeekThirteen();
  const hexToken = (name) =>
    stylesheet.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  const luminance = (hex) => {
    const channels = hex
      .slice(1)
      .match(/../g)
      .map((channel) => Number.parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (first, second) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  const actionColorPairs = [
    ["w13-action-bg", "w13-action-ink"],
    ["w13-action-hover-bg", "w13-action-ink"],
    ["w13-success-action-bg", "w13-success-action-ink"],
    ["w13-success-action-hover-bg", "w13-success-action-ink"],
  ];

  for (const [background, foreground] of actionColorPairs) {
    assert.ok(hexToken(background), `${background} should be a solid color token`);
    assert.ok(hexToken(foreground), `${foreground} should be a solid color token`);
    assert.ok(
      contrast(hexToken(background), hexToken(foreground)) >= 4.5,
      `${background} and ${foreground} should reach 4.5:1`,
    );
  }

  const darkTheme = stylesheet.match(
    /@media \(prefers-color-scheme: dark\) \{[\s\S]*?body\.course-game-engine-1\.game-engine-week-thirteen \{([\s\S]*?)\n  \}/,
  )?.[1];
  assert.ok(darkTheme, "dark theme token block should exist");
  const darkToken = (name) =>
    darkTheme.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  for (const [background, foreground] of actionColorPairs) {
    assert.ok(darkToken(background), `${background} should declare a dark-mode value`);
    assert.ok(
      contrast(darkToken(background), hexToken(foreground)) >= 4.5,
      `${background} should keep dark-mode action text readable`,
    );
    assert.ok(
      contrast(darkToken(background), "#1c211e") >= 3,
      `${background} should remain distinguishable from the dark paper`,
    );
  }

  assert.match(stylesheet, /outline: 3px solid var\(--w13-focus-ring\)/);
  assert.equal([...stylesheet.matchAll(/--w13-focus-ring:/g)].length, 2);
  assert.match(stylesheet, /border: 1px solid var\(--w13-control-border\)/);
  assert.match(stylesheet, /input::placeholder[\s\S]*color: var\(--muted\);[\s\S]*opacity: 1;/);
  assert.match(stylesheet, /\.test-identity input,[\s\S]*min-height: 44px;/);
  assert.match(stylesheet, /\.test-action,[\s\S]*min-height: 44px;/);
  assert.match(stylesheet, /\.starter-download a \{[\s\S]*min-height: 44px;/);
  assert.match(stylesheet, /\.lesson-sequence a \{[^}]*min-height: 44px;/);
  assert.match(stylesheet, /\.next-week a \{[^}]*min-height: 44px;[^}]*color: var\(--w13-code-link\);/);
  assert.ok(contrast(hexToken("w13-code-link"), hexToken("w13-code")) >= 4.5);
  assert.ok(contrast(hexToken("w13-code-focus"), hexToken("w13-code")) >= 3);
  assert.match(stylesheet, /\.next-week a:focus-visible \{[^}]*outline-color: var\(--w13-code-focus\);/);
});

test("week 13 hover is capability-gated and actionable controls have press feedback", async () => {
  const [, , , , stylesheet] = await readWeekThirteen();
  const marker = "@media (hover: hover) and (pointer: fine)";
  const mediaStart = stylesheet.indexOf(marker);
  assert.ok(mediaStart >= 0, "hover capability media query should exist");
  const openingBrace = stylesheet.indexOf("{", mediaStart);
  let depth = 0;
  let mediaEnd = -1;
  for (let index = openingBrace; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === "{") depth += 1;
    if (stylesheet[index] === "}") depth -= 1;
    if (depth === 0) {
      mediaEnd = index;
      break;
    }
  }
  assert.ok(mediaEnd > openingBrace, "hover capability media query should be balanced");
  for (const match of stylesheet.matchAll(/:hover/g)) {
    assert.ok(
      match.index > openingBrace && match.index < mediaEnd,
      `hover rule at ${match.index} must be capability-gated`,
    );
  }
  assert.match(stylesheet, /:is\(\.hero-action, \.test-action, \.completion-panel button, \.starter-download a, \.lesson-sequence a, \.next-week a\):active/);
  assert.match(stylesheet, /transform: scale\(0\.97\)/);
});

test("week 13 interactive tables become labeled vertical records on small screens", async () => {
  const [, , , period3, stylesheet] = await readWeekThirteen();

  assert.equal([...period3.matchAll(/<td data-label=/g)].length, 47);
  assert.match(stylesheet, /@media \(max-width: 760px\)[\s\S]*\.test-table \{[\s\S]*min-width: 0;/);
  assert.match(stylesheet, /\.test-table td::before[\s\S]*content: attr\(data-label\)/);
  assert.match(stylesheet, /\.test-table tbody tr \{[\s\S]*display: grid;/);
});

test("week 13 stylesheet has no selectors for components absent from all three periods", async () => {
  const [, period1, period2, period3, stylesheet] = await readWeekThirteen();
  const htmlClasses = new Set(
    [...`${period1}\n${period2}\n${period3}`.matchAll(/class="([^"]+)"/g)].flatMap(
      (match) => match[1].split(/\s+/),
    ),
  );
  const dynamicClasses = new Set(["game-engine-week-thirteen-root"]);
  const stylesheetClasses = new Set(
    [...stylesheet.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((match) => match[1]),
  );
  const unused = [...stylesheetClasses]
    .filter((className) => !htmlClasses.has(className) && !dynamicClasses.has(className))
    .sort();

  assert.deepEqual(unused, []);
});

test("periods 1 and 2 are professor-led while period 3 is a goal-directed individual lab", async () => {
  const [, period1, period2, period3] = await readWeekThirteen();

  for (const period of [period1, period2]) {
    assert.ok(period.includes("교수자"));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /조별 활동|공동 제작/);
  }

  for (const requiredText of [
    "학생 개인 목표지향 실습",
    "목표는 고정하고 구현 경로는 선택합니다",
    "클릭 순서 대신 중간 도착점을 확인합니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
    "작업 속도와 생성 횟수는 평가하지 않습니다",
    "테스터는 같은 절차로 다른 학생의 build를 실행하지만 공동 제작",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }
  assert.doesNotMatch(period3, /교수자를 따라|짝과 공동|조별 프로젝트/);
});

test("period 1 explains a complete sound and UI feedback contract", async () => {
  const [, period1] = await readWeekThirteen();

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "contract",
    "sound",
    "generator",
    "ui",
    "redundancy",
    "mistakes",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /EVENT → CUE → MEANING/,
    /AudioClip[\s\S]*AudioSource[\s\S]*Audio Mixer[\s\S]*AudioListener/,
    /PlayOneShot\(clip, volumeScale\)/,
    /Sound Generator[\s\S]*효과음·환경음[\s\S]*음악 생성 도구로 가정하지 않습니다/,
    /목표[\s\S]*현재 상태[\s\S]*다음 행동[\s\S]*결과[\s\S]*회복/,
    /음소거[\s\S]*회색조/,
    /AI 효과음, 사용 허가된 기존 효과음, 수업용 placeholder/,
    /assets\/week-13-period1-feedback-orchestra\.webp/,
  ]) {
    assert.match(period1, pattern);
  }
});

test("period 2 teaches controlled three-person observation, prioritization, and regression", async () => {
  const [, , period2] = await readWeekThirteen();

  for (const sectionId of [
    "questions",
    "protocol",
    "evidence",
    "priority",
    "demo",
    "ai",
    "performance",
    "handoff",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /FIXED BUILD[\s\S]*FIXED TASK[\s\S]*FIXED TIME/,
    /같은 빌드·같은 과제·같은 질문/,
    /이름은 적지 않고 A·B·C/,
    /최소 30초/,
    /관찰[\s\S]*해석[\s\S]*해결 후보[\s\S]*검증/,
    /P0 \/ BLOCKER[\s\S]*P3 \/ POLISH/,
    /Alpha v0[\s\S]*A·B·C[\s\S]*문제 하나[\s\S]*Alpha v1/,
    /없는 테스터·시간·발화·PASS를 생성하지 않음/,
    /Development Build[\s\S]*Release Build/,
    /assets\/week-13-period2-playtest-evidence\.webp/,
  ]) {
    assert.match(period2, pattern);
  }
});

test("period 3 records three real tests, one bounded fix, eight tests, and durable evidence", async () => {
  const [, , , period3, stylesheet, script] = await readWeekThirteen();

  assert.equal([...period3.matchAll(/data-observation-id=/g)].length, 3);
  assert.equal([...period3.matchAll(/data-test-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/data-required="true"/g)].length, 8);
  assert.equal([...period3.matchAll(/data-check-id=/g)].length, 8);

  for (const pattern of [
    /role="region" aria-label="13주차 세 명의 플레이테스트 관찰 기록표" tabindex="0"/,
    /Tester A blind run[\s\S]*Tester B blind run[\s\S]*Tester C blind run/,
    /여섯 번의 2분 30초 순환/,
    /같은 Alpha v0, 소개 문장, 2분 과제와 사후 질문/,
    /One evidence-based fix/,
    /Alpha v1 retest &amp; regression/,
    /week13_학번_이름_playtest\.csv/,
    /ALPHA_EVIDENCE\.md/,
    /week-13-playtest-starter\.zip/,
    /assets\/week-13-period3-alpha-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /game-engine-1-week-13-build-v1/,
    /game-engine-1-week-13-tests-v1/,
    /game-engine-1-week-13-observations-v1/,
    /game-engine-1-week-13-issue-v1/,
    /week13_학번_이름_playtest\.csv/,
    /localStorage/,
    /spreadsheetSafe/,
  ]) {
    assert.match(script, pattern);
  }

  for (const pattern of [/\.observation-table/, /\.issue-record/, /\.asset-pack-grid/, /\.starter-download/]) {
    assert.match(stylesheet, pattern);
  }

  const archivePath = resolve(assetDirectory, "week-13-playtest-starter.zip");
  assert.ok((await stat(archivePath)).size > 2_000);
  for (const file of ["README.md", "playtest-template.csv", "ALPHA_EVIDENCE-template.md"]) {
    const path = resolve(assetDirectory, "week-13-starter", file);
    assert.ok((await stat(path)).size > 300);
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /[–—]/, `${file} should use plain hyphens`);
    const { stdout: archived } = await execFileAsync(
      "unzip",
      ["-p", archivePath, `week-13-starter/${file}`],
      { encoding: "utf8" },
    );
    assert.equal(archived, source, `${file} in the ZIP should match the source`);
  }

  const evidenceTemplate = await readFile(
    resolve(assetDirectory, "week-13-starter", "ALPHA_EVIDENCE-template.md"),
    "utf8",
  );
  assert.doesNotMatch(evidenceTemplate, /^- (?:학번|이름):/m);
});

test("week 13 generated visuals have a reproducible built-in generation log", async () => {
  const log = await readFile(resolve(courseDirectory, "research", "week-13-visual-generation-log.md"), "utf8");
  assert.match(log, /Mode: OpenAI built-in image generation/);
  assert.match(log, /week-13-period1-feedback-orchestra\.webp/);
  assert.match(log, /week-13-period2-playtest-evidence\.webp/);
  assert.match(log, /week-13-period3-alpha-mission\.webp/);
  assert.match(log, /exactly three tester tokens/);
  assert.match(log, /exactly eight illuminated green checkpoint lights/);
  assert.match(log, /nine green checkpoint lights[\s\S]*single-change built-in edit/);
});
