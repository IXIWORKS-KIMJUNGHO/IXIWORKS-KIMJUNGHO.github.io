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
    path: "/teaching/contents-programming/assets/week-14-three-track-preview.png",
    alt: "데이터 막대, 텍스트 빈도 막대, 사운드 에너지 선으로 구성된 세 가지 프로젝트 경로 예시",
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
