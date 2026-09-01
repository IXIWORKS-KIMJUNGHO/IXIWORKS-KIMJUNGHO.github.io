# 04 — Work System Map이 연결을 보여 준다

**What to build:** Next to Selected Work, a visitor can choose one of four Practice Axes and see which visible projects connect to that method. The project set never disappears. The interaction is an Interactive Proof, not a portfolio filter and not decoration.

**Blocked by:** 03 — Selected Work 게이트가 케이스 스터디로 보낸다

**Status:** resolved

- [ ] The four Practice Axes are Generative AI, Real-Time Engine, Digital Twin, and Exhibition System, with those names.
- [ ] Choosing an axis highlights connected work rows and the featured case when they share that axis. Unconnected rows stay visible and muted, never `hidden` or removed.
- [ ] Choosing the active axis again clears the selection and returns every row to equal weight.
- [ ] The active axis is `aria-pressed` (or equivalent) and the group has an accessible name. Keyboard can move between axes and activate them.
- [ ] `prefers-reduced-motion: reduce` changes contrast only. No transform loop, no filter animation.
- [ ] Rust is used for the active axis (and remains the logo decision point). Blue Slate remains the page accent elsewhere.
- [ ] Axis connections match the spec: VIVE with Generative AI and Exhibition System; Mobis with Real-Time Engine; Digitizing Pipeline with Digital Twin; Cinematic VR with Exhibition System; Jeonju note with Generative AI and Exhibition System when it is highlighted at all.
