import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function StudentLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('studentToken');
    navigate('/student/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h2>Student Portal</h2>
          <p className="muted">View your semester papers and result reports.</p>
        </div>
        <nav>
          <NavLink to="/student/dashboard">Dashboard</NavLink>
        </nav>
        <button className="secondary" onClick={logout}>Logout</button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
