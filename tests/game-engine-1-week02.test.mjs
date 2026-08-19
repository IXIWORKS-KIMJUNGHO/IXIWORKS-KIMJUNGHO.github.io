import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");

test("Game Engine I week 2 builds and verifies the first reusable 2D scene", async () => {
  const [courseIndex, lesson, stylesheet, script] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-02-foundations.html"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-02-foundations.css"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-02-foundations.js"), "utf8"),
  ]);

  assert.match(courseIndex, /href="week-02-foundations\.html"/);
  assert.match(courseIndex, /교수자용 전체 운영안/);
  assert.doesNotMatch(
    lesson,
    /rel="(?:prev|next)"/,
    "the instructor guide should not sit inside the student lesson sequence",
  );

  for (const requiredText of [
    "첫 2D 프로젝트와 Unity 기본 구조",
    "Week02_Playground Scene 검증 완료",
    "C# Script와 2D 물리는 아직 추가하지 않습니다.",
    "Project, Scene, GameObject, Component",
    "Scene, Game, Hierarchy, Inspector, Project",
    "Transform과 부모-자식 관계",
    "Sorting Layer와 Order in Layer",
    "Prefab Asset과 Instance",
    "GE1_Week02",
    "Universal 2D",
    "Console의 빨간 오류가 0개",
  ]) {
    assert.ok(lesson.includes(requiredText), `missing week 2 text: ${requiredText}`);
  }

  assert.equal(
    [...lesson.matchAll(/data-lab-check-id=/g)].length,
    8,
    "the playground mission should have eight completion checks",
  );

  for (const officialUrl of [
    "https://docs.unity.com/en-us/hub/project-create",
    "https://docs.unity3d.com/kr/current/Manual/unity-editor.html",
    "https://docs.unity3d.com/kr/current/Manual/GameObjects.html",
    "https://docs.unity3d.com/kr/current/Manual/Components.html",
    "https://docs.unity3d.com/kr/current/Manual/class-Transform.html",
    "https://docs.unity3d.com/kr/current/Manual/scenes-working-with.html",
    "https://docs.unity3d.com/kr/current/Manual/2d-renderer-sorting.html",
    "https://docs.unity3d.com/kr/current/Manual/CreatingPrefabs.html",
  ]) {
    assert.ok(lesson.includes(officialUrl), `missing official source: ${officialUrl}`);
  }

  assert.match(stylesheet, /@media \(max-width: 760px\)/);
  assert.match(stylesheet, /@media \(prefers-color-scheme: dark\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-transparency: reduce\)/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /localStorage/);
  assert.doesNotMatch(script, /addEventListener\(["']scroll["']/);

  for (const source of [lesson, stylesheet, script]) {
    assert.doesNotMatch(source, /[—–]/, "week 2 files should not contain em or en dashes");
  }

  const hero = await stat(
    resolve(courseDirectory, "assets", "week-02-modular-scene.webp"),
  );
  assert.ok(hero.size > 75_000, "the generated modular scene image should be present");
});

test("Game Engine I week 2 separates teacher-led periods from the student mission", async () => {
  const pageNames = [
    "week-02-period1.html",
    "week-02-period2.html",
    "week-02-period3.html",
  ];
  const [courseIndex, period1, period2, period3, stylesheet, script] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    ...pageNames.map((name) => readFile(resolve(courseDirectory, name), "utf8")),
    readFile(resolve(courseDirectory, "assets", "week-02-lessons.css"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-02-lessons.js"), "utf8"),
  ]);

  for (const pageName of pageNames) {
    assert.ok(courseIndex.includes(`href="${pageName}"`), `missing index link: ${pageName}`);
  }

  for (const page of [period1, period2, period3]) {
    assert.match(
      page,
      /<details class="mobile-section-nav"/,
      "each period should keep its section navigation available on small screens",
    );
  }

  assert.match(
    period1,
    /href="\.\/#week-02" rel="prev"/,
    "period 1 should return to the week index instead of the instructor guide",
  );
  assert.match(
    period3,
    /href="week-03-period1\.html" rel="next"/,
    "the student sequence should continue directly to week 3",
  );

  for (const requiredText of [
    "Unity Editor를 읽는 법",
    "교수자 설명",
    "Project &gt; Scene &gt; GameObject &gt; Component",
    "Scene은 만든다. Game은 확인한다.",
    "Hierarchy에서 고르면 Scene의 대상",
    "8분 시연으로 모든 창을 한 번 연결합니다",
  ]) {
    assert.ok(period1.includes(requiredText), `missing period 1 text: ${requiredText}`);
  }

  for (const requiredText of [
    "장면을 조립하고 재사용하는 법",
    "교수자 설명과 시연",
    "부모와 자식은 이동의 기준을 공유합니다",
    "Sorting Layer와 Order in Layer",
    "Prefab은 복제본이 아니라 연결된 원본입니다",
    "3교시에는 순서표를 따라 하지 않고",
  ]) {
    assert.ok(period2.includes(requiredText), `missing period 2 text: ${requiredText}`);
  }

  for (const requiredText of [
    "작은 Playground를 완성하라",
    "정해진 클릭 순서 없이 목표, 제약과 통과 기준",
    "같은 배치가 아니라 같은 구조와 검증 상태",
    "C# Script, Rigidbody2D, Collider2D",
    "Week02_Playground.unity",
    "Collectible.prefab",
    "Console의 빨간 오류가 0개",
    "막혔을 때만 필요한 힌트를 엽니다",
  ]) {
    assert.ok(period3.includes(requiredText), `missing period 3 text: ${requiredText}`);
  }

  assert.equal(
    [...period3.matchAll(/data-mission-check=/g)].length,
    8,
    "the student mission should have eight evidence-based pass checks",
  );
  assert.equal(
    [...period3.matchAll(/<details\b/g)].length,
    8,
    "the mobile section navigation and seven troubleshooting hints should use disclosures",
  );

  assert.equal(
    [...period3.matchAll(/<img src="assets\/week-02-period3-playground-goal\.webp"/g)].length,
    1,
    "the generated mission image should not repeat inside the same lesson",
  );

  assert.match(stylesheet, /@media \(max-width: 760px\)/);
  assert.match(stylesheet, /@media \(prefers-color-scheme: dark\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-transparency: reduce\)/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /localStorage/);
  assert.match(script, /이 브라우저에서는 저장할 수 없습니다/);
  assert.doesNotMatch(script, /addEventListener\(["']scroll["']/);
  assert.match(stylesheet, /\.mobile-section-nav/);
  assert.match(stylesheet, /:active/);
  assert.doesNotMatch(
    stylesheet,
    /font-size:\s*(?:9(?:\.5)?|10(?:\.5)?)px|font:\s*[^;\n]*\s(?:9(?:\.5)?|10(?:\.5)?)px/,
    "student-facing labels should remain at least 11px",
  );
  assert.doesNotMatch(stylesheet, /\[data-reveal\]/);

  for (const page of [period1, period2, period3]) {
    assert.doesNotMatch(page, /data-reveal/, "long lesson sections should render immediately");
  }

  for (const source of [period1, period2, period3, stylesheet, script]) {
    assert.doesNotMatch(source, /[—–]/, "week 2 period files should not contain em or en dashes");
  }

  for (const [page, imageName] of [
    [period1, "week-02-period1-editor-model.webp"],
    [period2, "week-02-period2-scene-system.webp"],
    [period3, "week-02-period3-playground-goal.webp"],
  ]) {
    assert.ok(page.includes(imageName), `missing generated WebP reference: ${imageName}`);
    assert.match(page, /type="image\/webp"/);
    const image = await stat(resolve(courseDirectory, "assets", imageName));
    assert.ok(image.size > 90_000, `generated image is unexpectedly small: ${imageName}`);
  }
});
