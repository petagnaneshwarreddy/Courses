import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-0lye.onrender.com";

/* ------------------------------------------------------------------
   INVITE.jsx — Admin-only "invite a student to a course" page
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as Students.js / Settings.js / Profile.js:
   localStorage "token" + "role".
   - No token                -> redirected to /login
   - token, role !== "admin" -> redirected to /dashboard (admin-only)
   - token, role === "admin" -> full invite flow

   FLOW
   1. Admin picks a course, enters the student's email, phone number,
      and a password (or clicks "Generate" for a random one).
   2. Admin clicks "Send invite".
   3. The backend creates the account + enrollment and returns a
      shareable login link plus the username/password to hand to the
      student. Those are shown in a result card with one-click copy.
   4. The student opens the link, logs in with that username/password
      on the normal login page, and from there can update their own
      profile details (see Profile.js) — they're already enrolled in
      the assigned course.

   API (see server.js — POST /invite and GET /invites)
     GET  https://course-backend-0lye.onrender.com/courses
     GET  https://course-backend-0lye.onrender.com/invites
     POST https://course-backend-0lye.onrender.com/invite   { courseId, email, phone, password }
          -> { link, username, password, courseTitle }
   Falls back to sample data / a locally-built invite link if the API
   isn't reachable yet, so the page always renders a complete preview.

   NAV
   Renders <Nav /> itself (same as the other pages) inside the
   `.app-shell` / `.app-main` layout that Nav.js expects.

   -------------------------------------------------------------------
   IMPORTANT — CORS
   The "Backend unreachable — invite created locally for preview"
   fallback below only fires when axios gets a *network* error (no
   response at all) — most commonly a CORS block. If invites appear to
   send but never actually show up in your database, check your
   backend's CLIENT_ORIGIN env var matches the port your frontend is
   actually running on (e.g. Vite's default 5173), not just 3000.
   -------------------------------------------------------------------
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/login";
const DASHBOARD_ROUTE = "/dashboard";

const SAMPLE_COURSES = [
  { id: "c1", title: "React for Production Teams", category: "Web Development" },
  { id: "c2", title: "Python for Data Analysis", category: "Data Science" },
  { id: "c3", title: "UI Design Systems", category: "Design" },
  { id: "c4", title: "AWS Cloud Practitioner", category: "Cloud & DevOps" },
  { id: "c5", title: "Ethical Hacking Fundamentals", category: "Cybersecurity" },
  { id: "c6", title: "Flutter Cross-Platform Apps", category: "Mobile Development" },
];

const SAMPLE_INVITES = [
  {
    id: "i1",
    email: "priya.nair@example.com",
    phone: "+91 90000 11122",
    courseTitle: "React for Production Teams",
    status: "Active",
    sentAt: "2026-07-02",
    link: "https://skillfull.tech/login?invite=demo-priya",
  },
  {
    id: "i2",
    email: "arjun.rao@example.com",
    phone: "+91 90000 33344",
    courseTitle: "AWS Cloud Practitioner",
    status: "Pending",
    sentAt: "2026-07-08",
    link: "https://skillfull.tech/login?invite=demo-arjun",
  },
];

function randomToken(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%*";
  const all = upper + lower + digits + symbols;
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 0; i < 6; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join("");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

function statusClass(status) {
  return status === "Active" ? "inv-status--active" : "inv-status--pending";
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`inv-toast inv-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function InviteStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap");

:root {
  --inv-navy: #12163a;
  --inv-navy-soft: #1c2260;
  --inv-indigo: #3d7dff;
  --inv-teal: #00c2a8;
  --inv-amber: #ffb020;
  --inv-danger: #ff5c7a;
  --inv-bg: #f6f7fb;
  --inv-surface: #ffffff;
  --inv-border: #e6e8f0;
  --inv-text: #1f2430;
  --inv-text-soft: #6b7280;
  --inv-radius: 16px;
  --inv-shadow: 0 8px 24px rgba(18, 22, 58, 0.06);
  --inv-shadow-lg: 0 20px 45px rgba(18, 22, 58, 0.16);
}

* { box-sizing: border-box; }

/* ---------- Shell layout (Nav renders its own sidebar; .app-shell /
   .app-main below give it the offset — see Nav.js docblock) ---------- */
