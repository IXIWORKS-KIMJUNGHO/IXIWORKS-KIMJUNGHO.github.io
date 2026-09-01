# Site redesign: public surfaces, then teaching chrome, then handouts

**Status:** approved; tickets in `.scratch/site-redesign/issues/`
**Date:** 2026-09-01

## Problem Statement

The public site already has a clear identity, real work, and a large teaching archive, but the homepage still reads like a compact CV and the teaching pages do not share one maintainable stack. Kim Jungho wants to redesign in a stack he already uses (React, TypeScript, Tailwind), without turning Student Handouts into a client-rendered app and without breaking URLs students and search already use.

## Solution

Evolve the existing Archive Lab language rather than replacing it with the cinematic brand-kit mock. Introduce a Vite + React + TypeScript + Tailwind v4 app that statically exports public pages, then teaching indexes, then handouts one course at a time. Each lesson stays a Student Handout: a static document with a Learning Hierarchy, not a SPA. The Day 1 slide engine stays a special runtime.

## User Stories

1. As a first-time visitor, I want the First Screen to state who Kim Jungho is and offer one Portfolio CTA, so that I am not reading a resume before I have a reason to care.
2. As a first-time visitor, I want a Compact Profile Rail that confirms location, affiliation, and contact without competing with the identity statement, so that the Hero-First Layout still leads.
3. As a visitor on a phone, I want the identity statement before profile metadata (Mobile Hero Order), so that the First Screen still works on a narrow viewport.
4. As a recruiter or collaborator, I want a Selected Work gate with one featured case and a short index, so that I can open a real case study in one or two actions.
5. As a visitor inspecting the practice, I want a Work System Map with four Practice Axes, so that I can see how projects connect without the set being filtered away.
6. As a visitor using a keyboard or screen reader, I want the active Practice Axis exposed as pressed state, so that the map is usable without hover.
7. As a visitor who prefers reduced motion, I want the map to change contrast only, so that the Interactive Proof still works without animation.
8. As a researcher, I want Writing & Research to show a short list of patents and publications, so that I can verify the claim without a full CV dump.
9. As a student, I want a Teaching Homepage Gate that links to live course archives, including Contents Programming Practice, so that I can reach materials that already exist.
10. As a visitor checking credibility, I want a Background Summary of experience and education after the work gates, so that CV detail supports the practice instead of leading it.
11. As a returning visitor, I want a News Index of dates and titles, so that I can scan activity without reading announcement cards.
12. As a visitor opening News or Portfolio, I want the same navigation, tokens, and type as the homepage, so that I have not entered a different site.
13. As a student opening `/teaching/`, I want a teaching hub and course indexes that share the public site chrome, so that teaching feels like part of the same site.
14. As a student in class, I want each week page to remain a Student Handout I can refresh and follow, so that a client bundle is not a prerequisite for reading.
15. As a student following a lesson, I want Concept Cards, Practice Step Cards, Confirmation Content, and Takeaway Callouts to keep their Learning Hierarchy, so that the page still teaches in the same order.
16. As a student with a bookmarked week URL, I want that URL to keep working, so that shared links and the sitemap do not rot.
17. As Kim Jungho, I want to edit homepage and teaching chrome in React and TypeScript, so that I am not maintaining a parallel HTML/CSS dialect I use less often.
18. As Kim Jungho, I want tests to check visitor-facing behaviour against the build output, so that a redesign cannot silently drop skip links, canonicals, or teaching routes.
19. As a workshop participant using Day 1, I want the existing slide engine to keep working, so that a site redesign does not become a deck rewrite.
20. As a visitor in dark mode, I want the whole public page to stay in one theme family, so that a section does not invert mid-scroll.

## Implementation Decisions

