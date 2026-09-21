import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ── Inline SVG Icons ── */
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const TrendUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

/* ── Quick Action Icon Components ── */
const DownloadIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const PlusCircleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const UserPlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const UnlockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const BarChartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const LinkIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

/* ── Donut Chart (SVG) ── */
function DonutChart({ segments, size = 160, strokeWidth = 28 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -offset * circumference;
    offset += pct;
    return (
      <circle
        key={seg.label}
        cx={center} cy={center} r={radius}
        fill="none" stroke={seg.color} strokeWidth={strokeWidth}
        strokeDasharray={dashArray} strokeDashoffset={dashOffset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    );
  });

  const overallPct = total > 0 ? Math.round((segments[0]?.value || 0) / total * 100) : 0;

  return (
    <div className="adm-dash-eval-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        {arcs}
      </svg>
      <div className="adm-dash-eval-donut-center">
        <div className="adm-dash-eval-donut-pct">{overallPct}%</div>
        <div className="adm-dash-eval-donut-label">Overall<br />Completion</div>
      </div>
    </div>
  );
}

/* ── Helper: relative time ── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/* ── Helper: activity icon color ── */
function activityColor(action = '') {
  const a = action.toUpperCase();
  if (a.includes('SUBMIT') || a.includes('LOCK') || a.includes('COMPLETE')) return '#16a34a';
  if (a.includes('IMPORT') || a.includes('SEED') || a.includes('CREATE')) return '#2563eb';
  if (a.includes('UNLOCK')) return '#d97706';
  if (a.includes('REJECT') || a.includes('DELETE')) return '#dc2626';
  if (a.includes('PUBLISH')) return '#7c3aed';
  return '#6b7280';
}

/* ── Helper: activity icon ── */
function activityIcon(action = '') {
  const a = action.toUpperCase();
  if (a.includes('SUBMIT') || a.includes('LOCK') || a.includes('COMPLETE')) return '✓';
  if (a.includes('IMPORT') || a.includes('SEED')) return '⬆';
  if (a.includes('UNLOCK')) return '🔓';
  if (a.includes('PUBLISH')) return '📋';
  if (a.includes('CREATE')) return '👤';
  if (a.includes('REJECT') || a.includes('DELETE')) return '✕';
  return '●';
}

