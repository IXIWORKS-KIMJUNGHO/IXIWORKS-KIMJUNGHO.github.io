import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import { findPublicHtmlFiles } from "../scripts/public-html-files.mjs";

const root = resolve(import.meta.dirname, "..");
const htmlFiles = await findPublicHtmlFiles(root);

function displayPath(path) {
  return relative(root, path);
}

test("published links use valid, non-nested anchors", async () => {
  const malformed = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");

    for (const match of html.matchAll(/href="([^"]+)"/gi)) {
      if (match[1].endsWith(")")) {
        malformed.push(`${displayPath(path)}: href ends with ) (${match[1]})`);
      }
    }

    let openAnchor = false;
    for (const match of html.matchAll(/<a\b[^>]*>|<\/a\s*>/gi)) {
      if (match[0].startsWith("</")) {
        openAnchor = false;
      } else if (openAnchor) {
        malformed.push(`${displayPath(path)}: nested anchor (${match[0].slice(0, 90)})`);
      } else {
        openAnchor = true;
      }
    }
  }

  assert.deepEqual(malformed, []);
});

test("published content uses the custom domain", async () => {
  const legacyHostReferences = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    if (html.includes("ixiworks-kimjungho.github.io")) {
      legacyHostReferences.push(displayPath(path));
    }
  }

  assert.deepEqual(legacyHostReferences, []);
});

test("motion preferences and touch pointers are respected", async () => {
  const accessibilityCssPath = resolve(root, "assets", "accessibility.css");
  const accessibilityCss = await readFile(accessibilityCssPath, "utf8");

  assert.match(accessibilityCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(accessibilityCss, /hover:\s*none/);
  assert.match(accessibilityCss, /pointer:\s*coarse/);
  assert.match(accessibilityCss, /:active/);
  assert.match(accessibilityCss, /:focus-visible/);
  assert.match(accessibilityCss, /\.material-card[^}]*:hover[\s\S]*?background:/);
  assert.match(accessibilityCss, /\.toc a[^}]*:hover[\s\S]*?background:/);
  for (const selector of ["archive-link", "copy-button", "reset-button"]) {
    assert.match(
      accessibilityCss,
      new RegExp(`\\.${selector}[^}]*:hover[\\s\\S]*?background:`),
    );
  }

  const pagesMissingTheStylesheet = [];
  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    if (
      html.includes("scroll-behavior: smooth") &&
      !html.includes("/assets/accessibility.css")
    ) {
      pagesMissingTheStylesheet.push(displayPath(path));
    }
  }

  assert.deepEqual(pagesMissingTheStylesheet, []);
});

test("lift interactions are reserved for actionable cards", async () => {
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const news = await readFile(resolve(root, "news.html"), "utf8");

  assert.doesNotMatch(homepage, /\.project-card:hover/);
  assert.doesNotMatch(homepage, /\.course-card:hover/);
  assert.doesNotMatch(news, /\.news-item:hover/);
});

