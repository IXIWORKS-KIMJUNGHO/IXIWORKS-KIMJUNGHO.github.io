import { ProfileRail } from "../components/profile-rail.tsx";
import { SiteFooter } from "../components/site-footer.tsx";
import { SiteNav } from "../components/site-nav.tsx";
import { SkipLink } from "../components/skip-link.tsx";
import { EDUCATION, EXPERIENCE } from "../data/background.ts";
import { HOMEPAGE_NEWS } from "../data/news.ts";
import {
  FEATURED_RESEARCH,
  REMAINING_PUBLICATIONS,
} from "../data/research.ts";
import { TEACHING_COURSES } from "../data/teaching.ts";
import {
  FEATURED_WORK,
  PRACTICE_AXES,
  WORK_NOTE,
  WORK_ROWS,
} from "../data/work.ts";

function axisAttr(axes: string[]) {
  return axes.join(" ");
}

export function HomePage() {
  return (
    <>
      <SkipLink />
      <SiteNav current="home" />
      <div className="shell" id="top">
        <ProfileRail />
        <main id="main-content" className="content">
          <section className="hero">
            <p className="hero-role">Creative Engineer / Researcher</p>
            <h1>
              I build production systems across generative AI, real-time 3D, and
              immersive media.
            </h1>
            <p className="hero-support">
              Research, software, and exhibition become workflows I can test,
              teach, and deploy.
            </p>
            <p className="print-contact">
              Seoul, Korea | jungho10050@gmail.com |
              creativeengineer-kimjungho.com
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#work">
                Selected Work
              </a>
            </div>
          </section>

          <section className="section" id="work">
            <header className="section-heading stacked">
              <h2 className="section-title">Selected Work</h2>
              <p className="section-intro">
                Production systems where generated media, interfaces, and
                real-time engines become working public experiences.
              </p>
            </header>

            <div className="work-system" data-work-system-map>
              <a className="featured-project" href={FEATURED_WORK.href} data-axes={axisAttr(FEATURED_WORK.axes)}>
                <div className="featured-visual">
                  <img
                    src={FEATURED_WORK.image}
                    width={2048}
                    height={1536}
                    loading="eager"
                    decoding="async"
                    alt={FEATURED_WORK.imageAlt}
                  />
                </div>
                <div className="featured-copy">
                  <div>
                    <div className="featured-meta">
                      <span className="project-kind">{FEATURED_WORK.kind}</span>
                      <time
                        className="project-year"
                        dateTime={FEATURED_WORK.yearDateTime}
                      >
                        {FEATURED_WORK.year}
                      </time>
                    </div>
                    <h3 className="featured-title">{FEATURED_WORK.title}</h3>
                    <p className="featured-description">
                      {FEATURED_WORK.description}
                    </p>
                  </div>
                  <span className="project-link-label">Open case study</span>
                </div>
              </a>

              <div
                className="work-system-map"
                role="group"
                aria-label="Practice axes"
              >
                {PRACTICE_AXES.map((axis) => (
                  <button
                    key={axis.id}
                    type="button"
                    data-axis={axis.id}
                    aria-pressed="false"
                  >
                    {axis.label}
                  </button>
                ))}
              </div>

              <div className="project-index" aria-label="Additional selected work">
                {WORK_ROWS.map((item) => (
                  <a
                    className="project-row"
                    href={item.href}
                    key={item.slug}
                    data-axes={axisAttr(item.axes)}
                  >
                    <img
                      className="project-thumb"
                      src={item.image}
                      width={1983}
                      height={793}
                      loading="lazy"
                      decoding="async"
                      alt={item.imageAlt}
                    />
                    <div className="project-row-copy">
                      <div className="row-meta">
                        <span className="project-kind">{item.kind}</span>
                        <time
                          className="project-year"
                          dateTime={item.yearDateTime}
                        >
                          {item.year}
                        </time>
                      </div>
                      <h3 className="project-title">{item.title}</h3>
                      <p className="project-description">{item.description}</p>
                    </div>
                    <span className="project-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
                <div
                  className="work-tail"
                  data-axes={axisAttr(WORK_NOTE.axes)}
                >
                  <p className="archive-note">
                    <strong>Additional production, 2025:</strong>{" "}
                    {WORK_NOTE.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="section-actions">
              <a className="button" href="portfolio.html">
                All case studies
              </a>
            </div>
          </section>

          <section className="section" id="research">
            <header className="section-heading stacked">
              <h2 className="section-title">Writing &amp; Research</h2>
              <p className="section-intro">
                Research into AI-assisted pre-production, digital human
                pipelines, and immersive content systems.
              </p>
            </header>
            <ol className="research-list">
              {FEATURED_RESEARCH.map((item) => (
                <li className="research-item" key={item.title}>
                  <div>
                    <h3 className="research-title">
                      {item.href ? (
                        <a href={item.href}>{item.title}</a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p
                      className="research-note"
                      dangerouslySetInnerHTML={{ __html: item.note }}
                    />
                  </div>
                  <span className="research-venue">{item.venue}</span>
                  <time className="research-year" dateTime={item.yearDateTime}>
                    {item.year}
                  </time>
                </li>
              ))}
            </ol>
            <details className="archive-panel">
              <summary>View remaining publications</summary>
              <ol className="publication-list">
                {REMAINING_PUBLICATIONS.map((item) => (
                  <li key={item.title}>
                    <span className="paper-title">{item.title}</span>
                    <span className="pub-type">{item.type}</span>
                    <span className="pub-year">{item.year}</span>
                  </li>
                ))}
              </ol>
            </details>
          </section>

          <section className="section" id="teaching">
            <header className="section-heading stacked">
              <h2 className="section-title">Teaching</h2>
              <p className="section-intro">
                Project-based courses that translate technical systems into
                practical creative workflows.
              </p>
            </header>
            <div className="teaching-list">
              {TEACHING_COURSES.map((course) =>
                course.href ? (
                  <a
                    className="teaching-row"
                    href={course.href}
                    key={course.title}
                    lang={
                      course.title.startsWith("프로그래밍") ? "ko" : undefined
                    }
                  >
                    <h3 className="teaching-title">{course.title}</h3>
                    <p className="teaching-description">{course.description}</p>
                    <span className="teaching-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ) : (
                  <div
                    className="teaching-row teaching-row-static"
                    key={course.title}
                  >
                    <h3 className="teaching-title">{course.title}</h3>
                    <p className="teaching-description">{course.description}</p>
                  </div>
                ),
              )}
            </div>
            <div className="section-actions">
              <a className="button" href="teaching/">
                Open teaching archive
              </a>
            </div>
          </section>

          <section className="section" id="cv-archive">
            <header className="section-heading stacked">
              <h2 className="section-title">Experience &amp; Education</h2>
              <p className="section-intro">
                A practice built across research, higher education, and
                independent production.
              </p>
            </header>
            <div className="cv-columns">
              <div className="cv-column">
                <h3 className="subsection-title">Experience</h3>
                <ol className="timeline-list">
                  {EXPERIENCE.map((item) => (
                    <li className="timeline-item" key={item.title}>
                      <time className="timeline-date" dateTime={item.dateTime}>
                        {item.date}
                      </time>
                      <h4 className="timeline-title">{item.title}</h4>
                      <p className="timeline-meta">{item.meta}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="cv-column">
                <h3 className="subsection-title">Education</h3>
                <ol className="timeline-list">
                  {EDUCATION.map((item) => (
                    <li className="timeline-item" key={item.title}>
                      <time className="timeline-date" dateTime={item.dateTime}>
                        {item.date}
                      </time>
                      <h4 className="timeline-title">{item.title}</h4>
                      <p className="timeline-meta">{item.meta}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="section" id="news">
            <header className="section-heading stacked">
              <h2 className="section-title">Latest News</h2>
              <p className="section-intro">
                Recent milestones across research, company building, and
                exhibition work.
              </p>
            </header>
            <ol className="news-list">
              {HOMEPAGE_NEWS.map((item) => (
                <li className="news-item" key={item.title}>
                  <time className="news-date" dateTime={item.dateTime}>
                    {item.date}
                  </time>
                  <h3 className="news-title">{item.title}</h3>
                </li>
              ))}
            </ol>
            <div className="section-actions">
              <a className="button" href="news.html">
                All news
              </a>
            </div>
          </section>
        </main>
      </div>
      <SiteFooter note="Updated 2026.09.01" />
    </>
  );
}
