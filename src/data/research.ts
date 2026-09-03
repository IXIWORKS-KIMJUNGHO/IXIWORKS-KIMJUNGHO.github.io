export type ResearchItem = {
  title: string;
  href?: string;
  note: string;
  venue: string;
  year: string;
  yearDateTime: string;
};

export const FEATURED_RESEARCH: ResearchItem[] = [
  {
    title: "MOVIOLA: Generative AI-Based Pre-Production Storyboard",
    note: "Registration no. C-2026-042388 · Chung-Ang University Industry-Academic Cooperation Foundation",
    venue: "Software registration",
    year: "2026",
    yearDateTime: "2026",
  },
  {
    title:
      "Multi-Cut Storyboard Generation Using Shot-Size-Based Reference Selection",
    note: "Application no. 10-2026-0162969 · Tae-Kyung Yoo, Jungho Kim",
    venue: "Patent application",
    year: "2026",
    yearDateTime: "2026",
  },
  {
    title: "Agile Vibe Pre-Production Storyboard Patent",
    href: "projects/generative-ai-storyboard.html",
    note: "Application no. 10-2026-0054962 · Tae-Kyung Yoo, Jungho Kim",
    venue: "Patent application",
    year: "2026",
    yearDateTime: "2026",
  },
  {
    title:
      "Digital Twin Pipeline for Optimizing 3D Human Digitizing System",
    href: "projects/digital-twin-pipeline.html",
    note: 'Lecture Notes in Networks and Systems, vol. 1153, CIPR 2024, pp. 75-91. DOI: <a href="https://doi.org/10.1007/978-981-97-8093-8_6">10.1007/978-981-97-8093-8_6</a>.',
    venue: "Springer",
    year: "2025",
    yearDateTime: "2025",
  },
  {
    title:
      "Training R&D Talent for Generative AI and Cloud-Based Content Production",
    note: "Applied research and curriculum development connecting generative AI with production practice.",
    venue: "R&D program",
    year: "2024 to 2026",
    yearDateTime: "2024",
  },
  {
    title:
      "A Study on a Digital Twin Pipeline for Optimizing a 3D Human Digitizing System",
    note: "Graduate School of Advanced Imaging Science, Multimedia & Film, Chung-Ang University.",
    venue: "Ph.D. dissertation",
    year: "2024",
    yearDateTime: "2024",
  },
];

export const REMAINING_PUBLICATIONS: { title: string; type: string; year: string }[] =
  [
    {
      title:
        "A Study on a Digital Twin Pipeline for Optimizing a 3D Facial Appearance Digitizing System. Journal of Broadcast Engineering, Vol. 28 No. 5, pp. 530-544. DOI: 10.5909/JBE.2023.28.5.530.",
      type: "KCI",
      year: "2023",
    },
    {
      title:
        "Detecting Branches in Silent Films Using a Center-of-Gravity Algorithm: Focusing on Dziga Vertov's <Man with a Movie Camera>.",
      type: "KCI",
      year: "2022",
    },
    {
      title:
        "A Study on Immersive Content Production and Storytelling Methods Using Photogrammetry and Artificial Intelligence.",
      type: "KCI",
      year: "2022",
    },
    {
      title:
        "Correlation Between Head Movement Data and Immersion in Virtual Reality Content.",
      type: "KCI",
      year: "2021",
    },
    {
      title:
        "Remediating tradition with technology: a case study of From Tangible to Intangible: A Media Showcase of Lisa chin p'yori chinch'a uigwe.",
      type: "A&HCI",
      year: "2021",
    },
    {
      title:
        "An Analysis of Interactive Virtual Human Technologies and Characteristics in the Content Industry.",
      type: "KCI",
      year: "2020",
    },
    {
      title:
        "A Study on Out-of-Register Expression in Real-Time Rendering Environments.",
      type: "KCI",
      year: "2020",
    },
    {
      title:
        "A Study on Storyboarding for Pre-Production on Virtual Reality Platforms.",
      type: "KCI",
      year: "2020",
    },
    {
      title:
        "A Study on Directing Methods for VR Animation: Focusing on the VR Animation <DreamTherapy>.",
      type: "KCI",
      year: "2019",
    },
  ];
