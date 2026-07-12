import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "http://localhost:5000";

/* ------------------------------------------------------------------
   PaymentRequests.jsx  —  Admin-only screen for reviewing the
   screenshot submissions students send from the "Screenshot" method
   on Payment.jsx.

   Route: /payment-requests  (registered in App.js — see bottom)

   Backed by (server.js):
     GET /payment-requests?status=Pending|Approved|Declined|all
     PUT /payment-requests/:id  { decision: "approve" | "decline" }

   Approve calls the same enroll logic as POST /courses/:id/enroll on
   the backend and grants the student access. Decline grants no
   access; the student can resubmit a fresh screenshot from checkout.
   ------------------------------------------------------------------ */

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

function timeAgo(date) {
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const TABS = [
  { key: "Pending", label: "Pending" },
  { key: "Approved", label: "Approved" },
  { key: "Declined", label: "Declined" },
  { key: "all", label: "All" },
];

const Icon = {
  Image: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <rect x="3" y="3.5" width="14" height="13" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7.2" cy="7.5" r="1.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 14.5 8 10l2.4 2.4L14 8.5l3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M4.5 10.3 8 13.8l7.5-8.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="17" height="17" {...p}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4.3l2.6 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`pr-toast pr-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <Icon.Close />
      </button>
    </div>
  );
}

function ConfirmDialog({ open, title, body, confirmLabel, tone, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="pr-overlay" onMouseDown={onCancel}>
      <div className="pr-confirm" role="alertdialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="pr-confirm__actions">
          <button className="pr-btn pr-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className={`pr-btn ${tone === "danger" ? "pr-btn--danger" : "pr-btn--success"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="pr-overlay pr-overlay--lightbox" onMouseDown={onClose}>
      <button className="pr-lightbox__close" onClick={onClose} aria-label="Close">
        <Icon.Close />
      </button>
      <img src={src} alt="Payment screenshot" onMouseDown={(e) => e.stopPropagation()} />
    </div>
  );
}

function PaymentRequestsStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");

.pr-page {
  --pr-ink: #0f172a;
  --pr-accent: #2451cc;
  --pr-teal: #0f9488;
  --pr-amber: #b45309;
  --pr-danger: #c0293f;
  --pr-danger-dark: #a01f33;
  --pr-bg: #f5f6f9;
  --pr-surface: #ffffff;
  --pr-border: #e2e5ec;
  --pr-border-strong: #cfd4de;
  --pr-text: #10151f;
  --pr-text-soft: #5b6472;
  --pr-text-faint: #8a92a1;
  --pr-radius: 10px;
  --pr-radius-lg: 14px;
  --pr-shadow: 0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03);
  --pr-shadow-lg: 0 24px 48px -12px rgba(15,23,42,.22);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--pr-text);
  background: var(--pr-bg);
  min-height: 100%;
  padding: 32px 40px 64px;
  box-sizing: border-box;
}
.pr-page * { box-sizing: border-box; }

.pr-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: var(--pr-text-soft);
}
.pr-denied h2 { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: var(--pr-ink); }
.pr-denied p { margin: 4px 0; color: var(--pr-text-soft); font-size: 14px; }

.pr-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--pr-border);
}
.pr-eyebrow {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--pr-accent);
  margin: 0 0 8px;
}
.pr-header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 6px; color: var(--pr-ink); }
.pr-subtitle { margin: 0; color: var(--pr-text-soft); font-size: 14px; }

