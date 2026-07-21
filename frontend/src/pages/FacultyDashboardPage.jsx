import { useEffect, useState } from 'react';
import axios from 'axios';

export default function FacultyDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');

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

  if (!dashboard) return <p className="muted">Loading faculty dashboard...</p>;

  return (
    <div>
      <div className="row">
        <div>
          <h2>Faculty Dashboard</h2>
          <p className="muted">Welcome {dashboard.facultyName}</p>
        </div>
        <span className="badge">{dashboard.totalAssigned} assigned</span>
      </div>
      <div className="grid grid-3" style={{ marginTop: '16px' }}>
        <div className="card">
          <h3>Total Assigned</h3>
          <p>{dashboard.totalAssigned}</p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p>{dashboard.completed}</p>
        </div>
        <div className="card">
          <h3>Remaining</h3>
          <p>{dashboard.pending}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Assigned Students</h3>
        <table className="table" style={{ width: '100%', marginTop: '12px' }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Exam</th>
              <th>Question Range</th>
              <th>Status</th>
              <th>Counts</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.assignments?.map((item) => (
              <tr key={`${item.sheetId}-${item.questionRange}`}>
                <td>{item.studentName} ({item.registrationNumber})</td>
                <td>{item.examName} {item.examContext}</td>
                <td>{item.questionRange}</td>
                <td>{item.status}</td>
                <td>{Object.entries(item.evaluationSummary || {}).map(([status, count]) => `${status}: ${count}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Change Password</h3>
        <div className="form-group">
          <label>Old Password</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <button onClick={async () => {
          try {
            await axios.post('/api/faculty/change-password', { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } });
            setPwMessage('Password changed');
            setOldPassword(''); setNewPassword('');
          } catch (err) {
            setPwMessage(err.response?.data?.message || 'Failed to change password');
          }
        }}>Change Password</button>
        {pwMessage && <p className="muted" style={{ marginTop: '12px' }}>{pwMessage}</p>}
      </div>
    </div>
  );
}
