import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_ORIGIN, TEACHING_SHARE_IMAGES } from "./site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const teachingRoot = resolve(root, "teaching");
const stylesheet = '  <link rel="stylesheet" href="/assets/teaching.css?v=teaching1">';
const detailsMotionScript =
  '  <script src="/assets/details-motion.js" defer></script>';

const courses = {
  "agentic-ai": {
    label: "Agentic AI Workshop",
    documentOrder: [
      "schedule.html",
      "day-1.html",
      "mentoring-groups.html",
      "day1-install-runbook.html",
      "agent-rules.html",
      "day4-deploy-runbook.html",
    ],
    detailDocuments: new Set([
      "mentoring-groups.html",
      "day1-install-runbook.html",
      "agent-rules.html",
      "day4-deploy-runbook.html",
    ]),
    exceptions: new Set(["day-1.html"]),
  },
  "game-engine": {
    label: "Game Engine II",
    kicker: "Unreal Engine / Real-time production",
    title: "Game Engine II",
    lead: "Unreal Engine, real-time production, interactive systems, and cinematic project-based prototyping course materials.",
    kind: "Unreal Engine course",
    term: "36 public handouts",
    image: "assets/09_final-rendered-frame.webp",
    imageWidth: 1672,
    imageHeight: 941,
    shareImage: TEACHING_SHARE_IMAGES["game-engine"],
    sectionNote: "Course materials grouped by production topic and class session.",
  },
  "contents-programming": {
    label: "Contents Programming Practice",
  },
  "game-engine-1": {
    label: "Game Engine I",
    navigationOverrides: {
      "week-01-ot.html": {
        next: {
          href: "./#week-02",
          title: "2주차 강의 자료",
        },
      },
      "week-02-foundations.html": {
        previous: null,
        next: null,
      },
      "week-02-period1.html": {
        previous: {
          href: "./#week-02",
          title: "2주차 강의 자료",
        },
      },
      "week-02-period3.html": {
        next: {
          href: "week-03-period1.html",
          title: "3주차 1교시: C# 코드를 읽는 법 | Game Engine I",
        },
      },
      "week-03-period1.html": {
        previous: {
          href: "week-02-period3.html",
          title: "2주차 3교시: 작은 Playground 완성 미션 | Game Engine I",
        },
      },
    },
  },
  "media-art-programming": {
    label: "Media Art Programming",
    kicker: "p5.js / Creative coding / Media art",
    title: "Media Art Programming Practice",
    lead: "p5.js 기반 프로그래밍 입문부터 생성적 드로잉, 인터랙션, 데이터, 물리, 사운드 기반 미디어아트 제작까지 이어지는 실습 과정입니다.",
    kind: "Creative coding course",
    term: "Spring 2026",
    image: "assets/7week/09_finished-examples-gallery.png",
    imageWidth: 2400,
    imageHeight: 1180,
    shareImage: TEACHING_SHARE_IMAGES["media-art-programming"],
    sectionNote: "15주 과정의 개념 강의와 학생 주도 실습 자료입니다.",
  },
};

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function plainText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withBodyClasses(html, classes) {
  return html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    const existing = attributes.match(/\bclass="([^"]*)"/i)?.[1] ?? "";
    const merged = [...new Set([...existing.split(/\s+/), ...classes].filter(Boolean))].join(" ");
    const withoutClass = attributes.replace(/\s*\bclass="[^"]*"/i, "");
    return `<body class="${merged}"${withoutClass}>`;
  });
}

function withSharedStylesheet(html) {
  let result = html.replace(
    /\s*<link\b[^>]*href="\/assets\/teaching\.css[^>]*>\s*/gi,
    "\n",
  );
  result = result.replace(
    /@import\s+url\([^)]+pretendard[^)]+\);?/gi,
    "",
  );
  const accessibilityLink = /[ \t]*<link rel="stylesheet" href="\/assets\/accessibility\.css">/i;
  if (accessibilityLink.test(result)) {
    return result.replace(
      accessibilityLink,
      `${stylesheet}\n  <link rel="stylesheet" href="/assets/accessibility.css">`,
    );
  }
  return result.replace(/<\/head>/i, `${stylesheet}\n</head>`);
}