.pr-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--pr-border);
}
.pr-tabs button {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0 2px 12px;
  margin-bottom: -1px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--pr-text-faint);
  cursor: pointer;
}
.pr-tabs button.is-active { color: var(--pr-ink); border-bottom-color: var(--pr-ink); }
.pr-tabs button .pr-count {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  background: #eef1f8;
  color: var(--pr-accent);
  border-radius: 999px;
  padding: 1px 7px;
}
.pr-tabs button.is-active .pr-count { background: var(--pr-ink); color: #fff; }

.pr-banner {
  background: #fbecee;
  border: 1px solid #eec6cc;
  color: #93202f;
  padding: 11px 16px;
  border-radius: var(--pr-radius);
  font-size: 13.5px;
  margin-bottom: 20px;
}

.pr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.pr-card {
  background: var(--pr-surface);
  border: 1px solid var(--pr-border);
  border-radius: var(--pr-radius-lg);
  overflow: hidden;
  box-shadow: var(--pr-shadow);
  display: flex;
  flex-direction: column;
}

.pr-card--skeleton {
  height: 300px;
  background: linear-gradient(90deg, #ecedf2 25%, #f5f6f9 37%, #ecedf2 63%);
  background-size: 400% 100%;
  animation: pr-shimmer 1.4s ease infinite;
}
@keyframes pr-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

.pr-card__shot {
  height: 150px;
  background: #eef0f4;
  background-size: cover;
  background-position: top center;
  cursor: zoom-in;
  position: relative;
}
.pr-card__shot::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15,23,42,.35), transparent 45%);
}
.pr-card__zoom {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(15,23,42,.72);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 999px;
  z-index: 1;
}

.pr-card__body { padding: 14px 16px 4px; flex: 1; }

.pr-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.pr-card__student {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pr-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--pr-ink);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pr-card__student-text { min-width: 0; }
.pr-card__student-text strong {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--pr-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pr-card__student-text span {
  display: block;
  font-size: 11.5px;
  color: var(--pr-text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pr-status {
  flex-shrink: 0;
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pr-status--pending { background: #fdf0e3; color: var(--pr-amber); }
.pr-status--approved { background: #e3f5ee; color: #0d7a49; }
.pr-status--declined { background: #fbecee; color: var(--pr-danger); }

.pr-card__course {
  font-size: 14px;
  font-weight: 700;
  color: var(--pr-ink);
  margin: 0 0 4px;
  line-height: 1.35;
}

.pr-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--pr-text-soft);
  margin-bottom: 12px;
}
.pr-card__meta svg { color: var(--pr-text-faint); }
.pr-dot { opacity: .5; }

.pr-card__amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--pr-border);
  padding: 11px 0;
  margin-bottom: 4px;
  font-size: 12.5px;
  color: var(--pr-text-soft);
}
.pr-card__amount strong {
  font-family: "IBM Plex Mono", monospace;
  font-size: 16px;
  color: var(--pr-ink);
}

.pr-card__actions { display: flex; gap: 8px; padding: 12px 16px 16px; }
.pr-card__actions .pr-btn { flex: 1; }

.pr-card__reviewed {
  padding: 12px 16px 16px;
  font-size: 12px;
  color: var(--pr-text-faint);
}

.pr-btn {
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  padding: 9px 14px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background .12s ease, border-color .12s ease;
}
.pr-btn:disabled { opacity: .55; cursor: not-allowed; }
.pr-btn--success { background: var(--pr-teal); color: #fff; }
.pr-btn--success:hover:not(:disabled) { background: #0b7d72; }
.pr-btn--danger { background: var(--pr-danger); color: #fff; }
.pr-btn--danger:hover:not(:disabled) { background: var(--pr-danger-dark); }
.pr-btn--ghost { background: var(--pr-surface); border: 1px solid var(--pr-border-strong); color: var(--pr-text); }
.pr-btn--ghost:hover:not(:disabled) { border-color: var(--pr-ink); }

.pr-empty {
  text-align: center;
  padding: 64px 24px;
  background: var(--pr-surface);
  border: 1px dashed var(--pr-border-strong);
  border-radius: var(--pr-radius-lg);
}
.pr-empty h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; color: var(--pr-ink); }
.pr-empty p { color: var(--pr-text-soft); margin: 0; font-size: 13.5px; }

.pr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}
.pr-overlay--lightbox { background: rgba(9,12,20,.88); padding: 40px; }
.pr-overlay--lightbox img {
  max-width: 100%;
  max-height: 85vh;
  border-radius: 10px;
  box-shadow: var(--pr-shadow-lg);
}
.pr-lightbox__close {
  position: absolute;
  top: 22px;
  right: 26px;
  background: rgba(255,255,255,.12);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pr-confirm {
  background: var(--pr-surface);
  border-radius: 14px;
  padding: 22px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--pr-shadow-lg);
}
.pr-confirm h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: var(--pr-ink); }
.pr-confirm p { margin: 0 0 20px; color: var(--pr-text-soft); font-size: 13.5px; line-height: 1.5; }
.pr-confirm__actions { display: flex; justify-content: flex-end; gap: 10px; }

.pr-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--pr-ink);
  color: #fff;
  padding: 12px 16px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--pr-shadow-lg);
  z-index: 1100;
}
.pr-toast--danger { background: var(--pr-danger); }
.pr-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: .75; display: flex; align-items: center; }
.pr-toast button:hover { opacity: 1; }

