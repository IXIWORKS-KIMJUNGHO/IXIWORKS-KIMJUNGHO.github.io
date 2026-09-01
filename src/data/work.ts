import type { PracticeAxis, WorkItem } from "../types.ts";

export const PRACTICE_AXES: { id: PracticeAxis; label: string }[] = [
  { id: "generative-ai", label: "Generative AI" },
  { id: "real-time-engine", label: "Real-Time Engine" },
  { id: "digital-twin", label: "Digital Twin" },
  { id: "exhibition-system", label: "Exhibition System" },
];

export const WORK_ITEMS: WorkItem[] = [
  {
    slug: "vive-ai-kiosk",
    title: "VIVE AI Kiosk Experience Design",
    year: "2025",
    yearDateTime: "2025",
    kind: "AI experience system",
    href: "projects/vive-ai-uiux.html",
    image: "assets/vive-inspire-kiosk-installation.jpg",
    imageAlt: "VIVE AI kiosk installed in an exhibition environment",
    description:
      "An end-to-end kiosk workflow connecting AI-generated visuals, interaction design, and on-site exhibition operation.",
    featured: true,
    axes: ["generative-ai", "exhibition-system"],
  },
  {
    slug: "hyundai-mobis-connect",
    title: "Hyundai Mobis Connect",
    year: "2025",
    yearDateTime: "2025",
    kind: "Real-time interface",
    href: "projects/hyundai-mobis-connect.html",
    image: "assets/hyundai-mobis-system-hero-futura.png",
    imageAlt: "Hyundai Mobis Connect infotainment interface prototype",
    description:
      "In-vehicle infotainment prototype implemented as real-time EXE and APK packages.",
    axes: ["real-time-engine"],
  },
  {
    slug: "digital-twin-pipeline",
    title: "3D Human Digitizing Pipeline",
    year: "2024 to 2025",
    yearDateTime: "2024",
    kind: "Digital twin research",
    href: "projects/digital-twin-pipeline.html",
    image: "assets/digital-twin-hero-rig.png",
    imageAlt: "Digital human rig from the 3D digitizing pipeline",
    description:
      "A production pipeline connecting capture, reconstruction, optimization, and reusable digital human assets.",
    axes: ["digital-twin"],
  },
  {
    slug: "cinematic-vr",
    title: "Cinematic VR / AI Screening",
    year: "2023 to 2025",
    yearDateTime: "2023",
    kind: "Immersive media",
    href: "projects/spectrum-of-humanity.html",
    image: "assets/cinematic-vr-lead.jpg",
    imageAlt: "Cinematic VR scene from Spectrum of Humanity",
    description:
      "Immersive work developed for festival, museum, and international exhibition contexts.",
    axes: ["exhibition-system"],
  },
  {
    slug: "jeonju-landscape",
    title: "Healing Landscape-Style AI Media Art",
    year: "2025",
    yearDateTime: "2025",
    kind: "Additional production",
    href: "portfolio.html",
    image: "assets/vive-inspire-kiosk-installation.jpg",
    imageAlt: "Additional production note",
    description:
      "Healing Landscape-Style AI Media Art Content Production for the Jeonju University Industry-Academic Cooperation Foundation.",
    archiveNote: true,
    axes: ["generative-ai", "exhibition-system"],
  },
];

export const FEATURED_WORK = WORK_ITEMS.find((item) => item.featured)!;
export const WORK_ROWS = WORK_ITEMS.filter(
  (item) => !item.featured && !item.archiveNote,
);
export const WORK_NOTE = WORK_ITEMS.find((item) => item.archiveNote)!;
