import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";

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

const readWeekFourteen = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-14-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-14.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-14.js"), "utf8"),
  ]);

test("Game Engine I week 14 is published as three connected mentoring periods", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekFourteen();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-14-period1-scope-architecture.webp",
    "week-14-period2-mentoring-studio-v2.webp",
    "week-14-period3-checkpoint-route.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-14-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-14-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-14-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 90_000, `period ${period} generated WebP should be present`);
  }

  assert.match(period1, /href="week-13-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-14-period2\.html" rel="next"/);
  assert.match(period2, /href="week-14-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-14-period3\.html" rel="next"/);
  assert.match(period3, /href="week-14-period2\.html" rel="prev"/);
  assert.match(period3, /href="\.\/#week-15"/);
});

test("week 14 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, period1, period2, period3] = await readWeekFourteen();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("week 14 keeps periods 1 and 2 instructor-led and period 3 goal-directed", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekFourteen();

  for (const required of [
    "1교시 · 이론과 설명",
    "2교시 · 이론과 설명",
    "3교시 · 목표지향 개인 실습",
  ]) {
    assert.ok(courseIndex.includes(required), `course index missing: ${required}`);
  }

  assert.match(period1, /학생은 프로젝트를 제작하지 않습니다/);
  assert.match(period1, /교수자 설명과 판정 연습/);
  assert.doesNotMatch(period1, /data-test-table|data-build-checklist/);

  assert.match(period2, /학생은 프로젝트를 제작하지 않습니다/);
  assert.match(period2, /교수자 설명과 공개 면담 시연/);
  assert.match(period2, /학생 제작 없음/);
  assert.doesNotMatch(period2, /data-queue-lab|개인 제작과 순차 1:1 면담|15분 개인 순환/);

  assert.match(period3, /목표지향 개인 실습/);
  assert.match(period3, /개인 제작/);
  assert.doesNotMatch(period3, /남은 1:1 면담|남은 면담|조별 제작|팀 프로젝트/);
  assert.match(period3, /목표는 고정하고 해결 경로는 선택합니다/);
  assert.match(period3, /작업 속도와 기능 수는 평가하지 않습니다/);
});

test("period 1 makes scope, architecture, oral explanation, and accountability explicit", async () => {
  const [, period1] = await readWeekFourteen();

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "scope",
    "mechanic",
    "architecture",
    "explain",
    "scope-board",
    "ai",
    "prepare",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /3-5분 안에 한 판이 끝나는 작은 개인 2D 게임/,
    /플레이어 행동[\s\S]*대상과 조건[\s\S]*상태 변화[\s\S]*목표 진전/,
    /SCENE[\s\S]*PREFAB[\s\S]*SCRIPT OWNER[\s\S]*FEEDBACK/,
    /OWNER[\s\S]*EVENT[\s\S]*CONDITION[\s\S]*STATE[\s\S]*FEEDBACK[\s\S]*PROOF/,
    /MUST FINISH[\s\S]*SHOULD CLARIFY[\s\S]*LATER[\s\S]*DROP/,
    /REQUEST[\s\S]*DECISION[\s\S]*CHANGE[\s\S]*VERIFY/,
    /Alpha v1 build[\s\S]*Unity project[\s\S]*핵심 Script 1-2개[\s\S]*구조도 한 장/,
    /assets\/week-14-period1-scope-architecture\.webp/,
  ]) {
    assert.match(period1, pattern);
  }
});

