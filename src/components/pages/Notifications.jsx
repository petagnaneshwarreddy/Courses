import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-0lye.onrender.com";

/* ------------------------------------------------------------------
   NOTIFICATIONS.js — Notification center
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as the rest of the app: localStorage "token" + "role".
   - No token -> redirected to /login
   - Any logged-in user (student or admin) sees their own notification
     feed — content differs based on what the backend returns.

   API
     GET    https://backend-qtzh.onrender.com/notifications
     PUT    https://backend-qtzh.onrender.com/notifications/:id        { read: true }
     PUT    https://backend-qtzh.onrender.com/notifications/mark-all-read
     DELETE https://backend-qtzh.onrender.com/notifications/:id
   Falls back to sample data if the API isn't reachable yet, so the
   page always renders a complete, interactive preview.

   NAV
   This page renders <Nav /> itself (same as Students.js / Settings.js /
   Profile.js) inside the `.app-shell` / `.app-main` layout that Nav.js
   expects — no route-level wrapping needed, e.g.:
     <Route path="/notifications" element={<Notifications />} />
   The <Nav /> bell icon links straight here.
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/login";

const SAMPLE_NOTIFICATIONS = [
  {
    id: "n1",
    type: "enroll",
    title: "You're enrolled",
    text: "You successfully enrolled in \"UI Design Systems\".",
    time: "2h ago",
    read: false,
    link: "/course",
  },
  {
    id: "n2",
    type: "progress",
    title: "Module completed",
    text: "You completed Module 3 of \"React for Production Teams\".",
    time: "5h ago",
    read: false,
    link: "/course",
  },
  {
    id: "n3",
    type: "cert",
    title: "Certificate earned",
    text: "You earned a certificate in \"HTML & CSS Basics\". Nice work!",
    time: "1d ago",
    read: true,
    link: "/profile",
  },
  {
    id: "n4",
    type: "publish",
    title: "New course published",
    text: "\"AWS Cloud Practitioner\" is now live on the platform.",
    time: "2d ago",
    read: true,
    link: "/course",
  },
  {
    id: "n5",
    type: "review",
    title: "New review",
    text: "Your course \"Ethical Hacking Fundamentals\" received a 5★ review.",
    time: "3d ago",
    read: true,
    link: "/course",
  },
  {
    id: "n6",
    type: "system",
    title: "Password changed",
    text: "Your account password was changed successfully.",
    time: "6d ago",
    read: true,
    link: "/settings",
  },
];

const TYPE_ICON = {
  enroll: "🎓",
  progress: "📘",
  cert: "🏅",
  publish: "🚀",
  review: "⭐",
  signup: "👤",
  system: "🔔",
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`ntf-toast ntf-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function NotificationsStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap");

:root {
  --ntf-navy: #12163a;
  --ntf-indigo: #3d7dff;
  --ntf-teal: #00c2a8;
  --ntf-amber: #ffb020;
  --ntf-danger: #ff5c7a;
  --ntf-bg: #f6f7fb;
  --ntf-surface: #ffffff;
  --ntf-border: #e6e8f0;
  --ntf-text: #1f2430;
  --ntf-text-soft: #6b7280;
  --ntf-radius: 16px;
  --ntf-shadow: 0 8px 24px rgba(18, 22, 58, 0.06);
  --ntf-shadow-lg: 0 20px 45px rgba(18, 22, 58, 0.16);
}

/* ---------- Shell layout (Nav renders its own sidebar; .app-shell /
   .app-main below give it the offset — see Nav.js docblock) ---------- */
.ntf-shell {
  display: flex;
  min-height: 100vh;
  background: var(--ntf-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ntf-text);
}

.ntf-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ntf-page {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ntf-text);
  background: var(--ntf-bg);
  flex: 1;
  padding: 32px 40px 64px;
  box-sizing: border-box;
}
.ntf-page * { box-sizing: border-box; }

.ntf-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.ntf-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.ntf-denied p { margin: 4px 0; color: var(--ntf-text-soft); }
.ntf-denied__redirect { color: var(--ntf-indigo); font-weight: 600; }

