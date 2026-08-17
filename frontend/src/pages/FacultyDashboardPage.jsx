import { useEffect, useState } from 'react';
import axios from 'axios';

const statusBadge = (s) => {
  if (s === 'LOCKED') return 'badge-green';
  if (s === 'DRAFT') return 'badge-amber';
  return 'badge-gray';
};

export default function FacultyDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/faculty/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
    }).then(r => setDashboard(r.data.data)).catch(console.error);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwLoading(true); setPwMessage(''); setPwError('');
    try {
      await axios.post('/api/faculty/change-password', { oldPassword, newPassword }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      setPwMessage('Password updated successfully.');
      setOldPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password.');
    } finally { setPwLoading(false); }
  };

  if (!dashboard) return <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading dashboard...</p>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Welcome, {dashboard.facultyName}</h1>
          <p>Track your assigned paper evaluation progress and manage your evaluation queue.</p>
        </div>
        <span className="badge badge-maroon" style={{ marginTop: '4px', padding: '4px 10px' }}>
          {dashboard.totalAssigned} sheets assigned
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div className="stat-card stat-card-maroon">
          <div className="stat-card-label">Total Assigned</div>
          <div className="stat-card-value">{dashboard.totalAssigned}</div>
          <div className="stat-card-sub">Answer sheets</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-card-label">Completed &amp; Locked</div>
          <div className="stat-card-value">{dashboard.completed}</div>
          <div className="stat-card-sub">Fully evaluated</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-card-label">Remaining</div>
          <div className="stat-card-value">{dashboard.pending}</div>
          <div className="stat-card-sub">Pending evaluation</div>
        </div>
      </div>

      {/* Assignments table */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h2>Valuation Progress Overview</h2>
          <span className="badge badge-gray">{dashboard.assignments?.length ?? 0} records</span>
        </div>
        {!dashboard.assignments?.length ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No assignments found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Examination</th>
                <th>Assigned Questions</th>
                <th>Status</th>
                <th>Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.assignments.map((item) => (
                <tr key={`${item.sheetId}-${item.questionRange}`}>
                  <td>
                    <strong>{item.studentName}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {item.registrationNumber}
                    </div>
                  </td>
                  <td>
                    <strong>{item.examName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.examContext}</div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{item.questionRange}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {Object.entries(item.evaluationSummary || {}).map(([s, c]) => `${s}: ${c}`).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Password change */}
      <div className="card" style={{ maxWidth: '420px' }}>
        <div className="card-header"><h2>Change Password</h2></div>
        <div className="card-body">
          {pwMessage && <div className="alert alert-success">{pwMessage}</div>}
          {pwError && <div className="alert alert-error">{pwError}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="Enter current password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
