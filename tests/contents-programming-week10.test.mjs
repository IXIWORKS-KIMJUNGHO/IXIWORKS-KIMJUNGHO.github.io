import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const courseIndexPath = resolve(
  root,
  "teaching",
  "contents-programming",
  "index.html",
);
const courseDirectory = resolve(root, "teaching", "contents-programming");
const assetDirectory = resolve(courseDirectory, "assets");

test("Contents Programming week 10 turns cleaned location data into an interactive map", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const week10Match = courseIndex.match(
    /<section class="week-group" id="week-10"[\s\S]*?<\/section>/,
  );

  assert.ok(week10Match, "the course index should include week 10");
  const week10 = week10Match[0];

  for (const pattern of [
    /Clean and map/,
    /위치 데이터를 정리해 인터랙티브 지도로 만들기/,
    /9주차 연결.*CSV.*DataFrame.*출처.*질문/s,
    /개인의 이동 경로.*가상 공공문화시설 CSV/s,
    /1교시.*위도.*경도.*위치.*수치.*범주.*크기.*색상/s,
    /place_name.*category.*value.*latitude.*longitude/s,
    /결측 좌표.*중복 장소.*위도 -90~90.*경도 -180~180/s,
    /집.*학교.*이동 경로.*식별.*수집하지 않는다/s,
    /출처.*수집 시점.*이용 조건.*바탕지도/s,
    /2교시.*pandas.*Folium.*인터랙티브 지도/s,
    /clean_df = raw_df\.copy\(\)/,
    /pd\.to_numeric\(errors="coerce"\).*dropna\(\).*drop_duplicates\(\).*between\(\)/s,
    /folium\.Map\(\).*folium\.CircleMarker\(\)/s,
    /위치는 위도·경도.*수치는 원의 반지름.*범주는 색상/s,
    /tooltip.*popup.*map\.save\(\)/s,
    /마커의 수.*정제된 행 수/s,
    /3교시 · 목표 달성형 개인 실습/,
    /href="week-10-period3\.html"/,
    /문제 행 다섯 개.*유효한 24행.*범주 세 개/s,
    /모든 행.*원형 마커.*프로그램 수에 따른 크기.*서로 다른 색상/s,
    /데이터 출처.*기준일.*이용 조건.*정제 기준.*개인정보.*패턴.*해석의 한계/s,
    /자동 검사 PASS.*Colab 노트북·정제 CSV·인터랙티브 지도 HTML 세 파일 제출.*즉시 귀가/s,
    /선택 확장.*GeoJSON.*folium\.Choropleth\(\)/s,
    /필수 귀가 조건과 추가 점수에는 포함하지 않는다/,
    /11주차 연결.*Matplotlib·Seaborn.*막대그래프.*산점도.*데이터 포스터/s,
    /제출 · Folium 인터랙티브 지도 HTML, 정제 데이터 CSV 및 Colab 노트북/,
  ]) {
    assert.match(week10, pattern);
  }

  assert.doesNotMatch(week10, /짝 활동|짝과|조별 활동/);
});

