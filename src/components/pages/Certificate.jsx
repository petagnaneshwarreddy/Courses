import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import Nav from "./Nav";
import skillfullLogo from "../../assets/skillfull-logo.png";

// Same API root the rest of the app uses.
const API_BASE = "http://localhost:5000";

// Mount this at a route like:  <Route path="/certificate/:id" element={<Certificate />} />
// Content.js navigates here with: navigate(`/certificate/${course.id}`, { state: { course, studentName } })
//
// Flow:
//   1. "confirm" step — student reviews/edits their name + completion date before anything is generated.
//   2. "certificate" step — the certificate renders, with buttons to go back and edit, or download it
//      (PNG via html2canvas if available, otherwise a print-to-PDF fallback via window.print()).
//
// REQUIRED DEPENDENCY: this component downloads the certificate as a PNG using html2canvas.
// Install it before running the app:
//   npm install html2canvas
// If canvas rendering fails at runtime for any reason, the Download button falls back to
// the browser's "Print > Save as PDF" flow automatically.

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatAwardedSentence(d) {
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `Awarded on this ${weekday}, the ${ordinal(d.getDate())} day of ${month}, ${d.getFullYear()}.`;
}

// Short, deterministic-looking serial for the certificate footer — not a
// security feature, just a professional finishing touch.
function makeCertId(courseId, name, date) {
  const seed = `${courseId || "course"}-${name}-${date.toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `SFT-${date.getFullYear()}-${code}`;
}

/* ------------------ Decorative certificate elements ------------------ */

// Navy wedge with a gold diagonal accent, drawn once for the top-left corner;
// the bottom-right corner reuses it rotated 180deg via CSS.
function CornerDecoration({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 170,0 0,170" fill="var(--crt-cert-navy)" />
      <line x1="162" y1="8" x2="8" y2="162" stroke="var(--crt-cert-gold)" strokeWidth="4" />
      <line x1="150" y1="20" x2="20" y2="150" stroke="var(--crt-cert-gold-light)" strokeWidth="1.5" />
      <line x1="198" y1="34" x2="34" y2="198" stroke="var(--crt-cert-gold)" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}

// Scalloped gold "official certificate" rosette seal.
function SealBadge() {
  return (
    <div className="crt-seal">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="crt-seal-grad" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--crt-cert-gold-light)" />
            <stop offset="55%" stopColor="var(--crt-cert-gold)" />
            <stop offset="100%" stopColor="#8a6a1f" />
          </radialGradient>
        </defs>
        <path
          d="M60.0,6.0 L66.5,14.5 L75.2,8.2 L79.1,18.2 L89.2,14.6 L90.1,25.2 L100.8,24.6 L98.7,35.1 L109.1,37.6 L104.1,47.0 L113.5,52.3 L106.0,60.0 L113.5,67.7 L104.1,73.0 L109.1,82.4 L98.7,84.9 L100.8,95.4 L90.1,94.8 L89.2,105.4 L79.1,101.8 L75.2,111.8 L66.5,105.5 L60.0,114.0 L53.5,105.5 L44.8,111.8 L40.9,101.8 L30.8,105.4 L29.9,94.8 L19.2,95.4 L21.3,84.9 L10.9,82.4 L15.9,73.0 L6.5,67.7 L14.0,60.0 L6.5,52.3 L15.9,47.0 L10.9,37.6 L21.3,35.1 L19.2,24.6 L29.9,25.2 L30.8,14.6 L40.9,18.2 L44.8,8.2 L53.5,14.5 Z"
          fill="url(#crt-seal-grad)"
          stroke="#8a6a1f"
          strokeWidth="0.6"
        />
        <circle cx="60" cy="60" r="34" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6" />
      </svg>
      <div className="crt-seal__text">
        <strong>Official<br />Certificate</strong>
        <span className="crt-seal__stars">★ ★ ★</span>
      </div>
    </div>
  );
}

/* ------------------------------ Icons ------------------------------ */

const Icon = {
  Back: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <path d="M4 10.5 8 14.5 16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M10 3v9.5M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <path d="M13.5 3.5 16.5 6.5 7 16H4v-3l9.5-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  Seal: (p) => (
    <svg viewBox="0 0 64 64" fill="none" width="56" height="56" {...p}>
      <circle cx="32" cy="26" r="17" fill="currentColor" opacity="0.12" />
      <circle cx="32" cy="26" r="17" stroke="currentColor" strokeWidth="2" />
      <path d="M23 26.5 29 32l12-13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 40 18 58l14-7 14 7-4-18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */

function CertificateStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&family=Playfair+Display:wght@600;700;800&family=Dancing+Script:wght@600;700&display=swap");

:root {
  --crt-ink: #0a1730;
  --crt-accent: #1c6fe0;
  --crt-brand-blue: #1c6fe0;
  --crt-brand-cyan: #14b8c9;
  --crt-brand-green: #34d17a;
  --crt-brand-gradient: linear-gradient(100deg, #1c6fe0 0%, #14b8c9 52%, #34d17a 100%);
  --crt-brand-gradient-soft: linear-gradient(100deg, rgba(28,111,224,0.10) 0%, rgba(20,184,201,0.10) 52%, rgba(52,209,122,0.10) 100%);
  --crt-gold: #14b8c9;
  --crt-cert-navy: #0d1b4c;
  --crt-cert-navy-deep: #081235;
  --crt-cert-gold: #c9a23a;
  --crt-cert-gold-light: #e2c97a;
  --crt-cert-cream: #fdfdfc;
  --crt-teal: #0f9488;
  --crt-danger: #c0293f;
  --crt-bg: #f5f6f9;
  --crt-surface: #ffffff;
  --crt-border: #e2e5ec;
  --crt-border-strong: #cfd4de;
  --crt-text: #10151f;
  --crt-text-soft: #5b6472;
  --crt-text-faint: #8a92a1;
  --crt-radius: 10px;
  --crt-radius-lg: 14px;
  --crt-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03);
  --crt-font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --crt-font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
  --crt-font-display: "Playfair Display", Georgia, serif;
}

.crt-page { font-family: var(--crt-font-body); color: var(--crt-text); background: var(--crt-bg); min-height: 100%; box-sizing: border-box; }
.crt-page * { box-sizing: border-box; }

.crt-page--centered { display: flex; align-items: center; justify-content: center; min-height: 70vh; text-align: center; padding: 32px; }
.crt-page--centered p { color: var(--crt-text-soft); font-size: 14px; margin: 6px 0 0; }
.crt-page--centered h2 { font-size: 20px; font-weight: 700; margin: 0; color: var(--crt-ink); }

.crt-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  background: var(--crt-surface);
  border-bottom: 1px solid var(--crt-border);
  position: sticky;
  top: 0;
  z-index: 5;
}
.crt-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--crt-surface);
  border: 1px solid var(--crt-border-strong);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--crt-text);
  cursor: pointer;
  flex-shrink: 0;
}
.crt-back:hover { border-color: var(--crt-ink); }
.crt-topbar__title { font-size: 16.5px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--crt-ink); }
.crt-topbar__eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--crt-accent); margin: 0 0 3px; }

.crt-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px 72px; }

/* ---- Step: confirm details ---- */
.crt-confirm {
  background: var(--crt-surface);
  border: 1px solid var(--crt-border);
  border-radius: var(--crt-radius-lg);
  box-shadow: var(--crt-shadow);
  padding: 28px;
  max-width: 640px;
  margin: 0 auto;
}
.crt-confirm__head { margin-bottom: 20px; }
.crt-confirm__head h1 { font-size: 19px; font-weight: 700; margin: 0 0 6px; color: var(--crt-ink); }
.crt-confirm__head p { margin: 0; font-size: 13.5px; color: var(--crt-text-soft); line-height: 1.5; }

.crt-field { margin-bottom: 16px; }
.crt-field label { display: block; font-size: 12.5px; font-weight: 700; color: var(--crt-text-soft); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.crt-field input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--crt-border-strong);
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--crt-font-body);
  color: var(--crt-text);
  background: var(--crt-surface);
}
.crt-field input:focus { outline: none; border-color: var(--crt-accent); box-shadow: 0 0 0 3px rgba(28,111,224,0.14); }
.crt-field input:disabled { background: #f4f5f9; color: var(--crt-text-soft); }
.crt-field__hint { font-size: 11.5px; color: var(--crt-text-faint); margin: 6px 0 0; }

.crt-confirm__row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.crt-confirm__error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fbecee;
  color: var(--crt-danger);
  border: 1px solid #f2c6cc;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 16px;
}

.crt-confirm__actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 22px; }

.crt-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--crt-border-strong);
  background: var(--crt-surface);
  color: var(--crt-text);
}
.crt-btn:hover:not(:disabled) { border-color: var(--crt-ink); }
.crt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.crt-btn--primary { background: var(--crt-ink); color: #fff; border-color: var(--crt-ink); }
.crt-btn--primary:hover:not(:disabled) { background: #000; }
.crt-btn--gold { background: var(--crt-brand-gradient); color: #fff; border-color: transparent; }
.crt-btn--gold:hover:not(:disabled) { filter: brightness(1.06); border-color: transparent; }

/* ---- Step: certificate view ---- */
.crt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.crt-toolbar__actions { display: flex; gap: 10px; }

.crt-cert-outer {
  background: var(--crt-surface);
  border: 1px solid var(--crt-border);
  border-radius: var(--crt-radius-lg);
  box-shadow: var(--crt-shadow);
  padding: 18px;
}

.crt-cert-frame {
  background: var(--crt-cert-cream);
  border-radius: 4px;
}

.crt-cert {
  position: relative;
  width: 100%;
  max-width: 1123px;
  aspect-ratio: 1123 / 794;
  margin: 0 auto;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(201,162,58,0.14) 0%, transparent 42%),
    radial-gradient(ellipse at 8% 92%, rgba(201,162,58,0.16) 0%, transparent 46%),
    radial-gradient(ellipse at 94% 96%, rgba(201,162,58,0.16) 0%, transparent 46%),
    linear-gradient(155deg, #fbf6e9 0%, #fdfcf7 22%, #fefefd 55%, #fbf6ea 100%);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.crt-cert__border {
  position: absolute;
  inset: 16px;
  border: 1.5px solid var(--crt-cert-navy);
  pointer-events: none;
  z-index: 3;
}
.crt-cert__border-inner {
  position: absolute;
  inset: 21px;
  border: 1px solid var(--crt-cert-gold);
  opacity: 0.55;
  pointer-events: none;
  z-index: 3;
}

.crt-cert__watermark {
  position: absolute;
  top: 52%;
  left: 50%;
  width: clamp(260px, 42%, 460px);
  height: auto;
  transform: translate(-50%, -50%);
  opacity: 0.05;
  filter: grayscale(1) contrast(1.3);
  pointer-events: none;
  z-index: 1;
}

.crt-cert__corner-svg {
  position: absolute;
  width: 13%;
  max-width: 150px;
  height: auto;
  z-index: 2;
}
.crt-cert__corner-svg--tl { top: 0; left: 0; }
.crt-cert__corner-svg--br { bottom: 0; right: 0; transform: rotate(180deg); }

.crt-cert__body-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 4.5%, 44px) 10% clamp(32px, 5.5%, 52px);
  position: relative;
  z-index: 4;
}

.crt-cert__logo { height: clamp(74px, 21vw, 140px); width: auto; display: block; margin: 0 auto; }
.crt-cert__tagline {
  font-family: var(--crt-font-body);
  font-size: clamp(9px, 1vw, 12px);
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--crt-text-soft);
  margin: 6px 0 0;
}
.crt-cert__tagline b { color: var(--crt-brand-blue); font-weight: 700; }

.crt-cert__title {
  font-family: var(--crt-font-display);
  font-weight: 800;
  font-size: clamp(20px, 3.6vw, 36px);
  letter-spacing: 0.03em;
  color: var(--crt-cert-navy);
  margin: clamp(10px, 2vw, 20px) 0 0;
}

.crt-cert__divider {
  display: flex;
  align-items: center;
  gap: 8px;
  width: clamp(140px, 22vw, 240px);
  margin: clamp(8px, 1.6vw, 16px) auto;
}
.crt-cert__divider-line { flex: 1; height: 1px; background: var(--crt-cert-gold); }
.crt-cert__divider-dot { width: 6px; height: 6px; background: var(--crt-cert-gold); transform: rotate(45deg); flex-shrink: 0; }

.crt-cert__presented {
  font-family: var(--crt-font-display);
  font-size: clamp(11px, 1.3vw, 15px);
  color: var(--crt-text);
  margin: 0 0 4px;
}
.crt-cert__name {
  font-family: var(--crt-font-display);
  font-weight: 700;
  font-size: clamp(22px, 3.8vw, 38px);
  color: var(--crt-cert-navy);
  margin: 2px 0 0;
  line-height: 1.15;
}
.crt-cert__body {
  font-family: var(--crt-font-display);
  font-size: clamp(10.5px, 1.15vw, 13px);
  color: var(--crt-text);
  line-height: 1.55;
  max-width: 78%;
  margin: 0 0 6px;
}
.crt-cert__course {
  font-weight: 700;
  color: var(--crt-cert-navy);
}
.crt-cert__awarded {
  font-family: var(--crt-font-display);
  font-weight: 700;
  font-size: clamp(10.5px, 1.15vw, 13.5px);
  color: var(--crt-brand-blue);
  margin: clamp(6px, 1.4vw, 12px) 0 0;
}

.crt-cert__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  max-width: 88%;
  margin-top: clamp(14px, 3vw, 28px);
  gap: 14px;
}
.crt-cert__seal-col { flex: 1; display: flex; justify-content: flex-start; }
.crt-cert__sig-col { flex: 1.1; text-align: center; }
.crt-cert__org-col { flex: 1; text-align: right; }

.crt-cert__signature {
  font-family: "Dancing Script", cursive;
  font-size: clamp(22px, 3.4vw, 34px);
  color: var(--crt-cert-navy);
  line-height: 1;
  margin: 0 0 2px;
  transform: rotate(-2deg);
}
.crt-cert__sig-rule {
  width: 78%;
  max-width: 170px;
  height: 1px;
  background: var(--crt-cert-gold);
  margin: 4px auto 6px;
}
.crt-cert__sig-name {
  font-family: var(--crt-font-display);
  font-size: clamp(10px, 1.1vw, 13px);
  color: var(--crt-text);
  margin: 0;
}
.crt-cert__sig-role {
  font-family: var(--crt-font-display);
  font-weight: 700;
  font-size: clamp(9.5px, 1.05vw, 12px);
  color: var(--crt-brand-blue);
  margin: 1px 0 0;
}

.crt-cert__org-name {
  font-family: var(--crt-font-display);
  font-weight: 700;
  font-size: clamp(10.5px, 1.2vw, 14px);
  color: var(--crt-cert-navy);
  margin: 0 0 2px;
}
.crt-cert__org-sub {
  font-family: var(--crt-font-display);
  font-size: clamp(8.5px, 0.95vw, 11px);
  color: var(--crt-text-soft);
  line-height: 1.4;
  margin: 0 0 4px;
}
.crt-cert__org-date {
  font-family: var(--crt-font-mono);
  font-size: clamp(8.5px, 0.9vw, 10.5px);
  color: var(--crt-text-faint);
  letter-spacing: 0.04em;
}

.crt-cert__serial {
  width: 100%;
  margin-top: clamp(16px, 3vw, 26px);
  padding-top: clamp(8px, 1.4vw, 12px);
  border-top: 1px solid rgba(201,162,58,0.35);
  font-family: var(--crt-font-mono);
  font-size: clamp(7.5px, 0.8vw, 9.5px);
  letter-spacing: 0.08em;
  color: var(--crt-text-faint);
  text-transform: uppercase;
}

.crt-seal {
  position: relative;
  width: clamp(70px, 9vw, 100px);
  height: clamp(70px, 9vw, 100px);
}
.crt-seal svg { width: 100%; height: 100%; display: block; }
.crt-seal__text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  pointer-events: none;
}
.crt-seal__text strong {
  font-family: var(--crt-font-display);
  font-size: clamp(8px, 0.95vw, 10.5px);
  font-weight: 700;
  line-height: 1.15;
  display: block;
}
.crt-seal__stars {
  font-size: clamp(6px, 0.7vw, 8px);
  letter-spacing: 2px;
  margin-top: 2px;
  color: var(--crt-cert-gold-light);
}

.crt-hint {
  text-align: center;
  font-size: 12px;
  color: var(--crt-text-faint);
  margin-top: 14px;
}

@media print {
  .crt-topbar, .crt-toolbar, .crt-hint, .app-shell > nav, .app-shell nav { display: none !important; }
  .crt-wrap { padding: 0; max-width: none; }
  .crt-cert-outer { border: none; box-shadow: none; padding: 0; }
  .crt-cert-frame { border-radius: 0; }
  body, .crt-page, .app-shell, .app-main { background: #fff !important; }
}

@media (max-width: 720px) {
  .crt-confirm__row { grid-template-columns: 1fr; }
  .crt-cert__footer { flex-direction: column; align-items: center; text-align: center; gap: 14px; }
  .crt-cert__seal-col, .crt-cert__org-col { justify-content: center; text-align: center; }
}
    `}</style>
  );
}

