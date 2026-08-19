import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";

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

const visibleText = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const contrastRatio = (foreground, background) => {
  const luminance = (hex) => {
    const channels = [1, 3, 5]
      .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const extractHexValues = (stylesheet, variable) =>
  [...stylesheet.matchAll(new RegExp(`${variable}:\\s*(#[0-9a-f]{6})`, "gi"))].map(
    (match) => match[1],
  );

const readWeekFifteen = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-15-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-15.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-15.js"), "utf8"),
  ]);

test("Game Engine I week 15 is published as three connected release-review periods", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekFifteen();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const navigationScript = await readFile(
    resolve(root, "scripts", "refresh-teaching-navigation.mjs"),
    "utf8",
  );
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-15-period1-release-gates.webp",
    "week-15-period2-review-desk.webp",
    "week-15-period3-rc-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-15-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-15-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-15-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 90_000, `period ${period} generated WebP should be present`);
  }

  assert.match(period1, /href="week-14-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-15-period2\.html" rel="next"/);
  assert.match(period2, /href="week-15-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-15-period3\.html" rel="next"/);
  assert.match(period3, /href="week-15-period2\.html" rel="prev"/);
  assert.match(
    period3,
    /class="lesson-sequence"[\s\S]*href="\.\/#week-16" rel="next"/,
  );
  assert.match(
    navigationScript,
    /"week-15-period3\.html"[\s\S]*next:[\s\S]*href: "\.\/#week-16"/,
  );
});

test("week 15 keeps two professor-led periods and one goal-directed individual mission", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekFifteen();

  for (const required of [
    "1교시 · 이론과 설명",
    "2교시 · 이론과 설명",
    "3교시 · 목표지향 개인 실습",
  ]) {
    assert.ok(courseIndex.includes(required), `course index missing: ${required}`);
  }

  assert.match(period1, /학생은 프로젝트를 제작하지 않습니다/);
  assert.match(period1, /교수자 이론과 설명/);
  assert.doesNotMatch(period1, /data-test-table|data-build-checklist/);

  assert.match(period2, /학생은 프로젝트를 제작하지 않습니다/);
  assert.match(period2, /교수자 설명과 공개 릴리스 면담 시연/);
  assert.match(period2, /학생 제작 없음/);
  assert.doesNotMatch(period2, /data-test-table|data-build-checklist|개인 제작과 순차 1:1 면담/);

  assert.match(period3, /목표지향 개인 실습/);
  assert.match(period3, /개인 제작/);
  assert.match(period3, /목표는 고정하고 해결 경로는 선택합니다/);
  assert.match(period3, /작업 속도와 기능 수는 평가하지 않습니다/);
  assert.doesNotMatch(period3, /남은 면담|조별 제작|팀 프로젝트/);

  for (const [index, html] of [period1, period2, period3].entries()) {
    validateStructure(html, `period ${index + 1}`);
    assert.doesNotMatch(visibleText(html), /[—–]/, `period ${index + 1} contains a forbidden dash glyph`);
    assert.doesNotMatch(visibleText(html), /\s,/, `period ${index + 1} contains a space before a comma`);
    assert.ok(
      [...html.matchAll(/class="section-index"/g)].length <= 4,
      `period ${index + 1} overuses section index labels`,
    );
    assert.doesNotMatch(html, /class="hero-facts"/);
    assert.doesNotMatch(html, /data-toc-link/, `period ${index + 1} contains an unused TOC hook`);

    const lead = html.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    assert.ok(lead && lead.split(/\s+/).length <= 22, `period ${index + 1} hero lead is too long`);
  }
});

test("period 1 teaches a release contract through readable gates, comparisons, and failure patterns", async () => {
  const [, period1, , , stylesheet] = await readWeekFifteen();

  for (const sectionId of [
    "arrival",
    "run",
    "sequence",
    "candidate",
    "freeze",
    "gates",
    "priority",
    "build",
    "rights",
    "mistakes",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /PLAYABLE[\s\S]*EXPLAINABLE[\s\S]*SUBMITTABLE/,
    /G01 \/ LAUNCH[\s\S]*G08 \/ PACKAGE/,
    /P0 \/ BLOCKER[\s\S]*P3 \/ BACKLOG/,
    /Development Build[\s\S]*RELEASE BUILD[\s\S]*Player log/,
    /SOURCE[\s\S]*PERMISSION[\s\S]*TRANSFORMATION[\s\S]*FINAL USE/,
    /수정[\s\S]*삭제[\s\S]*보류/,
    /assets\/week-15-period1-release-gates\.webp/,
  ]) {
    assert.match(period1, pattern);
  }

  for (const selector of [
    ".contract-board",
    ".comparison-grid",
    ".failure-grid",
  ]) {
    assert.match(stylesheet, new RegExp(`\\${selector}\\s*\\{`));
  }

  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*\.contract-board[\s\S]*\.comparison-grid[\s\S]*\.failure-grid[\s\S]*grid-template-columns:\s*1fr/,
  );
});

