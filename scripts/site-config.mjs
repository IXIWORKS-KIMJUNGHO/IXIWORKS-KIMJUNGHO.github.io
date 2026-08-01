import { relative } from "node:path";

export const SITE_ORIGIN = "https://creativeengineer-kimjungho.com";

export const TEACHING_SHARE_IMAGES = Object.freeze({
  "agentic-ai": Object.freeze({
    path: "/teaching/agentic-ai/day-1-assets/embedded-81b732575b07d71e.jpg",
    alt: "Cinematic storyboard scene used in the agentic AI workshop",
  }),
  "game-engine": Object.freeze({
    path: "/teaching/game-engine/assets/09_final-rendered-frame.webp",
    alt: "Final cinematic environment rendered for the Game Engine course",
  }),
  "media-art-programming": Object.freeze({
    path: "/teaching/media-art-programming/assets/7week/09_finished-examples-gallery.png",
    alt: "Four interactive creative coding outcomes from the Media Art Programming course",
  }),
});

function relativeWebPath(root, path) {
  return relative(root, path).split("\\").join("/");
}

export function publicUrlForHtml(root, htmlPath) {
  const relativePath = relativeWebPath(root, htmlPath);
  if (relativePath === "index.html") return `${SITE_ORIGIN}/`;
  if (relativePath.endsWith("/index.html")) {
    return `${SITE_ORIGIN}/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${SITE_ORIGIN}/${relativePath}`;
}

export function shareImageMetadataForHtml(root, htmlPath) {
  const relativePath = relativeWebPath(root, htmlPath);
  let image = {
    path: "/assets/creative-engineering-character-v2.jpg",
    alt: "Fictional animated maker-explorer character holding a translucent design panel",
  };

  for (const [course, candidate] of Object.entries(TEACHING_SHARE_IMAGES)) {
    if (relativePath.startsWith(`teaching/${course}/`)) {
      image = candidate;
      break;
    }
  }
  if (relativePath === "teaching/index.html") {
    image = TEACHING_SHARE_IMAGES["agentic-ai"];
  }

  return { url: `${SITE_ORIGIN}${image.path}`, alt: image.alt };
}
