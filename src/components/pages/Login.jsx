import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Login
 * Single-file component — markup, behavior, and styling all live here.
 * Design: an "index card" login set against a navy syllabus panel with a
 * vertical learning-path spine (Explore → Learn → Grow → Achieve), echoing
 * the platform's own /explore and /courses routes.
 */

/* Small inline SVG icon set (stroke-based, currentColor) used inside the
   form fields and step markers in place of plain text glyphs. */
const Icon = {
  User: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <circle cx="10" cy="6.8" r="3.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.8 17c.8-3.3 3-5 6.2-5s5.4 1.7 6.2 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.7 9V6.6a3.3 3.3 0 0 1 6.6 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M4 10h11.5M10.5 5l5.5 5-5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const Login = () => {
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const response = await axios.post("https://course-backend-01ye.onrender.com/login", {
        identifier: userInput,
        password,
      });

      const { token, role, username } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username);

        setMessageType('success');
        setMessage('Login successful! Redirecting...');

        // Route based on the role the SERVER verified, not client input
        setTimeout(() => {
          navigate(role === 'admin' ? '/admin/dashboard' : '/courses');
        }, 800);
      } else {
        setMessageType('error');
        setMessage('Login failed. No token received.');
      }
    } catch (error) {
      console.error(error);
      const errorMsg =
        error?.response?.data?.message || 'Login failed. Invalid credentials.';
      setMessageType('error');
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const pathSteps = ['Explore', 'Learn', 'Grow', 'Achieve'];

  return (
    <div className="lg-screen">
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

        .lg-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: var(--parchment);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--ink);
        }

        /* ---------- Left: syllabus panel ---------- */
        .lg-panel {
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

        .lg-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(245,239,226,0.09) 1px, transparent 0);
          background-size: 22px 22px;
          pointer-events: none;
        }

        .lg-brand {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.15rem;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 1;
        }

        .lg-brand span { color: var(--gold); }

        .lg-headline {
          position: relative;
          z-index: 1;
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          line-height: 1.25;
          max-width: 26rem;
          margin: 2.5rem 0 0;
        }

        .lg-sub {
          position: relative;
          z-index: 1;
          margin-top: 1rem;
          color: rgba(245, 239, 226, 0.68);
          font-size: 0.98rem;
          max-width: 24rem;
          line-height: 1.6;
        }

        /* Signature element: the learning-path spine */
        .lg-path {
          position: relative;
          z-index: 1;
          margin-top: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .lg-path-step {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.65rem 0;
          position: relative;
        }

        .lg-path-step::before {
          content: '';
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 0 4px rgba(185, 135, 59, 0.18);
          flex-shrink: 0;
        }

        .lg-path-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 22px;
          width: 1px;
          height: 24px;
          background: rgba(245, 239, 226, 0.22);
        }

        .lg-path-step span {
          font-size: 0.92rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(245, 239, 226, 0.82);
        }

        .lg-path-step:first-child span {
          color: var(--parchment);
          font-weight: 600;
        }

        .lg-footnote {
          position: relative;
          z-index: 1;
          font-size: 0.8rem;
          color: rgba(245, 239, 226, 0.45);
        }

        /* ---------- Right: index card form ---------- */
        .lg-formside {
          flex: 1 1 58%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.75rem;
        }

        .lg-card {
          position: relative;
          width: 100%;
          max-width: 26rem;
          background: var(--card);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 1px 2px rgba(22,35,63,0.04), 0 18px 40px -22px rgba(22,35,63,0.35);
        }

        /* ribbon tab, the card's "bookmark" */
        .lg-ribbon {
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

        .lg-card-header { margin-top: 0.75rem; }

        .lg-card-header h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: 1.7rem;
          margin: 0 0 0.4rem;
          color: var(--ink);
        }

        .lg-card-header p {
          margin: 0;
          font-size: 0.92rem;
          color: var(--ink-soft);
        }

        .lg-form {
          margin-top: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .lg-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 0.4rem;
        }

        .lg-field-control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lg-field-icon {
          position: absolute;
          left: 0.8rem;
          display: flex;
          align-items: center;
          color: #A8A196;
          pointer-events: none;
        }

        .lg-field input {
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

        .lg-field input::placeholder { color: #A8A196; }

        .lg-field input:hover { border-color: rgba(22,35,63,0.28); }

        .lg-field input:focus {
          background: #fff;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 135, 59, 0.18);
        }

        .lg-field input:focus ~ .lg-field-icon,
        .lg-field-control:focus-within .lg-field-icon {
          color: var(--gold);
        }

        .lg-row-between {
          display: flex;
          justify-content: flex-end;
          margin-top: -0.5rem;
        }

        .lg-link {
          font-size: 0.85rem;
          color: var(--teal);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s ease;
        }

        .lg-link:hover { border-color: var(--teal); }
        .lg-link:focus-visible,
        .lg-submit:focus-visible,
        .lg-field input:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .lg-submit {
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

        .lg-submit:hover:not(:disabled) { background: #1F3055; }
        .lg-submit:active:not(:disabled) { transform: translateY(1px); }

        .lg-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .lg-message {
          margin: 1.1rem 0 0;
          padding: 0.65rem 0.85rem;
          border-radius: 3px;
          font-size: 0.88rem;
          border: 1px solid transparent;
        }

        .lg-message.success {
          color: var(--teal);
          background: rgba(47, 111, 98, 0.08);
          border-color: rgba(47, 111, 98, 0.25);
        }

        .lg-message.error {
          color: var(--rose);
          background: rgba(166, 66, 61, 0.08);
          border-color: rgba(166, 66, 61, 0.25);
        }

        .lg-register {
          margin: 1.6rem 0 0;
          text-align: center;
          font-size: 0.88rem;
          color: var(--ink-soft);
        }

        .lg-register a {
          color: var(--ink);
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid var(--gold);
        }

        @media (max-width: 860px) {
          .lg-screen { flex-direction: column; }
          .lg-panel { padding: 2.75rem 2rem 2.25rem; }
          .lg-path { margin-top: 2rem; }
          .lg-formside { padding: 2.5rem 1.25rem 3rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lg-submit, .lg-link, .lg-field input { transition: none; }
        }
      `}</style>

      <div className="lg-panel">
        <div className="lg-brand">Skillfull<span>Technologies</span></div>

        <div>
          <h1 className="lg-headline">Pick up right where your last lesson left off.</h1>
          <p className="lg-sub">
            One login keeps your progress, notes, and certificates in sync across every course you're taking.
          </p>

          <div className="lg-path">
            {pathSteps.map((step) => (
              <div className="lg-path-step" key={step}>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="lg-footnote">© {new Date().getFullYear()} Skillfull Technologies. Keep learning.</p>
      </div>

      <div className="lg-formside">
        <div className="lg-card">
          <div className="lg-ribbon">Log in</div>

          <div className="lg-card-header">
            <h2>Welcome back</h2>
            <p>Log in to continue exploring your courses.</p>
          </div>

          <form onSubmit={handleSubmit} className="lg-form" noValidate>
            <div className="lg-field">
              <label htmlFor="userInput">Username or email</label>
              <div className="lg-field-control">
                <span className="lg-field-icon"><Icon.User /></span>
                <input
                  type="text"
                  id="userInput"
                  placeholder="Enter your username or email"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="lg-field">
              <label htmlFor="password">Password</label>
              <div className="lg-field-control">
                <span className="lg-field-icon"><Icon.Lock /></span>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="lg-row-between">
              <Link to="/forgot-password" className="lg-link">
  Forgot password?
</Link>
            </div>

            <button type="submit" className="lg-submit" disabled={submitting}>
              {submitting ? 'Logging in…' : (
                <>
                  Log in <Icon.ArrowRight />
                </>
              )}
            </button>
          </form>

          {message && (
            <p className={`lg-message ${messageType === 'success' ? 'success' : 'error'}`}>
              {message}
            </p>
          )}

          <p className="lg-register">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;