import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { applyTeachingChrome } from "../scripts/apply-teaching-chrome.ts";
import { buildSitesStatic } from "../scripts/build-sites-static.mjs";
import { renderPublicPages } from "../scripts/render-public-pages.ts";

const root = resolve(import.meta.dirname, "..");

await renderPublicPages(root);

function hero(html) {
  const match = html.match(/<section class="hero"[\s\S]*?<\/section>/);
  assert.ok(match, "expected a First Screen hero");
  return match[0];
}

test("First Screen is a Professional Landing Page", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const firstScreen = hero(html);

  assert.match(firstScreen, /Creative Engineer \/ Researcher/);
  assert.match(
    firstScreen,
    /I build production systems across generative AI, real-time 3D, and immersive media/,
  );
  assert.match(firstScreen, />Selected Work</);
  assert.doesNotMatch(firstScreen, /Download CV/);
  assert.doesNotMatch(html, /aria-label="CV highlights"|highlight-list/);
  assert.match(html, /class="identity-artwork"/);
  assert.match(html, /profile-email-address/);
  assert.match(html, /href="\/assets\/kim-jungho-cv\.pdf"[^>]*download/);
  assert.match(html, /class="skip-link"/);
});

test("Selected Work and Work System Map keep every project visible", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");

  assert.match(html, /id="work"/);
  assert.match(html, /data-work-system-map/);
  assert.match(html, /data-axis="generative-ai"/);
  assert.match(html, /data-axis="real-time-engine"/);
  assert.match(html, /data-axis="digital-twin"/);
  assert.match(html, /data-axis="exhibition-system"/);
  assert.match(html, /VIVE AI Kiosk Experience Design/);
  assert.match(html, /Hyundai Mobis Connect/);
  assert.match(html, /All case studies/);
  assert.doesNotMatch(html, /View portfolio archive/);
  assert.doesNotMatch(html, /\shidden(|=)|display:\s*none/);
});

