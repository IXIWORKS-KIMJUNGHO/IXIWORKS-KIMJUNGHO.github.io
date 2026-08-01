import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "_workspace", "dist", "node_modules"]);

async function findHtmlFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findHtmlFiles(path)));
    if (
      entry.isFile() &&
      entry.name.endsWith(".html") &&
      !entry.name.endsWith(".bundle.html")
    ) {
      files.push(path);
    }
  }

  return files;
}

const htmlFiles = await findHtmlFiles();

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
  const corePages = [
    "index.html",
    "news.html",
    "portfolio.html",
    "projects/digital-twin-pipeline.html",
    "projects/generative-ai-storyboard.html",
    "projects/hyundai-mobis-connect.html",
    "projects/spectrum-of-humanity.html",
    "projects/vive-ai-uiux.html",
  ];
  const violations = [];

  for (const relativePath of corePages) {
    const html = await readFile(resolve(root, relativePath), "utf8");
    const navigation = html.match(/<nav\b[^>]*class="nav"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";
    const currentItems = [...navigation.matchAll(/\baria-current="page"/gi)].length;
    if (currentItems !== 1) violations.push(`${relativePath}: ${currentItems} current items`);
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

  const cssFiles = [resolve(root, "assets", "portfolio.css"), resolve(root, "assets", "accessibility.css")];
  for (const path of cssFiles) {
    const css = await readFile(path, "utf8");
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      await resolveReference(path, match[1]);
    }
  }

  assert.deepEqual(violations, []);
});