.dsh-shell {
  display: flex;
  min-height: 100vh;
  background: var(--inv-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--inv-text);
}

.dsh-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.inv-page {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--inv-text);
  padding: 28px 32px 64px;
  flex: 1;
  box-sizing: border-box;
}
.inv-page * { box-sizing: border-box; }

.inv-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.inv-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.inv-denied p { margin: 4px 0; color: var(--inv-text-soft); }
.inv-denied__redirect { color: var(--inv-indigo); font-weight: 600; }

.inv-header { margin-bottom: 24px; }
.inv-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--inv-indigo);
  margin: 0 0 6px;
}
.inv-header h1 {
  font-family: "Poppins", sans-serif;
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--inv-navy);
}
.inv-subtitle { margin: 0; color: var(--inv-text-soft); font-size: 15px; }

.inv-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.inv-grid-2 {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 20px;
  align-items: start;
  margin-bottom: 24px;
}

.inv-panel {
  background: var(--inv-surface);
  border: 1px solid var(--inv-border);
  border-radius: var(--inv-radius);
  box-shadow: var(--inv-shadow);
  padding: 22px 24px;
}
.inv-panel__header { margin-bottom: 16px; }
.inv-panel__header h2 {
  font-family: "Poppins", sans-serif;
  font-size: 17px;
  margin: 0 0 4px;
  color: var(--inv-navy);
}
.inv-panel__header p { margin: 0; color: var(--inv-text-soft); font-size: 13px; }

.inv-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--inv-text-soft);
  margin-bottom: 14px;
}
.inv-field select,
.inv-field input {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--inv-text);
  border: 1px solid var(--inv-border);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
  background: var(--inv-surface);
}
.inv-field select:focus,
.inv-field input:focus {
  border-color: var(--inv-indigo);
  box-shadow: 0 0 0 3px rgba(61, 125, 255, 0.15);
}
.inv-field em {
  font-style: normal;
  color: var(--inv-danger);
  font-size: 11.5px;
}
.inv-password-row { display: flex; gap: 8px; }
.inv-password-row input { flex: 1; }

.inv-btn {
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}
.inv-btn:active { transform: translateY(1px); }
.inv-btn--primary {
  background: linear-gradient(135deg, var(--inv-indigo), #2e5fe0);
  color: #fff;
  box-shadow: 0 10px 20px rgba(61, 125, 255, 0.25);
  width: 100%;
  margin-top: 4px;
}
.inv-btn--ghost {
  background: var(--inv-surface);
  border: 1px solid var(--inv-border);
  color: var(--inv-text);
}
.inv-btn--ghost:hover { border-color: var(--inv-indigo); color: var(--inv-indigo); }
.inv-btn--sm { padding: 9px 12px; font-size: 13px; }
.inv-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.inv-result {
  border: 1px dashed var(--inv-border);
  border-radius: 14px;
  padding: 20px;
  min-height: 100%;
}
.inv-result--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--inv-text-soft);
  font-size: 13.5px;
  min-height: 220px;
}
.inv-result__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e3f9ee;
  color: #16a34a;
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.inv-result__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fafbfe;
  border: 1px solid var(--inv-border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.inv-result__row div { min-width: 0; }
.inv-result__label {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--inv-text-soft);
  margin-bottom: 2px;
}
.inv-result__value {
  font-family: "Poppins", sans-serif;
  font-size: 13.5px;
  color: var(--inv-navy);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.inv-result__note {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--inv-text-soft);
}

