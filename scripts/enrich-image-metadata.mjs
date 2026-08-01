import { execFileSync } from "node:child_process";
import {
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "_workspace", "dist", "node_modules"]);
const dimensionCache = new Map();

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

function resolveImagePath(htmlPath, source) {
  const cleanSource = source.split(/[?#]/, 1)[0];
  const decodedSource = decodeURIComponent(cleanSource);
  return decodedSource.startsWith("/")
    ? resolve(root, decodedSource.slice(1))
    : resolve(dirname(htmlPath), decodedSource);
}

async function readSvgDimensions(path) {
  const svg = await readFile(path, "utf8");
  const width = svg.match(/<svg\b[^>]*\bwidth="([\d.]+)(?:px)?"/i)?.[1];
  const height = svg.match(/<svg\b[^>]*\bheight="([\d.]+)(?:px)?"/i)?.[1];
  if (width && height) return [Math.round(Number(width)), Math.round(Number(height))];

  const viewBox = svg.match(/<svg\b[^>]*\bviewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/i);
  if (viewBox) return [Math.round(Number(viewBox[1])), Math.round(Number(viewBox[2]))];

  throw new Error(`SVG has no intrinsic dimensions: ${relative(root, path)}`);
}

async function readImageDimensions(path) {
  if (dimensionCache.has(path)) return dimensionCache.get(path);

  let dimensions;
  if (path.toLowerCase().endsWith(".svg")) {
    dimensions = await readSvgDimensions(path);
  } else {
    const output = execFileSync(
      "sips",
      ["-g", "pixelWidth", "-g", "pixelHeight", path],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (!width || !height) {
      throw new Error(`Could not read image dimensions: ${relative(root, path)}`);
    }
    dimensions = [width, height];
  }

  dimensionCache.set(path, dimensions);
  return dimensions;
}

async function replaceAsync(value, pattern, replacer) {
  const matches = [...value.matchAll(pattern)];
  if (matches.length === 0) return value;

  const parts = [];
  let cursor = 0;
  for (const match of matches) {
    parts.push(value.slice(cursor, match.index));
    parts.push(await replacer(match));
    cursor = match.index + match[0].length;
  }
  parts.push(value.slice(cursor));
  return parts.join("");
}

export async function enrichHtmlImages(html, htmlPath) {
  const relativePath = relative(root, htmlPath);
  const eagerFirstImage = !relativePath.startsWith(`teaching${process.platform === "win32" ? "\\" : "/"}`);
  let imageIndex = 0;

  const segments = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/gi);
  for (let index = 0; index < segments.length; index += 2) {
    segments[index] = await replaceAsync(segments[index], /<img\b[^>]*>/gi, async (match) => {
      const tag = match[0];
      const source = tag.match(/\bsrc="([^"]+)"/i)?.[1];
      if (!source) throw new Error(`${relativePath}: image has no src`);
      if (/^(?:data:|https?:|blob:|\/\/)/i.test(source)) {
        throw new Error(`${relativePath}: image is not a local asset (${source.slice(0, 80)})`);
      }

      const [width, height] = await readImageDimensions(resolveImagePath(htmlPath, source));
      const attributes = [];
      if (!/\bwidth="\d+"/i.test(tag)) attributes.push(`width="${width}"`);
      if (!/\bheight="\d+"/i.test(tag)) attributes.push(`height="${height}"`);
      if (!/\bloading="(?:lazy|eager)"/i.test(tag)) {
        const loading = eagerFirstImage && imageIndex === 0 ? "eager" : "lazy";
        attributes.push(`loading="${loading}"`);
        if (loading === "eager" && !/\bfetchpriority=/i.test(tag)) {
          attributes.push('fetchpriority="high"');
        }
      }
      if (!/\bdecoding="(?:async|sync|auto)"/i.test(tag)) {
        attributes.push('decoding="async"');
      }
      imageIndex += 1;

      return attributes.length > 0
        ? tag.replace(/^<img\b/i, `<img ${attributes.join(" ")}`)
        : tag;
    });
  }

  return segments.join("");
}

async function enrichAllPages() {
  const htmlFiles = await findHtmlFiles();
  let changedFiles = 0;

  for (const path of htmlFiles) {
    const before = await readFile(path, "utf8");
    const after = await enrichHtmlImages(before, path);
    if (after !== before) {
      await writeFile(path, after);
      changedFiles += 1;
    }
  }

  console.log(`Enriched image metadata in ${changedFiles} HTML files.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await enrichAllPages();
}
