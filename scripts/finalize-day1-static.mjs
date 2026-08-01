import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { enrichHtmlImages } from "./enrich-image-metadata.mjs";
import { enrichPageMetadata } from "./enrich-page-metadata.mjs";

const root = resolve(import.meta.dirname, "..");
const bundlePath = join(root, "teaching", "agentic-ai", "day-1.bundle.html");
const outputPath = join(root, "teaching", "agentic-ai", "day-1.html");
const assetDirectory = join(root, "teaching", "agentic-ai", "day-1-assets");
const temporaryHtml = `/private/tmp/day-1-rendered-${process.pid}.html`;
const chromeProfile = `/private/tmp/day-1-chrome-${process.pid}`;
const temporaryOutputPath = `${outputPath}.tmp-${process.pid}`;
const temporaryAssetDirectory = `${assetDirectory}.tmp-${process.pid}`;
const backupAssetDirectory = `${assetDirectory}.backup-${process.pid}`;

const mimeExtensions = new Map([
  ["application/javascript", "js"],
  ["application/json", "json"],
  ["font/woff2", "woff2"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/svg+xml", "svg"],
  ["text/css", "css"],
]);

function extensionFor(mime) {
  return mimeExtensions.get(mime) ?? "bin";
}

function extractJsonScript(html, type) {
  const pattern = new RegExp(
    `<script\\s+type=["']${type.replaceAll("/", "\\/")}["']>\\s*([\\s\\S]*?)\\s*<\\/script>`,
  );
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing ${type} script in Day 1 bundle`);
  return JSON.parse(match[1]);
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next supported browser path.
    }
  }

  throw new Error("Chrome was not found. Set CHROME_BIN to rebuild the Day 1 deck.");
}

async function renderBundle(chrome) {
  const output = await open(temporaryHtml, "w");
  let browserErrors = "";
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-gpu",
      "--no-default-browser-check",
      "--no-first-run",
      "--allow-file-access-from-files",
      "--virtual-time-budget=15000",
      `--user-data-dir=${chromeProfile}`,
      "--dump-dom",
      new URL(`file://${bundlePath}`).href,
    ],
    { stdio: ["ignore", output.fd, "pipe"] },
  );
  child.stderr.on("data", (chunk) => {
    browserErrors = `${browserErrors}${chunk}`.slice(-4_000);
  });

  const timeout = setTimeout(() => child.kill("SIGTERM"), 25_000);
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", resolveExit);
  });
  clearTimeout(timeout);
  await output.close();

  const rendered = await readFile(temporaryHtml, "utf8");
  if (!rendered.includes("<deck-stage") || !rendered.includes("</html>")) {
    throw new Error(
      `Chrome did not finish rendering the deck (status ${exitCode})\n${browserErrors}`,
    );
  }
}

async function extractRuntimeAssets(manifest, template, directory) {
  const references = new Map();
  const scriptIds = new Set(
    [...template.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)]
      .map((match) => match[1])
      .filter((id) => Object.hasOwn(manifest, id)),
  );

  for (const id of scriptIds) {
    const entry = manifest[id];
    const compressedBytes = Buffer.from(entry.data, "base64");
    const bytes = entry.compressed ? gunzipSync(compressedBytes) : compressedBytes;
    const filename = `${id}.${extensionFor(entry.mime)}`;
    await writeFile(join(directory, filename), bytes);
    references.set(id, `day-1-assets/${filename}`);
  }

  return references;
}

async function externalizeDataUrls(html, directory) {
  const pendingWrites = new Map();
  const dataUrlPattern = /data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)/gi;

  const result = html.replace(dataUrlPattern, (dataUrl, mime, encoded) => {
    const bytes = Buffer.from(encoded, "base64");
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const filename = `embedded-${hash}.${extensionFor(mime.toLowerCase())}`;
    if (!pendingWrites.has(filename)) pendingWrites.set(filename, bytes);
    return `day-1-assets/${filename}`;
  });

  await Promise.all(
    [...pendingWrites].map(([filename, bytes]) =>
      writeFile(join(directory, filename), bytes),
    ),
  );

  return result;
}