.app-shell { display: flex; align-items: stretch; min-height: 100vh; }
.app-main { flex: 1; min-width: 0; }

@media (max-width: 600px) {
  .pr-page { padding: 20px; }
  .pr-header { align-items: flex-start; }
}
    `}</style>
  );
}

export default function PaymentRequests() {
  const navigate = useNavigate();
  const LOGIN_ROUTE = "/login";

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [tab, setTab] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [actingId, setActingId] = useState(null); // request currently being approved/declined
  const [pendingDecline, setPendingDecline] = useState(null); // request awaiting decline confirmation
  const [lightbox, setLightbox] = useState(null); // screenshot src to show full-size
  const [toast, setToast] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const showToast = (message, type = "success") => setToast({ message, type });

  // ---- Auth check (mirrors Courses.js: role is always re-verified via
  // /me rather than trusted from localStorage) ----
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHasToken(false);
      setAuthChecked(true);
      const t = setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        setHasToken(true);
        setIsAdmin((res.data.role || "").toLowerCase() === "admin");
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        setHasToken(false);
        setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const loadRequests = async (status) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await axios.get(`${API_BASE}/payment-requests`, {
        headers: authHeaders(),
        params: { status },
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRequests([]);
      setLoadError(err.response?.data?.message || "Couldn't reach the payment requests API. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasToken || !isAdmin) return;
    loadRequests(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, isAdmin, tab]);

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Declined: 0 };
    requests.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
    });
    return c;
  }, [requests]);

  const review = async (request, decision) => {
    setActingId(request.id);
    try {
      await axios.put(
        `${API_BASE}/payment-requests/${request.id}`,
        { decision },
        { headers: authHeaders() }
      );

      if (tab === "all") {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id ? { ...r, status: decision === "approve" ? "Approved" : "Declined" } : r
          )
        );
      } else {
        // Currently viewing a single-status tab — the item no longer
        // belongs here once reviewed, so drop it from the list.
        setRequests((prev) => prev.filter((r) => r.id !== request.id));
      }

      showToast(
        decision === "approve"
          ? `Approved — ${request.student.name} now has access to "${request.course.title}"`
          : `Declined — ${request.student.name} was notified`,
        decision === "approve" ? "success" : "danger"
      );
    } catch (err) {
      const msg =
        err.response?.status === 409
          ? err.response.data?.message
          : err.response?.data?.message || "Failed to update this request.";
      showToast(msg, "danger");
      // Refresh so the list reflects reality if it drifted (e.g. someone
      // else already reviewed this one).
      loadRequests(tab);
    } finally {
      setActingId(null);
    }
  };

  const confirmDecline = () => {
    const request = pendingDecline;
    setPendingDecline(null);
    review(request, "decline");
  };

  // ---- Guard states ----
  if (!authChecked) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="pr-page pr-page--centered">
            <PaymentRequestsStyles />
            Checking access…
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
          <div className="pr-page pr-page--centered">
            <PaymentRequestsStyles />
            <div className="pr-denied">
              <h2>Please log in</h2>
              <p>Redirecting you to login…</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="pr-page pr-page--centered">
            <PaymentRequestsStyles />
            <div className="pr-denied">
              <h2>Admin access required</h2>
              <p>This page is only available to admins.</p>
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
        <div className="pr-page">
          <PaymentRequestsStyles />
          <Toast toast={toast} onClose={() => setToast(null)} />
          <Lightbox src={lightbox} onClose={() => setLightbox(null)} />

          <ConfirmDialog
            open={!!pendingDecline}
            title="Decline this payment?"
            body={
              pendingDecline
                ? `${pendingDecline.student.name} will not get access to "${pendingDecline.course.title}", and will be notified they can try again.`
                : ""
            }
            confirmLabel="Decline"
            tone="danger"
            onConfirm={confirmDecline}
            onCancel={() => setPendingDecline(null)}
          />

          <header className="pr-header">
            <div>
              <p className="pr-eyebrow">Admin · Manual payments</p>
              <h1>Payment requests</h1>
              <p className="pr-subtitle">
                Review payment screenshots students have submitted and approve or decline enrollment.
              </p>
            </div>
          </header>

          {loadError && (
            <div className="pr-banner">
              {loadError}{" "}
              <button className="pr-btn pr-btn--ghost" style={{ marginLeft: 8 }} onClick={() => loadRequests(tab)}>
                Retry
              </button>
            </div>
          )}

          <nav className="pr-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "is-active" : ""}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key !== "all" && tab === t.key && requests.length > 0 && (
                  <span className="pr-count">{requests.length}</span>
                )}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="pr-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="pr-card pr-card--skeleton" key={i} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="pr-empty">
              <h3>{loadError ? "Couldn't load payment requests" : `No ${tab === "all" ? "" : tab.toLowerCase()} requests`}</h3>
              <p>
                {loadError
                  ? "Check your connection and try again."
                  : tab === "Pending"
                  ? "You're all caught up — new screenshot submissions will show up here."
                  : "Nothing to show for this filter yet."}
              </p>
            </div>
          ) : (
            <section className="pr-grid">
              {requests.map((r) => (
                <article className="pr-card" key={r.id}>
                  <div
                    className="pr-card__shot"
                    style={{ backgroundImage: `url(${r.screenshot})` }}
                    onClick={() => setLightbox(r.screenshot)}
                  >
                    <span className="pr-card__zoom">
                      <Icon.Image /> View full size
                    </span>
                  </div>

                  <div className="pr-card__body">
                    <div className="pr-card__top">
                      <div className="pr-card__student">
                        <span className="pr-avatar">{initials(r.student.name)}</span>
                        <span className="pr-card__student-text">
                          <strong>{r.student.name}</strong>
                          <span>{r.student.email}</span>
                        </span>
                      </div>
                      <span className={`pr-status pr-status--${r.status.toLowerCase()}`}>{r.status}</span>
                    </div>

                    <h3 className="pr-card__course">{r.course.title}</h3>
                    <div className="pr-card__meta">
                      <Icon.Clock /> Submitted {timeAgo(r.submittedAt)}
                    </div>

                    <div className="pr-card__amount">
                      <span>Amount claimed</span>
                      <strong>{currency(r.amount)}</strong>
                    </div>
                  </div>

                  {r.status === "Pending" ? (
                    <div className="pr-card__actions">
                      <button
                        className="pr-btn pr-btn--danger"
                        disabled={actingId === r.id}
                        onClick={() => setPendingDecline(r)}
                      >
                        <Icon.X /> Decline
                      </button>
                      <button
                        className="pr-btn pr-btn--success"
                        disabled={actingId === r.id}
                        onClick={() => review(r, "approve")}
                      >
                        <Icon.Check /> {actingId === r.id ? "Approving…" : "Approve"}
                      </button>
                    </div>
                  ) : (
                    <div className="pr-card__reviewed">
                      {r.status === "Approved" ? "Payment received — student was enrolled." : "Marked as payment not received."}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------
   Add this route wherever your other admin routes are declared
   (App.js), and a Nav link so admins can find it (e.g. next to
   "Invite" in Nav.js):

     import PaymentRequests from "./PaymentRequests";
     ...
     <Route path="/payment-requests" element={<PaymentRequests />} />
   ------------------------------------------------------------------ */