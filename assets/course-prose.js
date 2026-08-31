import {
  layoutWithLines,
  prepareWithSegments,
  setLocale,
} from "/assets/vendor/pretext/layout.js";

// @chenglou/pretext 0.0.8 — CJK lines fill the existing measure instead of
// wrapping at phrase boundaries.

const paragraphSelector = [
  ".course-prose > p",
  ".course-disclosure-content > p",
  "article.article > p",
  ".orientation-opening-copy > p",
  ".details-motion-content > p",
  ".callout > p:not(.callout-title)",
  ".official-work-panel > p",
].join(", ");
const states = new WeakMap();

function sourceText(paragraph) {
  return paragraph.getAttribute("data-pretext-source") || paragraph.textContent;
}

function canvasFont(style) {
  return `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function lineHeightPx(style) {
  const lineHeight = parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight)) return lineHeight;
  return parseFloat(style.fontSize) * 1.9;
}

function letterSpacingPx(style) {
  if (!style.letterSpacing.endsWith("px")) return 0;
  const value = parseFloat(style.letterSpacing);
  return Number.isFinite(value) ? value : 0;
}

function insertBreakAtOffset(root, offset) {
  let remaining = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const length = node.data.length;
    if (remaining === 0) {
      node.parentNode.insertBefore(document.createElement("br"), node);
      return;
    }
    if (remaining < length) {
      const rest = node.splitText(remaining);
      rest.parentNode.insertBefore(document.createElement("br"), rest);
      return;
    }
    if (remaining === length) {
      node.parentNode.insertBefore(
        document.createElement("br"),
        node.nextSibling,
      );
      return;
    }
    remaining -= length;
  }
}

function renderLines(paragraph, html, lines) {
  paragraph.innerHTML = html;
  let offset = 0;
  for (let index = 0; index < lines.length - 1; index += 1) {
    offset += lines[index].text.length;
    insertBreakAtOffset(paragraph, offset);
  }
  paragraph.setAttribute("data-pretext-laid-out", "");
}

function layoutParagraph(paragraph) {
  const width = paragraph.clientWidth;
  if (width < 8) return;

  let state = states.get(paragraph);
  if (!state) {
    const source = sourceText(paragraph);
    paragraph.setAttribute("data-pretext-source", source);
    const style = getComputedStyle(paragraph);
    state = {
      html: paragraph.innerHTML,
      width: 0,
      lineHeight: lineHeightPx(style),
      prepared: prepareWithSegments(source, canvasFont(style), {
        wordBreak: "normal",
        letterSpacing: letterSpacingPx(style),
      }),
    };
    states.set(paragraph, state);
  }

  if (state.width === width) return;
  state.width = width;
  const { lines } = layoutWithLines(state.prepared, width, state.lineHeight);
  renderLines(paragraph, state.html, lines);
}

async function start() {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
    return;
  }

  setLocale("ko");
  if (document.fonts?.ready) await document.fonts.ready;

  const paragraphs = [...document.querySelectorAll(paragraphSelector)];
  if (paragraphs.length === 0) return;

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) layoutParagraph(entry.target);
  });

  for (const paragraph of paragraphs) {
    const details = paragraph.closest("details");
    if (details) {
      details.addEventListener("toggle", () => {
        if (details.open) layoutParagraph(paragraph);
      });
    }
    observer.observe(paragraph);
    layoutParagraph(paragraph);
  }
}

start();
