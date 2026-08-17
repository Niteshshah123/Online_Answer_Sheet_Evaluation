import { useEffect, useState } from 'react';
import axios from 'axios';

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const TrendUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

function StatCard({ label, value, sub, trend, accent, icon }) {
  return (
    <div className="dash-stat-card" style={{ '--accent-color': accent }}>
      <div className="dash-stat-top">
        <div className="dash-stat-icon" style={{ background: accent + '18', color: accent }}>
          {icon}
        </div>
        {trend != null && (
          <div className="dash-stat-trend">
            <TrendUpIcon />
            <span>{trend}%</span>
          </div>
        )}
      </div>
      <div className="dash-stat-body">
        <div className="dash-stat-value">{value}</div>
        <div className="dash-stat-label">{label}</div>
        {sub && <div className="dash-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => setMetrics(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = metrics ? (metrics.checkedPapersCount + metrics.partiallyCheckedPapersCount + metrics.notCheckedPapersCount) : 0;
  const overallPct = total > 0 ? Math.round((metrics.checkedPapersCount / total) * 100) : 0;

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Loading dashboard...</span>
    </div>
  );

  return (
    <div className="dash-root">

      {/* Stat cards */}
      <div className="dash-stat-grid">
        <StatCard label="Total Students" value={metrics?.totalStudents ?? 0} sub="Registered in system" accent="#1E3A5F" icon={<UsersIcon />} />
        <StatCard label="Fully Evaluated" value={metrics?.checkedPapersCount ?? 0} sub="All questions locked" trend={overallPct} accent="#16a34a" icon={<CheckIcon />} />
        <StatCard label="In Progress" value={metrics?.partiallyCheckedPapersCount ?? 0} sub="Partially evaluated" accent="#d97706" icon={<ClockIcon />} />
        <StatCard label="Not Started" value={metrics?.notCheckedPapersCount ?? 0} sub="Pending evaluation" accent="#dc2626" icon={<AlertIcon />} />
      </div>

      {/* Overall progress banner */}
      {total > 0 && (
        <div className="dash-progress-banner">
          <div className="dash-progress-banner-left">
            <span className="dash-progress-banner-label">Overall Evaluation Progress</span>
            <span className="dash-progress-banner-pct">{overallPct}%</span>
          </div>
          <div className="dash-progress-banner-bar">
            <div className="dash-progress-banner-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="dash-progress-banner-counts">
            <span style={{ color: '#16a34a' }}>{metrics.checkedPapersCount} done</span>
            <span style={{ color: '#d97706' }}>{metrics.partiallyCheckedPapersCount} in progress</span>
            <span style={{ color: '#dc2626' }}>{metrics.notCheckedPapersCount} pending</span>
          </div>
        </div>
      )}

      {/* Faculty table */}
      <div className="card">
        <div className="card-header">
          <h2>Faculty Evaluation Progress</h2>
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Live
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {!metrics?.facultyProgress?.length ? (
            <div className="empty-state">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <p>No faculty progress records available.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Faculty Member</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'center' }}>Assigned</th>
                  <th style={{ textAlign: 'center' }}>Completed</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ minWidth: '180px' }}>Completion</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.facultyProgress.map((fac, i) => {
                  const pct = fac.completionPercentage;
                  const statusLabel = pct === 100 ? 'Done' : pct > 0 ? 'Active' : 'Pending';
                  const statusClass = pct === 100 ? 'badge-green' : pct > 0 ? 'badge-amber' : 'badge-gray';
                  return (
                    <tr key={fac.facultyId}>
                      <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', width: 36 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div className="fac-avatar">{fac.name.charAt(0).toUpperCase()}</div>
                          <strong>{fac.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{fac.email}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{fac.totalAssignedSheets}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-green">{fac.completedSheetsCount}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${fac.pendingSheetsCount > 0 ? 'badge-amber' : 'badge-green'}`}>
                          {fac.pendingSheetsCount}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-bar" style={{ flex: 1, height: '6px', borderRadius: '3px' }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? '#16a34a' : pct > 50 ? '#d97706' : '#1E3A5F',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', width: '34px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${statusClass}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
