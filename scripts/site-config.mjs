import { relative } from "node:path";

export const SITE_ORIGIN = "https://creativeengineer-kimjungho.com";

export const TEACHING_SHARE_IMAGES = Object.freeze({
  "agentic-ai": Object.freeze({
    path: "/teaching/agentic-ai/day-1-assets/embedded-81b732575b07d71e.jpg",
    alt: "Cinematic storyboard scene used in the agentic AI workshop",
  }),
  "game-engine": Object.freeze({
    path: "/teaching/game-engine/assets/09_final-rendered-frame.webp",
    alt: "Final cinematic environment rendered for the Game Engine course",
  }),
  "game-engine-1": Object.freeze({
    path: "/teaching/game-engine-1/assets/unity-2d-ai-pipeline.svg",
    alt: "A prompt creates pixel art sprite variations that are integrated and tested in a Unity 2D scene",
  }),
  "contents-programming": Object.freeze({
    path: "/teaching/contents-programming/assets/python-data-art.svg",
    alt: "Python code, plotted points, bars, and a waveform composed as data art",
  }),
  "media-art-programming": Object.freeze({
    path: "/teaching/media-art-programming/assets/7week/09_finished-examples-gallery.png",
    alt: "Four interactive creative coding outcomes from the Media Art Programming course",
  }),
});