/* Table */
.inv-table-wrap {
  background: var(--inv-surface);
  border: 1px solid var(--inv-border);
  border-radius: var(--inv-radius);
  overflow: hidden;
  box-shadow: var(--inv-shadow);
}
.inv-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.inv-table thead { background: #fafbfe; }
.inv-table th, .inv-table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--inv-border);
}
.inv-table tbody tr:last-child td { border-bottom: none; }
.inv-table__who div:first-child { font-weight: 600; color: var(--inv-navy); }
.inv-table__who div:last-child { color: var(--inv-text-soft); font-size: 12px; }
.inv-table__actions { display: flex; gap: 8px; }

.inv-status {
  border: none;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: inline-block;
}
.inv-status--active { background: #e3f9ee; color: #16a34a; }
.inv-status--pending { background: #fff2da; color: #a5620b; }

.inv-icon-btn {
  background: transparent;
  border: 1px solid var(--inv-border);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 13px;
}
.inv-icon-btn:hover { border-color: var(--inv-indigo); color: var(--inv-indigo); }

.inv-empty {
  text-align: center;
  padding: 48px 24px;
  background: var(--inv-surface);
  border: 1px dashed var(--inv-border);
  border-radius: var(--inv-radius);
}
.inv-empty h3 { font-family: "Poppins", sans-serif; margin: 0 0 6px; }
.inv-empty p { color: var(--inv-text-soft); margin: 0; }

.inv-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--inv-navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--inv-shadow-lg);
  z-index: 1100;
}
.inv-toast--danger { background: var(--inv-danger); }
.inv-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.8; }

