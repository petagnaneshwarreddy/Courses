import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-0lye.onrender.com";

/* ------------------------------------------------------------------
   SETTINGS.js — Account & platform settings page
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as the rest of the app: localStorage "token" + "role".
   - No token -> redirected to /login
   - Any logged-in user sees notification + privacy preferences.
   - Admins additionally see a "Platform settings" panel.

   API
     GET  http://localhost:5000/settings
     PUT  http://localhost:5000/settings
     PUT  http://localhost:5000/settings/platform   (admin only)
     DELETE http://localhost:5000/account            (delete account)
   Falls back to sample data if the API isn't reachable yet, so the
   page always renders a complete, interactive preview.

   NAV
   This page renders <Nav /> itself (same as Students.js) inside the
   `.app-shell` / `.app-main` layout that Nav.js expects — no route-level
   wrapping needed, e.g.:
     <Route path="/settings" element={<Settings />} />
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/login";

const SAMPLE_SETTINGS = {
  emailNotifications: true,
  courseUpdates: true,
  promotionalEmails: false,
  weeklyDigest: true,
  profileVisible: true,
  showProgressToOthers: false,
};

const SAMPLE_PLATFORM = {
  siteName: "Skillfull Technologies",
  supportEmail: "support@skillfull.tech",
  allowNewSignups: true,
  maintenanceMode: false,
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`set-toast set-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function ConfirmDialog({ open, title, body, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="set-overlay" onMouseDown={onCancel}>
      <div
        className="set-confirm"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="set-confirm__actions">
          <button className="set-btn set-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="set-btn set-btn--danger" onClick={onConfirm}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="set-toggle-row">
      <div>
        <span className="set-toggle-row__label">{label}</span>
        {description && <span className="set-toggle-row__desc">{description}</span>}
      </div>
      <span className={`set-switch ${checked ? "is-on" : ""}`}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="set-switch__knob" />
      </span>
    </label>
  );
}

function SettingsStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap");

:root {
  --set-navy: #12163a;
  --set-indigo: #3d7dff;
  --set-teal: #00c2a8;
  --set-amber: #ffb020;
  --set-danger: #ff5c7a;
  --set-bg: #f6f7fb;
  --set-surface: #ffffff;
  --set-border: #e6e8f0;
  --set-text: #1f2430;
  --set-text-soft: #6b7280;
  --set-radius: 16px;
  --set-shadow: 0 8px 24px rgba(18, 22, 58, 0.06);
  --set-shadow-lg: 0 20px 45px rgba(18, 22, 58, 0.16);
}

/* ---------- Shell layout (Nav renders its own sidebar; .app-shell /
   .app-main below give it the offset — see Nav.js docblock) ---------- */
.set-shell {
  display: flex;
  min-height: 100vh;
  background: var(--set-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--set-text);
}

.set-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.set-page {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--set-text);
  background: var(--set-bg);
  flex: 1;
  padding: 32px 40px 64px;
  box-sizing: border-box;
}
.set-page * { box-sizing: border-box; }

.set-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.set-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.set-denied p { margin: 4px 0; color: var(--set-text-soft); }
.set-denied__redirect { color: var(--set-indigo); font-weight: 600; }

.set-header { margin-bottom: 24px; }
.set-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--set-indigo);
  margin: 0 0 6px;
}
.set-header h1 {
  font-family: "Poppins", sans-serif;
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--set-navy);
}
.set-subtitle { margin: 0; color: var(--set-text-soft); font-size: 15px; }

.set-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.set-layout {
  display: grid;
  grid-template-columns: minmax(0, 760px);
  gap: 20px;
}

.set-panel {
  background: var(--set-surface);
  border: 1px solid var(--set-border);
  border-radius: var(--set-radius);
  box-shadow: var(--set-shadow);
  padding: 22px 24px;
}
.set-panel--danger { border-color: #ffd6df; }

.set-panel__header { margin-bottom: 6px; }
.set-panel__header h2 {
  font-family: "Poppins", sans-serif;
  font-size: 17px;
  margin: 0 0 4px;
  color: var(--set-navy);
}
.set-panel__header p {
  margin: 0 0 16px;
  color: var(--set-text-soft);
  font-size: 13px;
}

.set-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px dashed var(--set-border);
  cursor: pointer;
}
.set-toggle-row:last-child { border-bottom: none; }
.set-toggle-row__label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--set-text);
}
.set-toggle-row__desc {
  display: block;
  font-size: 12.5px;
  color: var(--set-text-soft);
  margin-top: 2px;
}

