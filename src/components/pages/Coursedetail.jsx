import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-01ye.onrender.com";

/* ------------------------------------------------------------------
   CourseDetail.jsx  —  single-course view for students.
   Route: /courses/:id  (registered in App.js — see bottom of file)

   Shows instructor, description, duration, students, and curriculum
   counts (modules / lessons / quizzes / assignments / certificate).
   Not enrolled  -> "Enroll Now" button, which routes to /payment/:id.
   Enrolled      -> progress bar + "Continue Learning" button, which
                    now opens the real class player at /courses/:id/learn
                    (Content.jsx) instead of just opening a YouTube tab
                    and nudging progress by a flat +20%.
   ------------------------------------------------------------------ */

const CATEGORY_COLORS = {
  "Web Development": "#2451CC",
  "Data Science": "#0F9488",
  Design: "#C2540A",
  "Cloud & DevOps": "#6D4FD1",
  "Mobile Development": "#B45309",
  Cybersecurity: "#B0223A",
};

function currency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const Icon = {
  Back: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Star: (p) => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" {...p}>
      <path d="M10 2.5l2.24 4.54 5.01.73-3.62 3.53.86 4.99L10 13.9l-4.49 2.39.86-4.99L2.75 7.77l5.01-.73L10 2.5Z" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 5.8V10l3 1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <circle cx="7.2" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.6 16.4c.6-2.6 2.4-4 4.6-4s4 1.4 4.6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14.2" cy="7.4" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.6 16.4c.4-1.9 1.6-3.2 3-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Layers: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <path d="M10 3 3 7l7 4 7-4-7-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 10.5 10 14.5 17 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 14 10 18 17 14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.3 6.8 13 10l-4.7 3.2V6.8Z" fill="currentColor" />
    </svg>
  ),
  Quiz: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <path d="M6.3 7.6a3.7 3.7 0 1 1 4.9 3.5c-.9.3-1.2.9-1.2 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="15.8" r=".9" fill="currentColor" />
    </svg>
  ),
  Assignment: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <rect x="4.5" y="3.5" width="11" height="14" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.3 8h5.4M7.3 11h5.4M7.3 14h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Certificate: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <circle cx="10" cy="7.3" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.6 10.6 6.6 16.7 10 14.8l3.4 1.9-1-6.1" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
};

