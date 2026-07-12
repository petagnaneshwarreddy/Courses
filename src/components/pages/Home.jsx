import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "./Nav";
import "./Home.css";

/**
 * ---------------------------------------------------------------------------
 * Home — Student landing page ("/home")
 * ---------------------------------------------------------------------------
 * Data source: GET /dashboard (role-aware; this component renders the
 * student shape — hoursLearned, coursesEnrolled, coursesCompleted,
 * certificates, continueLearning[], recommended[], activity[]).
 *
 * Mirrors the Courses page's visual language (stat tiles, eyebrow label,
 * card grid) but is scoped to the logged-in student.
 * ---------------------------------------------------------------------------
 */

// Vite (this project runs on :5173, not CRA's :3000) exposes env vars via
// import.meta.env with a VITE_ prefix — process.env is not available in the
// browser under Vite and referencing it throws "process is not defined",
// which crashes the component. Set VITE_API_URL in a .env file at the
// project root if your API isn't at localhost:5000.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STORAGE_KEYS = Object.freeze({
  token: "token",
});

/** Best-effort JWT decode, display-only — never used for trust decisions. */
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Fallback gradients for courses without an uploaded thumbnail, cycled
// by index so cards without a real image still look visually distinct.
const FALLBACK_THUMBNAILS = [
  "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 60%, #bfdbfe 100%)",
  "linear-gradient(135deg, #b45309 0%, #f59e0b 60%, #fde68a 100%)",
  "linear-gradient(135deg, #047857 0%, #34d399 60%, #d1fae5 100%)",
  "linear-gradient(135deg, #6d28d9 0%, #a78bfa 60%, #ede9fe 100%)",
  "linear-gradient(135deg, #b91c1c 0%, #f87171 60%, #fecaca 100%)",
];

function resolveThumbnail(thumbnail, index) {
  if (thumbnail) return `url(${thumbnail}) center/cover no-repeat`;
  return FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
}

function formatPrice(price) {
  if (price == null) return "";
  return price === 0 ? "Free" : `₹${price}`;
}

function formatDuration(hours) {
  if (hours == null) return "";
  return `${hours}h`;
}

/* -----------------------------------------------------------------------
 * Icons — inline, stroke-based, inherit currentColor (matches Nav.jsx set)
 * ---------------------------------------------------------------------*/

const ICON_PROPS = {
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const BookIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
  </svg>
);

const ClockIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

const MedalIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="12" cy="14" r="5.5" />
    <path d="M9.5 9 7 3h3l2 4" />
    <path d="M14.5 9 17 3h-3l-2 4" />
  </svg>
);

const PlayIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 12h15" />
    <path d="m13 5.5 6.5 6.5-6.5 6.5" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6" />
    <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6" />
    <path d="M18 3v4h-4" />
    <path d="M6 21v-4h4" />
  </svg>
);

/* -----------------------------------------------------------------------
 * Stat tile — mirrors the Courses page's "Total courses" style cards
 * ---------------------------------------------------------------------*/

function StatTile({ icon, tone, label, value }) {
  return (
    <div className="stat-tile">
      <span className={`stat-tile__icon stat-tile__icon--${tone}`}>{icon}</span>
      <span className="stat-tile__body">
        <span className="stat-tile__label">{label}</span>
        <span className="stat-tile__value">{value}</span>
      </span>
    </div>
  );
}

