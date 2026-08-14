import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function FacultyLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [facultyInfo, setFacultyInfo] = useState({ name: 'Faculty Evaluator', email: '' });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get('/api/faculty/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
        });
        if (res.data.data?.facultyName) {
          setFacultyInfo({
            name: res.data.data.facultyName,
            email: localStorage.getItem('facultyEmail') || ''
          });
        }
      } catch (err) {
        // ignore
      }
    };
    fetchInfo();
  }, []);

  const logout = () => {
    localStorage.removeItem('facultyToken');
    navigate('/faculty/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '0px',
          minWidth: sidebarOpen ? '260px' : '0px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: sidebarOpen ? '4px 0 20px rgba(15, 23, 42, 0.15)' : 'none',
          zIndex: 40,
          position: 'relative'
        }}
      >
        {/* Sidebar Header with Close Cross Button on Top Right */}
        <div
          style={{
            padding: '20px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎓</span>
              <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, letterSpacing: '0.3px', color: '#f8fafc' }}>
                Faculty Portal
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Answer Sheet Valuation
            </p>
          </div>

          {/* Cross (Close) Icon in Top Right of Sidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Collapse Sidebar"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#cbd5e1',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <NavLink
            to="/faculty/dashboard"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              color: isActive ? '#ffffff' : '#cbd5e1',
              background: isActive ? '#2563eb' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              borderLeft: isActive ? '4px solid #60a5fa' : '4px solid transparent'
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/faculty/assignments"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              color: isActive ? '#ffffff' : '#cbd5e1',
              background: isActive ? '#2563eb' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              borderLeft: isActive ? '4px solid #60a5fa' : '4px solid transparent'
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>📋</span>
            <span>Assigned Papers</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer Logout */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* TOPBAR */}
        <header
          style={{
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '0 20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            zIndex: 30
          }}
        >
          {/* Top-Left Hamburger Icon Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Open Sidebar'}
              style={{
                background: sidebarOpen ? '#f1f5f9' : '#2563eb',
                color: sidebarOpen ? '#334155' : '#ffffff',
                border: '1px solid #cbd5e1',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                boxShadow: sidebarOpen ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>

            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
              Answer Sheet Valuation Platform
            </span>
          </div>

          {/* Top-Right Faculty Profile Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                background: '#f1f5f9',
                borderRadius: '20px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {facultyInfo.name.charAt(0) || 'F'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                  {facultyInfo.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1 }}>Evaluator</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT ROUTE OUTLET */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