const PAGE_SHARE_IMAGES = Object.freeze({
  "teaching/game-engine-1/week-01-ot.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-01-blockout-to-game.webp",
    alt: "동일한 탑다운 2D 게임 장면이 회색 블록아웃에서 완성된 픽셀 아트 장면으로 발전하는 비교 이미지",
  }),
  "teaching/game-engine-1/week-02-foundations.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-02-modular-scene.webp",
    alt: "탑다운 2D 게임 장면과 장면을 구성하는 배경, 캐릭터, 수집물, 상자와 나무 모듈을 함께 보여 주는 픽셀 아트 이미지",
  }),
  "teaching/game-engine-1/week-02-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-02-period1-editor-model.webp",
    alt: "하나의 2D 게임 프로젝트 상자 안에 Scene과 GameObject, Component 조각이 단계별로 정리된 픽셀 아트 작업대",
  }),
  "teaching/game-engine-1/week-02-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-02-period2-scene-system.webp",
    alt: "방향 표시가 붙은 캐릭터, 겹친 배경과 전경, 하나의 원본에서 나온 세 수집물로 장면 조립 원리를 보여 주는 픽셀 아트 작업대",
  }),
  "teaching/game-engine-1/week-02-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-02-period3-playground-goal.webp",
    alt: "플레이어와 방향 표시, 동일한 수집물 세 개, 배경과 전경이 배치된 작은 탑다운 픽셀 아트 Playground 완성 예시",
  }),
  "teaching/game-engine-1/week-04-input-physics.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-04-period1-hero.webp",
    alt: "빈 방향키 묶음과 아날로그 스틱의 신호가 하나의 이동 행동으로 합쳐지는 입체 도해",
  }),
  "teaching/game-engine-1/week-04-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-04-period1-hero.webp",
    alt: "빈 방향키 묶음과 아날로그 스틱의 신호가 하나의 2축 이동 행동으로 합쳐지는 입체 도해",
  }),
  "teaching/game-engine-1/week-04-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-04-period2-hero.webp",
    alt: "어두운 격자형 2D 공간에서 주황색 플레이어가 네 방향으로 움직이고 벽 앞에서 멈추는 입체 장면",
  }),
  "teaching/game-engine-1/week-04-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-04-period3-hero.webp",
    alt: "주황색 플레이어가 네 개의 벽을 피해 정확히 여덟 개의 초록색 검증 지점을 통과하는 입체 테스트 코스",
  }),
  "teaching/game-engine-1/week-05-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-05-period1-trigger-event.webp",
    alt: "주황색 플레이어가 단단한 벽에는 막히고 청록색 Trigger 영역은 통과하며 사건을 발생시키는 입체 비교 장면",
  }),
  "teaching/game-engine-1/week-05-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-05-period2-tilemap-system.webp",
    alt: "타일로 조립한 작은 2D 레벨과 Ground·Collision·Interaction 레이어를 분리해 보여 주는 입체 시스템 장면",
  }),
  "teaching/game-engine-1/week-05-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-05-period3-interaction-mission.webp",
    alt: "주황색 플레이어가 수집물 세 개와 위험 구역 두 개를 지나 목표 문과 여덟 검증 지점으로 향하는 입체 미션 장면",
  }),
  "teaching/game-engine-1/week-06-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-06-period1-hero.webp",
    alt: "여섯 개의 캐릭터 프레임과 같은 위치의 Pivot, 타임라인이 하나의 걷기 움직임으로 이어지는 입체 도해",
  }),
  "teaching/game-engine-1/week-06-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-06-period2-hero.webp",
    alt: "Idle과 Move 상태가 양방향 화살표로 연결되고, 캐릭터를 Dead Zone 안에 둔 카메라 프레임이 레벨 경계 안에서 추적하는 입체 도해",
  }),
  "teaching/game-engine-1/week-06-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-06-period3-hero.webp",
    alt: "애니메이션 캐릭터와 카메라 프레임이 레벨 안에서 정확히 여덟 개의 연두색 검증 지점을 통과하는 입체 테스트 장면",
  }),
  "teaching/game-engine-1/week-07-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-07-period1-state-loop.webp",
    alt: "플레이어 말이 준비, 플레이, 성공, 실패 지점을 순환하고 중앙의 점수 계수기와 시간 다이얼이 상태를 보여 주는 입체 모형",
  }),
  "teaching/game-engine-1/week-07-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-07-period2-feedback-system.webp",
    alt: "중앙의 게임 관리자 장치가 점수 표시기, 수집물, 스피커, 재시작 버튼과 빌드 상자에 케이블로 연결된 입체 모형",
  }),
  "teaching/game-engine-1/week-07-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-07-period3-preflight-mission.webp",
    alt: "플레이어가 제한 시간 안에 세 개의 수집물을 모으는 작은 경기장과 점수 슬롯, 결과 패널, 실패 경광등, 재시작 버튼을 보여 주는 입체 모형",
  }),
  "teaching/game-engine-1/week-09-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-09-period1-ai-direction.webp",
    alt: "확대경, 계획 카드, 권한 문 뒤의 도구 팔, 개인정보 방패와 색상표로 책임 있는 AI 제작 순서를 보여 주는 입체 작업대",
  }),
  "teaching/game-engine-1/week-09-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-09-period2-style-system.webp",
    alt: "같은 숲의 배달부 캐릭터 후보 세 장, 다섯 색 팔레트, 실루엣과 재질 표본을 정렬한 입체 아트 디렉션 작업대",
  }),
  "teaching/game-engine-1/week-09-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-09-period3-selection-mission.webp",
    alt: "같은 숲의 배달부 후보 세 장 중 한 장을 연두색 틀로 선택하고 다섯 색 팔레트와 여덟 검증 표식을 배치한 개인 작업대",
  }),
  "teaching/game-engine-1/week-10-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-10-period1-asset-readiness.webp",
    alt: "여러 캐릭터 후보가 픽셀 격자와 피벗, 투명 경계, 다섯 개 검증 관문을 갖춘 하나의 게임 에셋으로 정리되는 작업대",
  }),
  "teaching/game-engine-1/week-10-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-10-period2-integration-pipeline.webp",
    alt: "배경이 남은 캐릭터 후보가 투명 배경의 정리된 Sprite, 같은 기준선의 네 프레임, 게임과 UI에 통합된 결과로 이어지는 작업대",
  }),
  "teaching/game-engine-1/week-10-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-10-period3-asset-kit-mission.webp",
    alt: "네 캐릭터 프레임, 수집물, 위험, 목표 아이콘, UI 패널이 여덟 검증등과 함께 실제 숲 게임 장면에서 작동하는 개인 미션 보드",
  }),
  "teaching/game-engine-1/week-11-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-11-period1-ai-workflow.webp",
    alt: "확대경의 읽기 단계, 두 파일의 계획 단계, 권한 문 안쪽의 도구 팔과 마지막 검증 관문을 연결한 입체 작업대",
  }),
  "teaching/game-engine-1/week-11-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-11-period2-bounded-change.webp",
    alt: "한 변경 조각이 좁은 권한 문을 지나 두 Script가 되고 diff 확대경, 수동 연결과 시간 다이얼 검증으로 이어지는 입체 작업대",
  }),
  "teaching/game-engine-1/week-11-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-11-period3-time-bonus-mission.webp",
    alt: "플레이어가 하나의 시계 보너스로 향하고 두 파일 범위, 한 번 처리 관문, 시간 다이얼과 기존 게임 루프 검증 등을 통과하는 입체 미션 보드",
  }),
  "teaching/game-engine-1/week-12-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-12-period1-control-surfaces.webp",
    alt: "Gateway, MCP, CLI와 Pipeline 네 모듈이 읽기 허용과 쓰기 잠금 경계를 지나 기준 상태와 검증 결과를 연결하는 입체 작업대",
  }),
  "teaching/game-engine-1/week-12-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-12-period2-bounded-automation.webp",
    alt: "기준 상태 저장, 읽기 스캔, 권한 잠금, X축 한 칸 변경과 원상복구를 다섯 단계로 배열한 자동화 시연 작업대",
  }),
  "teaching/game-engine-1/week-12-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-12-period3-readiness-mission.webp",
    alt: "연결, CLI와 오프라인 세 경로가 기준 상태, Console, Component, 권한 계약, 단일 변경, 복구 증거와 여덟 검증 표시등으로 모이는 개인 미션 보드",
  }),
  "teaching/game-engine-1/week-13-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-13-period1-feedback-orchestra.webp",
    alt: "수집·피해·목표 사건이 각각 UI 변화와 효과음 신호로 짝을 이루고, 음소거 상태에서도 핵심 정보가 남는 숲 게임 피드백 작업대",
  }),
  "teaching/game-engine-1/week-13-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-13-period2-playtest-evidence.webp",
    alt: "동일한 숲 게임을 실행한 세 개의 독립 테스트가 관찰표와 우선순위 보드를 거쳐 한 가지 수정과 초록색 회귀 검사로 이어지는 작업대",
  }),
  "teaching/game-engine-1/week-13-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-13-period3-alpha-mission.webp",
    alt: "숲 게임 알파 빌드 주위의 세 독립 테스터 기록, 한 가지 UI 수정 전후, 정확히 여덟 개의 통과 표시와 최종 제출 묶음",
  }),
  "teaching/game-engine-1/week-14-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-14-period1-scope-architecture.webp",
    alt: "작은 2D 게임이 플레이 화면, 재사용 오브젝트와 동작 구조의 세 층으로 정리되고 남은 기능은 별도 보관함으로 분리된 기술 작업대",
  }),
  "teaching/game-engine-1/week-14-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-14-period2-mentoring-studio-v2.webp",
    alt: "교수자와 시연자 두 사람이 작은 게임 모형, 네 단계 동작 흐름과 확대된 문제 하나를 확인하고 주변 관찰석이 분리된 미니어처 면담 교실",
  }),
  "teaching/game-engine-1/week-14-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-14-period3-checkpoint-route.webp",
    alt: "작은 2D 게임의 문제 토큰 하나가 제한된 변경 관문을 지나 같은 게임에서 재검사되고 구조도, 실행 build와 면담 기록이 담긴 증거 보관함으로 이어지는 작업대",
  }),
  "teaching/game-engine-1/week-15-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-15-period1-release-gates.webp",
    alt: "숲 게임 실행 화면을 중심으로 위험 카드 하나가 검토 관문을 지나 초록색 통과 증거가 되는 릴리스 점검 작업대",
  }),
  "teaching/game-engine-1/week-15-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-15-period2-review-desk.webp",
    alt: "숲 게임을 가운데 두고 교수자와 학생의 관찰, 구조, 권리와 제출 증거가 차례로 연결된 릴리스 면담 작업대",
  }),
  "teaching/game-engine-1/week-15-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-15-period3-rc-mission.webp",
    alt: "문제가 표시된 숲 게임이 면담 기록과 한 번의 변경을 지나 여덟 검증 불빛을 통과하고 최종 제출 봉투로 이어지는 릴리스 미션 작업대",
  }),
  "teaching/game-engine-1/week-03-period1.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-03-period1-script-component.webp",
    alt: "코드 패널과 컴포넌트 설정이 2D 오브젝트의 위치 변화로 이어지는 생성형 교육 이미지",
  }),
  "teaching/game-engine-1/week-03-period2.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-03-period2-lifecycle-time.webp",
    alt: "초기화부터 반복 이동과 회전까지 네 프레임의 흐름을 보여 주는 생성형 교육 이미지",
  }),
  "teaching/game-engine-1/week-03-period3.html": Object.freeze({
    path: "/teaching/game-engine-1/assets/week-03-period3-motion-mission.webp",
    alt: "세 개의 실험 레인에서 서로 다른 움직임을 보이는 오브젝트와 검증 표식을 담은 생성형 교육 이미지",
  }),
  "teaching/contents-programming/week-03-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-03-period1-hero.webp",
    alt: "정사각 픽셀 격자에서 원점과 좌표 관계를 보여 주는 3주차 1교시 이미지",
  }),
  "teaching/contents-programming/week-03-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-03-period2-hero.webp",
    alt: "RGB 색상 조각과 좌표 기반 도형 구성을 보여 주는 3주차 2교시 이미지",
  }),
  "teaching/contents-programming/week-03-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-03-period3-hero.webp",
    alt: "종이 위 기하학적 도형 작품과 색상표를 보여 주는 3주차 이미지 미션",
  }),
  "teaching/contents-programming/week-04-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-04-period1-hero.webp",
    alt: "종이 위 반복 도형과 간격 변화로 시각적 리듬을 보여 주는 4주차 1교시 이미지",
  }),
  "teaching/contents-programming/week-04-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-04-period2-hero.webp",
    alt: "색상 조각과 행렬 격자로 리스트와 중첩 반복을 보여 주는 4주차 2교시 이미지",
  }),
  "teaching/contents-programming/week-04-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-04-period3-hero.webp",
    alt: "완성된 리듬 그리드 출력물과 색상표를 보여 주는 4주차 개인 실습 이미지",
  }),
  "teaching/contents-programming/week-05-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-05-period1-hero.webp",
    alt: "같은 규칙에서 달라진 세 가지 종이 도형 배열로 난수와 시드를 보여 주는 5주차 1교시 이미지",
  }),
  "teaching/contents-programming/week-05-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-05-period2-hero.webp",
    alt: "크기에 따라 윤곽 원과 채운 원, 사각형으로 나뉜 조건문 구성을 보여 주는 5주차 2교시 이미지",
  }),
  "teaching/contents-programming/week-05-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-05-period3-hero.webp",
    alt: "무작위 위치와 크기를 조건에 따라 분류한 완성 포스터와 색상표를 보여 주는 5주차 개인 실습 이미지",
  }),
  "teaching/contents-programming/week-06-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-06-period1-hero.webp",
    alt: "반복되는 종이 도형 절차를 하나의 파란 함수 틀로 묶는 6주차 1교시 이미지",
  }),
  "teaching/contents-programming/week-06-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-06-period2-hero.webp",
    alt: "색상과 크기 입력 조각을 파란 생성 틀에 바꾸어 넣고 세 결과를 만드는 6주차 2교시 이미지",
  }),
  "teaching/contents-programming/week-06-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-06-period3-hero.webp",
    alt: "하나의 파란 생성 틀에서 나온 서로 다른 세 기하학 포스터를 나란히 보여 주는 6주차 3교시 이미지",
  }),
  "teaching/contents-programming/week-07-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-07-period1-hero.webp",
    alt: "한 장의 기하학 포스터를 자르고 크기와 방향을 바꾼 종이 조각을 보여 주는 7주차 1교시 이미지",
  }),
  "teaching/contents-programming/week-07-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-07-period2-hero.webp",
    alt: "투명도가 다른 세 종이 레이어가 겹쳐 하나의 화면이 되는 7주차 2교시 이미지",
  }),
  "teaching/contents-programming/week-07-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-07-period3-hero.webp",
    alt: "서로 다르게 변형한 세 종이 레이어를 한 화면에 합성한 7주차 3교시 이미지",
  }),
  "teaching/contents-programming/week-10-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-10-location-encoding.png",
    alt: "위치 데이터의 열이 지도 마커의 위치, 크기, 색상, 문자 정보로 바뀌는 10주차 도해",
  }),
  "teaching/contents-programming/week-10-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-10-cleaning-to-map.png",
    alt: "원본 CSV 29행을 숫자 변환과 필터링으로 24행까지 정제해 지도 마커 24개로 바꾸는 10주차 2교시 도해",
  }),
  "teaching/contents-programming/week-10-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-10-map-mission-preview.png",
    alt: "지도 마커 24개와 원본 보존·정제·인코딩·해석·세 파일 제출을 확인하는 10주차 지도 미션 도해",
  }),
  "teaching/contents-programming/assets/week-10-interactive-map-example.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-10-map-mission-preview.png",
    alt: "지도 마커 24개와 원본 보존·정제·인코딩·해석·세 파일 제출을 확인하는 10주차 지도 미션 도해",
  }),
  "teaching/contents-programming/week-11-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-11-question-to-chart.png",
    alt: "비교, 분포, 관계, 공간 질문을 네 가지 그래프에 연결하는 11주차 도해",
  }),
  "teaching/contents-programming/week-11-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-11-figure-axes.png",
    alt: "하나의 Figure 안에 제목, 막대그래프, 산점도와 설명을 배치한 11주차 구조 도해",
  }),
  "teaching/contents-programming/week-11-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-11-data-poster-example.png",
    alt: "막대그래프, 좌표 산점도, 관찰과 한계를 한 장에 구성한 11주차 데이터 포스터 예시",
  }),
  "teaching/contents-programming/week-13-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-13-sound-four-views.png",
    alt: "한 소리를 재생 화면, 파형, 프레임 RMS, 상대 스펙트로그램으로 비교한 13주차 수업 시각 자료",
  }),
  "teaching/contents-programming/week-13-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-13-sound-pattern-poster-example.png",
    alt: "파형, 프레임 RMS, 상대 스펙트로그램과 근거 문장을 한 장에 구성한 사운드 패턴 포스터 예시",
  }),
  "teaching/contents-programming/week-13-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-13-sound-pattern-poster-example.png",
    alt: "파형, 프레임 RMS, 상대 스펙트로그램과 근거 문장을 한 장에 구성한 사운드 패턴 포스터 예시",
  }),
  "teaching/contents-programming/assets/week-13-project-seed-example.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-13-sound-pattern-poster-example.png",
    alt: "파형, 프레임 RMS, 상대 스펙트로그램과 근거 문장을 한 장에 구성한 사운드 패턴 포스터 예시",
  }),
  "teaching/contents-programming/week-02-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-02-data-profile-high.png",
    alt: "변수 값으로 막대 길이와 원 크기를 표현한 데이터 프로필 예시",
  }),
  "teaching/contents-programming/week-02-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-02-mission-preview.png",
    alt: "변수와 계산 결과를 보여주는 2주차 자기소개 데이터 미션 미리보기",
  }),
  "teaching/contents-programming/week-14-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-14-scope-to-slice.png",
    alt: "넓은 프로젝트 아이디어를 한 질문, 한 입력, 한 규칙, 한 표현과 한 결과로 줄이는 범위 설계 도해",
  }),
  "teaching/contents-programming/week-14-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-14-prototype-contract.png",
    alt: "입력, 원본 보존, 처리, 시각적 매핑, 파일 저장과 검토 증거를 연결한 30퍼센트 프로토타입 도해",
  }),
  "teaching/contents-programming/week-14-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-14-four-path-preview.png",
    alt: "데이터 막대, 텍스트 빈도 막대, 사운드 에너지 선, 규칙 기반 원 구성으로 이루어진 네 가지 프로젝트 경로 예시",
  }),
  "teaching/contents-programming/week-15-period1.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-15-progress-ladder.png",
    alt: "30%, 70%, 100% 프로젝트 단계와 다섯 검토 기준을 연결한 진행 사다리",
  }),
  "teaching/contents-programming/week-15-period2.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-15-submission-package.png",
    alt: "노트북, 수정 결과 이미지, 수정 기록, 조건부 원본 파일이 증거 확인 단계로 모이는 제출 패키지 도표",
  }),
  "teaching/contents-programming/week-15-period3.html": Object.freeze({
    path: "/teaching/contents-programming/assets/week-15-before-after.png",
    alt: "네 프로젝트 경로의 수정 전과 수정 후 비교 사례",
  }),
});

