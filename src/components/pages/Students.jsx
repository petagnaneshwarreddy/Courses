import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-01ye.onrender.com";

/* ------------------------------------------------------------------
   STUDENTS.js — Admin student directory
   ------------------------------------------------------------------
   Drop this single file into:
   src/explore/components/pages/
   (styles are included inline below — no separate CSS file needed)

   ACCESS
   Same pattern as Settings.js: localStorage "token" + "role".
   - No token -> redirected to /login
   - Non-admin (student) -> "Admins only" panel, no redirect
   - Admin -> full directory

   API (all defined in server.js already)
     GET    http://localhost:5000/students             admin only
     PUT    http://localhost:5000/students/:id          { status }
     DELETE http://localhost:5000/students/:id
   Falls back to sample data if the API isn't reachable yet, so the
   page always renders a complete, interactive preview.

   NAV
   This page renders <Nav /> itself (same as Settings.js) inside the
   `.app-shell` / `.app-main` layout that Nav.js expects — no route-level
   wrapping needed, e.g.:
     <Route path="/students" element={<Students />} />
------------------------------------------------------------------- */

const LOGIN_ROUTE = "/login";

const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

const SAMPLE_STUDENTS = [
  {
    id: "sample-1",
    name: "Asha Rao",
    email: "asha.rao@example.com",
    status: "Active",
    joinedAt: "2026-02-14",
    lastActive: "2h ago",
    certificates: 2,
    courses: [
      { id: "c1", title: "React Fundamentals", category: "Frontend", progress: 100 },
      { id: "c2", title: "Node.js APIs", category: "Backend", progress: 62 },
    ],
  },
  {
    id: "sample-2",
    name: "Marcus Lee",
    email: "marcus.lee@example.com",
    status: "Active",
    joinedAt: "2026-03-02",
    lastActive: "1d ago",
    certificates: 0,
    courses: [{ id: "c3", title: "UI Design Basics", category: "Design", progress: 18 }],
  },
  {
    id: "sample-3",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    status: "Suspended",
    joinedAt: "2025-11-20",
    lastActive: "3w ago",
    certificates: 1,
    courses: [],
  },
];

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`stu-toast stu-toast--${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function ConfirmDialog({ open, name, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="stu-overlay" onMouseDown={onCancel}>
      <div
        className="stu-confirm"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3>Remove {name}?</h3>
        <p>
          This permanently deletes their account and enrollment history. This
          can't be undone.
        </p>
        <div className="stu-confirm__actions">
          <button className="stu-btn stu-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="stu-btn stu-btn--danger" onClick={onConfirm}>
            Remove student
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`stu-badge stu-badge--${status.toLowerCase()}`}>{status}</span>;
}

function StudentsStyles() {
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

.stu-shell {
  display: flex;
  min-height: 100vh;
  background: var(--set-bg);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--set-text);
}
.stu-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.stu-page {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--set-text);
  background: var(--set-bg);
  flex: 1;
  padding: 32px 40px 64px;
  box-sizing: border-box;
}
.stu-page * { box-sizing: border-box; }

.stu-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.stu-denied h2 { font-family: "Poppins", sans-serif; font-size: 28px; margin: 0 0 8px; }
.stu-denied p { margin: 4px 0; color: var(--set-text-soft); }
.stu-denied__redirect { color: var(--set-indigo); font-weight: 600; }

.stu-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stu-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--set-indigo);
  margin: 0 0 6px;
}
.stu-header h1 {
  font-family: "Poppins", sans-serif;
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--set-navy);
}
.stu-subtitle { margin: 0; color: var(--set-text-soft); font-size: 15px; }
.stu-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--set-text-soft);
  background: var(--set-surface);
  border: 1px solid var(--set-border);
  border-radius: 999px;
  padding: 8px 16px;
  white-space: nowrap;
}

.stu-banner {
  background: #fff7e6;
  border: 1px solid #ffe1a8;
  color: #8a5a00;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  margin-bottom: 20px;
}

.stu-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.stu-search {
  flex: 1;
  min-width: 220px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  border: 1px solid var(--set-border);
  border-radius: 10px;
  padding: 10px 14px;
  outline: none;
  background: var(--set-surface);
}
.stu-search:focus { border-color: var(--set-indigo); box-shadow: 0 0 0 3px rgba(61, 125, 255, 0.15); }
.stu-filter {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--set-text);
  border: 1px solid var(--set-border);
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--set-surface);
  outline: none;
  cursor: pointer;
}

.stu-panel {
  background: var(--set-surface);
  border: 1px solid var(--set-border);
  border-radius: var(--set-radius);
  box-shadow: var(--set-shadow);
  overflow: hidden;
}

.stu-table { width: 100%; border-collapse: collapse; }
.stu-table th {
  text-align: left;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--set-text-soft);
  padding: 14px 18px;
  border-bottom: 1px solid var(--set-border);
  background: #fafbfd;
}
.stu-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--set-border);
  font-size: 13.5px;
  vertical-align: middle;
}
.stu-table tr:last-child td { border-bottom: none; }
.stu-table tr.is-expanded { background: #fafbff; }

.stu-name-cell { display: flex; flex-direction: column; }
.stu-name { font-weight: 600; color: var(--set-navy); }
.stu-email { color: var(--set-text-soft); font-size: 12.5px; }

.stu-badge {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stu-badge--active { background: #e4f9f4; color: #00806e; }
.stu-badge--inactive { background: #f0f1f6; color: #6b7280; }
.stu-badge--suspended { background: #ffe9ee; color: #c8003f; }

.stu-status-select {
  font-family: "Inter", sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid var(--set-border);
  border-radius: 8px;
  padding: 6px 8px;
  background: var(--set-surface);
  cursor: pointer;
  outline: none;
}

.stu-expand-btn {
  background: none;
  border: none;
  color: var(--set-indigo);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.stu-actions { display: flex; align-items: center; gap: 10px; }

.stu-btn {
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 13px;
  border-radius: 8px;
  padding: 8px 14px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}
.stu-btn:active { transform: translateY(1px); }
.stu-btn--ghost { background: var(--set-surface); border: 1px solid var(--set-border); color: var(--set-text); }
.stu-btn--ghost:hover { border-color: var(--set-indigo); color: var(--set-indigo); }
.stu-btn--danger { background: var(--set-danger); color: #fff; }
.stu-btn--danger-ghost { background: #fff0f3; color: var(--set-danger); border: 1px solid #ffd6df; }
.stu-btn--danger-ghost:hover { background: var(--set-danger); color: #fff; }
.stu-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.stu-courses-row td { padding: 0 18px 18px; }
.stu-courses { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.stu-course {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
}
.stu-course__title { min-width: 180px; font-weight: 600; color: var(--set-text); }
.stu-course__category { color: var(--set-text-soft); min-width: 90px; }
.stu-progress-track {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: #eef0f7;
  overflow: hidden;
}
.stu-progress-fill { height: 100%; background: linear-gradient(90deg, var(--set-indigo), var(--set-teal)); }
.stu-course__pct { width: 36px; text-align: right; color: var(--set-text-soft); }
.stu-no-courses { color: var(--set-text-soft); font-size: 12.5px; padding-top: 4px; }

.stu-empty { padding: 48px 18px; text-align: center; color: var(--set-text-soft); font-size: 14px; }

/* Overlay / confirm / toast (shared with Settings.js pattern) */
.stu-overlay {
  position: fixed; inset: 0; background: rgba(18, 22, 58, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px; backdrop-filter: blur(2px);
}
.stu-confirm {
  background: var(--set-surface); border-radius: 16px; padding: 24px;
  width: 100%; max-width: 380px; box-shadow: var(--set-shadow-lg);
}
.stu-confirm h3 { margin: 0 0 8px; font-family: "Poppins", sans-serif; }
.stu-confirm p { margin: 0 0 20px; color: var(--set-text-soft); font-size: 13.5px; }
.stu-confirm__actions { display: flex; justify-content: flex-end; gap: 10px; }

.stu-toast {
  position: fixed; bottom: 24px; right: 24px; background: var(--set-navy);
  color: #fff; padding: 12px 18px; border-radius: 10px; display: flex;
  align-items: center; gap: 14px; font-size: 13.5px; box-shadow: var(--set-shadow-lg);
  z-index: 1100;
}
.stu-toast--danger { background: var(--set-danger); }
.stu-toast button { background: transparent; border: none; color: inherit; cursor: pointer; opacity: 0.8; }

@media (max-width: 900px) {
  .stu-table thead { display: none; }
  .stu-table, .stu-table tbody, .stu-table tr, .stu-table td { display: block; width: 100%; }
  .stu-table tr { border-bottom: 1px solid var(--set-border); padding: 12px 0; }
  .stu-table td { border-bottom: none; padding: 6px 18px; }
}
@media (max-width: 640px) {
  .stu-page { padding: 20px; }
}
    `}</style>
  );
}

