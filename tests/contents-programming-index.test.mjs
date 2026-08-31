import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(
  root,
  "teaching",
  "contents-programming",
  "index.html",
);

test("the Contents Programming index groups documents apart from weeks and spies the in-view section", async () => {
  const [courseIndex, jumpScript, teachingCss] = await Promise.all([
    readFile(courseIndexPath, "utf8"),
    readFile(resolve(root, "assets", "course-jump.js"), "utf8"),
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
  ]);

  assert.match(courseIndex, /data-course-jump/);
  assert.match(courseIndex, /class="course-jump-cluster"/);
  assert.match(courseIndex, /class="course-jump-weeks"/);
  assert.match(
    courseIndex,
    /course-jump-cluster[\s\S]*?#course-overview[\s\S]*?#course-goals[\s\S]*?#learning-outcomes[\s\S]*?course-jump-weeks[\s\S]*?#week-01/,
  );
  assert.match(courseIndex, /src="\/assets\/course-jump\.js" defer/);
  assert.match(jumpScript, /data-course-jump/);
  assert.match(jumpScript, /IntersectionObserver/);
  assert.match(jumpScript, /aria-current/);
  assert.match(teachingCss, /html:has\(body\.teaching-index\)\s*\{[^}]*scroll-behavior:\s*auto/s);
  assert.match(
    teachingCss,
    /\.course-jump a\[aria-current="true"\]/,
  );
});

test("the Contents Programming hero keeps one meta line and stacked course copy", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const hero = courseIndex.match(/<header class="course-hero">[\s\S]*?<\/header>/)[0];

  assert.match(hero, /Python \/ Google Colab \/ Data art/);
  assert.match(hero, /Fall 2026/);
  assert.doesNotMatch(hero, /Creative Python course/);
  assert.equal(
    [...hero.matchAll(/class="course-kicker"|class="course-kind"|class="course-term"/g)]
      .length,
    2,
  );

  assert.match(
    courseIndex,
    /<h2 class="course-section-title" id="course-overview">강의 개요<\/h2>\s*<p class="course-section-note">Course overview<\/p>/,
  );
  assert.match(
    courseIndex,
    /<h2 class="course-section-title" id="course-goals">강의 목표<\/h2>\s*<p class="course-section-note">Course goals<\/p>/,
  );
  assert.match(
    courseIndex,
    /<h2 class="course-section-title" id="learning-outcomes">학습 성과<\/h2>\s*<p class="course-section-note">Learning outcomes<\/p>/,
  );
});

test("week rows distinguish missions from unpublished exams", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");

  assert.equal(
    [...courseIndex.matchAll(/class="material-card material-card-mission"/g)].length,
    13,
  );
  assert.match(courseIndex, /class="material-card material-card-pending"/);
  assert.doesNotMatch(
    courseIndex,
    /<a class="material-card[^"]*" href="week-08/,
  );
  assert.doesNotMatch(
    courseIndex,
    /<a class="material-card[^"]*" href="week-16/,
  );
  assert.match(courseIndex, /자료 준비 중/);
});

test("Korean course prose keeps its measure and lays out with Pretext", async () => {
  const [courseIndex, teachingCss, proseScript, pretextLayout] = await Promise.all([
    readFile(courseIndexPath, "utf8"),
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
    readFile(resolve(root, "assets", "course-prose.js"), "utf8"),
    readFile(resolve(root, "assets", "vendor", "pretext", "layout.js"), "utf8"),
  ]);
  const proseRule = teachingCss.match(
    /\.course-prose > p,\s*\.course-disclosure-content > p\s*\{([^}]*)\}/,
  );

  assert.ok(proseRule, "course prose and disclosure paragraphs share one wrapping rule");
  assert.match(proseRule[1], /max-width:\s*none/);
  assert.doesNotMatch(proseRule[1], /word-break:\s*keep-all/);
  assert.doesNotMatch(proseRule[1], /max-width:\s*40rem/);
  assert.doesNotMatch(proseRule[1], /max-width:\s*960px/);
  assert.match(courseIndex, /src="\/assets\/course-prose\.js"/);
  assert.match(courseIndex, /type="module"/);
  assert.match(proseScript, /from "\/assets\/vendor\/pretext\/layout\.js"/);
  assert.match(proseScript, /setLocale\("ko"\)/);
  assert.match(proseScript, /prepareWithSegments/);
  assert.match(proseScript, /layoutWithLines/);
  assert.match(proseScript, /article\.article > p/);
  assert.match(proseScript, /innerHTML/);
  assert.match(pretextLayout, /export function prepareWithSegments/);
  assert.match(pretextLayout, /export function layoutWithLines/);
});

