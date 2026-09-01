# 10 — Contents Programming 나머지 핸드아웃 마이그레이션

**What to build:** The rest of Contents Programming Practice is readable as static Student Handouts in the shared lesson shell. A student following the course week by week does not notice a URL change and does not need a client app to read.

**Blocked by:** 09 — Student Handout 한 장이 LessonShell을 통과한다

**Status:** ready-for-agent

- [ ] Every current Contents Programming week URL still resolves after the build.
- [ ] Each migrated page uses the shared lesson shell (breadcrumb, prev/next, skip link) and keeps its Learning Hierarchy.
- [ ] Course hub and sitemap still list every week. `rel="prev"` / `rel="next"` remain accurate at each boundary.
- [ ] Notebooks, CSV, example HTML, and other special runtimes stay as files linked from the handout. They are not rewritten as React.
- [ ] Work lands week by week so a half-migrated course never 404s a later week. The ticket is not done until the last week is on the new shell.
- [ ] Course design tests that already pin week copy, heroes, and links pass against the build output.
