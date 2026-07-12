import axios from "axios";

/* ------------------------------------------------------------------
   apiClient.js — shared axios instance for the whole app
   ------------------------------------------------------------------
   Located at: src/explore/components/pages/apiClient.js

   WHY THIS EXISTS
   Every page (Courses.js, Dashboard.js, Notifications.js, Profile.js,
   Settings.js, Students.js) currently does its own
   `axios.get(url, { headers: { Authorization: ... } })` and silently
   falls back to sample data on ANY failure — including an expired
   token. That makes a real 401 (session expired) look identical to
   "backend unreachable", which is confusing to debug.

   This client:
     1. Automatically attaches "Authorization: Bearer <token>" to
        every request (no need to build authHeaders() by hand).
     2. Intercepts 401 responses specifically, clears the stale
        token/role from localStorage, and redirects to login with a
        reason so the person knows WHY they were logged out — instead
        of quietly rendering fake sample data forever.

   HOW TO USE (since this file lives in the same pages/ folder)
   Replace `import axios from "axios";` with:
     import api from "./apiClient";
   and replace `axios.get/post/put/delete(`${API_BASE}/x`, ...)` with
   `api.get/post/put/delete("/x", ...)` — no need to pass API_BASE or
   auth headers anymore, this client already has both.

   Example (Courses.js), before:
     const res = await axios.get(`${API_BASE}/courses`, {
       headers: { Authorization: `Bearer ${token}` },
     });

   After:
     const res = await api.get("/courses");
------------------------------------------------------------------- */

// Same backend URL used across the app. Keep this the ONLY place it's
// defined once you migrate a page to apiClient, so there's no more
// risk of one file pointing at backend-qtzh and another at backend-4138.
const API_BASE = "https://course-backend-01ye.onrender.com";

const LOGIN_ROUTE = "/explore/login"; // adjust if your login route differs

const api = axios.create({
  baseURL: API_BASE,
});

// Attach the current token to every outgoing request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Distinguish "session expired" (401) from "backend unreachable" /
// other errors, and only force a logout+redirect for the former.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // Avoid redirect loops if this fires while already on the login page.
      if (window.location.pathname !== LOGIN_ROUTE) {
        window.location.href = `${LOGIN_ROUTE}?reason=expired`;
      }
    }
    // Re-throw so each page's existing try/catch (sample-data fallback
    // for network errors, etc.) still runs for every non-401 case.
    return Promise.reject(error);
  }
);

export default api;