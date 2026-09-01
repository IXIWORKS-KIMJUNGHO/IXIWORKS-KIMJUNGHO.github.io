import { SiteFooter } from "../components/site-footer.tsx";
import { SiteNav } from "../components/site-nav.tsx";
import { SkipLink } from "../components/skip-link.tsx";
import { NEWS_ITEMS } from "../data/news.ts";

export function NewsPage() {
  return (
    <>
      <SkipLink />
      <SiteNav current="news" />
      <main id="main-content" className="page-shell">
        <header className="page-hero">
          <h1>News Index</h1>
          <p className="lead">
            A compact timeline of research, production, exhibitions, teaching,
            and company updates.
          </p>
        </header>
        <section className="section" aria-label="News index">
          <ol className="news-list news-index-list">
            {NEWS_ITEMS.map((item) => (
              <li className="news-item" key={item.title}>
                <time className="news-date" dateTime={item.dateTime}>
                  {item.date}
                </time>
                <div>
                  <h2 className="news-title">{item.title}</h2>
                  {item.axis ? <p className="news-meta">{item.axis}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter note="News Index · Updated 2026.09.01" />
    </>
  );
}
