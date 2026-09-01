# 06 — News 페이지가 같은 앱에 들어온다

**What to build:** Opening News from the primary nav lands in the same site language as the homepage: a News Index of dates and titles, not a stack of announcement cards. Chronology is scannable in one pass.

**Blocked by:** 05 — 나머지 Homepage Gate가 닫힌다

**Status:** resolved

- [ ] `/news.html` (or the current public News URL) is served from the Vite app and keeps its canonical URL.
- [ ] Nav, tokens, type, and footer match the homepage. A visitor does not feel they changed sites.
- [ ] Entries are date + title (+ a short activity axis if already present). No multi-paragraph card bodies.
- [ ] Homepage News Index and this page share the same news data. Adding an entry updates both.
- [ ] "Back to Home" or equivalent is not required if the primary nav already reaches `/`. Duplicate contact CTAs are not introduced.
