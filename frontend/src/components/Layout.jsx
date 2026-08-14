import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/exams', label: 'Exams & Result Publishing' },
  { to: '/teachers', label: 'Teachers' },
  { to: '/unlock', label: 'Unlock Requests' },
  { to: '/import', label: 'Excel Import' },
  { to: '/audit-logs', label: 'Audit Logs' }
];

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h2>MarkSheet Admin</h2>
          <p className="muted">Evaluation administration console</p>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button className="secondary" onClick={logout}>Logout</button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
