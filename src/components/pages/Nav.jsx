import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Nav.css";

/**
 * ---------------------------------------------------------------------------
 * Nav — Shared left sidebar navigation panel
 * ---------------------------------------------------------------------------
 * Usage
 * -----
 * Render at the top of any authenticated page (Dashboard, Courses, Students,
 * Notifications, Settings, AdminCreateStudent, ...), wrapping the page in a
 * flex layout so content sits beside the panel:
 *
 *   import Nav from "../Nav";
 *
 *   export default function Dashboard() {
 *     return (
 *       <div className="app-shell">
 *         <Nav />
 *         <main className="app-main">
 *           <div className="dsh-page">...page content...</div>
 *         </main>
 *       </div>
 *     );
 *   }
 *
 * The `.app-shell` / `.app-main` classes (see Nav.css) handle the sidebar
 * offset and are shared across every page that renders <Nav />.
 *
 * Authentication
 * --------------
 * Reads `token` and `role` from localStorage, same as every other page.
 *   - Renders nothing if there is no token.
 *   - Shows "Students" and "Invite student" only when role === "admin".
 *   - Highlights the active route via useLocation.
 *   - Logging out clears `token` and `role`, then redirects to /login.
 *
 * IMPORTANT — this component only controls *UI visibility*. Hiding
 * admin-only links when role !== "admin" is a convenience, not access
 * control: localStorage is fully editable from devtools. The /students and
 * /Admincreatestudent routes (and any API they call) MUST enforce their own
 * server-side / route-level authorization regardless of what this component
 * renders.
 *
 * Collapse / close behavior
 * --------------------------
 *   - Desktop: a chevron toggle collapses the panel to an icon-only rail.
 *     State persists in localStorage under `nav-collapsed` so it survives
 *     navigation and reloads. This is desktop-only — the mobile drawer
 *     always opens expanded regardless of the stored desktop collapse
 *     state (see the `.is-collapsed` media-query gating in Nav.css).
 *   - Mobile (<900px): the panel becomes an off-canvas drawer, opened via
 *     the top-left burger button and closed via the close button, the
 *     dimmed overlay, the Escape key, or navigating to a new route.
 * ---------------------------------------------------------------------------
 */

const LOGIN_ROUTE = "/login";

const ROUTES = Object.freeze({
  // "Dashboard" resolves to one of these two depending on role — admins
  // land on the admin dashboard, students land on the student Home page.
  adminDashboard: "/admin/dashboard",
  home: "/home",
  courses: "/courses",
  students: "/students",
  inviteStudent: "/admin/invite",
  paymentRequests: "/admin/payment-requests",

  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
});

const STORAGE_KEYS = Object.freeze({
  token: "token",
  role: "role",
  collapsed: "nav-collapsed",
});

/**
 * Derives a 1–2 letter avatar label from a display name or email address.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const [single] = words;
  const segments = single.split(/[@._-]/).filter(Boolean);
  if (segments.length > 1) {
    return (segments[0][0] + segments[1][0]).toUpperCase();
  }

  return single.slice(0, 2).toUpperCase();
}

/**
 * Best-effort decode of a JWT payload. Returns null on any malformed input
 * rather than throwing, since this is used purely for display (name/role
 * fallbacks), never for trust decisions.
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/* -----------------------------------------------------------------------
 * Icons — lightweight inline SVGs (stroke-based, inherit currentColor)
 * ---------------------------------------------------------------------*/

const ICON_PROPS = {
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const HomeIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </svg>
);

const BookIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
  </svg>
);

const GradCapIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="m2 9 10-5 10 5-10 5-10-5Z" />
    <path d="M6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5" />
    <path d="M21 9v6" />
  </svg>
);

const UserPlusIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
    <path d="M18 8.5v5" />
    <path d="M15.5 11h5" />
  </svg>
);
const PaymentIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h4" />
  </svg>
);


const BellIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7Z" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </svg>
);

const UserIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5" />
  </svg>
);

const GearIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.9 7.9 0 0 0 0-3l1.9-1.5-2-3.4-2.2.6a7.9 7.9 0 0 0-2.6-1.5L14 2h-4l-.5 2.2a7.9 7.9 0 0 0-2.6 1.5l-2.2-.6-2 3.4L4.6 10.5a7.9 7.9 0 0 0 0 3l-1.9 1.5 2 3.4 2.2-.6a7.9 7.9 0 0 0 2.6 1.5L10 22h4l.5-2.2a7.9 7.9 0 0 0 2.6-1.5l2.2.6 2-3.4-1.9-1.5Z" />
  </svg>
);