function replaceRuntimeBlobScripts(html, template, assetReferences) {
  const scriptIds = [...template.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((id) => assetReferences.has(id));
  let scriptIndex = 0;

  const result = html.replace(
    /(<script\b[^>]*\bsrc=")blob:[^"]+("[^>]*>)/gi,
    (script, before, after) => {
      const id = scriptIds[scriptIndex];
      scriptIndex += 1;
      if (!id) throw new Error("Rendered Day 1 deck contains an unexpected blob script");
      return `${before}${assetReferences.get(id)}${after}`;
    },
  );

  if (scriptIndex !== scriptIds.length) {
    throw new Error(
      `Expected ${scriptIds.length} runtime scripts, replaced ${scriptIndex}`,
    );
  }

  return result;
}

function finalizeDocument(html) {
  let result = html
    .replace(/<script>window\.__resources = \{\};<\/script>\s*/i, "")
    .replace(/\s*<span hidden(?:="")?>[\s\S]*?<\/span>/gi, "")
    .replace("<deck-stage ", "<main>\n<deck-stage ")
    .replace("</deck-stage>", "</deck-stage>\n</main>");

  if (!result.includes('/assets/accessibility.css')) {
    result = result.replace(
      "</head>",
      '  <link rel="stylesheet" href="/assets/accessibility.css">\n</head>',
    );
  }

  return result;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function installGeneratedOutput() {
  let movedPreviousAssets = false;
  let installedNewAssets = false;

  try {
    if (await pathExists(assetDirectory)) {
      await rename(assetDirectory, backupAssetDirectory);
      movedPreviousAssets = true;
    }
    await rename(temporaryAssetDirectory, assetDirectory);
    installedNewAssets = true;
    await rename(temporaryOutputPath, outputPath);
  } catch (error) {
    if (installedNewAssets) {
      await rm(assetDirectory, { recursive: true, force: true });
    }
    if (movedPreviousAssets && await pathExists(backupAssetDirectory)) {
      await rename(backupAssetDirectory, assetDirectory);
    }
    throw error;
  }

  if (movedPreviousAssets) {
    await rm(backupAssetDirectory, { recursive: true, force: true });
  }
}

await mkdir(dirname(outputPath), { recursive: true });
await rm(temporaryAssetDirectory, { recursive: true, force: true });
await rm(temporaryOutputPath, { force: true });
await mkdir(temporaryAssetDirectory, { recursive: true });

try {
  const bundle = await readFile(bundlePath, "utf8");
  const manifest = extractJsonScript(bundle, "__bundler/manifest");
  const template = extractJsonScript(bundle, "__bundler/template");
  const chrome = await findChrome();

  await renderBundle(chrome);

  const assetReferences = await extractRuntimeAssets(
    manifest,
    template,
    temporaryAssetDirectory,
  );
  let rendered = await readFile(temporaryHtml, "utf8");
  rendered = replaceRuntimeBlobScripts(rendered, template, assetReferences);
  rendered = finalizeDocument(rendered);
  rendered = await externalizeDataUrls(rendered, temporaryAssetDirectory);
  rendered = await enrichHtmlImages(rendered, outputPath);
  rendered = enrichPageMetadata(rendered, outputPath);
  rendered = rendered.replace(/[ \t]+$/gm, "");

  await writeFile(temporaryOutputPath, rendered);
  await installGeneratedOutput();
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${assetReferences.size} bundled runtime assets to ${assetDirectory}`);
} finally {
  await rm(temporaryHtml, { force: true });
  await rm(chromeProfile, { recursive: true, force: true });
  await rm(temporaryOutputPath, { force: true });
  await rm(temporaryAssetDirectory, { recursive: true, force: true });
}