test("period 2 teaches the interview criteria through one fixed professor-led demonstration", async () => {
  const [, , period2, , , script] = await readWeekFourteen();

  for (const sectionId of [
    "operation",
    "criteria",
    "protocol",
    "evidence",
    "questions",
    "decision",
    "rehearsal",
    "fairness",
    "repair",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /DEMONSTRATION DESK[\s\S]*OBSERVATION DESKS/,
    /RUN[\s\S]*TRACE[\s\S]*EXPLAIN[\s\S]*DECIDE/,
    /표준 8분[\s\S]*RUN[\s\S]*STATE[\s\S]*MAP[\s\S]*EXPLAIN[\s\S]*EVIDENCE[\s\S]*DECIDE/,
    /CLAIM[\s\S]*LOCATION[\s\S]*RUN[\s\S]*RECORD/,
    /P0 \/ CANNOT SHIP[\s\S]*P3 \/ POLISH/,
    /3 min[\s\S]*OBSERVE[\s\S]*4 min[\s\S]*TRACE[\s\S]*4 min[\s\S]*JUDGE[\s\S]*4 min[\s\S]*EXPLAIN/,
    /AI 미사용 경로/,
    /assets\/week-14-period2-mentoring-studio-v2\.webp/,
  ]) {
    assert.match(period2, pattern);
  }

  assert.doesNotMatch(period2, /data-queue-students|data-queue-minutes|data-queue-buffer/);
  assert.doesNotMatch(script, /setupQueueCalculator|data-queue-/);
});

