import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-01ye.onrender.com";

/* ------------------------------------------------------------------
   DASHBOARD.js — Landing page after login
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as Courses.js / Login.js: localStorage "token" + "role".
   - No token                -> redirected to /explore/login (adjust
                                 LOGIN_ROUTE below if yours differs)
   - token, role !== "admin" -> student view: enrolled courses,
                                 progress, recommended courses
   - token, role === "admin" -> admin view: platform stats, weekly
                                 signups chart, recent activity, top
                                 performing courses

   LAYOUT
   Uses the shared <Nav /> sidebar (same component as Courses.js) via
   the standard app-shell / app-main wrapper, plus a page-local top bar
   with search and a profile menu. Nav owns its own mobile drawer/burger
   button, so this page no longer needs its own sidebar or menu toggle.

   API
   Tries:
     GET https://backend-qtzh.onrender.com/dashboard   (role-aware, ideal)
   Falls back to sample data if not reachable, so the page always
   renders a complete preview.
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/explore/login"; // adjust if your login route differs

const SAMPLE_ADMIN = {
  totalStudents: 1430,
  totalCourses: 6,
  totalRevenue: 1842300,
  newSignupsWeek: 87,
  weeklySignups: [12, 18, 9, 22, 14, 6, 6],
  topCourses: [
    { id: "c2", title: "Python for Data Analysis", students: 512, rating: 4.8 },
    { id: "c1", title: "React for Production Teams", students: 341, rating: 4.7 },
    { id: "c4", title: "AWS Cloud Practitioner", students: 128, rating: 4.5 },
    { id: "c6", title: "Flutter Cross-Platform Apps", students: 156, rating: 4.4 },
  ],
  activity: [
    { id: 1, type: "signup", text: "3 new students registered", time: "2h ago" },
    { id: 2, type: "publish", text: "\"AWS Cloud Practitioner\" was published", time: "5h ago" },
    { id: 3, type: "enroll", text: "12 new enrollments in \"Python for Data Analysis\"", time: "1d ago" },
    { id: 4, type: "review", text: "New 5★ review on \"Ethical Hacking Fundamentals\"", time: "1d ago" },
    { id: 5, type: "signup", text: "9 new students registered", time: "2d ago" },
  ],
};

const SAMPLE_STUDENT = {
  hoursLearned: 38,
  coursesEnrolled: 4,
  coursesCompleted: 1,
  certificates: 1,
  continueLearning: [
    { id: "c1", title: "React for Production Teams", progress: 62, category: "Web Development" },
    { id: "c2", title: "Python for Data Analysis", progress: 30, category: "Data Science" },
    { id: "c3", title: "UI Design Systems", progress: 88, category: "Design" },
  ],
  recommended: [
    { id: "c4", title: "AWS Cloud Practitioner", category: "Cloud & DevOps", students: 128 },
    { id: "c5", title: "Ethical Hacking Fundamentals", category: "Cybersecurity", students: 89 },
  ],
  activity: [
    { id: 1, type: "progress", text: "You completed Module 3 of \"React for Production Teams\"", time: "3h ago" },
    { id: 2, type: "enroll", text: "You enrolled in \"UI Design Systems\"", time: "2d ago" },
    { id: 3, type: "cert", text: "You earned a certificate in \"HTML & CSS Basics\"", time: "6d ago" },
  ],
};

const CATEGORY_COLORS = {
  "Web Development": "#3D7DFF",
  "Data Science": "#00C2A8",
  Design: "#FF8A5B",
  "Cloud & DevOps": "#8B6BFF",
  "Mobile Development": "#FFB020",
  Cybersecurity: "#FF5C7A",
};

function currency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return json;
  } catch {
    return null;
  }
}

function greetingForHour(hour) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------ Charts ------------------------------ */

