import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const ignoredDirectories = new Set([".git", "_workspace", "dist", "node_modules"]);

export async function findPublicHtmlFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findPublicHtmlFiles(root, path)));
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
