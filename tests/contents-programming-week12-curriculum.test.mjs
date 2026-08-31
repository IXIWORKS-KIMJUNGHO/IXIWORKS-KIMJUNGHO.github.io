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
const courseDirectory = resolve(root, "teaching", "contents-programming");

async function readWeek12() {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week12Match = courseIndex.match(
    /<section class="week-group" id="week-12"[\s\S]*?<\/section>/,
  );

  assert.ok(week12Match, "the course index should include week 12");
  return week12Match[0];
}

test("week 12 publishes three lesson cards from the course index", async () => {
  const week12 = await readWeek12();

  assert.match(week12, /Text as data/);
  assert.match(week12, /href="week-12-period1\.html"/);
  assert.match(week12, /href="week-12-period2\.html"/);
  assert.match(week12, /href="week-12-period3\.html"/);
  assert.match(week12, /12주차 1교시: 텍스트는 어떻게 데이터가 되는가/);
  assert.match(week12, /12주차 2교시: Python으로 단어 빈도와 문장 리듬 그리기/);
  assert.match(week12, /12주차 3교시: 텍스트 패턴 포스터 미션/);
  assert.doesNotMatch(week12, /짝 활동|짝과|조별|팀 활동/);
});

test("week 12 publishes three detailed beginner lessons with continuous timing", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period1 = await readFile(
    resolve(courseDirectory, "week-12-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-12-period2.html"),
    "utf8",
  );
  const period3 = await readFile(
    resolve(courseDirectory, "week-12-period3.html"),
    "utf8",
  );

  assert.match(courseIndex, /href="week-12-period1\.html"/);
  assert.match(courseIndex, /href="week-12-period2\.html"/);
  assert.match(courseIndex, /href="week-12-period3\.html"/);
  assert.match(period1, /href="week-12-period2\.html" rel="next"/);
  assert.match(period2, /href="week-12-period1\.html" rel="prev"/);
  assert.match(period2, /href="week-12-period3\.html" rel="next"/);
  assert.match(period3, /href="week-12-period2\.html" rel="prev"/);

  for (const [html, ranges] of [
    [
      period1,
      ["0-6분", "6-15분", "15-25분", "25-34분", "34-42분", "42-48분", "48-50분", "50-60분"],
    ],
    [
      period2,
      ["0-7분", "7-17분", "17-26분", "26-36분", "36-44분", "44-48분", "48-50분", "50-60분"],
    ],
  ]) {
    for (const range of ranges) assert.match(html, new RegExp(range));
    assert.match(html, /확장 10분/);
    assert.match(html, /기본 50분 \/ 확장 60분/);
    assert.doesNotMatch(html, /짝 활동|짝과|조별|팀 활동/);
  }

  for (const range of [
    "0-5분",
    "5-11분",
    "11-19분",
    "19-28분",
    "28-36분",
    "36-43분",
    "43-47분",
    "47-50분",
  ]) {
    assert.match(period3, new RegExp(range));
  }
  assert.doesNotMatch(period3, /짝 활동|짝과|조별|팀 활동/);

  assert.ok(
    [...period1.matchAll(/<details\b/gi)].length >= 12,
    "period 1 should include frequent individual understanding checks",
  );
  assert.ok(
    [...period2.matchAll(/<details\b/gi)].length >= 18,
    "period 2 should include detailed beginner troubleshooting",
  );
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 16,
    "period 3 should include detailed recovery guidance",
  );
});

