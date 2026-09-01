export type TeachingCourse = {
  title: string;
  href?: string;
  description: string;
};

export const TEACHING_COURSES: TeachingCourse[] = [
  {
    title: "Game Engine I / II",
    href: "teaching/game-engine/",
    description:
      "Unreal Engine, real-time production, interactive systems, and project-based prototyping.",
  },
  {
    title: "Contents Programming Practice",
    href: "teaching/contents-programming/",
    description:
      "Creative coding, production pipelines, and practical software prototyping for media content.",
  },
  {
    title: "Media Art Programming Practice",
    href: "teaching/media-art-programming/",
    description:
      "p5.js, interaction design, audiovisual media, and experimental computational expression.",
  },
  {
    title: "Digital Archiving and Data Visualization",
    description:
      "Data storytelling, cultural data systems, visual analysis, and digital archive workflows.",
  },
  {
    title: "프로그래밍은 몰라도 AI는 사용합니다만",
    href: "teaching/agentic-ai/",
    description:
      "한국예술종합학교 융합예술센터 아트콜라이더 아카데미 바이브 코딩 워크숍.",
  },
];

export const TEACHING_HUB_COURSES = [
  {
    href: "agentic-ai/",
    kind: "Featured workshop",
    term: "July 2026",
    termDateTime: "2026-07",
    title: "프로그래밍은 몰라도 AI는 사용합니다만",
    description:
      "AI 에이전트를 이해하고, 작은 서비스를 설계하고, 구현과 배포까지 직접 이어가는 4일 워크숍입니다.",
    image: "agentic-ai/day-1-assets/embedded-81b732575b07d71e.jpg",
    imageAlt:
      "Cinematic storyboard frame used as an AI prototyping example",
    featured: true,
    lang: "ko",
  },
  {
    href: "contents-programming/",
    kind: "Python / Data art",
    term: "Fall 2026",
    termDateTime: "2026",
    title: "Contents Programming Practice",
    description:
      "Python과 Google Colab으로 생성 이미지, 데이터 포스터, 텍스트와 소리의 시각화를 제작하는 16주 과정입니다.",
    image: "contents-programming/assets/python-data-art.svg",
    imageAlt:
      "Python code, plotted points, bars, and a waveform composed as data art",
  },
  {
    href: "game-engine-1/",
    kind: "Unity 2D / Generative AI",
    term: "Fall 2026",
    termDateTime: "2026",
    title: "Game Engine I",
    description:
      "Unity 2D 기초부터 생성 이미지, AI 보조 코딩, MCP와 CLI 기반 제작·검증까지 이어지는 16주 과정입니다.",
    image: "game-engine-1/assets/unity-2d-ai-pipeline.svg",
    imageAlt:
      "A prompt creates pixel art sprite variations that are integrated and tested in a Unity 2D scene",
  },
  {
    href: "game-engine/",
    kind: "Unreal Engine",
    term: "36 handouts",
    title: "Game Engine II",
    description:
      "Real-time production, interactive systems, cinematic language, and project-based prototyping with Unreal Engine.",
    image: "game-engine/assets/09_final-rendered-frame.webp",
    imageAlt: "Final cinematic environment rendered for the Game Engine course",
  },
  {
    href: "media-art-programming/",
    kind: "Creative coding",
    term: "Spring 2026",
    termDateTime: "2026",
    title: "Media Art Programming Practice",
    description:
      "p5.js, generative drawing, interaction, data, physics, sound, and experimental computational expression.",
    image:
      "media-art-programming/assets/7week/09_finished-examples-gallery.png",
    imageAlt:
      "Four interactive creative coding outcomes from the Media Art Programming course",
  },
] as const;
