export type PracticeAxis =
  | "generative-ai"
  | "real-time-engine"
  | "digital-twin"
  | "exhibition-system";

export type WorkItem = {
  slug: string;
  title: string;
  year: string;
  yearDateTime: string;
  kind: string;
  href: string;
  image: string;
  imageAlt: string;
  description: string;
  featured?: boolean;
  archiveNote?: boolean;
  axes: PracticeAxis[];
};

export type NavId = "home" | "news" | "work" | "research" | "teaching" | "cv";