test("period 3 is a complete PASS-and-leave text-pattern mission", async () => {
  const period3 = await readFile(
    resolve(courseDirectory, "week-12-period3.html"),
    "utf8",
  );

  for (const pattern of [
    /자동 검사 PASS \+ 세 파일 제출 확인 = 즉시 귀가/,
    /속도는 평가 항목이 아닙니다/,
    /library_night[\s\S]*rain_garden[\s\S]*morning_market/s,
    /밤의 도서관[\s\S]*비 온 뒤의 정원[\s\S]*아침 시장의 목소리/s,
    /raw_text.*제목·출처·이용 조건·지정 제외 목록/s,
    /밤의 도서관<\/th><td>76 · 65<\/td><td>72 · 61/,
    /비 온 뒤의 정원<\/th><td>82 · 70<\/td><td>78 · 66/,
    /아침 시장의 목소리<\/th><td>91 · 83<\/td><td>87 · 79/,
    /전체 빈도표 CSV[\s\S]*word[\s\S]*count/s,
    /가로 막대가 열 개/,
    /점이 정확히 열두 개/,
    /poster_question[\s\S]*frequency_observation[\s\S]*rhythm_observation[\s\S]*limitation_statement/s,
    /1600 × 2200/,
    /WEEK 12 TEXT PATTERN MISSION COMPLETE/,
    /week12_학번_이름\.ipynb/,
    /week12_학번_이름_word_frequency\.csv/,
    /week12_학번_이름_text_poster\.png/,
    /필수 목표를 달성한 것입니다/,
    /선택 확장.*귀가 조건이 아니며 추가 점수도 없습니다/s,
    /교수자 운영 메모 · 최종 확인을 1분 안에 하는 순서/,
    /assets\/week-12-text-pattern-mission\.ipynb/,
    /assets\/week-12-text-pattern-poster\.svg/,
  ]) {
    assert.match(period3, pattern);
  }

  assert.doesNotMatch(
    period3,
    /TODO|implement here|rest of code|similar to above|add more as needed/,
  );
});

