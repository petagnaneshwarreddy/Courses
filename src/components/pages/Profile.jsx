import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-0lye.onrender.com";

/* ------------------------------------------------------------------
   PROFILE.js — Account profile page (student + admin)
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as the rest of the app: localStorage "token" + "role".
   - No token -> redirected to /login
   - Any logged-in user (student or admin) can view/edit their own
     profile. Admin sees a couple of extra platform-facing stats.

   LAYOUT
   Uses the shared <Nav /> sidebar (see ./Nav.js) for navigation, the
   same as every other authenticated page in the app. The page itself
   only renders its own content inside the `.app-main` column that Nav
   expects (see Nav.js docblock for the `.app-shell` / `.app-main`
   contract). No duplicate sidebar/topbar markup lives here anymore.

   API (see API_BASE above — keep this in sync with Login.jsx,
   Register.jsx, Students.js, and Settings.js)
     GET ${API_BASE}/profile
     PUT ${API_BASE}/profile
     PUT ${API_BASE}/profile/password
   Falls back to sample data if the API isn't reachable yet, so the
   page always renders a complete preview.
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/login";

const SAMPLE_PROFILE = {
  name: "Ananya Gupta",
  email: "ananya.gupta@example.com",
  phone: "+91 98765 43210",
  bio: "Frontend developer picking up data skills one course at a time.",
  role: "student",
  joinedAt: "2026-02-11",
  hoursLearned: 38,
  coursesEnrolled: 4,
  certificates: 1,
  coursesManaged: 6,
  studentsManaged: 1430,
};

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`prf-toast prf-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function ProfileStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap");

:root {
  --prf-navy: #12163a;
  --prf-navy-soft: #1c2260;
  --prf-indigo: #3d7dff;
  --prf-teal: #00c2a8;
  --prf-amber: #ffb020;
  --prf-danger: #ff5c7a;
  --prf-bg: #f6f7fb;
  --prf-surface: #ffffff;
  --prf-border: #e6e8f0;
  --prf-text: #1f2430;
  --prf-text-soft: #6b7280;
  --prf-radius: 16px;
  --prf-shadow: 0 8px 24px rgba(18, 22, 58, 0.06);
  --prf-shadow-lg: 0 20px 45px rgba(18, 22, 58, 0.16);
}

* { box-sizing: border-box; }

/* ---------- Shell layout (Nav renders its own sidebar; .app-shell /
   .app-main below give it the offset — see Nav.js docblock) ---------- */
.dsh-shell {
  display: flex;
  min-height: 100vh;
  background: var(--prf-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--prf-text);
}

.dsh-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ---------- Page content ---------- */
.prf-page {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--prf-text);
  padding: 28px 32px 64px;
  flex: 1;
  box-sizing: border-box;
}
.prf-page * { box-sizing: border-box; }

.prf-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.prf-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.prf-denied p { margin: 4px 0; color: var(--prf-text-soft); }
.prf-denied__redirect { color: var(--prf-indigo); font-weight: 600; }

.prf-header {
  margin-bottom: 24px;
}
.prf-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--prf-indigo);
  margin: 0 0 6px;
}
.prf-header h1 {
  font-family: "Poppins", sans-serif;
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--prf-navy);
}
.prf-subtitle { margin: 0; color: var(--prf-text-soft); font-size: 15px; }

.prf-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.prf-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(120deg, var(--prf-navy), var(--prf-navy-soft) 65%, #22307f);
  border-radius: 20px;
  padding: 26px 30px;
  color: #fff;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.prf-hero__avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--prf-teal), var(--prf-indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
}
.prf-hero__id h2 {
  font-family: "Poppins", sans-serif;
  font-size: 22px;
  margin: 0 0 4px;
}
.prf-hero__id p { margin: 0 0 8px; color: #c6cbef; font-size: 13.5px; }
.prf-hero__role {
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.prf-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.prf-stat {
  background: var(--prf-surface);
  border: 1px solid var(--prf-border);
  border-radius: var(--prf-radius);
  padding: 18px 20px;
  box-shadow: var(--prf-shadow);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.prf-stat:hover { transform: translateY(-2px); box-shadow: var(--prf-shadow-lg); }
.prf-stat__label { font-size: 12.5px; color: var(--prf-text-soft); font-weight: 600; }
.prf-stat__value { font-family: "Poppins", sans-serif; font-size: 24px; font-weight: 700; color: var(--prf-navy); }

.prf-grid-2 {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  align-items: start;
}

.prf-panel {
  background: var(--prf-surface);
  border: 1px solid var(--prf-border);
  border-radius: var(--prf-radius);
  box-shadow: var(--prf-shadow);
  padding: 22px 24px;
  margin-bottom: 20px;
}
.prf-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.prf-panel__header h2 {
  font-family: "Poppins", sans-serif;
  font-size: 17px;
  margin: 0;
  color: var(--prf-navy);
}

.prf-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.prf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--prf-text-soft);
}
.prf-field--wide { grid-column: 1 / -1; }
.prf-field input,
.prf-field textarea {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--prf-text);
  border: 1px solid var(--prf-border);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
  resize: vertical;
  background: var(--prf-surface);
}
.prf-field input:disabled,
.prf-field textarea:disabled {
  background: #fafbfe;
  color: var(--prf-text-soft);
}
.prf-field input:focus,
.prf-field textarea:focus {
  border-color: var(--prf-indigo);
  box-shadow: 0 0 0 3px rgba(61, 125, 255, 0.15);
}
.prf-field em {
  font-style: normal;
  color: var(--prf-danger);
  font-size: 11.5px;
}

