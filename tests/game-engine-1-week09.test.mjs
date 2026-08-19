import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const contrastRatio = (foreground, background) => {
  const relativeLuminance = (hex) => {
    const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
    const [red, green, blue] = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const readHexToken = (source, token) => {
  const match = source.match(new RegExp(`${token}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing ${token}`);
  return match[1];
};

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
        assert.ok(
          ["ol", "ul", "menu"].includes(stack.at(-1)),
          `${label}: <li> must be a direct child of a list`,
        );
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

const readWeekNine = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-09-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-09-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-09-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-09.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-09.js"), "utf8"),
    readFile(resolve(courseDirectory, "research", "week-09-visual-generation-log.md"), "utf8"),
  ]);

test("Game Engine I week 9 is published as three connected periods", async () => {
  const [courseIndex, period1, period2, period3] = await readWeekNine();
  const previousLesson = await readFile(resolve(courseDirectory, "week-07-period3.html"), "utf8");
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-09-period1-ai-direction.webp",
    "week-09-period2-style-system.webp",
    "week-09-period3-selection-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-09-period${period}\\.html"`));
    assert.match(
      siteConfig,
      new RegExp(`teaching/game-engine-1/week-09-period${period}\\.html`),
    );
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-09-period${period}\\.html`));

    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 100_000, `period ${period} generated image should be present`);
  }

  assert.match(previousLesson, /href="week-09-period1\.html" rel="next"/);
  assert.match(period1, /href="week-07-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-09-period2\.html" rel="next"/);
  assert.match(period2, /href="week-09-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-09-period3\.html" rel="next"/);
  assert.match(period3, /href="week-09-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /week-10-period1\.html/);
});

test("week 9 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, period1, period2, period3] = await readWeekNine();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("periods 1 and 2 are professor-led while period 3 is goal-directed individual work", async () => {
  const [, period1, period2, period3] = await readWeekNine();

  for (const period of [period1, period2]) {
    assert.ok(period.includes("교수자"));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /짝 활동|조별 활동|실습\(2시간\)/);
  }

  for (const requiredText of [
    "학생 개인 목표지향 실습",
    "목표는 고정하고 제작 경로는 선택합니다",
    "클릭 순서 대신 중간 도착점을 확인합니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }

  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
});

