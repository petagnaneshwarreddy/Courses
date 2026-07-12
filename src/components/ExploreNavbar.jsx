import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../images/logo.png';

const ExploreNavbar = () => {
  return (
    <nav className="explore-nav">
      {/* animated background accents */}
      <div className="nav-glow nav-glow-1" />
      <div className="nav-glow nav-glow-2" />

      {/* LOGO */}
      <div className="logo-wrapper">
        <div className="logo-ring">
          <img src={logo} alt="Logo" className="logo" />
        </div>
      </div>

      <ul className="nav-list">
        {[
          // { to: '/explore', label: 'Compiler' },
          { to: '/explore/login', label: 'Login' },
          { to: '/explore/register', label: 'Register' },
        ].map((item, i) => (
          <li
            key={item.to}
            className="nav-item"
            style={{ animationDelay: `${0.35 + i * 0.12}s` }}
          >
            <Link to={item.to} className="nav-link">
              <span className="nav-link-text">{item.label}</span>
              <span className="nav-link-bracket nav-link-bracket-l"></span>
              <span className="nav-link-bracket nav-link-bracket-r"></span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        <span className="nav-footer-dot" />
        <span className="nav-footer-text">explore</span>
      </div>

      <style>{`
        :root {
          --nav-bg-1: #14102b;
          --nav-bg-2: #1f1840;
          --nav-accent: #7dffd6;
          --nav-accent-2: #a78bfa;
          --nav-text: #e7e3ff;
          --nav-text-dim: #8b83b8;
        }

        * {
          box-sizing: border-box;
        }

        /* default: sidebar for large screens */
        .explore-nav {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 32px;
          overflow: hidden;
          background: linear-gradient(165deg, var(--nav-bg-1) 0%, var(--nav-bg-2) 60%, #241a4a 100%);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35), inset -1px 0 0 rgba(167, 139, 250, 0.15);
          transform: translateX(-220px);
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 100;
        }

        /* ambient glow blobs */
        .nav-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.35;
          pointer-events: none;
          animation: drift 9s ease-in-out infinite;
        }
        .nav-glow-1 {
          width: 160px;
          height: 160px;
          background: var(--nav-accent-2);
          top: -40px;
          left: -60px;
          animation-delay: 0s;
        }
        .nav-glow-2 {
          width: 140px;
          height: 140px;
          background: var(--nav-accent);
          bottom: 60px;
          right: -60px;
          animation-delay: 3s;
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -20px) scale(1.15); }
        }

        .logo-wrapper {
          margin-bottom: 48px;
          opacity: 0;
          animation: fadeDown 0.6s ease-out 0.15s forwards;
          position: relative;
          z-index: 1;
        }

        .logo-ring {
          padding: 10px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(167, 139, 250, 0.25);
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .logo-ring:hover {
          transform: scale(1.05) rotate(-2deg);
          border-color: var(--nav-accent);
          box-shadow: 0 0 22px rgba(125, 255, 214, 0.25);
        }

        .logo {
          width: 150px;
          height: auto;
          display: block;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
        }

        .nav-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .nav-item {
          margin-bottom: 28px;
          opacity: 0;
          transform: translateX(-16px);
          animation: fadeSlideIn 0.5s ease-out forwards;
        }

        .nav-link {
          position: relative;
          text-decoration: none;
          color: var(--nav-text);
          font-family: 'Courier New', monospace;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          transition: color 0.25s ease;
        }

        .nav-link-bracket {
          color: var(--nav-accent);
          opacity: 0;
          font-weight: 400;
          transform: translateX(-4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .nav-link-bracket-r {
          transform: translateX(4px);
        }

        .nav-link-text {
          position: relative;
          transition: transform 0.25s ease;
        }

        .nav-link-text::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, var(--nav-accent), var(--nav-accent-2));
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-link:hover .nav-link-text {
          transform: translateY(-1px);
        }

        .nav-link:hover .nav-link-text::after {
          transform: scaleX(1);
        }

        .nav-link:hover .nav-link-bracket {
          opacity: 1;
          transform: translateX(0);
        }

        .nav-link:active .nav-link-text {
          transform: translateY(0) scale(0.97);
        }

        .nav-footer {
          margin-top: auto;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: fadeDown 0.6s ease-out 0.7s forwards;
          position: relative;
          z-index: 1;
        }

        .nav-footer-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--nav-accent);
          box-shadow: 0 0 8px var(--nav-accent);
          animation: pulse 2s ease-in-out infinite;
        }

        .nav-footer-text {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--nav-text-dim);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideIn {
          from { transform: translateX(-220px); }
          to { transform: translateX(0); }
        }

        /* mobile/tablet: top bar */
        @media (max-width: 768px) {
          .explore-nav {
            height: auto;
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            transform: none;
            animation: fadeDown 0.5s ease-out forwards;
          }
          .nav-glow {
            display: none;
          }
          .logo-wrapper {
            margin-bottom: 0;
            animation-delay: 0.05s;
          }
          .logo-ring {
            padding: 6px;
            border-radius: 14px;
          }
          .logo {
            width: 110px;
          }
          .nav-list {
            display: flex;
            gap: 22px;
            margin: 0;
          }
          .nav-item {
            margin-bottom: 0;
            animation-delay: 0.1s !important;
          }
          .nav-footer {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .explore-nav,
          .nav-glow,
          .logo-wrapper,
          .nav-item,
          .nav-footer,
          .nav-footer-dot {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default ExploreNavbar;