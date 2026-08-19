import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { stat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "game-engine-1");

test("Game Engine I week 1 stops after installing Unity", async () => {
  const [courseIndex, orientation, stylesheet, script, siteConfig, sitemap] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-01-ot.html"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-01-ot.css"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-01-ot.js"), "utf8"),
    readFile(resolve(root, "scripts", "site-config.mjs"), "utf8"),
    readFile(resolve(root, "sitemap.xml"), "utf8"),
  ]);

  assert.match(courseIndex, /href="week-01-ot\.html"/);
  assert.match(courseIndex, /Unity Hub 설치, 로그인과 라이선스 확인/);

  for (const requiredText of [
    "오늘의 종료선",
    "Unity 6.3 LTS 설치 완료",
    "프로젝트 생성, Scene 저장, Play Mode는 오늘 진행하지 않습니다.",
    "Projects → New project를 누르지 않습니다",
    "Unity Hub 안정 버전을 설치합니다",
    "라이선스가 활성 상태인지 확인합니다",
    "다운로드 완료와 전체 버전을 검증합니다",
  ]) {
    assert.ok(orientation.includes(requiredText), `missing week 1 text: ${requiredText}`);
  }

  assert.equal(
    [...orientation.matchAll(/class="install-check"/g)].length,
    6,
    "the installation checklist should have six completion checks",
  );

  for (const officialUrl of [
    "https://unity.com/download",
    "https://docs.unity.com/en-us/hub/install-hub",
    "https://docs.unity.com/en-us/hub/add-editor",
    "https://docs.unity.com/en-us/hub/manage-license",
    "https://unity.com/releases/unity-6/support",
    "https://unity.com/releases/editor/archive",
  ]) {
    assert.ok(orientation.includes(officialUrl), `missing official source: ${officialUrl}`);
  }

  assert.match(stylesheet, /@media \(max-width: 760px\)/);
  assert.match(stylesheet, /@media \(prefers-color-scheme: dark\)/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /localStorage/);
  assert.match(orientation, /href="\.\/#week-02" rel="next"/);
  assert.doesNotMatch(orientation, /href="week-02-foundations\.html"/);
  assert.match(
    siteConfig,
    /"teaching\/game-engine-1\/week-01-ot\.html"[\s\S]*?week-01-blockout-to-game\.webp/,
  );
  assert.match(
    sitemap,
    /https:\/\/creativeengineer-kimjungho\.com\/teaching\/game-engine-1\/week-01-ot\.html/,
  );

  const hero = await stat(
    resolve(courseDirectory, "assets", "week-01-blockout-to-game.webp"),
  );
  assert.ok(hero.size > 100_000, "the generated course vision image should be present");
});

test("Game Engine I week 1 navigation stays stable through the teaching build", () => {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "scripts", "refresh-teaching-navigation.mjs"),
      "--check",
      "--course",
      "game-engine-1",
      "--documents",
      "week-01-ot.html",
    ],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /0 document shell changes required/);
});

test("Game Engine I week 1 follows the classroom installation chronology", async () => {
  const orientation = await readFile(
    resolve(courseDirectory, "week-01-ot.html"),
    "utf8",
  );

  const installIndex = orientation.indexOf('id="install"');
  const modulesIndex = orientation.indexOf('data-check-id="modules"');
  const policyIndex = orientation.indexOf('id="ai-policy"');
  const completeIndex = orientation.indexOf('data-check-id="complete"');

  assert.ok(installIndex > -1, "the installation section should exist");
  assert.ok(modulesIndex > installIndex, "module selection should be inside installation");
  assert.ok(
    policyIndex > modulesIndex,
    "AI policy should be taught after the Editor download starts",
  );
  assert.ok(
    completeIndex > policyIndex,
    "installation verification should resume after the AI policy lesson",
  );

  const navigation = orientation.match(
    /<nav class="toc ot-toc"[\s\S]*?data-orientation-toc>[\s\S]*?<\/nav>/,
  )?.[0];
  assert.ok(navigation, "the orientation navigation should exist");

  const navigationTargets = [...navigation.matchAll(/href="#([^"]+)"/g)].map(
    ([, target]) => target,
  );
  assert.deepEqual(navigationTargets, [
    "goals",
    "agenda",
    "engine",
    "semester",
    "install",
    "ai-policy",
    "troubleshooting",
    "wrap-up",
  ]);
});

test("Game Engine I week 1 uses a generated visual and readable responsive UI", async () => {
  const [orientation, stylesheet, generationLog] = await Promise.all([
    readFile(resolve(courseDirectory, "week-01-ot.html"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-01-ot.css"), "utf8"),
    readFile(
      resolve(courseDirectory, "research", "week-01-visual-generation-log.md"),
      "utf8",
    ),
  ]);

  assert.match(orientation, /assets\/week-01-ai-selection-to-verification\.webp/);
  assert.doesNotMatch(orientation, /unity-2d-ai-pipeline\.svg/);
  assert.doesNotMatch(orientation, /[\u2013\u2014]/, "visible copy should not use en or em dashes");

  assert.doesNotMatch(
    stylesheet,
    /font-size:\s*(?:9\.5|10)px/,
    "teaching labels should not fall below 11px",
  );
  assert.match(
    stylesheet,
    /transition:[^;]*background-color 150ms ease[^;]*color 150ms ease/,
  );
  assert.match(
    stylesheet,
    /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.hero-action:hover[\s\S]*?\.hero-action-primary:hover[\s\S]*?\.install-progress button:hover/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 980px\) \{[\s\S]*?\.install-progress \{[\s\S]*?position:\s*static;[\s\S]*?top:\s*auto;/,
  );
  assert.match(
    stylesheet,
    /\.lesson-breadcrumb,[\s\S]*?\.lesson-sequence a,[\s\S]*?\.ot-hero \.eyebrow,[\s\S]*?\.ot-toc \.toc-title \{[\s\S]*?font-size:\s*var\(--ot-label-size\);/,
  );
  assert.match(generationLog, /exec-b91f16f3-c3d8-4949-b4e8-496c79d37ca4\.png/);
  assert.match(generationLog, /week-01-blockout-to-game\.webp/);

  const generatedVisual = await stat(
    resolve(courseDirectory, "assets", "week-01-ai-selection-to-verification.webp"),
  );
  assert.ok(generatedVisual.size > 80_000, "the generated AI workflow visual should be present");
});
