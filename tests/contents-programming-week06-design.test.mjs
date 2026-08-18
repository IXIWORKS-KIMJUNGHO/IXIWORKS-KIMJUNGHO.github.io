import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-06-period${period}.html`),
);

async function readWeekSixPages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 6 pages share a function-system editorial lesson shell", async () => {
  const pages = await readWeekSixPages();
  const heroHeadlines = [
    "코드 묶음에 이름 붙이기",
    "값으로 생성기 조절하기",
    "한 함수로 세 포스터 만들기",
  ];
  const shareImages = [
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-06-period1-hero.webp",
      alt: "반복되는 종이 도형 절차를 하나의 파란 함수 틀로 묶는 6주차 1교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-06-period2-hero.webp",
      alt: "색상과 크기 입력 조각을 파란 생성 틀에 바꾸어 넣고 세 결과를 만드는 6주차 2교시 이미지",
    },
    {
      url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-06-period3-hero.webp",
      alt: "하나의 파란 생성 틀에서 나온 서로 다른 세 기하학 포스터를 나란히 보여 주는 6주차 3교시 이미지",
    },
  ];

  for (const [index, html] of pages.entries()) {
    const period = index + 1;
    const lead = html.match(/<p class="lead">([^<]+)<\/p>/)?.[1] ?? "";

    assert.match(html, /<html[^>]*class="week-six-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-six-page[^"]*"/);
    assert.match(html, /href="assets\/week-06\.css\?v=week6-1"/);
    assert.match(html, /src="assets\/week-06\.js\?v=week6-1" defer/);
    assert.match(html, /class="hero week-six-hero"/);
    assert.match(html, new RegExp(`<h1>${heroHeadlines[index]}</h1>`));
    assert.match(html, /class="week-six-hero-visual"/);
    assert.match(
      html,
      new RegExp(
        `<img[^>]+src="assets/week-06-period${period}-hero-720\\.webp"[^>]+srcset="[^"]*week-06-period${period}-hero\\.webp 1080w"[^>]+fetchpriority="high"`,
      ),
    );
    assert.ok(lead.split(/\s+/).filter(Boolean).length <= 20);
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-six-lesson-facts"/);
    assert.doesNotMatch(html, /role="status"/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 06 / Period 0${period}`,
      ),
    );
    assert.deepEqual(
      shareImageMetadataForHtml(root, pagePaths[index]),
      shareImages[index],
    );
  }

  for (const period of [1, 2, 3]) {
    const image = await stat(
      resolve(assetDirectory, `week-06-period${period}-hero.webp`),
    );
    assert.ok(image.size > 20_000);
  }
});

test("week 6 mission begins in the hero and uses action-led labels", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-06-parameter-generator-mission.ipynb"),
      "utf8",
    ),
  );
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="starter-diagnosis">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-six-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-six-secondary-action"[^>]+href="assets\/week-06-parameter-generator-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.match(period3, /<h2 id="setup">실습 노트북 준비<\/h2>/);
  assert.match(period3, /<h2 id="starter-diagnosis">빈 결과에서 세 원인 찾기<\/h2>/);
  assert.match(period3, /<h2 id="identity">제출 정보와 생성기 규칙 작성<\/h2>/);
  assert.match(period3, /<h2 id="function-lines">함수 안의 세 줄 연결<\/h2>/);
  assert.match(period3, /<h2 id="variant-design">A·B·C 입력 조합 설계<\/h2>/);
  assert.match(period3, /<h2 id="function-calls">같은 함수 세 번 호출<\/h2>/);
  assert.match(period3, /<h2 id="comparison-save">세 결과를 비교 PNG로 저장<\/h2>/);
  assert.match(period3, /<h2 id="auto-check">새 세션에서 자동 검사 PASS<\/h2>/);
  assert.match(period3, /<h2 id="submission">두 파일 제출과 귀가<\/h2>/);
  assert.doesNotMatch(period3, /<h2[^>]*>STEP \d|CHECK 0\d/);
  assert.doesNotMatch(period3, /class="mission-route"[\s\S]*?<li><span>0\d<\/span>/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );
  assert.ok(notebook.cells.some((cell) => cell.cell_type === "code"));
});

test("week 6 styles flatten long lessons and preserve input-specific feedback", async () => {
  const css = await readFile(resolve(assetDirectory, "week-06.css"), "utf8");
  const coarsePointerStart = css.indexOf(
    "@media (hover: none), (pointer: coarse) {",
  );
  const coarsePointerEnd = css.indexOf(
    "@media (max-width: 980px)",
    coarsePointerStart,
  );
  const coarsePointerCss = css.slice(coarsePointerStart, coarsePointerEnd);

  assert.match(css, /\.week-six-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-six-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-six-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  assert.match(css, /\.week-six-page \.article h2::before\s*{[^}]*content:\s*none/s);
  assert.match(css, /\.week-six-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(
    css,
    /\.week-six-page \.week-six-hero-visual img\s*{[^}]*width:\s*100%[^}]*height:\s*auto[^}]*aspect-ratio:\s*4\s*\/\s*3/s,
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
    /\.week-six-page a:not\(:active\):hover\s*{[^}]*text-decoration:\s*none/s,
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

test("week 6 table of contents tracks top-level lesson sections", async () => {
  const script = await readFile(resolve(assetDirectory, "week-06.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});

test("week 6 pages are discoverable from the course index and sitemap", async () => {
  const [courseIndex, sitemap] = await Promise.all([
    readFile(resolve(courseDirectory, "index.html"), "utf8"),
    readFile(resolve(root, "sitemap.xml"), "utf8"),
  ]);

  for (const period of [1, 2, 3]) {
    assert.match(courseIndex, new RegExp(`href="week-06-period${period}\\.html"`));
    assert.match(sitemap, new RegExp(`week-06-period${period}\\.html`));
  }
});
