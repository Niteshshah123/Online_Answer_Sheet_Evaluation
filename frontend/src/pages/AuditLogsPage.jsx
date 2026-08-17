import { useEffect, useState } from 'react';
import axios from 'axios';

function getActionBadge(action = '') {
  const a = action.toUpperCase();
  if (a.includes('IMPORT') || a.includes('SEED')) return 'badge-blue';
  if (a.includes('UNLOCK')) return 'badge-amber';
  if (a.includes('REJECT')) return 'badge-red';
  if (a.includes('SUBMIT') || a.includes('LOCK')) return 'badge-green';
  return 'badge-gray';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => setLogs(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Immutable record of all administrative actions and system events.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>System Events</h2>
          <span className="badge badge-gray">{logs.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading audit records...</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
            </svg>
            <p>No audit events recorded yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>#</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Details</th>
                <th style={{ whiteSpace: 'nowrap' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{logs.length - i}</td>
                  <td>
                    <span className={`badge ${getActionBadge(log.action)}`}>{log.action || 'N/A'}</span>
                  </td>
                  <td><strong>{log.performedBy || 'System'}</strong></td>
                  <td style={{ maxWidth: '300px', color: 'var(--text-muted)' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {log.details || '—'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem' }}>
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
