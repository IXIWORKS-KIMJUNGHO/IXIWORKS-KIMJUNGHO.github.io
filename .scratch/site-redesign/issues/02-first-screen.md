# 02 — First Screen이 Professional Landing Page로 열린다

**What to build:** A first-time visitor loading `/` sees a Hero-First Layout: the identity statement leads, a Compact Profile Rail confirms who this is, and one Portfolio CTA labelled Selected Work is the only primary action. The First Screen no longer reads as a CV strip.

**Blocked by:** 01 — 정적 빌드가 Vite 홈을 호스트하면서 수업 URL을 유지한다

**Status:** resolved

- [ ] First Screen text is at most four elements: role line, identity statement, support line of at most 20 words, and the Selected Work CTA.
- [ ] Compact Profile Rail shows the character artwork, Seoul, Chung-Ang University, Email, GitHub, and Download CV. Download CV does not also appear in the hero.
- [ ] Mobile Hero Order puts the identity statement before profile metadata.
- [ ] Primary nav still reads News, Work, Research, Teaching, CV on one desktop line, height at most 80px. Skip link still reaches main content.
- [ ] Archive Lab tokens (Warm Ivory / Near Black / Blue Slate) and Modern Gothic Sans + IBM Plex Mono are in use. Rust is not a page-wide accent.
- [ ] Light and dark stay one theme family for the whole page. `prefers-reduced-motion` does not leave a broken motion state.
- [ ] Highlight cells (Practice / Degree / Research / Patent) are gone from the First Screen.
