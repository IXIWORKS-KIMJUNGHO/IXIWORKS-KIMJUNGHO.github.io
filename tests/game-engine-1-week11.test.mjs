import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

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

const readWeekEleven = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-10-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-11-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-11-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-11-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-11.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-11.js"), "utf8"),
  ]);

test("Game Engine I week 11 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3] = await readWeekEleven();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
  const imageNames = [
    "week-11-period1-ai-workflow.webp",
    "week-11-period2-bounded-change.webp",
    "week-11-period3-time-bonus-mission.webp",
  ];

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-11-period${period}\\.html"`));
    assert.match(siteConfig, new RegExp(`teaching/game-engine-1/week-11-period${period}\\.html`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-11-period${period}\\.html`));
    const image = await stat(resolve(assetDirectory, imageNames[period - 1]));
    assert.ok(image.size > 100_000, `period ${period} generated WebP should be present`);
  }

  assert.match(previousLesson, /href="week-11-period1\.html" rel="next"/);
  assert.match(period1, /href="week-10-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-11-period2\.html" rel="next"/);
  assert.match(period2, /href="week-11-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-11-period3\.html" rel="next"/);
  assert.match(period3, /href="week-11-period2\.html" rel="prev"/);
  assert.match(period3, /href="week-12-period1\.html" rel="next"/);
  assert.doesNotMatch(period3, /href="week-13-period1\.html" rel="next"/);
  assert.match(period3, /href="\.\/#week-12"/);
});

test("week 11 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, , period1, period2, period3] = await readWeekEleven();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("periods 1 and 2 are professor-led while period 3 is a goal-directed individual lab", async () => {
  const [, , period1, period2, period3] = await readWeekEleven();

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
    "작업 속도와 Agent 호출 횟수는 평가하지 않습니다",
    "필수 테스트 8개",
    "8 / 8 PASS",
    "90초 코드 구술",
  ]) {
    assert.ok(period3.includes(requiredText), `period 3 missing: ${requiredText}`);
  }
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동|교수자를 따라/);
});

test("period 1 teaches problem framing, autonomy, least privilege, diff, and proof", async () => {
  const [, , period1] = await readWeekEleven();

  for (const sectionId of [
    "arrival",
    "run",
    "baseline",
    "modes",
    "problem",
    "hallucination",
    "permission",
    "contract",
    "diff",
    "evidence",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /Ask[\s\S]*Plan[\s\S]*Agent/,
    /관찰[\s\S]*기대 결과[\s\S]*범위[\s\S]*제약[\s\S]*통과 조건/,
    /hallucination/,
    /Write scripts only/,
    /GameManager\.cs[\s\S]*TimeBonus\.cs/,
    /Agent가 작성하는 구현 코드[\s\S]*두 C# 파일/,
    /Assets\/Plans[\s\S]*\.meta[\s\S]*Scene/,
    /Scene[\s\S]*Prefab[\s\S]*Packages[\s\S]*ProjectSettings/,
    /diff[\s\S]*Console[\s\S]*Play Mode[\s\S]*회귀 테스트[\s\S]*코드 설명/,
    /assets\/week-11-period1-ai-workflow\.webp/,
  ]) {
    assert.match(period1, pattern);
  }
});

test("period 2 demonstrates the complete bounded Time Bonus change", async () => {
  const [, , , period2, , , script] = await readWeekEleven();

  for (const sectionId of [
    "demo",
    "ask",
    "plan",
    "permission",
    "diff",
    "wiring",
    "verify",
    "repair",
    "explain",
    "handoff",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /data-time-contract-lab/,
    /TryAddTime\(float seconds\)/,
    /CurrentState != GameState\.Playing \|\| seconds &lt;= 0f/,
    /Mathf\.Min\([\s\S]*timeRemaining \+ seconds[\s\S]*roundDuration/,
    /class TimeBonus : MonoBehaviour/,
    /collected \|\| !other\.CompareTag\("Player"\) \|\| gameManager == null/,
    /Write scripts only/,
    /다른 파일을 생성, 수정, 이동 또는 삭제하지 마세요/,
    /Collider2D[\s\S]*Is Trigger[\s\S]*GameManager 참조/,
    /Player 또는 TimeBonus[\s\S]*Rigidbody2D/,
    /Week11_TimeBonus[\s\S]*첫 번째 활성 Scene[\s\S]*이전 Scene을 비활성화/,
    /20\.0초[\s\S]*25\.0초/,
    /28\.0초[\s\S]*30\.0초/,
    /assets\/week-11-period2-bounded-change\.webp/,
  ]) {
    assert.match(period2, pattern);
  }

  assert.match(script, /data-time-contract-lab/);
  assert.match(script, /state === "Playing" && bonusValue > 0/);
  assert.match(script, /Math\.min\(current \+ bonusValue, cap\)/);
  assert.match(
    period2,
    /class="time-contract-result"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
});

test("period 3 fixes the goal while preserving implementation choice and equal access", async () => {
  const [, , , , period3] = await readWeekEleven();

  for (const sectionId of [
    "mission",
    "choices",
    "starting-line",
    "pack",
    "route",
    "ask",
    "plan",
    "agent",
    "review",
    "tests",
    "repair",
    "oral",
    "submission",
    "references",
  ]) {
    assert.match(period3, new RegExp(`id="${sectionId}"`));
  }

  for (const pattern of [
    /\+5초[\s\S]*최대 30초[\s\S]*Playing[\s\S]*한 번/,
    /GameManager\.cs[\s\S]*TimeBonus\.cs/,
    /ROUTE A \/ ASSISTANT AVAILABLE[\s\S]*ROUTE B \/ OFFLINE SUBSTITUTE/,
    /AI 사용량, subscription, 호출 횟수와 작업 속도는 점수가 아닙니다/,
    /data-test-table/,
    /data-build-checklist/,
    /data-export-tests/,
    /assets\/week-11-change-control-starter\.zip/,
    /File → Build Profiles → Scene List → Add Open Scenes/,
    /Week11_TimeBonus[\s\S]*첫 번째 활성 Scene[\s\S]*이전 Scene을 비활성화/,
    /git add -N -- Assets\/Scripts\/TimeBonus\.cs[\s\S]*git diff -- Assets\/Scripts\/GameManager\.cs Assets\/Scripts\/TimeBonus\.cs/,
    /AI_CHANGE_LOG\.md/,
    /week11_학번_이름_diff\.txt/,
    /60-90초 영상/,
    /owner, event, reject와 proof/,
    /assets\/week-11-period3-time-bonus-mission\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  const testRows = [...period3.matchAll(/data-test-id="T\d{2}"/g)];
  assert.equal(testRows.length, 8);
  assert.equal((period3.match(/data-required="true"/g) ?? []).length, 8);
  assert.match(
    period3,
    /T01[\s\S]*Start[\s\S]*Won[\s\S]*Restart[\s\S]*Start[\s\S]*Lost[\s\S]*Restart/,
  );
  assert.match(
    period3,
    /T07[\s\S]*Won[\s\S]*Restart[\s\S]*Start[\s\S]*Lost[\s\S]*Restart/,
  );
  assert.match(
    period3,
    /T03[\s\S]*Route A[\s\S]*Write scripts only[\s\S]*Route B[\s\S]*직접 작성 범위/,
  );
  assert.match(
    period3,
    /T04[\s\S]*Agent 또는 직접 작성[\s\S]*구현 코드[\s\S]*두 C# 파일/,
  );
  assert.match(
    period3,
    /T06[\s\S]*실행 증거[\s\S]*코드 경로 증거[\s\S]*return false[\s\S]*SetActive/,
  );
  assert.doesNotMatch(period3, /meta 파일 변경은 금지|meta와 로그 파일을 바꾸지/);
});

test("week 11 starter pack contains reusable logs without shipping solution code", async () => {
  const starterDirectory = resolve(assetDirectory, "week-11-starter");
  const archivePath = resolve(assetDirectory, "week-11-change-control-starter.zip");
  const archive = await stat(archivePath);
  const readme = await readFile(resolve(starterDirectory, "README.md"), "utf8");
  const changeLog = await readFile(resolve(starterDirectory, "AI_CHANGE_LOG-template.md"), "utf8");
  const testTemplate = await readFile(resolve(starterDirectory, "week11-test-template.csv"), "utf8");

  assert.ok(archive.size > 4_000);
  assert.match(readme, /# Game Engine I 11주차 시작 자료/);
  assert.match(readme, /완성 코드는 포함하지 않습니다/);
  assert.match(readme, /Agent 구현 코드 변경 범위/);
  assert.match(readme, /구현 코드[\s\S]*두 C# 파일/);
  assert.match(readme, /Assets\/Plans[\s\S]*\.meta[\s\S]*Scene/);
  assert.match(readme, /git add -N -- Assets\/Scripts\/TimeBonus\.cs/);
  assert.match(readme, /Week11_TimeBonus[\s\S]*첫 번째 활성 Scene[\s\S]*이전 Scene을 비활성화/);
  assert.match(changeLog, /변경 전 기준 증거/);
  assert.match(changeLog, /예상 diff와 실제 diff/);
  assert.match(changeLog, /수동 Unity 변경/);
  assert.match(changeLog, /코드 구술 준비/);
  assert.equal((testTemplate.match(/^T\d{2},필수/gm) ?? []).length, 8);
  assert.match(testTemplate, /조작 조건,기대 결과,판정,관찰 및 수정 기록/);
  assert.match(testTemplate, /T01[\s\S]*Start→Won→Restart→Start→Lost→Restart/);
  assert.match(testTemplate, /T07[\s\S]*Won→Restart→Start→Lost→Restart/);
  assert.match(testTemplate, /T03[\s\S]*Route A[\s\S]*Route B/);
  assert.match(testTemplate, /T06[\s\S]*실행 증거[\s\S]*코드 경로 증거/);
  assert.match(testTemplate, /T08[\s\S]*Week11_TimeBonus[\s\S]*첫 번째 활성 Scene/);

  const expectedNames = [
    "README.md",
    "AI_CHANGE_LOG-template.md",
    "week11-test-template.csv",
  ];
  const entries = await readZipEntries(archivePath);
  const archiveFiles = [...entries.keys()].filter((name) => !name.endsWith("/"));
  assert.deepEqual(
    archiveFiles.sort(),
    expectedNames.map((name) => `week-11-starter/${name}`).sort(),
  );
  for (const name of expectedNames) {
    const archiveName = `week-11-starter/${name}`;
    assert.deepEqual(entries.get(archiveName), await readFile(resolve(starterDirectory, name)));
  }
});

test("week 11 interactions persist evidence, export safe CSV, and avoid scroll listeners", async () => {
  const [, , , , , , script] = await readWeekEleven();

  for (const pattern of [
    /game-engine-1-week-11-build-v1/,
    /game-engine-1-week-11-tests-v1/,
    /week11_\$\{identityParts\.join\("_"\)\}_test\.csv/,
    /spreadsheetSafe/,
    /URL\.createObjectURL/,
    /IntersectionObserver/,
    /data-week-eleven-toc/,
  ]) {
    assert.match(script, pattern);
  }

  assert.doesNotMatch(script, /window\.addEventListener\(["']scroll/);
});

test("week 11 keeps identity in the current tab and makes destructive resets recoverable", async () => {
  const [, , , , period3, stylesheet, script] = await readWeekEleven();

  assert.match(script, /const testIdentityKey = "game-engine-1-week-11-identity-v1";/);
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

  assert.match(
    period3,
    /data-student-name[^>]*autocomplete="off"|autocomplete="off"[^>]*data-student-name/,
  );
  assert.doesNotMatch(period3, /autocomplete="name"/);

  assert.match(script, /const armReset = \(/);
  assert.match(script, /if \(button\.dataset\.confirming !== "true"\)/);
  assert.match(script, /button\.dataset\.confirming = "true";/);
  assert.match(
    script,
    /const cancelReset = \(\) => \{[\s\S]*?disarm\(\);[\s\S]*?status\.textContent = cancelMessage;/,
  );
  assert.equal((script.match(/cancelMessage:/g) ?? []).length, 2);
  assert.match(
    period3,
    /data-test-progress[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(
    period3,
    /data-build-progress-label[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(
    period3,
    /data-build-status-message[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(
    stylesheet,
    /\[data-confirming="true"\][\s\S]*?--w11-danger-strong[\s\S]*?--w11-danger-soft/,
  );
  assert.match(stylesheet, /\.control-status\s*\{[\s\S]*?font-size:\s*14px;/);

  const declaration = script.match(
    /const armReset = \([\s\S]*?\n  \};\n\n  const buildChecklist/,
  );
  assert.ok(declaration, "armReset should remain behavior-testable");
  let pendingTimeout;
  const fakeWindow = {
    clearTimeout: () => {},
    setTimeout: (callback) => {
      pendingTimeout = callback;
      return 1;
    },
  };
  const armReset = Function(
    "window",
    `${declaration[0].replace(/\n\n  const buildChecklist$/, "")}; return armReset;`,
  )(fakeWindow);
  let click;
  let confirmations = 0;
  const button = {
    dataset: { confirmLabel: "다시 누르기" },
    textContent: "초기화",
    addEventListener: (_event, listener) => {
      click = listener;
    },
  };
  const status = { textContent: "" };
  armReset(button, {
    status,
    confirmMessage: "확인 대기",
    cancelMessage: "취소됨",
    completeMessage: "완료됨",
    onConfirm: () => {
      confirmations += 1;
    },
  });
  click();
  assert.equal(status.textContent, "확인 대기");
  pendingTimeout();
  assert.equal(status.textContent, "취소됨");
  assert.equal(button.textContent, "초기화");
  click();
  click();
  assert.equal(confirmations, 1);
  assert.equal(status.textContent, "완료됨");
});

test("week 11 updates live progress only for result changes and calculates the time contract as pure behavior", async () => {
  const [, , , , , , script] = await readWeekEleven();
  const textHelperSource = script.match(
    /const setTextIfChanged = \(element, nextText\) => \{([\s\S]*?)\n  \};/,
  );
  assert.ok(textHelperSource, "setTextIfChanged helper must remain inspectable");
  const setTextIfChanged = Function(
    `return (element, nextText) => {${textHelperSource[1]}};`,
  )();
  let announcements = 0;
  const output = {
    _text: "0 / 8 PASS",
    get textContent() {
      return this._text;
    },
    set textContent(value) {
      announcements += 1;
      this._text = value;
    },
  };
  assert.equal(setTextIfChanged(output, "0 / 8 PASS"), false);
  assert.equal(announcements, 0);
  assert.equal(setTextIfChanged(output, "1 / 8 PASS"), true);
  assert.equal(announcements, 1);

  const calculatorSource = script.match(
    /const calculateTimeBonus = \(\{ state, currentValue, bonusValue, cap \}\) => \{([\s\S]*?)\n  \};/,
  );
  assert.ok(calculatorSource, "time calculator must remain behavior-testable");
  const calculateTimeBonus = Function(
    `return ({ state, currentValue, bonusValue, cap }) => {${calculatorSource[1]}};`,
  )();
  assert.deepEqual(
    calculateTimeBonus({ state: "Playing", currentValue: 28, bonusValue: 5, cap: 30 }),
    { valid: true, current: 28, accepted: true, result: 30 },
  );
  assert.deepEqual(
    calculateTimeBonus({ state: "Won", currentValue: 20, bonusValue: 5, cap: 30 }),
    { valid: true, current: 20, accepted: false, result: 20 },
  );
  assert.equal(
    calculateTimeBonus({ state: "Playing", currentValue: Number.NaN, bonusValue: 5, cap: 30 }).valid,
    false,
  );

  const numberReaderSource = script.match(
    /const readNumberInput = \(input\) =>([\s\S]*?);\n/,
  );
  assert.ok(numberReaderSource, "number input boundary must remain behavior-testable");
  const readNumberInput = Function(
    "input",
    `return (${numberReaderSource[1]});`,
  );
  assert.ok(
    Number.isNaN(readNumberInput({ value: "", valueAsNumber: 0 })),
    "clearing a number input should stay invalid instead of becoming zero",
  );
  assert.equal(readNumberInput({ value: "28", valueAsNumber: 28 }), 28);

  assert.match(
    script,
    /querySelectorAll\("\[data-test-status\]"\)[\s\S]*?addEventListener\("change", saveTestResult\)/,
  );
  assert.match(
    script,
    /querySelectorAll\("\[data-test-note\]"\)[\s\S]*?addEventListener\("input", persistTests\)/,
  );
  assert.doesNotMatch(script, /querySelectorAll\("select, input"\)/);
});

test("week 11 CSV export neutralizes spreadsheet formula prefixes", async () => {
  const [, , , , , , script] = await readWeekEleven();
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

test("week 11 visual system is responsive, printable, reduced-motion aware, and cobalt-led", async () => {
  const [, , , , , styles] = await readWeekEleven();

  for (const pattern of [
    /--w11-accent: #3f6fae/,
    /min-height: min\(720px, calc\(100dvh - 58px\)\)/,
    /@media \(max-width: 980px\)/,
    /@media \(max-width: 760px\)/,
    /@media \(max-width: 520px\)/,
    /@media \(prefers-color-scheme: dark\)/,
    /@media \(prefers-reduced-transparency: reduce\)/,
    /@media \(prefers-reduced-motion: reduce\)/,
    /@media print/,
    /\.time-contract-lab/,
    /\.diff-add/,
    /\.signal-chain\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/,
    /\.wire-steps\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/,
    /\.exit-ticket-single\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    /@media print[\s\S]*?:is\(\.code-panel, \.equation-strip, \.debug-ladder, \.next-week, \.exit-ticket-single\)[\s\S]*?background:\s*#fff !important;[\s\S]*?color:\s*#000 !important;/,
    /@media print[\s\S]*?:is\(\.starter-download a, \.time-contract-controls input, \.time-contract-controls select\)[\s\S]*?background:\s*#fff !important;[\s\S]*?color:\s*#000 !important;/,
  ]) {
    assert.match(styles, pattern);
  }

  assert.doesNotMatch(styles, /h-screen|window\.addEventListener\(["']scroll/);
});

test("week 11 action, focus, placeholder, success, and danger colors stay readable", async () => {
  const [, , , , , stylesheet] = await readWeekEleven();
  const teachingStyles = await readFile(resolve(root, "assets", "teaching.css"), "utf8");
  const darkModeStart = stylesheet.indexOf("@media (prefers-color-scheme: dark)");
  const darkModeEnd = stylesheet.indexOf(
    "@media (prefers-reduced-transparency: reduce)",
    darkModeStart,
  );
  assert.ok(darkModeStart >= 0 && darkModeEnd > darkModeStart, "dark mode tokens must exist");

  const lightMode = stylesheet.slice(0, darkModeStart);
  const darkMode = stylesheet.slice(darkModeStart, darkModeEnd);
  const codeSurface = readHexToken(lightMode, "--w11-code");
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
    const actionBackground = readHexToken(theme, "--w11-action-bg");
    const actionText = readHexToken(theme, "--w11-action-text");
    assert.ok(
      contrastRatio(actionText, actionBackground) >= 4.5,
      `${actionText} on ${actionBackground} must meet WCAG AA`,
    );
    for (const [foregroundToken, backgroundToken] of [
      ["--w11-success-strong", "--w11-success-soft"],
      ["--w11-danger-strong", "--w11-danger-soft"],
    ]) {
      const foreground = readHexToken(theme, foregroundToken);
      const background = readHexToken(theme, backgroundToken);
      assert.ok(
        contrastRatio(foreground, background) >= 4.5,
        `${foregroundToken} on ${backgroundToken} must meet WCAG AA`,
      );
    }
    const focusRing = readHexToken(theme, "--w11-focus-ring");
    assert.ok(contrastRatio(focusRing, paper) >= 3);
    assert.ok(contrastRatio(focusRing, codeSurface) >= 3);
    const placeholder = readHexToken(theme, "--w11-placeholder");
    assert.ok(contrastRatio(placeholder, paper) >= 4.5);
  }

  assert.match(
    stylesheet,
    /\.hero-action-primary\s*\{[\s\S]*?background:\s*var\(--w11-action-bg\);[\s\S]*?color:\s*var\(--w11-action-text\);[\s\S]*?\}/,
  );
  assert.match(
    stylesheet,
    /\.test-action-primary\s*\{[\s\S]*?background:\s*var\(--w11-action-bg\);[\s\S]*?color:\s*var\(--w11-action-text\);[\s\S]*?\}/,
  );
  assert.match(stylesheet, /tr\[data-result="pass"\][\s\S]*?--w11-success-soft/);
  assert.match(stylesheet, /tr\[data-result="fail"\][\s\S]*?--w11-danger-soft/);
  assert.match(stylesheet, /:focus-visible\s*\{[\s\S]*?outline:\s*3px solid var\(--w11-focus-ring\);/);
  assert.match(
    stylesheet,
    /input::placeholder\s*\{[\s\S]*?color:\s*var\(--w11-placeholder\);[\s\S]*?opacity:\s*1;/,
  );
});

test("week 11 removes decorative metadata and obsolete interaction code", async () => {
  const [, , period1, period2, period3, stylesheet, script] = await readWeekEleven();

  for (const period of [period1, period2, period3]) {
    assert.doesNotMatch(period, /hero-facts|section-index|toc-legend/);
  }
  assert.doesNotMatch(
    stylesheet,
    /\.hero-facts|\.section-index|\.toc-legend|\.ppu-lab|\.sprite-strip|\.clock-|\.component-stack|\.collision-note|\.state-|\.optional-label|\.diff-remove/,
  );
  assert.doesNotMatch(script, /data-ppu-lab|renderPpu|data-sprite-pixels|data-world-size/);
});

test("period 2 gives every instructor copy control adjacent accessible feedback", async () => {
  const [, , , period2, , stylesheet, script] = await readWeekEleven();
  const panels = [
    ...period2.matchAll(
      /<div class="code-panel">([\s\S]*?<p class="copy-status"[\s\S]*?<\/p>)\s*<\/div>/g,
    ),
  ];

  assert.equal(panels.length, 2);
  for (const panel of panels) {
    assert.match(panel[1], /data-copy-code="[^"]+">교수자 시연용 복사<\/button>/);
    assert.match(
      panel[1],
      /data-copy-status[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
    );
  }
  assert.equal((period2.match(/data-copy-status/g) ?? []).length, 2);
  assert.match(script, /button\.closest\("\.code-panel"\)\?\.querySelector\("\[data-copy-status\]"\)/);
  assert.doesNotMatch(script, /document\.querySelector\("\[data-copy-status\]"\)/);
  assert.match(stylesheet, /\.copy-status\[data-kind="success"\]/);
  assert.match(stylesheet, /\.copy-status\[data-kind="error"\]/);
});

test("week 11 keeps student-facing text and mobile test evidence readable", async () => {
  const [, , , , period3, stylesheet] = await readWeekEleven();
  const mobileStart = stylesheet.indexOf("@media (max-width: 760px)", 2_500);
  assert.ok(mobileStart >= 0, "mobile layout rules should exist");
  const mobile = stylesheet.slice(mobileStart);

  assert.match(stylesheet, /\.test-identity\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(stylesheet, /\/\* Student readability \*\/[\s\S]*?font-size:\s*14px;/);
  assert.match(stylesheet, /\.code-panel pre\s*\{[\s\S]*?font-size:\s*13px;/);
  assert.match(stylesheet, /:is\(input, select, button\)[\s\S]*?min-height:\s*44px;[\s\S]*?font-size:\s*14px;/);
  assert.doesNotMatch(
    stylesheet,
    /(?:font-size:\s*|font:\s*\d+\s+)(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\b/,
  );
  assert.match(stylesheet, /@media \(max-width: 980px\)[\s\S]*?\[id\][\s\S]*?scroll-margin-top:\s*146px;/);
  assert.match(mobile, /\.test-table thead\s*\{[\s\S]*?display:\s*none;/);
  assert.match(mobile, /\.test-table tr\s*\{[\s\S]*?display:\s*grid;/);
  assert.match(mobile, /\.test-table td::before\s*\{[\s\S]*?content:\s*attr\(data-label\);/);
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\)[\s\S]*?\.equation-strip strong\s*\{[\s\S]*?font-size:\s*12px;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\)[\s\S]*?\.code-panel pre\s*\{[\s\S]*?font-size:\s*13px;/,
  );
  assert.equal((period3.match(/<td data-label=/g) ?? []).length, 32);
  assert.match(stylesheet, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(stylesheet, /:is\([^}]*button[^}]*\):active[\s\S]*?transform:\s*scale\(0\.97\);/);
});

test("week 11 pages keep source links safe and visible copy free of forbidden dash glyphs", async () => {
  const [, , period1, period2, period3] = await readWeekEleven();

  assert.match(
    period1,
    /https:\/\/docs\.unity3d\.com\/Packages\/com\.unity\.ai\.assistant@2\.10\/manual\/about\/assistant-plan-mode\.html/,
  );
  assert.match(
    period1,
    /https:\/\/docs\.unity3d\.com\/6000\.6\/Documentation\/Manual\/AssetMetadata\.html/,
  );

  for (const period of [period2, period3]) {
    assert.match(
      period,
      /https:\/\/docs\.unity3d\.com\/6000\.6\/Documentation\/ScriptReference\/Component\.CompareTag\.html/,
    );
    assert.match(
      period,
      /https:\/\/docs\.unity3d\.com\/6000\.6\/Documentation\/Manual\/build-profile-scene-list\.html/,
    );
  }

  for (const [index, html] of [period1, period2, period3].entries()) {
    const externalLinks = [...html.matchAll(/<a\b[^>]*href="https:\/\/[^\"]+"[^>]*>/g)];
    assert.ok(externalLinks.length >= 4, `period ${index + 1} needs primary sources`);
    for (const link of externalLinks) {
      assert.match(link[0], /target="_blank"/);
      assert.match(link[0], /rel="noopener noreferrer"/);
    }
    assert.doesNotMatch(html, /[—–]/, `period ${index + 1} contains a forbidden dash glyph`);
  }
});
