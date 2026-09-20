import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ── Golden Lotus Icon for Footer ── */
const GoldenLotus = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8c-2 6-6 12-14 16 7 2 13 0 14-8 1 8 7 10 14 8-8-4-12-10-14-16z" fill="#C9A84C" />
    <path d="M24 16c-3 8-10 14-20 16 9 3 17 0 20-9 3 9 11 12 20 9-10-2-17-8-20-16z" fill="#B4873B" />
    <circle cx="24" cy="38" r="2" fill="#C9A84C" />
  </svg>
);

/* ── Status Badge Component ── */
const StatusBadge = ({ status }) => {
  const isCompleted = ['COMPLETED', 'SUBMITTED', 'LOCKED'].includes(status);
  const isPending = status === 'PENDING';
  const isInProgress = ['IN_PROGRESS', 'DRAFT', 'UNLOCK_REQUESTED'].includes(status);

  let styleConfig = {
    bg: '#FEF3C7',
    color: '#B45309',
    border: '#FDE68A',
    dot: '#D97706',
    label: 'PENDING'
  };

  if (isCompleted) {
    styleConfig = {
      bg: '#DCFCE7',
      color: '#15803D',
      border: '#BBF7D0',
      dot: '#16A34A',
      label: 'COMPLETED'
    };
  } else if (isInProgress) {
    styleConfig = {
      bg: '#EFF6FF',
      color: '#1D4ED8',
      border: '#BFDBFE',
      dot: '#2563EB',
      label: status === 'UNLOCK_REQUESTED' ? 'UNLOCK REQ' : 'IN PROGRESS'
    };
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '20px', border: `1px solid ${styleConfig.border}`,
      background: styleConfig.bg, color: styleConfig.color,
      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.04em'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: styleConfig.dot, flexShrink: 0 }} />
      {styleConfig.label}
    </span>
  );
};