test("Contents Programming week 10 theory lessons connect location ethics to an executable Folium map", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period09Mission = await readFile(
    resolve(courseDirectory, "week-09-period3.html"),
    "utf8",
  );
  const period1 = await readFile(
    resolve(courseDirectory, "week-10-period1.html"),
    "utf8",
  );
  const period2 = await readFile(
    resolve(courseDirectory, "week-10-period2.html"),
    "utf8",
  );
  const period11Opening = await readFile(
    resolve(courseDirectory, "week-11-period1.html"),
    "utf8",
  );

  assert.match(courseIndex, /href="week-10-period1\.html"/);
  assert.match(courseIndex, /href="week-10-period2\.html"/);
  assert.match(period09Mission, /href="week-10-period1\.html" rel="next"/);
  assert.match(period1, /href="week-09-period3\.html" rel="prev"/);
  assert.match(period1, /href="week-10-period2\.html" rel="next"/);
  assert.match(period2, /href="week-10-period1\.html" rel="prev"/);
  assert.match(period11Opening, /href="week-10-period3\.html" rel="prev"/);

  for (const [html, timeRanges, expectedShareImage] of [
    [
      period1,
      ["0-5분", "5-13분", "13-23분", "23-33분", "33-41분", "41-50분", "50-60분"],
      "week-10-location-encoding.png",
    ],
    [
      period2,
      ["0-5분", "5-12분", "12-24분", "24-32분", "32-43분", "43-50분", "50-60분"],
      "week-10-cleaning-to-map.png",
    ],
  ]) {
    for (const timeRange of timeRanges) {
      assert.match(html, new RegExp(timeRange));
    }
    assert.doesNotMatch(html, /짝 활동|짝과|조별 활동/);
    assert.ok(
      [...html.matchAll(/<details\b/gi)].length >= 8,
      "each week 10 lesson should include at least eight beginner checks",
    );
    assert.doesNotMatch(html, /\+ 10 MIN EXTENSION/);
    assert.match(html, /기본 50분.*확장 60분/s);
    assert.match(html, /<html lang="ko" class="week-10-root">/);
    assert.match(
      html,
      /<body class="teaching-document course-contents-programming week-10-document">/,
    );
    assert.equal(
      [...html.matchAll(/class="hero-chip"/g)].length,
      3,
      "week 10 lesson heroes should keep only week, period, and time",
    );
    assert.equal(
      [...html.matchAll(/class="meta-row"/g)].length,
      5,
      "week 10 lesson specs should not repeat hero timing metadata",
    );
    assert.ok(
      html.includes(
        `og:image" content="https://creativeengineer-kimjungho.com/teaching/contents-programming/assets/${expectedShareImage}"`,
      ),
    );
    assert.doesNotMatch(html, /python-data-art\.svg/);
  }

  for (const pattern of [
    /9주차.*DataFrame.*위치가 있는 데이터/s,
    /관찰 단위는 공공시설 한 곳.*한 행.*마커 하나/s,
    /가상 자료.*실제 기관의 현황.*사용하지 않습니다/s,
    /바탕지도.*데이터 레이어/s,
    /위도.*-90 이상 90 이하.*경도.*-180 이상 180 이하/s,
    /\[위도, 경도\]/,
    /시각적 인코딩.*위치.*크기.*색상.*문자/s,
    /결측.*중복.*범위.*추측하지 않고 제외/s,
    /개인의 집.*현재 위치.*통학 경로.*수집하지 않습니다/s,
    /데이터 출처.*이용 조건.*바탕지도.*누락과 범위/s,
    /week-10-location-encoding\.png/,
    /week-10-cleaning-to-map\.png/,
    /week-10-public-facilities-practice\.csv/,
    /https:\/\/www\.data\.go\.kr\/data\/15112107\/fileData\.do/,
    /https:\/\/www\.openstreetmap\.org\/copyright/,
    /3교시까지 유지할 고정 계약/,
    /유효한 장소 20개 이상, 범주 3개 이상/,
  ]) {
    assert.match(period1, pattern);
  }

  for (const pattern of [
    /!pip -q install folium/,
    /raw_df = pd\.read_csv\(source_path\)/,
    /clean_df = raw_df\.copy\(\)/,
    /pd\.to_numeric\([\s\S]*errors="coerce"/,
    /dropna\([\s\S]*drop_duplicates\([\s\S]*between\(-90, 90\)[\s\S]*between\(-180, 180\)/,
    /assert len\(raw_df\) == 29/,
    /assert len\(clean_df\) == 24/,
    /nunique\(\) == 3/,
    /folium\.Map\([\s\S]*tiles="CartoDB positron"/,
    /def scale_radius\(program_count\):/,
    /def category_to_color\(category\):/,
    /for row_index, row in clean_df\.iterrows\(\):/,
    /folium\.CircleMarker\([\s\S]*tooltip=tooltip_text,[\s\S]*popup=popup_text/s,
    /assert marker_count == len\(clean_df\)/,
    /CircleMarker.*픽셀.*Circle.*미터/s,
    /키보드.*화면 낭독기.*텍스트 표/s,
    /clean_df\.to_csv\([\s\S]*facility_map\.save\(map_filename\)/,
    /files\.download\(cleaned_filename\)[\s\S]*files\.download\(map_filename\)/,
    /자동 검사 PASS와 세 파일 제출.*즉시 귀가/s,
    /folium\.Choropleth\(\).*필수 귀가 조건이나 추가 점수에 포함하지 않으며/s,
    /https:\/\/pandas\.pydata\.org\/docs\/reference\/api\/pandas\.to_numeric\.html/,
    /https:\/\/python-visualization\.github\.io\/folium\/latest\/user_guide\/geojson\.html/,
  ]) {
    assert.match(period2, pattern);
  }
});

test("Contents Programming week 10 period 3 is a goal-based interactive map mission", async () => {
  const courseIndex = await readFile(courseIndexPath, "utf8");
  const period2 = await readFile(
    resolve(courseDirectory, "week-10-period2.html"),
    "utf8",
  );
  const period3 = await readFile(
    resolve(courseDirectory, "week-10-period3.html"),
    "utf8",
  );

  assert.match(courseIndex, /href="week-10-period3\.html"/);
  assert.match(period2, /href="week-10-period3\.html" rel="next"/);
  assert.match(period3, /href="week-10-period2\.html" rel="prev"/);
  assert.doesNotMatch(period3, /짝 활동|짝과|조별 활동/);
  assert.ok(
    [...period3.matchAll(/<details\b/gi)].length >= 14,
    "the week 10 mission should include detailed beginner troubleshooting",
  );

  for (const timeRange of [
    "0-6분",
    "6-11분",
    "11-18분",
    "18-28분",
    "28-38분",
    "38-43분",
    "43-47분",
    "47-50분",
  ]) {
    assert.match(period3, new RegExp(timeRange));
  }

  for (const pattern of [
    /목표 달성형 개인 실습/,
    /자동 검사 PASS \+ 세 파일 제출 = 즉시 귀가/,
    /작업 속도와 남은 수업 시간은 평가에 반영하지 않습니다/,
    /week-10-interactive-map-mission\.ipynb/,
    /week-10-interactive-map-example\.html/,
    /week-10-public-facilities-practice\.csv/,
    /week10_학번_이름\.ipynb/,
    /week10_학번_이름_cleaned\.csv/,
    /week10_학번_이름_map\.html/,
    /29→27→26→24/,
    /도서관 8개.*박물관 8개.*문화센터 8개/s,
    /최소 4.*최대 28.*차이는 6 이상/s,
    /검증된 팔레트.*세 범주/s,
    /정제된 24행.*지도 마커 24개/s,
    /툴팁.*팝업.*장소명.*범주.*실제 프로그램 수/s,
    /시설 24개 텍스트 표/,
    /관찰.*한계.*각각 30자 이상/s,
    /새 런타임.*모두 실행/s,
    /🎉 WEEK 10 INTERACTIVE MAP COMPLETE/,
    /자동 검사는 미적 취향을 채점하지 않는다/,
    /FINAL CHECK 코드는 수정하지 않는다/,
    /세 파일을 모두 올리고.*즉시 귀가/s,
    /선택 확장.*귀가 조건이 아니며 추가 점수도 없습니다/s,
    /11주차 연결.*Matplotlib.*Seaborn/s,
  ]) {
    assert.match(period3, pattern);
  }

  assert.match(period3, /<html lang="ko" class="week-10-root">/);
  assert.match(
    period3,
    /<body class="teaching-document course-contents-programming week-10-document">/,
  );
  assert.equal([...period3.matchAll(/class="hero-chip"/g)].length, 3);
  assert.equal([...period3.matchAll(/class="meta-row"/g)].length, 5);
  assert.match(
    period3,
    /og:image" content="https:\/\/creativeengineer-kimjungho\.com\/teaching\/contents-programming\/assets\/week-10-map-mission-preview\.png"/,
  );
  assert.match(period3, /assets\/week-10-map-mission-preview\.png/);
  assert.equal(
    [...period3.matchAll(/class="completion-check"/g)].length,
    12,
    "every exit criterion should be a real checkbox",
  );
  assert.match(period3, /data-mission-progress/);
  assert.match(period3, /aria-live="polite">완료 0\/12</);
  assert.match(period3, /data-mission-reset/);
  assert.match(period3, /\/assets\/week-10-mission-progress\.js/);
});

test("Contents Programming week 10 mission notebook contains a complete self-checking Folium workflow", async () => {
  const notebook = JSON.parse(
    await readFile(
      resolve(assetDirectory, "week-10-interactive-map-mission.ipynb"),
      "utf8",
    ),
  );
  const codeCells = notebook.cells.filter((cell) => cell.cell_type === "code");
  const notebookCode = codeCells.flatMap((cell) => cell.source).join("");
  const exampleMap = await readFile(
    resolve(assetDirectory, "week-10-interactive-map-example.html"),
    "utf8",
  );
  const generator = await readFile(
    resolve(root, "scripts", "generate-week10-map-mission.py"),
    "utf8",
  );

  assert.equal(notebook.nbformat, 4);
  assert.equal(notebook.nbformat_minor, 5);
  assert.equal(codeCells.length, 7);
  assert.equal(
    [...notebookCode.matchAll(/# STEP \d · EDIT/g)].length,
    2,
    "students should edit only STEP 1 and STEP 5",
  );

  for (const pattern of [
    /SAMPLE_CSV_PATH = "week10_public_facilities_raw\.csv"/,
    /"folium": "0\.20\.0"/,
    /"pandas": "3\.0\.5"/,
    /packages_to_install/,
    /Path\(SAMPLE_CSV_PATH\)\.write_text\(SAMPLE_CSV, encoding="utf-8"\)/,
    /dataset_source.*dataset_license.*reference_date.*observation_unit/s,
    /privacy_statement.*개인의 집·학교·이동 경로/s,
    /student_id = "학번".*student_name = "이름"/s,
    /minimum_radius = 10.*maximum_radius = 10/s,
    /palette_options.*['"]해안['"].*['"]숲길['"].*['"]도시['"]/s,
    /palette_name = "선택 전"/,
    /category_colors = palette_options\.get/s,
    /source_bytes_before = source_path\.read_bytes\(\)/,
    /raw_snapshot = raw_df\.copy\(deep=True\)/,
    /clean_df = raw_df\.copy\(deep=True\)/,
    /pd\.to_numeric\([\s\S]*errors="coerce"/,
    /dropna\([\s\S]*drop_duplicates\([\s\S]*between\(-90, 90\)[\s\S]*between\(-180, 180\)/,
    /"원본": len\(raw_df\).*"좌표 범위 처리 후": len\(clean_df\)/s,
    /def scale_radius\(program_count\):/,
    /def category_to_color\(category\):/,
    /folium\.Map\([\s\S]*tiles="CartoDB positron"/,
    /for row_index, row in clean_df\.iterrows\(\):/,
    /folium\.CircleMarker\([\s\S]*tooltip=tooltip_text,[\s\S]*popup=popup_text/s,
    /marker_records\.append\(/,
    /legend_html/,
    /pattern_observation.*limitation_statement/s,
    /filename_student_id = re\.sub/,
    /facility_table_html/,
    /지도 마커의 텍스트 대체 정보/,
    /clean_df\.to_csv\([\s\S]*facility_map\.save\(map_filename\)/,
    /== \(1, 2, 3, 4, 5, 6, 7\)/,
    /raw_df\.equals\(raw_snapshot\)/,
    /cleaning_counts[\s\S]*"결측 처리 후": 27[\s\S]*"중복 처리 후": 26[\s\S]*"좌표 범위 처리 후": 24/,
    /4 <= minimum_radius < maximum_radius <= 28/,
    /palette_name in approved_palette_names/,
    /category_colors == palette_options\.get\(palette_name\)/,
    /marker_count == len\(clean_df\) == 24/,
    /saved_map_html\.count\("L\.circleMarker\("\) == 24/,
    /WEEK 10 INTERACTIVE MAP COMPLETE/,
  ]) {
    assert.match(notebookCode, pattern);
  }

  assert.doesNotMatch(
    notebookCode,
    /TODO|rest of code|similar to above|continue pattern|add more as needed/i,
  );

  for (const pattern of [
    /<link rel="canonical" href="https:\/\/creativeengineer-kimjungho\.com\/teaching\/contents-programming\/assets\/week-10-interactive-map-example\.html">/,
    /<main id="main-content">/,
    /10주차 인터랙티브 위치 데이터 지도 예시/,
    /서울 가상 공공문화시설 프로그램 지도/,
    /시설 범주/,
    /원 크기 = 프로그램 수/,
    /교수자 제공 가상 자료/,
    /class="week10-map-panel week10-map-info"/,
    /class="week10-map-panel week10-map-legend"/,
    /@media \(max-width: 760px\)/,
    /<details class="week10-map-panel week10-map-info">/,
    /week-10-map-mission-preview\.png/,
    /class="week10-map-data"/,
    /지도 마커의 텍스트 대체 정보/,
  ]) {
    assert.match(exampleMap, pattern);
  }
  assert.doesNotMatch(exampleMap, /maximum-scale|user-scalable/);
  assert.doesNotMatch(exampleMap, /z-index:\s*9999/);
  assert.doesNotMatch(exampleMap, /style="position:fixed/);
  assert.doesNotMatch(exampleMap, /[ \t]+\n/);
  assert.equal(exampleMap.match(/L\.circleMarker\(/g)?.length, 24);
  assert.equal(exampleMap.match(/<tr>/g)?.length, 25);

  for (const pattern of [
    /week10_map_overlay_css/,
    /week10-map-info/,
    /week10-map-legend/,
    /week10-map-data/,
    /maximum-scale=1\.0, user-scalable=no/,
    /palette_name in approved_palette_names/,
  ]) {
    assert.match(notebookCode, pattern);
  }

  for (const pattern of [
    /def build_notebook/,
    /def clean_source_data/,
    /def build_facility_table_html/,
    /def build_example_map/,
    /def assign_deterministic_ids/,
    /def normalize_generated_html_ids/,
    /def normalize_generated_html_whitespace/,
    /def validate_runtime/,
    /def validate_outputs/,
    /--asset-dir/,
    /week-10-interactive-map-mission\.ipynb/,
    /week-10-interactive-map-example\.html/,
  ]) {
    assert.match(generator, pattern);
  }
});

test("Contents Programming week 10 practice data and diagrams stay complete and reproducible", async () => {
  const [sampleCsv, generator, requirements, packageJson] = await Promise.all([
    readFile(
      resolve(assetDirectory, "week-10-public-facilities-practice.csv"),
      "utf8",
    ),
    readFile(resolve(root, "scripts", "generate-week10-map-assets.py"), "utf8"),
    readFile(resolve(root, "requirements-week10-assets.txt"), "utf8"),
    readFile(resolve(root, "package.json"), "utf8"),
  ]);
  const csvLines = sampleCsv.trimEnd().split(/\r?\n/);

  assert.equal(csvLines.length, 30, "the sample should contain 29 records");
  assert.equal(
    csvLines[0],
    "place_id,place_name,category,program_count,latitude,longitude",
  );
  assert.equal(
    [...sampleCsv.matchAll(/^C004,/gm)].length,
    2,
    "the practice data should contain one duplicate place identifier",
  );
  for (const problemValue of [",unknown,", ",95.0,", ",226.99", ",,127.01"]) {
    assert.match(sampleCsv, new RegExp(problemValue.replaceAll(".", "\\.")));
  }

  for (const filename of [
    "week-10-public-facilities-practice.csv",
    "week-10-location-encoding.png",
    "week-10-cleaning-to-map.png",
    "week-10-map-mission-preview.png",
  ]) {
    assert.match(generator, new RegExp(filename.replaceAll(".", "\\.")));
  }
  assert.match(generator, /class PlaceRecord:/);
  assert.match(generator, /def write_practice_csv/);
  assert.match(generator, /def make_location_encoding/);
  assert.match(generator, /def make_cleaning_to_map/);
  assert.match(generator, /def make_map_mission_preview/);
  assert.match(generator, /inter-latin-variable\.woff2/);
  assert.match(generator, /set_variation_by_name/);
  assert.match(generator, /def validate_runtime/);
  assert.doesNotMatch(generator, /System\/Library\/Fonts|usr\/share\/fonts/);
  assert.match(generator, /CORAL_TEXT = \(166, 54, 43, 255\)/);
  assert.match(generator, /OCHRE_TEXT = \(117, 82, 0, 255\)/);
  assert.doesNotMatch(generator, /fill=YELLOW, font=/);
  assert.match(requirements, /^folium==0\.20\.0$/m);
  assert.match(requirements, /^pandas==3\.0\.5$/m);
  assert.match(requirements, /^Pillow==11\.1\.0$/m);
  assert.match(requirements, /^# runtime:freetype==2\.13\.2$/m);
  assert.match(packageJson, /"generate:week10-assets"/);
  assert.match(packageJson, /"test:week10-assets"/);

  for (const filename of [
    "week-10-location-encoding.png",
    "week-10-cleaning-to-map.png",
    "week-10-map-mission-preview.png",
  ]) {
    const png = await readFile(resolve(assetDirectory, filename));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), 1440);
    assert.equal(png.readUInt32BE(20), 900);
    assert.ok(png.length > 20_000, `${filename} should contain a complete diagram`);
  }
});

test("Contents Programming week 10 generated assets match a clean pinned regeneration", async (t) => {
  const pythonExecutable = process.env.WEEK10_PYTHON || "python3";
  const assetGenerator = resolve(
    root,
    "scripts",
    "generate-week10-map-assets.py",
  );
  const mapGenerator = resolve(
    root,
    "scripts",
    "generate-week10-map-mission.py",
  );
  const probes = [
    spawnSync(pythonExecutable, [assetGenerator, "--check-runtime"], {
      cwd: root,
      encoding: "utf8",
    }),
    spawnSync(pythonExecutable, [mapGenerator, "--check-runtime"], {
      cwd: root,
      encoding: "utf8",
    }),
  ];
  const failedProbe = probes.find((probe) => probe.status !== 0);
  if (failedProbe) {
    if (process.env.WEEK10_STRICT_ASSET_TEST === "1") {
      assert.fail(
        `the pinned Week 10 asset runtime is unavailable:\n${failedProbe.stdout}\n${failedProbe.stderr}`,
      );
    }
    t.skip("install the pinned asset toolchain with `npm run setup:week10-assets`");
    return;
  }

  assert.match(probes[0].stdout, /Pillow 11\.1\.0, freetype 2\.13\.2/);
  assert.match(probes[1].stdout, /folium 0\.20\.0, pandas 3\.0\.5/);

  const outputDirectory = await mkdtemp(join(tmpdir(), "week10-assets-"));
  try {
    for (const generator of [assetGenerator, mapGenerator]) {
      const generated = spawnSync(
        pythonExecutable,
        [generator, "--asset-dir", outputDirectory],
        { cwd: root, encoding: "utf8" },
      );
      assert.equal(
        generated.status,
        0,
        `Week 10 generation failed:\n${generated.stdout}\n${generated.stderr}`,
      );
    }

    for (const filename of [
      "week-10-public-facilities-practice.csv",
      "week-10-location-encoding.png",
      "week-10-cleaning-to-map.png",
      "week-10-map-mission-preview.png",
      "week-10-interactive-map-mission.ipynb",
      "week-10-interactive-map-example.html",
    ]) {
      const [committed, regenerated] = await Promise.all([
        readFile(resolve(assetDirectory, filename)),
        readFile(resolve(outputDirectory, filename)),
      ]);
      assert.ok(
        committed.equals(regenerated),
        `${filename} should match a clean regeneration`,
      );
    }
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test("Contents Programming week 10 notebook passes a real fresh-session scenario", (t) => {
  const pythonExecutable = process.env.WEEK10_PYTHON || "python3";
  const mapGenerator = resolve(
    root,
    "scripts",
    "generate-week10-map-mission.py",
  );
  const runtimeProbe = spawnSync(
    pythonExecutable,
    [mapGenerator, "--check-runtime"],
    { cwd: root, encoding: "utf8" },
  );
  if (runtimeProbe.status !== 0) {
    if (process.env.WEEK10_STRICT_NOTEBOOK_TEST === "1") {
      assert.fail(
        `the pinned Week 10 notebook runtime is unavailable:\n${runtimeProbe.stdout}\n${runtimeProbe.stderr}`,
      );
    }
    t.skip("install the pinned notebook toolchain with `npm run setup:week10-assets`");
    return;
  }

  const verification = spawnSync(
    pythonExecutable,
    [
      resolve(root, "tests", "verify-week10-notebook.py"),
      resolve(assetDirectory, "week-10-interactive-map-mission.ipynb"),
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(
    verification.status,
    0,
    `Week 10 notebook scenarios failed:\n${verification.stdout}\n${verification.stderr}`,
  );
  assert.match(verification.stdout, /week10 notebook scenarios PASS/);
});

test("Contents Programming week 10 visuals and interactions remain readable and scoped", async () => {
  const [
    period1,
    period2,
    period3,
    teachingCss,
    progressScript,
    siteConfig,
  ] =
    await Promise.all([
      readFile(resolve(courseDirectory, "week-10-period1.html"), "utf8"),
      readFile(resolve(courseDirectory, "week-10-period2.html"), "utf8"),
      readFile(resolve(courseDirectory, "week-10-period3.html"), "utf8"),
      readFile(resolve(root, "assets", "teaching.css"), "utf8"),
      readFile(resolve(root, "assets", "week-10-mission-progress.js"), "utf8"),
      readFile(resolve(root, "scripts", "site-config.mjs"), "utf8"),
    ]);

  for (const [html, minimumVisualLinks] of [
    [period1, 2],
    [period2, 1],
    [period3, 1],
  ]) {
    assert.ok(
      [...html.matchAll(/class="lesson-visual-link"/g)].length >=
        minimumVisualLinks,
      "each Week 10 diagram should offer an explicit full-size view",
    );
    assert.match(html, /원본 크기로 보기/);
    assert.doesNotMatch(html, /[—–]/);
  }

  for (const pattern of [
    /html\.week-10-root\s*\{[\s\S]*?scroll-behavior:\s*auto/,
    /body\.week-10-document[\s\S]*?\.article h2\s*\{[\s\S]*?counter-increment:\s*none/,
    /body\.week-10-document[\s\S]*?\.article h2::before\s*\{[\s\S]*?content:\s*none/,
    /body\.week-10-document summary:active\s*\{[\s\S]*?transform:\s*none/,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.inline-resource-card:not\(:active\):hover/,
    /\.mission-progress/,
    /\.completion-check/,
    /\.mission-progress span\s*\{[\s\S]*?font-size:\s*12px/,
    /\.mission-progress button\s*\{[\s\S]*?font:\s*650 12px\/1\.35/,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?body\.week-10-document \.inline-resource-card[\s\S]*?transition:\s*none/,
  ]) {
    assert.match(teachingCss, pattern);
  }

  for (const pattern of [
    /localStorage\.getItem/,
    /localStorage\.setItem/,
    /data-complete/,
    /change/,
    /data-mission-reset/,
  ]) {
    assert.match(progressScript, pattern);
  }
  assert.doesNotMatch(progressScript, /window\.addEventListener\(["']scroll/);
  for (const imagePath of [
    "week-10-location-encoding.png",
    "week-10-cleaning-to-map.png",
    "week-10-map-mission-preview.png",
  ]) {
    assert.match(
      siteConfig,
      new RegExp(
        `path: "/teaching/contents-programming/assets/${imagePath.replaceAll(".", "\\.")}"`,
      ),
    );
  }
});
