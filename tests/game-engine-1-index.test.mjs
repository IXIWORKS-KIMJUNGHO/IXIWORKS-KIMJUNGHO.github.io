import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(root, "teaching", "game-engine-1", "index.html");

test("the Game Engine I index groups documents apart from weeks and spies the in-view section", async () => {
  const [courseIndex, jumpScript] = await Promise.all([
    readFile(courseIndexPath, "utf8"),
    readFile(resolve(root, "assets", "course-jump.js"), "utf8"),
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
});

test("the Game Engine I hero keeps one meta line and stacked course copy", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const hero = courseIndex.match(/<header class="course-hero">[\s\S]*?<\/header>/)[0];

  assert.match(hero, /Unity 6\.6 \/ 2D \/ Generative AI/);
  assert.match(hero, /Fall 2026/);
  assert.doesNotMatch(hero, /Unity 2D course/);
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
  assert.equal(
    [...courseIndex.matchAll(/class="course-disclosure"/g)].length,
    3,
    "overview, goals, and outcomes should be collapsible",
  );
});

test("Game Engine I week rows distinguish missions from unpublished exams", async () => {
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
  assert.match(courseIndex, /href="week-02-foundations\.html"/);
  assert.match(courseIndex, /교수자용 전체 운영안/);
  assert.match(courseIndex, /src="\/assets\/details-motion\.js" defer/);
  assert.match(courseIndex, /type="module" src="\/assets\/course-prose\.js"/);
});

test("Game Engine I installs CLI and MCP from week 1 and does not ban Agent in weeks 2-7", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");

  assert.match(courseIndex, /Unity CLI와 MCP는 1주차부터 설치해 학기 내내 사용합니다/);
  assert.match(courseIndex, /범위를 정하지 않고 실행한 결과는 제작 과정의 증거로 인정하지 않습니다/);
  assert.doesNotMatch(courseIndex, /2~7주차에는 Agent를 사용하지 않습니다/);
});
