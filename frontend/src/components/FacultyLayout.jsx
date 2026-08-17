import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from './ProfileModal';
import CalendarPanel from './CalendarPanel';

const NAV_LINKS = [
  { to: '/faculty/dashboard', label: 'Dashboard', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/faculty/assignments', label: 'Assigned Papers', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
];

const PAGE_TITLES = {
  '/faculty/dashboard': ['Dashboard', 'Overview'],
  '/faculty/assignments': ['Assigned Papers', 'Evaluation Queue'],
};

const LogoutIcon = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AmritaLogoMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
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
  const menuRef = useRef(null);
  const calRef = useRef(null);

  const isEvalPage = location.pathname.startsWith('/faculty/evaluate/');
  const [title, subtitle] = isEvalPage
    ? ['Evaluation Workspace', 'Answer Sheet Grading']
    : (PAGE_TITLES[location.pathname] || ['Faculty Portal', '']);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    axios.get('/api/faculty/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
    }).then(r => {
      if (r.data.data?.name) setFacultyName(r.data.data.name);
      if (r.data.data?.email) setFacultyEmail(r.data.data.email);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logout = () => { localStorage.removeItem('facultyToken'); navigate('/faculty/login'); };

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

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo"><AmritaLogoMark /></div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Amrita University</div>
            <div className="sidebar-brand-sub">Faculty Evaluator</div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end className={({ isActive }) => isActive ? 'active' : ''} title={collapsed ? link.label : undefined}>
              {link.icon}
              <span className="sidebar-nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout} title={collapsed ? 'Sign Out' : undefined}>
            <LogoutIcon />
            <span className="sidebar-nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="topbar-page-info">
              <div className="topbar-breadcrumb">
                <span>Faculty Portal</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span>{subtitle || title}</span>
              </div>
              <div className="topbar-title">{title}</div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-cal-wrap" ref={calRef}>
              <button
                className={`topbar-icon-btn topbar-icon-btn-clickable${calOpen ? ' active' : ''}`}
                onClick={() => setCalOpen(o => !o)}
                title="Calendar & Tasks"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className="topbar-icon-label">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </button>
              {calOpen && <CalendarPanel onClose={() => setCalOpen(false)} />}
            </div>

            <div className="topbar-divider" />

            <button className="topbar-icon-btn topbar-icon-btn-clickable" onClick={toggleTheme} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {dark
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            <div className="topbar-divider" />

            <div className="topbar-user-menu" ref={menuRef}>
              <div className="topbar-user" onClick={() => setMenuOpen(o => !o)}>
                <div className="topbar-avatar">{facultyName.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="topbar-user-name">{facultyName}</div>
                  <div className="topbar-user-role">Evaluator</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </div>
              {menuOpen && (
                <div className="topbar-dropdown">
                  <div className="topbar-dropdown-header">
                    <div className="topbar-dropdown-avatar">{facultyName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="topbar-dropdown-name">{facultyName}</div>
                      <div className="topbar-dropdown-role">Faculty · Evaluator</div>
                    </div>
                  </div>
                  <div className="topbar-dropdown-divider" />
                  <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Edit Profile
                  </button>
                  <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Change Password
                  </button>
                  <div className="topbar-dropdown-divider" />
                  <button className="topbar-dropdown-item topbar-dropdown-item-danger" onClick={() => { setMenuOpen(false); logout(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={isEvalPage ? '' : 'page-content'} style={isEvalPage ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