@media (max-width: 960px) {
  .inv-grid-2 { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .inv-page { padding: 20px; }
  .inv-header { align-items: flex-start; }
}
    `}</style>
  );
}

export default function Invite() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(false);

  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const [form, setForm] = useState({ courseId: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  // ---- Auth check (admin-only, same pattern as Students.js) --------------
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
    const admin = role === "admin";
    setIsAdmin(admin);
    setAuthChecked(true);

    if (!admin) {
      const t = setTimeout(() => navigate(DASHBOARD_ROUTE), 1200);
      return () => clearTimeout(t);
    }
  }, [navigate]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // ---- Load courses for the select --------------------------------------
  useEffect(() => {
    if (!hasToken || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setCoursesLoading(true);
      setCoursesError(false);
      try {
        const res = await axios.get(`${API_BASE}/courses`, { headers: authHeaders() });
        const data = res.data;
        const list = Array.isArray(data) ? data : data.courses || [];
        if (!cancelled) setCourses(list.length ? list : SAMPLE_COURSES);
      } catch {
        if (!cancelled) {
          setCourses(SAMPLE_COURSES);
          setCoursesError(true);
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasToken, isAdmin]);

  // ---- Load recent invites ------------------------------------------------
  useEffect(() => {
    if (!hasToken || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setInvitesLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/invites`, { headers: authHeaders() });
        const data = res.data;
        const list = Array.isArray(data) ? data : data.invites || [];
        if (!cancelled) setInvites(list.length ? list : SAMPLE_INVITES);
      } catch {
        if (!cancelled) setInvites(SAMPLE_INVITES);
      } finally {
        if (!cancelled) setInvitesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasToken, isAdmin]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(form.courseId)) || null,
    [courses, form.courseId]
  );

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const fillGeneratedPassword = () => {
    setForm((f) => ({ ...f, password: generatePassword() }));
    setShowPassword(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.courseId) errs.courseId = "Choose a course";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7)
      errs.phone = "Enter a valid phone number";
    if (!form.password || form.password.length < 8) errs.password = "Use at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const courseTitle = selectedCourse?.title || "the course";

    try {
      const res = await axios.post(
        `${API_BASE}/invite`,
        {
          courseId: form.courseId,
          email: form.email,
          phone: form.phone,
          password: form.password,
        },
        { headers: authHeaders() }
      );

      const data = res.data || {};
      const invite = {
        link: data.link || `${window.location.origin}/login?invite=${randomToken()}`,
        username: data.username || form.email,
        password: data.password || form.password,
        courseTitle: data.courseTitle || courseTitle,
      };
      setResult(invite);
      setInvites((prev) => [
        {
          id: data.id || `local-${Date.now()}`,
          email: form.email,
          phone: form.phone,
          courseTitle: invite.courseTitle,
          status: "Pending",
          sentAt: new Date().toISOString().slice(0, 10),
          link: invite.link,
        },
        ...prev,
      ]);
      showToast(`Invite sent to ${form.email}`);
    } catch (err) {
      // Backend reachable but rejected the request (e.g. validation,
      // duplicate email tied to a non-student account) — surface the
      // server's message instead of silently faking success.
      const message = err?.response?.data?.message;
      if (message) {
        showToast(message, "danger");
        setSubmitting(false);
        return;
      }
      // Backend not reachable at all (this branch also fires on a CORS
      // block — check your backend's CLIENT_ORIGIN matches the port
      // this frontend is actually served on) — build a local invite so
      // the flow can still be previewed and the credentials handed to
      // the student, but note that nothing was actually persisted.
      const invite = {
        link: `${window.location.origin}/login?invite=${randomToken()}`,
        username: form.email,
        password: form.password,
        courseTitle,
      };
      setResult(invite);
      setInvites((prev) => [
        {
          id: `local-${Date.now()}`,
          email: form.email,
          phone: form.phone,
          courseTitle,
          status: "Pending",
          sentAt: new Date().toISOString().slice(0, 10),
          link: invite.link,
        },
        ...prev,
      ]);
      showToast("Backend unreachable — invite created locally for preview", "danger");
    } finally {
      setSubmitting(false);
      setForm({ courseId: "", email: "", phone: "", password: "" });
      setShowPassword(false);
    }
  };

  const handleCopy = async (text, label) => {
    const ok = await copyText(text);
    showToast(ok ? `${label} copied` : `Couldn't copy ${label.toLowerCase()}`, ok ? "success" : "danger");
  };

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell dsh-shell">
        <InviteStyles />
        <div className="app-main dsh-main">
          <div className="inv-page inv-page--centered" style={{ margin: "0 auto" }}>
            Checking access…
          </div>
        </div>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell dsh-shell">
        <InviteStyles />
        <div className="app-main dsh-main">
          <div className="inv-page inv-page--centered" style={{ margin: "0 auto" }}>
            <div className="inv-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to invite students.</p>
              <p className="inv-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="app-shell dsh-shell">
        <InviteStyles />
        <Nav />
        <div className="app-main dsh-main">
          <div className="inv-page inv-page--centered" style={{ margin: "0 auto" }}>
            <div className="inv-denied">
              <h2>Admins only</h2>
              <p>This page is only available to admin accounts.</p>
              <p className="inv-denied__redirect">Redirecting you to your dashboard…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell dsh-shell">
      <InviteStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Nav />

      <div className="app-main dsh-main">
        <div className="inv-page">
          <header className="inv-header">
            <p className="inv-eyebrow">Admin · Course access</p>
            <h1>Invite a student</h1>
            <p className="inv-subtitle">
              Pick a course and send a student their login link, username and password.
            </p>
          </header>

          {coursesError && (
            <div className="inv-banner">
              Couldn't reach the courses API — showing sample courses so you can
              preview the page. Connect your backend to see live data.
            </div>
          )}

          <div className="inv-grid-2">
            <section className="inv-panel">
              <div className="inv-panel__header">
                <h2>Invite details</h2>
                <p>The student will use these credentials to log in for the first time.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <label className="inv-field">
                  <span>Course</span>
                  <select
                    value={form.courseId}
                    onChange={update("courseId")}
                    disabled={coursesLoading}
                  >
                    <option value="">
                      {coursesLoading ? "Loading courses…" : "Select a course"}
                    </option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {errors.courseId && <em>{errors.courseId}</em>}
                </label>

                <label className="inv-field">
                  <span>Student email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="student@example.com"
                  />
                  {errors.email && <em>{errors.email}</em>}
                </label>

                <label className="inv-field">
                  <span>Phone number</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <em>{errors.phone}</em>}
                </label>

                <label className="inv-field">
                  <span>Password</span>
                  <div className="inv-password-row">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={update("password")}
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      className="inv-btn inv-btn--ghost inv-btn--sm"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className="inv-btn inv-btn--ghost inv-btn--sm"
                      onClick={fillGeneratedPassword}
                    >
                      Generate
                    </button>
                  </div>
                  {errors.password && <em>{errors.password}</em>}
                </label>

                <button type="submit" className="inv-btn inv-btn--primary" disabled={submitting}>
                  {submitting ? "Sending invite…" : "Send invite"}
                </button>
              </form>
            </section>

            <section className="inv-panel">
              <div className="inv-panel__header">
                <h2>Login link &amp; credentials</h2>
                <p>Share these with the student after sending an invite.</p>
              </div>

              {!result ? (
                <div className="inv-result inv-result--empty">
                  Send an invite to generate a login link, username and
                  password you can hand to the student.
                </div>
              ) : (
                <div className="inv-result">
                  <span className="inv-result__badge">✓ Invite created</span>

                  <div className="inv-result__row">
                    <div>
                      <span className="inv-result__label">Login link</span>
                      <span className="inv-result__value">{result.link}</span>
                    </div>
                    <button
                      className="inv-btn inv-btn--ghost inv-btn--sm"
                      onClick={() => handleCopy(result.link, "Link")}
                    >
                      Copy
                    </button>
                  </div>

                  <div className="inv-result__row">
                    <div>
                      <span className="inv-result__label">Username</span>
                      <span className="inv-result__value">{result.username}</span>
                    </div>
                    <button
                      className="inv-btn inv-btn--ghost inv-btn--sm"
                      onClick={() => handleCopy(result.username, "Username")}
                    >
                      Copy
                    </button>
                  </div>

                  <div className="inv-result__row">
                    <div>
                      <span className="inv-result__label">Password</span>
                      <span className="inv-result__value">{result.password}</span>
                    </div>
                    <button
                      className="inv-btn inv-btn--ghost inv-btn--sm"
                      onClick={() => handleCopy(result.password, "Password")}
                    >
                      Copy
                    </button>
                  </div>

                  <p className="inv-result__note">
                    Enrolled in <strong>{result.courseTitle}</strong>. Once the
                    student logs in with these credentials they can update
                    their own profile details and start the course right away.
                  </p>
                </div>
              )}
            </section>
          </div>

          <section>
            <div className="inv-panel__header" style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: 17, color: "var(--inv-navy)", margin: 0 }}>
                Recent invites
              </h2>
            </div>

            {!invitesLoading && invites.length === 0 ? (
              <div className="inv-empty">
                <h3>No invites sent yet</h3>
                <p>Invites you send will show up here.</p>
              </div>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Sent</th>
                      <th>Status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {invitesLoading
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={5} style={{ color: "var(--inv-text-soft)" }}>
                              Loading…
                            </td>
                          </tr>
                        ))
                      : invites.map((inv) => (
                          <tr key={inv.id}>
                            <td className="inv-table__who">
                              <div>{inv.email}</div>
                              <div>{inv.phone}</div>
                            </td>
                            <td>{inv.courseTitle}</td>
                            <td>{inv.sentAt}</td>
                            <td>
                              <span className={`inv-status ${statusClass(inv.status)}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="inv-table__actions">
                              <button
                                className="inv-icon-btn"
                                onClick={() => handleCopy(inv.link, "Link")}
                                aria-label="Copy invite link"
                              >
                                🔗
                              </button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}