function WeeklyBarChart({ data }) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...data, 1);
  const w = 560;
  const h = 180;
  const gap = 18;
  const barW = (w - gap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h + 26}`} className="dsh-chart" role="img" aria-label="Weekly signups">
      {data.map((v, i) => {
        const barH = Math.max((v / max) * h, 4);
        const x = i * (barW + gap);
        const y = h - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={7}
              fill={i === data.length - 1 ? "#3D7DFF" : "#DCE4FF"}
            />
            <text x={x + barW / 2} y={h + 20} textAnchor="middle" className="dsh-chart__label">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RadialProgress({ value, size = 96, stroke = 10, color = "#00C2A8" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dsh-radial">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF1F8" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="dsh-radial__label">
        {value}%
      </text>
    </svg>
  );
}

function ActivityIcon({ type }) {
  const map = {
    signup: "👤",
    publish: "🚀",
    enroll: "🎓",
    review: "⭐",
    progress: "📘",
    cert: "🏅",
  };
  return <span className="dsh-activity__icon">{map[type] || "•"}</span>;
}

/* ------------------------------ Top bar ------------------------------ */

function Topbar({ displayName, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate(LOGIN_ROUTE);
  }

  return (
    <header className="dsh-topbar">
      <div className="dsh-topbar__search">
        <span className="dsh-topbar__search-icon">🔎</span>
        <input type="text" placeholder={isAdmin ? "Search students, courses…" : "Search courses…"} />
      </div>

      <div className="dsh-topbar__right">
        <Link to="/notifications" className="dsh-topbar__icon-btn" aria-label="Notifications">
          🔔
          <span className="dsh-topbar__dot" />
        </Link>

        <div className="dsh-topbar__profile" ref={menuRef}>
          <button type="button" className="dsh-topbar__profile-btn" onClick={() => setMenuOpen((v) => !v)}>
            <span className="dsh-topbar__avatar">{initials(displayName)}</span>
            <span className="dsh-topbar__caret">▾</span>
          </button>
          {menuOpen && (
            <div className="dsh-topbar__dropdown">
              <p className="dsh-topbar__dropdown-name">{displayName}</p>
              <p className="dsh-topbar__dropdown-role">{isAdmin ? "Administrator" : "Student"}</p>
              <hr />
              <Link to="/profile" onClick={() => setMenuOpen(false)}>My profile</Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
              <button type="button" onClick={handleLogout}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Styles ------------------------------ */

function DashboardStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap");

:root {
  --dsh-navy: #12163a;
  --dsh-navy-soft: #1c2260;
  --dsh-indigo: #3d7dff;
  --dsh-teal: #00c2a8;
  --dsh-amber: #ffb020;
  --dsh-danger: #ff5c7a;
  --dsh-bg: #f6f7fb;
  --dsh-surface: #ffffff;
  --dsh-border: #e6e8f0;
  --dsh-text: #1f2430;
  --dsh-text-soft: #6b7280;
  --dsh-radius: 16px;
  --dsh-shadow: 0 8px 24px rgba(18, 22, 58, 0.06);
  --dsh-shadow-lg: 0 20px 45px rgba(18, 22, 58, 0.16);
  --dsh-topbar-h: 68px;
}

* { box-sizing: border-box; }

/* ---------- App shell (shared Nav sidebar + content) ---------- */
.app-shell {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
  background: var(--dsh-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dsh-text);
}
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ---------- Top bar ---------- */
.dsh-topbar {
  height: var(--dsh-topbar-h);
  background: var(--dsh-surface);
  border-bottom: 1px solid var(--dsh-border);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 20;
}
.dsh-topbar__search {
  flex: 1;
  max-width: 380px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--dsh-bg);
  border: 1px solid var(--dsh-border);
  border-radius: 10px;
  padding: 9px 14px;
}
.dsh-topbar__search input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13.5px;
  width: 100%;
  color: var(--dsh-text);
}
.dsh-topbar__search-icon { font-size: 13px; opacity: 0.6; }

.dsh-topbar__right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.dsh-topbar__icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dsh-bg);
  border: 1px solid var(--dsh-border);
  text-decoration: none;
  font-size: 15px;
}
.dsh-topbar__dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsh-danger);
  border: 1.5px solid var(--dsh-surface);
}

.dsh-topbar__profile { position: relative; }
.dsh-topbar__profile-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.dsh-topbar__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--dsh-teal), var(--dsh-indigo));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 12.5px;
}
.dsh-topbar__caret { font-size: 11px; color: var(--dsh-text-soft); }
.dsh-topbar__dropdown {
  position: absolute;
  top: 46px;
  right: 0;
  width: 200px;
  background: var(--dsh-surface);
  border: 1px solid var(--dsh-border);
  border-radius: 12px;
  box-shadow: var(--dsh-shadow-lg);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 30;
}
.dsh-topbar__dropdown-name { font-size: 13.5px; font-weight: 700; margin: 2px 0 0; color: var(--dsh-navy); }
.dsh-topbar__dropdown-role { font-size: 11.5px; color: var(--dsh-text-soft); margin: 0 0 6px; }
.dsh-topbar__dropdown hr { border: none; border-top: 1px solid var(--dsh-border); margin: 4px 0; }
.dsh-topbar__dropdown a, .dsh-topbar__dropdown button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--dsh-text);
  text-decoration: none;
  padding: 7px 6px;
  border-radius: 7px;
  cursor: pointer;
}
.dsh-topbar__dropdown a:hover, .dsh-topbar__dropdown button:hover { background: var(--dsh-bg); }
.dsh-topbar__dropdown button { color: var(--dsh-danger); font-weight: 600; }

/* ---------- Page content ---------- */
.dsh-page {
  padding: 28px 32px 64px;
  flex: 1;
}
.dsh-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.dsh-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.dsh-denied p { margin: 4px 0; color: var(--dsh-text-soft); }
.dsh-denied__redirect { color: var(--dsh-indigo); font-weight: 600; }

/* Hero / greeting */
.dsh-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  background: linear-gradient(120deg, var(--dsh-navy), var(--dsh-navy-soft) 65%, #22307f);
  border-radius: 20px;
  padding: 28px 32px;
  color: #fff;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}
.dsh-hero::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(61,125,255,0.35), transparent 70%);
}
.dsh-hero__eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9fb3ff;
  margin: 0 0 6px;
}
.dsh-hero h1 {
  font-family: "Poppins", sans-serif;
  font-size: 30px;
  font-weight: 800;
  margin: 0 0 6px;
}
.dsh-hero p {
  margin: 0;
  color: #c6cbef;
  font-size: 14px;
}
.dsh-hero__right {
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 1;
}
.dsh-hero__role {
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Stats */
.dsh-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.dsh-stat {
  background: var(--dsh-surface);
  border: 1px solid var(--dsh-border);
  border-radius: var(--dsh-radius);
  padding: 18px 20px;
  box-shadow: var(--dsh-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.dsh-stat:hover { transform: translateY(-2px); box-shadow: var(--dsh-shadow-lg); }
.dsh-stat__text { display: flex; flex-direction: column; gap: 6px; }
.dsh-stat__label { font-size: 12.5px; color: var(--dsh-text-soft); font-weight: 600; }
.dsh-stat__value { font-family: "Poppins", sans-serif; font-size: 22px; font-weight: 700; color: var(--dsh-navy); }
.dsh-stat__badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* Layout */
.dsh-grid-2 {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  align-items: start;
}

.dsh-panel {
  background: var(--dsh-surface);
  border: 1px solid var(--dsh-border);
  border-radius: var(--dsh-radius);
  box-shadow: var(--dsh-shadow);
  padding: 22px 24px;
  margin-bottom: 20px;
}
.dsh-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.dsh-panel__header h2 {
  font-family: "Poppins", sans-serif;
  font-size: 17px;
  margin: 0;
  color: var(--dsh-navy);
}
.dsh-panel__link {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsh-indigo);
  text-decoration: none;
}
.dsh-panel__link:hover { text-decoration: underline; }

/* Chart */
.dsh-chart { width: 100%; height: auto; }
.dsh-chart__label { font-size: 10px; fill: var(--dsh-text-soft); font-family: "Inter", sans-serif; }
.dsh-chart-row {
  display: flex;
  align-items: center;
  gap: 24px;
}
.dsh-chart-stat {
  text-align: center;
  flex-shrink: 0;
}
.dsh-chart-stat strong {
  display: block;
  font-family: "Poppins", sans-serif;
  font-size: 22px;
  color: var(--dsh-navy);
}
.dsh-chart-stat span { font-size: 11.5px; color: var(--dsh-text-soft); }

/* Radial */
.dsh-radial__label { font-family: "Poppins", sans-serif; font-size: 16px; font-weight: 700; fill: var(--dsh-navy); }

/* Activity */
.dsh-activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.dsh-activity li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--dsh-border);
  font-size: 13.5px;
}
.dsh-activity li:last-child { border-bottom: none; }
.dsh-activity__icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #f1f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.dsh-activity__text { flex: 1; color: var(--dsh-text); }
.dsh-activity__time { color: var(--dsh-text-soft); font-size: 11.5px; white-space: nowrap; }

/* Top courses list */
.dsh-toplist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.dsh-toplist li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dsh-toplist__rank {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--dsh-navy);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dsh-toplist__title { flex: 1; font-size: 13.5px; font-weight: 600; color: var(--dsh-text); }
.dsh-toplist__meta { font-size: 11.5px; color: var(--dsh-text-soft); }

/* Quick actions */
.dsh-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.dsh-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--dsh-border);
  text-decoration: none;
  color: var(--dsh-text);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.dsh-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--dsh-shadow);
  border-color: var(--dsh-indigo);
}
.dsh-action__icon { font-size: 20px; }
.dsh-action__label { font-size: 13px; font-weight: 700; }

/* Continue learning (student) */
.dsh-course-progress { display: flex; flex-direction: column; gap: 16px; }
.dsh-cp-row { display: flex; align-items: center; gap: 14px; }
.dsh-cp-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}
.dsh-cp-body { flex: 1; }
.dsh-cp-title { font-size: 13.5px; font-weight: 600; margin: 0 0 6px; color: var(--dsh-text); }
.dsh-cp-bar {
  height: 6px;
  border-radius: 999px;
  background: #eef1f8;
  overflow: hidden;
}
.dsh-cp-bar__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--dsh-teal), var(--dsh-indigo));
}
.dsh-cp-pct { font-size: 12px; color: var(--dsh-text-soft); font-weight: 600; flex-shrink: 0; }

.dsh-reco {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--dsh-border);
}
.dsh-reco:last-child { border-bottom: none; }
.dsh-reco__title { font-size: 13.5px; font-weight: 600; margin: 0 0 4px; }
.dsh-reco__meta { font-size: 11.5px; color: var(--dsh-text-soft); }
.dsh-reco__btn {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--dsh-indigo);
  border: none;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.dsh-tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.dsh-skeleton {
  border-radius: var(--dsh-radius);
  background: linear-gradient(90deg, #eef0f6 25%, #f6f7fb 37%, #eef0f6 63%);
  background-size: 400% 100%;
  animation: dsh-shimmer 1.4s ease infinite;
}
@keyframes dsh-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.dsh-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1080px) {
  .dsh-grid-2 { grid-template-columns: 1fr; }
  .dsh-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .dsh-topbar__search { display: none; }
}

@media (max-width: 600px) {
  .dsh-page { padding: 20px; }
  .dsh-topbar { padding: 0 16px; }
  .dsh-hero { flex-direction: column; align-items: flex-start; }
  .dsh-stats { grid-template-columns: 1fr; }
  .dsh-actions { grid-template-columns: 1fr; }
}
    `}</style>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [adminData, setAdminData] = useState(SAMPLE_ADMIN);
  const [studentData, setStudentData] = useState(SAMPLE_STUDENT);

  // ---- Auth check (matches Login.js: localStorage "token" + "role") ----
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toLowerCase();

    if (!token) {
      setHasToken(false);
      setAuthChecked(true);
      const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      return () => clearTimeout(t);
    }

    setHasToken(true);
    setIsAdmin(role === "admin");

    const claims = decodeJwt(token);
    setDisplayName(
      (claims && (claims.name || claims.username || claims.email)) ||
        (role === "admin" ? "Admin" : "Learner")
    );

    setAuthChecked(true);
  }, [navigate]);

  // ---- Load dashboard data --------------------------------------------
  useEffect(() => {
    if (!hasToken) return;
    const token = localStorage.getItem("token");
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await axios.get(`${API_BASE}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (isAdmin) {
          setAdminData({ ...SAMPLE_ADMIN, ...res.data });
        } else {
          setStudentData({ ...SAMPLE_STUDENT, ...res.data });
        }
      } catch {
        if (!cancelled) setLoadError(true);
        // Sample data set at init already covers the fallback view.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasToken, isAdmin]);

  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <DashboardStyles />
          <div className="dsh-page dsh-page--centered">Checking access…</div>
        </main>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <DashboardStyles />
          <div className="dsh-page dsh-page--centered">
            <div className="dsh-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view your dashboard.</p>
              <p className="dsh-denied__redirect">Redirecting you to login…</p>
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
        <DashboardStyles />
        <Topbar displayName={displayName} isAdmin={isAdmin} />

        <div className="dsh-page">
          <section className="dsh-hero">
            <div>
              <p className="dsh-hero__eyebrow">{today}</p>
              <h1>
                {greeting}, {displayName}
              </h1>
              <p>
                {isAdmin
                  ? "Here's how Skillfull Technologies is performing today."
                  : "Pick up right where you left off."}
              </p>
            </div>
            <div className="dsh-hero__right">
              <span className="dsh-hero__role">{isAdmin ? "Admin" : "Student"}</span>
            </div>
          </section>

          {loadError && (
            <div className="dsh-banner">
              Couldn't reach the dashboard API — showing sample data so you can
              preview the page. Connect your backend to see live data.
            </div>
          )}

          {isAdmin ? (
            <AdminDashboard data={adminData} loading={loading} />
          ) : (
            <StudentDashboard data={studentData} loading={loading} />
          )}
        </div>
      </main>
    </div>
  );
}

function AdminDashboard({ data, loading }) {
  const weekTotal = data.weeklySignups.reduce((a, b) => a + b, 0);

  return (
    <>
      <section className="dsh-stats">
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Total students</span>
            <span className="dsh-stat__value">
              {data.totalStudents.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#EAF0FF" }}>👥</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Total courses</span>
            <span className="dsh-stat__value">{data.totalCourses}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#E6FBF6" }}>📚</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Total revenue</span>
            <span className="dsh-stat__value">{currency(data.totalRevenue)}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#FFF3E0" }}>💰</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">New signups (7d)</span>
            <span className="dsh-stat__value">{data.newSignupsWeek}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#FFECEF" }}>✨</div>
        </div>
      </section>

      <div className="dsh-grid-2">
        <div>
          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Signups this week</h2>
              <Link to="/students" className="dsh-panel__link">View students →</Link>
            </div>
            <div className="dsh-chart-row">
              <WeeklyBarChart data={data.weeklySignups} />
              <div className="dsh-chart-stat">
                <strong>{weekTotal}</strong>
                <span>this week</span>
              </div>
            </div>
          </div>

          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Recent activity</h2>
            </div>
            <ul className="dsh-activity">
              {(loading ? [] : data.activity).map((a) => (
                <li key={a.id}>
                  <ActivityIcon type={a.type} />
                  <span className="dsh-activity__text">{a.text}</span>
                  <span className="dsh-activity__time">{a.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Quick actions</h2>
            </div>
            <div className="dsh-actions">
              <Link to="/courses" className="dsh-action">
                <span className="dsh-action__icon">📚</span>
                <span className="dsh-action__label">Manage courses</span>
              </Link>
              <Link to="/students" className="dsh-action">
                <span className="dsh-action__icon">🎓</span>
                <span className="dsh-action__label">View students</span>
              </Link>
              <Link to="/notifications" className="dsh-action">
                <span className="dsh-action__icon">🔔</span>
                <span className="dsh-action__label">Notifications</span>
              </Link>
              <Link to="/settings" className="dsh-action">
                <span className="dsh-action__icon">⚙️</span>
                <span className="dsh-action__label">Settings</span>
              </Link>
            </div>
          </div>

          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Top performing courses</h2>
            </div>
            <ul className="dsh-toplist">
              {data.topCourses.map((c, i) => (
                <li key={c.id}>
                  <span className="dsh-toplist__rank">{i + 1}</span>
                  <span className="dsh-toplist__title">{c.title}</span>
                  <span className="dsh-toplist__meta">
                    {c.students} students · ★ {c.rating}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function StudentDashboard({ data, loading }) {
  const completionRate = data.coursesEnrolled
    ? Math.round((data.coursesCompleted / data.coursesEnrolled) * 100)
    : 0;

  return (
    <>
      <section className="dsh-stats">
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Hours learned</span>
            <span className="dsh-stat__value">{data.hoursLearned}h</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#EAF0FF" }}>⏱️</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Courses enrolled</span>
            <span className="dsh-stat__value">{data.coursesEnrolled}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#E6FBF6" }}>📘</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Courses completed</span>
            <span className="dsh-stat__value">{data.coursesCompleted}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#FFF3E0" }}>✅</div>
        </div>
        <div className="dsh-stat">
          <div className="dsh-stat__text">
            <span className="dsh-stat__label">Certificates</span>
            <span className="dsh-stat__value">{data.certificates}</span>
          </div>
          <div className="dsh-stat__badge" style={{ background: "#FFECEF" }}>🏅</div>
        </div>
      </section>

      <div className="dsh-grid-2">
        <div>
          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Continue learning</h2>
              <Link to="/courses" className="dsh-panel__link">Browse all →</Link>
            </div>
            <div className="dsh-course-progress">
              {(loading ? [] : data.continueLearning).map((c) => (
                <div className="dsh-cp-row" key={c.id}>
                  <div
                    className="dsh-cp-badge"
                    style={{
                      background: `linear-gradient(135deg, ${CATEGORY_COLORS[c.category] || "#3D7DFF"}, #12163a)`,
                    }}
                  />
                  <div className="dsh-cp-body">
                    <p className="dsh-cp-title">{c.title}</p>
                    <div className="dsh-cp-bar">
                      <div className="dsh-cp-bar__fill" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <span className="dsh-cp-pct">{c.progress}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Recent activity</h2>
            </div>
            <ul className="dsh-activity">
              {(loading ? [] : data.activity).map((a) => (
                <li key={a.id}>
                  <ActivityIcon type={a.type} />
                  <span className="dsh-activity__text">{a.text}</span>
                  <span className="dsh-activity__time">{a.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="dsh-panel" style={{ textAlign: "center" }}>
            <div className="dsh-panel__header" style={{ justifyContent: "center" }}>
              <h2>Completion rate</h2>
            </div>
            <RadialProgress value={completionRate} />
          </div>

          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Quick actions</h2>
            </div>
            <div className="dsh-actions">
              <Link to="/courses" className="dsh-action">
                <span className="dsh-action__icon">📚</span>
                <span className="dsh-action__label">Browse courses</span>
              </Link>
              <Link to="/profile" className="dsh-action">
                <span className="dsh-action__icon">🙋</span>
                <span className="dsh-action__label">My profile</span>
              </Link>
              <Link to="/notifications" className="dsh-action">
                <span className="dsh-action__icon">🔔</span>
                <span className="dsh-action__label">Notifications</span>
              </Link>
              <Link to="/settings" className="dsh-action">
                <span className="dsh-action__icon">⚙️</span>
                <span className="dsh-action__label">Settings</span>
              </Link>
            </div>
          </div>

          <div className="dsh-panel">
            <div className="dsh-panel__header">
              <h2>Recommended for you</h2>
            </div>
            {data.recommended.map((c) => (
              <div className="dsh-reco" key={c.id}>
                <div>
                  <p className="dsh-reco__title">{c.title}</p>
                  <span
                    className="dsh-tag"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[c.category] || "#3D7DFF"}22`,
                      color: CATEGORY_COLORS[c.category] || "#3D7DFF",
                    }}
                  >
                    {c.category}
                  </span>
                </div>
                <Link to="/courses" className="dsh-reco__btn">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}