.set-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: #dfe3ee;
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.set-switch.is-on { background: var(--set-indigo); }
.set-switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}
.set-switch__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(18, 22, 58, 0.25);
  transition: transform 0.15s ease;
}
.set-switch.is-on .set-switch__knob { transform: translateX(18px); }

.set-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.set-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--set-text-soft);
}
.set-field--wide { grid-column: 1 / -1; }
.set-field input {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--set-text);
  border: 1px solid var(--set-border);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
}
.set-field input:focus {
  border-color: var(--set-indigo);
  box-shadow: 0 0 0 3px rgba(61, 125, 255, 0.15);
}

.set-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.set-btn {
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 10px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.set-btn:active { transform: translateY(1px); }
.set-btn--primary {
  background: linear-gradient(135deg, var(--set-indigo), #2e5fe0);
  color: #fff;
  box-shadow: 0 10px 20px rgba(61, 125, 255, 0.25);
}
.set-btn--ghost {
  background: var(--set-surface);
  border: 1px solid var(--set-border);
  color: var(--set-text);
}
.set-btn--ghost:hover { border-color: var(--set-indigo); color: var(--set-indigo); }
.set-btn--danger { background: var(--set-danger); color: #fff; }
.set-btn--danger-ghost {
  background: #fff0f3;
  color: var(--set-danger);
  border: 1px solid #ffd6df;
}
.set-btn--danger-ghost:hover { background: var(--set-danger); color: #fff; }
.set-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.set-danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.set-danger-row p {
  margin: 0;
  font-size: 13px;
  color: var(--set-text-soft);
  max-width: 460px;
}

/* Overlay / confirm */
.set-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 22, 58, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}
.set-confirm {
  background: var(--set-surface);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--set-shadow-lg);
}
.set-confirm h3 { margin: 0 0 8px; font-family: "Poppins", sans-serif; }
.set-confirm p { margin: 0 0 20px; color: var(--set-text-soft); font-size: 13.5px; }
.set-confirm__actions { display: flex; justify-content: flex-end; gap: 10px; }

.set-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--set-navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--set-shadow-lg);
  z-index: 1100;
}
.set-toast--danger { background: var(--set-danger); }
.set-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.8; }

