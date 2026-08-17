const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function AuthLayout({ roleTag, headline, tagline, features, hint, links, children }) {
  return (
    <div className="auth-root">

      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-left-content">

          <div className="auth-institution-badge">
            <div className="auth-institution-badge-dot" />
            <span className="auth-institution-badge-text">Amrita Vishwa Vidyapeetham</span>
          </div>

          <h1 className="auth-headline">
            Online Answer Sheet<br />
            <span className="auth-headline-accent">Valuation System</span>
          </h1>

          <p className="auth-tagline">{tagline}</p>

          <div className="auth-divider-line" />

          <div className="auth-features">
            {features.map(f => (
              <div key={f} className="auth-feature-row">
                <div className="auth-feature-icon">
                  <CheckIcon />
                </div>
                <span className="auth-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="auth-left-footer-name">Amrita Vishwa Vidyapeetham</div>
          <div className="auth-left-footer-sub">Department of Examinations &amp; Evaluation</div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-box">

          <div className="auth-role-tag">{roleTag}</div>

          {children}

          {hint && (
            <div className="auth-hint">
              <p className="auth-hint-label">Demo Credentials</p>
              <p className="auth-hint-value">{hint}</p>
            </div>
          )}

          {links?.length > 0 && (
            <div className="auth-links">
              {links.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
            </div>
          )}

          <p className="auth-footer">
            © {new Date().getFullYear()} Amrita Vishwa Vidyapeetham · Examination Cell
          </p>
        </div>
      </div>

    </div>
  );
}
