import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

/**
 * ---------------------------------------------------------------------------
 * Landing — public marketing page ("/")
 * ---------------------------------------------------------------------------
 * Design direction: a technical blueprint / drafting sheet. Skillfull
 * teaches practical, buildable skills — the visual language borrows from
 * engineering schematics: dashed connector paths, corner registration
 * marks, monospace dimension callouts, grid-paper texture. The hero
 * diagram is the page's signature element: a learner's actual path
 * through the catalog, drawn like a circuit trace.
 *
 * Self-contained: no auth, no data fetching. CTAs route into the existing
 * app (/register, /login, /courses).
 * ---------------------------------------------------------------------------
 */

const COURSES = [
  {
    id: "py-101",
    code: "PY-101",
    title: "Python for Web Development",
    category: "Web Development",
    instructor: "Vishal",
    level: "Beginner",
    duration: "6h",
    price: "₹499",
  },
  {
    id: "js-204",
    code: "JS-204",
    title: "Modern JavaScript",
    category: "Web Development",
    instructor: "Ananya",
    level: "Intermediate",
    duration: "5h",
    price: "₹599",
  },
  {
    id: "sql-110",
    code: "SQL-110",
    title: "SQL for Data Analysis",
    category: "Data",
    instructor: "Rahul",
    level: "Beginner",
    duration: "3h",
    price: "₹499",
  },
  {
    id: "ux-050",
    code: "UX-050",
    title: "UX Foundations",
    category: "Design",
    instructor: "Priya",
    level: "Beginner",
    duration: "2h",
    price: "₹349",
  },
  {
    id: "git-030",
    code: "GIT-030",
    title: "Git & GitHub Essentials",
    category: "Tools",
    instructor: "Karan",
    level: "Beginner",
    duration: "1.5h",
    price: "₹199",
  },
  {
    id: "aws-140",
    code: "AWS-140",
    title: "Cloud Fundamentals",
    category: "Cloud",
    instructor: "Meera",
    level: "Beginner",
    duration: "4h",
    price: "₹699",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Pick a path",
    body: "Choose a track built around one real outcome — a working site, a clean dataset, a shipped feature. No filler modules.",
    icon: "compass",
  },
  {
    number: "02",
    title: "Build with mentors",
    body: "Work through graded projects with instructor feedback, not just video lectures. Get unstuck in hours, not days.",
    icon: "layers",
  },
  {
    number: "03",
    title: "Ship & get certified",
    body: "Submit a final project that goes in your portfolio, and earn a certificate the moment you cross 100%.",
    icon: "flag",
  },
];

const TESTIMONIALS = [
  {
    name: "Rina",
    role: "Frontend Engineer, fintech startup",
    quote:
      "I finished the JavaScript and UX tracks back to back. Three weeks after my final project, I had an offer.",
  },
  {
    name: "Aman",
    role: "Data Analyst",
    quote:
      "SQL-110 is the course I recommend to everyone switching into analytics. Short, dense, and every lesson is a real query.",
  },
  {
    name: "Sonia",
    role: "Career switcher, ex-retail",
    quote:
      "I'd never written a line of code. The Git and Python tracks got me from zero to a working project in a month.",
  },
];

const STATS = [
  { value: "12,400+", label: "learners" },
  { value: "48", label: "live courses" },
  { value: "94%", label: "completion rate" },
  { value: "4.8 / 5", label: "avg. course rating" },
];

