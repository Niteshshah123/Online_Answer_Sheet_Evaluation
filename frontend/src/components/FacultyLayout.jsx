import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from './ProfileModal';
import CalendarPanel from './CalendarPanel';

const NAV_SECTIONS = [
  {
    label: 'FACULTY PORTAL',
    links: [
      {
        to: '/faculty/dashboard',
        label: 'Dashboard',
        icon: (
          <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        )
      },
      {
        to: '/faculty/assignments',
        label: 'Assigned Papers',
        icon: (
          <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        )
      }
    ]
  },
  {
    label: 'SUPPORT',
    links: [
      {
        to: '#help',
        label: 'Help & Guidelines',
        isAction: true,
        action: 'help',
        icon: (
          <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        )
      },
      {
        to: '#contact',
        label: 'Contact Admin',
        isAction: true,
        action: 'contact',
        icon: (
          <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        )
      }
    ]
  }
];

const AmritaLogoMark = () => (
  <img
    src="/uploads/images/logo.png"
    alt="Amrita Logo"
    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
  />
);

const GoldenLotus = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8c-2 6-6 12-14 16 7 2 13 0 14-8 1 8 7 10 14 8-8-4-12-10-14-16z" fill="#C9A84C" />
    <path d="M24 16c-3 8-10 14-20 16 9 3 17 0 20-9 3 9 11 12 20 9-10-2-17-8-20-16z" fill="#B4873B" />
    <circle cx="24" cy="38" r="2" fill="#C9A84C" />
  </svg>
);