.ntf-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.ntf-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ntf-indigo);
  margin: 0 0 6px;
}
.ntf-header h1 {
  font-family: "Poppins", sans-serif;
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--ntf-navy);
  display: flex;
  align-items: center;
  gap: 12px;
}
.ntf-unread-pill {
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 700;
  background: #eaf0ff;
  color: var(--ntf-indigo);
  padding: 4px 12px;
  border-radius: 999px;
}
.ntf-subtitle { margin: 0; color: var(--ntf-text-soft); font-size: 15px; }

.ntf-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.ntf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.ntf-filters { display: flex; gap: 8px; }
.ntf-filter {
  border: 1px solid var(--ntf-border);
  background: var(--ntf-surface);
  color: var(--ntf-text-soft);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
}
.ntf-filter.is-active { background: var(--ntf-navy); color: #fff; border-color: var(--ntf-navy); }

.ntf-btn {
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 13.5px;
  border-radius: 10px;
  padding: 9px 16px;
  border: 1px solid var(--ntf-border);
  background: var(--ntf-surface);
  color: var(--ntf-text);
  cursor: pointer;
}
.ntf-btn:hover { border-color: var(--ntf-indigo); color: var(--ntf-indigo); }
.ntf-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ntf-list {
  background: var(--ntf-surface);
  border: 1px solid var(--ntf-border);
  border-radius: var(--ntf-radius);
  box-shadow: var(--ntf-shadow);
  overflow: hidden;
}

.ntf-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ntf-border);
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: background 0.15s ease;
}
.ntf-item:last-child { border-bottom: none; }
.ntf-item:hover { background: #fafbfe; }
.ntf-item--unread { background: #f6f9ff; }
.ntf-item--unread:hover { background: #eef4ff; }

.ntf-item__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #eef1f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.ntf-item__body { flex: 1; min-width: 0; }
.ntf-item__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ntf-navy);
  margin: 0 0 3px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ntf-item__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ntf-indigo);
  flex-shrink: 0;
}
.ntf-item__text {
  margin: 0;
  font-size: 13.5px;
  color: var(--ntf-text-soft);
  line-height: 1.5;
}
.ntf-item__time {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--ntf-text-soft);
  opacity: 0.8;
}

.ntf-item__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.ntf-icon-btn {
  background: transparent;
  border: 1px solid var(--ntf-border);
  border-radius: 8px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ntf-text-soft);
}
.ntf-icon-btn:hover { border-color: var(--ntf-indigo); color: var(--ntf-indigo); }
.ntf-icon-btn--danger:hover { border-color: var(--ntf-danger); color: var(--ntf-danger); }

.ntf-skeleton {
  height: 74px;
  background: linear-gradient(90deg, #eef0f6 25%, #f6f7fb 37%, #eef0f6 63%);
  background-size: 400% 100%;
  animation: ntf-shimmer 1.4s ease infinite;
  border-bottom: 1px solid var(--ntf-border);
}
@keyframes ntf-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.ntf-empty {
  text-align: center;
  padding: 64px 24px;
  background: var(--ntf-surface);
  border: 1px dashed var(--ntf-border);
  border-radius: var(--ntf-radius);
}
.ntf-empty h3 { font-family: "Poppins", sans-serif; margin: 0 0 6px; }
.ntf-empty p { color: var(--ntf-text-soft); margin: 0; }

.ntf-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--ntf-navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13.5px;
  box-shadow: var(--ntf-shadow-lg);
  z-index: 1100;
}
.ntf-toast--danger { background: var(--ntf-danger); }
.ntf-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.8; }

