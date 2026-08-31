import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

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

const readWeekSix = async () =>
  Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-05-period3.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-06-period1.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-06-period2.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-06-period3.html"), "utf8"),
    readFile(resolve(assetDirectory, "week-06.css"), "utf8"),
    readFile(resolve(assetDirectory, "week-06.js"), "utf8"),
    readFile(resolve(assetDirectory, "week-06-storage.js"), "utf8"),
  ]);

test("Game Engine I week 6 is published as three connected periods", async () => {
  const [courseIndex, previousLesson, period1, period2, period3] = await readWeekSix();
  const siteConfig = await readFile(resolve(root, "scripts", "site-config.mjs"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-06-period${period}\\.html"`));
    assert.match(
      siteConfig,
      new RegExp(`teaching/game-engine-1/week-06-period${period}\\.html`),
    );
    assert.match(siteConfig, new RegExp(`week-06-period${period}-hero\\.webp`));
    assert.match(sitemap, new RegExp(`teaching/game-engine-1/week-06-period${period}\\.html`));

    const hero = await stat(resolve(assetDirectory, `week-06-period${period}-hero.webp`));
    assert.ok(hero.size > 100_000, `period ${period} generated hero should be present`);
  }

  assert.match(previousLesson, /href="week-06-period1\.html" rel="next"/);
  assert.match(period1, /href="week-05-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-06-period2\.html" rel="next"/);
  assert.match(period2, /href="week-06-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-06-period3\.html" rel="next"/);
  assert.match(period3, /href="week-06-period2\.html" rel="prev"/);
});

test("week 6 documents have balanced HTML, unique IDs, and valid local fragments", async () => {
  const [, , period1, period2, period3] = await readWeekSix();
  validateStructure(period1, "period 1");
  validateStructure(period2, "period 2");
  validateStructure(period3, "period 3");
});

test("periods 1 and 2 are professor-led while period 3 is goal-oriented individual work", async () => {
  const [, , period1, period2, period3] = await readWeekSix();

  for (const [period, expected] of [
    [period1, "교수자 설명 중심"],
    [period2, "교수자 설명과 실시간 완성 시연"],
  ]) {
    assert.ok(period.includes(expected));
    assert.ok(period.includes("학생은 프로젝트를 제작하지 않습니다"));
    assert.doesNotMatch(period, /data-test-table|data-build-checklist/);
    assert.doesNotMatch(period, /짝 활동|조별 활동|실습\(2시간\)/);
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
});

test("period 1 explains the complete sprite-to-clip pipeline in beginner language", async () => {
  const [, , period1] = await readWeekSix();

  for (const sectionId of [
    "arrival",
    "run",
    "bridge",
    "pipeline",
    "import",
    "slicing",
    "clip",
    "diagnose",
    "check",
    "references",
  ]) {
    assert.match(period1, new RegExp(`id="${sectionId}"`));
  }

  for (const requiredText of [
    "Texture, Sprite Sheet, Sprite, Animation Clip",
    "Sprite Mode",
    "Pixels Per Unit",
    "Filter Mode",
    "Grid by Cell Size",
    "Pivot",
    "Loop Time",
    "프레임 수",
    "Samples",
    "6 ÷ 12 = 0.5",
  ]) {
    assert.ok(period1.includes(requiredText), `period 1 missing: ${requiredText}`);
  }

  assert.match(period1, /assets\/week-06-period1-hero\.webp/);
  assert.match(period1, /00-06[\s\S]*53-60/);
});

test("period 2 connects Animator, presentation code, and Cinemachine 3.1", async () => {
  const [, , , period2] = await readWeekSix();

  for (const pattern of [
    /Player 루트[\s\S]*Visual 자식/,
    /Rigidbody2D, Collider2D, PlayerController/,
    /SpriteRenderer, Animator/,
    /Speed Greater 0\.01/,
    /Speed Less 0\.01/,
    /Has Exit Time[\s\S]*Off/,
    /Animator\.StringToHash\("Speed"\)/,
    /animator\.SetFloat\(SpeedId, moveInput\.sqrMagnitude\);/,
    /spriteRenderer\.flipX = moveInput\.x &lt; 0f;/,
    /Cinemachine 3\.1/,
    /Position Composer/,
    /Dead Zone/,
    /Damping/,
    /Cinemachine Confiner 2D/,
    /PolygonCollider2D/,
    /화면 전체를 경계 안에/,
  ]) {
    assert.match(period2, pattern);
  }

  for (const sectionId of [
    "architecture",
    "animator",
    "code",
    "camera",
    "confiner",
    "demo",
    "mistakes",
    "check",
  ]) {
    assert.match(period2, new RegExp(`id="${sectionId}"`));
  }

  assert.match(period2, /assets\/week-06-period2-hero\.webp/);
  assert.match(period2, /00-06[\s\S]*52-60/);
});

test("period 3 has eight measurable gates, persistent records, and motion evidence", async () => {
  const [, , , , period3, stylesheet, script, storageHelper] = await readWeekSix();

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
    /role="region" aria-label="6주차 애니메이션과 카메라 테스트표" tabindex="0"/,
    /data-test-status-message role="status" aria-live="polite"/,
    /Player_Idle\.anim/,
    /Player_Move\.anim/,
    /week06_학번_이름_demo\.mp4/,
    /week06_학번_이름_test\.csv/,
    /레벨의 왼쪽, 오른쪽, 위와 아래 끝/,
    /assets\/week-06-period3-hero\.webp/,
  ]) {
    assert.match(period3, pattern);
  }

  for (const pattern of [
    /game-engine-1-week-06-build-v1/,
    /game-engine-1-week-06-tests-v1/,
    /new Blob/,
    /text\/csv;charset=utf-8/,
    /week06_\$\{identityParts\.join\("_"\)\}_test\.csv/,
    /spreadsheetSafe/,
    /navigator\.clipboard/,
    /IntersectionObserver/,
  ]) {
    assert.match(script, pattern);
  }

  assert.match(storageHelper, /localStorage/);

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

test("week 6 lesson shell stays calm, legible, and input-aware", async () => {
  const [, , period1, period2, period3, stylesheet, script, storageHelper] =
    await readWeekSix();

  for (const page of [period1, period2, period3]) {
    assert.match(page, /href="assets\/week-06\.css\?v=ge1w6-2"/);
    assert.match(page, /src="assets\/week-06-storage\.js\?v=ge1w6-2" defer/);
    assert.match(page, /src="assets\/week-06\.js\?v=ge1w6-2" defer/);
    assert.match(page, /data-week-six-toc-disclosure/);
    assert.equal(
      [...page.matchAll(/class="eyebrow"/g)].length,
      1,
      "each lesson should use one orientation label in the hero",
    );
    assert.doesNotMatch(page, /class="section-index"/);
    assert.doesNotMatch(page, /[—–]/);
  }

  assert.match(period3, /data-build-storage-status role="status" aria-live="polite"/);
  assert.match(
    stylesheet,
    /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.hero-action:hover/,
  );
  assert.match(stylesheet, /:active:not\(:focus-visible\)[^{]*\{[\s\S]*?scale\(0\.97\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-transparency: reduce\)/);
  assert.match(
    stylesheet,
    /@media \(max-width: 520px\) \{[\s\S]*?\.week-six-toc ol[\s\S]*?grid-template-columns: 1fr/,
  );
  assert.doesNotMatch(stylesheet, /transition\s*:\s*all/i);
  assert.doesNotMatch(
    stylesheet,
    /font-size:\s*(?:[0-9](?:\.[0-9]+)?|10(?:\.0+)?)px/,
    "student-facing labels should remain at least 11px",
  );
  assert.ok(
    stylesheet.lastIndexOf("@media (prefers-reduced-motion: reduce)") >
      stylesheet.lastIndexOf("transform: scale(0.97)"),
    "the final reduced-motion override should win the interaction cascade",
  );

  for (const source of [stylesheet, script, storageHelper]) {
    assert.doesNotMatch(source, /[—–]/);
  }
});

test("week 6 reports browser storage success and failure", async () => {
  const helper = await readFile(resolve(assetDirectory, "week-06-storage.js"), "utf8");
  const context = {};
  vm.runInNewContext(helper, context);

  const storageApi = context.GameEngineWeek6Storage;
  const values = new Map();
  const workingStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };

  assert.equal(storageApi.getBrowserStorage({ localStorage: workingStorage }), workingStorage);
  assert.equal(storageApi.writeJsonStorage(workingStorage, "week-06:test", { pass: true }), true);
  assert.equal(values.get("week-06:test"), '{"pass":true}');

  const loaded = storageApi.readJsonStorage(workingStorage, "week-06:test", {});
  assert.equal(loaded.state, "loaded");
  assert.equal(loaded.value.pass, true);
  assert.equal(storageApi.removeStorage(workingStorage, "week-06:test"), true);
  assert.equal(values.has("week-06:test"), false);

  const failingStorage = {
    getItem() {
      throw new Error("storage unreadable");
    },
    setItem() {
      throw new Error("storage unavailable");
    },
    removeItem() {
      throw new Error("storage unavailable");
    },
  };
  assert.equal(storageApi.readJsonStorage(failingStorage, "week-06:test", []).state, "error");
  assert.equal(storageApi.writeJsonStorage(failingStorage, "week-06:test", {}), false);
  assert.equal(storageApi.removeStorage(failingStorage, "week-06:test"), false);

  const successStatus = { dataset: {}, textContent: "" };
  storageApi.reportStorageResult(successStatus, true, "저장 완료", "저장 실패");
  assert.equal(successStatus.dataset.state, "saved");
  assert.equal(successStatus.textContent, "저장 완료");

  const failureStatus = { dataset: {}, textContent: "" };
  storageApi.reportStorageResult(failureStatus, false, "저장 완료", "저장 실패");
  assert.equal(failureStatus.dataset.state, "error");
  assert.equal(failureStatus.textContent, "저장 실패");
});

test("the three periods cite version-matched Unity primary sources", async () => {
  const [, , period1, period2, period3] = await readWeekSix();
  const combined = `${period1}\n${period2}\n${period3}`;

  for (const officialUrl of [
    "https://docs.unity3d.com/6000.3/Documentation/Manual/texture-type-sprite.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/sprite/sprite-editor/use-editor.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/animeditor-CreatingANewAnimationClip.html",
    "https://docs.unity3d.com/6000.3/Documentation/Manual/class-Transition.html",
    "https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Animator.SetFloat.html",
    "https://docs.unity3d.com/6000.3/Documentation/ScriptReference/SpriteRenderer-flipX.html",
    "https://docs.unity.cn/Packages/com.unity.cinemachine@3.1/manual/setup-follow-camera.html",
    "https://docs.unity.cn/Packages/com.unity.cinemachine@3.1/manual/CinemachinePositionComposer.html",
    "https://docs.unity.cn/Packages/com.unity.cinemachine@3.1/manual/CinemachineConfiner2D.html",
  ]) {
    assert.ok(combined.includes(officialUrl), `missing official Unity source: ${officialUrl}`);
  }
});