function withTeachingDetailsMotion(html) {
  const withoutScript = html.replace(
    /\s*<script\b[^>]*src="\/assets\/(?:teaching-details|details-motion)\.js"[^>]*><\/script>\s*/gi,
    "\n",
  );

  if (!/<details\b/i.test(withoutScript)) return withoutScript;

  return withoutScript.replace(
    /<\/body>/i,
    `${detailsMotionScript}\n</body>`,
  );
}

function removeGeneratedShell(html) {
  return html.replace(
    /\s*<header class="lesson-header" data-teaching-shell="v1">[\s\S]*?<\/header>\s*/gi,
    "\n",
  );
}

function removeLegacyDocumentHeader(html) {
  return html
    .replace(/\s*<div class="topbar"><div class="topbar-inner">[\s\S]*?<\/div><\/div>\s*/i, "\n")
    .replace(/\s*<nav class="topbar"[\s\S]*?<\/nav>\s*/i, "\n")
    .replace(/\s*<header class="site-header">[\s\S]*?<\/header>\s*/i, "\n");
}

function lessonNavigationCopy(course, current) {
  const usesKoreanCopy = course === "contents-programming";

  return usesKoreanCopy
    ? {
        navigationLabel: "강의 이동",
        previousText: "이전",
        nextText: "다음",
      }
    : {
        navigationLabel: "Course",
        previousText: "Previous",
        nextText: "Next",
      };
}

function lessonHeader(course, current, previous, next, titles) {
  const config = courses[course];
  const copy = lessonNavigationCopy(course, current);
  const titleFor = (name) => {
    const title = titles.get(name) ?? name;
    return config.detailDocuments?.has(current)
      ? title.replace(/[—–]/g, "-")
      : title;
  };
  const linkTarget = (target) =>
    typeof target === "string"
      ? { href: target, title: titleFor(target) }
      : target;
  const previousTarget = linkTarget(previous);
  const nextTarget = linkTarget(next);
  const previousLink = previousTarget
    ? `<a href="${escapeAttribute(previousTarget.href)}" rel="prev" aria-label="이전 자료: ${escapeAttribute(previousTarget.title)}">← <span class="sequence-label">${copy.previousText}</span></a>`
    : "";
  const nextLink = nextTarget
    ? `<a href="${escapeAttribute(nextTarget.href)}" rel="next" aria-label="다음 자료: ${escapeAttribute(nextTarget.title)}"><span class="sequence-label">${copy.nextText}</span> →</a>`
    : "";

  return `  <header class="lesson-header" data-teaching-shell="v1">
    <nav class="lesson-header-inner" aria-label="${copy.navigationLabel}">
      <div class="lesson-breadcrumb">
        <a class="lesson-home" href="/">Kim Jungho</a>
        <span aria-hidden="true">/</span>
        <a href="/teaching/">Teaching</a>
        <span aria-hidden="true">/</span>
        <a class="lesson-course" href="./">${config.label}</a>
      </div>
      <div class="lesson-sequence">
        ${previousLink}
        ${nextLink}
      </div>
    </nav>
  </header>`;
}

