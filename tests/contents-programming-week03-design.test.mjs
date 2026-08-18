import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-03-period${period}.html`),
);

async function readWeekThreePages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 3 pages share a visual editorial lesson shell", async () => {
  const pages = await readWeekThreePages();
  const heroHeadlines = [
    "픽셀과 좌표로 이미지 읽기",
    "RGB와 도형으로 이미지 그리기",
    "기하학적 이미지 미션",
  ];

  for (const [index, html] of pages.entries()) {
    const period = index + 1;

    assert.match(html, /<html[^>]*class="week-three-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-three-page[^"]*"/);
    assert.match(html, /href="assets\/week-03\.css\?v=week3-1"/);
    assert.match(html, /src="assets\/week-03\.js\?v=week3-1" defer/);
    assert.match(html, /class="hero week-three-hero"/);
    assert.match(html, new RegExp(`<h1>${heroHeadlines[index]}</h1>`));
    assert.match(html, /class="week-three-hero-visual"/);
    assert.match(
      html,
      new RegExp(
        `<img[^>]+src="assets/week-03-period${period}-hero\\.webp"[^>]+fetchpriority="high"`,
      ),
    );
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-three-lesson-facts"/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 03 / Period 0${period}`,
      ),
    );
  }

  assert.deepEqual(shareImageMetadataForHtml(root, pagePaths[0]), {
    url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-03-period1-hero.webp",
    alt: "정사각 픽셀 격자에서 원점과 좌표 관계를 보여 주는 3주차 1교시 이미지",
  });
  assert.deepEqual(shareImageMetadataForHtml(root, pagePaths[1]), {
    url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-03-period2-hero.webp",
    alt: "RGB 색상 조각과 좌표 기반 도형 구성을 보여 주는 3주차 2교시 이미지",
  });
  assert.deepEqual(shareImageMetadataForHtml(root, pagePaths[2]), {
    url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-03-period3-hero.webp",
    alt: "종이 위 기하학적 도형 작품과 색상표를 보여 주는 3주차 이미지 미션",
  });

  for (const period of [1, 2, 3]) {
    const image = await stat(
      resolve(assetDirectory, `week-03-period${period}-hero.webp`),
    );
    assert.ok(image.size > 40_000);
  }
});

test("week 3 routes are discoverable from the course hub and sitemap", async () => {
  const [index, sitemap] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(root, "sitemap.xml"), "utf8"),
  ]);

  for (const period of [1, 2, 3]) {
    const route = `week-03-period${period}.html`;

    assert.match(index, new RegExp(`href="${route}"`));
    assert.match(
      sitemap,
      new RegExp(
        `https://creativeengineer-kimjungho\\.com/teaching/contents-programming/${route}`,
      ),
    );
  }
});

test("week 3 mission begins in the hero and keeps setup focused", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-03-geometric-image-mission.ipynb"),
      "utf8",
    ),
  );
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="baseline">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-three-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-three-secondary-action"[^>]+href="assets\/week-03-geometric-image-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.doesNotMatch(period3, /class="check-output" role="status"/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );
  assert.match(period3, /<h2 id="setup">노트북 준비<\/h2>/);
  assert.match(period3, /<h2 id="baseline">기준 이미지 실행<\/h2>/);
  assert.match(period3, /<h2 id="auto-check">자동 검사 PASS<\/h2>/);
  assert.doesNotMatch(period3, /<h2[^>]*>STEP \d/);
  assert.ok(notebook.cells.some((cell) => cell.cell_type === "code"));
});

test("week 3 styles flatten long documents and calibrate input feedback", async () => {
  const css = await readFile(resolve(assetDirectory, "week-03.css"), "utf8");
  const coarsePointerStart = css.indexOf(
    "@media (hover: none), (pointer: coarse) {",
  );
  const coarsePointerEnd = css.indexOf(
    "@media (max-width: 980px)",
    coarsePointerStart,
  );
  const coarsePointerCss = css.slice(coarsePointerStart, coarsePointerEnd);

  assert.match(css, /\.week-three-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-three-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-three-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  for (const selector of ["article", "toc", "session-grid", "mission-route"]) {
    assert.match(
      css,
      new RegExp(
        `body\\.course-contents-programming\\.week-three-page \\.${selector}`,
      ),
    );
  }
  assert.match(
    css,
    /\.week-three-page \.article h2::before\s*{[^}]*content:\s*none/s,
  );
  assert.match(css, /\.week-three-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(css, /\.week-three-page \.mission-route\s*{[^}]*display:\s*block/s);
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
    /\.week-three-page a:not\(:active\):hover\s*{[^}]*text-decoration:\s*none/s,
  );
  assert.match(
    coarsePointerCss,
    /\.week-three-page \.lesson-breadcrumb a:not\(:active\):hover\s*{[^}]*color:\s*var\(--muted\)/s,
  );
  assert.match(
    coarsePointerCss,
    /\.week-three-page \.lesson-breadcrumb \.lesson-course:not\(:active\):hover\s*{[^}]*color:\s*var\(--ink-strong\)/s,
  );
  assert.match(
    coarsePointerCss,
    /\.week-three-page \.concept-check-list summary:not\(:active\):hover\s*{[^}]*color:\s*var\(--ink-strong\)/s,
  );
  assert.match(
    coarsePointerCss,
    /\.week-three-page \.toc a:not\(\[aria-current="location"\]\):not\(:active\):hover\s*{[^}]*background:\s*transparent\s*!important[^}]*color:\s*var\(--muted\)\s*!important/s,
  );
  assert.match(
    coarsePointerCss,
    /\.week-three-page \.toc a\[aria-current="location"\]:not\(:active\):hover\s*{[^}]*background:\s*var\(--accent-soft\)\s*!important[^}]*color:\s*var\(--accent-strong\)\s*!important/s,
  );
  assert.match(css, /:active:not\(:focus-visible\)[^{]*{[^}]*scale\(0\.97\)/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /transition\s*:\s*all|ease-in|@keyframes/i);
  assert.doesNotMatch(
    css,
    /transition-property\s*:[^;]*(?:border|color|background)/i,
  );
});

test("week 3 table of contents tracks top-level lesson sections", async () => {
  const script = await readFile(resolve(assetDirectory, "week-03.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});
