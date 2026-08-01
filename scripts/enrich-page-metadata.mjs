import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findPublicHtmlFiles } from "./public-html-files.mjs";

const root = resolve(import.meta.dirname, "..");
const siteOrigin = "https://creativeengineer-kimjungho.com";

function decodeEntities(value) {
  const named = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["gt", ">"],
    ["lt", "<"],
    ["middot", "·"],
    ["nbsp", " "],
    ["quot", '"'],
  ]);

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number(code.slice(1)));
    return named.get(code.toLowerCase()) ?? entity;
  });
}

function plainText(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function attributeValue(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function shorten(value, maximum = 170) {
  const characters = [...value];
  if (characters.length <= maximum) return value;
  return `${characters.slice(0, maximum - 1).join("").trimEnd()}…`;
}

function canonicalUrl(htmlPath) {
  const relativePath = relative(root, htmlPath).split("\\").join("/");
  const publicPath = relativePath === "index.html"
    ? ""
    : relativePath.endsWith("/index.html")
      ? relativePath.slice(0, -"index.html".length)
      : relativePath;
  return `${siteOrigin}/${publicPath}`;
}

function extractDescription(html, title) {
  const existing = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i,
  )?.[1];
  if (existing) return shorten(plainText(existing));

  for (const className of ["lead", "cover-sub", "hero-subtitle", "intro"]) {
    const pattern = new RegExp(
      `<p\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/p>`,
      "i",
    );
    const candidate = html.match(pattern)?.[1];
    if (candidate) return shorten(plainText(candidate));
  }

  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (heading) return shorten(plainText(heading));
  return shorten(`${title} — 김정호의 아트 엔지니어링, 창작 기술, 교육 자료 아카이브.`);
}

function removeManagedMetadata(html) {
  return html
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="icon"[^>]*>/gi, "")
    .replace(/\s*<meta\s+name="(?:description|twitter:[^"]+)"[^>]*>/gi, "")
    .replace(/\s*<meta\s+property="og:[^"]+"[^>]*>/gi, "");
}

function addMainShortcut(html) {
  let result = html;
  const main = result.match(/<main\b[^>]*>/i)?.[0];
  if (!main) throw new Error("Page has no main landmark");

  if (!/\bid="main-content"/i.test(main)) {
    const updatedMain = /\bid="[^"]*"/i.test(main)
      ? main.replace(/\bid="[^"]*"/i, 'id="main-content"')
      : main.replace(/^<main\b/i, '<main id="main-content"');
    result = result.replace(main, updatedMain);
  }

  const existingSkipLink = result.match(
    /<a\b[^>]*class="[^"]*\bskip-link\b[^"]*"[^>]*>/i,
  )?.[0];
  if (existingSkipLink) {
    const updatedSkipLink = /\bhref="[^"]*"/i.test(existingSkipLink)
      ? existingSkipLink.replace(/\bhref="[^"]*"/i, 'href="#main-content"')
      : existingSkipLink.replace(/^<a\b/i, '<a href="#main-content"');
    result = result.replace(existingSkipLink, updatedSkipLink);
  } else {
    const language = result.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1] ?? "en";
    const label = language.toLowerCase().startsWith("ko")
      ? "본문 바로가기"
      : "Skip to main content";
    result = result.replace(
      /<body\b[^>]*>/i,
      (body) => `${body}\n  <a class="skip-link" href="#main-content">${label}</a>`,
    );
  }

  return result;
}

export function enrichPageMetadata(html, htmlPath) {
  const title = plainText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (!title) throw new Error(`${relative(root, htmlPath)} has no title`);

  const description = extractDescription(html, title);
  const canonical = canonicalUrl(htmlPath);
  const shareImage = `${siteOrigin}/assets/cv-photo.png`;
  const escapedTitle = attributeValue(title);
  const escapedDescription = attributeValue(description);
  const metadata = [
    `  <meta name="description" content="${escapedDescription}">`,
    `  <link rel="canonical" href="${canonical}">`,
    '  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">',
    `  <meta property="og:title" content="${escapedTitle}">`,
    `  <meta property="og:description" content="${escapedDescription}">`,
    '  <meta property="og:type" content="website">',
    `  <meta property="og:url" content="${canonical}">`,
    `  <meta property="og:image" content="${shareImage}">`,
    '  <meta property="og:image:alt" content="Kim Jungho">',
    '  <meta name="twitter:card" content="summary">',
    `  <meta name="twitter:title" content="${escapedTitle}">`,
    `  <meta name="twitter:description" content="${escapedDescription}">`,
    `  <meta name="twitter:image" content="${shareImage}">`,
  ].join("\n");

  let result = removeManagedMetadata(html);
  result = result.replace(/<\/title>/i, `</title>\n${metadata}`);
  return addMainShortcut(result);
}

async function enrichAllPages() {
  const htmlFiles = await findPublicHtmlFiles(root);
  let changedFiles = 0;

  for (const path of htmlFiles) {
    const before = await readFile(path, "utf8");
    const after = enrichPageMetadata(before, path);
    if (after !== before) {
      await writeFile(path, after);
      changedFiles += 1;
    }
  }

  console.log(`Enriched metadata and landmarks in ${changedFiles} HTML files.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await enrichAllPages();
}