@media (max-width: 640px) {
  .set-page { padding: 20px; }
  .set-field-grid { grid-template-columns: 1fr; }
  .set-danger-row { flex-direction: column; align-items: flex-start; }
}
    `}</style>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [settings, setSettings] = useState(SAMPLE_SETTINGS);
  const [platform, setPlatform] = useState(SAMPLE_PLATFORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
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

  // ---- Load settings -------------------------------------------------------
  useEffect(() => {
    if (!hasToken) return;
    const token = localStorage.getItem("token");
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await axios.get(`${API_BASE}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setSettings({ ...SAMPLE_SETTINGS, ...res.data.settings });
          if (res.data.platform) setPlatform({ ...SAMPLE_PLATFORM, ...res.data.platform });
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

  const toggle = (key) => () => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await axios.put(`${API_BASE}/settings`, settings, { headers: authHeaders() });
      showToast("Preferences saved");
    } catch {
      showToast("Saved locally — couldn't reach the server", "danger");
    } finally {
      setSavingPrefs(false);
    }
  };

  const updatePlatform = (key) => (e) =>
    setPlatform((p) => ({
      ...p,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const savePlatform = async (e) => {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      await axios.put(`${API_BASE}/settings/platform`, platform, {
        headers: authHeaders(),
      });
      showToast("Platform settings saved");
    } catch {
      showToast("Saved locally — couldn't reach the server", "danger");
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate(LOGIN_ROUTE);
  };

  const handleDeleteAccount = async () => {
    setConfirmOpen(false);
    try {
      await axios.delete(`${API_BASE}/account`, { headers: authHeaders() });
    } catch {
      /* ignore network error, still sign the user out locally */
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate(LOGIN_ROUTE);
  };

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell set-shell">
        <SettingsStyles />
        <div className="app-main set-main">
          <div className="set-page set-page--centered">Checking access…</div>
        </div>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell set-shell">
        <SettingsStyles />
        <div className="app-main set-main">
          <div className="set-page set-page--centered">
            <div className="set-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view settings.</p>
              <p className="set-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell set-shell">
      <SettingsStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        body="This permanently removes your profile, enrollment history and certificates. This can't be undone."
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />

      <Nav />

      <div className="app-main set-main">
        <div className="set-page">
          <header className="set-header">
            <p className="set-eyebrow">Account</p>
            <h1>Settings</h1>
            <p className="set-subtitle">Control notifications, privacy and your account.</p>
          </header>

          {loadError && (
            <div className="set-banner">
              Couldn't reach the settings API — showing defaults so you can
              preview the page. Connect your backend to see live data.
            </div>
          )}

          <div className="set-layout">
            <section className="set-panel">
              <div className="set-panel__header">
                <h2>Notifications</h2>
                <p>Choose what you hear from us and how often.</p>
              </div>
              <Toggle
                checked={settings.emailNotifications}
                onChange={toggle("emailNotifications")}
                label="Email notifications"
                description="Account activity, enrollments and important updates."
              />
              <Toggle
                checked={settings.courseUpdates}
                onChange={toggle("courseUpdates")}
                label="Course updates"
                description="New lessons or changes to courses you're enrolled in."
              />
              <Toggle
                checked={settings.weeklyDigest}
                onChange={toggle("weeklyDigest")}
                label="Weekly digest"
                description="A short summary of your progress every Monday."
              />
              <Toggle
                checked={settings.promotionalEmails}
                onChange={toggle("promotionalEmails")}
                label="Promotional emails"
                description="Offers, new course announcements and newsletters."
              />
              <div className="set-form__actions">
                <button className="set-btn set-btn--primary" onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </section>

            <section className="set-panel">
              <div className="set-panel__header">
                <h2>Privacy</h2>
                <p>Control what other people on the platform can see.</p>
              </div>
              <Toggle
                checked={settings.profileVisible}
                onChange={toggle("profileVisible")}
                label="Public profile"
                description="Let other learners see your name and avatar."
              />
              <Toggle
                checked={settings.showProgressToOthers}
                onChange={toggle("showProgressToOthers")}
                label="Share course progress"
                description="Show your course completion on your public profile."
              />
              <div className="set-form__actions">
                <button className="set-btn set-btn--primary" onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </section>

            {isAdmin && (
              <section className="set-panel">
                <div className="set-panel__header">
                  <h2>Platform settings</h2>
                  <p>Admin-only controls for the whole platform.</p>
                </div>
                <form onSubmit={savePlatform}>
                  <div className="set-field-grid">
                    <label className="set-field">
                      <span>Site name</span>
                      <input type="text" value={platform.siteName} onChange={updatePlatform("siteName")} />
                    </label>
                    <label className="set-field">
                      <span>Support email</span>
                      <input
                        type="email"
                        value={platform.supportEmail}
                        onChange={updatePlatform("supportEmail")}
                      />
                    </label>
                  </div>
                  <Toggle
                    checked={platform.allowNewSignups}
                    onChange={() =>
                      setPlatform((p) => ({ ...p, allowNewSignups: !p.allowNewSignups }))
                    }
                    label="Allow new signups"
                    description="Turn off to temporarily stop new students from registering."
                  />
                  <Toggle
                    checked={platform.maintenanceMode}
                    onChange={() =>
                      setPlatform((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }))
                    }
                    label="Maintenance mode"
                    description="Show a maintenance page to students while you make changes."
                  />
                  <div className="set-form__actions">
                    <button className="set-btn set-btn--primary" type="submit" disabled={savingPlatform}>
                      {savingPlatform ? "Saving…" : "Save platform settings"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="set-panel set-panel--danger">
              <div className="set-panel__header">
                <h2>Danger zone</h2>
                <p>These actions are irreversible — proceed with care.</p>
              </div>
              <div className="set-danger-row" style={{ marginBottom: 16 }}>
                <div>
                  <strong>Log out</strong>
                  <p>Sign out of your account on this device.</p>
                </div>
                <button className="set-btn set-btn--ghost" onClick={handleLogout}>
                  Log out
                </button>
              </div>
              <div className="set-danger-row">
                <div>
                  <strong>Delete account</strong>
                  <p>Permanently delete your account and all associated data.</p>
                </div>
                <button className="set-btn set-btn--danger-ghost" onClick={() => setConfirmOpen(true)}>
                  Delete account
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}