test("period 3 completes one approved issue through three safe routes and eight tests", async () => {
  const [, , , period3, stylesheet, script] = await readWeekFourteen();

  assert.equal([...period3.matchAll(/data-test-id=/g)].length, 8);
  assert.equal([...period3.matchAll(/data-check-id=/g)].length, 8);

  for (const sectionId of [
    "mission",
    "starting-line",
    "triage",
    "workflow",
    "change",
    "tests",
    "repair",
    "oral",
    "finish",
  ]) {
    assert.match(period3, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /APPROVE[\s\S]*BOUND[\s\S]*RETEST[\s\S]*HANDOFF/,
    /FIX \/ 제한 수정[\s\S]*DIAGNOSE \/ 원인 확정[\s\S]*DEFER \/ 범위 밖 보류/,
    /OBSERVED[\s\S]*EXPECTED[\s\S]*ALLOW[\s\S]*FORBID[\s\S]*RETEST[\s\S]*REGRESSION/,
    /T01[\s\S]*T08/,
    /8 \/ 8 PASS/,
    /CORE[\s\S]*STRUCTURE[\s\S]*DECISION[\s\S]*PROOF/,
    /MENTORING_CHECKPOINT\.md/,
    /week-14-mentoring-starter\.zip/,
    /assets\/week-14-period3-checkpoint-route\.webp/,
    /data-route-test-action/,
    /data-route-test-expected/,
    /선택 경로에 맞는 T01-T08/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /game-engine-1-week-14-tests-v1/,
    /game-engine-1-week-14-checkpoint-v1/,
    /game-engine-1-week-14-triage-v1/,
    /spreadsheetSafe/,
    /week14_학번_이름_mentoring-tests\.csv/,
    /localStorage/,
    /routeTestCopy/,
    /updateRouteTestCopy/,
    /diagnose:[\s\S]*defer:/,
  ]) {
    assert.match(script, pattern);
  }

  for (const pattern of [
    /\.triage-lab/,
    /\.interview-timeline/,
    /\.change-contract-grid/,
    /\.checkpoint-summary/,
    /\.test-toolbar/,
    /\.build-checklist/,
    /\.build-meter/,
    /\.privacy-note/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("period 3 changes T05 with the selected route and clears a stale verdict", async () => {
  const script = await readFile(resolve(assetDirectory, "week-14.js"), "utf8");
  const storage = new Map();

  class MockEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = Boolean(options.bubbles);
    }
  }

  const control = (value, optionValues = []) => {
    const listeners = new Map();
    return {
      value,
      options: optionValues.map((optionValue) => ({ value: optionValue })),
      dataset: {},
      placeholder: "",
      checked: false,
      addEventListener(type, listener) {
        const callbacks = listeners.get(type) ?? [];
        callbacks.push(listener);
        listeners.set(type, callbacks);
      },
      dispatchEvent(event) {
        for (const listener of listeners.get(event.type) ?? []) listener(event);
        return true;
      },
    };
  };

  const priority = control("p1", ["p0", "p1", "p2", "p3"]);
  const minutes = control("15");
  const risk = control("low", ["low", "medium", "high"]);
  const route = { textContent: "" };
  const routeMessage = { textContent: "" };
  const routeOutput = { dataset: {} };
  const triageLab = {
    querySelector(selector) {
      return new Map([
        ["[data-triage-priority]", priority],
        ["[data-triage-minutes]", minutes],
        ["[data-triage-risk]", risk],
        ["[data-triage-output]", routeOutput],
        ["[data-triage-route]", route],
        ["[data-triage-message]", routeMessage],
      ]).get(selector);
    },
  };

  const rows = Array.from({ length: 8 }, (_, index) => {
    const result = control("");
    const note = control("");
    const action = { textContent: "", replaceChildren(value) { this.textContent = value; } };
    const expected = { textContent: "", replaceChildren(value) { this.textContent = value; } };
    return {
      dataset: { testId: `T0${index + 1}` },
      result,
      note,
      action,
      expected,
      querySelector(selector) {
        return new Map([
          ["[data-test-result]", result],
          ["[data-test-note]", note],
          ["[data-route-test-action]", index === 4 ? action : null],
          ["[data-route-test-expected]", index === 4 ? expected : null],
        ]).get(selector) ?? null;
      },
      querySelectorAll(selector) {
        if (selector === "select, input") return [result, note];
        if (selector === "th, td") return [{}, { textContent: action.textContent }, { textContent: expected.textContent }];
        return [];
      },
    };
  });
  const testTable = {
    dataset: {},
    querySelector(selector) {
      return selector === '[data-test-id="T05"]' ? rows[4] : null;
    },
    querySelectorAll(selector) {
      return selector === "[data-test-id]" ? rows : [];
    },
  };
  const testCount = { textContent: "", dataset: {} };
  const routeLabel = { textContent: "" };
  const document = {
    querySelector(selector) {
      return new Map([
        ["[data-triage-lab]", triageLab],
        ["[data-test-table]", testTable],
        ["[data-test-count]", testCount],
        ["[data-test-route-label]", routeLabel],
      ]).get(selector) ?? null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return null;
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

  runInNewContext(script, { document, window, Event: MockEvent, console });
  assert.equal(route.textContent, "FIX / 제한 수정");
  assert.equal(rows[4].action.textContent, "수정 전과 같은 정상 조건 재검사");

  rows[4].result.value = "PASS";
  rows[4].note.value = "old FIX evidence";
  rows[4].result.dispatchEvent(new MockEvent("input"));
  risk.value = "high";
  risk.dispatchEvent(new MockEvent("input"));

  assert.equal(route.textContent, "DIAGNOSE / 원인 확정");
  assert.equal(routeLabel.textContent, "DIAGNOSE 경로");
  assert.equal(rows[4].action.textContent, "재현 조건에서 최초로 다른 상태 확인");
  assert.equal(rows[4].expected.textContent, "원인 가설, 확인 결과와 다음 진단 행동이 기록됨");
  assert.equal(rows[4].result.value, "");
  assert.equal(rows[4].note.value, "");

  priority.value = "p3";
  minutes.value = "10";
  risk.value = "low";
  priority.dispatchEvent(new MockEvent("input"));
  assert.equal(route.textContent, "DEFER / 범위 밖 보류");
  assert.equal(rows[4].action.textContent, "보류 항목과 핵심 범위를 다시 비교");
  assert.equal(rows[4].expected.textContent, "baseline을 바꾸지 않고 보류 위치와 근거가 기록됨");
});

test("week 14 starter pack records decisions without shipping solution code", async () => {
  const starterFiles = [
    "README.md",
    "MENTORING_CHECKPOINT-template.md",
    "architecture-map-template.md",
    "week14-interview-template.csv",
  ];

  assert.ok((await stat(resolve(assetDirectory, "week-14-mentoring-starter.zip"))).size > 2_000);

  for (const file of starterFiles) {
    const fileStats = await stat(resolve(assetDirectory, "week-14-starter", file));
    assert.ok(fileStats.size > 200, `${file} should be substantial`);
  }

  const checkpoint = await readFile(resolve(assetDirectory, "week-14-starter", "MENTORING_CHECKPOINT-template.md"), "utf8");
  const map = await readFile(resolve(assetDirectory, "week-14-starter", "architecture-map-template.md"), "utf8");
  assert.match(checkpoint, /Approved issue[\s\S]*Selected route: FIX \/ DIAGNOSE \/ DEFER/);
  assert.match(checkpoint, /Week 15 handoff/);
  assert.match(map, /Player input or trigger[\s\S]*GameObject and Component[\s\S]*Acceptance test/);
  assert.doesNotMatch(checkpoint + map, /class\s+\w+\s*:\s*MonoBehaviour|void\s+Update\s*\(/);
});

test("week 14 visual system stays responsive, printable, reduced-motion aware, and one-accent", async () => {
  const [, period1, period2, period3, stylesheet, script] = await readWeekFourteen();

  assert.match(stylesheet, /one restrained burnt-orange accent/);
  assert.match(stylesheet, /--w14-violet:\s*#a55c43/);
  assert.match(stylesheet, /--w14-cyan:\s*#a55c43/);
  assert.match(stylesheet, /--w14-lime:\s*#a55c43/);
  assert.match(stylesheet, /@media \(max-width: 720px\)/);
  assert.match(stylesheet, /@media \(prefers-color-scheme: dark\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesheet, /@media print/);
  assert.match(stylesheet, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(stylesheet, /\.hero-action:active/);
  assert.match(stylesheet, /\.starter-download a:active/);
  assert.match(
    stylesheet,
    /@media \(prefers-color-scheme: dark\)[\s\S]*\.hero-action-primary[\s\S]*\.starter-download a[\s\S]*color:\s*var\(--w14-code\)/,
  );
  assert.match(stylesheet, /min-height:\s*44px/);
  assert.doesNotMatch(stylesheet, /#000000|#ffffff/i);
  assert.doesNotMatch(script, /addEventListener\(["']scroll["']/);
  assert.match(script, /IntersectionObserver/);
  assert.match(period1, /<h1>면담 전에 프로젝트<br>경계를 잠급니다<\/h1>/);
  assert.match(period2, /<h1>구조와 판단을<br>함께 진단합니다<\/h1>/);

  const documentClasses = new Set(
    [...`${period1}\n${period2}\n${period3}`.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)),
  );
  const unusedStylesheetClasses = [
    ...new Set([...stylesheet.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((match) => match[1])),
  ].filter((className) => !documentClasses.has(className));
  assert.deepEqual(unusedStylesheetClasses, [], "week 14 stylesheet should not retain copied, unused component classes");
});

test("week 14 pages use safe source links and visible copy contains no forbidden dash glyphs", async () => {
  const [, period1, period2, period3] = await readWeekFourteen();

  for (const [index, html] of [period1, period2, period3].entries()) {
    const visible = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(visible, /[—–]/, `period ${index + 1} contains a forbidden dash glyph`);

    for (const anchor of html.matchAll(/<a\b([^>]*)>/g)) {
      const attributes = anchor[1];
      if (/target="_blank"/.test(attributes)) {
        assert.match(attributes, /rel="noreferrer"/);
      }
    }
  }
});

test("week 14 generated visuals have a reproducible built-in generation log", async () => {
  const log = await readFile(resolve(courseDirectory, "research", "week-14-visual-generation-log.md"), "utf8");
  assert.match(log, /Mode: OpenAI built-in image generation/);
  assert.match(log, /week-14-period1-scope-architecture\.webp/);
  assert.match(log, /week-14-period2-mentoring-studio-v2\.webp/);
  assert.match(log, /week-14-period3-checkpoint-route\.webp/);
  assert.match(log, /Use case: style-transfer/);
  assert.match(log, /no students producing work in the background/);
  assert.match(log, /Exactly two people appear at the central review table/);
  assert.match(log, /single orange issue token travels through one narrow gate/);
});