/* -----------------------------------------------------------------------
 * Icons — stroke-based, technical-drafting register (compass, layers,
 * flag rather than generic checkmarks)
 * ---------------------------------------------------------------------*/

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function StepIcon({ name }) {
  if (name === "compass") {
    return (
      <svg {...ICON_PROPS} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "layers") {
    return (
      <svg {...ICON_PROPS} aria-hidden="true">
        <path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z" />
        <path d="m3.5 12 8.5 4.5L20.5 12" />
        <path d="m3.5 16 8.5 4.5L20.5 16" />
      </svg>
    );
  }
  return (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M5 3v18" />
      <path d="M5 4.5h11l-2.4 3.25L16 11H5" />
    </svg>
  );
}

/** Corner registration mark — the small crosshair used on drafting sheets
 * to align print plates. Reused around the hero panel and section frames. */
function CornerMark({ className = "" }) {
  return (
    <svg
      className={`corner-mark ${className}`}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path d="M9 1v6M9 11v6M1 9h6M11 9h6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** The hero schematic: a learner's path traced like a circuit, from START
 * through four course nodes to a JOB READY terminus, with a scale bar
 * beneath it — the page's one signature visual. */
function SkillPathDiagram() {
  return (
    <svg
      className="skill-path"
      viewBox="0 0 560 320"
      role="img"
      aria-label="Diagram of a learner's path from start, through Python, JavaScript, SQL and UX courses, to job ready"
    >
      <path
        className="skill-path__trace"
        d="M40 160 H120 L150 120 H230 L260 160 H340 L370 200 H450 L480 160 H520"
        fill="none"
        stroke="var(--sk-cyan)"
        strokeWidth="1.75"
        strokeDasharray="6 6"
      />

      <g className="skill-path__node" transform="translate(40,160)">
        <circle r="7" />
        <text x="0" y="-18" textAnchor="middle">START</text>
      </g>

      <g className="skill-path__node skill-path__node--fill" transform="translate(190,120)">
        <circle r="9" />
        <text x="0" y="-20" textAnchor="middle">PY</text>
      </g>

      <g className="skill-path__node skill-path__node--fill" transform="translate(295,160)">
        <circle r="9" />
        <text x="0" y="-20" textAnchor="middle">JS</text>
      </g>

      <g className="skill-path__node skill-path__node--fill" transform="translate(405,200)">
        <circle r="9" />
        <text x="0" y="24" textAnchor="middle">SQL</text>
      </g>

      <g className="skill-path__node skill-path__node--terminus" transform="translate(520,160)">
        <circle r="11" />
        <text x="0" y="-22" textAnchor="middle">JOB READY</text>
      </g>

      <g className="skill-path__scale" transform="translate(40,270)">
        <line x1="0" y1="0" x2="480" y2="0" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tick) => (
          <g key={tick} transform={`translate(${tick * 60},0)`}>
            <line x1="0" y1="-5" x2="0" y2="5" />
            <text x="0" y="20" textAnchor="middle">
              {tick}
            </text>
          </g>
        ))}
        <text x="240" y="42" textAnchor="middle" className="skill-path__scale-label">
          WEEKS TO JOB-READY — SCALE 1:1
        </text>
      </g>
    </svg>
  );
}

/* -----------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------*/