test("period 2 teaches one fair release interview through a fixed professor-led demonstration", async () => {
  const [, , period2] = await readWeekFifteen();

  for (const sectionId of [
    "arrival",
    "run",
    "operation",
    "inputs",
    "protocol",
    "demonstration",
    "verdict",
    "rights",
    "record",
    "fairness",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /같은 RC0[\s\S]*같은 질문[\s\S]*같은 순서/,
    /RUN[\s\S]*OBSERVE[\s\S]*ASK[\s\S]*DECIDE/,
    /표준 8분[\s\S]*LAUNCH[\s\S]*LOOP[\s\S]*STATE[\s\S]*LOG[\s\S]*RIGHTS[\s\S]*PACKAGE/,
    /독립 실행[\s\S]*핵심 경로[\s\S]*Player log[\s\S]*권리 ledger[\s\S]*제출 묶음/,
    /READY[\s\S]*READY IF[\s\S]*HOLD/,
    /CLAIM[\s\S]*EVIDENCE[\s\S]*VERDICT[\s\S]*NEXT ACTION/,
    /AI 미사용 경로/,
    /학생의 말만으로 판정하지 않습니다/,
    /assets\/week-15-period2-review-desk\.webp/,
  ]) {
    assert.match(period2, pattern);
  }

  assert.doesNotMatch(period2, /<form\b|<input\b|<select\b|<textarea\b/);
});

