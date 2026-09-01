export type LessonNavLink = {
  href: string;
  title: string;
};

export function LessonShell({
  courseHref,
  courseLabel,
  previous,
  next,
  homeHref = "/",
}: {
  courseHref: string;
  courseLabel: string;
  previous?: LessonNavLink | null;
  next?: LessonNavLink | null;
  homeHref?: string;
}) {
  return (
    <header className="lesson-header" data-teaching-shell="v1" data-lesson-shell="react-v1">
      <nav className="lesson-header-inner" aria-label="Course">
        <div className="lesson-breadcrumb">
          <a className="lesson-home" href={homeHref}>
            Kim Jungho
          </a>
          <span aria-hidden="true">/</span>
          <a href="/teaching/">Teaching</a>
          <span aria-hidden="true">/</span>
          <a className="lesson-course" href={courseHref}>
            {courseLabel}
          </a>
        </div>
        <div className="lesson-sequence">
          {previous ? (
            <a href={previous.href} rel="prev" aria-label={`이전 자료: ${previous.title}`}>
              ← <span className="sequence-label">Previous</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={next.href} rel="next" aria-label={`다음 자료: ${next.title}`}>
              <span className="sequence-label">Next</span> →
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
