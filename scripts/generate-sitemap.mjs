import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findPublicHtmlFiles } from "./public-html-files.mjs";
import { publicUrlForHtml } from "./site-config.mjs";

const root = resolve(import.meta.dirname, "..");

async function generateSitemap() {
  const pages = await findPublicHtmlFiles(root);
  const urls = pages
    .map((path) => publicUrlForHtml(root, path))
    .sort((a, b) => a.localeCompare(b));
  const entries = urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
  await writeFile(resolve(root, "sitemap.xml"), xml);
  console.log(`Generated sitemap.xml with ${urls.length} URLs.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateSitemap();
}