export default function Landing() {
  return (
    <div className="landing">
      {/* ---------------------------------------------------------- Nav */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="landing-logo">
            <span className="landing-logo__mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="1" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 10h10M10 5v10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
            <span className="landing-logo__text">
              Skillfull
              <span className="landing-logo__sub">TECHNOLOGIES</span>
            </span>
          </Link>

          <nav className="landing-nav__links" aria-label="Primary">
            <a href="#courses">Courses</a>
            <a href="#how-it-works">How it works</a>
            <a href="#outcomes">Outcomes</a>
          </nav>

          <div className="landing-nav__cta">
            <Link to="/login" className="btn btn--ghost">
              Log in
            </Link>
            <Link to="/register" className="btn btn--solid">
              Start learning
            </Link>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- Hero */}
      <section className="hero">
        <CornerMark className="corner-mark--tl" />
        <CornerMark className="corner-mark--tr" />
        <CornerMark className="corner-mark--bl" />
        <CornerMark className="corner-mark--br" />

        <div className="hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">SKILL BLUEPRINT — REV. 2026</p>
            <h1 className="hero__title">
              Draft your career.
              <br />
              Ship real skills.
            </h1>
            <p className="hero__subtitle">
              Skillfull Technologies is a practical training ground for developers, analysts, and
              designers. Every course ends in a real, working project — not a certificate for
              watching videos.
            </p>

            <div className="hero__actions">
              <Link to="/register" className="btn btn--solid btn--lg">
                Explore courses
              </Link>
              <a href="#how-it-works" className="btn btn--outline btn--lg">
                See how it works
              </a>
            </div>

            <dl className="hero__stats">
              {STATS.map((stat) => (
                <div className="hero__stat" key={stat.label}>
                  <dt>{stat.label.toUpperCase()}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero__diagram" aria-hidden="false">
            <SkillPathDiagram />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Courses */}
      <section className="section section--paper" id="courses">
        <div className="section__inner">
          <p className="eyebrow eyebrow--dark">COURSE INDEX</p>
          <h2 className="section__title">Pick a track, not a playlist.</h2>
          <p className="section__subtitle">
            Six active tracks. Each one is scoped to a single outcome, taught by someone who
            builds this for a living.
          </p>

          <div className="course-grid">
            {COURSES.map((course) => (
              <article className="course-card" key={course.id}>
                <div className="course-card__head">
                  <span className="course-card__code">{course.code}</span>
                  <span className="course-card__level">{course.level}</span>
                </div>
                <h3 className="course-card__title">{course.title}</h3>
                <p className="course-card__meta">
                  {course.category} · Taught by {course.instructor}
                </p>
                <div className="course-card__foot">
                  <span className="course-card__duration">{course.duration}</span>
                  <span className="course-card__price">{course.price}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="section__cta">
            <Link to="/register" className="btn btn--solid">
              View full catalog
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- How it works */}
      <section className="section section--navy" id="how-it-works">
        <div className="section__inner">
          <p className="eyebrow">PROCESS</p>
          <h2 className="section__title section__title--light">
            Three steps. No detours.
          </h2>

          <div className="steps">
            <div className="steps__line" aria-hidden="true" />
            {STEPS.map((step) => (
              <div className="step" key={step.number}>
                <div className="step__marker">
                  <span className="step__number">{step.number}</span>
                </div>
                <div className="step__icon">
                  <StepIcon name={step.icon} />
                </div>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Outcomes */}
      <section className="section section--paper" id="outcomes">
        <div className="section__inner">
          <p className="eyebrow eyebrow--dark">FIELD NOTES</p>
          <h2 className="section__title">What learners actually say.</h2>

          <div className="testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <figure className="testimonial-card" key={t.name}>
                <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption>
                  <span className="testimonial-card__name">{t.name}</span>
                  <span className="testimonial-card__role">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Final CTA */}
      <section className="cta-band">
        <CornerMark className="corner-mark--tl corner-mark--light" />
        <CornerMark className="corner-mark--br corner-mark--light" />
        <div className="cta-band__inner">
          <h2>Ready to draft your next role?</h2>
          <p>Start with any track for free. Upgrade only when you're ready to ship a project.</p>
          <Link to="/register" className="btn btn--solid btn--lg">
            Create a free account
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <span className="landing-logo__text landing-logo__text--footer">
              Skillfull
              <span className="landing-logo__sub">TECHNOLOGIES</span>
            </span>
            <p>Practical training for developers, analysts, and designers.</p>
          </div>

          <div className="landing-footer__col">
            <h4>Product</h4>
            <a href="#courses">Courses</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/register">Pricing</Link>
          </div>

          <div className="landing-footer__col">
            <h4>Company</h4>
            <a href="#outcomes">Outcomes</a>
            <Link to="/login">Log in</Link>
          </div>

          <div className="landing-footer__col">
            <h4>Legal</h4>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>© {new Date().getFullYear()} Skillfull Technologies. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}