/* ------------------------------------------------------------------ */

export default function Certificate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: courseId } = useParams();
  const LOGIN_ROUTE = "/login";

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [accountName, setAccountName] = useState("");

  const [course, setCourse] = useState(location.state?.course || null);
  const [loading, setLoading] = useState(!location.state?.course);
  const [loadError, setLoadError] = useState(null);

  const [step, setStep] = useState("confirm"); // "confirm" | "certificate"
  const [nameInput, setNameInput] = useState(location.state?.studentName || "");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [confirmedName, setConfirmedName] = useState("");
  const [completionDate, setCompletionDate] = useState(() => new Date());

  const certRef = useRef(null);
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // ---- Auth check ----
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
        setAccountName(res.data.name || res.data.username || "");
        if (!location.state?.studentName) {
          setNameInput(res.data.name || res.data.username || "");
        }
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        setHasToken(false);
        setTimeout(() => navigate(LOGIN_ROUTE), 1200);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ---- Load course if it wasn't handed to us via router state ----
  useEffect(() => {
    if (!hasToken || course || !courseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await axios.get(`${API_BASE}/courses/${courseId}`, { headers: authHeaders() });
        if (cancelled) return;
        setCourse({ ...res.data, id: res.data.id || res.data._id });
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.response?.data?.message || "Couldn't load this course.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, courseId, course]);

  const handleConfirm = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Please enter the name to print on your certificate.");
      return;
    }
    if (trimmed.length > 80) {
      setError("That name is a little too long — try shortening it.");
      return;
    }
    setError("");
    setConfirmedName(trimmed);
    setCompletionDate(new Date());
    setStep("certificate");
  };

  const handleEdit = () => {
    setStep("confirm");
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 1123 / certRef.current.offsetWidth,
        width: certRef.current.offsetWidth,
        height: certRef.current.offsetHeight,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${(course?.title || "certificate").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Runtime rendering failure (e.g. a tainted canvas from a cross-origin image) ->
      // fall back to the browser's print dialog so the student can still "Save as PDF".
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // ---- Guard states ----
  if (!authChecked || (hasToken && loading)) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="crt-page crt-page--centered">
            <CertificateStyles />
            <h2>Preparing your certificate…</h2>
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
          <div className="crt-page crt-page--centered">
            <CertificateStyles />
            <h2>Please log in</h2>
            <p>Redirecting you to login…</p>
          </div>
        </main>
      </div>
    );
  }
  if (loadError || !course) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="crt-page crt-page--centered">
            <CertificateStyles />
            <h2>{loadError ? "Couldn't load this course" : "Course not found"}</h2>
            <p>{loadError || "It may have been removed."}</p>
            <button className="crt-back" style={{ marginTop: 14 }} onClick={() => navigate("/courses")}>
              <Icon.Back /> Back to courses
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">
        <div className="crt-page">
          <CertificateStyles />

          <div className="crt-topbar">
            <button className="crt-back" onClick={() => navigate(`/courses/${course.id}/learn`)}>
              <Icon.Back /> Course
            </button>
            <div>
              <p className="crt-topbar__eyebrow">Certificate</p>
              <h1 className="crt-topbar__title">{course.title}</h1>
            </div>
          </div>

          <div className="crt-wrap">
            {step === "confirm" && (
              <form className="crt-confirm" onSubmit={handleConfirm}>
                <div className="crt-confirm__head">
                  <h1>Confirm your details</h1>
                  <p>
                    This is exactly how your name will appear on the certificate. Double-check the spelling —
                    you can always come back and generate it again if you need to change it.
                  </p>
                </div>

                {error && (
                  <div className="crt-confirm__error">
                    <Icon.Check style={{ transform: "rotate(45deg)" }} /> {error}
                  </div>
                )}

                <div className="crt-confirm__row">
                  <div className="crt-field">
                    <label htmlFor="crt-name">Name on certificate</label>
                    <input
                      id="crt-name"
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder={accountName || "Your full name"}
                      autoFocus
                    />
                  </div>
                  <div className="crt-field">
                    <label htmlFor="crt-course">Course</label>
                    <input id="crt-course" type="text" value={course.title || ""} disabled />
                  </div>
                </div>

                <div className="crt-field">
                  <label>Completion date</label>
                  <input type="text" value={formatDate(new Date())} disabled />
                  <p className="crt-field__hint">Set automatically to today's date when you generate the certificate.</p>
                </div>

                <div className="crt-confirm__actions">
                  <button type="button" className="crt-btn" onClick={() => navigate(`/courses/${course.id}/learn`)}>
                    Cancel
                  </button>
                  <button type="submit" className="crt-btn crt-btn--gold">
                    <Icon.Check /> Confirm &amp; generate
                  </button>
                </div>
              </form>
            )}

            {step === "certificate" && (
              <>
                <div className="crt-toolbar">
                  <button className="crt-btn" onClick={handleEdit}>
                    <Icon.Edit /> Edit details
                  </button>
                  <div className="crt-toolbar__actions">
                    <button className="crt-btn crt-btn--primary" onClick={handleDownload} disabled={downloading}>
                      <Icon.Download /> {downloading ? "Preparing…" : "Download certificate"}
                    </button>
                  </div>
                </div>

                <div className="crt-cert-outer">
                  <div className="crt-cert-frame">
                    <div className="crt-cert" ref={certRef}>
                      <CornerDecoration className="crt-cert__corner-svg crt-cert__corner-svg--tl" />
                      <CornerDecoration className="crt-cert__corner-svg crt-cert__corner-svg--br" />
                      <img src={skillfullLogo} alt="" aria-hidden="true" className="crt-cert__watermark" />
                      <div className="crt-cert__border" />
                      <div className="crt-cert__border-inner" />

                      <div className="crt-cert__body-wrap">
                        <img src={skillfullLogo} alt="Skillfull Technologies" className="crt-cert__logo" />
                        <p className="crt-cert__tagline">Intern. Learn. Certify. Grow.</p>

                        <h1 className="crt-cert__title">Certificate of Completion</h1>

                        <div className="crt-cert__divider">
                          <span className="crt-cert__divider-line" />
                          <span className="crt-cert__divider-dot" />
                          <span className="crt-cert__divider-line" />
                        </div>

                        <p className="crt-cert__presented">This diploma is awarded to</p>
                        <p className="crt-cert__name">{confirmedName}</p>

                        <div className="crt-cert__divider">
                          <span className="crt-cert__divider-line" />
                          <span className="crt-cert__divider-dot" />
                          <span className="crt-cert__divider-line" />
                        </div>

                        <p className="crt-cert__body">
                          For the successful completion of{" "}
                          <span className="crt-cert__course">"{course.title}"</span> and the demonstration of
                          outstanding knowledge, skill, and dedication to excellence.
                        </p>
                        <p className="crt-cert__awarded">{formatAwardedSentence(completionDate)}</p>

                        <div className="crt-cert__footer">
                          <div className="crt-cert__seal-col">
                            <SealBadge />
                          </div>

                          <div className="crt-cert__sig-col">
                            <p className="crt-cert__signature">{course.instructor || "S. Kumar"}</p>
                            <div className="crt-cert__sig-rule" />
                            <p className="crt-cert__sig-name">{course.instructor || "Course Instructor"}</p>
                            <p className="crt-cert__sig-role">Instructor</p>
                          </div>

                          <div className="crt-cert__org-col">
                            <p className="crt-cert__org-name">Skillfull Technologies</p>
                            <p className="crt-cert__org-sub">
                              Center for Professional Education
                              <br />
                              &amp; Skills Development
                            </p>
                            <p className="crt-cert__org-date">{completionDate.toISOString().slice(0, 10)}</p>
                          </div>
                        </div>

                        <p className="crt-cert__serial">
                          Certificate ID: {makeCertId(course.id, confirmedName, completionDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="crt-hint">
                  Tip: if the PNG download doesn't start, your browser's print dialog will open instead —
                  choose "Save as PDF" there to download it.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}