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

async function readWeek11() {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week11Match = courseIndex.match(
    /<section class="week-group" id="week-11"[\s\S]*?<\/section>/,
  );

  assert.ok(week11Match, "the course index should include week 11");
  return week11Match[0];
}

function paragraphByLabel(week, label) {
  const paragraph = week.match(
    new RegExp(
      `<p><strong>${escapeRegExp(label)}</strong>([\\s\\S]*?)<\\/p>`,
    ),
  );

  assert.ok(paragraph, `week 11 should include the “${label}” paragraph`);
  return paragraph[0];
}

function visibleText(fragment) {
  return fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function assertIncludesAll(fragment, values) {
  const text = visibleText(fragment);

  for (const value of values) {
    assert.ok(text.includes(value), `expected “${value}” inside: ${text}`);
  }
}

function assertExternalLink(fragment, href) {
  assert.match(
    fragment,
    new RegExp(
      `<a href="${escapeRegExp(href)}" target="_blank" rel="noopener noreferrer">`,
    ),
  );
}

test("week 11 gives every student the same explicit bridge from the week 10 map", async () => {
  const week11 = await readWeek11();
  const connection = paragraphByLabel(week11, "10주차 연결");

  assertIncludesAll(connection, [
    "수업용 가상 공공문화시설 CSV",
    "24행",
    "세 범주",
    "자신의 승인된 위치 데이터",
    "수업 제공 24행 정제 CSV",
    "막대그래프",
    "좌표 산점도",
  ]);
});

test("period 1 separates comparison, relationship, and spatial questions", async () => {
  const week11 = await readWeek11();
  const period1 = paragraphByLabel(
    week11,
    "1교시 · 질문을 시각적 인코딩으로 번역하기",
  );

  assertIncludesAll(period1, [
    "0–6분",
    "44–50분",
    "비교",
    "분포",
    "관계",
    "공간",
    "위치",
    "길이",
    "색상",
    "크기",
    "문자",
    "duration_min",
    "focus_level",
    "경도와 위도의 상관관계",
    "W.E.B. Du Bois",
    "Library of Congress",
  ]);
  assert.match(period1, /막대그래프[\s\S]*0에서 시작/);
  assertExternalLink(period1, "https://www.loc.gov/pictures/item/2005679642/");
});

test("period 2 teaches the chart code and an honest poster composition", async () => {
  const week11 = await readWeek11();
  const period2 = paragraphByLabel(
    week11,
    "2교시 · Matplotlib·Seaborn으로 그래프와 포스터 구성하기",
  );

  assertIncludesAll(period2, [
    "0–7분",
    "45–50분",
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
    "좌표 산점도",
    "경도와 위도의 상관관계로 해석하지 않는다",
    "savefig()",
  ]);
  assertExternalLink(
    period2,
    "https://matplotlib.org/stable/users/explain/axes/index.html",
  );
  assertExternalLink(
    period2,
    "https://seaborn.pydata.org/generated/seaborn.barplot.html",
  );
  assertExternalLink(
    period2,
    "https://seaborn.pydata.org/generated/seaborn.scatterplot.html",
  );
});

test("period 3 is an individual 50-minute PASS mission with two deliverables", async () => {
  const week11 = await readWeek11();
  const period3 = paragraphByLabel(
    week11,
    "3교시 · 목표 달성형 개인 실습",
  );

  assertIncludesAll(period3, [
    "0–5분",
    "46–50분",
    "가로 막대그래프",
    "위치 좌표 산점도",
    "24개",
    "1600 × 2200",
    "질문형 제목",
    "관찰 문장",
    "해석의 한계",
    "데이터 출처",
    "자동 검사 PASS",
    "두 파일을 제출",
    "즉시 귀가",
    "week11_학번_이름.ipynb",
    "week11_학번_이름_data_poster.png",
  ]);
});

test("week 11 remains individual work and prepares the text-data transition", async () => {
  const week11 = await readWeek11();
  const week12Connection = paragraphByLabel(week11, "12주차 연결");

  assertIncludesAll(week12Connection, ["제목과 주석", "텍스트 데이터"]);
  assert.doesNotMatch(week11, /짝 활동|짝과|조별|팀 활동/);
});
