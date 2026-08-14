import { useEffect, useState } from 'react';
import axios from 'axios';

export default function FacultyDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/faculty/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
        });
        setDashboard(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  if (!dashboard) return <p className="muted" style={{ padding: '20px' }}>Loading faculty dashboard...</p>;

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#0f172a' }}>
            Welcome, {dashboard.facultyName}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Track your assigned paper valuation progress and manage your evaluation queue.
          </p>
        </div>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd'
          }}
        >
          {dashboard.totalAssigned} Sheets Assigned
        </span>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="metric" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <h3 style={{ color: '#94a3b8' }}>Total Assigned</h3>
          <p style={{ color: '#ffffff', fontSize: '2.2rem', margin: '4px 0 0 0' }}>{dashboard.totalAssigned}</p>
        </div>
        <div className="metric" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
          <h3 style={{ color: '#bbf7d0' }}>Completed & Locked</h3>
          <p style={{ color: '#ffffff', fontSize: '2.2rem', margin: '4px 0 0 0' }}>{dashboard.completed}</p>
        </div>
        <div className="metric" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
          <h3 style={{ color: '#fef3c7' }}>Remaining to Check</h3>
          <p style={{ color: '#ffffff', fontSize: '2.2rem', margin: '4px 0 0 0' }}>{dashboard.pending}</p>
        </div>
      </div>

      {/* Assigned Students Valuation Queue */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0 }}>Valuation Progress Overview</h3>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Assigned answer sheets across courses</span>
        </div>

        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Student Name & Reg No.</th>
              <th>Examination Context</th>
              <th>Assigned Qs</th>
              <th>Status</th>
              <th>Detailed Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.assignments?.map((item) => (
              <tr key={`${item.sheetId}-${item.questionRange}`}>
                <td>
                  <strong>{item.studentName}</strong>
                  <br />
                  <code style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.registrationNumber}</code>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.examName}</span>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.examContext}</span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '2px 8px',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.82rem'
                    }}
                  >
                    {item.questionRange}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background:
                        item.status === 'LOCKED'
                          ? '#dcfce7'
                          : item.status === 'DRAFT'
                            ? '#fffbe6'
                            : '#f1f5f9',
                      color:
                        item.status === 'LOCKED'
                          ? '#15803d'
                          : item.status === 'DRAFT'
                            ? '#b45309'
                            : '#475569',
                      border: `1px solid ${
                        item.status === 'LOCKED'
                          ? '#86efac'
                          : item.status === 'DRAFT'
                            ? '#fde68a'
                            : '#cbd5e1'
                      }`
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                  {Object.entries(item.evaluationSummary || {})
                    .map(([status, count]) => `${status}: ${count}`)
                    .join(' | ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security Settings Card */}
      <div className="card" style={{ maxWidth: '480px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Security Settings</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
          Update your faculty portal password.
        </p>

        {pwMessage && (
          <div style={{ padding: '8px 12px', background: '#f0fdf4', color: '#166534', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
            ✓ {pwMessage}
          </div>
        )}
        {pwError && (
          <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
            ⚠ {pwError}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              setPwMessage('');
              setPwError('');
              await axios.post(
                '/api/faculty/change-password',
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
              );
              setPwMessage('Password changed successfully');
              setOldPassword('');
              setNewPassword('');
            } catch (err) {
              setPwError(err.response?.data?.message || 'Failed to change password');
            }
          }}
          style={{ width: '100%', padding: '10px' }}
        >
          Update Password
        </button>
      </div>
    </div>
  );
}

