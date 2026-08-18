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

test("Contents Programming week 9 introduces data as recorded and situated material", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week9Match = courseIndex.match(
    /<section class="week-group" id="week-09"[\s\S]*?<\/section>/,
  );

  assert.ok(week9Match, "the course index should include week 9");
  const week9 = week9Match[0];

  for (const pattern of [
    /중간 프로젝트에서 데이터 아트로: 관찰을 표로 바꾸기/,
    /8주차 연결.*생성 포스터 시리즈.*매개변수.*행.*열/s,
    /1교시.*관찰 단위.*변수.*값.*메타데이터/s,
    /Dear Data.*The Library of Missing Datasets/s,
    /데이터.*선택.*누락.*중립/s,
    /2교시.*CSV.*DataFrame.*행.*열.*헤더.*인덱스/s,
    /pd\.read_csv\(\).*head\(\).*shape.*columns.*dtypes.*isna\(\)\.sum\(\)/s,
    /수치.*범주.*문자열.*날짜.*결측값/s,
    /시각화와 통계 계산보다.*무엇을 담고 있는지/s,
    /3교시.*목표 달성형 개인 실습/s,
    /수업용.*CSV.*원본을 수정하지/s,
    /제목.*출처.*이용 조건.*관찰 단위.*시간 범위/s,
    /답할 수 있는 질문.*답할 수 없는 질문/s,
    /자동 검사 PASS.*Colab 노트북.*즉시 귀가/s,
    /10주차 연결.*수집 단위.*열.*자료형.*개인정보/s,
    /제출 · CSV 탐색 Colab 노트북 및 데이터 질문서/,
  ]) {
    assert.match(week9, pattern);
  }

  assert.doesNotMatch(week9, /짝 활동|짝과|조별 활동/);
});
