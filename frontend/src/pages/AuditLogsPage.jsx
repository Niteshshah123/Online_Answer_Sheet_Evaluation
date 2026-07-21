import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setLogs(response.data.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  return (
    <div>
      <h2>Audit Logs</h2>
      <p className="muted">Review administrative actions and system events.</p>
      <div className="card" style={{ marginTop: '16px' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Performed By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.action || 'N/A'}</td>
                <td>{log.performedBy || 'Admin'}</td>
                <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
