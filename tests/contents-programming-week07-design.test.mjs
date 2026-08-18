import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-07-period${period}.html`),
);

async function readWeekSevenPages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 7 pages share a transformation editorial lesson shell", async () => {
  const pages = await readWeekSevenPages();
  const heroHeadlines = [
    "한 장을 여러 재료로 바꾸기",
    "투명한 레이어로 화면 구성하기",
    "변형과 합성 프로토타입 완성하기",
  ];
  const shareImages = [
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-07-period1-hero.webp",
      alt: "한 장의 기하학 포스터를 자르고 크기와 방향을 바꾼 종이 조각을 보여 주는 7주차 1교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-07-period2-hero.webp",
      alt: "투명도가 다른 세 종이 레이어가 겹쳐 하나의 화면이 되는 7주차 2교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-07-period3-hero.webp",
      alt: "서로 다르게 변형한 세 종이 레이어를 한 화면에 합성한 7주차 3교시 이미지",
    },
  ];

  for (const [index, html] of pages.entries()) {
    const period = index + 1;
    const lead = html.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";

    assert.match(html, /<html[^>]*class="week-seven-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-seven-page[^"]*"/);
    assert.match(html, /href="assets\/week-07\.css\?v=week7-1"/);
    assert.match(html, /src="assets\/week-07\.js\?v=week7-1" defer/);
    assert.match(html, /class="hero week-seven-hero"/);
    assert.match(html, new RegExp(`<h1>${heroHeadlines[index]}</h1>`));
    assert.match(html, /class="week-seven-hero-visual"/);
    assert.match(
      html,
      new RegExp(
        `<img[^>]+src="assets/week-07-period${period}-hero-720\\.webp"[^>]+srcset="[^"]*week-07-period${period}-hero\\.webp 1080w"[^>]+fetchpriority="high"`,
      ),
    );
    assert.ok(lead.split(/\s+/).filter(Boolean).length <= 20);
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-seven-lesson-facts"/);
    assert.doesNotMatch(html, /role="status"|✅|🎉/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 07 / Period 0${period}`,
      ),
    );
    assert.deepEqual(
      shareImageMetadataForHtml(root, pagePaths[index]),
      shareImages[index],
    );
  }

  for (const period of [1, 2, 3]) {
    const image = await stat(
      resolve(assetDirectory, `week-07-period${period}-hero.webp`),
    );
    assert.ok(image.size > 20_000);
  }
});

test("week 7 mission begins in the hero and uses action-led labels", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-07-transformation-mission.ipynb"),
      "utf8",
    ),
  );
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="baseline">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-seven-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-seven-secondary-action"[^>]+href="assets\/week-07-transformation-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.match(period3, /<h2 id="setup">실습 노트북 준비<\/h2>/);
  assert.match(period3, /<h2 id="baseline">수정 전 기준 실행<\/h2>/);
  assert.match(period3, /<h2 id="identity-source">제출 정보와 원본 기록<\/h2>/);
  assert.match(period3, /<h2 id="crop-box">원본보다 작은 영역 자르기<\/h2>/);
  assert.match(period3, /<h2 id="transform-values">각도와 알파로 세 레이어 구분<\/h2>/);
  assert.match(period3, /<h2 id="positions">세 위치로 겹침 설계<\/h2>/);
  assert.match(period3, /<h2 id="save">PNG 저장과 최신 상태 확인<\/h2>/);
  assert.match(period3, /<h2 id="auto-check">새 세션에서 자동 검사 PASS<\/h2>/);
  assert.match(period3, /<h2 id="submission">두 파일 제출과 귀가<\/h2>/);
  assert.doesNotMatch(period3, /<h2[^>]*>STEP \d|CHECK 0\d/);
  assert.doesNotMatch(period3, /class="mission-route"[\s\S]*?<li><span>0\d<\/span>/);
  assert.doesNotMatch(period3, /class="submission-strip"[\s\S]*?<strong>0\d<\/strong>/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );
  assert.ok(notebook.cells.some((cell) => cell.cell_type === "code"));
});

test("week 7 styles flatten long lessons and preserve input-specific feedback", async () => {
  const css = await readFile(resolve(assetDirectory, "week-07.css"), "utf8");
  const coarsePointerStart = css.indexOf(
    "@media (hover: none), (pointer: coarse) {",
  );
  const coarsePointerEnd = css.indexOf(
    "@media (max-width: 980px)",
    coarsePointerStart,
  );
  const coarsePointerCss = css.slice(coarsePointerStart, coarsePointerEnd);

  assert.match(css, /\.week-seven-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-seven-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-seven-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  assert.match(css, /\.week-seven-page \.article h2::before\s*{[^}]*content:\s*none/s);
  assert.match(css, /\.week-seven-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(
    css,
    /\.week-seven-page \.week-seven-hero-visual img\s*{[^}]*width:\s*100%[^}]*height:\s*auto[^}]*aspect-ratio:\s*4\s*\/\s*3/s,
  );
  assert.match(css, /@media \(max-width:\s*980px\)[\s\S]*?overflow-x:\s*auto/);
  assert.match(
    css,
    /@media \(max-width:\s*980px\)[\s\S]*?\.toc-level-3\s*{[^}]*display:\s*none/s,
  );
  assert.match(css, /a\[aria-current="location"\]/);
  assert.match(css, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)/);
  assert.notEqual(coarsePointerStart, -1);
  assert.notEqual(coarsePointerEnd, -1);
  assert.match(
    coarsePointerCss,
    /\.week-seven-page a:not\(:active\):hover\s*{[^}]*text-decoration:\s*none/s,
  );
  assert.match(
    coarsePointerCss,
    /\.lesson-breadcrumb \.lesson-course:not\(:active\):hover\s*{[^}]*color:\s*var\(--ink-strong\)/s,
  );
  assert.match(
    coarsePointerCss,
    /\.toc a\[aria-current="location"\]:not\(:active\):hover\s*{[^}]*background:\s*var\(--accent-soft\)\s*!important[^}]*color:\s*var\(--accent-strong\)\s*!important/s,
  );
  assert.match(css, /:active:not\(:focus-visible\)[^{]*{[^}]*scale\(0\.97\)/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media \(prefers-color-scheme:\s*dark\)[\s\S]*?\.lesson-visual img[^}]*filter:/);
  assert.doesNotMatch(css, /transition\s*:\s*all|ease-in|@keyframes/i);
  assert.doesNotMatch(
    css,
    /transition-property\s*:[^;]*(?:border|color|background)/i,
  );
});

test("week 7 table of contents tracks top-level lesson sections", async () => {
  const script = await readFile(resolve(assetDirectory, "week-07.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});

test("week 7 assets and routes stay reproducible and discoverable", async () => {
  const [courseIndex, sitemap, generator] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(root, "sitemap.xml"), "utf8"),
    readFile(resolve(root, "scripts", "generate-week07-transformation-assets.py"), "utf8"),
  ]);

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-07-period${period}\\.html"`));
    assert.match(sitemap, new RegExp(`week-07-period${period}\\.html`));
  }
  assert.doesNotMatch(generator, /[—–]/);
});