async function documentOrder(course) {
  const config = courses[course];
  if (config.documentOrder) return config.documentOrder;

  const indexHtml = await readFile(resolve(teachingRoot, course, "index.html"), "utf8");
  return [...new Set(
    [...indexHtml.matchAll(/href="([^"#?]+\.html)"/gi)].map((match) => match[1]),
  )];
}

async function refreshDocuments(
  course,
  { selectedDocuments = null, writeChanges = true } = {},
) {
  const config = courses[course];
  const directory = resolve(teachingRoot, course);
  const order = await documentOrder(course);
  const available = new Set(
    (await readdir(directory)).filter(
      (name) => name.endsWith(".html") && !name.endsWith(".bundle.html"),
    ),
  );
  const documents = order.filter((name) => available.has(name));
  const titles = new Map();

  for (const name of documents) {
    const html = await readFile(resolve(directory, name), "utf8");
    titles.set(name, plainText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? name));
  }

  let changed = 0;
  for (const [index, name] of documents.entries()) {
    if (config.exceptions?.has(name)) continue;
    if (selectedDocuments && !selectedDocuments.has(name)) continue;

    const path = resolve(directory, name);
    const before = await readFile(path, "utf8");
    let after = removeGeneratedShell(before);
    after = removeLegacyDocumentHeader(after);
    after = withBodyClasses(after, ["teaching-document", `course-${course}`]);
    after = withSharedStylesheet(after);
    after = withTeachingDetailsMotion(after);

    const navigationOverride = config.navigationOverrides?.[name] ?? {};
    const navigationTarget = (direction, fallback) =>
      Object.hasOwn(navigationOverride, direction)
        ? navigationOverride[direction]
        : fallback;
    const header = lessonHeader(
      course,
      name,
      navigationTarget("previous", documents[index - 1]),
      navigationTarget("next", documents[index + 1]),
      titles,
    );
    const skipLink = /<a\b[^>]*class="[^"]*\bskip-link\b[^"]*"[^>]*>[\s\S]*?<\/a>/i;
    after = skipLink.test(after)
      ? after.replace(skipLink, (match) => `${match}\n${header}`)
      : after.replace(/<body\b[^>]*>/i, (match) => `${match}\n${header}`);
    after = after.replace(/[ \t]+$/gm, "");

    if (after !== before) {
      if (writeChanges) await writeFile(path, after);
      changed += 1;
    }
  }

  return changed;
}

function primaryNavigation() {
  return `  <header class="site-header">
    <nav class="nav" aria-label="Primary">
      <a class="brand" href="/">Kim Jungho</a>
      <a href="/news.html">News</a>
      <a href="/portfolio.html">Work</a>
      <a href="/#research">Research</a>
      <a href="/teaching/" aria-current="page">Teaching</a>
      <a href="/#cv-archive">CV</a>
    </nav>
  </header>`;
}

function courseHero(course) {
  const config = courses[course];
  return `  <header class="course-hero">
    <div class="course-hero-inner">
      <div>
        <p class="course-kicker">${config.kicker}</p>
        <h1>${config.title}</h1>
        <p class="course-lead">${config.lead}</p>
        <div class="course-meta" aria-label="Course information">
          <span class="course-kind">${config.kind}</span>
          <span class="course-term">${config.term}</span>
        </div>
      </div>
      <figure class="course-visual">
        <img src="${config.image}" width="${config.imageWidth}" height="${config.imageHeight}" loading="eager" fetchpriority="high" decoding="async" alt="${config.shareImage.alt}">
      </figure>
    </div>
  </header>`;
}

function courseJump(mainContent) {
  const weeks = [...mainContent.matchAll(/id="(week-\d+)"[^>]*>Week\s+(\d+)/gi)]
    .map((match) => ({ id: match[1], label: `Week ${match[2]}` }))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
  const links = weeks.map((week) => `<a href="#${week.id}">${week.label}</a>`).join("\n      ");
  return `  <div class="course-jump-wrap">
    <nav class="course-jump" aria-label="Course weeks">
      ${links}
    </nav>
  </div>`;
}

function updateCourseMetadata(html, course) {
  const config = courses[course];
  const imageUrl = `${SITE_ORIGIN}${config.shareImage.path}`;
  return html
    .replace(/<meta property="og:image" content="[^"]+">/i, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta property="og:image:alt" content="[^"]+">/i, `<meta property="og:image:alt" content="${config.shareImage.alt}">`)
    .replace(/<meta name="twitter:card" content="[^"]+">/i, '<meta name="twitter:card" content="summary_large_image">')
    .replace(/<meta name="twitter:image" content="[^"]+">/i, `<meta name="twitter:image" content="${imageUrl}">`);
}

async function refreshCourseIndex(course) {
  const config = courses[course];
  const path = resolve(teachingRoot, course, "index.html");
  const before = await readFile(path, "utf8");
  const head = before.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  const main = before.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!head || !main) throw new Error(`Could not parse ${course}/index.html`);

  let updatedHead = head
    .replace(/\s*<style\b[\s\S]*?<\/style>\s*/gi, "\n")
    .replace(/\s*<link\b[^>]*href="\/assets\/teaching\.css[^>]*>\s*/gi, "\n");
  const accessibilityLink = /[ \t]*<link rel="stylesheet" href="\/assets\/accessibility\.css">/i;
  if (accessibilityLink.test(updatedHead)) {
    updatedHead = updatedHead.replace(
      accessibilityLink,
      `${stylesheet}\n  <link rel="stylesheet" href="/assets/accessibility.css">`,
    );
  } else {
    updatedHead += `\n${stylesheet}\n  <link rel="stylesheet" href="/assets/accessibility.css">\n`;
  }

  let updatedMain = main
    .replace(/\s*<footer class="course-footer">[\s\S]*?<\/footer>\s*$/i, "")
    .replace(/<section aria-labelledby=/i, '<section class="course-section" aria-labelledby=')
    .replace(/class="section-title"/i, 'class="course-section-title"')
    .replace(/<span class="week-heading-rule"[^>]*><\/span>/gi, "")
    .replace(/<span class="open-label">Open<\/span>/gi, '<span class="open-label" aria-hidden="true">↗</span>');

  const heading = updatedMain.match(/<h2 class="course-section-title"[\s\S]*?<\/h2>/i)?.[0];
  if (heading && !updatedMain.includes("course-section-heading")) {
    updatedMain = updatedMain.replace(
      heading,
      `<header class="course-section-heading">\n        ${heading}\n        <p class="course-section-note">${config.sectionNote}</p>\n      </header>`,
    );
  }

  if (course === "media-art-programming") {
    updatedMain = updatedMain
      .replaceAll(" · ", " / ")
      .replace(/<span class="material-meta">[\s\S]*?<\/span>/gi, "");
  }

  const rebuilt = `<!doctype html>
<html lang="ko">
<head>${updatedHead}</head>
<body class="teaching-index course-${course}">
  <a class="skip-link" href="#main-content">본문 바로가기</a>
${primaryNavigation()}
${courseHero(course)}
${courseJump(updatedMain)}
  <main id="main-content" class="course-content">
${updatedMain.trim()}
    <footer class="course-footer">
      <a href="/teaching/">← Teaching archive</a>
      <span>Kim Jungho / 2026</span>
    </footer>
  </main>
</body>
</html>
`;
  const after = updateCourseMetadata(rebuilt, course).replace(/[ \t]+$/gm, "");
  if (after !== before) await writeFile(path, after);
}

function parseArguments(argumentsList) {
  const valueAfter = (flag) => {
    const index = argumentsList.indexOf(flag);
    return index === -1 ? null : argumentsList[index + 1] ?? null;
  };
  const course = valueAfter("--course");
  const documentList = valueAfter("--documents");
  const check = argumentsList.includes("--check");
  if (check && !course) {
    throw new Error("--check requires --course");
  }
  if (documentList && !course) {
    throw new Error("--documents requires --course");
  }
  if (course && !courses[course]) {
    throw new Error(`Unknown teaching course: ${course}`);
  }
  return {
    check,
    course,
    selectedDocuments: documentList
      ? new Set(documentList.split(",").filter(Boolean))
      : null,
  };
}

async function refreshAll(options = {}) {
  const { check = false, course = null, selectedDocuments = null } = options;
  if (course) {
    const changedDocuments = await refreshDocuments(course, {
      selectedDocuments,
      writeChanges: !check,
    });
    if (check) {
      console.log(`${changedDocuments} document shell changes required.`);
      if (changedDocuments > 0) process.exitCode = 1;
    } else {
      console.log(`Refreshed ${changedDocuments} ${course} document shells.`);
    }
    return;
  }

  await refreshCourseIndex("game-engine");
  await refreshCourseIndex("media-art-programming");

  let changedDocuments = 0;
  for (const course of Object.keys(courses)) {
    changedDocuments += await refreshDocuments(course);
  }
  console.log(`Refreshed Teaching indexes and ${changedDocuments} document shells.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await refreshAll(parseArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
