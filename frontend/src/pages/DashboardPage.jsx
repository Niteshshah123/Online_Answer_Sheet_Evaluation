import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Administrative Dashboard</h2>
          <p className="muted">Centralized monitoring console for evaluation progress and faculty workload.</p>
        </div>
        <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Live Workflow</span>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: '16px' }}>Loading metrics...</p>
      ) : (
        <>
          {/* Main Workload Metrics Grid */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
            <div className="metric" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              <h3>Total Students</h3>
              <p>{metrics?.totalStudents ?? 0}</p>
            </div>
            <div className="metric" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              <h3>Checked Papers</h3>
              <p>{metrics?.checkedPapersCount ?? 0}</p>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>100% Evaluated & Locked</span>
            </div>
            <div className="metric" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
              <h3>Partially Checked</h3>
              <p>{metrics?.partiallyCheckedPapersCount ?? 0}</p>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Evaluation In Progress</span>
            </div>
            <div className="metric" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <h3>Not Checked</h3>
              <p>{metrics?.notCheckedPapersCount ?? 0}</p>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Pending Evaluation</span>
            </div>
          </div>

          {/* Faculty Evaluation Progress Tracking */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Faculty Evaluation Progress</h3>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Track paper evaluation status per evaluator</span>
            </div>

            {!metrics?.facultyProgress || metrics.facultyProgress.length === 0 ? (
              <p className="muted">No faculty progress records available.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Email</th>
                    <th>Assigned Papers</th>
                    <th>Completed</th>
                    <th>Pending</th>
                    <th>Completion Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.facultyProgress.map((fac) => (
                    <tr key={fac.facultyId}>
                      <td><strong>{fac.name}</strong></td>
                      <td><code>{fac.email}</code></td>
                      <td>{fac.totalAssignedSheets}</td>
                      <td><span style={{ color: '#16a34a', fontWeight: 600 }}>{fac.completedSheetsCount}</span></td>
                      <td><span style={{ color: '#dc2626', fontWeight: 600 }}>{fac.pendingSheetsCount}</span></td>
                      <td style={{ minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${fac.completionPercentage}%`,
                                background: fac.completionPercentage === 100 ? '#16a34a' : '#2563eb',
                                height: '100%',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', width: '40px' }}>
                            {fac.completionPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

