import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { buildSitesStatic } from "../scripts/build-sites-static.mjs";
import { findPublicHtmlFiles } from "../scripts/public-html-files.mjs";
import {
  publicUrlForHtml,
  shareImageMetadataForHtml,
} from "../scripts/site-config.mjs";

const root = resolve(import.meta.dirname, "..");
const htmlFiles = await findPublicHtmlFiles(root);

function displayPath(path) {
  return relative(root, path);
}

test("published links use valid, non-nested anchors", async () => {
  const malformed = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");

    for (const match of html.matchAll(/href="([^"]+)"/gi)) {
      if (match[1].endsWith(")")) {
        malformed.push(`${displayPath(path)}: href ends with ) (${match[1]})`);
      }
    }

    let openAnchor = false;
    for (const match of html.matchAll(/<a\b[^>]*>|<\/a\s*>/gi)) {
      if (match[0].startsWith("</")) {
        openAnchor = false;
      } else if (openAnchor) {
        malformed.push(`${displayPath(path)}: nested anchor (${match[0].slice(0, 90)})`);
      } else {
        openAnchor = true;
      }
    }
  }

  assert.deepEqual(malformed, []);
});

test("published content uses the custom domain", async () => {
  const legacyHostReferences = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    if (html.includes("ixiworks-kimjungho.github.io")) {
      legacyHostReferences.push(displayPath(path));
    }
  }

  assert.deepEqual(legacyHostReferences, []);
});

test("published pages use the non-personal character artwork", async () => {
  const portraitReferences = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    if (/cv-photo\.png|Kim Jungho portrait|Portrait of Kim Jungho/i.test(html)) {
      portraitReferences.push(displayPath(path));
    }
  }

  assert.deepEqual(portraitReferences, []);
  await assert.rejects(
    stat(resolve(root, "assets", "cv-photo.png")),
    (error) => error.code === "ENOENT",
  );

  await assert.rejects(
    stat(resolve(root, "assets", "creative-engineering-artifact.jpg")),
    (error) => error.code === "ENOENT",
  );

  await assert.rejects(
    stat(resolve(root, "assets", "creative-engineering-character-v1.jpg")),
    (error) => error.code === "ENOENT",
  );

  const artworkPath = resolve(
    root,
    "assets",
    "creative-engineering-character-v2.jpg",
  );
  assert.ok((await stat(artworkPath)).size > 0);

  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  assert.match(homepage, /class="identity-artwork"/);
  assert.match(homepage, /creative-engineering-character-v2\.jpg/);
  assert.match(homepage, /width="1200" height="1200"/);
});

test("motion preferences and touch pointers are respected", async () => {
  const accessibilityCssPath = resolve(root, "assets", "accessibility.css");
  const accessibilityCss = await readFile(accessibilityCssPath, "utf8");

  assert.match(accessibilityCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(accessibilityCss, /hover:\s*none/);
  assert.match(accessibilityCss, /pointer:\s*coarse/);
  assert.match(accessibilityCss, /:active/);
  assert.match(accessibilityCss, /:focus-visible/);
  assert.match(accessibilityCss, /\.material-card[^}]*:hover[\s\S]*?background:/);
  assert.match(accessibilityCss, /\.toc a[^}]*:hover[\s\S]*?background:/);
  for (const selector of ["archive-link", "copy-button", "reset-button"]) {
    assert.match(
      accessibilityCss,
      new RegExp(`\\.${selector}[^}]*:hover[\\s\\S]*?background:`),
    );
  }

  const pagesMissingTheStylesheet = [];
  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    if (
      html.includes("scroll-behavior: smooth") &&
      !html.includes("/assets/accessibility.css")
    ) {
      pagesMissingTheStylesheet.push(displayPath(path));
    }
  }

  assert.deepEqual(pagesMissingTheStylesheet, []);
});

test("prominent link cards provide shared press feedback", async () => {
  const accessibilityCss = await readFile(
    resolve(root, "assets", "accessibility.css"),
    "utf8",
  );
  const pressRule = accessibilityCss.match(
    /:where\(([^)]*)\):active\s*\{([^}]*)\}/,
  );

  assert.ok(pressRule, "the shared active rule should exist");
  for (const selector of [
    ".featured-project",
    ".project-row",
    ".teaching-row[href]",
    ".featured-course",
    ".material-card[href]",
  ]) {
    assert.ok(
      pressRule[1].includes(selector),
      `${selector} should use the shared active rule`,
    );
  }
  assert.match(pressRule[2], /transform:\s*scale\(0\.98\)/);
  assert.match(
    accessibilityCss,
    /featured-project[\s\S]*?:active\s*\{[\s\S]*?transition:\s*transform 120ms var\(--ease-out/,
  );
  assert.match(
    accessibilityCss,
    /prefers-reduced-motion:\s*reduce[\s\S]*?featured-project[\s\S]*?transition:\s*opacity 100ms linear !important[\s\S]*?:active[\s\S]*?opacity:\s*0\.86[\s\S]*?transform:\s*none/,
  );

  const homepageCss = await readFile(resolve(root, "assets", "cv.css"), "utf8");
  for (const selector of ["featured-project", "project-row", "teaching-row"]) {
    assert.match(
      homepageCss,
      new RegExp(
        `\\.${selector}[^}]*\\{[^}]*transition:[^}]*transform 120ms var\\(--ease-out\\)`,
      ),
    );
  }

  const teachingCss = await readFile(
    resolve(root, "assets", "teaching.css"),
    "utf8",
  );
  for (const selector of ["featured-course", "material-card"]) {
    assert.match(
      teachingCss,
      new RegExp(
        `\\.${selector}[^}]*\\{[^}]*transition:[^}]*transform 120ms var\\(--ease-out\\)`,
      ),
    );
  }
});