const LogOutIcon = () => (
  <svg {...ICON_PROPS} width={17} height={17} aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const MenuIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg {...ICON_PROPS} aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg {...ICON_PROPS} width={15} height={15} aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg {...ICON_PROPS} width={15} height={15} aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * A single navigation link entry.
 * @typedef {Object} NavLinkItem
 * @property {string} key
 * @property {string} label
 * @property {JSX.Element} icon
 * @property {string} to
 */

/** @param {boolean} isAdmin @returns {NavLinkItem[]} */
function getMainLinks(isAdmin) {
  const links = [
    {
      key: "dashboard",
      label: isAdmin ? "Dashboard" : "Home",
      icon: <HomeIcon />,
      to: isAdmin ? ROUTES.adminDashboard : ROUTES.home,
    },
    {
      key: "courses",
      label: "Courses",
      icon: <BookIcon />,
      to: ROUTES.courses,
    },
  ];

  if (isAdmin) {
    links.push(
      {
        key: "students",
        label: "Students",
        icon: <GradCapIcon />,
        to: ROUTES.students,
      },
      {
        key: "invite-student",
        label: "Invite Student",
        icon: <UserPlusIcon />,
        to: ROUTES.inviteStudent,
      },
      {
        key: "payment-requests",
        label: "Payment Requests",
        icon: <PaymentIcon />,
        to: ROUTES.paymentRequests,
      }
    );
  }

  return links;
}

/** @returns {NavLinkItem[]} */
function getAccountLinks() {
  return [
    { key: "notifications", label: "Notifications", icon: <BellIcon />, to: ROUTES.notifications },
    { key: "profile", label: "Profile", icon: <UserIcon />, to: ROUTES.profile },
    { key: "settings", label: "Settings", icon: <GearIcon />, to: ROUTES.settings },
  ];
}

export default function Nav({ brandName, brandInitial }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.collapsed) === "1"
  );

  const menuRef = useRef(null);

  /** Re-reads auth state from localStorage and syncs component state. */
  const syncAuthState = useCallback(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const role = (localStorage.getItem(STORAGE_KEYS.role) || "").toLowerCase();

    if (!token) {
      setHasToken(false);
      return;
    }

    const admin = role === "admin";
    const claims = decodeJwtPayload(token);
    const fallbackName = admin ? "Admin" : "Learner";

    setHasToken(true);
    setIsAdmin(admin);
    setDisplayName(claims?.name || claims?.username || claims?.email || fallbackName);
  }, []);

  // Re-sync whenever the route changes (covers login/logout navigations).
  useEffect(() => {
    syncAuthState();
  }, [location.pathname, syncAuthState]);

  // Keep in sync across tabs/windows (storage event only fires cross-tab).
  useEffect(() => {
    const onStorage = (event) => {
      const relevantKeys = [STORAGE_KEYS.token, STORAGE_KEYS.role, null];
      if (relevantKeys.includes(event.key)) {
        syncAuthState();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncAuthState]);

  // Close the mobile drawer on every navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close the account menu when clicking outside of it.
  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Escape closes whichever overlay is currently open (menu takes priority).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (menuOpen) setMenuOpen(false);
      else if (mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.collapsed, next ? "1" : "0");
      return next;
    });
    setMenuOpen(false);
  }, []);

  const openMobileDrawer = useCallback(() => setMobileOpen(true), []);
  const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);
  const toggleAccountMenu = useCallback(() => setMenuOpen((open) => !open), []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.role);
    setMenuOpen(false);
    navigate(LOGIN_ROUTE);
  }, [navigate]);

  const isRouteActive = useCallback(
    (to) => location.pathname === to || location.pathname.startsWith(`${to}/`),
    [location.pathname]
  );

  const mainLinks = useMemo(() => getMainLinks(isAdmin), [isAdmin]);
  const accountLinks = useMemo(() => getAccountLinks(), []);
  const avatarInitials = useMemo(() => getInitials(displayName), [displayName]);
  // Admins land on /admin/dashboard, students land on /home — used by
  // both the "Dashboard"/"Home" link above and the brand logo below.
  const homeRoute = isAdmin ? ROUTES.adminDashboard : ROUTES.home;

  if (!hasToken) return null;

  const renderLink = (link) => (
    <Link
      key={link.key}
      to={link.to}
      className={`nav-link ${isRouteActive(link.to) ? "is-active" : ""}`}
      data-tip={collapsed ? link.label : undefined}
      aria-current={isRouteActive(link.to) ? "page" : undefined}
    >
      {link.icon}
      {!collapsed && link.label}
    </Link>
  );

  return (
    <>
      <button
        type="button"
        className="nav-burger"
        onClick={openMobileDrawer}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <MenuIcon />
      </button>

      <div
        className={`nav-overlay ${mobileOpen ? "is-open" : ""}`}
        onClick={closeMobileDrawer}
        aria-hidden="true"
      />

      <aside
        className={`nav-panel ${mobileOpen ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`}
        aria-label="Primary"
      >
        <button
          type="button"
          className="nav-mobile-close"
          onClick={closeMobileDrawer}
          aria-label="Close navigation menu"
        >
          <CloseIcon />
        </button>

        <button
          type="button"
          className="nav-collapse-btn"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>

        <Link to={homeRoute} className="nav-brand">
          <span className="nav-brand__mark">{brandInitial}</span>
          <span className="nav-brand__name">{brandName}</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {!collapsed && <span className="nav-section-label">Menu</span>}
          {mainLinks.map(renderLink)}

          {!collapsed && <span className="nav-section-label">Account</span>}
          {accountLinks.map(renderLink)}
        </nav>

        <div className="nav-footer">
          <span className={`nav-role ${isAdmin ? "nav-role--admin" : ""}`}>
            {isAdmin ? "Admin" : "Student"}
          </span>

          <div className="nav-user" ref={menuRef}>
            {menuOpen && (
              <div className="nav-menu" role="menu">
                <button type="button" onClick={handleLogout} role="menuitem">
                  <LogOutIcon /> Log out
                </button>
              </div>
            )}
            <button
              type="button"
              className="nav-user__btn"
              onClick={toggleAccountMenu}
              data-tip={collapsed ? displayName : undefined}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="nav-avatar">{avatarInitials}</span>
              {!collapsed && (
                <span className="nav-user__info">
                  <span className="nav-user__name">{displayName}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

Nav.propTypes = {
  /** Full brand/company name shown in the expanded sidebar header. */
  brandName: PropTypes.string,
  /** Single-letter (or short) mark shown in the collapsed sidebar header. */
  brandInitial: PropTypes.string,
};

Nav.defaultProps = {
  brandName: "Skillfull Technologies",
  brandInitial: "S",
};