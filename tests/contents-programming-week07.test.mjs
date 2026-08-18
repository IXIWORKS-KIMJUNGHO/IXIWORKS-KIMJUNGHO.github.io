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

test("Contents Programming week 7 transforms generated images into a midterm prototype", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week7Match = courseIndex.match(
    /<section class="week-group" id="week-07"[\s\S]*?<\/section>/,
  );

  assert.ok(week7Match, "the course index should include week 7");
  const week7 = week7Match[0];

  for (const pattern of [
    /6주차 연결.*create_poster\(\)/s,
    /1교시.*Image\.open\(\).*copy\(\).*crop\(\).*resize\(\).*rotate\(\)/s,
    /원본.*작업본.*결과물/s,
    /2교시.*RGBA.*알파.*레이어.*alpha_composite\(\)/s,
    /제목.*창작자.*원본 주소.*라이선스.*변형 내용/s,
    /3교시.*목표 달성형 개인 실습/s,
    /변형 레이어 세 개.*1000 × 1000/s,
    /자동 검사 PASS.*두 파일 제출.*즉시 귀가/s,
    /8주차 연결.*생성 포스터 시리즈/s,
    /제출 · 변형·합성 프로토타입 PNG 및 Colab 노트북/s,
  ]) {
    assert.match(week7, pattern);
  }

  assert.doesNotMatch(week7, /짝 활동|짝과|조별 활동/);
});