test("lift interactions are reserved for actionable cards", async () => {
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const news = await readFile(resolve(root, "news.html"), "utf8");

  assert.doesNotMatch(homepage, /\.project-card:hover/);
  assert.doesNotMatch(homepage, /\.course-card:hover/);
  assert.doesNotMatch(news, /\.news-item:hover/);
});

test("the homepage presents an evidence-first, printable CV", async () => {
  const homepage = await readFile(resolve(root, "index.html"), "utf8");
  const homepageCss = await readFile(resolve(root, "assets", "cv.css"), "utf8");

  const workIndex = homepage.indexOf('id="work"');
  const researchIndex = homepage.indexOf('id="research"');
  const backgroundIndex = homepage.indexOf('id="cv-archive"');
  const teachingIndex = homepage.indexOf('id="teaching"');
  const newsIndex = homepage.indexOf('id="news"');

  assert.ok(workIndex > -1, "the selected work section should exist");
  assert.ok(workIndex < researchIndex, "selected work should precede research");
  assert.ok(researchIndex < backgroundIndex, "research should precede background");
  assert.ok(backgroundIndex < teachingIndex, "background should precede teaching");
  assert.ok(teachingIndex < newsIndex, "news should close the CV narrative");

  assert.match(homepage, /aria-label="CV highlights"/);
  assert.match(
    homepage,
    /href="\/assets\/kim-jungho-cv\.pdf"[^>]*\bdownload\b/,
  );
  assert.match(homepage, /class="featured-project"/);
  assert.match(homepage, /class="project-row"/);
  assert.match(homepage, /https:\/\/doi\.org\/10\.1007\/978-981-97-8093-8_6/);
  assert.doesNotMatch(homepage, /data-work-system-map|data-axis=/);
  assert.doesNotMatch(homepage, /<article class="(?:featured-project|project-row)"/);
  assert.doesNotMatch(homepage, /fonts\.googleapis\.com/);

  assert.doesNotMatch(homepageCss, /linear-gradient\(/);
  assert.match(homepageCss, /fonts\/inter-latin-variable\.woff2/);
  assert.match(
    homepageCss,
    /@media\s+\(hover:\s*hover\)\s+and\s+\(pointer:\s*fine\)[\s\S]*?\.project-row:hover/,
  );
  assert.match(homepageCss, /\.work-tail\s*\{\s*break-inside:\s*avoid;/);
  assert.match(homepageCss, /@media\s+print/);
  assert.match(homepageCss, /prefers-color-scheme:\s*dark/);
});

test("the work index and case studies share the CV design system", async () => {
  const workPages = [
    "portfolio.html",
    "projects/digital-twin-pipeline.html",
    "projects/generative-ai-storyboard.html",
    "projects/hyundai-mobis-connect.html",
    "projects/spectrum-of-humanity.html",
    "projects/vive-ai-uiux.html",
  ];

  for (const relativePath of workPages) {
    const html = await readFile(resolve(root, relativePath), "utf8");
    assert.match(html, /portfolio\.css\?v=evidence2/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }

  const workIndex = await readFile(resolve(root, "portfolio.html"), "utf8");
  const workCss = await readFile(resolve(root, "assets", "portfolio.css"), "utf8");
  assert.equal([...workIndex.matchAll(/class="case-thumb"/g)].length, 5);
  assert.match(workCss, /fonts\/inter-latin-variable\.woff2/);
  assert.match(workCss, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(workCss, /(?:linear|radial|repeating-linear)-gradient\(/);
});

test("the news index uses the shared CV design system", async () => {
  const news = await readFile(resolve(root, "news.html"), "utf8");
  const newsCss = await readFile(resolve(root, "assets", "news.css"), "utf8");

  assert.match(news, /portfolio\.css\?v=evidence2/);
  assert.match(news, /news\.css\?v=evidence2/);
  assert.doesNotMatch(news, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(newsCss, /\.news-item\s*\{[\s\S]*?border-bottom:/);
  assert.doesNotMatch(newsCss, /(?:linear|radial|repeating-linear)-gradient\(/);
});

test("the teaching archive has a shared, course-first design system", async () => {
  const teachingIndex = await readFile(
    resolve(root, "teaching", "index.html"),
    "utf8",
  );
  const teachingCss = await readFile(
    resolve(root, "assets", "teaching.css"),
    "utf8",
  );
  const courseIndexes = [
    "teaching/agentic-ai/index.html",
    "teaching/contents-programming/index.html",
    "teaching/game-engine-1/index.html",
    "teaching/game-engine/index.html",
    "teaching/media-art-programming/index.html",
  ];

  for (const href of [
    "agentic-ai/",
    "contents-programming/",
    "game-engine-1/",
    "game-engine/",
    "media-art-programming/",
  ]) {
    assert.match(teachingIndex, new RegExp(`href="${href.replace("/", "\\/")}"`));
  }
  assert.match(teachingIndex, /class="featured-course"/);
  assert.match(teachingIndex, /teaching\.css\?v=teaching1/);
  assert.doesNotMatch(teachingIndex, /<style\b|fonts\.googleapis\.com|cdn\.jsdelivr\.net/);

  for (const relativePath of courseIndexes) {
    const html = await readFile(resolve(root, relativePath), "utf8");
    assert.match(html, /class="teaching-index\b/);
    assert.match(html, /teaching\.css\?v=teaching1/);
    assert.doesNotMatch(html, /<style\b|fonts\.googleapis\.com|cdn\.jsdelivr\.net/);
  }

  assert.match(teachingCss, /fonts\/inter-latin-variable\.woff2/);
  assert.match(teachingCss, /prefers-color-scheme:\s*dark/);
  assert.match(teachingCss, /\.course-jump/);
  assert.match(teachingCss, /\.lesson-header/);
  assert.doesNotMatch(teachingCss, /(?:linear|radial|repeating-linear)-gradient\(/);
});

test("the Contents Programming course publishes its syllabus structure", async () => {
  const courseIndex = await readFile(
    resolve(root, "teaching", "contents-programming", "index.html"),
    "utf8",
  );

  for (const sectionId of [
    "course-overview",
    "course-goals",
    "learning-outcomes",
    "curriculum",
  ]) {
    assert.match(courseIndex, new RegExp(`id="${sectionId}"`));
  }

  assert.equal(
    [...courseIndex.matchAll(/class="week-group"/g)].length,
    16,
    "the course index should list all 16 weeks",
  );
  assert.match(courseIndex, /Python/);
  assert.match(courseIndex, /Google Colab/);
  assert.match(courseIndex, /class="material-card"/);
  assert.match(courseIndex, /Period 01/);
  assert.match(courseIndex, /href="week-01-ot\.html"/);
  assert.equal(
    [...courseIndex.matchAll(/class="course-disclosure"/g)].length,
    3,
    "overview, goals, and outcomes should be collapsible",
  );
  assert.match(courseIndex, /src="\/assets\/details-motion\.js" defer/);

  const orientation = await readFile(
    resolve(root, "teaching", "contents-programming", "week-01-ot.html"),
    "utf8",
  );
  for (const timeRange of [
    "0-10분",
    "10-40분",
    "40-70분",
    "70-82분",
    "82-88분",
    "88-90분",
    "교수자 진행 · 3분",
    "개별 활동 · 7분",
  ]) {
    assert.doesNotMatch(orientation, new RegExp(timeRange.replaceAll("·", "·")));
  }
  assert.match(orientation, /same-data-three-outputs\.svg/);
  assert.match(orientation, /https:\/\/reas\.com\/process/);
  assert.match(orientation, /https:\/\/www\.dear-data\.com\/theproject/);
  for (const [assetName, officialUrl] of [
    ["flight-patterns-system.svg", "https://www.aaronkoblin.com/work/flightpatterns/"],
    ["wind-map-system.svg", "https://www.moma.org/collection/works/163892"],
    ["pulse-room-system.svg", "https://www.lozano-hemmer.com/pulse_room.php"],
  ]) {
    assert.ok(orientation.includes(assetName));
    assert.ok(orientation.includes(officialUrl));
  }
  assert.doesNotMatch(orientation, /짝 활동|짝과|조별 활동/);
});

test("Contents Programming week 2 teaches execution before variables and types", async () => {
  const courseDirectory = resolve(root, "teaching", "contents-programming");
  const courseIndex = await readFile(resolve(courseDirectory, "index.html"), "utf8");
  const period1 = await readFile(
    resolve(courseDirectory, "week-02-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-02-period2.html"),
    "utf8",
  );

  assert.match(courseIndex, /href="week-02-period1\.html"/);
  assert.match(courseIndex, /href="week-02-period2\.html"/);

  for (const [html, timeRanges] of [
    [
      period1,
      ["0-5분", "5-15분", "15-28분", "28-38분", "38-46분", "46-50분"],
    ],
    [
      period2,
      [
        "0-5분",
        "5-15분",
        "15-23분",
        "23-33분",
        "33-41분",
        "41-46분",
        "46-50분",
      ],
    ],
  ]) {
    for (const timeRange of timeRanges) {
      assert.match(html, new RegExp(timeRange));
    }
  }

  for (const [html, requiredPatterns] of [
    [
      period1,
      [
        /class="execution-model"/,
        /class="code-walkthrough"/,
        /class="notebook-model"/,
        /Python과 Google Colab은 무엇이 다른가/,
        /CPU와 메모리/,
        /수업 후 개별 복습/,
        /https:\/\/research\.google\.com\/colaboratory\/faq\.html/,
      ],
    ],
    [
      period2,
      [
        /class="assignment-visual"/,
        /class="trace-board"/,
        /class="type-grid"/,
        /class="generated-profile-grid"/,
        /week-02-data-profile-low\.png/,
        /week-02-data-profile-high\.png/,
        /weekly_hours.*막대 길이/s,
        /average_rating.*원 크기/s,
        /이미지 생성 문법.*학습 범위가 아닙니다/s,
        /class="error-anatomy"/,
        /int.*float.*str.*bool/s,
        /따옴표가 자료형을 바꾼다/,
        /수업 후 개별 복습/,
        /자기소개 노트북의 도착점/,
      ],
    ],
  ]) {
    assert.doesNotMatch(html, /짝 활동|짝과|조별 활동/);
    assert.ok(
      [...html.matchAll(/<details\b/gi)].length >= 4,
      "each lesson should include at least four individual answer checks",
    );
    for (const pattern of requiredPatterns) assert.match(html, pattern);
  }

  assert.match(period1, /href="week-02-period2\.html" rel="next"/);
  assert.match(period2, /href="week-02-period1\.html" rel="prev"/);
});

test("Contents Programming week 2 period 3 is a goal-based individual mission", async () => {
  const courseDirectory = resolve(root, "teaching", "contents-programming");
  const courseIndex = await readFile(resolve(courseDirectory, "index.html"), "utf8");
  const period2 = await readFile(
    resolve(courseDirectory, "week-02-period2.html"),
    "utf8",
  );
  const period3 = await readFile(
    resolve(courseDirectory, "week-02-period3.html"),
    "utf8",
  );
  const notebook = JSON.parse(
    await readFile(
      resolve(courseDirectory, "assets", "week-02-profile-mission.ipynb"),
      "utf8",
    ),
  );
  const notebookCode = notebook.cells
    .filter((cell) => cell.cell_type === "code")
    .flatMap((cell) => cell.source)
    .join("");

  assert.match(courseIndex, /href="week-02-period3\.html"/);
  assert.match(period2, /href="week-02-period3\.html" rel="next"/);
  assert.match(period3, /href="week-02-period2\.html" rel="prev"/);

  for (const pattern of [
    /목표 달성형 개인 실습/,
    /완료 즉시 제출 후 퇴실/,
    /속도는 평가하지 않습니다/,
    /class="mission-route"/,
    /class="exit-gate"/,
    /자동 검사 셀/,
    /WEEK 02 MISSION COMPLETE/,
    /런타임.*모두 실행/s,
    /week02_학번_이름\.ipynb/,
    /assets\/week-02-profile-mission\.ipynb/,
    /student_name.*major.*favorite_content.*weekly_hours.*average_rating.*wants_to_create/s,
    /monthly_hours\s*=\s*weekly_hours\s*\*\s*4/,
    /type\(student_name\) is str/,
    /type\(wants_to_create\) is bool/,
    /initial_weekly_hours != weekly_hours/,
    /mission_step1_execution.*mission_final_execution/s,
  ]) {
    assert.match(period3, pattern);
  }

  assert.equal(notebook.nbformat, 4);
  assert.equal(
    notebook.cells.filter((cell) => cell.cell_type === "code").length,
    5,
  );
  for (const pattern of [
    /student_name = "여기에 작성"/,
    /monthly_hours = weekly_hours \* 4/,
    /initial_output_snapshot/,
    /changed_output_snapshot/,
    /initial_weekly_hours != weekly_hours/,
    /initial_average_rating != average_rating/,
    /mission_stage == 4/,
    /mission_step1_execution.*mission_final_execution/s,
    /== \(1, 2, 3, 4, 5\)/,
    /WEEK 02 MISSION COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }

  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동/);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 4,
    "the goal-based practice should include at least four on-demand help panels",
  );
});

test("the Game Engine I course publishes its Unity 2D and generative AI curriculum", async () => {
  const courseIndex = await readFile(
    resolve(root, "teaching", "game-engine-1", "index.html"),
    "utf8",
  );

  for (const sectionId of [
    "course-overview",
    "course-goals",
    "learning-outcomes",
    "ai-workflow",
    "image-generation",
    "curriculum",
    "assessment",
    "project-rules",
  ]) {
    assert.match(courseIndex, new RegExp(`id="${sectionId}"`));
  }

  assert.equal(
    [...courseIndex.matchAll(/class="week-group"/g)].length,
    16,
    "the course index should list all 16 weeks",
  );
  assert.match(courseIndex, /Unity 6\.3 LTS/);
  assert.match(courseIndex, /Ask/);
  assert.match(courseIndex, /Plan/);
  assert.match(courseIndex, /Agent/);
  assert.match(courseIndex, /MCP/);
  assert.match(courseIndex, /CLI/);
  assert.match(courseIndex, /Sprite Generator/);
  assert.match(courseIndex, /Remove Background/);
  assert.match(courseIndex, /Inpaint/);
  assert.match(courseIndex, /스프라이트시트/);
  assert.match(courseIndex, /GeneratedAssets/);
  assert.match(courseIndex, /API key/);
  assert.match(courseIndex, /이론\(1시간\)/);
  assert.match(courseIndex, /실습\(2시간\)/);
  assert.equal(
    [...courseIndex.matchAll(/과제 [1-4]/g)].length,
    4,
    "the course should publish exactly four numbered assignments",
  );
  assert.match(courseIndex, /중간고사 · 추후 확정/);

  const finalRubric = [...courseIndex.matchAll(/<article class="rubric-card">([\s\S]*?)<\/article>/g)]
    .map((match) => match[1])
    .find((card) => card.includes("Week 16"));
  assert.ok(finalRubric, "the final project rubric should be present");
  assert.match(finalRubric, /기말 프로젝트 · 100점/);
  const finalScores = [...finalRubric.matchAll(/<dd>(\d+)<\/dd>/g)]
    .map((match) => Number(match[1]));
  assert.equal(
    finalScores.reduce((total, score) => total + score, 0),
    100,
    "the final rubric scores should add up to 100",
  );
});

test("the agentic AI course index keeps its mobile reading path intact", async () => {
  const courseIndex = await readFile(
    resolve(root, "teaching", "agentic-ai", "index.html"),
    "utf8",
  );
  const courseCss = await readFile(
    resolve(root, "assets", "agentic-ai-index.css"),
    "utf8",
  );

  assert.match(courseIndex, /class="course-facts"/);
  assert.match(courseIndex, /agentic-ai-index\.css\?v=readable1/);
  assert.match(courseCss, /body\.course-agentic-ai/);
  assert.match(courseCss, /@media\s+\(max-width:\s*760px\)/);
  assert.match(
    courseCss,
    /\.course-agentic-ai \.course-hero h1\s*\{[\s\S]*?font-size:\s*clamp\(/,
  );
  assert.match(
    courseCss,
    /\.course-agentic-ai \.material-title\s*\{[\s\S]*?font-size:\s*18px/,
  );
  assert.doesNotMatch(courseIndex, /[—–]/);
});

test("the agentic AI runbooks share a readable responsive document system", async () => {
  const handouts = [
    ["mentoring-groups.html", "document-mentoring"],
    ["day1-install-runbook.html", "document-install"],
    ["agent-rules.html", "document-rules"],
    ["day4-deploy-runbook.html", "document-deploy"],
  ];
  const handoutCss = await readFile(
    resolve(root, "assets", "agentic-ai-handouts.css"),
    "utf8",
  );

  for (const [name, pageClass] of handouts) {
    const html = await readFile(
      resolve(root, "teaching", "agentic-ai", name),
      "utf8",
    );

    assert.match(html, new RegExp(`class="[^"]*\\b${pageClass}\\b`));
    assert.match(html, /agentic-ai-handouts\.css\?v=readable1/);
    assert.match(html, /id="main-content"/);
    assert.doesNotMatch(html, /[—–]/);
  }

  assert.match(
    handoutCss,
    /body\.course-agentic-ai\.teaching-document\.handout-detail/,
  );
  assert.match(handoutCss, /font-size:\s*17px/);
  assert.match(handoutCss, /prefers-color-scheme:\s*dark/);
  assert.match(handoutCss, /@media\s+\(max-width:\s*760px\)/);
  assert.match(
    handoutCss,
    /\.handout-detail \.start-card[\s\S]*?background:\s*var\(--handout-paper\)/,
  );
});

test("teaching handouts provide consistent course and sequence navigation", async () => {
  const courseDirectories = [
    ["agentic-ai", new Set(["day-1.html"])],
    ["game-engine", new Set()],
    ["media-art-programming", new Set()],
  ];
  const violations = [];

  for (const [course, exceptions] of courseDirectories) {
    const directory = resolve(root, "teaching", course);
    const names = (await readdir(directory))
      .filter(
        (name) =>
          name.endsWith(".html") &&
          name !== "index.html" &&
          !name.endsWith(".bundle.html") &&
          !exceptions.has(name),
      );

    for (const name of names) {
      const html = await readFile(resolve(directory, name), "utf8");
      if (!/<body\b[^>]*class="[^"]*\bteaching-document\b/i.test(html)) {
        violations.push(`${course}/${name}: document class`);
      }
      if (!html.includes('data-teaching-shell="v1"')) {
        violations.push(`${course}/${name}: teaching shell`);
      }
      if (!html.includes('href="/teaching/"')) {
        violations.push(`${course}/${name}: teaching archive link`);
      }
      if (!html.includes('href="./"')) {
        violations.push(`${course}/${name}: course index link`);
      }
      if (!html.includes("teaching.css?v=teaching1")) {
        violations.push(`${course}/${name}: shared stylesheet`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("teaching details use the shared interruptible motion controller", async () => {
  const courseNames = [
    "game-engine",
    "media-art-programming",
    "contents-programming",
  ];
  const violations = [];
  let detailsDocuments = 0;
  let detailsElements = 0;

  for (const course of courseNames) {
    const directory = resolve(root, "teaching", course);
    const names = (await readdir(directory)).filter(
      (name) =>
        name.endsWith(".html") &&
        name !== "index.html" &&
        !name.endsWith(".bundle.html"),
    );

    for (const name of names) {
      const html = await readFile(resolve(directory, name), "utf8");
      const detailsCount = [...html.matchAll(/<details\b/gi)].length;
      const scriptCount = [
        ...html.matchAll(
          /<script\b[^>]*src="\/assets\/details-motion\.js"[^>]*><\/script>/gi,
        ),
      ].length;

      if (detailsCount > 0) {
        detailsDocuments += 1;
        detailsElements += detailsCount;
        if (scriptCount !== 1) {
          violations.push(`${course}/${name}: ${scriptCount} motion scripts`);
        }
      } else if (scriptCount !== 0) {
        violations.push(`${course}/${name}: motion script without details`);
      }
    }
  }

  assert.ok(detailsDocuments > 0, "the fixture should include details documents");
  assert.ok(detailsElements > 0, "the fixture should include details elements");
  assert.deepEqual(violations, []);

  const controller = await readFile(
    resolve(root, "assets", "details-motion.js"),
    "utf8",
  );
  assert.match(controller, /transitionend/);
  assert.match(controller, /propertyName === "opacity"/);
  assert.match(controller, /event\.preventDefault\(\)/);
  assert.match(controller, /event\.detail === 0/);
  assert.match(controller, /details\.open\s*=/);
  assert.match(
    controller,
    /details\.dataset\.detailsMotionInstant = "true"[\s\S]*?getBoundingClientRect\(\)[\s\S]*?delete details\.dataset\.detailsMotionInstant/,
  );
  assert.doesNotMatch(controller, /keydown/);
  assert.doesNotMatch(controller, /teaching-details-content/);

  const teachingCss = await readFile(
    resolve(root, "assets", "teaching.css"),
    "utf8",
  );
  assert.match(
    teachingCss,
    /--ease-out:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\)/,
  );
  assert.match(
    teachingCss,
    /--ease-in-out:\s*cubic-bezier\(0\.77, 0, 0\.175, 1\)/,
  );

  const motionCss = await readFile(
    resolve(root, "assets", "accessibility.css"),
    "utf8",
  );
  assert.match(
    motionCss,
    /details\[data-details-motion="ready"\] > \.details-motion-content/,
  );
  assert.match(motionCss, /transition-property:\s*opacity, transform/);
  assert.match(motionCss, /transform:\s*translateY\(-4px\)/);
  assert.match(motionCss, /transition:\s*opacity 200ms ease !important/);
  assert.match(
    motionCss,
    /data-details-motion-instant="true"[\s\S]*?transition:\s*none !important/,
  );
  assert.doesNotMatch(motionCss, /transition\s*:\s*all/i);
  assert.doesNotMatch(
    motionCss,
    /transition(?:-property)?\s*:[^;]*(?:max-)?height/i,
  );
  assert.doesNotMatch(teachingCss, /details-motion-content/);
});

test("the remaining public disclosures share the interruptible motion controller", async () => {
  const disclosurePages = [
    ["index.html", "archive-panel"],
    ["projects/generative-ai-storyboard.html", "architecture-disclosure"],
  ];

  for (const [relativePath, disclosureClass] of disclosurePages) {
    const html = await readFile(resolve(root, relativePath), "utf8");
    assert.match(html, new RegExp(`<details class="${disclosureClass}"`));
    assert.equal(
      [...html.matchAll(/<script\b[^>]*src="\/assets\/details-motion\.js"[^>]*><\/script>/gi)].length,
      1,
      `${relativePath} should load the disclosure controller once`,
    );
    assert.match(html, /\/assets\/accessibility\.css/);
  }

  const controller = await readFile(
    resolve(root, "assets", "details-motion.js"),
    "utf8",
  );
  assert.match(controller, /details\.archive-panel/);
  assert.match(controller, /details\.architecture-disclosure/);
  assert.match(controller, /details-motion-content/);

  const disclosureStyles = [
    ["assets/cv.css", "archive-panel"],
    ["assets/portfolio.css", "architecture-disclosure"],
  ];

  for (const [relativePath] of disclosureStyles) {
    const css = await readFile(resolve(root, relativePath), "utf8");
    assert.match(
      css,
      /--ease-out:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\)/,
    );
    assert.match(
      css,
      /--ease-in-out:\s*cubic-bezier\(0\.77, 0, 0\.175, 1\)/,
    );
    assert.doesNotMatch(css, /details-motion-content/);
    assert.doesNotMatch(
      css,
      /transition(?:-property)?\s*:[^;]*(?:max-)?height/i,
    );
  }

  const homepageCss = await readFile(resolve(root, "assets", "cv.css"), "utf8");
  assert.match(homepageCss, /archive-panel[\s\S]*?scaleY\(0\)/);
  assert.match(
    homepageCss,
    /archive-panel\[open\]:not\(\[data-details-motion="ready"\]\)/,
  );
  assert.match(
    homepageCss,
    /\.archive-panel summary::after\s*\{[^}]*transition:\s*transform 160ms var\(--ease-in-out\)/,
  );

  const portfolioCss = await readFile(
    resolve(root, "assets", "portfolio.css"),
    "utf8",
  );
  assert.match(
    portfolioCss,
    /architecture-disclosure\[open\]:not\(\[data-details-motion="ready"\]\)/,
  );
  assert.match(
    portfolioCss,
    /\.disclosure-icon::before\s*\{[^}]*transition:\s*transform 160ms var\(--ease-in-out\)/,
  );
});

test("search engines can discover the teaching archive", async () => {
  const robots = await readFile(resolve(root, "robots.txt"), "utf8");
  const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");

  assert.match(robots, /Sitemap: https:\/\/creativeengineer-kimjungho\.com\/sitemap\.xml/);
  for (const path of [
    "/teaching/",
    "/teaching/agentic-ai/",
    "/teaching/contents-programming/",
    "/teaching/game-engine-1/",
    "/teaching/game-engine/",
    "/teaching/media-art-programming/",
  ]) {
    assert.ok(sitemap.includes(`https://creativeengineer-kimjungho.com${path}`));
  }
});

test("the Day 1 deck ships as a ready-to-render static document", async () => {
  const path = resolve(root, "teaching", "agentic-ai", "day-1.html");
  const html = await readFile(path, "utf8");

  assert.match(html, /<html\s+lang="ko"/i);
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /<main(?:\s|>)/i);
  assert.doesNotMatch(html, /__bundler|Unpacking\.\.\./);
  assert.doesNotMatch(html, /data:(?:font|image)\//);
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
  assert.ok(Buffer.byteLength(html) < 1_000_000, "Day 1 HTML should stay below 1 MB");
});

test("the Day 1 asset graph contains no unreferenced or duplicate files", async () => {
  const html = await readFile(
    resolve(root, "teaching", "agentic-ai", "day-1.html"),
    "utf8",
  );
  const assetDirectory = resolve(root, "teaching", "agentic-ai", "day-1-assets");
  const assetNames = (await readdir(assetDirectory)).sort();
  const textAssets = assetNames.filter((name) => /\.(?:css|js|json|svg)$/i.test(name));
  const referenceCorpus = [
    html,
    ...(await Promise.all(
      textAssets.map((name) => readFile(resolve(assetDirectory, name), "utf8")),
    )),
  ].join("\n");
  const unreferenced = assetNames.filter((name) => !referenceCorpus.includes(name));

  const hashes = new Map();
  const duplicates = [];
  for (const name of assetNames) {
    const bytes = await readFile(resolve(assetDirectory, name));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(hash)) duplicates.push(`${name} duplicates ${hashes.get(hash)}`);
    else hashes.set(hash, name);
  }

  assert.deepEqual(unreferenced, []);
  assert.deepEqual(duplicates, []);
});

test("the production build regenerates the Day 1 deck", async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const generator = await readFile(
    resolve(root, "scripts", "finalize-day1-static.mjs"),
    "utf8",
  );
  assert.match(packageJson.scripts.build, /(?:^|&&|;)\s*npm run build:day1(?:\s|$)/);
  assert.match(generator, /"\/usr\/bin\/google-chrome"/);
  assert.match(generator, /"\/usr\/bin\/chromium"/);
});

test("the static Sites build publishes the complete public site", async (context) => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "personal-site-build-"));
  context.after(() => rm(fixtureRoot, { recursive: true, force: true }));

  await Promise.all([
    mkdir(resolve(fixtureRoot, "assets"), { recursive: true }),
    mkdir(resolve(fixtureRoot, "projects"), { recursive: true }),
    mkdir(resolve(fixtureRoot, "teaching", "course"), { recursive: true }),
  ]);
  const fixtureFiles = new Map([
    ["assets/teaching.css", "body {}"],
    ["assets/.DS_Store", "ignored"],
    ["projects/project.html", "<main>Project</main>"],
    ["teaching/index.html", "<main>Teaching</main>"],
    ["teaching/course/index.html", "<main>Course</main>"],
    ["teaching/course/source.bundle.html", "not public"],
    ["teaching/course/speaker-notes.md", "not public"],
    ["index.html", "<main>Home</main>"],
    ["news.html", "<main>News</main>"],
    ["portfolio.html", "<main>Work</main>"],
    ["robots.txt", "User-agent: *"],
    ["sitemap.xml", "<urlset></urlset>"],
  ]);
  await Promise.all(
    [...fixtureFiles].map(([path, contents]) =>
      writeFile(resolve(fixtureRoot, path), contents),
    ),
  );

  await buildSitesStatic(fixtureRoot);

  for (const path of [
    "dist/client/index.html",
    "dist/client/assets/teaching.css",
    "dist/client/projects/project.html",
    "dist/client/teaching/index.html",
    "dist/client/teaching/course/index.html",
    "dist/client/robots.txt",
    "dist/client/sitemap.xml",
  ]) {
    assert.ok((await stat(resolve(fixtureRoot, path))).isFile(), `${path} should exist`);
  }
  await assert.rejects(stat(resolve(fixtureRoot, "dist/client/assets/.DS_Store")));
  await assert.rejects(
    stat(resolve(fixtureRoot, "dist/client/teaching/course/source.bundle.html")),
  );
  await assert.rejects(
    stat(resolve(fixtureRoot, "dist/client/teaching/course/speaker-notes.md")),
  );

  const worker = await readFile(resolve(fixtureRoot, "dist/server/index.js"), "utf8");
  assert.match(worker, /url\.pathname \+= "index\.html"/);
  assert.doesNotMatch(worker, /teaching\/agentic-ai/);
});

test("documents expose one H1 and do not skip heading levels", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8"))
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "");
    const h1Count = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
    if (h1Count > 1) {
      violations.push(`${displayPath(path)}: ${h1Count} H1 elements`);
    }

    let previousLevel = 0;
    for (const match of html.matchAll(/<h([1-6])(?:\s|>)/gi)) {
      const level = Number(match[1]);
      if (previousLevel > 0 && level > previousLevel + 1) {
        violations.push(
          `${displayPath(path)}: heading jumps from H${previousLevel} to H${level}`,
        );
      }
      previousLevel = level;
    }
  }

  assert.deepEqual(violations, []);
});

test("images reserve their layout and declare a loading strategy", async () => {
  const incompleteImages = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8"))
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "");

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = match[0];
      const missing = [];
      if (!/\bwidth="\d+"/i.test(tag)) missing.push("width");
      if (!/\bheight="\d+"/i.test(tag)) missing.push("height");
      if (!/\bloading="(?:lazy|eager)"/i.test(tag)) missing.push("loading");
      if (!/\bdecoding="(?:async|sync|auto)"/i.test(tag)) missing.push("decoding");
      if (missing.length > 0) {
        incompleteImages.push(`${displayPath(path)}: ${missing.join(", ")}`);
      }
    }
  }

  assert.equal(
    incompleteImages.length,
    0,
    `${incompleteImages.length} images lack metadata:\n${incompleteImages.slice(0, 20).join("\n")}`,
  );
});

test("pages publish canonical and social metadata for the custom domain", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const relativePath = displayPath(path).split("\\").join("/");
    const canonical = publicUrlForHtml(root, path);
    const shareImage = shareImageMetadataForHtml(root, path);

    if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
      violations.push(`${relativePath}: canonical`);
    }
    if (!html.includes('<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">')) {
      violations.push(`${relativePath}: favicon`);
    }
    if (!html.includes(`<meta property="og:image" content="${shareImage.url}">`)) {
      violations.push(`${relativePath}: og:image`);
    }
    if (!html.includes(`<meta property="og:image:alt" content="${shareImage.alt}">`)) {
      violations.push(`${relativePath}: og:image:alt`);
    }
    if (!html.includes(`<meta name="twitter:image" content="${shareImage.url}">`)) {
      violations.push(`${relativePath}: twitter:image`);
    }
    for (const name of ["description", "twitter:card", "twitter:title", "twitter:description"]) {
      if (!new RegExp(`<meta name="${name}" content="[^"]+">`, "i").test(html)) {
        violations.push(`${relativePath}: ${name}`);
      }
    }
    for (const property of ["og:title", "og:description", "og:type", "og:url"]) {
      if (!new RegExp(`<meta property="${property}" content="[^"]+">`, "i").test(html)) {
        violations.push(`${relativePath}: ${property}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("pages provide a keyboard shortcut to the main content", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = (await readFile(path, "utf8")).replace(
      /<script\b[\s\S]*?<\/script>/gi,
      "",
    );
    if (!/<a\b[^>]*class="skip-link"[^>]*href="#main-content"/i.test(html)) {
      violations.push(`${displayPath(path)}: skip link`);
    }
    if (!/<main\b[^>]*id="main-content"/i.test(html)) {
      violations.push(`${displayPath(path)}: main landmark id`);
    }
  }

  assert.deepEqual(violations, []);
});

test("primary navigation identifies the current page", async () => {
  const violations = [];

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const primaryNavigations = [
      ...html.matchAll(/<nav\b[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/gi),
    ];
    for (const [index, match] of primaryNavigations.entries()) {
      const currentItems = [
        ...match[0].matchAll(/\baria-current="(?:page|location)"/gi),
      ].length;
      if (currentItems !== 1) {
        violations.push(
          `${displayPath(path)} primary nav ${index + 1}: ${currentItems} current items`,
        );
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("Creative Engineer identity assets stay complete and production-ready", async () => {
  const brandRoot = resolve(root, "assets", "brand");
  const svgFiles = [
    "creative-engineer-symbol.svg",
    "creative-engineer-symbol-mono.svg",
    "creative-engineer-symbol-mono-white.svg",
    "creative-engineer-symbol-reversed.svg",
    "creative-engineer-app-icon.svg",
    "creative-engineer-logo-horizontal.svg",
    "creative-engineer-logo-horizontal-reversed.svg",
  ];

  for (const file of svgFiles) {
    const svg = await readFile(resolve(brandRoot, file), "utf8");
    assert.match(svg, /<title(?:\s[^>]*)?>/, `${file} needs an accessible title`);
    assert.doesNotMatch(svg, /<linearGradient|<radialGradient/i);
  }

  const symbol = await readFile(
    resolve(brandRoot, "creative-engineer-symbol.svg"),
    "utf8",
  );
  assert.match(symbol, /viewBox="0 0 128 128"/);
  assert.match(symbol, /#24424E/);
  assert.match(symbol, /#B64E35/);

  const horizontalLogo = await readFile(
    resolve(brandRoot, "creative-engineer-logo-horizontal.svg"),
    "utf8",
  );
  assert.match(horizontalLogo, /aria-label="CREATIVE ENGINEER"/);
  assert.doesNotMatch(horizontalLogo, /<text\b/i);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  for (const file of [
    "creative-engineer-profile-512.png",
    "creative-engineer-email-logo.png",
    "creative-engineer-email-signature.png",
  ]) {
    const asset = await readFile(resolve(brandRoot, file));
    assert.deepEqual(asset.subarray(0, 4), pngSignature, `${file} must be a PNG`);
    assert.ok(asset.byteLength > 1_000, `${file} must not be empty`);
  }

  const brandCss = await readFile(resolve(root, "assets", "brand.css"), "utf8");
  assert.match(brandCss, /\/assets\/brand\/creative-engineer-app-icon\.svg/);

  for (const file of ["cv.css", "portfolio.css", "teaching.css"]) {
    const css = await readFile(resolve(root, "assets", file), "utf8");
    assert.match(
      css,
      /@import url\("\/assets\/brand\.css"\)/,
      `${file} must import the shared brand header styles`,
    );
  }
});

test("local links, assets, and fragments resolve", async () => {
  const violations = [];
  const documentCache = new Map();

  async function resolveReference(sourcePath, reference) {
    if (
      !reference ||
      /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)
    ) {
      return;
    }

    const [pathPart, rawFragment = ""] = reference.split("#", 2);
    const cleanPath = decodeURIComponent(pathPart.split("?", 1)[0]);
    let target = cleanPath
      ? cleanPath.startsWith("/")
        ? resolve(root, cleanPath.slice(1))
        : resolve(dirname(sourcePath), cleanPath)
      : sourcePath;

    try {
      const targetStats = await stat(target);
      if (targetStats.isDirectory()) target = resolve(target, "index.html");
      await stat(target);
    } catch {
      violations.push(`${displayPath(sourcePath)}: missing ${reference}`);
      return;
    }

    if (rawFragment && target.endsWith(".html")) {
      const fragment = decodeURIComponent(rawFragment);
      let targetHtml = documentCache.get(target);
      if (!targetHtml) {
        targetHtml = await readFile(target, "utf8");
        documentCache.set(target, targetHtml);
      }
      if (
        !targetHtml.includes(`id="${fragment}"`) &&
        !targetHtml.includes(`id='${fragment}'`)
      ) {
        violations.push(`${displayPath(sourcePath)}: missing fragment ${reference}`);
      }
    }
  }

  for (const path of htmlFiles) {
    const html = await readFile(path, "utf8");
    const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    const references = [
      ...[...markup.matchAll(/\b(?:href|src)="([^"]+)"/gi)].map((match) => match[1]),
      ...[...markup.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((match) => match[1]),
    ];
    for (const reference of references) await resolveReference(path, reference);
  }

  const cssFiles = [
    resolve(root, "assets", "cv.css"),
    resolve(root, "assets", "portfolio.css"),
    resolve(root, "assets", "teaching.css"),
    resolve(root, "assets", "brand.css"),
    resolve(root, "assets", "accessibility.css"),
  ];
  for (const path of cssFiles) {
    const css = await readFile(path, "utf8");
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      await resolveReference(path, match[1]);
    }
  }

  assert.deepEqual(violations, []);
});
