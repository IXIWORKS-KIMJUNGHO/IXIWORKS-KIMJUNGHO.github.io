export function ProfileRail() {
  return (
    <aside className="sidebar" aria-label="Profile">
      <div className="identity-artwork-wrap">
        <img
          className="identity-artwork"
          src="assets/creative-engineering-character-v2.jpg"
          width={1200}
          height={1200}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          alt="Fictional animated maker-explorer character holding a translucent design panel"
        />
      </div>
      <div className="profile-intro">
        <p className="side-role">Creative Engineer / Researcher</p>
        <p className="side-summary">
          Art engineering, generative AI, and real-time production systems.
        </p>
      </div>
      <dl className="profile-meta">
        <div>
          <dt>Based in</dt>
          <dd>Seoul, Korea</dd>
        </div>
        <div>
          <dt>Affiliation</dt>
          <dd>Chung-Ang University</dd>
        </div>
        <div>
          <dt>Current practice</dt>
          <dd>Founder, IXIWORKS</dd>
        </div>
      </dl>
      <ul className="profile-links" aria-label="Profile links">
        <li>
          <a
            className="profile-email-link"
            href="https://mail.google.com/mail/?view=cm&fs=1&to=jungho10050%40gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send email to jungho10050@gmail.com via Gmail (opens in a new tab)"
          >
            <span className="profile-link-label">Email</span>
            <span className="profile-email-address">jungho10050@gmail.com</span>
          </a>
        </li>
        <li>
          <a href="https://github.com/IXIWORKS-KIMJUNGHO">GitHub</a>
        </li>
        <li>
          <a href="/assets/kim-jungho-cv.pdf" download>
            Download CV
          </a>
        </li>
      </ul>
    </aside>
  );
}
