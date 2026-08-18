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
  const lessonSections = new Map(
    [...week9.matchAll(/<p><strong>([^<]+)<\/strong>([\s\S]*?)<\/p>/g)].map(
      ([, label, content]) => [label, content],
    ),
  );

  assert.match(
    week9,
    /<h3>중간 프로젝트에서 데이터 아트로: 관찰을 표로 바꾸기<\/h3>/,
  );
  assert.equal(lessonSections.size, 5);

  const requiredConceptsBySection = new Map([
    [
      "8주차 연결",
      ["생성 포스터 시리즈", "매개변수", "행", "열"],
    ],
    [
      "1교시 · 데이터는 발견되는가, 만들어지는가",
      [
        "관찰 단위",
        "변수",
        "값",
        "메타데이터",
        "Dear Data",
        "The Library of Missing Datasets",
        "선택",
        "누락",
        "중립",
      ],
    ],
    [
      "2교시 · CSV와 DataFrame의 구조 읽기",
      [
        "행",
        "열",
        "헤더",
        "인덱스",
        "수치",
        "범주",
        "문자열",
        "날짜",
        "결측값",
        "pd.read_csv()",
        "head()",
        "shape",
        "columns",
        "dtypes",
        "isna().sum()",
        "시각화와 통계 계산보다",
        "무엇을 담고 있는지",
      ],
    ],
    [
      "3교시 · 목표 달성형 개인 실습",
      [
        "수업용 창작 활동 기록 CSV",
        "원본을 수정하지",
        "제목",
        "출처",
        "이용 조건",
        "관찰 단위",
        "시간 범위",
        "답할 수 있는 질문",
        "답할 수 없는 질문",
        "자동 검사 PASS",
        "Colab 노트북",
        "즉시 귀가",
      ],
    ],
    [
      "10주차 연결",
      ["수집 단위", "열", "자료형", "개인정보"],
    ],
  ]);

  for (const [section, requiredConcepts] of requiredConceptsBySection) {
    const content = lessonSections.get(section);
    assert.ok(content, `week 9 should include the ${section} section`);
    for (const concept of requiredConcepts) {
      assert.ok(
        content.includes(concept),
        `${section} should include ${concept}`,
      );
    }
  }

  assert.match(
    week9,
    /<span class="assignment-label">제출 · CSV 탐색 Colab 노트북 및 데이터 질문서<\/span>/,
  );
  assert.doesNotMatch(week9, /짝 활동|짝과|조별 활동/);
});
