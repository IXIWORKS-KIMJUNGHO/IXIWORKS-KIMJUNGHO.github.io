import { SiteFooter } from "../components/site-footer.tsx";
import { SiteNav } from "../components/site-nav.tsx";
import { SkipLink } from "../components/skip-link.tsx";
import { TEACHING_HUB_COURSES } from "../data/teaching.ts";

export function TeachingHubPage() {
  const featured = TEACHING_HUB_COURSES.find((course) => "featured" in course && course.featured)!;
  const rest = TEACHING_HUB_COURSES.filter((course) => course.href !== featured.href);

  return (
    <>
      <SkipLink />
      <SiteNav current="teaching" />
      <header className="archive-hero">
        <div>
          <p className="archive-kicker">Teaching archive</p>
          <h1>Learning by making systems.</h1>
        </div>
        <p className="archive-intro">
          Project-based courses that turn emerging tools into practical creative
          workflows. The materials are published for students to revisit, test,
          and extend.
        </p>
      </header>
      <main id="main-content" className="teaching-shell">
        <section className="archive-section" aria-labelledby="current-courses">
          <header className="archive-heading">
            <h2 id="current-courses">Open course materials</h2>
            <p>
              Course outlines, handouts, exercises, and runbooks currently
              available on this site.
            </p>
          </header>
          <a className="featured-course" href={featured.href}>
            <div className="featured-course-visual">
              <img
                src={featured.image}
                width={720}
                height={402}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                alt={featured.imageAlt}
              />
            </div>
            <div className="featured-course-copy">
              <div>
                <div className="course-meta">
                  <span className="course-kind">{featured.kind}</span>
                  {"termDateTime" in featured && featured.termDateTime ? (
                    <time className="course-term" dateTime={featured.termDateTime}>
                      {featured.term}
                    </time>
                  ) : (
                    <span className="course-term">{featured.term}</span>
                  )}
                </div>
                <h2 lang={"lang" in featured ? featured.lang : undefined}>
                  {featured.title}
                </h2>
                <p lang={"lang" in featured ? featured.lang : undefined}>
                  {featured.description}
                </p>
              </div>
              <span className="course-link-label">
                Open workshop materials ↗
              </span>
            </div>
          </a>
          <div className="course-grid">
            {rest.map((course) => (
              <a className="course-card" href={course.href} key={course.href}>
                <div className="course-card-visual">
                  <img
                    src={course.image}
                    width={1200}
                    height={760}
                    loading="lazy"
                    decoding="async"
                    alt={course.imageAlt}
                  />
                </div>
                <div className="course-card-copy">
                  <div>
                    <div className="course-meta">
                      <span className="course-kind">{course.kind}</span>
                      {"termDateTime" in course && course.termDateTime ? (
                        <time
                          className="course-term"
                          dateTime={course.termDateTime}
                        >
                          {course.term}
                        </time>
                      ) : (
                        <span className="course-term">{course.term}</span>
                      )}
                    </div>
                    <h2>{course.title}</h2>
                    <p>{course.description}</p>
                  </div>
                  <span className="course-link-label">
                    Browse the curriculum ↗
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="archive-section" aria-labelledby="teaching-areas">
          <header className="archive-heading">
            <h2 id="teaching-areas">Teaching areas</h2>
            <p>
              Subjects taught through demonstrations and student-led projects
              that do not yet have a public course archive.
            </p>
          </header>
          <div className="teaching-areas">
            <article className="teaching-area">
              <div>
                <span className="area-label">Cultural data</span>
                <h3>Digital Archiving and Data Visualization</h3>
              </div>
              <p>
                Data storytelling, cultural data systems, visual analysis, and
                digital archive workflows.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter note="Teaching archive" />
    </>
  );
}
