import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function FacultyLayout() {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const logout = () => {
    localStorage.removeItem('facultyToken');
    navigate('/faculty/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        <div className="sidebar-header">
          <div>
            <h2>Faculty Console</h2>
            <p className="muted">Evaluate assigned questions and submit results.</p>
          </div>
          <button className="secondary small" onClick={() => setSidebarVisible(false)}>
            ✕
          </button>
        </div>
        <nav>
          <NavLink to="/faculty/dashboard">Dashboard</NavLink>
          <NavLink to="/faculty/assignments">Assignments</NavLink>
        </nav>
        <button className="secondary" onClick={logout}>Logout</button>
      </aside>
      <main className={`main ${sidebarVisible ? '' : 'fullwidth'}`}>
        <div className="topbar">
          <button className="secondary small" onClick={() => setSidebarVisible((visible) => !visible)}>
            {sidebarVisible ? '✕' : '☰'}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