/* ── Status badge color ── */
function statusBadgeClass(status) {
  switch (status) {
    case 'Published': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    case 'Ready to Publish': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
    case 'In Progress': return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    case 'Pending': return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    case 'Not Started': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    default: return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
  }
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ══════════════════════════════════════════ */
export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examTab, setExamTab] = useState('Ongoing');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    }).then(r => setMetrics(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = metrics ? (metrics.checkedPapersCount + metrics.partiallyCheckedPapersCount + metrics.notCheckedPapersCount) : 0;
  const overallPct = total > 0 ? Math.round((metrics.checkedPapersCount / total) * 100) : 0;

  // Exam tab filtering
  const filteredExams = (metrics?.examOverview || []).filter(exam => {
    if (examTab === 'Ongoing') return !exam.isPublished && exam.studentCount > 0;
    if (examTab === 'Completed') return exam.isPublished;
    return false; // Upcoming — no date fields, so show none
  });

  // Latest exam for badge
  const latestExam = (metrics?.examOverview || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

  /* ── Loading State ── */
  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Loading dashboard...</span>
    </div>
  );

  /* ── Quick Actions Config ── */
  const quickActions = [
    { label: 'Import Excel', icon: <DownloadIcon />, color: '#2563eb', bg: '#eff6ff', to: '/import' },
    { label: 'Create Exam', icon: <PlusCircleIcon />, color: '#16a34a', bg: '#f0fdf4', to: '/exams' },
    { label: 'Add Faculty', icon: <UserPlusIcon />, color: '#7c3aed', bg: '#f5f3ff', to: '/teachers' },
    { label: 'Configure Mapping', icon: <LinkIcon />, color: '#0891b2', bg: '#ecfeff', to: '/exams' },
    { label: 'View Unlock Requests', icon: <UnlockIcon />, color: '#d97706', bg: '#fffbeb', to: '/unlock' },
    { label: 'Publish Results', icon: <SendIcon />, color: '#16a34a', bg: '#f0fdf4', to: '/exams' },
    { label: 'Generate Reports', icon: <BarChartIcon />, color: '#1E3A5F', bg: '#eff6ff', to: '/reports' },
    { label: 'System Settings', icon: <SettingsIcon />, color: '#6b7280', bg: '#f9fafb', to: '/audit-logs' },
  ];

  /* ── Donut segments ── */
  const donutSegments = [
    { label: 'Fully Evaluated', value: metrics?.checkedPapersCount || 0, color: '#16a34a' },
    { label: 'In Progress', value: metrics?.partiallyCheckedPapersCount || 0, color: '#d97706' },
    { label: 'Not Started', value: metrics?.notCheckedPapersCount || 0, color: '#dc2626' },
  ];

  return (
    <div className="dash-root">

      {/* ═══ HERO SECTION ═══ */}
      <div className="adm-dash-hero">
        <div className="adm-dash-hero-overlay">
          <div className="adm-dash-hero-content">
            <div>
              <div className="adm-dash-hero-label">Examination Cell</div>
              <h1 className="adm-dash-hero-headline">
                Ensuring Academic<br />Integrity, <span className="adm-dash-hero-headline-gold">Together.</span>
              </h1>
              <p className="adm-dash-hero-subtitle">
                Streamline evaluation. Empower faculty. Enable transparency.<br />For a brighter future.
              </p>
            </div>
            <div className="adm-dash-hero-quote">
              <div className="adm-dash-hero-quote-text">
                &ldquo;Education<br />&nbsp;&nbsp;for a better world&rdquo;
              </div>
              <div className="adm-dash-hero-quote-author">— Mata Amritanandamayi Devi</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STAT CARDS ROW ═══ */}
      <div className="adm-dash-stats-row">
        <div className="adm-dash-stat-card" style={{ '--stat-accent': '#1E3A5F' }}>
          <div className="adm-dash-stat-icon" style={{ background: '#EFF6FF', color: '#1E3A5F' }}><UsersIcon /></div>
          <div className="adm-dash-stat-body">
            <div className="adm-dash-stat-value">
              {(metrics?.totalStudents || 0).toLocaleString()}
              {overallPct > 0 && (
                <span className="adm-dash-stat-trend"><TrendUpIcon /> {overallPct}%</span>
              )}
            </div>
            <div className="adm-dash-stat-label">Total Students</div>
            <div className="adm-dash-stat-sub">Registered in system</div>
          </div>
        </div>

        <div className="adm-dash-stat-card" style={{ '--stat-accent': 'var(--text-accent, #38bdf8)' }}>
          <div className="adm-dash-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: 'var(--text-accent, #38bdf8)' }}><FileIcon /></div>
          <div className="adm-dash-stat-body">
            <div className="adm-dash-stat-value">{(metrics?.totalAnswerSheets || 0).toLocaleString()}</div>
            <div className="adm-dash-stat-label">Answer Sheets</div>
            <div className="adm-dash-stat-sub">Scanned & assigned</div>
          </div>
        </div>

        <div className="adm-dash-stat-card" style={{ '--stat-accent': 'var(--success)' }}>
          <div className="adm-dash-stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircleIcon /></div>
          <div className="adm-dash-stat-body">
            <div className="adm-dash-stat-value">
              {(metrics?.checkedPapersCount || 0).toLocaleString()}
            </div>
            <div className="adm-dash-stat-label">Fully Evaluated</div>
            <div className="adm-dash-stat-sub" style={{ color: 'var(--success)' }}>{overallPct}% completion</div>
          </div>
        </div>

        <div className="adm-dash-stat-card" style={{ '--stat-accent': 'var(--warning)' }}>
          <div className="adm-dash-stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><ClockIcon /></div>
          <div className="adm-dash-stat-body">
            <div className="adm-dash-stat-value">{(metrics?.partiallyCheckedPapersCount || 0).toLocaleString()}</div>
            <div className="adm-dash-stat-label">In Progress</div>
            <div className="adm-dash-stat-sub">{total > 0 ? Math.round((metrics.partiallyCheckedPapersCount / total) * 100) : 0}%</div>
          </div>
        </div>

        <div className="adm-dash-stat-card" style={{ '--stat-accent': 'var(--error)' }}>
          <div className="adm-dash-stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}><AlertCircleIcon /></div>
          <div className="adm-dash-stat-body">
            <div className="adm-dash-stat-value">{(metrics?.notCheckedPapersCount || 0).toLocaleString()}</div>
            <div className="adm-dash-stat-label">Not Started</div>
            <div className="adm-dash-stat-sub">{total > 0 ? Math.round((metrics.notCheckedPapersCount / total) * 100) : 0}%</div>
          </div>
        </div>

        {/* Active Exam Period Badge */}
        {latestExam && (
          <div className="adm-dash-exam-badge">
            <div className="adm-dash-exam-badge-tag">● Active</div>
            <div className="adm-dash-exam-badge-title">{latestExam.examType}</div>
            <div className="adm-dash-exam-badge-date">
              {latestExam.course}<br />
              Sem {latestExam.semester}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MIDDLE ROW: Evaluation Progress + Quick Actions ═══ */}
      <div className="adm-dash-middle-row">

        {/* Evaluation Progress */}
        <div className="adm-dash-card adm-dash-eval-card">
          <div className="adm-dash-card-header">
            <h2 style={{ margin: 0, fontSize: '0.9rem' }}>Evaluation Progress</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>All Subjects</span>
          </div>
          <div className="adm-dash-eval-body">
            <DonutChart segments={donutSegments} />
            <div className="adm-dash-eval-legend">
              {donutSegments.map((seg) => (
                <div className="adm-dash-eval-legend-item" key={seg.label}>
                  <div className="adm-dash-eval-legend-dot" style={{ background: seg.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="adm-dash-eval-legend-label">{seg.label}</div>
                    <div className="adm-dash-eval-legend-bar">
                      <div className="adm-dash-eval-legend-bar-fill" style={{ width: `${total > 0 ? (seg.value / total) * 100 : 0}%`, background: seg.color }} />
                    </div>
                  </div>
                  <div className="adm-dash-eval-legend-count">{seg.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="adm-dash-card adm-dash-quick-actions">
          <div className="adm-dash-card-header">
            <h2 style={{ margin: 0, fontSize: '0.9rem' }}>Quick Actions</h2>
          </div>
          <div className="adm-dash-qa-grid">
            {quickActions.map((qa) => (
              <div
                className="adm-dash-qa-item"
                key={qa.label}
                onClick={() => navigate(qa.to)}
                role="button"
                tabIndex={0}
              >
                <div className="adm-dash-qa-icon" style={{ background: qa.bg, color: qa.color }}>
                  {qa.icon}
                </div>
                <div className="adm-dash-qa-label">{qa.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ROW: Examination Overview + Recent Activity ═══ */}
      <div className="adm-dash-bottom-row">

        {/* Examination Overview */}
        <div className="adm-dash-card adm-dash-exam-overview">
          <div className="adm-dash-eo-header">
            <h2 style={{ margin: 0, fontSize: '0.9rem' }}>Examination Overview</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="adm-dash-eo-tabs">
                {['Ongoing', 'Completed'].map(tab => (
                  <button
                    key={tab}
                    className={`adm-dash-eo-tab${examTab === tab ? ' adm-dash-eo-tab-active' : ''}`}
                    onClick={() => setExamTab(tab)}
                  >{tab}</button>
                ))}
              </div>
              <span className="adm-dash-eo-view-all" onClick={() => navigate('/exams')}>
                View All →
              </span>
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No {examTab.toLowerCase()} exams found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>#</th>
                    <th>Exam Name</th>
                    <th>Course / Subject</th>
                    <th style={{ textAlign: 'center' }}>Sem</th>
                    <th style={{ textAlign: 'center' }}>Section</th>
                    <th style={{ textAlign: 'center' }}>Students</th>
                    <th style={{ minWidth: '120px' }}>Progress</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '40px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.slice(0, 5).map((exam, i) => {
                    const sbc = statusBadgeClass(exam.status);
                    return (
                      <tr key={exam.examId}>
                        <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                        <td><strong>{exam.examType}</strong></td>
                        <td style={{ fontSize: '0.78rem' }}>
                          {exam.course}<br />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({exam.subject})</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{exam.semester}</td>
                        <td style={{ textAlign: 'center' }}>{exam.section}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{exam.studentCount}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="adm-dash-eo-progress">
                              <div className="adm-dash-eo-progress-fill" style={{ width: `${exam.progressPct}%` }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', width: '30px', textAlign: 'right' }}>
                              {exam.progressPct}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                            fontSize: '0.68rem', fontWeight: 700,
                            background: sbc.bg, color: sbc.color, border: `1px solid ${sbc.border}`
                          }}>
                            {exam.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '2px' }}
                            onClick={() => navigate('/exams')}
                            title="View exam details"
                          >⋯</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="adm-dash-card adm-dash-activity">
          <div className="adm-dash-card-header">
            <h2 style={{ margin: 0, fontSize: '0.9rem' }}>Recent Activity</h2>
            <span className="adm-dash-eo-view-all" onClick={() => navigate('/audit-logs')}>View All →</span>
          </div>
          <div className="adm-dash-activity-list">
            {(metrics?.recentActivity || []).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No recent activity.
              </div>
            ) : (
              (metrics?.recentActivity || []).map((act, i) => (
                <div className="adm-dash-activity-item" key={i}>
                  <div className="adm-dash-activity-icon" style={{ background: activityColor(act.action) + '18', color: activityColor(act.action) }}>
                    {activityIcon(act.action)}
                  </div>
                  <div className="adm-dash-activity-text">
                    <div className="adm-dash-activity-title">
                      {act.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'System Event'}
                    </div>
                    <div className="adm-dash-activity-subtitle">{act.details || '—'}</div>
                  </div>
                  <div className="adm-dash-activity-time">{timeAgo(act.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══ FACULTY EVALUATION TABLE ═══ */}
      <div className="card">
        <div className="card-header">
          <h2>Faculty Evaluation Progress</h2>
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.8s ease-in-out infinite' }} />
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

      {/* ═══ INSTITUTIONAL BANNER ═══ */}
      <div className="adm-dash-banner">
        <div className="adm-dash-banner-left">
          <div className="adm-dash-banner-title">Empowering Educators.<br />Enabling Excellence.</div>
          <div className="adm-dash-banner-subtitle">
            A secure, transparent and intelligent evaluation platform<br />for a better tomorrow.
          </div>
        </div>
        <div className="adm-dash-banner-badges">
          <div className="adm-dash-banner-badge">
            <div className="adm-dash-banner-badge-icon">🔒</div>
            <div>
              <div className="adm-dash-banner-badge-label">100%</div>
              <div className="adm-dash-banner-badge-sub">Secure & Auditable</div>
            </div>
          </div>
          <div className="adm-dash-banner-badge">
            <div className="adm-dash-banner-badge-icon">✓</div>
            <div>
              <div className="adm-dash-banner-badge-label">Trusted</div>
              <div className="adm-dash-banner-badge-sub">By Faculty & Students</div>
            </div>
          </div>
          <div className="adm-dash-banner-badge">
            <div className="adm-dash-banner-badge-icon">⭐</div>
            <div>
              <div className="adm-dash-banner-badge-label">Built for</div>
              <div className="adm-dash-banner-badge-sub">Academic Excellence</div>
            </div>
          </div>
        </div>
        <div className="adm-dash-banner-quote">
          <div className="adm-dash-banner-quote-text">
            &ldquo;The goal of education is not just knowledge,<br />but the transformation of human beings.&rdquo;
          </div>
          <div className="adm-dash-banner-quote-author">— Mata Amritanandamayi Devi</div>
        </div>
      </div>

    </div>
  );
}
