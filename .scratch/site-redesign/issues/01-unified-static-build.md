# 01 — 정적 빌드가 Vite 홈을 호스트하면서 수업 URL을 유지한다

**What to build:** A visitor (and the deploy) can still open every existing teaching and case-study URL after the site grows a Vite + React + TypeScript + Tailwind app. The homepage may be a React tree, but Student Handouts and project pages that have not moved yet keep working as static documents. Production serves the build output, not the repo root by accident.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [ ] `npm run build` emits one static directory that contains the Vite homepage and every current public teaching, news, portfolio, and project URL.
- [ ] Existing teaching week URLs and project case-study URLs return the same documents they do today (content and canonical URL unchanged).
- [ ] Site-audit tests run against that build output and pass.
- [ ] Local preview of the build serves `/` from the Vite app and `/teaching/` from the copied handouts in one origin.
- [ ] Vercel is configured to build and publish that static directory. A deploy of this ticket does not 404 a bookmarked week page.