test("the homepage presents an evidence-first, printable CV", async () => {
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const homepageCss = await readFile(resolve(root, "assets", "cv.css"), "utf8");

  const workIndex = homepage.indexOf('id="work"');
  const researchIndex = homepage.indexOf('id="research"');
  const backgroundIndex = homepage.indexOf('id="cv-archive"');
  const teachingIndex = homepage.indexOf('id="teaching"');
  const newsIndex = homepage.indexOf('id="news"');

  assert.ok(workIndex > -1, "the selected work section should exist");
  assert.ok(workIndex < researchIndex, "selected work should precede research");
  assert.ok(researchIndex < backgroundIndex, "research should precede background");
  assert.ok(backgroundIndex < teachingIndex, "background should precede teaching");
  assert.ok(teachingIndex < newsIndex, "news should close the CV narrative");

  assert.match(homepage, /aria-label="CV highlights"/);
  assert.match(
    homepage,
    /href="\/assets\/kim-jungho-cv\.pdf"[^>]*\bdownload\b/,
  );
  assert.match(homepage, /class="featured-project"/);
  assert.match(homepage, /class="project-row"/);
  assert.match(homepage, /https:\/\/doi\.org\/10\.1007\/978-981-97-8093-8_6/);
  assert.doesNotMatch(homepage, /data-work-system-map|data-axis=/);
  assert.doesNotMatch(homepage, /<article class="(?:featured-project|project-row)"/);
  assert.doesNotMatch(homepage, /fonts\.googleapis\.com/);

  assert.doesNotMatch(homepageCss, /linear-gradient\(/);
  assert.match(homepageCss, /fonts\/inter-latin-variable\.woff2/);
  assert.match(
    homepageCss,
    /@media\s+\(hover:\s*hover\)\s+and\s+\(pointer:\s*fine\)[\s\S]*?\.project-row:hover/,
  );
  assert.match(homepageCss, /\.work-tail\s*\{\s*break-inside:\s*avoid;/);
  assert.match(homepageCss, /@media\s+print/);
  assert.match(homepageCss, /prefers-color-scheme:\s*dark/);
});

test("the work index and case studies share the CV design system", async () => {
  const workPages = [
    "portfolio.html",
    "projects/digital-twin-pipeline.html",
    "projects/generative-ai-storyboard.html",
    "projects/hyundai-mobis-connect.html",
    "projects/spectrum-of-humanity.html",
    "projects/vive-ai-uiux.html",
  ];

  for (const relativePath of workPages) {
    const html = await readFile(resolve(root, relativePath), "utf8");
    assert.match(html, /portfolio\.css\?v=evidence2/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }

  const workIndex = await readFile(resolve(root, "portfolio.html"), "utf8");
  const workCss = await readFile(resolve(root, "assets", "portfolio.css"), "utf8");
  assert.equal([...workIndex.matchAll(/class="case-thumb"/g)].length, 5);
  assert.match(workCss, /fonts\/inter-latin-variable\.woff2/);
  assert.match(workCss, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(workCss, /(?:linear|radial|repeating-linear)-gradient\(/);
});

test("the news index uses the shared CV design system", async () => {
  const news = await readFile(resolve(root, "news.html"), "utf8");
  const newsCss = await readFile(resolve(root, "assets", "news.css"), "utf8");

  assert.match(news, /portfolio\.css\?v=evidence2/);
  assert.match(news, /news\.css\?v=evidence2/);
  assert.doesNotMatch(news, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(newsCss, /\.news-item\s*\{[\s\S]*?border-bottom:/);
  assert.doesNotMatch(newsCss, /(?:linear|radial|repeating-linear)-gradient\(/);
});

test("the Day 1 deck ships as a ready-to-render static document", async () => {
  const path = resolve(root, "teaching", "agentic-ai", "day-1.html");
  const html = await readFile(path, "utf8");

  assert.match(html, /<html\s+lang="ko"/i);
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /<main(?:\s|>)/i);
  assert.doesNotMatch(html, /__bundler|Unpacking\.\.\./);
  assert.doesNotMatch(html, /data:(?:font|image)\//);
  assert.ok(Buffer.byteLength(html) < 1_000_000, "Day 1 HTML should stay below 1 MB");
});

test("the Day 1 asset graph contains no unreferenced or duplicate files", async () => {
  const html = await readFile(
    resolve(root, "teaching", "agentic-ai", "day-1.html"),
    "utf8",
  );
  const assetDirectory = resolve(root, "teaching", "agentic-ai", "day-1-assets");
  const assetNames = (await readdir(assetDirectory)).sort();
  const textAssets = assetNames.filter((name) => /\.(?:css|js|json|svg)$/i.test(name));
  const referenceCorpus = [
    html,
    ...(await Promise.all(
      textAssets.map((name) => readFile(resolve(assetDirectory, name), "utf8")),
    )),
  ].join("\n");
  const unreferenced = assetNames.filter((name) => !referenceCorpus.includes(name));

  const hashes = new Map();
  const duplicates = [];
  for (const name of assetNames) {
    const bytes = await readFile(resolve(assetDirectory, name));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(hash)) duplicates.push(`${name} duplicates ${hashes.get(hash)}`);
    else hashes.set(hash, name);
  }

  assert.deepEqual(unreferenced, []);
  assert.deepEqual(duplicates, []);
});

test("the production build regenerates the Day 1 deck", async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const generator = await readFile(
    resolve(root, "scripts", "finalize-day1-static.mjs"),
    "utf8",
  );
  assert.match(packageJson.scripts.build, /(?:^|&&|;)\s*npm run build:day1(?:\s|$)/);
  assert.match(generator, /"\/usr\/bin\/google-chrome"/);
  assert.match(generator, /"\/usr\/bin\/chromium"/);
});

test("documents expose one H1 and do not skip heading levels", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8"))
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "");
    const h1Count = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
    if (h1Count > 1) {
      violations.push(`${displayPath(path)}: ${h1Count} H1 elements`);
    }

    let previousLevel = 0;
    for (const match of html.matchAll(/<h([1-6])(?:\s|>)/gi)) {
      const level = Number(match[1]);
      if (previousLevel > 0 && level > previousLevel + 1) {
        violations.push(
          `${displayPath(path)}: heading jumps from H${previousLevel} to H${level}`,
        );
      }
      previousLevel = level;
    }
  }

  assert.deepEqual(violations, []);
});

test("images reserve their layout and declare a loading strategy", async () => {
  const incompleteImages = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8"))
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "");

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const missing = [];
      if (!/\bwidth="\d+"/i.test(tag)) missing.push("width");
      if (!/\bheight="\d+"/i.test(tag)) missing.push("height");
      if (!/\bloading="(?:lazy|eager)"/i.test(tag)) missing.push("loading");
      if (!/\bdecoding="(?:async|sync|auto)"/i.test(tag)) missing.push("decoding");
      if (missing.length > 0) {
        incompleteImages.push(`${displayPath(path)}: ${missing.join(", ")}`);
      }
    }
  }

  assert.equal(
    incompleteImages.length,
    0,
    `${incompleteImages.length} images lack metadata:\n${incompleteImages.slice(0, 20).join("\n")}`,
  );
});

