# 14 — Agentic AI 문서 마이그레이션 (Day 1 엔진 제외)

**What to build:** Workshop documents a student opens around the Agentic AI course (schedule, runbooks, agent rules, mentoring) share the public teaching chrome. The Day 1 slide engine stays the current deck runtime.

**Blocked by:** 08 — Teaching 허브와 코스 인덱스 다섯이 같은 크롬을 쓴다

**Status:** ready-for-agent

- [ ] Schedule, install runbook, deploy runbook, agent rules, and mentoring pages use the redesigned teaching chrome and keep their current URLs.
- [ ] Day 1 still runs on its existing slide engine. This ticket does not rebuild the deck in React.
- [ ] If Day 1 shows a site nav at all, it may pick up shared tokens only when that does not risk the deck layout. Otherwise leave Day 1's own chrome.
- [ ] Course hub links to these documents still work. Sitemap entries remain valid.
- [ ] Documents remain readable as static pages. Progress widgets that already exist may stay as small scripts.