@media (max-width: 640px) {
  .ntf-page { padding: 20px; }
  .ntf-header { align-items: flex-start; }
  .ntf-item { padding: 14px 16px; }
}
    `}</style>
  );
}

export default function Notifications() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState("all"); // all | unread
  const [toast, setToast] = useState(null);

  // ---- Auth check --------------------------------------------------------
  // NOTE: this only gates access to the page's data/UI. <Nav /> below does
  // its own independent read of localStorage to decide what to render —
  // see Nav.js for why that's a UI convenience, not real authorization.
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

  // ---- Load notifications --------------------------------------------------
  useEffect(() => {
    if (!hasToken) return;
    const token = localStorage.getItem("token");
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await axios.get(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        if (!cancelled) setItems(Array.isArray(data) ? data : data.notifications || []);
      } catch {
        if (!cancelled) {
          setItems(SAMPLE_NOTIFICATIONS);
          setLoadError(true);
        }
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

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter]
  );

  const markRead = async (notif) => {
    if (notif.read) return;
    setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    try {
      await axios.put(
        `${API_BASE}/notifications/${notif.id}`,
        { read: true },
        { headers: authHeaders() }
      );
    } catch {
      /* already updated locally, ignore network error */
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await axios.put(`${API_BASE}/notifications/mark-all-read`, {}, { headers: authHeaders() });
    } catch {
      /* already updated locally, ignore network error */
    }
    showToast("All notifications marked as read");
  };

  const removeNotification = async (notif, e) => {
    e.preventDefault();
    e.stopPropagation();
    setItems((prev) => prev.filter((n) => n.id !== notif.id));
    try {
      await axios.delete(`${API_BASE}/notifications/${notif.id}`, {
        headers: authHeaders(),
      });
    } catch {
      /* ignore network error, still removed locally */
    }
    showToast("Notification removed");
  };

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell ntf-shell">
        <NotificationsStyles />
        <div className="app-main ntf-main">
          <div className="ntf-page ntf-page--centered">Checking access…</div>
        </div>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell ntf-shell">
        <NotificationsStyles />
        <div className="app-main ntf-main">
          <div className="ntf-page ntf-page--centered">
            <div className="ntf-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view notifications.</p>
              <p className="ntf-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell ntf-shell">
      <NotificationsStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Nav />

      <div className="app-main ntf-main">
        <div className="ntf-page">
          <header className="ntf-header">
            <div>
              <p className="ntf-eyebrow">Account</p>
              <h1>
                Notifications
                {unreadCount > 0 && <span className="ntf-unread-pill">{unreadCount} new</span>}
              </h1>
              <p className="ntf-subtitle">Everything that's happened on your account, in one place.</p>
            </div>
            <button className="ntf-btn" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all as read
            </button>
          </header>

          {loadError && (
            <div className="ntf-banner">
              Couldn't reach the notifications API — showing sample data so you
              can preview the page. Connect your backend to see live data.
            </div>
          )}

          <section className="ntf-toolbar">
            <div className="ntf-filters">
              <button
                className={`ntf-filter ${filter === "all" ? "is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`ntf-filter ${filter === "unread" ? "is-active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                Unread
              </button>
            </div>
          </section>

          {loading ? (
            <div className="ntf-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="ntf-skeleton" key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="ntf-empty">
              <h3>{filter === "unread" ? "You're all caught up" : "No notifications yet"}</h3>
              <p>
                {filter === "unread"
                  ? "There's nothing new to review right now."
                  : "We'll let you know when something happens."}
              </p>
            </div>
          ) : (
            <section className="ntf-list">
              {visible.map((notif) => (
                <Link
                  key={notif.id}
                  to={notif.link || "#"}
                  className={`ntf-item ${!notif.read ? "ntf-item--unread" : ""}`}
                  onClick={() => markRead(notif)}
                >
                  <span className="ntf-item__icon">{TYPE_ICON[notif.type] || "🔔"}</span>
                  <div className="ntf-item__body">
                    <p className="ntf-item__title">
                      {!notif.read && <span className="ntf-item__dot" />}
                      {notif.title}
                    </p>
                    <p className="ntf-item__text">{notif.text}</p>
                    <div className="ntf-item__time">{notif.time}</div>
                  </div>
                  <div className="ntf-item__actions">
                    <button
                      className="ntf-icon-btn ntf-icon-btn--danger"
                      onClick={(e) => removeNotification(notif, e)}
                      aria-label="Remove notification"
                    >
                      🗑
                    </button>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}