test("pages publish canonical and social metadata for the custom domain", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const relativePath = displayPath(path).split("\\").join("/");
    const publicPath = relativePath.endsWith("/index.html")
      ? relativePath.slice(0, -"index.html".length)
      : relativePath === "index.html"
        ? ""
        : relativePath;
    const canonical = `https://creativeengineer-kimjungho.com/${publicPath}`;

    if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
      violations.push(`${relativePath}: canonical`);
    }
    if (!html.includes('<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">')) {
      violations.push(`${relativePath}: favicon`);
    }
    for (const name of ["description", "twitter:card", "twitter:title", "twitter:description"]) {
      if (!new RegExp(`<meta name="${name}" content="[^"]+">`, "i").test(html)) {
        violations.push(`${relativePath}: ${name}`);
      }
    }
    for (const property of ["og:title", "og:description", "og:type", "og:url"]) {
      if (!new RegExp(`<meta property="${property}" content="[^"]+">`, "i").test(html)) {
        violations.push(`${relativePath}: ${property}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("pages provide a keyboard shortcut to the main content", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8")).replace(
      /<script\b[\s\S]*?<\/script>/gi,
      "",
    );
    if (!/<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i.test(html)) {
      violations.push(`${displayPath(path)}: skip link`);
    }
    if (!/<main\b[^>]*id="main-content"/i.test(html)) {
      violations.push(`${displayPath(path)}: main landmark id`);
    }
  }

  assert.deepEqual(violations, []);
});

test("primary navigation identifies the current page", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const primaryNavigations = [
      ...html.matchAll(/<nav\b[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/gi),
    ];
    for (const [index, match] of primaryNavigations.entries()) {
      const currentItems = [
        ...match[0].matchAll(/\baria-current="(?:page|location)"/gi),
      ].length;
      if (currentItems !== 1) {
        violations.push(
          `${displayPath(path)} primary nav ${index + 1}: ${currentItems} current items`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("local links, assets, and fragments resolve", async () => {
  const violations = [];
  const documentCache = new Map();

  async function resolveReference(sourcePath, reference) {
    if (
      !reference ||
      /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)
    ) {
      return;
    }

    const [pathPart, rawFragment = ""] = reference.split("#", 2);
    const cleanPath = decodeURIComponent(pathPart.split("?", 1)[0]);
    let target = cleanPath
      ? cleanPath.startsWith("/")
        ? resolve(root, cleanPath.slice(1))
        : resolve(dirname(sourcePath), cleanPath)
      : sourcePath;

    try {
      const targetStats = await stat(target);
      if (targetStats.isDirectory()) target = resolve(target, "index.html");
      await stat(target);
    } catch {
      violations.push(`${displayPath(sourcePath)}: missing ${reference}`);
      return;
    }

    if (rawFragment && target.endsWith(".html")) {
      const fragment = decodeURIComponent(rawFragment);
      let targetHtml = documentCache.get(target);
      if (!targetHtml) {
        targetHtml = await readFile(target, "utf8");
        documentCache.set(target, targetHtml);
      }
      if (
        !targetHtml.includes(`id="${fragment}"`) &&
        !targetHtml.includes(`id='${fragment}'`)
      ) {
        violations.push(`${displayPath(sourcePath)}: missing fragment ${reference}`);
      }
    }
  }

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    const references = [
      ...[...markup.matchAll(/\b(?:href|src)="([^"]+)"/gi)].map((match) => match[1]),
      ...[...markup.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((match) => match[1]),
    ];
    for (const reference of references) await resolveReference(path, reference);
  }

  const cssFiles = [
    resolve(root, "assets", "cv.css"),
    resolve(root, "assets", "portfolio.css"),
    resolve(root, "assets", "accessibility.css"),
  ];
  for (const path of cssFiles) {
    const css = await readFile(path, "utf8");
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      await resolveReference(path, match[1]);
    }
  }

  assert.deepEqual(violations, []);
});