test("the Week 01 orientation lays out Korean article prose with Pretext", async () => {
  const [orientation, teachingCss, proseScript] = await Promise.all([
    readFile(
      resolve(root, "teaching", "contents-programming", "week-01-ot.html"),
      "utf8",
    ),
    readFile(resolve(root, "assets", "teaching.css"), "utf8"),
    readFile(resolve(root, "assets", "course-prose.js"), "utf8"),
  ]);

  assert.match(orientation, /type="module" src="\/assets\/course-prose\.js"/);
  assert.match(orientation, /week-01-ot\.css\?v=ot13/);
  assert.match(orientation, /week-01-ot\.js\?v=ot10/);
  assert.match(orientation, /생성예술/);
  assert.match(orientation, /id="three-fields"/);
  assert.match(orientation, /규칙과 시스템을 설계/);
  assert.match(orientation, /값과 관계를 정확하게 읽게 하는 것/);
  assert.match(orientation, /표로는 보이지 않던 무엇을/);
  assert.match(orientation, /Vera Molnár/);
  assert.match(orientation, /Interruptions/);
  assert.match(orientation, /Ryoji Ikeda/);
  assert.match(orientation, /datamatics/);
  assert.match(orientation, /<h3 id="case-01">사례 1: 생성예술<\/h3>/);
  assert.match(orientation, /<h3 id="case-02">사례 2: 데이터 시각화<\/h3>/);
  assert.match(orientation, /<h3 id="case-03">사례 3: 데이터 아트<\/h3>/);
  assert.match(orientation, /<h4 id="case-molnar">Vera Molnár, Interruptions<\/h4>/);
  assert.match(orientation, /<h4 id="case-ikeda">Ryoji Ikeda, datamatics<\/h4>/);
  assert.doesNotMatch(orientation, /<h3 id="case-molnar">/);
  assert.doesNotMatch(orientation, /<h3 id="case-ikeda">/);
  assert.doesNotMatch(orientation, /id="field-snapshots"/);
  assert.match(
    orientation,
    /id="case-01"[\s\S]*id="case-morellet"[\s\S]*id="case-molnar"[\s\S]*id="case-02"[\s\S]*id="case-minard"[\s\S]*id="case-03"[\s\S]*id="case-listening"[\s\S]*id="case-ikeda"[\s\S]*id="extended-cases"/,
  );
  assert.match(orientation, /themorgan\.org\/drawings\/item\/405692/);
  assert.match(orientation, /ryojiikeda\.com\/project\/datamatics/);
  assert.match(orientation, /data-interruptions-studio/);
  assert.match(orientation, /data-datamatics-studio/);
  assert.match(orientation, /data-flight-studio/);
  assert.match(orientation, /data-wind-studio/);
  assert.match(orientation, /data-pulse-studio/);
  assert.match(orientation, /data-morellet-studio/);
  assert.match(orientation, /data-listening-studio/);
  assert.match(orientation, /minard-1812\.jpg/);
  assert.match(orientation, /centrepompidou\.fr\/en\/ressources\/oeuvre\/ckn5BR/);
  assert.match(orientation, /gallica\.bnf\.fr\/ark:\/12148\/btv1b52504201x/);
  assert.match(orientation, /earstudio\.com\/projects\/project-page\/listening-post/);
  assert.match(orientation, /규칙 다시 실행/);
  assert.match(orientation, /심박 남기기/);
  assert.match(orientation, /매주 <mark>3시간, 3교시<\/mark>/);
  assert.match(orientation, /<mark>1교시와 2교시는 각각 45분 이론 강의 뒤 15분 휴식<\/mark>/);
  assert.match(orientation, /<mark>1·2교시는 강의 이론<\/mark>/);
  assert.match(orientation, /<mark>3교시는 실습<\/mark>/);
  assert.match(orientation, /<mark>지필 시험이 아니라 프로젝트<\/mark>/);
  assert.match(orientation, /생성 포스터 시리즈/);
  assert.match(orientation, /한 가지 생성 규칙/);
  assert.match(orientation, /중간고사에서 보는 것과 보지 않는 것/);
  assert.match(orientation, /같은 시드와 같은 입력을 넣으면 같은 장이 다시 나옴/);
  assert.ok(
    (orientation.match(/<mark>/g) || []).length >= 40,
    "orientation should highlight lecture takeaways across the page",
  );
  assert.match(orientation, /1·2교시는 강의 이론/);
  assert.match(orientation, /3교시는 실습/);
  assert.equal(
    [...orientation.matchAll(/45분 강의, 15분 휴식/g)].length,
    2,
    "periods 1 and 2 should both be 45 minutes of lecture plus a 15-minute break",
  );
  assert.match(orientation, /id="assessment"/);
  assert.match(orientation, /출결[\s\S]*10%[\s\S]*참여도[\s\S]*10%[\s\S]*중간시험[\s\S]*20%[\s\S]*과제[\s\S]*20%[\s\S]*기말시험[\s\S]*40%/);
  assert.doesNotMatch(orientation, /id="case-reas"/);
  assert.doesNotMatch(orientation, /id="case-dear-data"/);
  assert.match(proseScript, /\.details-motion-content > p/);
  assert.match(teachingCss, /p\[data-pretext-laid-out\]\s*\{[^}]*white-space:\s*nowrap/s);

  const orientationCss = await readFile(
    resolve(root, "teaching", "contents-programming", "assets", "week-01-ot.css"),
    "utf8",
  );
  assert.match(
    orientationCss,
    /orientation-page mark\s*\{[^}]*background:\s*#ffe34a[^}]*color:\s*#0d110e/s,
  );
  assert.match(orientationCss, /box-decoration-break:\s*clone/);
  const articleMeasure = orientationCss.match(
    /body\.course-contents-programming\.orientation-page \.article > p\s*\{([^}]*)\}/,
  );
  assert.ok(articleMeasure, "orientation article paragraphs should have a measure rule");
  assert.match(articleMeasure[1], /max-width:\s*none/);
  assert.doesNotMatch(articleMeasure[1], /68ch/);
  assert.match(
    orientationCss,
    /main\.layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(210px, 240px\)/s,
  );
});

test("course index motion stays gated, interruptible, and pressable", async () => {
  const teachingCss = await readFile(resolve(root, "assets", "teaching.css"), "utf8");

  const hoverRules = [
    ...teachingCss.matchAll(/a\.material-card:hover\s*\{([^}]*)\}/g),
  ];
  assert.equal(hoverRules.length, 1);
  assert.match(hoverRules[0][1], /background:/);
  const hoverContext = teachingCss.slice(
    Math.max(0, hoverRules[0].index - 280),
    hoverRules[0].index,
  );
  assert.match(hoverContext, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(
    teachingCss,
    /\.course-disclosure > summary::after\s*\{[^}]*transition:\s*transform 160ms var\(--ease-out\)/s,
  );
  assert.match(
    teachingCss,
    /\.course-jump a:active\s*\{[^}]*scale\(0\.98\)/s,
  );
});
