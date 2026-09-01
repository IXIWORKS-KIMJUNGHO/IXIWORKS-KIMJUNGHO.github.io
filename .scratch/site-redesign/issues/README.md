# Site redesign tickets

Spec: `../spec.md`

Frontier: any ticket whose blockers are done. Right now that is **01** only.

Recommended order: 01 → 15. 05, 07, and 08 can start as soon as 02 is done. 10–13 can start as soon as 09 is done.

| # | File | Blocked by | Status |
|---|---|---|---|
| 01 | [01-unified-static-build.md](01-unified-static-build.md) | none | resolved |
| 02 | [02-first-screen.md](02-first-screen.md) | 01 | resolved |
| 03 | [03-selected-work.md](03-selected-work.md) | 02 | resolved |
| 04 | [04-work-system-map.md](04-work-system-map.md) | 03 | resolved |
| 05 | [05-homepage-gates.md](05-homepage-gates.md) | 02 | resolved |
| 06 | [06-news-page.md](06-news-page.md) | 05 | resolved |
| 07 | [07-portfolio-index.md](07-portfolio-index.md) | 03 | resolved |
| 08 | [08-teaching-hub.md](08-teaching-hub.md) | 02 | resolved |
| 09 | [09-lesson-shell-tracer.md](09-lesson-shell-tracer.md) | 08 | resolved |
| 10 | [10-contents-programming-handouts.md](10-contents-programming-handouts.md) | 09 | resolved |
| 11 | [11-game-engine-1-handouts.md](11-game-engine-1-handouts.md) | 09 | resolved |
| 12 | [12-game-engine-2-handouts.md](12-game-engine-2-handouts.md) | 09 | resolved |
| 13 | [13-media-art-programming-handouts.md](13-media-art-programming-handouts.md) | 09 | resolved |
| 14 | [14-agentic-ai-documents.md](14-agentic-ai-documents.md) | 08 | resolved |
| 15 | [15-legacy-contract.md](15-legacy-contract.md) | 06, 07, 10–14 | resolved |

When a ticket is finished, set `Status: resolved` in its file, then the next unresolved ticket becomes the frontier.