.prf-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.prf-btn {
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.prf-btn:active { transform: translateY(1px); }
.prf-btn--primary {
  background: linear-gradient(135deg, var(--prf-indigo), #2e5fe0);
  color: #fff;
  box-shadow: 0 10px 20px rgba(61, 125, 255, 0.25);
}
.prf-btn--ghost {
  background: var(--prf-surface);
  border: 1px solid var(--prf-border);
  color: var(--prf-text);
}
.prf-btn--ghost:hover { border-color: var(--prf-indigo); color: var(--prf-indigo); }
.prf-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.prf-info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.prf-info-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--prf-border);
  font-size: 13.5px;
}
.prf-info-list li:last-child { border-bottom: none; }
.prf-info-list span:first-child { color: var(--prf-text-soft); }
.prf-info-list strong { color: var(--prf-navy); font-family: "Poppins", sans-serif; font-size: 13.5px; }

/* ---------- Responsive ---------- */
@media (max-width: 1080px) {
  .prf-grid-2 { grid-template-columns: 1fr; }
  .prf-stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .prf-page { padding: 20px; }
  .prf-form__grid { grid-template-columns: 1fr; }
  .prf-stats { grid-template-columns: 1fr 1fr; }
}

.prf-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--prf-navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--prf-shadow-lg);
  z-index: 1100;
}
.prf-toast--danger { background: var(--prf-danger); }
.prf-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.8; }
    `}</style>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState(SAMPLE_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(SAMPLE_PROFILE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const [toast, setToast] = useState(null);

  // ---- Auth check --------------------------------------------------------
  // NOTE: this only gates access to the page's data/UI. <Nav /> below does
  // its own independent read of localStorage to decide what to render —
  // see Nav.js for why that's a UI convenience, not real authorization.
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
    setAuthChecked(true);
  }, [navigate]);

  // ---- Load profile -------------------------------------------------------
  useEffect(() => {
    if (!hasToken) return;
    const token = localStorage.getItem("token");
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await axios.get(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setProfile({ ...SAMPLE_PROFILE, ...res.data });
          setForm({ ...SAMPLE_PROFILE, ...res.data });
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const startEdit = () => {
    setForm(profile);
    setErrors({});
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(profile);
    setErrors({});
    setEditing(false);
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/profile`, form, {
        headers: authHeaders(),
      });
      const saved = { ...form, ...res.data };
      setProfile(saved);
      setForm(saved);
      showToast("Profile updated");
    } catch {
      // Backend not reachable yet — keep the change locally so the UI
      // still reflects the edit during development.
      setProfile(form);
      showToast("Profile updated locally (backend unreachable)");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const updatePw = (key) => (e) => setPw((p) => ({ ...p, [key]: e.target.value }));

  const validatePw = () => {
    const errs = {};
    if (!pw.current) errs.current = "Enter your current password";
    if (!pw.next || pw.next.length < 8) errs.next = "Use at least 8 characters";
    if (pw.confirm !== pw.next) errs.confirm = "Passwords don't match";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await axios.put(
        `${API_BASE}/profile/password`,
        { currentPassword: pw.current, newPassword: pw.next },
        { headers: authHeaders() }
      );
      showToast("Password updated");
    } catch {
      showToast("Couldn't reach the server — try again later", "danger");
    } finally {
      setPwSaving(false);
      setPw({ current: "", next: "", confirm: "" });
    }
  };

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell dsh-shell">
        <ProfileStyles />
        <div className="app-main dsh-main">
          <div className="prf-page prf-page--centered" style={{ margin: "0 auto" }}>
            Checking access…
          </div>
        </div>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell dsh-shell">
        <ProfileStyles />
        <div className="app-main dsh-main">
          <div className="prf-page prf-page--centered" style={{ margin: "0 auto" }}>
            <div className="prf-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view your profile.</p>
              <p className="prf-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell dsh-shell">
      <ProfileStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Nav />

      <div className="app-main dsh-main">
        <div className="prf-page">
          <header className="prf-header">
            <p className="prf-eyebrow">Account</p>
            <h1>Profile</h1>
            <p className="prf-subtitle">Manage your personal details and password.</p>
          </header>

          {loadError && (
            <div className="prf-banner">
              Couldn't reach the profile API — showing your last known details so
              you can preview the page. Connect your backend to see live data.
            </div>
          )}

          <section className="prf-hero">
            <div className="prf-hero__avatar">{initials(profile.name)}</div>
            <div className="prf-hero__id">
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <span className="prf-hero__role">{isAdmin ? "Admin" : "Student"}</span>
            </div>
          </section>

          <section className="prf-stats">
            {isAdmin ? (
              <>
                <div className="prf-stat">
                  <span className="prf-stat__label">Courses managed</span>
                  <span className="prf-stat__value">{profile.coursesManaged}</span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Students managed</span>
                  <span className="prf-stat__value">
                    {profile.studentsManaged.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Member since</span>
                  <span className="prf-stat__value">{profile.joinedAt}</span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Role</span>
                  <span className="prf-stat__value">Admin</span>
                </div>
              </>
            ) : (
              <>
                <div className="prf-stat">
                  <span className="prf-stat__label">Hours learned</span>
                  <span className="prf-stat__value">{profile.hoursLearned}h</span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Courses enrolled</span>
                  <span className="prf-stat__value">{profile.coursesEnrolled}</span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Certificates</span>
                  <span className="prf-stat__value">{profile.certificates}</span>
                </div>
                <div className="prf-stat">
                  <span className="prf-stat__label">Member since</span>
                  <span className="prf-stat__value">{profile.joinedAt}</span>
                </div>
              </>
            )}
          </section>

          <div className="prf-grid-2">
            <div>
              <div className="prf-panel">
                <div className="prf-panel__header">
                  <h2>Personal details</h2>
                  {!editing && (
                    <button className="prf-btn prf-btn--ghost" onClick={startEdit} disabled={loading}>
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={saveProfile}>
                  <div className="prf-form__grid">
                    <label className="prf-field">
                      <span>Full name</span>
                      <input
                        type="text"
                        value={form.name}
                        disabled={!editing}
                        onChange={update("name")}
                      />
                      {errors.name && <em>{errors.name}</em>}
                    </label>

                    <label className="prf-field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={form.email}
                        disabled={!editing}
                        onChange={update("email")}
                      />
                      {errors.email && <em>{errors.email}</em>}
                    </label>

                    <label className="prf-field">
                      <span>Phone</span>
                      <input
                        type="tel"
                        value={form.phone}
                        disabled={!editing}
                        onChange={update("phone")}
                        placeholder="+91 98765 43210"
                      />
                    </label>

                    <label className="prf-field">
                      <span>Role</span>
                      <input type="text" value={isAdmin ? "Admin" : "Student"} disabled />
                    </label>

                    <label className="prf-field prf-field--wide">
                      <span>Bio</span>
                      <textarea
                        rows={3}
                        value={form.bio}
                        disabled={!editing}
                        onChange={update("bio")}
                        placeholder="Tell us a bit about yourself"
                      />
                    </label>
                  </div>

                  {editing && (
                    <div className="prf-form__actions">
                      <button type="button" className="prf-btn prf-btn--ghost" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button type="submit" className="prf-btn prf-btn--primary" disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              <div className="prf-panel">
                <div className="prf-panel__header">
                  <h2>Change password</h2>
                </div>
                <form onSubmit={savePassword}>
                  <div className="prf-form__grid">
                    <label className="prf-field prf-field--wide">
                      <span>Current password</span>
                      <input
                        type="password"
                        value={pw.current}
                        onChange={updatePw("current")}
                        placeholder="••••••••"
                      />
                      {pwErrors.current && <em>{pwErrors.current}</em>}
                    </label>
                    <label className="prf-field">
                      <span>New password</span>
                      <input
                        type="password"
                        value={pw.next}
                        onChange={updatePw("next")}
                        placeholder="At least 8 characters"
                      />
                      {pwErrors.next && <em>{pwErrors.next}</em>}
                    </label>
                    <label className="prf-field">
                      <span>Confirm new password</span>
                      <input
                        type="password"
                        value={pw.confirm}
                        onChange={updatePw("confirm")}
                        placeholder="Repeat new password"
                      />
                      {pwErrors.confirm && <em>{pwErrors.confirm}</em>}
                    </label>
                  </div>
                  <div className="prf-form__actions">
                    <button type="submit" className="prf-btn prf-btn--primary" disabled={pwSaving}>
                      {pwSaving ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div>
              <div className="prf-panel">
                <div className="prf-panel__header">
                  <h2>Account info</h2>
                </div>
                <ul className="prf-info-list">
                  <li>
                    <span>Email</span>
                    <strong>{profile.email}</strong>
                  </li>
                  <li>
                    <span>Role</span>
                    <strong>{isAdmin ? "Admin" : "Student"}</strong>
                  </li>
                  <li>
                    <span>Member since</span>
                    <strong>{profile.joinedAt}</strong>
                  </li>
                  {!isAdmin && (
                    <li>
                      <span>Certificates earned</span>
                      <strong>{profile.certificates}</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}