test("period 3 closes one release risk through a bounded mission and eight public tests", async () => {
  const [, , , period3] = await readWeekFifteen();

  assert.equal([...period3.matchAll(/data-test-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/data-check-id=/g)].length, 8);

  for (const sectionId of [
    "mission",
    "starting-line",
    "route",
    "workflow",
    "change-contract",
    "tests",
    "repair",
    "package",
    "oral",
    "finish",
  ]) {
    assert.match(period3, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /FIX \/ 제한 수정[\s\S]*REMOVE \/ 불안정 기능 삭제[\s\S]*DEFER \/ 기록 후 보류/,
    /OBSERVED[\s\S]*EXPECTED[\s\S]*ALLOW[\s\S]*FORBID[\s\S]*RETEST[\s\S]*REGRESSION/,
    /T01[\s\S]*T08/,
    /8 \/ 8 PASS/,
    /RC0_BASELINE[\s\S]*RC1_CANDIDATE[\s\S]*Evidence[\s\S]*RELEASE_RECORD\.md/,
    /CORE[\s\S]*RISK[\s\S]*CHANGE[\s\S]*PROOF/,
    /week-15-release-starter\.zip/,
    /작업 속도와 기능 수는 평가하지 않습니다/,
    /assets\/week-15-period3-rc-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }
});

test("week 15 interaction stores only release evidence and exports spreadsheet-safe CSV", async () => {
  const [, , , period3, , script] = await readWeekFifteen();

  for (const pattern of [
    /game-engine-1-week-15-tests-v1/,
    /game-engine-1-week-15-checkpoint-v1/,
    /localStorage/,
    /spreadsheetSafe/,
    /week15_release-tests\.csv/,
    /setupTestTable/,
    /setupCheckpoint/,
    /IntersectionObserver/,
    /URL\.createObjectURL/,
    /URL\.revokeObjectURL/,
  ]) {
    assert.match(script, pattern);
  }

  assert.doesNotMatch(script, /studentName|studentId|학번|이름|innerHTML/);
  assert.doesNotMatch(script, /addEventListener\(["']scroll["']/);
  assert.match(period3, /role="region" aria-label="15주차 릴리스 테스트 기록표" tabindex="0"/);
  assert.match(period3, /<strong data-test-count role="status" aria-live="polite" aria-atomic="true">/);
  assert.equal([...period3.matchAll(/<th scope="col">/g)].length, 5);
  assert.equal([...period3.matchAll(/<th scope="row">T0[1-8]<\/th>/g)].length, 8);
});

test("week 15 CSV export neutralizes spreadsheet formula prefixes", async () => {
  const script = await readFile(resolve(assetDirectory, "week-15.js"), "utf8");
  const helperSource = script.match(
    /const spreadsheetSafe = \(value\) => \{([\s\S]*?)\n  \};/,
  );
  assert.ok(helperSource, "spreadsheetSafe helper must remain behavior-testable");
  const spreadsheetSafe = Function(
    `return (value) => {${helperSource[1]}};`,
  )();

  for (const dangerous of [
    "=1+1",
    "+1",
    "-1",
    "@SUM(A1)",
    "\t=1",
    "\r=1",
    "\n=1",
    "\0=1",
    "＝1+1",
    "＋1",
    "－1",
    "＠SUM(A1)",
  ]) {
    assert.match(spreadsheetSafe(dangerous), /^'/, `unsafe CSV value: ${dangerous}`);
  }
  assert.equal(spreadsheetSafe("관찰 기록"), "관찰 기록");
});

test("week 15 requires evidence for every PASS before marking release tests complete", async () => {
  const script = await readFile(resolve(assetDirectory, "week-15.js"), "utf8");
  const storage = new Map();

  const control = (value = "") => {
    const listeners = new Map();
    return {
      value,
      addEventListener(type, listener) {
        const callbacks = listeners.get(type) ?? [];
        callbacks.push(listener);
        listeners.set(type, callbacks);
      },
      dispatch(type) {
        for (const listener of listeners.get(type) ?? []) listener({ type });
      },
    };
  };

  const rows = Array.from({ length: 8 }, (_, index) => {
    const result = control();
    const note = control();
    return {
      dataset: { testId: `T0${index + 1}` },
      result,
      note,
      querySelector(selector) {
        return selector === "[data-test-result]" ? result : note;
      },
    };
  });
  const counter = { textContent: "" };
  const progress = { dataset: {} };
  const table = {
    querySelectorAll(selector) {
      return selector === "[data-test-id]" ? rows : [];
    },
  };
  const document = {
    querySelector(selector) {
      return new Map([
        ["[data-test-table]", table],
        ["[data-test-count]", counter],
        ["[data-test-progress]", progress],
      ]).get(selector) ?? null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
  };

  runInNewContext(script, { document, window, console });
  for (const row of rows) row.result.value = "PASS";
  rows.at(-1).result.dispatch("input");
  assert.equal(counter.textContent, "0 / 8 검증 완료");
  assert.equal(progress.dataset.complete, "false");

  for (const row of rows) row.note.value = "Evidence/Week15/proof.txt";
  rows.at(-1).note.dispatch("input");
  assert.equal(counter.textContent, "8 / 8 검증 완료");
  assert.equal(progress.dataset.complete, "true");
});

test("week 15 starter pack records release evidence without shipping solution code or identity fields", async () => {
  const starterFiles = [
    "README.md",
    "RELEASE_RECORD-template.md",
    "asset-ledger-template.csv",
    "release-tests-template.csv",
    "submission-map-template.md",
  ];
  const starterDirectory = resolve(assetDirectory, "week-15-starter");
  const archivePath = resolve(assetDirectory, "week-15-release-starter.zip");

  assert.ok((await stat(archivePath)).size > 2_000);

  const { stdout: archivedEntries } = await execFileAsync("unzip", ["-Z1", archivePath], {
    encoding: "utf8",
  });
  assert.deepEqual(
    archivedEntries.trim().split("\n").sort(),
    [
      "week-15-starter/",
      ...starterFiles.map((file) => `week-15-starter/${file}`),
    ].sort(),
  );

  const contents = [];
  for (const file of starterFiles) {
    const path = resolve(starterDirectory, file);
    assert.ok((await stat(path)).size > 150, `${file} should be substantial`);
    const source = await readFile(path, "utf8");
    contents.push(source);
    const { stdout: archived } = await execFileAsync(
      "unzip",
      ["-p", archivePath, `week-15-starter/${file}`],
      { encoding: "utf8" },
    );
    assert.equal(archived, source, `${file} in the ZIP should match the source`);
  }

  const joined = contents.join("\n");
  assert.match(joined, /RC0_BASELINE[\s\S]*RC1_CANDIDATE/);
  assert.match(joined, /Observed[\s\S]*Expected[\s\S]*Allow[\s\S]*Forbid[\s\S]*Retest[\s\S]*Regression/);
  assert.match(joined, /T01[\s\S]*T08/);
  assert.match(joined, /source[\s\S]*permission[\s\S]*ai_usage[\s\S]*final_use/);
  assert.doesNotMatch(joined, /학번|이름|student[_ -]?(?:id|name)/i);
  assert.doesNotMatch(joined, /class\s+\w+\s*:\s*MonoBehaviour|void\s+Update\s*\(/);
});

test("week 15 controls keep contrast, touch targets, focus, and pointer feedback accessible", async () => {
  const [, , , , stylesheet] = await readWeekFifteen();
  const colorPairs = [
    ["--w15-action-bg", "--w15-action-ink"],
    ["--w15-action-hover", "--w15-action-ink"],
    ["--w15-success-bg", "--w15-success-ink"],
    ["--w15-success-hover", "--w15-success-ink"],
  ];

  for (const [backgroundVariable, foregroundVariable] of colorPairs) {
    const backgrounds = extractHexValues(stylesheet, backgroundVariable);
    const foregrounds = extractHexValues(stylesheet, foregroundVariable);
    assert.equal(backgrounds.length, 2, `${backgroundVariable} needs light and dark values`);
    assert.equal(foregrounds.length, 2, `${foregroundVariable} needs light and dark values`);
    for (const mode of [0, 1]) {
      assert.ok(
        contrastRatio(backgrounds[mode], foregrounds[mode]) >= 4.5,
        `${backgroundVariable} contrast fails in mode ${mode}`,
      );
    }
  }

  const focusRings = extractHexValues(stylesheet, "--w15-focus-ring");
  assert.equal(focusRings.length, 2);
  assert.ok(contrastRatio(focusRings[0], "#fcfcf9") >= 3);
  assert.ok(contrastRatio(focusRings[1], "#1c211e") >= 3);

  const codeLinks = extractHexValues(stylesheet, "--w15-code-link");
  const codeFocusRings = extractHexValues(stylesheet, "--w15-code-focus");
  assert.equal(codeLinks.length, 2, "--w15-code-link needs light and dark values");
  assert.equal(codeFocusRings.length, 2, "--w15-code-focus needs light and dark values");
  for (const mode of [0, 1]) {
    assert.ok(contrastRatio(codeLinks[mode], "#181b24") >= 4.5);
    assert.ok(contrastRatio(codeFocusRings[mode], "#181b24") >= 3);
  }

  assert.match(stylesheet, /outline:\s*3px solid var\(--w15-focus-ring\)/);
  assert.match(stylesheet, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(stylesheet, /\.hero-action:active/);
  assert.match(stylesheet, /\.test-action:active/);
  assert.match(stylesheet, /\.starter-download a:active/);
  assert.match(stylesheet, /\.next-week a:active/);
  assert.match(stylesheet, /\.lesson-sequence a\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(stylesheet, /\.week-fifteen-toc a\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(stylesheet, /\.test-action,[\s\S]*?\.completion-panel button\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(stylesheet, /\.starter-download a\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(stylesheet, /\.next-week a\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(stylesheet, /\.next-week a:focus-visible\s*\{[\s\S]*?--w15-code-focus/);
});

test("week 15 stylesheet contains no stale component families outside the three public pages", async () => {
  const [, period1, period2, period3, stylesheet] = await readWeekFifteen();
  const htmlClasses = new Set(
    [...`${period1}\n${period2}\n${period3}`.matchAll(/class="([^"]+)"/g)]
      .flatMap((match) => match[1].split(/\s+/)),
  );
  const cssClasses = new Set(
    [...stylesheet.matchAll(/\.([a-z][a-z0-9-]*)/gi)].map((match) => match[1]),
  );
  const stale = [...cssClasses].filter((className) => !htmlClasses.has(className)).sort();
  const customProperties = [...stylesheet.matchAll(/--w15-[a-z-]+/g)].map((match) => match[0]);
  const propertyUseCounts = customProperties.reduce(
    (counts, property) => counts.set(property, (counts.get(property) ?? 0) + 1),
    new Map(),
  );
  const singleUseProperties = [...propertyUseCounts]
    .filter(([, count]) => count === 1)
    .map(([property]) => property)
    .sort();

  assert.deepEqual(stale, []);
  assert.deepEqual(singleUseProperties, []);
  for (const unusedSelector of [
    /\.build-steps code/,
    /\.step-check code/,
    /\.trouble-grid summary code/,
    /\.exit-ticket code/,
    /\.slot-table td:first-child/,
    /\.week-fifteen-hero h1 br/,
  ]) {
    assert.doesNotMatch(stylesheet, unusedSelector);
  }
  assert.match(stylesheet, /@media \(max-width: 760px\)/);
  assert.match(stylesheet, /@media \(prefers-color-scheme: dark\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesheet, /@media print/);
});
