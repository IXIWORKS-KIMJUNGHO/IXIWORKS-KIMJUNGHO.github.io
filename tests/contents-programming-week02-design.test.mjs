import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { shareImageMetadataForHtml } from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");
const pagePaths = [1, 2, 3].map((period) =>
  resolve(courseDirectory, `week-02-period${period}.html`),
);

async function readWeekTwoPages() {
  return Promise.all(pagePaths.map((path) => readFile(path, "utf8")));
}

test("week 2 pages share the editorial lesson shell", async () => {
  const pages = await readWeekTwoPages();

  for (const [index, html] of pages.entries()) {
    const period = index + 1;

    assert.match(html, /<html[^>]*class="week-two-document"/);
    assert.match(html, /<body[^>]*class="[^"]*week-two-page[^"]*"/);
    assert.match(html, /href="assets\/week-02\.css\?v=week2-1"/);
    assert.match(html, /src="assets\/week-02\.js\?v=week2-1" defer/);
    assert.match(html, /class="hero week-two-hero"/);
    assert.match(html, /class="[^"]*week-two-hero-visual[^"]*"/);
    assert.doesNotMatch(html, /class="hero-meta"|class="doc-card"/);
    assert.match(html, /class="week-two-lesson-facts"/);
    assert.doesNotMatch(html, /week-two-period-\d|week-two-concept-visual/);
    assert.doesNotMatch(html, /[—–]/);
    assert.match(
      html,
      new RegExp(
        `Contents Programming Practice / Week 02 / Period 0${period}`,
      ),
    );
  }

  assert.match(
    pages[0],
    /<img[^>]+src="assets\/python-data-art\.svg"[^>]+width="1200"[^>]+height="760"/,
  );
  assert.match(
    pages[1],
    /<img[^>]+src="assets\/week-02-data-profile-high\.png"[^>]+width="1448"[^>]+height="1086"[^>]+fetchpriority="high"/,
  );
  assert.match(
    pages[1],
    /property="og:image" content="[^"]*week-02-data-profile-high\.png"/,
  );
  assert.match(
    pages[1],
    /name="twitter:image" content="[^"]*week-02-data-profile-high\.png"/,
  );
  assert.match(pages[2], /class="[^"]*week-two-mission-preview/);
  assert.match(
    pages[2],
    /property="og:image" content="[^"]*week-02-mission-preview\.png"/,
  );

  assert.deepEqual(shareImageMetadataForHtml(root, pagePaths[1]), {
    url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-02-data-profile-high.png",
    alt: "변수 값으로 막대 길이와 원 크기를 표현한 데이터 프로필 예시",
  });
  assert.deepEqual(shareImageMetadataForHtml(root, pagePaths[2]), {
    url: "https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/week-02-mission-preview.png",
    alt: "변수와 계산 결과를 보여주는 2주차 자기소개 데이터 미션 미리보기",
  });
});

test("week 2 mission starts from the hero without duplicate resource cards", async () => {
  const period3 = await readFile(pagePaths[2], "utf8");
  const setupStart = period3.indexOf('<h2 id="setup">');
  const setupEnd = period3.indexOf('<h2 id="variables">');
  const setupSection = period3.slice(setupStart, setupEnd);

  assert.match(
    period3,
    /class="week-two-primary-action"[^>]+href="https:\/\/colab\.research\.google\.com\/github\//,
  );
  assert.match(
    period3,
    /class="week-two-secondary-action"[^>]+href="assets\/week-02-profile-mission\.ipynb"[^>]+download/,
  );
  assert.doesNotMatch(setupSection, /inline-resource-grid|inline-resource-card/);
  assert.match(setupSection, /위의 시작 버튼/);
  assert.doesNotMatch(period3, /class="check-output" role="status"/);
  assert.match(
    period3,
    /class="check-output" role="group" aria-label="자동 검사 완료 예시"/,
  );

  const missionShareImage = await stat(
    resolve(assetDirectory, "week-02-mission-preview.png"),
  );
  assert.ok(missionShareImage.size > 20_000);
});

test("week 2 styles flatten the document and make long navigation responsive", async () => {
  const css = await readFile(resolve(assetDirectory, "week-02.css"), "utf8");

  assert.match(css, /\.week-two-document\s*{[^}]*scroll-behavior:\s*auto/s);
  assert.match(css, /\.week-two-page \.skip-link\s*{[^}]*transition:\s*none/s);
  assert.match(
    css,
    /\.week-two-page \.article\s*{[^}]*padding:\s*0[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
  );
  for (const selector of ["article", "toc", "session-grid", "mission-route"]) {
    assert.match(
      css,
      new RegExp(
        `body\\.course-contents-programming\\.week-two-page \\.${selector}`,
      ),
    );
  }
  assert.match(
    css,
    /\.week-two-page \.article h2::before\s*{[^}]*content:\s*none/s,
  );
  assert.match(css, /\.week-two-page \.session-grid\s*{[^}]*display:\s*block/s);
  assert.match(css, /\.week-two-page \.mission-route\s*{[^}]*display:\s*block/s);
  assert.match(css, /@media \(max-width:\s*980px\)[\s\S]*?overflow-x:\s*auto/);
  assert.match(
    css,
    /@media \(max-width:\s*980px\)[\s\S]*?\.toc-level-3\s*{[^}]*display:\s*none/s,
  );
  assert.match(css, /a\[aria-current="location"\]/);
  assert.match(css, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)/);
  assert.match(css, /:active:not\(:focus-visible\)[^{]*{[^}]*scale\(0\.97\)/s);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /transition\s*:\s*all|ease-in|@keyframes/i);
});

test("week 2 table of contents tracks sections without a scroll listener", async () => {
  const script = await readFile(resolve(assetDirectory, "week-02.js"), "utf8");

  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\.toc-level-2 a\[href\^=/);
  assert.match(script, /aria-current", "location"/);
  assert.match(script, /scrollIntoView/);
  assert.doesNotMatch(
    script,
    /addEventListener\(["']scroll["']|requestAnimationFrame|scrollY/,
  );
});
