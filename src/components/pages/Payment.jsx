import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Nav from "./Nav";

const API_BASE = "https://course-backend-01ye.onrender.com";

/* ------------------------------------------------------------------
   Payment.jsx  —  mock checkout page.
   Route: /payment/:id  (registered in App.js — see bottom of file)

   Reached from Courses.js / CourseDetail.jsx when a student clicks
   "Enroll Now". Nothing is actually charged for the card/UPI flows —
   they simulate a payment provider's round trip and only call the
   real enroll API once "payment" succeeds.

   A third method, "Screenshot", is a manual-review flow: the student
   uploads proof of an out-of-band payment (bank transfer, cash app,
   etc.), it's submitted to the backend for an admin to review, and
   this page polls for the admin's decision:
     - approved -> enroll API is called, student gets access
     - declined -> no enroll call, no access, student can retry
   ------------------------------------------------------------------ */

const CATEGORY_COLORS = {
  "Web Development": "#2451CC",
  "Data Science": "#0F9488",
  Design: "#C2540A",
  "Cloud & DevOps": "#6D4FD1",
  "Mobile Development": "#B45309",
  Cybersecurity: "#B0223A",
};

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

// Formats a raw digit string as "4242 4242 4242 4242" while typing.
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// Formats a raw digit string as "MM/YY" while typing.
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Basic shape check for a UPI VPA, e.g. "priya.nair@okhdfcbank" —
// handle @ bank/PSP handle. Not a real-bank lookup, just format validation.
function upiIdValid(value) {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

function luhnValid(cardDigits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardDigits.length - 1; i >= 0; i--) {
    let d = parseInt(cardDigits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const Icon = {
  Back: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <rect x="4.5" y="8.5" width="11" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 8.5V6.3a3.5 3.5 0 0 1 7 0v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Card: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="28" height="28" {...p}>
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.4 10.3 8.8 12.7 13.6 7.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Upi: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <path d="M4 4.5 9.2 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 4.5 5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 4.5 16.5 4.5 11.7 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="30" height="30" {...p}>
      <rect x="5.5" y="2.5" width="9" height="15" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 15h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18" {...p}>
      <path d="M10 13V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 7.5 10 4l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14.5v1.2c0 .9.7 1.6 1.6 1.6h8.8c.9 0 1.6-.7 1.6-1.6v-1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="30" height="30" {...p}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  XCircle: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="30" height="30" {...p}>
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.2 7.2 12.8 12.8M12.8 7.2 7.2 12.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

function PaymentStyles() {
  return (
    <style>{`
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap");

.pay-page {
  --pay-ink: #0f172a;
  --pay-accent: #2451cc;
  --pay-teal: #0f9488;
  --pay-danger: #c0293f;
  --pay-bg: #f5f6f9;
  --pay-surface: #ffffff;
  --pay-border: #e2e5ec;
  --pay-border-strong: #cfd4de;
  --pay-text: #10151f;
  --pay-text-soft: #5b6472;
  --pay-text-faint: #8a92a1;
  --pay-radius-lg: 14px;
  --pay-shadow: 0 1px 2px rgba(15,23,42,.04), 0 1px 1px rgba(15,23,42,.03);
  --pay-shadow-lg: 0 24px 48px -12px rgba(15,23,42,.22);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--pay-text);
  background: var(--pay-bg);
  min-height: 100%;
  padding: 28px 40px 64px;
  box-sizing: border-box;
}
.pay-page * { box-sizing: border-box; }

.pay-page--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: var(--pay-text-soft);
}

.pay-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pay-text-soft);
  text-decoration: none;
  margin-bottom: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.pay-back:hover { color: var(--pay-ink); }

.pay-eyebrow {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--pay-accent);
  margin: 0 0 6px;
}
.pay-title { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 24px; }

.pay-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 22px;
  align-items: start;
}

.pay-card {
  background: var(--pay-surface);
  border: 1px solid var(--pay-border);
  border-radius: var(--pay-radius-lg);
  box-shadow: var(--pay-shadow);
  padding: 26px;
}

.pay-card h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--pay-ink);
}
.pay-card h2 svg { color: var(--pay-accent); }

.pay-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pay-text-soft);
  margin-bottom: 16px;
}
.pay-field input {
  font-family: "IBM Plex Mono", monospace;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--pay-text);
  border: 1px solid var(--pay-border-strong);
  border-radius: 8px;
  padding: 11px 13px;
  outline: none;
}
.pay-field input::placeholder { color: var(--pay-text-faint); font-weight: 400; }
.pay-field input:focus {
  border-color: var(--pay-accent);
  box-shadow: 0 0 0 3px rgba(36, 81, 204, 0.12);
}
.pay-field em {
  font-style: normal;
  color: var(--pay-danger);
  font-size: 11.5px;
  font-weight: 500;
}
.pay-field input[type="file"] {
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 10px;
  cursor: pointer;
}
.pay-field input[type="file"]::file-selector-button {
  font-family: inherit;
  font-weight: 600;
  font-size: 12.5px;
  color: #fff;
  background: var(--pay-ink);
  border: none;
  border-radius: 6px;
  padding: 7px 12px;
  margin-right: 10px;
  cursor: pointer;
}

.pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.pay-submit {
  width: 100%;
  font-family: inherit;
  font-weight: 700;
  font-size: 14.5px;
  border-radius: 9px;
  padding: 13px 18px;
  border: none;
  cursor: pointer;
  background: var(--pay-ink);
  color: #fff;
  margin-top: 6px;
  transition: background .12s ease;
}
.pay-submit:hover:not(:disabled) { background: #000; }
.pay-submit:disabled { opacity: .6; cursor: not-allowed; }

.pay-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--pay-text-faint);
  margin-top: 12px;
}

.pay-error {
  background: #fbecee;
  border: 1px solid #eec6cc;
  color: #93202f;
  padding: 10px 13px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

/* Payment method tabs */
.pay-methods {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--pay-border);
}
.pay-methods button {
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
  color: var(--pay-text-faint);
  cursor: pointer;
}
.pay-methods button svg { color: var(--pay-text-faint); }
.pay-methods button.is-active { color: var(--pay-ink); border-bottom-color: var(--pay-ink); }
.pay-methods button.is-active svg { color: var(--pay-accent); }

/* Read-only amount row (shown above UPI + screenshot submit buttons so
   the amount is visibly fixed/non-editable at the point of confirming) */
.pay-amount-lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f6f9;
  border: 1px solid var(--pay-border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--pay-text-soft);
}
.pay-amount-lock strong {
  font-family: "IBM Plex Mono", monospace;
  font-size: 16px;
  color: var(--pay-ink);
}

.pay-upi-waiting {
  text-align: center;
  padding: 20px 8px 6px;
}
.pay-upi-waiting__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #eef1f8;
  color: var(--pay-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  animation: pay-pulse 1.4s ease-in-out infinite;
}
.pay-upi-waiting__icon--declined {
  background: #fbecee;
  color: var(--pay-danger);
  animation: none;
}
@keyframes pay-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .6; transform: scale(.94); }
}
.pay-upi-waiting p { font-size: 13.5px; color: var(--pay-text-soft); margin: 0 0 4px; }
.pay-upi-waiting strong { color: var(--pay-ink); }

/* Screenshot upload preview */
.pay-screenshot-preview {
  border: 1px solid var(--pay-border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #f5f6f9;
}
.pay-screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  background: #eef0f4;
}
.pay-screenshot-preview__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11.5px;
  color: var(--pay-text-faint);
  padding: 8px 12px;
  border-top: 1px solid var(--pay-border);
}
.pay-screenshot-preview__meta button {
  background: none;
  border: none;
  color: var(--pay-danger);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 11.5px;
}

/* Order summary */
.pay-summary { position: sticky; top: 20px; }
.pay-summary__cover {
  height: 110px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  margin-bottom: 14px;
}
.pay-summary h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; line-height: 1.35; }
.pay-summary__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--pay-text-soft);
  margin-bottom: 16px;
}
.pay-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--pay-ink);
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pay-summary__line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--pay-text-soft);
  padding: 9px 0;
  border-top: 1px solid var(--pay-border);
}
.pay-summary__line:first-of-type { border-top: none; padding-top: 0; }
.pay-summary__total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 700;
  color: var(--pay-ink);
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid var(--pay-border);
}
.pay-summary__total strong { font-family: "IBM Plex Mono", monospace; font-size: 21px; }

/* Success state */
.pay-success {
  max-width: 420px;
  margin: 40px auto;
  text-align: center;
  background: var(--pay-surface);
  border: 1px solid var(--pay-border);
  border-radius: var(--pay-radius-lg);
  box-shadow: var(--pay-shadow-lg);
  padding: 40px 32px;
}
.pay-success__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e7f5f3;
  color: var(--pay-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
}
.pay-success h2 { font-size: 19px; font-weight: 700; margin: 0 0 8px; }
.pay-success p { font-size: 13.5px; color: var(--pay-text-soft); margin: 0 0 22px; line-height: 1.5; }

.app-shell { display: flex; align-items: stretch; min-height: 100vh; }
.app-main { flex: 1; min-width: 0; }

@media (max-width: 820px) {
  .pay-grid { grid-template-columns: 1fr; }
  .pay-summary { position: static; }
}
    `}</style>
  );
}

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
 const LOGIN_ROUTE = "/login";

  const [course, setCourse] = useState(location.state?.course || null);
  const [loading, setLoading] = useState(!location.state?.course);
  const [loadError, setLoadError] = useState(null);

  const [method, setMethod] = useState("card"); // "card" | "upi" | "screenshot"

  const [form, setForm] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});

  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState(null);
  const [upiRequestSent, setUpiRequestSent] = useState(false);

  // Screenshot / manual-review flow state.
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotError, setScreenshotError] = useState(null);
  // "idle" -> "uploading" -> "pending" -> "approved" | "declined"
  const [reviewStatus, setReviewStatus] = useState("idle");

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [success, setSuccess] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

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

  // If the page was opened directly (refresh, shared link) rather than
  // via the Enroll button, we won't have the course in location.state —
  // fetch it so the order summary still renders correctly.
  useEffect(() => {
    if (!hasToken || course) return;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/courses/${id}`, { headers: authHeaders() });
        setCourse({ ...res.data, id: res.data.id || res.data._id });
      } catch (err) {
        setLoadError(err.response?.data?.message || "Couldn't load this course.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, id]);

  // Clean up the object URL used for the screenshot preview.
  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  // While a screenshot is under review, poll the backend for the
  // admin's decision. Approved -> call enroll, grant access. Declined
  // -> stop polling, no access, student can retry.
  useEffect(() => {
    if (reviewStatus !== "pending") return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE}/courses/${id}/payment-status`, {
          headers: authHeaders(),
        });
        const status = res.data?.status; // "pending" | "approved" | "declined"
        if (cancelled || status === "pending" || !status) return;

        if (status === "approved") {
          await axios.post(`${API_BASE}/courses/${id}/enroll`, {}, { headers: authHeaders() });
          if (cancelled) return;
          setReviewStatus("approved");
          setSuccess(true);
        } else if (status === "declined") {
          setReviewStatus("declined");
        }
      } catch (err) {
        // Transient network/poll errors: keep trying silently rather
        // than bouncing the student out of the waiting screen.
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [reviewStatus, id]);

  const update = (key) => (e) => {
    let value = e.target.value;
    if (key === "cardNumber") value = formatCardNumber(value);
    if (key === "expiry") value = formatExpiry(value);
    if (key === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Enter the name on the card";

    const digits = form.cardNumber.replace(/\D/g, "");
    if (digits.length !== 16) errs.cardNumber = "Card number must be 16 digits";
    else if (!luhnValid(digits)) errs.cardNumber = "That card number doesn't look valid";

    const [mm, yy] = form.expiry.split("/");
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) {
      errs.expiry = "Use MM/YY";
    } else {
      const month = parseInt(mm, 10);
      const year = 2000 + parseInt(yy, 10);
      const now = new Date();
      const expiryDate = new Date(year, month, 0);
      if (month < 1 || month > 12) errs.expiry = "Enter a valid month";
      else if (expiryDate < new Date(now.getFullYear(), now.getMonth(), 1)) errs.expiry = "Card has expired";
    }

    if (form.cvv.length < 3) errs.cvv = "3–4 digits";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setPayError(null);
    if (!validate()) return;

    setProcessing(true);
    try {
      // Simulate the round-trip to a payment provider. Swap this for a
      // real gateway call (Razorpay/Stripe/etc.) when one is wired up —
      // the enroll call below only needs to run after that resolves.
      await new Promise((resolve) => setTimeout(resolve, 1400));

      await axios.post(`${API_BASE}/courses/${id}/enroll`, {}, { headers: authHeaders() });
      setSuccess(true);
    } catch (err) {
      setPayError(err.response?.data?.message || "Payment couldn't be completed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // UPI flow: the amount is fixed to the course price (never editable —
  // there's no field for it at all, only a read-only display), so the
  // only thing the student supplies is where the collect request goes.
  // "Send request" -> simulated wait for the student to approve it in
  // their UPI app -> enroll, same as the card flow above.
  const submitUpi = async (e) => {
    e.preventDefault();
    setPayError(null);
    setUpiError(null);

    if (!upiId.trim()) {
      setUpiError("Enter your UPI ID");
      return;
    }
    if (!upiIdValid(upiId)) {
      setUpiError("Enter a valid UPI ID, e.g. name@okhdfcbank");
      return;
    }

    setUpiRequestSent(true);
    setProcessing(true);
    try {
      // Simulate sending a collect request to the UPI ID and waiting
      // for the student to approve it in their UPI app. Swap this for
      // a real PSP call (Razorpay/PhonePe/GPay collect API, etc.) when
      // one is wired up — the enroll call only needs to run after that
      // resolves successfully.
      await new Promise((resolve) => setTimeout(resolve, 2200));

      await axios.post(`${API_BASE}/courses/${id}/enroll`, {}, { headers: authHeaders() });
      setSuccess(true);
    } catch (err) {
      setPayError(err.response?.data?.message || "Payment couldn't be completed. Please try again.");
      setUpiRequestSent(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    setScreenshotError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScreenshotError("Please upload an image file (screenshot).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("Image must be under 5MB.");
      e.target.value = "";
      return;
    }

    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearScreenshot = () => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotError(null);
  };

  // Student uploads proof of payment -> it's submitted to the backend
  // for an admin to manually review. No enroll call happens here;
  // enrollment only happens once the poll above sees "approved".
  const submitScreenshot = async (e) => {
    e.preventDefault();
    setPayError(null);
    setScreenshotError(null);

    if (!screenshotFile) {
      setScreenshotError("Upload a screenshot of your payment first.");
      return;
    }

    setReviewStatus("uploading");
    try {
      // Backend expects a base64 image data URL in the JSON body — the
      // same convention already used for course thumbnails/documents —
      // rather than multipart form data.
      const screenshotDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Couldn't read the file."));
        reader.readAsDataURL(screenshotFile);
      });

      await axios.post(
        `${API_BASE}/courses/${id}/payment-screenshot`,
        { screenshot: screenshotDataUrl, amount: course.price },
        { headers: authHeaders() }
      );

      setReviewStatus("pending");
    } catch (err) {
      setReviewStatus("idle");
      setPayError(err.response?.data?.message || "Couldn't submit your screenshot. Please try again.");
    }
  };

  // After a decline, let the student attempt the manual-review flow
  // again with a fresh screenshot.
  const retryScreenshot = () => {
    clearScreenshot();
    setReviewStatus("idle");
    setPayError(null);
  };

  if (!authChecked || (hasToken && loading)) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="pay-page pay-page--centered">
            <PaymentStyles />
            Loading checkout…
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
          <div className="pay-page pay-page--centered">
            <PaymentStyles />
            Redirecting you to login…
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
          <div className="pay-page pay-page--centered">
            <PaymentStyles />
            <div>
              <p>{loadError || "Course not found."}</p>
              <Link to="/courses" className="pay-back" style={{ justifyContent: "center", marginTop: 10 }}>
                <Icon.Back /> Back to courses
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const accent = CATEGORY_COLORS[course.category] || "#2451CC";

  if (success) {
    return (
      <div className="app-shell">
        <Nav />
        <main className="app-main">
          <div className="pay-page">
            <PaymentStyles />
            <div className="pay-success">
              <div className="pay-success__icon">
                <Icon.Check />
              </div>
              <h2>Payment received</h2>
              <p>
                You're enrolled in <strong>{course.title}</strong>. It's ready whenever you are.
              </p>
              <button
                className="pay-submit"
                onClick={() => navigate(`/courses/${id}`, { state: { justEnrolled: true } })}
              >
                Start learning
              </button>
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
        <div className="pay-page">
          <PaymentStyles />

          <button className="pay-back" onClick={() => navigate(`/courses/${id}`)}>
            <Icon.Back /> Back to course
          </button>

          <p className="pay-eyebrow">Checkout</p>
          <h1 className="pay-title">Complete your enrollment</h1>

          <div className="pay-grid">
            <div className="pay-card">
              <div className="pay-methods">
                <button
                  type="button"
                  className={method === "card" ? "is-active" : ""}
                  onClick={() => { setMethod("card"); setPayError(null); }}
                >
                  <Icon.Card /> Card
                </button>
                <button
                  type="button"
                  className={method === "upi" ? "is-active" : ""}
                  onClick={() => { setMethod("upi"); setPayError(null); }}
                >
                  <Icon.Upi /> UPI
                </button>
                <button
                  type="button"
                  className={method === "screenshot" ? "is-active" : ""}
                  onClick={() => { setMethod("screenshot"); setPayError(null); }}
                >
                  <Icon.Upload /> Screenshot
                </button>
              </div>

              {payError && <div className="pay-error">{payError}</div>}

              {method === "card" ? (
                <form onSubmit={submit}>
                  <label className="pay-field">
                    <span>Name on card</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Full name as on card"
                      autoComplete="cc-name"
                    />
                    {errors.name && <em>{errors.name}</em>}
                  </label>

                  <label className="pay-field">
                    <span>Card number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.cardNumber}
                      onChange={update("cardNumber")}
                      placeholder="4242 4242 4242 4242"
                      autoComplete="cc-number"
                    />
                    {errors.cardNumber && <em>{errors.cardNumber}</em>}
                  </label>

                  <div className="pay-row">
                    <label className="pay-field">
                      <span>Expiry</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.expiry}
                        onChange={update("expiry")}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                      />
                      {errors.expiry && <em>{errors.expiry}</em>}
                    </label>
                    <label className="pay-field">
                      <span>CVV</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={form.cvv}
                        onChange={update("cvv")}
                        placeholder="123"
                        autoComplete="cc-csc"
                      />
                      {errors.cvv && <em>{errors.cvv}</em>}
                    </label>
                  </div>

                  <button type="submit" className="pay-submit" disabled={processing}>
                    {processing ? "Processing…" : `Pay ${currency(course.price)}`}
                  </button>
                  <div className="pay-secure">
                    <Icon.Lock /> This is a demo checkout — no card is actually charged.
                  </div>
                </form>
              ) : method === "upi" ? (
                upiRequestSent ? (
                  <div className="pay-upi-waiting">
                    <div className="pay-upi-waiting__icon">
                      <Icon.Phone />
                    </div>
                    <p>
                      Request sent to <strong>{upiId}</strong>
                    </p>
                    <p>Approve it in your UPI app to complete payment…</p>
                  </div>
                ) : (
                  <form onSubmit={submitUpi}>
                    <label className="pay-field">
                      <span>UPI ID</span>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        autoComplete="off"
                      />
                      {upiError && <em>{upiError}</em>}
                    </label>

                    <div className="pay-amount-lock">
                      <span>Amount to pay</span>
                      <strong>{currency(course.price)}</strong>
                    </div>

                    <button type="submit" className="pay-submit" disabled={processing}>
                      {processing ? "Sending request…" : "Send payment request"}
                    </button>
                    <div className="pay-secure">
                      <Icon.Lock /> This is a demo checkout — no money actually moves.
                    </div>
                  </form>
                )
              ) : reviewStatus === "pending" || reviewStatus === "uploading" ? (
                <div className="pay-upi-waiting">
                  <div className="pay-upi-waiting__icon">
                    <Icon.Clock />
                  </div>
                  <p>
                    <strong>Waiting for admin approval</strong>
                  </p>
                  <p>
                    We've sent your payment screenshot to the admin for review. This
                    page will update automatically once it's checked — no need to
                    refresh.
                  </p>
                </div>
              ) : reviewStatus === "declined" ? (
                <div className="pay-upi-waiting">
                  <div className="pay-upi-waiting__icon pay-upi-waiting__icon--declined">
                    <Icon.XCircle />
                  </div>
                  <p>
                    <strong>Payment not received</strong>
                  </p>
                  <p>
                    The admin couldn't verify this payment, so you won't get access
                    to the course. Double-check the amount and try uploading again.
                  </p>
                  <button className="pay-submit" style={{ marginTop: 6 }} onClick={retryScreenshot}>
                    Try again
                  </button>
                </div>
              ) : (
                <form onSubmit={submitScreenshot}>
                  <div className="pay-amount-lock">
                    <span>Amount to pay</span>
                    <strong>{currency(course.price)}</strong>
                  </div>

                  <label className="pay-field">
                    <span>Upload payment screenshot</span>
                    <input type="file" accept="image/*" onChange={handleScreenshotChange} />
                    {screenshotError && <em>{screenshotError}</em>}
                  </label>

                  {screenshotPreview && (
                    <div className="pay-screenshot-preview">
                      <img src={screenshotPreview} alt="Payment screenshot preview" />
                      <div className="pay-screenshot-preview__meta">
                        <span>{screenshotFile?.name} · {formatBytes(screenshotFile?.size)}</span>
                        <button type="button" onClick={clearScreenshot}>Remove</button>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="pay-submit" disabled={!screenshotFile}>
                    Submit for approval
                  </button>
                  <div className="pay-secure">
                    <Icon.Lock /> An admin manually verifies this payment before access is granted.
                  </div>
                </form>
              )}
            </div>

            <div className="pay-card pay-summary">
              <div
                className="pay-summary__cover"
                style={
                  course.thumbnail
                    ? { backgroundImage: `url(${course.thumbnail})` }
                    : { background: `linear-gradient(135deg, ${accent}, #0f172a)` }
                }
              />
              <h3>{course.title}</h3>
              <div className="pay-summary__meta">
                <span className="pay-avatar">{initials(course.instructor)}</span>
                <span>{course.instructor} · {course.level}</span>
              </div>

              <div className="pay-summary__line">
                <span>Course price</span>
                <span>{currency(course.price)}</span>
              </div>
              <div className="pay-summary__line">
                <span>Access</span>
                <span>Lifetime</span>
              </div>
              <div className="pay-summary__total">
                <span>Total due</span>
                <strong>{currency(course.price)}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------
   Add this route wherever your other routes are declared (App.js):

     import Payment from "./Payment";
     ...
     <Route path="/payment/:id" element={<Payment />} />

   It needs to sit alongside the existing <Route path="/courses/:id" .../>.

   ------------------------------------------------------------------
   Backend contract for the Screenshot flow (see server.js):

   POST /courses/:id/payment-screenshot  { screenshot, amount }
     screenshot is a base64 image data URL. Creates a Pending
     PaymentRequest for an admin to review.

   GET /courses/:id/payment-status
     -> { status: "pending" | "approved" | "declined" | null }
        Polled every 4s while status is "pending".

   Admin side: GET /payment-requests and PUT /payment-requests/:id
   { decision: "approve" | "decline" } — approving calls the same
   enroll logic as POST /courses/:id/enroll and grants access;
   declining does not, and the student can resubmit.
   ------------------------------------------------------------------ */