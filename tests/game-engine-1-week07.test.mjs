import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");
const assetDirectory = resolve(courseDirectory, "assets");

const relativeLuminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
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

const fixturePaths = {
  courseIndex: resolve(courseDirectory, "index.html"),
  previousLesson: resolve(courseDirectory, "week-06-period3.html"),
  period1: resolve(courseDirectory, "week-07-period1.html"),
  period2: resolve(courseDirectory, "week-07-period2.html"),
  period3: resolve(courseDirectory, "week-07-period3.html"),
  stylesheet: resolve(assetDirectory, "week-07.css"),
  script: resolve(assetDirectory, "week-07.js"),
};

const readFixture = (name) => readFile(fixturePaths[name], "utf8");
const readWeekSevenPages = () =>
  Promise.all([readFixture("period1"), readFixture("period2"), readFixture("period3")]);

test("Game Engine I week 7 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3] = await Promise.all([
    readFixture("courseIndex"),
    readFixture("previousLesson"),
    readFixture("period1"),
    readFixture("period2"),
    readFixture("period3"),
  ]);
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");

  const imageNames = [
    "week-07-period1-state-loop.webp",
    "week-07-period2-feedback-system.webp",
    "week-07-period3-preflight-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-07-period${period}\\.html"`));
    assert.match(
      siteConfig,
      new RegExp(`teaching/game-engine-1/week-07-period${period}\\.html`),
    );
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-07-period${period}\\.html`));

    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 75_000, `period ${period} generated image should be present`);
  }

  assert.match(previousLesson, /href="week-07-period1\.html" rel="next"/);
  assert.match(period1, /href="week-06-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-07-period2\.html" rel="next"/);
  assert.match(period2, /href="week-07-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-07-period3\.html" rel="next"/);
  assert.match(period3, /href="week-07-period2\.html" rel="prev"/);
  assert.match(period3, /href="week-09-period1\.html" rel="next"/);
});

test("week 7 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [period1, period2, period3] = await readWeekSevenPages();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("periods 1 and 2 are professor-led while period 3 is goal-directed individual work", async () => {
  const [period1, period2, period3] = await readWeekSevenPages();

  for (const period of [period1, period2]) {
    assert.ok(period.includes("교수자"));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /짝 활동|조별 활동|실습\(2시간\)/);
  }

  for (const requiredText of [
    "학생 개인 목표지향 실습",
    "목표는 고정하고 구현 경로는 선택합니다",
    "클릭 순서 대신 중간 도착점을 확인합니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }

  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
});

test("period 1 explains state, data, HUD, and feedback as separate responsibilities", async () => {
  const period1 = await readFixture("period1");

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "model",
    "states",
    "hud",
    "events",
    "mistakes",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const requiredText of [
    "Ready, Playing, Won, Lost",
    "게임 데이터, 게임 상태, 화면 출력",
    "scoreText.text",
    "HUD / WHILE PLAYING",
    "OVERLAY / AT A MOMENT",
    "Screen Space · Overlay",
    "Scale With Screen Size",
    "PlayOneShot",
  ]) {
    assert.ok(period1.includes(requiredText), `period 1 missing: ${requiredText}`);
  }

  assert.match(period1, /assets\/week-07-period1-state-loop\.webp/);
  assert.match(period1, /00-07[\s\S]*53-60/);
});

