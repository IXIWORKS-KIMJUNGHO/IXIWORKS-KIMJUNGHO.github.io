import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-04-period${period}.html`),
);

async function readWeekFourPages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 4 pages share a rhythm-led editorial lesson shell", async () => {
  const pages = await readWeekFourPages();
  const heroHeadlines = [
    "반복이 만드는 시각적 리듬",
    "리스트에서 격자까지",
    "나만의 리듬 그리드",
  ];
  const shareImages = [
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-04-period1-hero.webp",
      alt: "종이 위 반복 도형과 간격 변화로 시각적 리듬을 보여 주는 4주차 1교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-04-period2-hero.webp",
      alt: "색상 조각과 행렬 격자로 리스트와 중첩 반복을 보여 주는 4주차 2교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-04-period3-hero.webp",
      alt: "완성된 리듬 그리드 출력물과 색상표를 보여 주는 4주차 개인 실습 이미지",
    },
  ];

  for (const [index, html] of pages.entries()) {
    const period = index + 1;
    const lead = html.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";

    assert.match(html, /<html[^>]*class="week-four-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-four-page[^"]*"/);
    assert.match(html, /href="assets\/week-04\.css\?v=week4-1"/);
    assert.match(html, /src="assets\/week-04\.js\?v=week4-1" defer/);
    assert.match(html, /class="hero week-four-hero"/);
    assert.match(html, new RegExp(`<h1>${heroHeadlines[index]}</h1>`));
    assert.match(html, /class="week-four-hero-visual"/);
    assert.match(
      html,
      new RegExp(
        `<img[^>]+src="assets/week-04-period${period}-hero\\.webp"[^>]+fetchpriority="high"`,
      ),
    );
    assert.ok(lead.split(/\s+/).filter(Boolean).length <= 20);
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-four-lesson-facts"/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 04 / Period 0${period}`,
      ),
    );
    assert.deepEqual(
      shareImageMetadataForHtml(root, pagePaths[index]),
      shareImages[index],
    );
  }

  for (const period of [1, 2, 3]) {
    const image = await stat(
      resolve(assetDirectory, `week-04-period${period}-hero.webp`),
    );
    assert.ok(image.size > 40_000);
  }
});

test("week 4 mission begins in the hero and uses action-led labels", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-04-rhythm-grid-mission.ipynb"),
      "utf8",
    ),
  );
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="baseline">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-four-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-four-secondary-action"[^>]+href="assets\/week-04-rhythm-grid-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.match(period3, /<h2 id="setup">실습 노트북 준비<\/h2>/);
  assert.match(period3, /<h2 id="baseline">기준 격자 실행<\/h2>/);
  assert.match(period3, /<h2 id="auto-check">자동 검사 PASS<\/h2>/);
  assert.doesNotMatch(period3, /<h2[^>]*>STEP \d|CHECK 0\d/);
  assert.doesNotMatch(period3, /class="mission-route"[\s\S]*?<li><span>0\d<\/span>/);
  assert.doesNotMatch(period3, /class="check-output" role="status"/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );
  assert.ok(notebook.cells.some((cell) => cell.cell_type === "code"));
});

test("week 4 styles flatten long lessons and preserve input-specific feedback", async () => {
  const css = await readFile(resolve(assetDirectory, "week-04.css"), "utf8");
  const coarsePointerStart = css.indexOf(
    "@media (hover: none), (pointer: coarse) {",
  );
  const coarsePointerEnd = css.indexOf(
    "@media (max-width: 980px)",
    coarsePointerStart,
  );
  const coarsePointerCss = css.slice(coarsePointerStart, coarsePointerEnd);

  assert.match(css, /\.week-four-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-four-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-four-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  assert.match(css, /\.week-four-page \.article h2::before\s*{[^}]*content:\s*none/s);
  assert.match(css, /\.week-four-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(css, /\.week-four-page \.official-case-grid\s*{[^}]*grid-template-columns:\s*repeat\(2/s);
  assert.match(css, /\.week-four-page \.official-case-card:first-child\s*{[^}]*grid-column:\s*1\s*\/\s*-1/s);
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
    /\.week-four-page a:not\(:active\):hover\s*{[^}]*text-decoration:\s*none/s,
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
  assert.doesNotMatch(css, /transition\s*:\s*all|ease-in|@keyframes/i);
  assert.doesNotMatch(
    css,
    /transition-property\s*:[^;]*(?:border|color|background)/i,
  );
});

test("week 4 table of contents tracks top-level lesson sections", async () => {
  const script = await readFile(resolve(assetDirectory, "week-04.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});
