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
  assert.match(courseIndex, /Unity Hub, CLI, MCP 설치/);

  for (const requiredText of [
    "오늘의 종료선",
    "Unity 6.6 설치 완료",
    "프로젝트 생성과 Scene 저장, Play Mode 실행은 오늘 진행하지 않습니다.",
    "Projects → New project를 누르지 않습니다",
    "Unity Hub 안정 버전을 설치합니다",
    "Unity CLI를 따로 설치합니다",
    "Unity CLI MCP를 연결합니다",
    "라이선스가 활성 상태인지 확인합니다",
    "다운로드 완료와 전체 버전을 검증합니다",
  ]) {
    assert.ok(orientation.includes(requiredText), `missing week 1 text: ${requiredText}`);
  }

  assert.equal(
    [...orientation.matchAll(/class="install-check"/g)].length,
    8,
    "the installation checklist should have eight completion checks",
  );

  for (const officialUrl of [
    "https://unity.com/download",
    "https://docs.unity.com/en-us/hub/install-hub",
    "https://docs.unity.com/en-us/hub/add-editor",
    "https://docs.unity.com/en-us/hub/manage-license",
    "https://unity.com/releases/unity-6/support",
    "https://unity.com/releases/editor/archive",
    "https://docs.unity.com/en-us/unity-cli/unity-cli",
    "https://docs.unity.com/en-us/unity-cli/use-unity-cli",
    "https://docs.unity.com/en-us/unity-cli/unity-cli-reference",
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
    "diagnostic",
    "engine",
    "semester",
    "operation",
    "assessment",
    "install",
    "ai-policy",
    "troubleshooting",
    "wrap-up",
  ]);
  assert.doesNotMatch(orientation, /id="agenda"|180분의 흐름/);
  assert.doesNotMatch(orientation, /install-step-time|85-100분|125-165분/);
  assert.doesNotMatch(orientation, /이론 1시간|실습 2시간/);
  assert.match(orientation, /1교시와 2교시는 각각 <mark>45분 이론 수업 뒤 15분 휴식<\/mark>/);
  assert.match(orientation, /1·2교시는 이론/);
  assert.match(orientation, /3교시는 실습/);
  assert.match(orientation, /출결<\/th><td><mark>10%<\/mark>/);
  assert.match(orientation, /참여도·태도<\/th><td><mark>10%<\/mark>/);
  assert.match(orientation, /중간고사<\/th><td><mark>20%<\/mark>/);
  assert.match(orientation, /과제<\/th><td><mark>20%<\/mark>/);
  assert.match(orientation, /기말 프로젝트<\/th><td><mark>40%<\/mark>/);
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
    /@media \(max-width: 980px\) \{[\s\S]*?main\.layout \{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 980px\) \{[\s\S]*?\.install-progress \{[\s\S]*?position:\s*static;[\s\S]*?top:\s*auto;/,
  );
  assert.match(
    stylesheet,
    /\.lesson-breadcrumb,[\s\S]*?\.lesson-sequence a,[\s\S]*?\.ot-hero \.eyebrow,[\s\S]*?\.ot-toc \.toc-title \{[\s\S]*?font-size:\s*var\(--ot-label-size\);/,
  );
  assert.match(
    stylesheet,
    /game-engine-ot mark\s*\{[^}]*background:\s*#ffe34a[^}]*color:\s*#0d110e/s,
  );
  assert.match(stylesheet, /box-decoration-break:\s*clone/);
  assert.ok(
    (orientation.match(/<mark>/g) || []).length >= 25,
    "orientation should highlight lecture takeaways across the page",
  );
  assert.match(generationLog, /exec-b91f16f3-c3d8-4949-b4e8-496c79d37ca4\.png/);
  assert.match(generationLog, /week-01-blockout-to-game\.webp/);

  const generatedVisual = await stat(
    resolve(courseDirectory, "assets", "week-01-ai-selection-to-verification.webp"),
  );
  assert.ok(generatedVisual.size > 80_000, "the generated AI workflow visual should be present");
});

test("Game Engine I week 1 uses CLI from day one and surveys subscription AI on paper", async () => {
  const [courseIndex, orientation, stylesheet, script] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(courseDirectory, "week-01-ot.html"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-01-ot.css"), "utf8"),
    readFile(resolve(courseDirectory, "assets", "week-01-ot.js"), "utf8"),
  ]);

  assert.match(orientation, /assets\/week-01-ot\.css\?v=ge1ot22/);
  assert.match(orientation, /assets\/week-01-ot\.js\?v=ge1ot18/);
  assert.match(orientation, /현재 사용하는 <mark>AI 도구<\/mark>/);
  assert.match(orientation, /구독 여부는 평가에 반영하지 않습니다/);
  assert.match(orientation, /종이에만 기록/);
  assert.match(orientation, /ChatGPT/);
  assert.match(orientation, /Claude/);
  assert.match(orientation, /GitHub Copilot/);
  assert.match(orientation, /Cursor/);
  assert.match(orientation, /Gemini/);
  assert.match(orientation, /Unity AI/);
  assert.match(orientation, /구독 중/);
  assert.match(orientation, /Unity CLI는 실험 단계의 도구입니다/);
  assert.match(orientation, /Hub와 별도로 설치하는 독립 실행 파일/);
  assert.match(orientation, /Unity CLI를 따로 설치합니다/);
  assert.doesNotMatch(orientation, /자동으로 함께 설치/);
  assert.match(orientation, /hub\/prod\/cli\/install\.sh/);
  assert.match(orientation, /hub\/prod\/cli\/install\.ps1/);
  assert.match(orientation, /unity --version/);
  assert.match(orientation, /unity --help/);
  assert.match(orientation, /unity doctor/);
  assert.match(orientation, /winget install Unity\.CLI/);
  assert.match(orientation, /brew install --cask unity-cli/);
  assert.match(orientation, /UNITY_CLI_CHANNEL=beta/);
  assert.match(orientation, /unity auth login/);
  assert.match(orientation, /unity auth status/);
  assert.match(orientation, /unity license/);
  assert.match(orientation, /unity install/);
  assert.match(orientation, /unity editors -i --format json/);
  assert.match(orientation, /https:\/\/docs\.unity\.com\/en-us\/unity-cli/);
  assert.match(orientation, /AI를 활용해 작은 2D 게임을 만듭니다/);
  assert.match(orientation, /Unity CLI와 MCP는 1주차부터/);
  assert.match(orientation, /실행 중인 Editor를 제어하는 Unity Pipeline 패키지/);
  assert.match(orientation, /1주차 제작 환경도 완료됩니다/);
  assert.match(orientation, /unity mcp configure/);
  assert.match(orientation, /회색 블록아웃으로 게임을 만듭니다/);
  assert.match(orientation, /그림과 소리를 붙입니다/);
  assert.match(orientation, /CLI, MCP, 대화형 AI는 설명과 초안, 오류 해석에 함께 쓰되/);
  assert.doesNotMatch(orientation, /AI를 제한적으로 씁니다/);
  assert.doesNotMatch(orientation, /AI Agent 없이/);
  assert.doesNotMatch(orientation, /Agent 없이 회색/);
  assert.doesNotMatch(orientation, /Agent는 사용하지 않습니다/);
  assert.doesNotMatch(orientation, /Agent는 <mark>금지/);
  assert.match(orientation, /<code>unity open<\/code> 명령과 Hub의 <code>New project<\/code>/);
  assert.match(courseIndex, /Unity Hub, CLI, MCP 설치/);
  assert.match(courseIndex, /지정 6\.6 검증/);
  assert.doesNotMatch(courseIndex, /이론\(1시간\)|실습\(2시간\)/);
  assert.match(stylesheet, /\.subscription-scale\s*\{/);
  assert.match(stylesheet, /\.semester-trail\s*\{/);
  assert.match(stylesheet, /\.cli-split\s*\{/);
  assert.match(stylesheet, /\.cli-install-grid\s*\{/);
  assert.match(orientation, /파이썬이나 HTML로도 게임을 만들 수 있습니다/);
  assert.match(orientation, /바이브코딩이 잘하는 일/);
  assert.match(orientation, /게임 엔진이 맡는 일/);
  assert.match(orientation, /Component 형태로 이미 마련되어 있습니다/);
  assert.match(orientation, /Physics 2D · Collider/);
  assert.match(orientation, /게임의 반복 구조를 안정적으로 유지/);
  assert.match(orientation, /작은 프로젝트에 집중합니다/);
  assert.match(orientation, /한 프로젝트에서 여러 기기로 빌드합니다/);
  assert.match(orientation, /Windows, macOS, Android, iOS, Web용 빌드/);
  assert.match(orientation, /이 수업에서는 데스크톱 빌드까지 다룹니다/);
  assert.match(orientation, /https:\/\/docs\.unity3d\.com\/6000\.6\/Documentation\/Manual\/build-profiles\.html/);
  assert.match(orientation, /작은 팀이 쓰는 엔진입니다/);
  assert.match(orientation, /소규모 팀이 만든 짧은 게임/);
  assert.match(orientation, /Unity Personal을 무료로 사용할 수 있습니다/);
  assert.match(orientation, /20만 달러 미만/);
  assert.match(orientation, /이 수업에서 만드는 짧은 2D 게임도 이와 비슷한 규모입니다/);
  assert.match(orientation, /https:\/\/unity\.com\/products\/unity-personal/);
  assert.match(orientation, /AI는 엔진을 대신하지 않습니다/);
  assert.match(orientation, /Unity와 AI로 만드는 2D 게임/);
  assert.doesNotMatch(orientation, /3-5분 안에 완결되는 2D 게임/);
  assert.match(orientation, /https:\/\/unity\.com\/blog\/2026-unity-game-development-report-trends/);
  assert.match(stylesheet, /\.vibe-split \{\s*margin-top:\s*32px/);
  assert.match(stylesheet, /\.already-built/);
  assert.match(stylesheet, /\.trend-grid \{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2/);
  assert.match(stylesheet, /\.mwu-videos/);
  assert.match(orientation, /https:\/\/www\.youtube\.com\/watch\?v=2K9kFr6UJYw/);
  assert.match(orientation, /https:\/\/www\.youtube\.com\/watch\?v=KiJP3JhEjTM/);
  assert.match(orientation, /https:\/\/www\.youtube\.com\/watch\?v=LlgHCeLV92Y/);
  assert.match(script, /youtube-nocookie\.com\/embed/);
});
