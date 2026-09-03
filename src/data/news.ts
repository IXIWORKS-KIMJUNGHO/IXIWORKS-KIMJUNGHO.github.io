export type NewsItem = {
  date: string;
  dateTime: string;
  title: string;
  axis?: string;
};

export const NEWS_ITEMS: NewsItem[] = [
  {
    date: "2026.08",
    dateTime: "2026-08",
    title:
      "Registered MOVIOLA as software copyright for generative AI pre-production storyboarding.",
    axis: "Generative AI",
  },
  {
    date: "2026.08",
    dateTime: "2026-08",
    title:
      "Patent application filed for multi-cut storyboard generation that weights a master shot by shot size to keep cuts visually consistent.",
    axis: "Generative AI",
  },
  {
    date: "2026.03",
    dateTime: "2026-03",
    title:
      "Patent application filed for Agile Vibe Pre-Production Storyboard Patent.",
    axis: "Generative AI",
  },
  {
    date: "2025.10",
    dateTime: "2025-10",
    title: "Started healing landscape-style AI media art content production.",
    axis: "Exhibition System",
  },
  {
    date: "2025.09",
    dateTime: "2025-09",
    title:
      "Developed an AI-based smart home living environment content platform UI prototype.",
    axis: "Real-Time Engine",
  },
  {
    date: "2025.08",
    dateTime: "2025-08",
    title: "Designed a VIVE AI kiosk experience for Incheon Inspire Resort.",
    axis: "Exhibition System",
  },
  {
    date: "2025.07",
    dateTime: "2025-07",
    title:
      "Developed a Hyundai Mobis Connect in-vehicle infotainment prototype.",
    axis: "Real-Time Engine",
  },
  {
    date: "2025.06",
    dateTime: "2025-06",
    title:
      "Founded IXIWORKS as a software and AI media content development company.",
    axis: "Generative AI",
  },
  {
    date: "2025",
    dateTime: "2025",
    title: "Participated in the Korea-Canada convergence art special exhibition.",
    axis: "Exhibition System",
  },
  {
    date: "2024.05",
    dateTime: "2024-05",
    title:
      "Joined Chung-Ang University Industry-Academic Cooperation Foundation as a full-time researcher.",
    axis: "Generative AI",
  },
  {
    date: "2024.01",
    dateTime: "2024-01",
    title: "Developed Samsung Paris 2024 Breaking Solution experiences.",
    axis: "Exhibition System",
  },
  {
    date: "2023",
    dateTime: "2023",
    title: "Selected for BIFAN 2023 Beyond Reality.",
    axis: "Exhibition System",
  },
];

export const HOMEPAGE_NEWS = NEWS_ITEMS.slice(0, 3);
