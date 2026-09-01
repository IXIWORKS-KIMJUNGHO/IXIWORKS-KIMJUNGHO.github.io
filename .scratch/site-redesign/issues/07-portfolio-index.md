# 07 — Portfolio 인덱스가 같은 앱에 들어온다

**What to build:** Opening Work from the primary nav shows a compact case-study index in the same app as the homepage, using the same work data. Individual case studies may still be the existing HTML documents.

**Blocked by:** 03 — Selected Work 게이트가 케이스 스터디로 보낸다

**Status:** resolved

- [ ] `/portfolio.html` (or the current public Portfolio URL) is served from the Vite app and keeps its canonical URL.
- [ ] The index lists the same case studies as the homepage Selected Work data, including the storyboard case if it is already in the portfolio archive.
- [ ] Each row or card opens the existing case-study URL. This ticket does not rewrite case-study bodies.
- [ ] Nav, tokens, and type match the homepage. The Compact Profile Rail may exist here only if it does not compete with the index (same Hero-First rule as the rest of the public site, or no rail if the index needs the full width).
- [ ] No second portfolio-intent label. The page is the archive that All case studies already named.
