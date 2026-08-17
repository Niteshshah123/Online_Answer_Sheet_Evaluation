import { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_BADGE = { LOCKED: 'badge-green', DRAFT: 'badge-amber', PENDING: 'badge-red' };
const STATUS_COLOR = { LOCKED: '#16a34a', DRAFT: '#d97706', PENDING: '#dc2626' };

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/reports', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => setReport(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading reports...</p>;

  const total = Object.values(report?.evaluationsByStatus || {}).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Operational Reports</h1>
        <p>Summarized counts for examinations, students, and evaluation activity.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Examinations', value: report?.totalExams ?? 0, colorClass: 'stat-card-maroon' },
          { label: 'Total Students', value: report?.totalStudents ?? 0, colorClass: 'stat-card-green' },
          { label: 'Total Evaluations', value: report?.totalEvaluations ?? 0, colorClass: 'stat-card-amber' },
        ].map(({ label, value, colorClass }) => (
          <div key={label} className={`stat-card ${colorClass}`}>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Evaluation Status Breakdown</h2>
          <span className="badge badge-gray">{total} total</span>
        </div>
        <div className="card-body">
          {Object.entries(report?.evaluationsByStatus || {}).length === 0 ? (
            <div className="empty-state"><p>No evaluation data available.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {Object.entries(report.evaluationsByStatus).map(([status, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                      <span className={`badge ${STATUS_BADGE[status] || 'badge-gray'}`}>{status}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        <strong>{count}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: STATUS_COLOR[status] || 'var(--amrita-maroon)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
