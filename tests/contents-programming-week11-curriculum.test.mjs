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

async function readWeek11() {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week11Match = courseIndex.match(
    /<section class="week-group" id="week-11"[\s\S]*?<\/section>/,
  );

  assert.ok(week11Match, "the course index should include week 11");
  return week11Match[0];
}

test("week 11 publishes three lesson cards from the course index", async () => {
  const week11 = await readWeek11();

  assert.match(week11, /Visual encoding/);
  assert.match(week11, /href="week-11-period1\.html"/);
  assert.match(week11, /href="week-11-period2\.html"/);
  assert.match(week11, /href="week-11-period3\.html"/);
  assert.match(week11, /11주차 1교시: 질문에서 그래프로/);
  assert.match(week11, /11주차 2교시: 데이터 포스터 만들기/);
  assert.match(week11, /11주차 3교시: 데이터 포스터 미션/);
  assert.doesNotMatch(week11, /짝 활동|짝과|조별|팀 활동/);
});
