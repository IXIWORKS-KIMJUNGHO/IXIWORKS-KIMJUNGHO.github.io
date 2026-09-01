import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import { Document } from "../src/components/document.tsx";
import { HomePage } from "../src/pages/home.tsx";
import { NewsPage } from "../src/pages/news-page.tsx";
import { PortfolioPage } from "../src/pages/portfolio-page.tsx";
import { TeachingHubPage } from "../src/pages/teaching-hub.tsx";

const root = resolve(import.meta.dirname, "..");
const stylesheetHref = "/assets/generated/site.css";
const siteScript = "/assets/generated/site.js";
const origin = "https://creativeengineer-kimjungho.com";
const ogImage = `${origin}/assets/creative-engineering-character-v2.jpg`;
const ogImageAlt =
  "Fictional animated maker-explorer character holding a translucent design panel";

function htmlDocument(node: ReactNode) {
  const markup = renderToStaticMarkup(node)
    .replaceAll("charSet=", "charset=")
    .replaceAll("fetchPriority=", "fetchpriority=")
    .replaceAll("dateTime=", "datetime=")
    .replace(/\s+defer=""/g, " defer")
    .replace(/\s+download=""/g, " download")
    .replace(/\s*\/>/g, ">");
  return `<!doctype html>\n${markup}\n`;
}

const pages = [
  {
    path: "index.html",
    node: createElement(
      Document,
      {
        title: "Kim Jungho | Creative Engineer & Researcher",
        description:
          "Creative engineer and researcher building production systems across generative AI, real-time 3D, and immersive media.",
        canonical: `${origin}/`,
        ogImage,
        ogImageAlt,
        stylesheetHref,
        extraScripts: [siteScript, "/assets/details-motion.js"],
        extraModuleScripts: ["/assets/course-prose.js"],
      },
      createElement(HomePage),
    ),
  },
  {
    path: "news.html",
    node: createElement(
      Document,
      {
        title: "News | Kim Jungho",
        description:
          "A compact timeline of research, production, exhibitions, teaching, and company updates.",
        canonical: `${origin}/news.html`,
        ogImage,
        ogImageAlt,
        stylesheetHref,
        extraModuleScripts: ["/assets/course-prose.js"],
      },
      createElement(NewsPage),
    ),
  },
  {
    path: "portfolio.html",
    node: createElement(
      Document,
      {
        title: "Portfolio | Kim Jungho",
        description:
          "A compact index of selected case studies across generative AI, digital twins, real-time systems, and exhibition media.",
        canonical: `${origin}/portfolio.html`,
        ogImage,
        ogImageAlt,
        stylesheetHref,
        extraModuleScripts: ["/assets/course-prose.js"],
      },
      createElement(PortfolioPage),
    ),
  },
  {
    path: "teaching/index.html",
    node: createElement(
      Document,
      {
        title: "Teaching | Kim Jungho",
        description:
          "Public course materials and project-based teaching across agentic AI, Unity, Unreal Engine, creative coding, and media art programming.",
        canonical: `${origin}/teaching/`,
        ogImage: `${origin}/teaching/agentic-ai/day-1-assets/embedded-81b732575b07d71e.jpg`,
        ogImageAlt: "Cinematic storyboard scene used in the agentic AI workshop",
        twitterCard: "summary_large_image",
        bodyClass: "teaching-index teaching-archive",
        stylesheetHref,
        extraStylesheets: ["/assets/teaching.css?v=teaching1"],
        extraModuleScripts: ["/assets/course-prose.js"],
      },
      createElement(TeachingHubPage),
    ),
  },
];

export async function renderPublicPages(rootDirectory = root) {
  for (const page of pages) {
    const outputPath = resolve(rootDirectory, page.path);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, htmlDocument(page.node));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await renderPublicPages();
  console.log("Rendered public React pages.");
}
