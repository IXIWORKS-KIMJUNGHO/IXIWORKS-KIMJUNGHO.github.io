# 15 — 레거시 경로 수축

**What to build:** After public pages and migrated teaching live on the new app, the old parallel homepage/teaching styling and copy-only build path go away. There is one static pipeline, and audits look only at that output.

**Blocked by:** 06 — News 페이지가 같은 앱에 들어온다; 07 — Portfolio 인덱스가 같은 앱에 들어온다; 10 — Contents Programming 나머지 핸드아웃 마이그레이션; 11 — Game Engine I 핸드아웃 마이그레이션; 12 — Game Engine II 핸드아웃 마이그레이션; 13 — Media Art Programming 핸드아웃 마이그레이션; 14 — Agentic AI 문서 마이그레이션 (Day 1 엔진 제외)

**Status:** ready-for-agent

- [ ] No leftover homepage CSS/build path is still required to render `/`, News, Portfolio, or migrated teaching indexes and handouts.
- [ ] Unmigrated special runtimes (Day 1 deck, notebooks, interactive examples) still publish through the same static pipeline.
- [ ] Site-audit, sitemap generation, and teaching-link tests target the build output only.
- [ ] A production deploy from this pipeline serves the custom domain without a double-copy of the site.
- [ ] Removing the legacy path does not change URL slugs, nav labels, or canonicals.