export default function FacultyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleTheme } = useTheme();
  const [facultyName, setFacultyName] = useState('Faculty');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [supportModal, setSupportModal] = useState(null); // 'help' | 'contact' | null
  const menuRef = useRef(null);
  const calRef = useRef(null);

  const isEvalPage = location.pathname.startsWith('/faculty/evaluate/');

  useEffect(() => {
    axios.get('/api/faculty/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
    }).then(r => {
      if (r.data.data?.name) setFacultyName(r.data.data.name);
      if (r.data.data?.email) setFacultyEmail(r.data.data.email);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logout = () => {
    localStorage.removeItem('facultyToken');
    navigate('/faculty/login');
  };

  const user = { name: facultyName, email: facultyEmail, role: 'Faculty · Evaluator' };

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      {profileOpen && (
        <ProfileModal
          user={user}
          tokenKey="facultyToken"
          apiBase="/api/faculty"
          onClose={() => setProfileOpen(false)}
          onUpdated={name => setFacultyName(name)}
        />
      )}

      {/* Support / Help Modal */}
      {supportModal && (
        <div className="modal-overlay" onClick={() => setSupportModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {supportModal === 'help' ? 'Help & Evaluation Guidelines' : 'Contact Administration'}
              </h3>
              <button className="modal-close" onClick={() => setSupportModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {supportModal === 'help' ? (
                <>
                  <p><strong>Evaluation Workflow:</strong></p>
                  <ol style={{ paddingLeft: '20px', margin: '8px 0 14px' }}>
                    <li>Select an assigned paper from the <em>Assigned Papers</em> list or direct table link.</li>
                    <li>Grade questions in the 3-panel synchronized evaluation workspace.</li>
                    <li>Save progress as <strong>Draft</strong> anytime or click <strong>Complete Evaluation</strong> once finished.</li>
                    <li>Co-evaluators handover marks to the Course In-Charge before publishing.</li>
                  </ol>
                  <p>Need further assistance? Reach out to the Examination Controller office.</p>
                </>
              ) : (
                <>
                  <p><strong>Office of the Controller of Examinations:</strong></p>
                  <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', margin: '10px 0' }}>
                    <div><strong>Email:</strong> examcell@amrita.edu</div>
                    <div style={{ marginTop: '4px' }}><strong>Internal Extension:</strong> 4021 / 4022</div>
                    <div style={{ marginTop: '4px' }}><strong>Working Hours:</strong> Mon - Sat, 8:30 AM - 5:00 PM</div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    For urgent unlocking requests, submit an unlock request directly through your evaluation workspace.
                  </p>
                </>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSupportModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ─────────────────────────────────────────
          SIDEBAR
      ───────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Background Image: sideBar.png */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/uploads/images/sideBar.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          opacity: 0.12, pointerEvents: 'none'
        }} />

        {/* Brand Header */}
        <div className="sidebar-brand" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sidebar-brand-logo"><AmritaLogoMark /></div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name" style={{ letterSpacing: '0.04em' }}>AMRITA UNIVERSITY</div>
            <div className="sidebar-brand-sub" style={{ color: '#C9A84C' }}>Examination Cell</div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: '14px' }}>
              <div className="sidebar-section-label" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                {section.label}
              </div>
              <nav className="sidebar-nav">
                {section.links.map(link => (
                  link.isAction ? (
                    <button
                      key={link.label}
                      className="sidebar-nav-btn"
                      onClick={() => setSupportModal(link.action)}
                      title={collapsed ? link.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', width: '100%', gap: '10px',
                        padding: '9px 14px', background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.72)', cursor: 'pointer', fontSize: '0.82rem',
                        fontWeight: 500, borderRadius: '8px', transition: 'all 0.15s ease', textAlign: 'left'
                      }}
                    >
                      {link.icon}
                      {!collapsed && <span className="sidebar-nav-label">{link.label}</span>}
                    </button>
                  ) : (
                    <NavLink
                      key={link.to + link.label}
                      to={link.to}
                      end
                      className={({ isActive }) => isActive ? 'active' : ''}
                      title={collapsed ? link.label : undefined}
                    >
                      {link.icon}
                      <span className="sidebar-nav-label">{link.label}</span>
                    </NavLink>
                  )
                ))}
              </nav>
            </div>
          ))}

          {/* Sidebar Footer: Golden Lotus & Quote */}
          <div style={{
            marginTop: 'auto', padding: '16px 14px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            gap: '8px'
          }}>
            {!collapsed ? (
              <>
                <GoldenLotus />
                <div style={{
                  fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)',
                  fontStyle: 'italic', lineHeight: 1.4
                }}>
                  "Knowledge Empowers Compassion"
                </div>
              </>
            ) : (
              <GoldenLotus />
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────
          MAIN CONTENT & TOPBAR
      ───────────────────────────────────────── */}
      <div className="main-content">
        <header className="topbar">
          {/* Topbar Left: Mobile Sidebar Toggle, Title, Subtitle, Search Bar */}
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Open sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button> */}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Faculty Portal
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Evaluate Today. Shape Tomorrow.
              </div>
            </div>

            {/* Search Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 14px', minWidth: '280px', maxWidth: '380px',
              marginLeft: '18px'
            }} className="topbar-search-bar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                Search by student, subject, or exam...
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)',
                background: 'var(--bg-white)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '1px 5px'
              }}>Ctrl K</span>
            </div>
          </div>

          {/* Topbar Right: Calendar & Tasks, Theme Toggle, Bell, User Profile */}
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="topbar-cal-wrap" ref={calRef}>
              <button
                className={`topbar-icon-btn topbar-icon-btn-clickable${calOpen ? ' active' : ''}`}
                onClick={() => setCalOpen(o => !o)}
                title="Calendar & Tasks"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="topbar-icon-label">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </button>
              {calOpen && <CalendarPanel onClose={() => setCalOpen(false)} />}
            </div>

            <div className="topbar-divider" />

            {/* Theme toggle */}
            <button
              className="topbar-icon-btn topbar-icon-btn-clickable"
              onClick={toggleTheme}
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              }
            </button>

            {/* Notification Bell */}
            <button className="topbar-icon-btn topbar-icon-btn-clickable" title="Notifications" style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#EF4444'
              }} />
            </button>

            <div className="topbar-divider" />

            {/* User Profile Menu */}
            <div className="topbar-user-menu" ref={menuRef}>
              <div
                className="topbar-user"
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '4px 8px', borderRadius: '8px', transition: 'background 0.15s ease'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#1E3A5F', color: '#FFFFFF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem'
                }}>
                  {facultyName.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {facultyName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Faculty Evaluator
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {menuOpen && (
                <div className="topbar-dropdown" style={{ minWidth: '200px' }}>
                  <div className="topbar-dropdown-header">
                    <div className="topbar-dropdown-avatar">{facultyName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="topbar-dropdown-name">{facultyName}</div>
                      <div className="topbar-dropdown-role">Faculty · Evaluator</div>
                    </div>
                  </div>
                  <div className="topbar-dropdown-divider" />
                  <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    Edit Profile
                  </button>
                  <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Change Password
                  </button>
                  <div className="topbar-dropdown-divider" />
                  <button className="topbar-dropdown-item topbar-dropdown-item-danger" onClick={() => { setMenuOpen(false); logout(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={isEvalPage ? '' : 'page-content'} style={isEvalPage ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { padding: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
