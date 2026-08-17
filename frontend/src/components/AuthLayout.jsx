export default function AuthLayout({ roleTag, hint, links, children }) {
  return (
    <div className="auth-root">

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-left-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="auth-left-title">Amrita University</h1>
          <p className="auth-left-sub">Examination Cell · Answer Sheet Evaluation</p>

          <div className="auth-left-divider" />

          <ul className="auth-left-points">
            <li>
              <span className="auth-left-point-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Secure role-based access
            </li>
            <li>
              <span className="auth-left-point-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Automated answer sheet distribution
            </li>
            <li>
              <span className="auth-left-point-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Real-time evaluation tracking
            </li>
          </ul>
        </div>

        <p className="auth-left-copy">© {new Date().getFullYear()} Amrita Vishwa Vidyapeetham</p>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-right-header">
            <span className="auth-role-tag">{roleTag}</span>
          </div>

          <div className="auth-right-body">
            {children}
          </div>

          {hint && (
            <div className="auth-card-hint">
              <span className="auth-hint-label">Demo</span>
              <span className="auth-hint-value">{hint}</span>
            </div>
          )}

          {links?.length > 0 && (
            <div className="auth-footer-links">
              {links.map((l, i) => (
                <span key={l.href}>
                  {i > 0 && <span className="auth-footer-sep">·</span>}
                  <a href={l.href}>{l.label}</a>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
