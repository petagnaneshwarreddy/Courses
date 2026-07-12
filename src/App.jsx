import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./components/pages/Landing";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import ForgotPassword from "./components/pages/ForgotPassword";

import Courses from "./components/pages/Courses";
import CourseDetail from "./components/pages/Coursedetail";
import Content from "./components/pages/Content";
import Certificate from "./components/pages/Certificate";
import Payment from "./components/pages/Payment";

import Dashboard from "./components/pages/Dashboard";
import Students from "./components/pages/Students";
import Profile from "./components/pages/Profile";
import Settings from "./components/pages/Settings";
import Notifications from "./components/pages/Notifications";
import Invite from "./components/pages/Invite";
import Paymentrequests from "./components/pages/Paymentrequests";

// =========================
// Admin Protected Route
// =========================
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/courses" replace />;

  return children;
}

// =========================
// User Protected Route
// =========================
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student */}
      <Route
        path="/courses"
        element={
          <PrivateRoute>
            <Courses />
          </PrivateRoute>
        }
      />

      {/* Course landing page — shows details, syllabus, "Start for Free" / "Continue Learning" */}
      <Route
        path="/courses/:id"
        element={
          <PrivateRoute>
            <CourseDetail />
          </PrivateRoute>
        }
      />

      {/* Course player — chapters, video, notes, code, practice quiz */}
      <Route
        path="/courses/:id/learn"
        element={
          <PrivateRoute>
            <Content />
          </PrivateRoute>
        }
      />

      {/* Legacy alias, kept for any existing links pointing at /content/:id */}
      <Route
        path="/content/:id"
        element={
          <PrivateRoute>
            <Content />
          </PrivateRoute>
        }
      />

      {/* Certificate — confirm details, then view/download */}
      <Route
        path="/certificate/:id"
        element={
          <PrivateRoute>
            <Certificate />
          </PrivateRoute>
        }
      />

      <Route
        path="/payment/:id"
        element={
          <PrivateRoute>
            <Payment />
          </PrivateRoute>
        }
      />

      <Route
        path="/students"
        element={
          <PrivateRoute>
            <Students />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/invite"
        element={
          <AdminRoute>
            <Invite />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/payment-requests"
        element={
          <AdminRoute>
            <Paymentrequests />
          </AdminRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;