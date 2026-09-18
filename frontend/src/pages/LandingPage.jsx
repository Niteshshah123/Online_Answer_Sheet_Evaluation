import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

/* ── Amrita Logo ── */
const AmritaEmblem = () => (
  <img
    src="/uploads/images/logo.png"
    alt="Amrita Logo"
    className="lp-brand-logo-img"
  />
);

/* ── Golden Lotus Icon for Trust Bar ── */
const GoldenLotus = () => (
  <svg width="34" height="34" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8c-2 6-6 12-14 16 7 2 13 0 14-8 1 8 7 10 14 8-8-4-12-10-14-16z" fill="#C9A84C" />
    <path d="M24 16c-3 8-10 14-20 16 9 3 17 0 20-9 3 9 11 12 20 9-10-2-17-8-20-16z" fill="#B4873B" />
    <path d="M24 24c-4 9-14 14-22 14 9 4 19 2 22-8 3 10 13 12 22 8-8 0-18-5-22-14z" fill="#9A6F29" />
    <circle cx="24" cy="38" r="2" fill="#C9A84C" />
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const dark = theme?.dark ?? false;
  const toggleTheme = theme?.toggle ?? (() => {});

  // Active session check
  const [activeAdmin, setActiveAdmin] = useState(false);
  const [activeFaculty, setActiveFaculty] = useState(false);
  const [activeStudent, setActiveStudent] = useState(false);

  useEffect(() => {
    try {
      setActiveAdmin(Boolean(localStorage.getItem('adminToken')));
      setActiveFaculty(Boolean(localStorage.getItem('facultyToken')));
      setActiveStudent(Boolean(localStorage.getItem('studentToken')));
    } catch {
      // storage unavailable
    }
  }, []);

  return (
    <div className="landing-root">
      {/* ─────────────────────────────────────────
          TOP HEADER
      ───────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-container">
          {/* Brand Left */}
          <div className="lp-brand" onClick={() => navigate('/')}>
            <AmritaEmblem />
            <div className="lp-brand-titles">
              <span className="lp-brand-main">AMRITA</span>
              <span className="lp-brand-sub">VISHWA VIDYAPEETHAM</span>
            </div>
            <div className="lp-brand-divider" />
            <div className="lp-brand-dept">
              <span className="lp-dept-name">Examination Cell</span>
              <span className="lp-dept-sub">Online Answer Sheet Valuation System</span>
            </div>
          </div>

          {/* Actions Right */}
          <div className="lp-header-right">
            <div className="lp-theme-switch-wrap" onClick={toggleTheme} role="button" tabIndex={0}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lp-moon-icon">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="lp-theme-label">Dark Mode</span>
              <div className={`lp-toggle-pill ${dark ? 'active' : ''}`}>
                <div className="lp-toggle-thumb" />
              </div>
            </div>

            <div className="lp-header-divider" />

            <button className="lp-help-btn" title="Help & Documentation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Help</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────
          ACTIVE SESSION BAR (IF LOGGED IN)
      ───────────────────────────────────────── */}
      {(activeAdmin || activeFaculty || activeStudent) && (
        <div className="gov-active-bar">
          <div className="lp-header-container gov-active-inner">
            <span className="gov-active-msg">
              <strong>Active Session:</strong> You are currently logged into an account.
            </span>
            <div className="gov-active-links">
              {activeAdmin && <Link to="/dashboard" className="gov-active-link">Admin Dashboard →</Link>}
              {activeFaculty && <Link to="/faculty/dashboard" className="gov-active-link">Faculty Workplace →</Link>}
              {activeStudent && <Link to="/student/dashboard" className="gov-active-link">Student Portal →</Link>}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          HERO SECTION WITH CAMPUS IMAGE
      ───────────────────────────────────────── */}
      <section className="lp-hero-banner">
        {/* Background photo */}
        <div className="lp-hero-bg-img" />

        {/* Faint watermark sketch in background */}
        <div className="lp-hero-sketch-watermark" />

        {/* Seamless light gradient mask on left */}
        <div className="lp-hero-gradient-overlay" />

        {/* Hero Content on Left */}
        <div className="lp-header-container lp-hero-content-wrap">
          <div className="lp-hero-textbox">
            <div className="lp-hero-kicker">
              <span className="lp-kicker-dash" />
              A SECURE & CENTRALIZED EVALUATION PLATFORM
            </div>

            <h1 className="lp-hero-headline">
              Academic Integrity<br />
              Builds <span className="lp-hero-gold-script">Brighter Futures</span>
            </h1>

            <div className="lp-hero-product-title">
              Online Answer Sheet Valuation System
            </div>
            <p className="lp-hero-product-desc">
              Streamlining evaluation. Empowering faculty. Ensuring transparency.
            </p>

            {/* Feature Pills */}
            <div className="lp-hero-pills">
              <div className="lp-pill-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="lp-pill-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Role-based Access</span>
              </div>
              <div className="lp-pill-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>Transparent</span>
              </div>
              <div className="lp-pill-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <span>For a Better Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          3 PORTAL CARDS (OVERLAPPING HERO)
      ───────────────────────────────────────── */}
      <section className="lp-cards-section">
        <div className="lp-header-container">
          <div className="lp-portals-grid">

            {/* ── CARD 1: FACULTY EVALUATOR PORTAL ── */}
            <div className="lp-portal-card" onClick={() => navigate('/faculty/login')}>
              <div className="lp-card-top">
                <div className="lp-card-icon-box faculty">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                </div>
                <span className="lp-role-pill faculty">FACULTY</span>
              </div>

              <h2 className="lp-card-heading">Faculty Evaluator Portal</h2>
              <p className="lp-card-summary">
                Evaluate assigned answer sheets with an intuitive workspace, view question-wise allocation, access answer scripts and keys, and submit marks securely.
              </p>

              <button
                className="lp-signin-btn faculty"
                onClick={(e) => { e.stopPropagation(); navigate('/faculty/login'); }}
              >
                <span>Sign In to Faculty Workspace</span>
                <span className="lp-btn-arrow">→</span>
              </button>

              <div className="lp-card-features">
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>View<br />Assigned Papers</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>Evaluate<br />& Submit</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span>Track<br />Progress</span>
                </div>
              </div>
            </div>

            {/* ── CARD 2: STUDENT RESULTS PORTAL ── */}
            <div className="lp-portal-card" onClick={() => navigate('/student/login')}>
              <div className="lp-card-top">
                <div className="lp-card-icon-box student">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <span className="lp-role-pill student">STUDENT</span>
              </div>

              <h2 className="lp-card-heading">Student Results Portal</h2>
              <p className="lp-card-summary">
                Access your examination results, view question-wise marks, evaluator remarks, raw and final scores, and stay updated with your evaluation status.
              </p>

              <button
                className="lp-signin-btn student"
                onClick={(e) => { e.stopPropagation(); navigate('/student/login'); }}
              >
                <span>Sign In to Student Results</span>
                <span className="lp-btn-arrow">→</span>
              </button>

              <div className="lp-card-features">
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                  <span>View<br />Results</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>Question-wise<br />Breakdown</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Download<br />Scorecard</span>
                </div>
              </div>
            </div>

            {/* ── CARD 3: EXAMINATION CELL CONSOLE ── */}
            <div className="lp-portal-card" onClick={() => navigate('/login')}>
              <div className="lp-card-top">
                <div className="lp-card-icon-box admin">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <span className="lp-role-pill admin">ADMINISTRATION</span>
              </div>

              <h2 className="lp-card-heading">Examination Cell Console</h2>
              <p className="lp-card-summary">
                Manage examinations, import data, map faculty, monitor evaluation progress, handle unlock requests, publish results, and access audit logs.
              </p>

              <button
                className="lp-signin-btn admin"
                onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
              >
                <span>Sign In as Administrator</span>
                <span className="lp-btn-arrow">→</span>
              </button>

              <div className="lp-card-features">
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span>Manage<br />Faculty</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Import<br />& Configure</span>
                </div>
                <div className="lp-feature-col">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span>Monitor<br />& Publish</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          INSTITUTIONAL TRUST BAR WITH SKETCH WATERMARK
      ───────────────────────────────────────── */}
      <section className="lp-trust-section">
        <div className="lp-header-container lp-trust-container">

          {/* Left Values Strip */}
          <div className="lp-trust-values">
            {/* Value 1: Lotus */}
            <div className="lp-val-item">
              <GoldenLotus />
              <div className="lp-val-text">
                <span className="lp-val-bold">Excellence in Assessment.</span>
                <span className="lp-val-sub">Empowering Lives.</span>
              </div>
            </div>

            <div className="lp-val-divider" />

            {/* Value 2: Shield */}
            <div className="lp-val-item">
              <div className="lp-val-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="lp-val-text">
                <span className="lp-val-bold">Trusted by</span>
                <span className="lp-val-sub">Amrita Community</span>
              </div>
            </div>

            <div className="lp-val-divider" />

            {/* Value 3: Users */}
            <div className="lp-val-item">
              <div className="lp-val-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="lp-val-text">
                <span className="lp-val-bold">Secure & Reliable</span>
                <span className="lp-val-sub">Evaluation</span>
              </div>
            </div>

            <div className="lp-val-divider" />

            {/* Value 4: Document */}
            <div className="lp-val-item">
              <div className="lp-val-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <div className="lp-val-text">
                <span className="lp-val-bold">Transparent</span>
                <span className="lp-val-sub">Process</span>
              </div>
            </div>

            <div className="lp-val-divider" />

            {/* Value 5: Heart */}
            <div className="lp-val-item">
              <div className="lp-val-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div className="lp-val-text">
                <span className="lp-val-bold">For a Brighter</span>
                <span className="lp-val-sub">Tomorrow</span>
              </div>
            </div>
          </div>

          {/* Right Watermark Sketch Area */}
          <div className="lp-trust-sketch-area">
            <img
              src="/uploads/images/College_Watermark.png"
              alt="Amrita Vishwa Vidyapeetham"
              className="lp-trust-watermark-img"
            />
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────
          BOTTOM FOOTER
      ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-header-container lp-footer-inner">
          <span className="lp-footer-copy">
            © 2026 Amrita Vishwa Vidyapeetham &nbsp;|&nbsp; Examination Cell
          </span>
          <div className="lp-footer-links">
            <span>Privacy Policy</span>
            <span className="lp-footer-dot">|</span>
            <span>Terms of Use</span>
            <span className="lp-footer-dot">|</span>
            <span>Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