function relativeWebPath(root, path) {
  return relative(root, path).split("\\").join("/");
}

export function publicUrlForHtml(root, htmlPath) {
  const relativePath = relativeWebPath(root, htmlPath);
  if (relativePath === "index.html") return `${SITE_ORIGIN}/`;
  if (relativePath.endsWith("/index.html")) {
    return `${SITE_ORIGIN}/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${SITE_ORIGIN}/${relativePath}`;
}

export function shareImageMetadataForHtml(root, htmlPath) {
  const relativePath = relativeWebPath(root, htmlPath);
  let image = {
    path: "/assets/creative-engineering-character-v2.jpg",
    alt: "Fictional animated maker-explorer character holding a translucent design panel",
  };

  for (const [course, candidate] of Object.entries(TEACHING_SHARE_IMAGES)) {
    if (relativePath.startsWith(`teaching/${course}/`)) {
      image = candidate;
      break;
    }
  }
  if (PAGE_SHARE_IMAGES[relativePath]) {
    image = PAGE_SHARE_IMAGES[relativePath];
  }
  if (relativePath === "teaching/index.html") {
    image = TEACHING_SHARE_IMAGES["agentic-ai"];
  }

  return { url: `${SITE_ORIGIN}${image.path}`, alt: image.alt };
}
