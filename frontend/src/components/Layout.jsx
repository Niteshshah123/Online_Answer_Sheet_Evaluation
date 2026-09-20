import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from './ProfileModal';
import CalendarPanel from './CalendarPanel';
import NotificationPanel from './NotificationPanel';

const NAV_SECTIONS = [
  {
    label: 'Examination Management',
    links: [
      { to: '/dashboard', label: 'Home', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
      { to: '/exams', label: 'Exams & Publishing', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
      { to: '/import', label: 'Excel Import', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
    ]
  },
  {
    label: 'Faculty Management',
    links: [
      { to: '/teachers', label: 'Faculty Accounts', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { to: '/exams', label: 'Faculty Mapping', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
    ]
  },
  {
    label: 'Evaluation Control',
    links: [
      { to: '/unlock', label: 'Unlock Requests', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> },
      { to: '/audit-logs', label: 'Audit Logs', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
    ]
  },
  {
    label: 'Reports',
    links: [
      { to: '/reports', label: 'Reports', icon: <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    ]
  },
];

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Overview'],
  '/exams': ['Exams & Publishing', 'Manage Examinations'],
  '/teachers': ['Faculty Accounts', 'Manage Faculty'],
  '/unlock': ['Unlock Requests', 'Re-evaluation Requests'],
  '/import': ['Excel Import', 'Bulk Data Import'],
  '/audit-logs': ['Audit Logs', 'System Events'],
  '/reports': ['Reports', 'Operational Summary'],
};

const LogoutIcon = () => (
  <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const AmritaLogoMark = () => (
  <img
    src="/uploads/images/logo.png"
    alt="Amrita Logo"
    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
  />
);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminName, setAdminName] = useState('Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const menuRef = useRef(null);
  const calRef = useRef(null);
  const notifRef = useRef(null);
  const [title, subtitle] = PAGE_TITLES[location.pathname] || ['Admin Panel', ''];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const fetchUnreadCount = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    axios.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      setUnreadCount(r.data.data?.unreadCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    axios.get('/api/admin/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => {
      if (r.data.data?.name) setAdminName(r.data.data.name);
      if (r.data.data?.email) setAdminEmail(r.data.data.email);
    }).catch(() => {});

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const logout = () => { localStorage.removeItem('adminToken'); navigate('/login'); };

  const cleanAdminName = (adminName || 'Administrator').replace(/\s*\(.*?\)\s*/g, '').trim() || 'Administrator';
  const user = { name: cleanAdminName, email: adminEmail, role: 'Administrator' };

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      {profileOpen && (
        <ProfileModal
          user={user}
          tokenKey="adminToken"
          apiBase="/api/admin"
          onClose={() => setProfileOpen(false)}
          onUpdated={name => setAdminName(name)}
        />
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/uploads/images/sideBar.png)',
          backgroundSize: 'cover', backgroundPosition: 'center bottom',
          opacity: 0.15, pointerEvents: 'none'
        }} />

        <div className="sidebar-brand" style={{ position: 'relative', zIndex: 1 }}>
          <div className="sidebar-brand-logo"><AmritaLogoMark /></div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Amrita University</div>
            <div className="sidebar-brand-sub">Examination Cell</div>
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

        {/* Navigation Sections */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              <nav className="sidebar-nav">
                {section.links.map(link => (
                  <NavLink key={link.to + link.label} to={link.to} end className={({ isActive }) => isActive ? 'active' : ''} title={collapsed ? link.label : undefined}>
                    {link.icon}
                    <span className="sidebar-nav-label">{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Admin Profile / Sign Out Menu */}
        <div
          style={{
            position: 'relative',
            zIndex: 100,
            flexShrink: 0,
            padding: collapsed ? '12px 6px' : '12px 10px',
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
              padding: collapsed ? '8px 0' : '8px 10px',
              borderRadius: '10px',
              background: menuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'space-between',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = menuOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}
            title={collapsed ? cleanAdminName : undefined}
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
                {cleanAdminName.charAt(0).toUpperCase()}
              </div>

              {!collapsed && (
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {cleanAdminName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                    Administrator
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
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
            )}
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
                right: collapsed ? 'auto' : '10px',
                width: collapsed ? '220px' : 'calc(100% - 20px)',
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
                  {cleanAdminName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="topbar-dropdown-name" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {cleanAdminName}
                  </div>
                  <div className="topbar-dropdown-role" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {adminEmail || 'Examination Cell · Admin'}
                  </div>
                </div>
              </div>

              <div className="topbar-dropdown-divider" style={{ margin: '4px 0' }} />

              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Edit Profile
              </button>

              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle navigation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 14px', minWidth: '260px', maxWidth: '400px', flex: 1
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                Search students, exams, faculty, or anything...
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
                background: 'var(--bg-white)', border: '1px solid var(--border)',
                borderRadius: '4px', padding: '1px 6px'
              }}>Ctrl K</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Date & semester */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Even Semester {new Date().getFullYear()}</span>
            </div>

            {/* Calendar */}
            <div className="topbar-cal-wrap" ref={calRef}>
              <button
                className={`topbar-icon-btn topbar-icon-btn-clickable${calOpen ? ' active' : ''}`}
                onClick={() => setCalOpen(o => !o)}
                title="Calendar & Tasks"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </button>
              {calOpen && <CalendarPanel onClose={() => setCalOpen(false)} />}
            </div>

            <div className="topbar-divider" />

            {/* Theme toggle */}
            <button className="topbar-icon-btn topbar-icon-btn-clickable" onClick={toggleTheme} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {dark
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>

            <div className="topbar-divider" />

            {/* Notification bell */}
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
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
                  tokenKey="adminToken"
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