test("period 1 explains autonomy, art direction, rights, privacy, and provenance", async () => {
  const [, period1] = await readWeekNine();

  for (const sectionId of [
    "arrival",
    "run",
    "boundary",
    "autonomy",
    "direction",
    "responsibility",
    "provenance",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const requiredText of [
    "제작 단계 AI",
    "runtime AI",
    "Ask, Plan, Agent, Generator",
    "프로젝트 변경",
    "시각 규칙",
    "권리·개인정보·출처 기록",
    "법률 자문이 아니라 수업에서 지켜야 할 최소 안전선",
    "생존 작가의 이름",
    "Content Credentials",
  ]) {
    assert.ok(period1.includes(requiredText), `period 1 missing: ${requiredText}`);
  }

  assert.match(period1, /assets\/week-09-period1-ai-direction\.webp/);
  assert.match(period1, /00-07[\s\S]*52-60/);
});

test("period 2 demonstrates a reproducible concept-to-selection workflow", async () => {
  const [, , period2] = await readWeekNine();

  for (const sectionId of [
    "sentence",
    "system",
    "prompt",
    "reference",
    "iteration",
    "readability",
    "selection",
    "handoff",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /플레이어 역할[\s\S]*장소[\s\S]*핵심 행동[\s\S]*목표·감정/,
    /정확히 세 개의 시각 키워드/,
    /정확히 다섯 색과 HEX/,
    /이번 변경 변수/,
    /Style Reference/,
    /Composition Reference/,
    /Custom Seed|custom seed|같은 seed/,
    /V01 \/ BASE[\s\S]*V02 \/ SHAPE[\s\S]*V03 \/ ACCENT/,
    /64×64 preview/,
    /grayscale|회색조/,
    /prototype candidate/,
    /Remove Background[\s\S]*Upscale[\s\S]*Pixelate[\s\S]*Recolor[\s\S]*Inpaint/,
  ]) {
    assert.match(period2, pattern);
  }

  assert.match(period2, /data-copy-code="prompt-template"/);
  assert.match(period2, /assets\/week-09-period2-style-system\.webp/);
});

test("period 3 has eight measurable gates, persistent records, and week 10 handoff evidence", async () => {
  const [, , , period3, stylesheet, script] = await readWeekNine();

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

  for (const pattern of [
    /role="region" aria-label="9주차 AI 아트 디렉션과 Sprite 후보 선택 테스트표" tabindex="0"/,
    /후보를 정확히 세 장/,
    /정확히 5개/,
    /color·grayscale <code>64×64<\/code>/,
    /선택은 정확히 1장/,
    /week09_학번_이름_style-board\.png/,
    /week09_학번_이름_selected\.png/,
    /week09_학번_이름_process-log\.pdf/,
    /week09_학번_이름_test\.csv/,
    /prototype candidate \/ Week 10/,
    /assets\/week-09-period3-selection-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /localStorage/,
    /game-engine-1-week-09-build-v1/,
    /game-engine-1-week-09-tests-v1/,
    /new Blob/,
    /text\/csv;charset=utf-8/,
    /week09_\$\{identityParts\.join\("_"\)\}_test\.csv/,
    /spreadsheetSafe/,
    /navigator\.clipboard/,
    /IntersectionObserver/,
  ]) {
    assert.match(script, pattern);
  }

  assert.doesNotMatch(script, /addEventListener\(["']scroll["']/);

  for (const pattern of [
    /@media \(max-width: 760px\)/,
    /@media \(prefers-color-scheme: dark\)/,
    /@media \(prefers-reduced-transparency: reduce\)/,
    /@media \(prefers-reduced-motion: reduce\)/,
    /@media print/,
    /\.test-table tr\[data-result="pass"\]/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("week 9 controls remain readable in light and dark modes", async () => {
  const [, , , , stylesheet] = await readWeekNine();
  const darkModeStart = stylesheet.indexOf("@media (prefers-color-scheme: dark)");
  assert.ok(darkModeStart > 0, "dark mode tokens should be present");

  const lightTokens = stylesheet.slice(0, darkModeStart);
  const darkTokens = stylesheet.slice(darkModeStart);
  const codeSurface = readHexToken(lightTokens, "--w9-code");
  const modes = [
    {
      label: "light",
      source: lightTokens,
      paper: "#fcfcf9",
      textSurfaces: ["#f1f2ef", "#fcfcf9"],
    },
    {
      label: "dark",
      source: darkTokens,
      paper: "#1c211e",
      textSurfaces: ["#151917", "#1c211e"],
    },
  ];

  for (const { label, source, paper, textSurfaces } of modes) {
    assert.ok(
      contrastRatio(readHexToken(source, "--w9-action-ink"), readHexToken(source, "--w9-action-bg")) >=
        4.5,
      `${label} primary action must meet WCAG AA text contrast`,
    );
    assert.ok(
      contrastRatio(
        readHexToken(source, "--w9-success-action-ink"),
        readHexToken(source, "--w9-success-action-bg"),
      ) >= 4.5,
      `${label} success action must meet WCAG AA text contrast`,
    );
    assert.ok(
      contrastRatio(readHexToken(source, "--w9-focus-ring"), paper) >= 3,
      `${label} focus indicator must meet non-text contrast`,
    );
    assert.ok(
      contrastRatio(readHexToken(source, "--w9-control-border"), paper) >= 3,
      `${label} control boundary must meet non-text contrast`,
    );
    assert.ok(
      contrastRatio(readHexToken(source, "--w9-code-focus-ring"), codeSurface) >= 3,
      `${label} code-panel focus indicator must meet non-text contrast`,
    );
    assert.ok(
      contrastRatio(readHexToken(source, "--w9-code-success-ink"), codeSurface) >= 4.5,
      `${label} code-panel status text must meet WCAG AA text contrast`,
    );
    for (const surface of textSurfaces) {
      assert.ok(
        contrastRatio(readHexToken(source, "--w9-lime-dark"), surface) >= 4.5,
        `${label} verification labels must meet WCAG AA text contrast`,
      );
      assert.ok(
        contrastRatio(readHexToken(source, "--w9-cyan-dark"), surface) >= 4.5,
        `${label} reference links must meet WCAG AA text contrast`,
      );
    }
  }

  assert.match(stylesheet, /::placeholder[\s\S]*color:\s*var\(--muted\);[\s\S]*opacity:\s*1;/);
  assert.match(
    stylesheet,
    /\.copy-status\s*\{[\s\S]*color:\s*var\(--w9-code-success-ink\);/,
  );
  assert.match(
    stylesheet,
    /\.reference-list a:hover\s*\{\s*color:\s*var\(--w9-cyan-dark\);/,
  );
});

test("week 9 evidence records protect identity and require documented PASS results", async () => {
  const [, , , period3, , script] = await readWeekNine();

  assert.match(period3, /data-storage-notice/);
  assert.match(period3, /이름과 학번은 저장하지 않습니다/);
  assert.match(period3, /data-build-status[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(period3, /data-test-progress-label>0 \/ 8 PASS · 0 \/ 8 기록/);

  assert.match(script, /const isRequiredTestComplete =/);
  assert.match(script, /requiredRows\.every\(isRequiredTestComplete\)/);
  assert.match(script, /writeStorage\(testStorageKey, serializeStoredTests\(\)\)/);
  assert.doesNotMatch(script, /saved\.identity/);
  assert.match(script, /Object\.hasOwn\(saved, "identity"\)/);
  assert.match(script, /return true;[\s\S]*return false;/);
  assert.match(script, /저장할 수 없습니다[\s\S]*CSV/);
  assert.match(script, /const createResetConfirmation =/);
  assert.match(script, /window\.setTimeout\([\s\S]*5_000/);
  assert.match(script, /dataset\.confirming/);
});

test("week 9 keeps hero and section labels concise", async () => {
  const [, period1, period2, period3] = await readWeekNine();
  const expectations = [
    {
      html: period1,
      eyebrow: "Game Engine I / Week 09 / 1교시",
      labels: ["안전한 생성", "회수 질문"],
    },
    {
      html: period2,
      eyebrow: "Game Engine I / Week 09 / 2교시",
      labels: ["방향을 잠그기", "변수를 통제하기", "후보를 선택하기"],
    },
    {
      html: period3,
      eyebrow: "Game Engine I / Week 09 / 3교시",
      labels: ["미션 계약", "완료 검증", "10주차 전달"],
    },
  ];

  for (const { html, eyebrow, labels } of expectations) {
    assert.doesNotMatch(html, /class="hero-facts"/);
    assert.match(html, new RegExp(`<p class="eyebrow">${eyebrow}</p>`));
    assert.equal(
      [...html.matchAll(/class="section-index"/g)].length,
      labels.length,
      `${eyebrow}: only functional section labels should remain`,
    );
    for (const label of labels) {
      assert.match(html, new RegExp(`<p class="section-index">${label}</p>`));
    }
  }
});

test("week 9 interactions support touch targets and gate hover-only feedback", async () => {
  const [, , , , stylesheet] = await readWeekNine();
  const hoverMediaStart = stylesheet.indexOf("@media (hover: hover) and (pointer: fine)");
  const responsiveMediaStart = stylesheet.indexOf("@media (max-width", hoverMediaStart);

  assert.ok(hoverMediaStart > 0, "hover feedback should be gated by pointer capability");
  assert.ok(responsiveMediaStart > hoverMediaStart, "hover media should close before responsive rules");
  for (const match of stylesheet.matchAll(/:hover/g)) {
    assert.ok(
      match.index > hoverMediaStart && match.index < responsiveMediaStart,
      `ungated hover selector at stylesheet index ${match.index}`,
    );
  }

  for (const pattern of [
    /\.hero-action:active\s*\{[\s\S]*transform:\s*translateY\(1px\)/,
    /\.lesson-sequence a:active\s*\{[\s\S]*transform:\s*translateY\(1px\)/,
    /\.code-panel-bar button\s*\{[\s\S]*min-height:\s*44px/,
    /\.test-action,[\s\S]*\.completion-panel button\s*\{[\s\S]*min-height:\s*44px/,
    /\.test-action,[\s\S]*\.completion-panel button\s*\{[\s\S]*transition:/,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-action:active[\s\S]*transform:\s*none/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("week 9 stylesheet contains no abandoned component classes", async () => {
  const [, period1, period2, period3, stylesheet, script] = await readWeekNine();
  const publicSources = `${period1}\n${period2}\n${period3}\n${script}`;
  const cssClasses = new Set(
    [...stylesheet.matchAll(/\.([a-z][a-z0-9_-]*)/gi)].map((match) => match[1]),
  );
  const unusedClasses = [...cssClasses]
    .filter((className) => !publicSources.includes(className))
    .sort();

  assert.deepEqual(unusedClasses, []);
});

test("week 9 uses generated raster visuals, exact generation records, and current primary sources", async () => {
  const [, period1, period2, period3, , , generationLog] = await readWeekNine();
  const combined = `${period1}\n${period2}\n${period3}`;

  assert.doesNotMatch(combined, /week-09[^"']*\.svg/);
  assert.match(generationLog, /OpenAI 내장 `imagegen` 모드/);
  assert.match(generationLog, /SVG fallback은 사용하지 않았습니다/);
  assert.doesNotMatch(generationLog, /\/Users\/|codex-accounts|generated_images/);
  assert.equal([...generationLog.matchAll(/### 정확한 생성 프롬프트/g)].length, 3);

  for (const officialUrl of [
    "https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.10/manual/about/assistant-modes.html",
    "https://unity.com/blog/unity-ai-how-to-get-started",
    "https://unity.com/blog/unity-ai-sprite-generator",
    "https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide",
    "https://www.copyright.or.kr/notify/notice/view.do?brdctsno=55402",
    "https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html",
  ]) {
    assert.ok(combined.includes(officialUrl), `missing primary source: ${officialUrl}`);
  }
});