test("period 2 provides a coherent state implementation and Unity 6 build path", async () => {
  const [period2, script] = await Promise.all([
    readFixture("period2"),
    readFixture("script"),
  ]);

  for (const pattern of [
    /public enum GameState/,
    /Ready,[\s\S]*Playing,[\s\S]*Won,[\s\S]*Lost/,
    /public GameState CurrentState \{ get; private set; \}/,
    /timeRemaining - Time\.deltaTime/,
    /Mathf\.Max/,
    /CurrentState != GameState\.Playing/,
    /Time\.timeScale = 0f/,
    /sfxSource\.PlayOneShot\(clip\)/,
    /SceneManager\.LoadScene\(currentScene\)/,
    /File → Build Profiles → Platforms → Scene List/,
    /Build and Run/,
  ]) {
    assert.match(period2, pattern);
  }

  for (const sectionId of [
    "architecture",
    "scene",
    "simulation",
    "manager",
    "collectible",
    "audio",
    "build",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  assert.match(period2, /data-state-lab/);
  assert.match(script, /data-state-action/);
  assert.match(script, /model\.state = "won"/);
  assert.match(script, /model\.state = "lost"/);
  assert.match(period2, /GameManager와 Collectible 참조 할당/);
  assert.match(period2, /세 Collectible[^<]*<code>gameManager<\/code>/);
  assert.match(period2, /aria-label="GameManager와 Collectible Inspector 참조 계약"/);
  assert.match(period2, /Start → Won → Restart → Start → Lost → Restart/);
  assert.match(period2, /assets\/week-07-period2-feedback-system\.webp/);
});

test("period 3 has eight measurable gates, persistent records, and build evidence", async () => {
  const [period3, stylesheet, script] = await Promise.all([
    readFixture("period3"),
    readFixture("stylesheet"),
    readFixture("script"),
  ]);

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
    /role="region" aria-label="7주차 UI, Audio, 상태와 빌드 테스트표" tabindex="0"/,
    /Start → Won → Restart → Start → Lost → Restart/,
    /세 Collectible[^<]*<code>gameManager<\/code>/,
    /week07_학번_이름_test\.csv/,
    /week07_play\.png/,
    /week07_result\.png/,
    /Week07_학번_이름/,
    /Ask로 이해만 보조합니다/,
    /assets\/week-07-period3-preflight-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /localStorage/,
    /game-engine-1-week-07-build-v1/,
    /game-engine-1-week-07-tests-v1/,
    /new Blob/,
    /text\/csv;charset=utf-8/,
    /week07_\$\{identityParts\.join\("_"\)\}_test\.csv/,
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
    /\.state-lab-screen\[data-state="won"\]/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("week 7 CSV export neutralizes spreadsheet formula prefixes", async () => {
  const script = await readFixture("script");
  const helperSource = script.match(
    /const spreadsheetSafe = \(value\) => \{([\s\S]*?)\n    \};/,
  );
  assert.ok(helperSource, "spreadsheetSafe helper must remain inspectable");

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
    assert.equal(spreadsheetSafe(dangerous), `'${dangerous}`);
  }
  assert.equal(spreadsheetSafe("관찰 기록"), "관찰 기록");
});

test("week 7 uses generated raster visuals and version-pinned Unity primary sources", async () => {
  const [period1, period2, period3] = await readWeekSevenPages();
  const combined = `${period1}\n${period2}\n${period3}`;

  assert.doesNotMatch(combined, /week-07[^"']*\.svg/);
  assert.doesNotMatch(combined, /[—–]/);
  assert.doesNotMatch(combined, /docs\.unity3d\.com\/(?:kr\/)?current\//);

  for (const officialUrl of [
    "https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/UICanvas.html",
    "https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-CanvasScaler.html",
    "https://docs.unity3d.com/6000.3/Documentation/ScriptReference/AudioSource.html",
    "https://docs.unity3d.com/6000.3/Documentation/ScriptReference/AudioSource.PlayOneShot.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/time-scale.html",
    "https://docs.unity3d.com/6000.3/Documentation/ScriptReference/SceneManagement.SceneManager.LoadScene.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/build-profiles.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/build-profile-scene-list.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/build-profiles-reference.html",
  ]) {
    assert.ok(combined.includes(officialUrl), `missing official Unity source: ${officialUrl}`);
  }
});

test("week 7 action colors stay readable while success and danger remain semantic", async () => {
  const stylesheet = await readFixture("stylesheet");
  const teachingStyles = await readFile(resolve(root, "assets", "teaching.css"), "utf8");
  const darkModeStart = stylesheet.indexOf("@media (prefers-color-scheme: dark)");
  const darkModeEnd = stylesheet.indexOf(
    "@media (prefers-reduced-transparency: reduce)",
    darkModeStart,
  );
  assert.ok(darkModeStart >= 0 && darkModeEnd > darkModeStart, "dark mode tokens must exist");

  const lightMode = stylesheet.slice(0, darkModeStart);
  const darkMode = stylesheet.slice(darkModeStart, darkModeEnd);
  const codeSurface = readHexToken(lightMode, "--w7-code");
  const teachingDarkModeStart = teachingStyles.indexOf("@media (prefers-color-scheme: dark)");
  const lightPaper = readHexToken(
    teachingStyles.slice(0, teachingDarkModeStart),
    "--paper",
  );
  const darkPaper = readHexToken(
    teachingStyles.slice(teachingDarkModeStart),
    "--paper",
  );

  for (const [theme, paper] of [[lightMode, lightPaper], [darkMode, darkPaper]]) {
    const actionBackground = readHexToken(theme, "--w7-action-bg");
    const actionText = readHexToken(theme, "--w7-action-text");
    assert.ok(
      contrastRatio(actionText, actionBackground) >= 4.5,
      `${actionText} on ${actionBackground} must meet WCAG AA`,
    );
    for (const [foregroundToken, backgroundToken] of [
      ["--w7-success-strong", "--w7-success-soft"],
      ["--w7-danger-strong", "--w7-danger-soft"],
    ]) {
      const foreground = readHexToken(theme, foregroundToken);
      const background = readHexToken(theme, backgroundToken);
      assert.ok(
        contrastRatio(foreground, background) >= 4.5,
        `${foregroundToken} on ${backgroundToken} must meet WCAG AA`,
      );
    }
    const focusRing = readHexToken(theme, "--w7-focus-ring");
    assert.ok(
      contrastRatio(focusRing, paper) >= 3,
      `${focusRing} focus ring on ${paper} must meet non-text contrast`,
    );
    assert.ok(
      contrastRatio(focusRing, codeSurface) >= 3,
      `${focusRing} focus ring on ${codeSurface} must meet non-text contrast`,
    );
  }

  assert.match(
    stylesheet,
    /\.hero-action-primary\s*\{[\s\S]*?background:\s*var\(--w7-action-bg\);[\s\S]*?color:\s*var\(--w7-action-text\);[\s\S]*?\}/,
  );
  assert.match(
    stylesheet,
    /\.test-action-primary\s*\{[\s\S]*?background:\s*var\(--w7-action-bg\);[\s\S]*?color:\s*var\(--w7-action-text\);[\s\S]*?\}/,
  );
  assert.match(stylesheet, /tr\[data-result="pass"\][\s\S]*?--w7-success-soft/);
  assert.match(stylesheet, /tr\[data-result="fail"\][\s\S]*?--w7-danger-soft/);
  const primaryActionRule = stylesheet.match(
    /\.test-action-primary\s*\{([^}]*)\}/,
  );
  assert.ok(primaryActionRule, "primary test action rule must exist");
  assert.doesNotMatch(primaryActionRule[1], /--w7-success(?:-strong)?/);
  assert.match(stylesheet, /:focus-visible\s*\{[\s\S]*?outline:\s*3px solid var\(--w7-focus-ring\);/);
  const focusRule = stylesheet.match(/:focus-visible\s*\{([^}]*)\}/);
  assert.ok(focusRule, "focus-visible rule must exist");
  assert.doesNotMatch(focusRule[1], /transparent|color-mix/);
});

test("week 7 keeps student-facing copy and controls readable", async () => {
  const stylesheet = await readFixture("stylesheet");
  const identityRule = stylesheet.match(/\.test-identity\s*\{([^}]*)\}/);

  assert.ok(identityRule, "test identity layout must exist");
  assert.match(
    identityRule[1],
    /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
    "the two identity fields should occupy two balanced desktop columns",
  );

  assert.doesNotMatch(
    stylesheet,
    /font-size:\s*(?:8(?:\.5)?|9(?:\.5)?|10(?:\.5)?|11(?:\.5)?)px;/,
    "Week 7 must not render labels or controls below 12px",
  );

  for (const pattern of [
    /\.signal-chain p\s*\{[\s\S]*?font-size:\s*14px;/,
    /\.concept-grid p\s*\{[\s\S]*?font-size:\s*14px;/,
    /th,[\s\S]*?td\s*\{[\s\S]*?font-size:\s*14px;/,
    /\.details-motion-content p\s*\{[\s\S]*?font-size:\s*14px;/,
    /\.code-panel pre\s*\{[\s\S]*?font-size:\s*13px;/,
    /\.submission-grid p\s*\{[\s\S]*?font-size:\s*14px;/,
    /\.completion-panel label\s*\{[\s\S]*?font-size:\s*14px;/,
  ]) {
    assert.match(stylesheet, pattern);
  }

  for (const pattern of [
    /\.lesson-sequence a\s*\{[\s\S]*?min-height:\s*44px;/,
    /\.week-seven-toc a\s*\{[\s\S]*?min-height:\s*44px;/,
    /\.code-panel-bar button\s*\{[\s\S]*?min-height:\s*44px;/,
    /\.state-controls button\s*\{[\s\S]*?min-height:\s*44px;/,
    /\.test-identity input,[\s\S]*?\.test-table select\s*\{[\s\S]*?min-height:\s*44px;[\s\S]*?font-size:\s*14px;/,
    /\.test-action,[\s\S]*?\.completion-panel button\s*\{[\s\S]*?min-height:\s*44px;[\s\S]*?font-size:\s*14px;/,
  ]) {
    assert.match(stylesheet, pattern);
  }
});

test("week 7 keeps anchored sections and the test sheet usable on mobile", async () => {
  const [periodThree, stylesheet] = await Promise.all([
    readFixture("period3"),
    readFixture("stylesheet"),
  ]);

  assert.match(
    stylesheet,
    /@media \(max-width: 980px\)[\s\S]*?\[id\]\s*\{[\s\S]*?scroll-margin-top:\s*146px;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 980px\)[\s\S]*?html\.game-engine-week-seven-root\s*\{[\s\S]*?scroll-padding-top:\s*146px;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.test-table\s*\{[\s\S]*?min-width:\s*0;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.test-table thead\s*\{[\s\S]*?position:\s*absolute;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.test-table tr\s*\{[\s\S]*?display:\s*grid;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.test-table td::before\s*\{[\s\S]*?content:\s*attr\(data-label\);/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 760px\)[\s\S]*?\.test-progress\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*146px;/,
  );

  const testRows = periodThree.match(/<tr data-test-row[\s\S]*?<\/tr>/g) ?? [];
  assert.equal(testRows.length, 8);
  for (const row of testRows) {
    assert.match(row, /<td data-label="결과">/);
    assert.match(row, /<td data-label="관찰 기록">/);
  }
});

test("week 7 protects student identity and makes destructive resets recoverable", async () => {
  const [periodThree, stylesheet, script] = await Promise.all([
    readFixture("period3"),
    readFixture("stylesheet"),
    readFixture("script"),
  ]);

  assert.match(script, /const testIdentityKey = "game-engine-1-week-07-identity-v1";/);
  assert.match(script, /sessionStorage\.getItem\(key\)/);
  assert.match(script, /sessionStorage\.setItem\(key, JSON\.stringify\(value\)\)/);
  assert.match(script, /sessionStorage\.removeItem\(key\)/);
  assert.match(script, /writeStorage\(testStorageKey, serializeTests\(\)\)/);
  assert.match(script, /writeSessionStorage\(testIdentityKey, serializeIdentity\(\)\)/);
  const testSerializer = script.match(
    /const serializeTests = \(\) => \{[\s\S]*?\n    \};\n\n    const serializeIdentity/,
  );
  assert.ok(testSerializer, "test and identity serializers must stay separate");
  assert.doesNotMatch(testSerializer[0], /identity|student(?:Id|Name)/);
  assert.match(periodThree, /data-student-name[^>]*autocomplete="off"|autocomplete="off"[^>]*data-student-name/);
  assert.doesNotMatch(periodThree, /data-student-name[^>]*autocomplete="name"|autocomplete="name"[^>]*data-student-name/);

  assert.match(script, /const armReset = \(/);
  assert.match(script, /button\.dataset\.confirming = "true";/);
  assert.match(script, /if \(button\.dataset\.confirming !== "true"\)/);
  assert.match(
    script,
    /const cancelReset = \(\) => \{[\s\S]*?disarm\(\);[\s\S]*?status\.textContent = cancelMessage;/,
  );
  assert.equal((script.match(/cancelMessage:/g) ?? []).length, 2);
  assert.match(periodThree, /data-reset-tests[^>]*>기록 초기화<\/button>/);
  assert.match(periodThree, /data-build-reset[^>]*>체크 초기화<\/button>/);
  assert.match(
    periodThree,
    /data-test-progress[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(
    periodThree,
    /data-build-progress-label[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(periodThree, /data-build-status-message[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(
    stylesheet,
    /\[data-confirming="true"\][\s\S]*?--w7-danger-soft/,
  );
});

test("week 7 keeps copy, simulator, and placeholder feedback local and perceivable", async () => {
  const [periodTwo, stylesheet, script] = await Promise.all([
    readFixture("period2"),
    readFixture("stylesheet"),
    readFixture("script"),
  ]);

  assert.equal((periodTwo.match(/data-copy-status/g) ?? []).length, 2);
  for (const codeId of ["game-manager-code", "collectible-code"]) {
    assert.match(
      periodTwo,
      new RegExp(
        `data-copy-code="${codeId}"[\\s\\S]*?<pre>[\\s\\S]*?<p class="copy-status" data-copy-status role="status" aria-live="polite" aria-atomic="true">`,
      ),
    );
  }
  assert.match(
    script,
    /button\s*\.closest\("\.code-panel"\)\s*\?\.querySelector\("\[data-copy-status\]"\)/,
  );
  assert.match(script, /copyStatus\.dataset\.kind = copied \? "success" : "error";/);
  assert.match(stylesheet, /\.copy-status\[data-kind="success"\][\s\S]*?--w7-code-success/);
  assert.match(stylesheet, /\.copy-status\[data-kind="error"\][\s\S]*?--w7-code-danger/);

  assert.match(
    periodTwo,
    /data-state-readout[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(periodTwo, /data-state-readout-value>Ready</);
  assert.match(script, /stateReadoutValue\.textContent = current\.name;/);

  assert.match(
    stylesheet,
    /input::placeholder\s*\{[\s\S]*?color:\s*var\(--w7-placeholder\);[\s\S]*?opacity:\s*1;/,
  );
  assert.doesNotMatch(stylesheet, /input::placeholder\s*\{[\s\S]*?opacity:\s*0\./);
});

test("week 7 registers the saved scene before restart testing", async () => {
  const [periodTwo, periodThree] = await Promise.all([
    readFixture("period2"),
    readFixture("period3"),
  ]);
  const teacherSceneSetup = periodTwo.slice(
    periodTwo.indexOf('id="scene"'),
    periodTwo.indexOf('id="simulation"'),
  );
  const studentRoute = periodThree.slice(
    periodThree.indexOf('id="route"'),
    periodThree.indexOf('id="tests"'),
  );
  const teacherRegistration = teacherSceneSetup.indexOf("Scene List에 등록");
  const teacherRestart = teacherSceneSetup.indexOf("Button On Click 연결");
  const studentRegistration = studentRoute.indexOf("Scene List에 등록");
  const studentRestart = studentRoute.indexOf("피드백과 재시작");

  assert.ok(teacherRegistration >= 0, "teacher flow must include Scene List registration");
  assert.ok(teacherRestart >= 0, "teacher flow must include Restart button wiring");
  assert.ok(
    teacherRegistration < teacherRestart,
    "teacher flow must register the scene before wiring and testing Restart",
  );
  assert.ok(studentRegistration >= 0, "student flow must include Scene List registration");
  assert.ok(studentRestart >= 0, "student flow must include Restart testing");
  assert.ok(
    studentRegistration < studentRestart,
    "student flow must register the scene before testing Restart",
  );
});

test("week 7 uses a calm learning hierarchy instead of repeated dashboard chrome", async () => {
  const [periodOne, periodTwo, periodThree, stylesheet] = await Promise.all([
    readFixture("period1"),
    readFixture("period2"),
    readFixture("period3"),
    readFixture("stylesheet"),
  ]);

  for (const page of [periodOne, periodTwo, periodThree]) {
    assert.doesNotMatch(page, /hero-facts|toc-legend/);
    assert.doesNotMatch(page, /class="section-index">\d{2}\s*\//);
    assert.doesNotMatch(page, /class="eyebrow">[^<]*·/);
    assert.equal((page.match(/class="hero-action(?:\s|"|$)/g) ?? []).length, 2);
  }

  assert.match(
    stylesheet,
    /\.week-seven-hero-visual img\s*\{[\s\S]*?aspect-ratio:\s*4\s*\/\s*3;[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*66% center;/,
  );
  assert.match(
    stylesheet,
    /\.submission-grid\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/,
  );
  assert.match(
    stylesheet,
    /\.exit-ticket\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?border-top:/,
  );
  assert.match(periodTwo, /data-copy-code="game-manager-code">교수자 시연용 복사<\/button>/);
  assert.match(periodTwo, /data-copy-code="collectible-code">교수자 시연용 복사<\/button>/);
});

test("week 7 reserves semantic colors and motion for meaningful feedback", async () => {
  const stylesheet = await readFixture("stylesheet");

  assert.doesNotMatch(stylesheet, /--w7-(?:coral|cyan|lime)(?:-dark|-soft)?:/);
  assert.doesNotMatch(stylesheet, /var\(--w7-(?:coral|cyan|lime)(?:-dark|-soft)?\)/);
  assert.match(stylesheet, /\.state-loop li:nth-child\(3\)[\s\S]*?--w7-success/);
  assert.match(stylesheet, /\.state-loop li:nth-child\(4\)[\s\S]*?--w7-danger/);
  assert.match(stylesheet, /\.state-lab-screen\[data-state="won"\][\s\S]*?--w7-success/);
  assert.match(stylesheet, /\.state-lab-screen\[data-state="lost"\][\s\S]*?--w7-danger/);
  assert.match(stylesheet, /\.test-progress\s*\{[\s\S]*?--w7-accent/);
  assert.match(stylesheet, /\.test-progress\[data-complete="true"\][\s\S]*?--w7-success/);

  const pointerMedia = stylesheet.indexOf("@media (hover: hover) and (pointer: fine)");
  assert.ok(pointerMedia > 0, "fine-pointer hover styles must be gated");
  assert.doesNotMatch(stylesheet.slice(0, pointerMedia), /:hover/);
  assert.match(
    stylesheet.slice(pointerMedia),
    /:active[\s\S]*?transform:\s*scale\(0\.98\);/,
  );
  assert.match(
    stylesheet,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?:active[\s\S]*?transform:\s*none;/,
  );

  assert.doesNotMatch(stylesheet, /clock-(?:compare|card|pulses)|collision-note|mistake-list/);
});