function StarRating({ value = 0 }) {
  const rounded = Math.round(value);
  return (
    <span className="cd-rating">
      <span className="cd-rating__stars" aria-label={`${value} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon.Star key={i} data-empty={i >= rounded ? "true" : undefined} />
        ))}
      </span>
      <span className="cd-rating__value">{value ? value.toFixed(1) : "New"}</span>
    </span>
  );
}

function DetailStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");

.cd-page {
  --cd-ink: #0f172a;
  --cd-accent: #2451cc;
  --cd-teal: #0f9488;
  --cd-amber: #b45309;
  --cd-bg: #f5f6f9;
  --cd-surface: #ffffff;
  --cd-border: #e2e5ec;
  --cd-border-strong: #cfd4de;
  --cd-text: #10151f;
  --cd-text-soft: #5b6472;
  --cd-text-faint: #8a92a1;
  --cd-radius-lg: 14px;
  --cd-shadow: 0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03);
  --cd-shadow-lg: 0 24px 48px -12px rgba(15,23,42,.22);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--cd-text);
  background: var(--cd-bg);
  min-height: 100%;
  padding: 28px 40px 64px;
  box-sizing: border-box;
}
.cd-page * { box-sizing: border-box; }

.cd-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: var(--cd-text-soft);
}

.cd-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cd-text-soft);
  text-decoration: none;
  margin-bottom: 18px;
}
.cd-back:hover { color: var(--cd-ink); }

.cd-hero {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 22px;
}

.cd-cover {
  height: 260px;
  border-radius: var(--cd-radius-lg);
  background-size: cover;
  background-position: center;
  position: relative;
  box-shadow: var(--cd-shadow);
}
.cd-cover__tag {
  position: absolute;
  top: 14px;
  left: 14px;
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 11px;
  border-radius: 6px;
  background: rgba(255,255,255,.92);
}
.cd-cover__status {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.cd-cover__status--published { background: #e3f5ee; color: #0d7a49; }
.cd-cover__status--draft { background: #fdf0e3; color: #92590a; }

.cd-summary {
  background: var(--cd-surface);
  border: 1px solid var(--cd-border);
  border-radius: var(--cd-radius-lg);
  box-shadow: var(--cd-shadow);
  padding: 22px;
  display: flex;
  flex-direction: column;
}

.cd-summary h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
  line-height: 1.25;
}

.cd-rating { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; }
.cd-rating__stars { display: inline-flex; gap: 1px; color: #d9a012; }
.cd-rating__stars svg[data-empty="true"] { color: #e2e5ec; }
.cd-rating__value { font-family: "IBM Plex Mono", monospace; font-size: 12.5px; font-weight: 600; color: var(--cd-text-soft); }

.cd-instructor {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: var(--cd-text-soft);
  margin-bottom: 16px;
}
.cd-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--cd-ink);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cd-instructor strong { color: var(--cd-ink); font-weight: 600; }

.cd-price {
  font-family: "IBM Plex Mono", monospace;
  font-size: 26px;
  font-weight: 700;
  color: var(--cd-ink);
  margin-bottom: 18px;
}

.cd-stats-mini {
  display: flex;
  gap: 18px;
  padding: 14px 0;
  border-top: 1px solid var(--cd-border);
  border-bottom: 1px solid var(--cd-border);
  margin-bottom: 18px;
}
.cd-stats-mini__item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--cd-text-soft);
}
.cd-stats-mini__item svg { color: var(--cd-accent); flex-shrink: 0; }
.cd-stats-mini__item strong { color: var(--cd-ink); font-weight: 700; }

.cd-btn {
  font-family: inherit;
  font-weight: 600;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 12px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  width: 100%;
  transition: background .12s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cd-btn:disabled { opacity: .55; cursor: not-allowed; }
.cd-btn--primary { background: var(--cd-ink); color: #fff; margin-top: auto; }
.cd-btn--primary:hover:not(:disabled) { background: #000; }
.cd-btn--success { background: var(--cd-teal); color: #fff; }
.cd-btn--success:hover:not(:disabled) { background: #0b7d72; }

.cd-progress-block { margin-top: auto; }
.cd-progress__bar {
  height: 8px;
  border-radius: 999px;
  background: var(--cd-border);
  overflow: hidden;
  margin-bottom: 8px;
}
.cd-progress__fill { height: 100%; background: var(--cd-teal); border-radius: 999px; transition: width .25s ease; }
.cd-progress__label {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cd-text-soft);
  margin-bottom: 12px;
  font-family: "IBM Plex Mono", monospace;
}

.cd-body {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.cd-card {
  background: var(--cd-surface);
  border: 1px solid var(--cd-border);
  border-radius: var(--cd-radius-lg);
  box-shadow: var(--cd-shadow);
  padding: 22px;
}
.cd-card h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--cd-ink);
}
.cd-card p {
  font-size: 14px;
  line-height: 1.65;
  color: var(--cd-text-soft);
  margin: 0;
  white-space: pre-wrap;
}
.cd-card + .cd-card { margin-top: 20px; }

.cd-curriculum {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.cd-curriculum__item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--cd-border);
  border-radius: 10px;
  padding: 12px 14px;
}
.cd-curriculum__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef1f8;
  color: var(--cd-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cd-curriculum__item:nth-child(2) .cd-curriculum__icon { background: #e7f5f3; color: var(--cd-teal); }
.cd-curriculum__item:nth-child(3) .cd-curriculum__icon { background: #fdf0e3; color: var(--cd-amber); }
.cd-curriculum__item:nth-child(4) .cd-curriculum__icon { background: #f4eefc; color: #6d4fd1; }
.cd-curriculum__item:nth-child(5) .cd-curriculum__icon { background: #fbecee; color: #b0223a; }
.cd-curriculum__text { display: flex; flex-direction: column; }
.cd-curriculum__text strong { font-family: "IBM Plex Mono", monospace; font-size: 15px; font-weight: 700; color: var(--cd-ink); }
.cd-curriculum__text span { font-size: 11.5px; color: var(--cd-text-faint); }

.cd-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--cd-ink);
  color: #fff;
  padding: 12px 16px;
  border-radius: 9px;
  font-size: 13.5px;
  box-shadow: var(--cd-shadow-lg);
  z-index: 1100;
}
.cd-toast--danger { background: #c0293f; }

.app-shell { display: flex; align-items: stretch; min-height: 100vh; }
.app-main { flex: 1; min-width: 0; }

@media (max-width: 860px) {
  .cd-hero, .cd-body { grid-template-columns: 1fr; }
  .cd-curriculum { grid-template-columns: 1fr; }
}
    `}</style>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const LOGIN_ROUTE = "/explore/login";

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // { progress, completed, enrollmentId } once enrolled, else null.
  const [enrollment, setEnrollment] = useState(null);
  const [toast, setToast] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHasToken(false);
      setAuthChecked(true);
      const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      return () => clearTimeout(t);
    }
    setHasToken(true);
    setAuthChecked(true);
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [courseRes, enrollRes] = await Promise.all([
        axios.get(`${API_BASE}/courses/${id}`, { headers: authHeaders() }),
        axios.get(`${API_BASE}/my-enrollments`, { headers: authHeaders() }).catch(() => ({ data: [] })),
      ]);
      setCourse({ ...courseRes.data, id: courseRes.data.id || courseRes.data._id });
      // courseId comes back from Mongo as an ObjectId, so compare as
      // strings rather than with === (which would always be false).
      const mine = (enrollRes.data || []).find((e) => String(e.courseId) === String(id));
      setEnrollment(mine || null);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Couldn't load this course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasToken) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, id]);

  // Sends the student to the payment page instead of enrolling directly.
  // The Payment page calls the enroll API itself once payment succeeds,
  // then routes back here so this page can pick up the fresh enrollment.
  const handleEnroll = () => {
    navigate(`/payment/${id}`, { state: { course } });
  };

  // "Continue Learning" / "Review Course" now opens the real class
  // player (Content.jsx) at /courses/:id/learn, which lists every
  // chapter, plays its video, and shows notes/code/practice — instead
  // of just opening a YouTube tab and bumping progress by a flat 20%.
  // Content.jsx owns progress updates from here on, so this page just
  // has to navigate; it'll show the fresh progress next time it loads.
  const handleContinue = () => {
    navigate(`/courses/${id}/learn`, { state: { course } });
  };

  if (!authChecked || (hasToken && loading)) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="cd-page cd-page--centered">
            <DetailStyles />
            Loading course…
          </div>
        </main>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="cd-page cd-page--centered">
            <DetailStyles />
            Redirecting you to login…
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="cd-page cd-page--centered">
            <DetailStyles />
            <div>
              <p>{loadError || "Course not found."}</p>
              <Link to="/courses" className="cd-back" style={{ justifyContent: "center", marginTop: 10 }}>
                <Icon.Back /> Back to courses
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const accent = CATEGORY_COLORS[course.category] || "#2451CC";

  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">
        <div className="cd-page">
          <DetailStyles />
          {toast && <div className={`cd-toast cd-toast--${toast.type === "danger" ? "danger" : ""}`}>{toast.message}</div>}

          <Link to="/courses" className="cd-back">
            <Icon.Back /> Back to courses
          </Link>

          <section className="cd-hero">
            <div
              className="cd-cover"
              style={
                course.thumbnail
                  ? { backgroundImage: `url(${course.thumbnail})` }
                  : { background: `linear-gradient(135deg, ${accent}, #0f172a)` }
              }
            >
              <span className="cd-cover__tag" style={{ color: accent }}>{course.category}</span>
              <span className={`cd-cover__status cd-cover__status--${(course.status || "").toLowerCase()}`}>
                {course.status}
              </span>
            </div>

            <div className="cd-summary">
              <h1>{course.title}</h1>
              <StarRating value={course.rating} />

              <div className="cd-instructor">
                <span className="cd-avatar">{initials(course.instructor)}</span>
                <span>
                  Taught by <strong>{course.instructor}</strong> · {course.level}
                </span>
              </div>

              <div className="cd-price">{currency(course.price)}</div>

              <div className="cd-stats-mini">
                <span className="cd-stats-mini__item">
                  <Icon.Clock /> <strong>{course.duration}h</strong>&nbsp;duration
                </span>
                <span className="cd-stats-mini__item">
                  <Icon.Users /> <strong>{course.students || 0}</strong>&nbsp;students
                </span>
              </div>

              {enrollment ? (
                <div className="cd-progress-block">
                  <div className="cd-progress__bar">
                    <div className="cd-progress__fill" style={{ width: `${enrollment.progress || 0}%` }} />
                  </div>
                  <div className="cd-progress__label">
                    <span>Your progress</span>
                    <span>{enrollment.completed ? "Completed ✓" : `${enrollment.progress || 0}%`}</span>
                  </div>
                  <button className="cd-btn cd-btn--success" onClick={handleContinue}>
                    {enrollment.completed ? "Review Course" : "Continue Learning"}
                  </button>
                </div>
              ) : (
                <button className="cd-btn cd-btn--primary" onClick={handleEnroll}>
                  Enroll Now
                </button>
              )}
            </div>
          </section>

          <section className="cd-body">
            <div>
              <div className="cd-card">
                <h2>About this course</h2>
                <p>{course.description || "No description provided yet."}</p>
              </div>
            </div>

            <div className="cd-card">
              <h2>What's included</h2>
              <div className="cd-curriculum">
                <div className="cd-curriculum__item">
                  <span className="cd-curriculum__icon"><Icon.Layers /></span>
                  <span className="cd-curriculum__text">
                    <strong>{course.chapters?.length || 0}</strong>
                    <span>Classes</span>
                  </span>
                </div>
                <div className="cd-curriculum__item">
                  <span className="cd-curriculum__icon"><Icon.Play /></span>
                  <span className="cd-curriculum__text">
                    <strong>
                      {(course.chapters || []).filter((c) => c.videoUrl || c.videoFile).length}
                    </strong>
                    <span>Videos</span>
                  </span>
                </div>
                <div className="cd-curriculum__item">
                  <span className="cd-curriculum__icon"><Icon.Quiz /></span>
                  <span className="cd-curriculum__text">
                    <strong>
                      {(course.chapters || []).reduce((n, c) => n + (c.questions?.length || 0), 0)}
                    </strong>
                    <span>Practice questions</span>
                  </span>
                </div>
                <div className="cd-curriculum__item">
                  <span className="cd-curriculum__icon"><Icon.Assignment /></span>
                  <span className="cd-curriculum__text">
                    <strong>
                      {(course.chapters || []).reduce((n, c) => n + (c.codeSnippets?.length || 0), 0)}
                    </strong>
                    <span>Code snippets</span>
                  </span>
                </div>
                <div className="cd-curriculum__item">
                  <span className="cd-curriculum__icon"><Icon.Certificate /></span>
                  <span className="cd-curriculum__text">
                    <strong>{course.certificateAvailable === false ? "No" : "Yes"}</strong>
                    <span>Certificate</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------
   Add these routes wherever your other routes are declared (App.js):

     import CourseDetail from "./CourseDetail";
     import Content from "./Content";
     import Payment from "./Payment";
     ...
     <Route path="/courses/:id" element={<CourseDetail />} />
     <Route path="/courses/:id/learn" element={<Content />} />
     <Route path="/payment/:id" element={<Payment />} />

   They need to sit alongside the existing <Route path="/courses" .../>.
   ------------------------------------------------------------------ */