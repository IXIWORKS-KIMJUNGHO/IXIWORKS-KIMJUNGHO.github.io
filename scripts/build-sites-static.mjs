import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "teaching", "agentic-ai");
const output = join(root, "dist");
const staticOutput = join(output, "client", "teaching", "agentic-ai");
const sharedAssetOutput = join(output, "client", "assets");
const serverOutput = join(output, "server");

await rm(output, { recursive: true, force: true });
await mkdir(staticOutput, { recursive: true });
await mkdir(sharedAssetOutput, { recursive: true });
await mkdir(serverOutput, { recursive: true });

for (const file of [
  "index.html",
  "schedule.html",
  "day-1.html",
  "mentoring-groups.html",
  "day1-install-runbook.html",
  "agent-rules.html",
  "day4-deploy-runbook.html",
]) {
  await cp(join(source, file), join(staticOutput, file));
}

await cp(join(source, "day-1-assets"), join(staticOutput, "day-1-assets"), {
  recursive: true,
});
await cp(
  join(root, "assets", "accessibility.css"),
  join(sharedAssetOutput, "accessibility.css"),
);
await cp(
  join(root, "assets", "favicon.svg"),
  join(sharedAssetOutput, "favicon.svg"),
);
await cp(join(root, "assets", "qr"), join(sharedAssetOutput, "qr"), {
  recursive: true,
});

const worker = `
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.redirect(
        new URL("/teaching/agentic-ai/", request.url).toString(),
        302,
      );
    }

    if (url.pathname.endsWith("/")) {
      url.pathname += "index.html";
    }

    return env.ASSETS.fetch(new Request(url, request));
  },
};

export default worker;
`;

await writeFile(join(serverOutput, "index.js"), worker.trimStart());
