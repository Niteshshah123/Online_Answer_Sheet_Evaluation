import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  {
    to: '/student/dashboard', label: 'My Papers',
    icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
];

const PAGE_TITLES = {
  '/student/dashboard': ['My Papers', 'Results & Reports'],
  '/student/password':  ['Change Password', 'Account Security'],
};

const LogoutIcon = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const LogoMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleTheme } = useTheme();
  const [studentName, setStudentName] = useState('Student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isReportPage = location.pathname.startsWith('/student/report/');
  const [title, subtitle] = isReportPage
    ? ['Result Report', 'Question-wise Breakdown']
    : (PAGE_TITLES[location.pathname] || ['Student Portal', '']);

  useEffect(() => {
    axios.get('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
    }).then(r => { if (r.data.data?.studentName) setStudentName(r.data.data.studentName); }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logout = () => { localStorage.removeItem('studentToken'); navigate('/student/login'); };
  const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo"><LogoMark /></div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Amrita University</div>
            <div className="sidebar-brand-sub">Student Portal</div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="sidebar-nav">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} end className={({ isActive }) => isActive ? 'active' : ''}>
              {link.icon}
              <span className="sidebar-nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout}>
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
                <span>Student Portal</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                <span>{subtitle || title}</span>
              </div>
              <div className="topbar-title">{title}</div>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-icon-btn topbar-icon-btn-clickable" onClick={toggleTheme} title={dark ? 'Light Mode' : 'Dark Mode'}>
              {dark
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <div className="topbar-divider" />
            <div className="topbar-user-menu" ref={menuRef}>
              <div className="topbar-user" onClick={() => setMenuOpen(o => !o)}>
                <div className="topbar-avatar">{initials}</div>
                <div>
                  <div className="topbar-user-name">{studentName}</div>
                  <div className="topbar-user-role">Student</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </div>
              {menuOpen && (
                <div className="topbar-dropdown">
                  <div className="topbar-dropdown-header">
                    <div className="topbar-dropdown-avatar">{initials}</div>
                    <div>
                      <div className="topbar-dropdown-name">{studentName}</div>
                      <div className="topbar-dropdown-role">Student · Amrita University</div>
                    </div>
                  </div>
                  <div className="topbar-dropdown-divider" />
                  <button className="topbar-dropdown-item" onClick={() => { setMenuOpen(false); navigate('/student/password'); }}>
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

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