function StatTileSkeleton() {
  return (
    <div className="stat-tile stat-tile--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--circle" />
      <span className="stat-tile__body">
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--line skeleton--medium" />
      </span>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Continue-learning row
 * ---------------------------------------------------------------------*/

function ContinueLearningCard({ course }) {
  return (
    <Link to={course.to} className="continue-card">
      <span
        className="continue-card__thumb"
        style={{ background: course.thumbnail }}
        aria-hidden="true"
      >
        <span className="continue-card__play">
          <PlayIcon />
        </span>
      </span>

      <span className="continue-card__body">
        <span className="continue-card__top">
          <span className="continue-card__category">{course.category}</span>
          <span className="continue-card__progress-label">{course.progress}%</span>
        </span>

        <span className="continue-card__title">{course.title}</span>
        <span className="continue-card__meta">
          {course.instructor ? `By ${course.instructor}` : "Continue where you left off"}
          {course.level ? ` · ${course.level}` : ""}
        </span>

        <span className="continue-card__track" role="presentation">
          <span className="continue-card__fill" style={{ width: `${course.progress}%` }} />
        </span>
      </span>
    </Link>
  );
}

function ContinueLearningCardSkeleton() {
  return (
    <div className="continue-card continue-card--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--thumb" />
      <span className="continue-card__body">
        <span className="skeleton skeleton--line skeleton--short" />
        <span className="skeleton skeleton--line skeleton--long" />
        <span className="skeleton skeleton--line skeleton--medium" />
      </span>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Recommended course card
 * ---------------------------------------------------------------------*/

function RecommendedCard({ course }) {
  return (
    <Link to={course.to} className="rec-card">
      <span className="rec-card__thumb" style={{ background: course.thumbnail }} aria-hidden="true">
        <span className="rec-card__badge">{course.category}</span>
      </span>

      <span className="rec-card__body">
        <span className="rec-card__title">{course.title}</span>
        <span className="rec-card__meta">
          {course.instructor} · {course.level}
        </span>

        <span className="rec-card__footer">
          <span className="rec-card__duration">{course.duration}</span>
          <span className="rec-card__price">{course.price}</span>
        </span>
      </span>
    </Link>
  );
}

function RecommendedCardSkeleton() {
  return (
    <div className="rec-card rec-card--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--thumb-wide" />
      <span className="rec-card__body">
        <span className="skeleton skeleton--line skeleton--long" />
        <span className="skeleton skeleton--line skeleton--medium" />
      </span>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Data fetching hook — isolates auth, request, and error handling so the
 * component body stays focused on rendering.
 * ---------------------------------------------------------------------*/

function useDashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "error" | "unauthenticated" | "ready"
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) {
      setStatus("unauthenticated");
      return undefined;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const res = await fetch(`${API_BASE}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.status === 401) {
          setStatus("unauthenticated");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Couldn't load the dashboard.");
        }

        const json = await res.json();
        setData(json);
        setStatus("ready");
      } catch (err) {
        if (err.name === "AbortError") return;
        setErrorMessage(err.message || "Couldn't load the dashboard. Please try again.");
        setStatus("error");
      }
    })();

    return () => controller.abort();
  }, [reloadToken]);

  return { data, status, errorMessage, reload };
}

/* -----------------------------------------------------------------------
 * Home
 * ---------------------------------------------------------------------*/

export default function Home() {
  const [displayName, setDisplayName] = useState("Learner");
  const { data: dashboard, status, errorMessage, reload } = useDashboard();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) return;
    const claims = decodeJwtPayload(token);
    const name = claims?.name || claims?.username || claims?.email;
    if (name) setDisplayName(name.split(" ")[0].split("@")[0]);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);

  const enrollments = useMemo(() => {
    if (!dashboard?.continueLearning) return [];
    return dashboard.continueLearning.map((c, i) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructor: c.instructor,
      level: c.level,
      progress: c.progress,
      to: `/courses/${c.id}`,
      thumbnail: resolveThumbnail(c.thumbnail, i),
    }));
  }, [dashboard]);

  const recommended = useMemo(() => {
    if (!dashboard?.recommended) return [];
    return dashboard.recommended.map((c, i) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructor: c.instructor,
      level: c.level,
      duration: formatDuration(c.duration),
      price: formatPrice(c.price),
      to: `/courses/${c.id}`,
      thumbnail: resolveThumbnail(c.thumbnail, i),
    }));
  }, [dashboard]);

  const stats = useMemo(
    () => ({
      enrolledCount: dashboard?.coursesEnrolled ?? 0,
      completedCount: dashboard?.coursesCompleted ?? 0,
      hoursLearned: dashboard?.hoursLearned ?? 0,
      certificates: dashboard?.certificates ?? 0,
    }),
    [dashboard]
  );

  const isLoading = status === "loading";

  if (status === "unauthenticated") {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="home-page">
            <div className="home-empty home-empty--full">
              <p>Your session has ended. Please log in again to see your dashboard.</p>
              <Link to="/login" className="home-empty__cta">
                Go to login
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="home-page">
            <div className="home-empty home-empty--full">
              <p>{errorMessage}</p>
              <button type="button" className="home-empty__cta home-empty__cta--button" onClick={reload}>
                <RefreshIcon /> Try again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">
        <div className="home-page">
          <header className="home-header">
            <p className="home-eyebrow">{greeting.toUpperCase()}</p>
            <h1 className="home-title">Welcome back, {displayName}.</h1>
            <p className="home-subtitle">
              Here's where you left off — pick up a course or explore something new.
            </p>
          </header>

          <section className="stat-grid" aria-label="Your learning stats" aria-busy={isLoading}>
            {isLoading ? (
              <>
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
              </>
            ) : (
              <>
                <StatTile icon={<BookIcon />} tone="blue" label="Enrolled courses" value={stats.enrolledCount} />
                <StatTile icon={<CheckCircleIcon />} tone="green" label="Completed" value={stats.completedCount} />
                <StatTile icon={<ClockIcon />} tone="purple" label="Hours learned" value={stats.hoursLearned} />
                <StatTile icon={<MedalIcon />} tone="orange" label="Certificates" value={stats.certificates} />
              </>
            )}
          </section>

          <section className="home-section">
            <div className="home-section__header">
              <h2>Continue learning</h2>
              <Link to="/courses" className="home-section__link">
                Browse all courses <ArrowRightIcon />
              </Link>
            </div>

            {isLoading ? (
              <div className="continue-list">
                <ContinueLearningCardSkeleton />
                <ContinueLearningCardSkeleton />
              </div>
            ) : enrollments.length > 0 ? (
              <div className="continue-list">
                {enrollments.map((course) => (
                  <ContinueLearningCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="home-empty">
                <p>You haven't enrolled in any courses yet.</p>
                <Link to="/courses" className="home-empty__cta">
                  Browse the catalog
                </Link>
              </div>
            )}
          </section>

          <section className="home-section">
            <div className="home-section__header">
              <h2>Recommended for you</h2>
              <Link to="/courses" className="home-section__link">
                See all <ArrowRightIcon />
              </Link>
            </div>

            {isLoading ? (
              <div className="rec-grid">
                <RecommendedCardSkeleton />
                <RecommendedCardSkeleton />
                <RecommendedCardSkeleton />
              </div>
            ) : recommended.length > 0 ? (
              <div className="rec-grid">
                {recommended.map((course) => (
                  <RecommendedCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <p className="home-empty">Nothing new to recommend right now — check back soon.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}