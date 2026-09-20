import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import NotificationPanel from './NotificationPanel';

const NAV_LINKS = [
  {
    to: '/student/dashboard', label: 'My Papers',
    icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    to: '/student/doubts', label: 'Doubts & Grievances',
    icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
  },
];

const PAGE_TITLES = {
  '/student/dashboard': ['My Papers', 'Results & Reports'],
  '/student/doubts':    ['Doubts & Grievances', 'Evaluator Clarifications'],
  '/student/password':  ['Change Password', 'Account Security'],
};

const LogoutIcon = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const LogoMark = () => (
  <img
    src="/uploads/images/logo.png"
    alt="Amrita Logo"
    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
  />
);

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleTheme } = useTheme();
  const [studentName, setStudentName] = useState('Student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const isReportPage = location.pathname.startsWith('/student/report/');
  const [title, subtitle] = isReportPage
    ? ['Result Report', 'Question-wise Breakdown']
    : (PAGE_TITLES[location.pathname] || ['Student Portal', '']);

  const fetchUnreadCount = () => {
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    axios.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      setUnreadCount(r.data.data?.unreadCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    axios.get('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` }
    }).then(r => { if (r.data.data?.studentName) setStudentName(r.data.data.studentName); }).catch(() => {});

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logout = () => { localStorage.removeItem('studentToken'); navigate('/student/login'); };
  const cleanStudentName = (studentName || 'Student').replace(/\s*\(.*?\)\s*/g, '').trim() || 'Student';
  const initials = cleanStudentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'S';

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/uploads/images/sideBar.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          opacity: 0.12, pointerEvents: 'none'
        }} />

        <div className="sidebar-brand" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sidebar-brand-logo"><LogoMark /></div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Amrita University</div>
            <div className="sidebar-brand-sub">Student Portal</div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            {NAV_LINKS.map(link => (
              <NavLink key={link.to} to={link.to} end className={({ isActive }) => isActive ? 'active' : ''}>
                {link.icon}
                <span className="sidebar-nav-label">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Student Profile / Sign In Menu */}
        <div
          style={{
            position: 'relative',
            zIndex: 100,
            flexShrink: 0,
            padding: '12px 10px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15, 23, 42, 0.95)'
          }}
          ref={menuRef}
        >
          <div
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: menuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = menuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}
            title={cleanStudentName}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E3A5F 0%, #A01B2D 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.88rem',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                {initials}
              </div>

              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {cleanStudentName}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                  Student
                </div>
              </div>
            </div>

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>

          {/* Upward Dropdown Menu */}
          {menuOpen && (
            <div
              className="topbar-dropdown"
              style={{
                position: 'absolute',
                top: 'auto',
                bottom: 'calc(100% + 8px)',
                left: '10px',
                right: '10px',
                width: 'calc(100% - 20px)',
                zIndex: 9999,
                borderRadius: '12px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
                background: 'var(--bg-white, #FFFFFF)',
                border: '1px solid var(--border, rgba(0,0,0,0.1))',
                overflow: 'hidden',
                animation: 'dropdownIn 0.15s ease'
              }}
            >
              <div className="topbar-dropdown-header" style={{ padding: '12px 14px', background: 'var(--bg-subtle, #F8FAFC)' }}>
                <div className="topbar-dropdown-avatar" style={{ background: '#1E3A5F', color: '#FFFFFF', width: '32px', height: '32px', fontSize: '0.8rem' }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="topbar-dropdown-name" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {cleanStudentName}
                  </div>
                  <div className="topbar-dropdown-role" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Student · Amrita University
                  </div>
                </div>
              </div>

              <div className="topbar-dropdown-divider" style={{ margin: '4px 0' }} />

              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/student/password');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Change Password
              </button>

              <div className="topbar-dropdown-divider" style={{ margin: '4px 0' }} />

              <button
                type="button"
                className="topbar-dropdown-item topbar-dropdown-item-danger"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  fontSize: '0.8rem', fontWeight: 600, color: '#c0392b',
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          )}
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

            {/* Notification Bell */}
            <div className="topbar-notif-wrap" ref={notifRef} style={{ position: 'relative' }}>
              <button
                className={`topbar-icon-btn topbar-icon-btn-clickable${notifOpen ? ' active' : ''}`}
                onClick={() => {
                  setNotifOpen(o => !o);
                  fetchUnreadCount();
                }}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 ? (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    minWidth: '15px', height: '15px', borderRadius: '10px',
                    background: '#EF4444', color: '#FFFFFF',
                    fontSize: '0.62rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', border: '2px solid var(--bg-white)',
                    boxShadow: '0 1px 3px rgba(239,68,68,0.4)'
                  }}>
                    {unreadCount}
                  </span>
                ) : (
                  <span style={{
                    position: 'absolute', top: '5px', right: '5px',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#94A3B8'
                  }} />
                )}
              </button>

              {notifOpen && (
                <NotificationPanel
                  tokenKey="studentToken"
                  onClose={() => {
                    setNotifOpen(false);
                    fetchUnreadCount();
                  }}
                  onNavigate={(link) => navigate(link)}
                />
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