test("week 12 mission notebook embeds three texts and verifies every deliverable", async () => {
  const notebookPath = resolve(
    courseDirectory,
    "assets",
    "week-12-text-pattern-mission.ipynb",
  );
  const notebookSource = await readFile(notebookPath, "utf8");
  const notebook = JSON.parse(notebookSource);
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");
  const notebookText = notebook.cells
    .map((cell) => cell.source.join(""))
    .join("\n");

  assert.equal(notebook.nbformat, 4);
  assert.equal(codeCells.length, 9);
  assert.equal(notebook.metadata.colab.name, "week-12-text-pattern-mission.ipynb");

  for (const pattern of [
    /library_night/,
    /rain_garden/,
    /morning_market/,
    /밤의 도서관은 조용히 문을 연다/,
    /비가 그친 정원에는 작은 물방울이 남아 있다/,
    /아침 시장은 첫 가게의 불빛과 함께 문을 연다/,
    /mission_step0_execution[\s\S]*mission_step6_execution[\s\S]*mission_final_execution/s,
    /raw_snapshot = raw_text/,
    /re\.split\(r"\[\.!\?\]\+", raw_text\)/,
    /re\.sub\(r"\[\^0-9A-Za-z가-힣\\s\]", " ", raw_text\)/,
    /tokens = \[[\s\S]*if token not in excluded_tokens/s,
    /token_counter = Counter\(tokens\)/,
    /columns=\["word", "count"\]/,
    /frequency_df\.to_csv\([\s\S]*encoding="utf-8-sig"/s,
    /bar_frame = top10_df\.iloc\[::-1\]\.reset_index\(drop=True\)/,
    /set_xticks\(range\(1, 13\)\)/,
    /figsize=\(8, 11\), dpi=200/,
    /Image\.open\(poster_filename\)\.size == \(1600, 2200\)/,
    /poster_question != default_question/,
    /top_word in frequency_observation/,
    /str\(maximum_sentence_length\) in rhythm_observation/,
    /"공백" in limitation_statement or "형태소" in limitation_statement/,
    /saved_frequency_df\.equals\(frequency_df\)/,
    /WEEK 12 TEXT PATTERN MISSION COMPLETE/,
    /files\.download\(frequency_filename\)[\s\S]*files\.download\(poster_filename\)/s,
  ]) {
    assert.match(notebookText, pattern);
  }

  assert.doesNotMatch(
    notebookText,
    /\.\.\.|TODO|implement here|rest of code|similar to above|add more as needed/,
  );
});

test("period 1 explains every interpretive choice from source text to visualization", async () => {
  const period1 = await readFile(
    resolve(courseDirectory, "week-12-period1.html"),
    "utf8",
  );

  for (const pattern of [
    /프로그래밍을 몰라도 먼저 붙잡을 문장/,
    /11주차.*제목과 주석.*문장 자체.*분석 대상/s,
    /같은 텍스트를 보는 네 가지 화면/,
    /문서 document.*문장 sentence.*토큰 token.*종류 type.*빈도 frequency/s,
    /토큰이 세 개.*종류는 두 개/s,
    /학생.*학생은.*학생이.*서로 다른 토큰/s,
    /공백 기준 토큰화.*형태소 분석과 같지 않습니다/s,
    /원문 76토큰·65종.*분석용 72토큰·61종/s,
    /원문 보존.*문장 분리.*정규화.*토큰화.*지정어 제외.*집계·시각화/s,
    /빛골목.*공백으로 바꾸면/s,
    /불용어.*중립적인 청소가 아니라/s,
    /위에.*아래에서.*옆에.*속에/s,
    /워드클라우드.*가로 막대그래프/s,
    /시간이 흐른 것은 아니다/,
    /가사·소설·영화 대사 전문.*필수 과제에서 사용하지 않음/s,
    /개인 대화·일기·인터뷰.*필수 과제에서 사용하지 않음/s,
    /정확히 같은 토큰.*3회.*글자열이 포함된 문장.*다섯 개/s,
    /week-12-text-analysis-pipeline\.svg/,
    /week-12-text-pattern-poster\.svg/,
    /https:\/\/gongu\.copyright\.or\.kr\/gongu\/main\/contents\.do\?menuNo=200093/,
    /https:\/\/www\.pipc\.go\.kr\/np\/default\/page\.do\?mCode=D040010000/,
  ]) {
    assert.match(period1, pattern);
  }
});

test("period 2 contains a complete reproducible text-to-poster walkthrough", async () => {
  const period2 = await readFile(
    resolve(courseDirectory, "week-12-period2.html"),
    "utf8",
  );

  for (const pattern of [
    /!apt-get -qq install fonts-nanum/,
    /font_manager\.fontManager\.addfont/,
    /raw_text = """밤의 도서관은/,
    /assert len\(raw_text\) == 291/,
    /assert raw_text\.count\("\."\) == 12/,
    /re\.split\(r"\[\.\!\?\]\+", raw_text\)/,
    /re\.sub\([\s\S]*r"\[\^0-9A-Za-z가-힣\\s\]"[\s\S]*raw_text/s,
    /raw_tokens = normalized_text\.split\(\)/,
    /stopwords = \{"위에", "아래에서", "옆에", "속에"\}/,
    /assert len\(raw_tokens\) == 76/,
    /assert len\(set\(raw_tokens\)\) == 65/,
    /assert len\(tokens\) == 72/,
    /assert len\(set\(tokens\)\) == 61/,
    /token_counter = Counter\(tokens\)/,
    /columns=\["word", "count"\]/,
    /frequency_df\.to_csv\([\s\S]*encoding="utf-8-sig"/,
    /\("빛", 3\)[\s\S]*\("학생은", 3\)[\s\S]*\("밤의", 1\)/,
    /bar_df = top10_df\.iloc\[::-1\]\.reset_index\(drop=True\)/,
    /bar_ax\.barh\(/,
    /bar_ax\.set_xlim\(0, maximum_count \+ 0\.8\)/,
    /expected_lengths = \[5, 7, 6, 7, 6, 7, 7, 6, 6, 6, 6, 7\]/,
    /line_ax\.plot\(/,
    /line_ax\.set_xticks\(range\(1, 13\)\)/,
    /figsize=\(8, 11\)[\s\S]*dpi=200/s,
    /OBSERVATION 01[\s\S]*OBSERVATION 02[\s\S]*LIMIT/s,
    /poster_fig\.savefig\(/,
    /assert saved_poster_size == \(1600, 2200\)/,
    /files\.download\(frequency_filename\)[\s\S]*files\.download\(poster_filename\)/s,
    /context_df\["sentence_order"\]\.tolist\(\) == \[2, 3, 6, 8, 12\]/,
    /3교시 텍스트 패턴 포스터 미션의 고정 계약/,
    /미적 취향이나 작업 속도를 평가하지 않습니다/,
  ]) {
    assert.match(period2, pattern);
  }

  assert.doesNotMatch(
    period2,
    /\.\.\.|TODO|implement here|rest of code|similar to above|add more as needed/,
  );
});

test("week 12 diagrams preserve the exact worked-example quantities", async () => {
  const pipeline = await readFile(
    resolve(courseDirectory, "assets", "week-12-text-analysis-pipeline.svg"),
    "utf8",
  );
  const poster = await readFile(
    resolve(courseDirectory, "assets", "week-12-text-pattern-poster.svg"),
    "utf8",
  );

  for (const pattern of [
    /원문 보존/,
    /291자 · 12문장/,
    /76토큰 · 65종/,
    /72토큰 · 61종/,
    /막대 10개 · 점 12개/,
    /그래프는 원문을 대신하지 않습니다/,
  ]) {
    assert.match(pipeline, pattern);
  }

  for (const pattern of [
    /상위 10개 토큰 빈도/,
    />빛</,
    />학생은</,
    /문장 순서에 따른 길이/,
    /OBSERVATION/,
    /공백 기준 토큰화는 ‘빛’, ‘빛은’, ‘빛을’을 서로 다른 토큰으로 센다/,
  ]) {
    assert.match(poster, pattern);
  }
});

test("week 12 uses a task-first, accessible long-form lesson interface", async () => {
  const lessons = await Promise.all(
    [1, 2, 3].map((period) =>
      readFile(
        resolve(courseDirectory, `week-12-period${period}.html`),
        "utf8",
      ),
    ),
  );
  const styles = await readFile(
    resolve(courseDirectory, "assets", "week-12.css"),
    "utf8",
  );
  const navigation = await readFile(
    resolve(courseDirectory, "assets", "week-12-navigation.js"),
    "utf8",
  );

  for (const lesson of lessons) {
    assert.match(lesson, /<html lang="ko" class="week-12-page">/);
    assert.match(
      lesson,
      /<body class="teaching-document course-contents-programming week-12">/,
    );
    assert.match(lesson, /href="assets\/week-12\.css"/);
    assert.match(lesson, /src="assets\/week-12-navigation\.js" defer/);
    assert.match(lesson, /<details class="toc lesson-toc" open>/);
    assert.match(lesson, /<summary class="toc-title">/);
    assert.match(lesson, /class="toc-current"/);
    assert.match(lesson, /<nav class="toc-links" aria-label="단원 바로가기">/);
    assert.match(lesson, /<span class="sequence-label">이전<\/span>/);
    assert.match(lesson, /<span class="sequence-label">다음<\/span>/);
    assert.doesNotMatch(
      lesson,
      /Previous|Next|Lesson Spec|Mission Spec|PASS OUTPUT|SUBMIT \d+/,
    );
    assert.doesNotMatch(lesson, /[—–]/);
  }

  const period2 = lessons[1];
  assert.match(period2, /class="quick-start"[^>]*aria-labelledby="code-start-title"/);
  assert.match(period2, /class="outcome-preview"/);
  assert.match(period2, /class="phase-map" aria-label="코드 진행 네 단계"/);
  assert.equal(
    [...period2.matchAll(/class="lesson-phase"/g)].length,
    4,
    "period 2 should group the walkthrough into four meaningful phases",
  );
  assert.ok(
    period2.indexOf('id="code-start-title"') < period2.indexOf('id="setup"'),
    "period 2 should expose its runnable notebook before the first code cell",
  );
  assert.match(period2, /week-12-text-pattern-mission\.ipynb" download/);
  assert.match(period2, /<img[^>]+week-12-text-pattern-poster\.svg/);

  const period3 = lessons[2];
  const goalPosition = period3.indexOf('id="goal-contract-title"');
  const startPosition = period3.indexOf('id="mission-start-title"');
  const routePosition = period3.indexOf('class="mission-route"');
  assert.ok(goalPosition < startPosition && startPosition < routePosition);
  assert.match(period3, /<details class="learning-goals-disclosure">/);
  assert.match(period3, /<details class="criteria-disclosure">/);
  assert.match(period3, /<details class="time-disclosure">/);
  assert.match(period3, /class="pass-check-list"/);
  assert.doesNotMatch(period3, /role="status"|✅|🎉|🏁/u);

  assert.match(styles, /\.toc a\[aria-current="location"\]/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(prefers-color-scheme: dark\)/);
  assert.match(styles, /@media print/);
  assert.doesNotMatch(styles, /transition:\s*all\b/);

  assert.match(navigation, /IntersectionObserver/);
  assert.match(navigation, /aria-current/);
  assert.match(navigation, /matchMedia\("\(max-width: 980px\)"\)/);
  assert.doesNotMatch(navigation, /addEventListener\(["']scroll["']/);
});
