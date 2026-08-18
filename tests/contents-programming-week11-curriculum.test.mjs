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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("Contents Programming week 11 turns the week 10 map into an honest data poster", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week11Match = courseIndex.match(
    /<section class="week-group" id="week-11"[\s\S]*?<\/section>/,
  );

  assert.ok(week11Match, "the course index should include week 11");
  const week11 = week11Match[0];

  assert.match(
    week11,
    /질문에 맞는 그래프를 선택해 데이터 포스터로 발전시키기/,
  );
  assert.match(
    week11,
    /10주차 연결[\s\S]*정제된 24행[\s\S]*지리적 배경[\s\S]*막대그래프[\s\S]*산점도/,
  );
  assert.match(
    week11,
    /1교시 · 질문을 시각적 인코딩으로 번역하기[\s\S]*비교[\s\S]*분포[\s\S]*관계[\s\S]*공간/,
  );
  assert.match(week11, /위치[\s\S]*길이[\s\S]*색상[\s\S]*크기[\s\S]*문자/);
  assert.match(week11, /W\.E\.B\. Du Bois[\s\S]*Library of Congress/);
  assert.match(week11, /막대그래프[\s\S]*0에서 시작/);
  assert.match(
    week11,
    /2교시 · Matplotlib·Seaborn으로 그래프와 포스터 구성하기/,
  );
  for (const concept of [
    "Figure",
    "Axes",
    "plt.subplots()",
    "groupby()",
    "sort_values()",
    "sns.barplot()",
    "sns.scatterplot()",
    "hue",
    "size",
    "style",
    "savefig()",
  ]) {
    assert.match(week11, new RegExp(escapeRegExp(concept)));
  }
  assert.match(
    week11,
    /3교시 · 목표 달성형 개인 실습[\s\S]*24개[\s\S]*1600 × 2200[\s\S]*제목[\s\S]*관찰 문장[\s\S]*한계[\s\S]*출처/,
  );
  assert.match(week11, /자동 검사 PASS[\s\S]*두 파일 제출[\s\S]*즉시 귀가/);
  assert.match(week11, /week11_학번_이름\.ipynb/);
  assert.match(week11, /week11_학번_이름_data_poster\.png/);
  assert.match(week11, /12주차 연결[\s\S]*제목과 주석[\s\S]*텍스트 데이터/);
  assert.match(week11, /matplotlib\.org[\s\S]*seaborn\.pydata\.org/);
  assert.doesNotMatch(week11, /짝 활동|짝과|조별|팀 활동/);
});
