import { basename, join, resolve } from "node:path";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicDirectories = ["assets", "projects", "teaching"];
const publicFiles = [
  "index.html",
  "news.html",
  "portfolio.html",
  "robots.txt",
  "sitemap.xml",
];

function isPublicBuildFile(source) {
  const name = basename(source);
  return (
    name !== ".DS_Store" &&
    !name.endsWith(".bundle.html") &&
    !name.toLowerCase().endsWith(".md")
  );
}

export async function buildSitesStatic(rootDirectory = resolve(import.meta.dirname, "..")) {
  const output = join(rootDirectory, "dist");
  const clientOutput = join(output, "client");
  const serverOutput = join(output, "server");

  await rm(output, { recursive: true, force: true });
  await mkdir(clientOutput, { recursive: true });
  await mkdir(serverOutput, { recursive: true });

  for (const directory of publicDirectories) {
    await cp(join(rootDirectory, directory), join(clientOutput, directory), {
      recursive: true,
      filter: isPublicBuildFile,
    });
  }
  for (const file of publicFiles) {
    await cp(join(rootDirectory, file), join(clientOutput, file));
  }

  const worker = `
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/")) {
      url.pathname += "index.html";
    }

    return env.ASSETS.fetch(new Request(url, request));
  },
};

export default worker;
`;

  await writeFile(join(serverOutput, "index.js"), worker.trimStart());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSitesStatic();
  console.log("Built the complete static site in dist/client.");
}
