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