/* ── Filter Select Component ── */
const FilterSelect = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
      {label}
    </span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="fac-dash-filter-select"
      style={{
        padding: '5px 26px 5px 10px',
        fontSize: '0.78rem',
        fontWeight: 600,
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: 'var(--bg-white)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        minWidth: '100px'
      }}
    >
      <option value="ALL">All</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [filters, setFilters] = useState({ dept: 'ALL', subject: 'ALL', section: 'ALL', status: 'ALL' });
  const [activeMenuSheetId, setActiveMenuSheetId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('facultyToken');
    axios.get('/api/faculty/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setDashboard(r.data.data)).catch(console.error);

    axios.get('/api/faculty/doubts', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setDoubts(r.data.data || [])).catch(console.error);
  }, []);

  // Derive unique filter options dynamically from data
  const options = useMemo(() => {
    const all = dashboard?.assignments || [];
    const depts    = [...new Set(all.map(a => a.examName?.split(' / ')[0]?.trim()).filter(Boolean))];
    const subjects = [...new Set(all.map(a => a.examName?.split(' / ')[1]?.trim()).filter(Boolean))];
    const sections = [...new Set(all.map(a => a.examContext?.split(' ')[1]?.trim()).filter(Boolean))];
    const statuses = [...new Set(all.map(a => a.status).filter(Boolean))];
    return { depts, subjects, sections, statuses };
  }, [dashboard]);

  const filtered = useMemo(() => {
    const all = dashboard?.assignments || [];
    return all.filter(a => {
      const dept    = a.examName?.split(' / ')[0]?.trim();
      const subject = a.examName?.split(' / ')[1]?.trim();
      const section = a.examContext?.split(' ')[1]?.trim();
      if (filters.dept    !== 'ALL' && dept    !== filters.dept)    return false;
      if (filters.subject !== 'ALL' && subject !== filters.subject) return false;
      if (filters.section !== 'ALL' && section !== filters.section) return false;
      if (filters.status  !== 'ALL' && a.status !== filters.status) return false;
      return true;
    });
  }, [dashboard, filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const hasActiveFilter = Object.values(filters).some(v => v !== 'ALL');

  if (!dashboard) return (
    <div className="dash-loading" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
      <div className="dash-loading-spinner" />
      <span>Loading dashboard...</span>
    </div>
  );

  const pct = dashboard.totalAssigned > 0
    ? Math.round((dashboard.completed / dashboard.totalAssigned) * 100)
    : 0;

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';

  // Encouragement message based on progress
  let progressHeadline = 'Ready to begin?';
  let progressSubtext = 'Start evaluating your assigned answer sheets.';
  if (pct === 100) {
    progressHeadline = 'All completed!';
    progressSubtext = 'All assigned sheets have been evaluated.';
  } else if (pct >= 50) {
    progressHeadline = 'Great progress!';
    progressSubtext = "Keep going, you're halfway there.";
  } else if (pct > 0) {
    progressHeadline = 'Good start!';
    progressSubtext = 'Keep up the momentum to finish on time.';
  }

  return (
    <div className="fac-dash-root" style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* ─────────────────────────────────────────
          HERO BANNER (faculty_BG.png)
      ───────────────────────────────────────── */}
      <div className="fac-dash-hero" style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        minHeight: '170px',
        backgroundImage: 'url(/uploads/images/faculty_BG.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        border: '1px solid var(--border)'
      }}>
        {/* Soft light/mist gradient overlay on left */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, var(--bg-white) 0%, rgba(255,255,255,0.98) 46%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.2) 74%, transparent 88%)',
          zIndex: 1
        }} className="fac-dash-hero-overlay" />

        <div style={{
          position: 'relative', zIndex: 2,
          padding: '26px 36px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          {/* Left Greeting & Headline */}
          <div style={{ flex: '0 0 auto', maxWidth: '420px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              {greeting}
            </div>
            <h1 style={{
              fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-primary)',
              margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {dashboard.facultyName || 'Dr. Anita maam'} <span role="img" aria-label="wave">👋</span>
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
              Here's your evaluation progress for the ongoing semester.
            </p>
          </div>

          {/* Quote placed right around 50% width of the banner */}
          <div className="fac-dash-quote" style={{
            maxWidth: '280px',
            textAlign: 'left',
            paddingLeft: '20px',
            borderLeft: '2px solid rgba(201, 168, 76, 0.5)',
            marginLeft: '16px'
          }}>
            <div style={{
              fontSize: '1.02rem', fontStyle: 'italic', fontWeight: 600,
              color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.35
            }}>
              “Evaluation builds better learners”
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              — Amrita University
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          STUDENT DOUBTS NOTIFICATION BANNER (IF ANY)
      ───────────────────────────────────────── */}
      {doubts.some(d => d.status === 'PENDING') && (
        <div style={{
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--warning)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0
            }}>
              ✋
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--warning)' }}>
                {doubts.filter(d => d.status === 'PENDING').length} Student Query / Doubt Pending Review
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Students have requested clarification on evaluated questions or score totaling.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => navigate('/faculty/assignments?tab=doubts')}
            style={{
              background: '#b45309',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Review Queries ➔
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────
          4 STAT CARDS ROW
      ───────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }} className="fac-dash-stats-grid">
        {/* Card 1: Total Assigned */}
        <div className="fac-dash-stat-card" style={{
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.12)', color: 'var(--text-accent, #38bdf8)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {dashboard.totalAssigned}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Total Assigned
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Answer sheets
            </div>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="fac-dash-stat-card" style={{
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'var(--success-bg)', color: 'var(--success)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {dashboard.completed}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Completed
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Locked & submitted
            </div>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="fac-dash-stat-card" style={{
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'var(--warning-bg)', color: 'var(--warning)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {dashboard.pending}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Pending
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Awaiting evaluation
            </div>
          </div>
        </div>

        {/* Card 4: Completion */}
        <div className="fac-dash-stat-card" style={{
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: '#FAF5FF', color: '#9333EA', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Completion
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Overall progress
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          EVALUATION PROGRESS ROW (SPLIT 2 CARDS)
      ───────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.5fr 1fr',
        gap: '16px'
      }} className="fac-dash-progress-row">
        {/* Left Progress Card */}
        <div style={{
          background: 'var(--bg-white)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px 22px', boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Evaluation Progress
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {pct}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div style={{
            width: '100%', height: '10px', background: 'var(--bg-subtle)',
            borderRadius: '10px', overflow: 'hidden'
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #10B981, #059669)',
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            <span>{dashboard.completed} completed • {dashboard.pending} left</span>
          </div>
        </div>

        {/* Right Motivational Card */}
        <div style={{
          background: 'var(--success-bg)', border: '1px solid var(--success-border)',
          borderRadius: '14px', padding: '16px 18px', display: 'flex',
          alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)'
        }} className="fac-dash-encourage-card">
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'var(--success-bg)', color: 'var(--success)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4-4-4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--success)' }}>
              {progressHeadline}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '2px', lineHeight: 1.35 }}>
              {progressSubtext}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          EVALUATION OVERVIEW CARD & TABLE
      ───────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-white)', border: '1px solid var(--border)',
        borderRadius: '14px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
      }}>
        {/* Card Header & Filters */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Evaluation Overview
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              List of students and their evaluation status.
            </p>
          </div>

          {/* 4 Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <FilterSelect
              label="Department"
              value={filters.dept}
              options={options.depts}
              onChange={v => setFilter('dept', v)}
            />
            <FilterSelect
              label="Subject"
              value={filters.subject}
              options={options.subjects}
              onChange={v => setFilter('subject', v)}
            />
            <FilterSelect
              label="Section"
              value={filters.section}
              options={options.sections}
              onChange={v => setFilter('section', v)}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              options={options.statuses}
              onChange={v => setFilter('status', v)}
            />

            {hasActiveFilter && (
              <button
                onClick={() => setFilters({ dept: 'ALL', subject: 'ALL', section: 'ALL', status: 'ALL' })}
                style={{
                  marginTop: '16px',
                  padding: '5px 10px', fontSize: '0.74rem', fontWeight: 600,
                  border: '1px solid var(--error-border)', borderRadius: '6px',
                  background: 'var(--error-bg)', color: 'var(--error)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {!filtered.length ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {hasActiveFilter ? 'No records match the selected filters.' : 'No assignments found.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="fac-dash-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '45px' }}>#</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Examination</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Questions</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Breakdown</th>
                  <th style={{ padding: '12px 18px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isDone = ['COMPLETED', 'LOCKED'].includes(item.status);
                  const isMenuOpen = activeMenuSheetId === item.sheetId;

                  // Compute breakdown summary display
                  const summaryPairs = Object.entries(item.evaluationSummary || {});
                  const breakdownText = summaryPairs.length > 0
                    ? summaryPairs.map(([s, c]) => `${s}: ${c}`).join(' · ')
                    : `${item.status}: ${item.questionRange || 4}`;

                  return (
                    <tr
                      key={`${item.sheetId}-${item.questionRange}`}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s ease' }}
                      className="fac-dash-tr"
                    >
                      {/* Row # */}
                      <td style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* Student */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: '#1E3A5F', color: '#FFFFFF', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem',
                            flexShrink: 0
                          }}>
                            {item.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.studentName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                              {item.registrationNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Examination */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.examName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.examContext}
                        </div>
                      </td>

                      {/* Questions */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px', borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: 'var(--text-accent, #38bdf8)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.03em'
                        }}>
                          {item.questionRange ? item.questionRange.toUpperCase() : 'ALL'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Breakdown */}
                      <td style={{ padding: '14px 18px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {breakdownText}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative' }}>
                          <button
                            onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px',
                              border: isDone ? '1px solid var(--border)' : '1px solid var(--border)',
                              background: isDone ? 'var(--bg-subtle)' : 'var(--bg-white)',
                              color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                              fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.15s ease', boxShadow: 'var(--shadow-sm)'
                            }}
                            className="fac-dash-action-btn"
                          >
                            <span>{isDone ? 'View' : 'Evaluate'}</span>
                            <span style={{ fontSize: '0.85rem' }}>→</span>
                          </button>

                          {/* 3-dots more menu */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setActiveMenuSheetId(isMenuOpen ? null : item.sheetId)}
                              style={{
                                width: '28px', height: '28px', borderRadius: '6px',
                                border: 'none', background: 'transparent', color: 'var(--text-muted)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                              className="fac-dash-dots-btn"
                              title="More options"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                              </svg>
                            </button>

                            {isMenuOpen && (
                              <div style={{
                                position: 'absolute', right: 0, top: '100%',
                                background: 'var(--bg-white)', border: '1px solid var(--border)',
                                borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                                zIndex: 10, minWidth: '150px', padding: '6px 0'
                              }}>
                                <div
                                  onClick={() => { setActiveMenuSheetId(null); navigate(`/faculty/evaluate/${item.sheetId}`); }}
                                  style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}
                                  className="fac-dash-menu-item"
                                >
                                  Open Workspace
                                </div>
                                <div
                                  onClick={() => { setActiveMenuSheetId(null); navigate('/faculty/assignments'); }}
                                  style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}
                                  className="fac-dash-menu-item"
                                >
                                  View All in Exam
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────
          INSTITUTIONAL FOOTER
      ───────────────────────────────────────── */}
      <footer style={{
        marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', fontSize: '0.76rem', color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GoldenLotus />
          <span>© {new Date().getFullYear()} Amrita Vishwa Vidyapeetham &nbsp;|&nbsp; Examination Cell</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ cursor: 'pointer' }}>Terms of Use</span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ cursor: 'pointer' }}>Support</span>
        </div>
      </footer>

    </div>
  );
}
