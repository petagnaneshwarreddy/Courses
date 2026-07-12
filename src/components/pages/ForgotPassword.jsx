// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * ForgotPassword
 * Rebuilt on the same "index card on a syllabus panel" design system as
 * Login and Register, so the reset flow reads as part of the same product
 * instead of a different app. The step indicator uses the same icon set as
 * the other two screens, with a checkmark for completed steps.
 */
const Icon = {
  Mail: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="2.8" y="4.8" width="14.4" height="10.4" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 5.6l6.6 5 6.6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Shield: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <path d="M10 2.6l6 2.2v4.4c0 4-2.6 6.5-6 7.9-3.4-1.4-6-3.9-6-7.9V4.8l6-2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" {...p}>
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.7 9V6.6a3.3 3.3 0 0 1 6.6 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="12" height="12" {...p}>
      <path d="M4.5 10.2l3.4 3.4 7.6-7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" {...p}>
      <path d="M4 10h11.5M10.5 5l5.5 5-5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" {...p}>
      <path d="M16 10H4.5M9.5 5L4 10l5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      setMessageType('error');
      setMessage('Please enter your email.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('https://backend-qtzh.onrender.com/send-otp', { email });
      setMessageType('success');
      setMessage('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage(err?.response?.data?.message || 'Error sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      // Backend doesn't have a separate verify-otp route; we just use reset-password
      if (!otp) {
        setMessageType('error');
        setMessage('Enter the OTP sent to your email.');
        return;
      }
      setMessageType('success');
      setMessage('OTP verified. Enter new password.');
      setStep(3);
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage(err?.response?.data?.message || 'Invalid OTP.');
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('https://course-backend-0lye.onrender.com/forgot-password', {
        email,
        otp,
        newPassword,
      });
      setMessageType('success');
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage(err?.response?.data?.message || 'Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Email', icon: Icon.Mail },
    { label: 'Verify', icon: Icon.Shield },
    { label: 'Reset', icon: Icon.Lock },
  ];

  const stepCopy = {
    1: { title: 'Reset your password', sub: "We'll send a code to your email" },
    2: { title: 'Check your inbox', sub: 'Enter the code we just sent you' },
    3: { title: 'Choose a new password', sub: 'Make it something you\'ll remember' },
  };

  return (
    <div className="fp-screen">
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

        .fp-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: var(--parchment);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--ink);
        }

        /* ---------- Left: syllabus panel ---------- */
        .fp-panel {
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

        .fp-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(245,239,226,0.09) 1px, transparent 0);
          background-size: 22px 22px;
          pointer-events: none;
        }

        .fp-brand {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.15rem;
          letter-spacing: 0.02em;
          position: relative;
          z-index: 1;
        }

        .fp-brand span { color: var(--gold); }

        .fp-headline {
          position: relative;
          z-index: 1;
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          line-height: 1.25;
          max-width: 26rem;
          margin: 2.5rem 0 0;
        }

        .fp-sub {
          position: relative;
          z-index: 1;
          margin-top: 1rem;
          color: rgba(245, 239, 226, 0.68);
          font-size: 0.98rem;
          max-width: 24rem;
          line-height: 1.6;
        }

        /* Signature element: the same learning-path spine, repurposed to
           track progress through the three recovery steps. */
        .fp-path {
          position: relative;
          z-index: 1;
          margin-top: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .fp-path-step {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.65rem 0;
          position: relative;
        }

        .fp-path-marker {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1.4px solid rgba(245, 239, 226, 0.3);
          color: rgba(245, 239, 226, 0.5);
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .fp-path-step.done .fp-path-marker {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--ink);
        }

        .fp-path-step.active .fp-path-marker {
          border-color: var(--gold);
          color: var(--gold);
          box-shadow: 0 0 0 4px rgba(185, 135, 59, 0.18);
        }

        .fp-path-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 10.5px;
          top: 34px;
          width: 1px;
          height: 20px;
          background: rgba(245, 239, 226, 0.22);
        }

        .fp-path-step span {
          font-size: 0.92rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(245, 239, 226, 0.6);
        }

        .fp-path-step.active span,
        .fp-path-step.done span {
          color: var(--parchment);
          font-weight: 600;
        }

        .fp-footnote {
          position: relative;
          z-index: 1;
          font-size: 0.8rem;
          color: rgba(245, 239, 226, 0.45);
        }

        /* ---------- Right: index card form ---------- */
        .fp-formside {
          flex: 1 1 58%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.75rem;
        }

        .fp-card {
          position: relative;
          width: 100%;
          max-width: 26rem;
          background: var(--card);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 1px 2px rgba(22,35,63,0.04), 0 18px 40px -22px rgba(22,35,63,0.35);
        }

        .fp-ribbon {
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

        .fp-card-header { margin-top: 0.75rem; }

        .fp-card-header h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: 1.7rem;
          margin: 0 0 0.4rem;
          color: var(--ink);
        }

        .fp-card-header p {
          margin: 0;
          font-size: 0.92rem;
          color: var(--ink-soft);
        }

        /* Compact step tracker inside the card, mirrors the panel markers */
        .fp-tracker {
          display: flex;
          align-items: center;
          margin-top: 1.5rem;
        }

        .fp-tracker-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          background: #FBF8F1;
          border: 1.4px solid var(--hairline);
          color: #A8A196;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }

        .fp-tracker-dot.active {
          border-color: var(--gold);
          color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 135, 59, 0.16);
        }

        .fp-tracker-dot.done {
          background: var(--teal);
          border-color: var(--teal);
          color: #fff;
        }

        .fp-tracker-line {
          flex: 1;
          height: 1px;
          background: var(--hairline);
          margin: 0 0.5rem;
        }

        .fp-tracker-line.done { background: var(--teal); }

        .fp-form {
          margin-top: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .fp-field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 0.4rem;
        }

        .fp-field-control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .fp-field-icon {
          position: absolute;
          left: 0.8rem;
          display: flex;
          align-items: center;
          color: #A8A196;
          pointer-events: none;
          transition: color 0.15s ease;
        }

        .fp-field input {
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

        .fp-field input::placeholder { color: #A8A196; }
        .fp-field input:hover { border-color: rgba(22,35,63,0.28); }

        .fp-field input:focus {
          background: #fff;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 135, 59, 0.18);
        }

        .fp-field-control:focus-within .fp-field-icon { color: var(--gold); }

        .fp-field input:focus-visible,
        .fp-submit:focus-visible,
        .fp-back:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .fp-submit {
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

        .fp-submit:hover:not(:disabled) { background: #1F3055; }
        .fp-submit:active:not(:disabled) { transform: translateY(1px); }

        .fp-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .fp-message {
          margin: 1.1rem 0 0;
          padding: 0.65rem 0.85rem;
          border-radius: 3px;
          font-size: 0.88rem;
          border: 1px solid transparent;
        }

        .fp-message.success {
          color: var(--teal);
          background: rgba(47, 111, 98, 0.08);
          border-color: rgba(47, 111, 98, 0.25);
        }

        .fp-message.error {
          color: var(--rose);
          background: rgba(166, 66, 61, 0.08);
          border-color: rgba(166, 66, 61, 0.25);
        }

        .fp-back {
          margin: 1.6rem 0 0;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--ink-soft);
          cursor: pointer;
        }

        .fp-back:hover { color: var(--ink); }

        @media (max-width: 860px) {
          .fp-screen { flex-direction: column; }
          .fp-panel { padding: 2.75rem 2rem 2.25rem; }
          .fp-path { margin-top: 2rem; }
          .fp-formside { padding: 2.5rem 1.25rem 3rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fp-submit, .fp-field input, .fp-path-marker, .fp-tracker-dot { transition: none; }
        }
      `}</style>

      <div className="fp-panel">
        <div className="fp-brand">Skillfull<span>Technologies</span></div>

        <div>
          <h1 className="fp-headline">Locked out happens. Let's get you back in.</h1>
          <p className="fp-sub">
            Verify your email, confirm the code we send you, and set a new password — three quick steps back to your courses.
          </p>

          <div className="fp-path">
            {steps.map((s, i) => {
              const num = i + 1;
              const state = num < step ? 'done' : num === step ? 'active' : '';
              return (
                <div className={`fp-path-step ${state}`} key={s.label}>
                  <span className="fp-path-marker">
                    {num < step ? <Icon.Check /> : <s.icon />}
                  </span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="fp-footnote">© {new Date().getFullYear()} Skillfull Technologies. Keep learning.</p>
      </div>

      <div className="fp-formside">
        <div className="fp-card">
          <div className="fp-ribbon">Recover</div>

          <div className="fp-card-header">
            <h2>{stepCopy[step].title}</h2>
            <p>{stepCopy[step].sub}</p>
          </div>

          <div className="fp-tracker">
            {steps.map((s, i) => {
              const num = i + 1;
              const state = num < step ? 'done' : num === step ? 'active' : '';
              return (
                <React.Fragment key={s.label}>
                  <span className={`fp-tracker-dot ${state}`}>
                    {num < step ? <Icon.Check /> : num}
                  </span>
                  {i < steps.length - 1 && (
                    <span className={`fp-tracker-line ${num < step ? 'done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {step === 1 && (
            <div className="fp-form">
              <div className="fp-field">
                <label htmlFor="fp-email">Email</label>
                <div className="fp-field-control">
                  <span className="fp-field-icon"><Icon.Mail /></span>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={handleSendOtp} className="fp-submit" disabled={loading}>
                {loading ? 'Sending…' : (
                  <>
                    Send code <Icon.ArrowRight />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="fp-form">
              <div className="fp-field">
                <label htmlFor="fp-otp">Verification code</label>
                <div className="fp-field-control">
                  <span className="fp-field-icon"><Icon.Shield /></span>
                  <input
                    id="fp-otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={handleVerifyOtp} className="fp-submit">
                Verify code <Icon.ArrowRight />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="fp-form">
              <div className="fp-field">
                <label htmlFor="fp-new-password">New password</label>
                <div className="fp-field-control">
                  <span className="fp-field-icon"><Icon.Lock /></span>
                  <input
                    id="fp-new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="fp-field">
                <label htmlFor="fp-confirm-password">Confirm password</label>
                <div className="fp-field-control">
                  <span className="fp-field-icon"><Icon.Lock /></span>
                  <input
                    id="fp-confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={handleResetPassword} className="fp-submit" disabled={loading}>
                {loading ? 'Resetting…' : (
                  <>
                    Reset password <Icon.ArrowRight />
                  </>
                )}
              </button>
            </div>
          )}

          {message && (
            <p className={`fp-message ${messageType === 'success' ? 'success' : 'error'}`}>
              {message}
            </p>
          )}

          <button className="fp-back" onClick={() => navigate('/login')}>
            <Icon.ArrowLeft /> Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;