test("redesigned surfaces use mustard accent and cool neutrals", async () => {
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");
  assert.match(css, /--accent:\s*#fed766/);
  assert.match(css, /--ink-strong:\s*#272727/);
  assert.match(css, /--paper:\s*#eff1f3/);
  assert.doesNotMatch(css, /--accent:\s*#24424e/);
  assert.doesNotMatch(css, /--accent:\s*#9bc1cb/);
  assert.doesNotMatch(css, /--accent:\s*#b64e35/);
});

test("First Screen headline is not squeezed to a narrow character measure", async () => {
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");
  assert.doesNotMatch(css, /h1\s*\{[^}]*max-width:\s*18ch/);
});

test("featured work keeps kind and year as separate flex items", async () => {
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");
  assert.match(
    css,
    /\.featured-meta[\s\S]{0,80}display:\s*flex/,
  );
});

test("homepage teaching rows keep title, description, and arrow in separate columns", async () => {
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");
  assert.match(
    css,
    /\.teaching-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(180px, 0\.72fr\) minmax\(0, 1\.28fr\) 1\.25rem/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\) \{[\s\S]*?\.teaching-description\s*\{[\s\S]*?grid-column:\s*1 \/ -1/,
  );
});

test("homepage teaching links Game Engine I and Game Engine II separately", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.match(html, /href="teaching\/game-engine-1\/"/);
  assert.match(html, /href="teaching\/game-engine\/"/);
  assert.doesNotMatch(html, /Game Engine I \/ II/);
});

test("profile links do not double-mark icons", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");
  const links = html.match(/<ul class="profile-links"[\s\S]*?<\/ul>/)[0];
  assert.doesNotMatch(links, /<svg\b/);
  assert.match(css, /\.profile-links a::after/);
});

test("homepage gates include research, teaching, background, and news", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const work = html.indexOf('id="work"');
  const research = html.indexOf('id="research"');
  const teaching = html.indexOf('id="teaching"');
  const background = html.indexOf('id="cv-archive"');
  const news = html.indexOf('id="news"');

  assert.ok(work < research);
  assert.ok(research < teaching);
  assert.ok(teaching < background);
  assert.ok(background < news);
  assert.match(html, /teaching\/contents-programming\//);
  assert.match(html, /Open teaching archive/);
  assert.match(html, />All news</);
  assert.doesNotMatch(html, /research-number/);
});

test("handout overlay keeps dark surfaces and accent wash", async () => {
  const css = await readFile(resolve(root, "assets", "archive-lab-handout.css"), "utf8");
  const dark = css.match(
    /@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(dark, "handout overlay should define a dark palette");
  assert.match(dark[1], /--surface:\s*#353535/);
  assert.match(dark[1], /--accent-soft:\s*#3d3620/);
  assert.match(dark[1], /--ink-strong:\s*#eff1f3/);
  assert.match(dark[1], /--slate-2:\s*#eff1f3/);
});

test("public pages load Pretext for body copy", async () => {
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const prose = await readFile(resolve(root, "assets", "course-prose.js"), "utf8");
  const css = await readFile(resolve(root, "src", "styles.css"), "utf8");

  assert.match(homepage, /type="module" src="\/assets\/course-prose\.js"/);
  assert.match(prose, /p\.hero-support/);
  assert.match(prose, /p\.section-intro/);
  assert.match(prose, /article\.article > p/);
  assert.match(css, /p\[data-pretext-laid-out\]\s*\{[^}]*white-space:\s*nowrap/);
});

test("News Index lists recent IP filings in chronological order", async () => {
  const news = await readFile(resolve(root, "news.html"), "utf8");
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const firstNews = news.match(
    /<ol class="news-list news-index-list">([\s\S]*?)<\/li>/,
  );
  assert.ok(firstNews, "expected the first News Index item");
  assert.match(firstNews[1], /datetime="2026-08"/);
  assert.match(firstNews[1], />2026\.08</);
  assert.match(
    firstNews[1],
    /Registered MOVIOLA as software copyright for generative AI pre-production storyboarding/,
  );
  assert.match(firstNews[1], /Generative AI/);
  assert.doesNotMatch(news, /datetime="\d{4}-\d{2}-\d{2}"/);
  assert.doesNotMatch(news, />\d{4}\.\d{2}\.\d{2}</);
  assert.match(homepage, /datetime="2026-08"/);
  assert.match(homepage, /C-2026-042388/);
  assert.match(homepage, /10-2026-0162969/);
  assert.match(
    homepage,
    /MOVIOLA: Generative AI-Based Pre-Production Storyboard/,
  );
  assert.match(
    homepage,
    /Multi-Cut Storyboard Generation Using Shot-Size-Based Reference Selection/,
  );
});

test("News and Portfolio pages share the public chrome", async () => {
  const news = await readFile(resolve(root, "news.html"), "utf8");
  const portfolio = await readFile(resolve(root, "portfolio.html"), "utf8");

  for (const html of [news, portfolio]) {
    assert.match(html, /class="nav"/);
    assert.match(html, /assets\/generated\/site\.css/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  }
  assert.match(news, /News Index/);
  assert.equal([...portfolio.matchAll(/class="case-thumb"/g)].length, 5);
});

test("unified build keeps teaching URLs and stamps the lesson shell", async () => {
  await buildSitesStatic(root);
  await applyTeachingChrome(resolve(root, "dist/client/teaching"));

  const week = resolve(
    root,
    "dist/client/teaching/contents-programming/week-03-period1.html",
  );
  const html = await readFile(week, "utf8");
  assert.ok((await stat(week)).size > 0);
  assert.match(html, /data-lesson-shell="react-v1"/);
  assert.match(html, /픽셀과 좌표로 이미지 읽기/);
  assert.match(html, /week-three-lesson-facts/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /src="\/assets\/course-prose\.js"/);

  const day1 = await readFile(
    resolve(root, "dist/client/teaching/agentic-ai/day-1.html"),
    "utf8",
  );
  assert.doesNotMatch(day1, /data-lesson-shell="react-v1"/);
});
