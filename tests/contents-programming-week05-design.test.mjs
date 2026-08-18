import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-05-period${period}.html`),
);

async function readWeekFivePages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 5 pages share a controlled-chance editorial lesson shell", async () => {
  const pages = await readWeekFivePages();
  const heroHeadlines = [
    "우연을 다시 만드는 법",
    "우연에 조건을 더하기",
    "통제된 우연 포스터",
  ];
  const shareImages = [
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-05-period1-hero.webp",
      alt: "같은 규칙에서 달라진 세 가지 종이 도형 배열로 난수와 시드를 보여 주는 5주차 1교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-05-period2-hero.webp",
      alt: "크기에 따라 윤곽 원과 채운 원, 사각형으로 나뉜 조건문 구성을 보여 주는 5주차 2교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-05-period3-hero.webp",
      alt: "무작위 위치와 크기를 조건에 따라 분류한 완성 포스터와 색상표를 보여 주는 5주차 개인 실습 이미지",
    },
  ];

  for (const [index, html] of pages.entries()) {
    const period = index + 1;
    const lead = html.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";

    assert.match(html, /<html[^>]*class="week-five-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-five-page[^"]*"/);
    assert.match(html, /href="assets\/week-05\.css\?v=week5-1"/);
    assert.match(html, /src="assets\/week-05\.js\?v=week5-1" defer/);
    assert.match(html, /class="hero week-five-hero"/);
    assert.match(html, new RegExp(`<h1>${heroHeadlines[index]}</h1>`));
    assert.match(html, /class="week-five-hero-visual"/);
    assert.match(
      html,
      new RegExp(
        `<img[^>]+src="assets/week-05-period${period}-hero\\.webp"[^>]+fetchpriority="high"`,
      ),
    );
    assert.ok(lead.split(/\s+/).filter(Boolean).length <= 20);
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-five-lesson-facts"/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 05 / Period 0${period}`,
      ),
    );
    assert.deepEqual(
      shareImageMetadataForHtml(root, pagePaths[index]),
      shareImages[index],
    );
  }

  for (const period of [1, 2, 3]) {
    const image = await stat(
      resolve(assetDirectory, `week-05-period${period}-hero.webp`),
    );
    assert.ok(image.size > 40_000);
  }
});

test("week 5 mission begins in the hero and uses action-led labels", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-05-controlled-chance-mission.ipynb"),
      "utf8",
    ),
  );
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="baseline">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-five-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-five-secondary-action"[^>]+href="assets\/week-05-controlled-chance-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.match(period3, /<h2 id="setup">실습 노트북 준비<\/h2>/);
  assert.match(period3, /<h2 id="baseline">수정 전 결과 확인<\/h2>/);
  assert.match(period3, /<h2 id="identity">제출 정보와 생성 규칙 작성<\/h2>/);
  assert.match(period3, /<h2 id="system-values">시드와 조건 설계<\/h2>/);
  assert.match(period3, /<h2 id="random-lines">난수 선택 코드 완성<\/h2>/);
  assert.match(period3, /<h2 id="result-control">결과 확인과 한 번의 조정<\/h2>/);
  assert.match(period3, /<h2 id="auto-check">자동 검사 PASS<\/h2>/);
  assert.match(period3, /<h2 id="submission">두 파일 제출과 귀가<\/h2>/);
  assert.doesNotMatch(period3, /<h2[^>]*>STEP \d|CHECK 0\d/);
  assert.doesNotMatch(period3, /class="mission-route"[\s\S]*?<li><span>0\d<\/span>/);
  assert.doesNotMatch(period3, /class="check-output" role="status"/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );
  assert.ok(notebook.cells.some((cell) => cell.cell_type === "code"));
});

test("week 5 styles flatten long lessons and preserve input-specific feedback", async () => {
  const css = await readFile(resolve(assetDirectory, "week-05.css"), "utf8");
  const coarsePointerStart = css.indexOf(
    "@media (hover: none), (pointer: coarse) {",
  );
  const coarsePointerEnd = css.indexOf(
    "@media (max-width: 980px)",
    coarsePointerStart,
  );
  const coarsePointerCss = css.slice(coarsePointerStart, coarsePointerEnd);

  assert.match(css, /\.week-five-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-five-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-five-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  assert.match(css, /\.week-five-page \.article h2::before\s*{[^}]*content:\s*none/s);
  assert.match(css, /\.week-five-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(css, /\.week-five-page \.official-case-grid\s*{[^}]*grid-template-columns:\s*repeat\(2/s);
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
    /\.week-five-page a:not\(:active\):hover\s*{[^}]*text-decoration:\s*none/s,
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

test("week 5 table of contents tracks top-level lesson sections", async () => {
  const script = await readFile(resolve(assetDirectory, "week-05.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});

test("week 5 pages are discoverable from the course index and sitemap", async () => {
  const [courseIndex, sitemap] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(root, "sitemap.xml"), "utf8"),
  ]);

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-05-period${period}\\.html"`));
    assert.match(sitemap, new RegExp(`week-05-period${period}\\.html`));
  }
});
