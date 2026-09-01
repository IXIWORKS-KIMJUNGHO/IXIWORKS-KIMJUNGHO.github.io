import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonShell } from "../src/components/lesson-shell.tsx";

const SKIP_NAMES = new Set(["day-1.html", "day-1.bundle.html"]);

const COURSE_LABELS: Record<string, { href: string; label: string }> = {
  "agentic-ai": { href: "./", label: "Agentic AI Workshop" },
  "contents-programming": { href: "./", label: "Contents Programming Practice" },
  "game-engine-1": { href: "./", label: "Game Engine I" },
  "game-engine": { href: "./", label: "Game Engine II" },
  "media-art-programming": { href: "./", label: "Media Art Programming" },
};

const SITE_CSS = '<link rel="stylesheet" href="/assets/generated/site.css">';
const HANDOUT_CSS =
  '<link rel="stylesheet" href="/assets/archive-lab-handout.css">';
const TEACHING_CSS =
  '<link rel="stylesheet" href="/assets/teaching.css?v=teaching1">';
const A11Y_CSS = '<link rel="stylesheet" href="/assets/accessibility.css">';
const PRETEXT_SCRIPT =
  '<script type="module" src="/assets/course-prose.js"></script>';

async function listHtml(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listHtml(path)));
    if (
      entry.isFile() &&
      entry.name.endsWith(".html") &&
      !entry.name.endsWith(".bundle.html") &&
      !SKIP_NAMES.has(entry.name)
    ) {
      files.push(path);
    }
  }
  return files;
}

function courseFromPath(root: string, path: string) {
  const rel = relative(root, path).split("\\").join("/");
  const match = rel.match(/^teaching\/([^/]+)\//);
  return match?.[1] ?? "";
}

function parseLink(html: string, rel: "prev" | "next") {
  const match = html.match(
    new RegExp(`<a[^>]*rel="${rel}"[^>]*>`, "i"),
  );
  if (!match) return null;
  const href = match[0].match(/href="([^"]+)"/)?.[1];
  const title = match[0].match(/aria-label="[^"]*: ([^"]+)"/)?.[1];
  if (!href || !title) return null;
  return { href, title };
}

function ensureHeadLink(html: string, snippet: string) {
  if (html.includes(snippet)) return html;
  return html.replace("</head>", `  ${snippet}\n</head>`);
}

function ensureModuleScript(html: string, snippet: string) {
  if (html.includes("/assets/course-prose.js")) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `  ${snippet}\n</body>`);
  }
  return html.replace("</head>", `  ${snippet}\n</head>`);
}

function markLessonHeader(html: string) {
  if (html.includes('data-lesson-shell="react-v1"')) return html;
  return html.replace(
    /<header class="lesson-header"([^>]*)>/,
    '<header class="lesson-header" data-lesson-shell="react-v1"$1>',
  );
}

function replaceTopbar(html: string, course: string) {
  if (!html.includes('class="topbar"')) return html;
  const previous = parseLink(html, "prev");
  const next = parseLink(html, "next");
  const meta = COURSE_LABELS[course];
  if (!meta) return html;
  const shell = renderToStaticMarkup(
    createElement(LessonShell, {
      courseHref: meta.href,
      courseLabel: meta.label,
      previous,
      next,
    }),
  );
  return html.replace(
    /<div class="topbar">[\s\S]*?<\/div>/,
    shell,
  );
}

export async function applyTeachingChrome(teachingRoot: string) {
  const files = await listHtml(teachingRoot);
  for (const path of files) {
    const course = courseFromPath(teachingRoot.replace(/\/teaching$/, ""), path);
    let html = await readFile(path, "utf8");
    const isIndex = /\/index\.html$/.test(path);
    const isDay1 = /day-1\.html$/.test(path);
    if (isDay1) continue;

    html = ensureHeadLink(html, SITE_CSS);
    html = ensureModuleScript(html, PRETEXT_SCRIPT);
    if (!isIndex) {
      html = ensureHeadLink(html, HANDOUT_CSS);
      html = ensureHeadLink(html, TEACHING_CSS);
      html = ensureHeadLink(html, A11Y_CSS);
      html = replaceTopbar(html, course);
      html = markLessonHeader(html);
    }
    await writeFile(path, html);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const target = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(root, "teaching");
  await applyTeachingChrome(target);
  console.log(`Applied teaching chrome in ${target}`);
}