- **Mode:** Redesign, preserve. Keep the Archive Lab palette, existing copy voice, logo, wordmark rules, character artwork, primary nav labels, and URL slugs. Do not implement the brand-kit cinematic dark hero.
- **Dials:** `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 4`. Motion is motivated only as Interactive Proof or control feedback.
- **Stack:** Vite + React + TypeScript + Tailwind v4. Static export. No Next.js unless a later service design requires it.
- **Accent lock:** Blue Slate is the UI accent. Rust is the logo decision point and the active Practice Axis only.
- **Type:** Modern Gothic Sans (geometric gothic such as Space Grotesk, self-hosted) + existing IBM Plex Mono. Inter is retired on redesigned surfaces.
- **Icons:** One family, Phosphor. No hand-rolled icon paths.
- **Homepage composition, in order:** First Screen; Selected Work; Work System Map; Writing & Research; Teaching gate; Background Summary; News Index.
- **First Screen stack (max four text elements):** role line; identity statement; support line of at most 20 words; one primary CTA labelled Selected Work. Name is carried by the wordmark and rail. Highlight cells leave the First Screen. Download CV lives in the rail only.
- **Work System Map:** four Practice Axes (Generative AI, Real-Time Engine, Digital Twin, Exhibition System). Projects stay visible. The selected axis highlights connected rows. Not a filter.
- **CTA intents, one label each:** Selected Work / All case studies (portfolio); Download CV (file); Email (contact); Open teaching archive (teaching); All news (news).
- **Teaching architecture:** indexes and lesson chrome join the app first. Handout bodies become static document components (or MDX assembled at build time). Per-week interactive widgets and notebooks stay special runtimes.
- **Expand-contract:** add the Vite app and unified static build beside the current HTML. Migrate surfaces in batches. Delete the old homepage/teaching CSS path only after the new surfaces match URLs and tests.
- **Deploy:** the production build must emit a static directory that includes redesigned pages and every unmigrated teaching/project file. Vercel serves that directory after a real build command.
- **Work item shape (from the design conversation, not a running demo):**

```ts
type PracticeAxis =
  | "generative-ai"
  | "real-time-engine"
  | "digital-twin"
  | "exhibition-system";

type WorkItem = {
  slug: string;
  title: string;
  year: string;
  kind: string;
  href: string;
  image: string;
  imageAlt: string;
  description: string;
  featured?: boolean;
  axes: PracticeAxis[];
};
```

## Testing Decisions

- Prefer tests that read published HTML after build, the way `site-audit` and course design tests already do. Do not replace those with implementation-detail tests of component internals.
- Freeze current public URLs, canonicals, skip links, and `rel="next"` / `rel="prev"` on migrated lesson pages.
- Homepage tests should fail if the First Screen has more than one Portfolio CTA, if Download CV appears in both rail and hero, or if the Work System Map hides a project row.
- Teaching tests should fail if a Student Handout requires client JavaScript to reveal its primary explanation.
- After each migrate batch, the course hub and sitemap must still list every week URL.
- Dark mode and `prefers-reduced-motion` are part of the homepage and map tickets, not a polish pass at the end.

## Out of Scope

- Brand-kit cinematic overhaul, search in the header, or a new About label in the primary nav.
- Next.js, shadcn, or a product design system.
- Rewriting lesson copy, course pedagogy, or the Day 1 slide engine.
- Changing URL structure, nav labels, form/email field names, or the logo.
- Replacing portraits or using the retired personal photo assets.
- Migrating Jupyter notebooks, CSV, wav, and interactive map examples into React.
- Putting a Work System Map, marquee, or scroll hijack on teaching pages.

## Sequence

1. Unified static build that can host a Vite homepage without dropping teaching URLs.
2. Professional Landing Page, First Screen through News Index.
3. News page and Portfolio index in the same app. Case study HTML can wait.
4. Teaching hub and five course indexes.
5. One Student Handout through a shared lesson shell (tracer).
6. Remaining handouts per course, Game Engine I, Game Engine II, Media Art Programming, then Agentic AI documents except Day 1.
7. Contract: retire the duplicated legacy CSS/build path once no caller remains.

## Further Notes

Primary nav stays News, Work, Research, Teaching, CV. Research and CV remain in-page anchors on the homepage until those sections exist in the new app.

Contents Programming Practice must be a real link on the homepage Teaching gate. The current static row is a defect to fix in that ticket, not a later cleanup.

Media Art Programming pages currently carry inline CSS. That course is a migrate batch, not the tracer.

Agentic AI Day 1 is a different product. Wrap it with shared chrome only if that can be done without rewriting the deck.
