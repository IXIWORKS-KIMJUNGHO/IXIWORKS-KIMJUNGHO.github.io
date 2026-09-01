import { SiteFooter } from "../components/site-footer.tsx";
import { SiteNav } from "../components/site-nav.tsx";
import { SkipLink } from "../components/skip-link.tsx";
import { PORTFOLIO_ARCHIVE, PORTFOLIO_CASES } from "../data/portfolio.ts";

export function PortfolioPage() {
  return (
    <>
      <SkipLink />
      <SiteNav current="work" />
      <main id="main-content" className="page-shell">
        <header className="page-hero">
          <h1>Portfolio</h1>
          <p className="lead">
            A compact index of selected case studies across generative AI,
            digital twins, real-time systems, and exhibition media.
          </p>
        </header>
        <section className="section">
          <h2 className="section-title">Case Study Index</h2>
          <div className="portfolio-grid">
            {PORTFOLIO_CASES.map((item) => (
              <a className="case-card" href={item.href} key={item.href}>
                <img
                  className="case-thumb"
                  src={item.image}
                  width={1672}
                  height={941}
                  loading="lazy"
                  decoding="async"
                  alt={item.imageAlt}
                />
                <div>
                  <div className="case-eyebrow">{item.eyebrow}</div>
                  <h3 className="case-title">{item.title}</h3>
                  <p className="case-meta">{item.meta}</p>
                </div>
                <span className="case-link">Open case</span>
              </a>
            ))}
          </div>
        </section>
        <section className="section">
          <h2 className="section-title">Portfolio Archive</h2>
          <div className="archive-list">
            {PORTFOLIO_ARCHIVE.map((item) => (
              <article className="archive-item" key={item.title}>
                <div className="date">{item.date}</div>
                <div>
                  <h3 className="archive-title">{item.title}</h3>
                  <p className="archive-meta">{item.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter note="Portfolio · Updated 2026.09.01" />
    </>
  );
}
