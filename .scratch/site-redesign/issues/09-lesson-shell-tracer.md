# 09 — Student Handout 한 장이 LessonShell을 통과한다

**What to build:** One live week page, Contents Programming Practice week 03 period 1, is rebuilt as a static Student Handout inside the app. A student can refresh and read the explanation without waiting on a client bundle. This is the tracer for every later course migration.

**Blocked by:** 08 — Teaching 허브와 코스 인덱스 다섯이 같은 크롬을 쓴다

**Status:** resolved

- [ ] The current week 03 period 1 URL still resolves, with the same canonical, title, and share image intent.
- [ ] Lesson chrome (breadcrumb Home / Teaching / course, previous/next with `rel="prev"` / `rel="next"`) is a shared shell, not a one-off.
- [ ] The body remains a Student Handout: Learning Hierarchy visible, Concept Cards as Quiet Section Cards, code as Confirmation Content. Primary explanation is in the static HTML.
- [ ] Viewing the page with JavaScript disabled still shows the lesson explanation, facts, and takeaway. Interactive extras may degrade.
- [ ] Existing week 3 design tests pass against the build output (hero, facts, no decorative em-dash, share metadata).
- [ ] No other week is required to move in this ticket.