export default function Students() {
  const navigate = useNavigate();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [students, setStudents] = useState(SAMPLE_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [pendingId, setPendingId] = useState(null); // student whose status PUT is in flight
  const [confirmTarget, setConfirmTarget] = useState(null); // student pending delete
  const [toast, setToast] = useState(null);

  // ---- Auth check --------------------------------------------------------
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

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // ---- Load students -------------------------------------------------------
  useEffect(() => {
    if (!hasToken || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await axios.get(`${API_BASE}/students`, { headers: authHeaders() });
        if (!cancelled) setStudents(res.data);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasToken, isAdmin]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      const matchesSearch =
        !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [students, search, statusFilter]);

  const handleStatusChange = async (student, nextStatus) => {
    if (nextStatus === student.status) return;
    const prev = student.status;
    setPendingId(student.id);
    setStudents((list) =>
      list.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
    );
    try {
      await axios.put(
        `${API_BASE}/students/${student.id}`,
        { status: nextStatus },
        { headers: authHeaders() }
      );
      showToast(`${student.name}'s status set to ${nextStatus}`);
    } catch {
      setStudents((list) =>
        list.map((s) => (s.id === student.id ? { ...s, status: prev } : s))
      );
      showToast("Couldn't update status — please try again", "danger");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    const student = confirmTarget;
    setConfirmTarget(null);
    if (!student) return;
    const prevList = students;
    setStudents((list) => list.filter((s) => s.id !== student.id));
    try {
      await axios.delete(`${API_BASE}/students/${student.id}`, { headers: authHeaders() });
      showToast(`${student.name} was removed`);
    } catch {
      setStudents(prevList);
      showToast("Couldn't remove this student — please try again", "danger");
    }
  };

  // ---- Guard states -----------------------------------------------------
  if (!authChecked) {
    return (
      <div className="app-shell stu-shell">
        <StudentsStyles />
        <div className="app-main stu-main">
          <div className="stu-page stu-page--centered">Checking access…</div>
        </div>
      </div>
    );
  }
  if (!hasToken) {
    return (
      <div className="app-shell stu-shell">
        <StudentsStyles />
        <div className="app-main stu-main">
          <div className="stu-page stu-page--centered">
            <div className="stu-denied">
              <h2>Please log in</h2>
              <p>You need to be logged in to view students.</p>
              <p className="stu-denied__redirect">Redirecting you to login…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="app-shell stu-shell">
        <StudentsStyles />
        <Nav />
        <div className="app-main stu-main">
          <div className="stu-page stu-page--centered">
            <div className="stu-denied">
              <h2>Admins only</h2>
              <p>The student directory is only visible to admin accounts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell stu-shell">
      <StudentsStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        name={confirmTarget?.name || "this student"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      <Nav />

      <div className="app-main stu-main">
        <div className="stu-page">
          <header className="stu-header">
            <div>
              <p className="stu-eyebrow">Directory</p>
              <h1>Students</h1>
              <p className="stu-subtitle">View enrollment, progress and account status.</p>
            </div>
            <span className="stu-count">
              {filtered.length} of {students.length} student{students.length === 1 ? "" : "s"}
            </span>
          </header>

          {loadError && (
            <div className="stu-banner">
              Couldn't reach the students API — showing sample data so you can
              preview the page. Connect your backend to see live data.
            </div>
          )}

          <div className="stu-toolbar">
            <input
              className="stu-search"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="stu-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="stu-panel">
            {loading ? (
              <div className="stu-empty">Loading students…</div>
            ) : filtered.length === 0 ? (
              <div className="stu-empty">No students match your search.</div>
            ) : (
              <table className="stu-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last active</th>
                    <th>Certificates</th>
                    <th>Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const isExpanded = expandedId === s.id;
                    return (
                      <React.Fragment key={s.id}>
                        <tr className={isExpanded ? "is-expanded" : ""}>
                          <td>
                            <div className="stu-name-cell">
                              <span className="stu-name">{s.name}</span>
                              <span className="stu-email">{s.email}</span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={s.status} />
                          </td>
                          <td>{s.joinedAt}</td>
                          <td>{s.lastActive}</td>
                          <td>{s.certificates}</td>
                          <td>
                            <button
                              className="stu-expand-btn"
                              onClick={() => setExpandedId(isExpanded ? null : s.id)}
                            >
                              {s.courses.length} course{s.courses.length === 1 ? "" : "s"}
                              {" "}
                              {isExpanded ? "▲" : "▼"}
                            </button>
                          </td>
                          <td>
                            <div className="stu-actions">
                              <select
                                className="stu-status-select"
                                value={s.status}
                                disabled={pendingId === s.id}
                                onChange={(e) => handleStatusChange(s, e.target.value)}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="stu-btn stu-btn--danger-ghost"
                                onClick={() => setConfirmTarget(s)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="stu-courses-row">
                            <td colSpan={7}>
                              {s.courses.length === 0 ? (
                                <p className="stu-no-courses">Not enrolled in any courses yet.</p>
                              ) : (
                                <div className="stu-courses">
                                  {s.courses.map((c) => (
                                    <div className="stu-course" key={c.id}>
                                      <span className="stu-course__title">{c.title}</span>
                                      <span className="stu-course__category">{c.category}</span>
                                      <span className="stu-progress-track">
                                        <span
                                          className="stu-progress-fill"
                                          style={{ width: `${c.progress}%` }}
                                        />
                                      </span>
                                      <span className="stu-course__pct">{c.progress}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}