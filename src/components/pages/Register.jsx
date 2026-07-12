import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

/**
 * Register
 * Single-file component — markup, behavior, and styling all live here.
 * Shares the "index card on a syllabus panel" design system used on Login,
 * so the two screens read as one product.
 */

/* Same stroke-based, currentColor icon set used on Login — kept local to
   the component so each page stays self-contained. */
const Icon = {
  User: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <circle cx="10" cy="6.8" r="3.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.8 17c.8-3.3 3-5 6.2-5s5.4 1.7 6.2 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="2.8" y="4.8" width="14.4" height="10.4" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 5.6l6.6 5 6.6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.7 9V6.6a3.3 3.3 0 0 1 6.6 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  ShieldCheck: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M10 2.6l6 2.2v4.4c0 4-2.6 6.5-6 7.9-3.4-1.4-6-3.9-6-7.9V4.8l6-2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.4 9.8l1.9 1.9 3.4-3.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M4 10h11.5M10.5 5l5.5 5-5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== rePassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await axios.post(
        "https://course-backend-01ye.onrender.com/register",
        {
          username,
          email,
          password,
        }
      );

      setMessageType("success");
      setMessage(res.data.message || "Registration successful.");

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("username", res.data.username);
      }

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const pathSteps = ["Explore", "Learn", "Grow", "Achieve"];

  return (
    <div className="rg-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --ink: #16233F;
          --ink-soft: #4B5A78;
          --parchment: #F5EFE2;
          --card: #FFFDF8;
          --gold: #B9873B;
          --teal: #2F6F62;
          --rose: #A6423D;
          --hairline: rgba(22, 35, 63, 0.14);
        }

        * { box-sizing: border-box; }

        .rg-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: var(--parchment);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--ink);
        }

        /* ---------- Left: syllabus panel ---------- */
        .rg-panel {
          position: relative;
          flex: 1 1 42%;
          min-width: 320px;
          background: var(--ink);
          color: var(--parchment);
          padding: 4rem 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .rg-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(245,239,226,0.09) 1px, transparent 0);
          background-size: 22px 22px;
          pointer-events: none;
        }

        .rg-brand {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.15rem;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 1;
        }

        .rg-brand span { color: var(--gold); }

        .rg-headline {
          position: relative;
          z-index: 1;
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          line-height: 1.25;
          max-width: 26rem;
          margin: 2.5rem 0 0;
        }

        .rg-sub {
          position: relative;
          z-index: 1;
          margin-top: 1rem;
          color: rgba(245, 239, 226, 0.68);
          font-size: 0.98rem;
          max-width: 24rem;
          line-height: 1.6;
        }

        /* Signature element: the learning-path spine */
        .rg-path {
          position: relative;
          z-index: 1;
          margin-top: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .rg-path-step {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.65rem 0;
          position: relative;
        }

        .rg-path-step::before {
          content: '';
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(185, 135, 59, 0.18);
          flex-shrink: 0;
        }

        .rg-path-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 22px;
          width: 1px;
          height: 24px;
          background: rgba(245, 239, 226, 0.22);
        }

        .rg-path-step span {
          font-size: 0.92rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(245, 239, 226, 0.82);
        }

        .rg-footnote {
          position: relative;
          z-index: 1;
          font-size: 0.8rem;
          color: rgba(245, 239, 226, 0.45);
        }

        /* ---------- Right: index card form ---------- */
        .rg-formside {
          flex: 1 1 58%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.75rem;
        }

        .rg-card {
          position: relative;
          width: 100%;
          max-width: 30rem;
          background: var(--card);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 1px 2px rgba(22,35,63,0.04), 0 18px 40px -22px rgba(22,35,63,0.35);
        }

        /* ribbon tab, the card's "bookmark" */
        .rg-ribbon {
          position: absolute;
          top: -1px;
          left: 2.5rem;
          background: var(--gold);
          color: var(--ink);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.4rem 0.85rem 0.5rem;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
        }

        .rg-card-header { margin-top: 0.75rem; }

        .rg-card-header h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: 1.7rem;
          margin: 0 0 0.4rem;
          color: var(--ink);
        }

        .rg-card-header p {
          margin: 0;
          font-size: 0.92rem;
          color: var(--ink-soft);
        }

        .rg-form {
          margin-top: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .rg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
        }

        .rg-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 0.4rem;
        }

        .rg-field-control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .rg-field-icon {
          position: absolute;
          left: 0.8rem;
          display: flex;
          align-items: center;
          color: #A8A196;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .rg-field input {
          width: 100%;
          padding: 0.72rem 0.85rem 0.72rem 2.35rem;
          font-size: 0.96rem;
          font-family: inherit;
          color: var(--ink);
          background: #FBF8F1;
          border: 1px solid var(--hairline);
          border-radius: 3px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .rg-field input::placeholder { color: #A8A196; }

        .rg-field input:hover { border-color: rgba(22,35,63,0.28); }

        .rg-field input:focus {
          background: #fff;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 135, 59, 0.18);
        }

        .rg-field-control:focus-within .rg-field-icon {
          color: var(--gold);
        }

        .rg-field input:focus-visible,
        .rg-submit:focus-visible,
        .rg-login-link:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .rg-submit {
          margin-top: 0.4rem;
          width: 100%;
          padding: 0.85rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--parchment);
          background: var(--ink);
          border: none;
          border-radius: 3px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .rg-submit:hover:not(:disabled) { background: #1F3055; }
        .rg-submit:active:not(:disabled) { transform: translateY(1px); }

        .rg-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .rg-message {
          margin: 1.1rem 0 0;
          padding: 0.65rem 0.85rem;
          border-radius: 3px;
          font-size: 0.88rem;
          border: 1px solid transparent;
        }

        .rg-message.success {
          color: var(--teal);
          background: rgba(47, 111, 98, 0.08);
          border-color: rgba(47, 111, 98, 0.25);
        }

        .rg-message.error {
          color: var(--rose);
          background: rgba(166, 66, 61, 0.08);
          border-color: rgba(166, 66, 61, 0.25);
        }

        .rg-login-redirect {
          margin: 1.6rem 0 0;
          text-align: center;
          font-size: 0.88rem;
          color: var(--ink-soft);
        }

        .rg-login-link {
          color: var(--ink);
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid var(--gold);
        }

        @media (max-width: 860px) {
          .rg-screen { flex-direction: column; }
          .rg-panel { padding: 2.75rem 2rem 2.25rem; }
          .rg-path { margin-top: 2rem; }
          .rg-formside { padding: 2.5rem 1.25rem 3rem; }
        }

        @media (max-width: 520px) {
          .rg-row { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rg-submit, .rg-field input { transition: none; }
        }
      `}</style>

      <div className="rg-panel">
        <div className="rg-brand">
          Skillfull<span>Technologies</span>
        </div>

        <div>
          <h1 className="rg-headline">
            Start a course, keep the record of everything you've learned.
          </h1>
          <p className="rg-sub">
            Create an account to track progress, save certificates, and pick up any lesson right where you left it.
          </p>

          <div className="rg-path">
            {pathSteps.map((step) => (
              <div className="rg-path-step" key={step}>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="rg-footnote">
          © {new Date().getFullYear()} Skillfull Technologies. Keep learning.
        </p>
      </div>

      <div className="rg-formside">
        <div className="rg-card">
          <div className="rg-ribbon">Sign up</div>

          <div className="rg-card-header">
            <h2>Create account</h2>
            <p>Sign up to continue exploring.</p>
          </div>

          <form onSubmit={handleSubmit} className="rg-form" noValidate>
            <div className="rg-field">
              <label htmlFor="username">Username</label>
              <div className="rg-field-control">
                <span className="rg-field-icon"><Icon.User /></span>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="rg-field">
              <label htmlFor="email">Email</label>
              <div className="rg-field-control">
                <span className="rg-field-icon"><Icon.Mail /></span>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rg-row">
              <div className="rg-field">
                <label htmlFor="password">Password</label>
                <div className="rg-field-control">
                  <span className="rg-field-icon"><Icon.Lock /></span>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rg-field">
                <label htmlFor="rePassword">Confirm password</label>
                <div className="rg-field-control">
                  <span className="rg-field-icon"><Icon.Lock /></span>
                  <input
                    type="password"
                    id="rePassword"
                    placeholder="Confirm password"
                    value={rePassword}
                    onChange={(e) => setRePassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="rg-submit" disabled={submitting}>
              {submitting ? "Creating account…" : (
                <>
                  Register <Icon.ArrowRight />
                </>
              )}
            </button>
          </form>

          {message && (
            <p className={`rg-message ${messageType === "success" ? "success" : "error"}`}>
              {message}
            </p>
          )}

          <p className="rg-login-redirect">
            Already have an account? <Link to="/login" className="rg-login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;