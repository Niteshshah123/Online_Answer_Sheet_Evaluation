import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const STATUS_CONFIG = {
  COMPLETED:        { dot: '#16a34a', bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--success-border)' },
  LOCKED:           { dot: '#16a34a', bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--success-border)' },
  IN_PROGRESS:      { dot: '#d97706', bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'var(--warning-border)' },
  DRAFT:            { dot: '#d97706', bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'var(--warning-border)' },
  PENDING:          { dot: '#6b7280', bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'var(--border)' },
  UNLOCK_REQUESTED: { dot: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '4px', border: `1px solid ${cfg.border}`,
      background: cfg.bg, color: cfg.color,
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function FacultyAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Main Page Tab: 'assignments' | 'doubts'
  const [activeMainTab, setActiveMainTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'doubts' ? 'doubts' : 'assignments';
  });

  // Doubt Reply Modal State
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [updatedMarks, setUpdatedMarks] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [doubtFilterStatus, setDoubtFilterStatus] = useState('ALL');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'DRAFT' | 'COMPLETED' | 'LOCKED' | 'UNLOCK_REQUESTED'

  // Accordion state: Map of keys e.g. "dept_CSE" -> boolean
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('facultyToken');
      const response = await axios.get('/api/faculty/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoubts = async () => {
    try {
      setDoubtLoading(true);
      const token = localStorage.getItem('facultyToken');
      const response = await axios.get('/api/faculty/doubts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoubts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load doubts:', error);
    } finally {
      setDoubtLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadDoubts();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setActionMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const toggleGroupCollapse = (key) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openReplyModal = (doubt) => {
    setSelectedDoubt(doubt);
    setReplyText(doubt.teacherReply || '');
    setReplyStatus(doubt.status === 'PENDING' ? 'RESOLVED' : doubt.status);
    setUpdatedMarks(doubt.currentMark !== null && doubt.currentMark !== undefined ? String(doubt.currentMark) : '');
  };

  const closeReplyModal = () => {
    setSelectedDoubt(null);
    setReplyText('');
    setUpdatedMarks('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setErrorMessage('Teacher reply comment is required');
      return;
    }

    try {
      setSubmittingReply(true);
      setErrorMessage('');
      const token = localStorage.getItem('facultyToken');
      await axios.post(`/api/faculty/doubts/${selectedDoubt._id}/reply`, {
        teacherReply: replyText.trim(),
        status: replyStatus,
        updatedMarks: updatedMarks !== '' ? Number(updatedMarks) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActionMessage(`Clarification submitted for ${selectedDoubt.studentName || 'Student'}! Status updated to ${replyStatus}.`);
      closeReplyModal();
      await loadDoubts();
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // ----------------------------------------------------
  // Valuation & In-Charge Actions
  // ----------------------------------------------------
  const handleFinalSubmit = async (examId) => {
    try {
      setActionMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/faculty/exams/${examId}/final-submit`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setActionMessage(res.data.data?.message || 'Final submission completed. Marks locked.');
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Final submission failed.');
    }
  };

  const handleTogglePublish = async (examId) => {
    try {
      setActionMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/faculty/exams/${examId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      const pub = res.data.data?.isPublished;
      setActionMessage(pub ? 'Results published to students for review!' : 'Student review unpublished.');
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Publish toggle failed.');
    }
  };

  const handleHandover = async (examId) => {
    try {
      setActionMessage('');
      setErrorMessage('');
      const res = await axios.post(
        `/api/faculty/exams/${examId}/handover`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setActionMessage(res.data.data?.message || 'Paper evaluations handed over to Course Handling Faculty successfully.');
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Handover failed.');
    }
  };

  const handleExportAUMS = async (examId, examName) => {
    try {
      const res = await axios.get(`/api/faculty/exams/${examId}/export-aums`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AUMS_Export_${examName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Failed to download AUMS Excel report.');
    }
  };

  // ----------------------------------------------------
  // Filtering & Search Logic
  // ----------------------------------------------------
  const uniqueCourses = useMemo(() => ['ALL', ...new Set(items.map(i => i.course).filter(Boolean))], [items]);
  const uniqueSubjects = useMemo(() => ['ALL', ...new Set(items.map(i => i.subject).filter(Boolean))], [items]);
  const uniqueSemesters = useMemo(() => ['ALL', ...new Set(items.map(i => String(i.semester)).filter(Boolean))], [items]);
  const uniqueSections = useMemo(() => ['ALL', ...new Set(items.map(i => i.section).filter(Boolean))], [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Global search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (item.studentName || '').toLowerCase().includes(q) ||
          (item.registrationNumber || '').toLowerCase().includes(q) ||
          (item.subject || '').toLowerCase().includes(q) ||
          (item.course || '').toLowerCase().includes(q) ||
          (item.section || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Dropdown filters
      if (filterCourse !== 'ALL' && item.course !== filterCourse) return false;
      if (filterSubject !== 'ALL' && item.subject !== filterSubject) return false;
      if (filterSemester !== 'ALL' && String(item.semester) !== filterSemester) return false;
      if (filterSection !== 'ALL' && item.section !== filterSection) return false;
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;

      return true;
    });
  }, [items, searchQuery, filterCourse, filterSubject, filterSemester, filterSection, filterStatus]);

  // ----------------------------------------------------
  // Hierarchical Grouping: Department -> Subject -> Exam Cohorts
  // ----------------------------------------------------
  const hierarchicalData = useMemo(() => {
    const deptMap = new Map();

    for (const item of filteredItems) {
      const deptKey = item.course || 'General Department';
      const subKey = item.subject || 'General Subject';
      const examKey = item.examId ? item.examId.toString() : `unknown-${item.examName}`;

      if (!deptMap.has(deptKey)) {
        deptMap.set(deptKey, new Map());
      }
      const subMap = deptMap.get(deptKey);

      if (!subMap.has(subKey)) {
        subMap.set(subKey, new Map());
      }
      const examMap = subMap.get(subKey);

      if (!examMap.has(examKey)) {
        examMap.set(examKey, {
          examId: item.examId,
          examName: item.examName,
          course: item.course,
          subject: item.subject,
          semester: item.semester,
          section: item.section,
          examType: item.examType || 'Mid_Term',
          targetScale: item.targetScale || 30,
          isCourseInCharge: item.isCourseInCharge,
          courseInChargeName: item.courseInChargeName,
          finalSubmittedToAdmin: item.finalSubmittedToAdmin,
          isPublished: item.isPublished,
          allCoEvaluatorsHandedOver: item.allCoEvaluatorsHandedOver,
          isHandedOver: item.isHandedOver,
          sheets: []
        });
      }

      examMap.get(examKey).sheets.push(item);
    }

    const hierarchy = [];
    for (const [course, subMap] of deptMap.entries()) {
      let deptSheets = 0;
      let deptCompleted = 0;
      const subjectList = [];

      for (const [subject, examMap] of subMap.entries()) {
        let subSheets = 0;
        let subCompleted = 0;
        const cohortList = [];

        for (const cohort of examMap.values()) {
          const completedCount = cohort.sheets.filter(s => ['COMPLETED', 'LOCKED', 'SUBMITTED'].includes(s.status)).length;
          const totalCount = cohort.sheets.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          cohortList.push({
            ...cohort,
            completedCount,
            totalCount,
            percent
          });

          subSheets += totalCount;
          subCompleted += completedCount;
        }

        deptSheets += subSheets;
        deptCompleted += subCompleted;

        subjectList.push({
          subject,
          cohorts: cohortList,
          totalCount: subSheets,
          completedCount: subCompleted,
          percent: subSheets ? Math.round((subCompleted / subSheets) * 100) : 0
        });
      }

      hierarchy.push({
        course,
        subjects: subjectList,
        totalCount: deptSheets,
        completedCount: deptCompleted,
        percent: deptSheets ? Math.round((deptCompleted / deptSheets) * 100) : 0
      });
    }

    return hierarchy;
  }, [filteredItems]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCourse('ALL');
    setFilterSubject('ALL');
    setFilterSemester('ALL');
    setFilterSection('ALL');
    setFilterStatus('ALL');
  };

  const pendingDoubtsCount = useMemo(() => {
    return doubts.filter(d => d.status === 'PENDING').length;
  }, [doubts]);

  const filteredDoubts = useMemo(() => {
    return doubts.filter(d => {
      if (doubtFilterStatus !== 'ALL' && d.status !== doubtFilterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (d.studentName || '').toLowerCase().includes(q) ||
          (d.studentRegNo || '').toLowerCase().includes(q) ||
          (d.examName || '').toLowerCase().includes(q) ||
          (d.comment || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [doubts, doubtFilterStatus, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      {/* ────────────────────────────────────────────────────────
          MAIN TOP NAVIGATION TABS (VALUATION vs DOUBTS)
         ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('assignments')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: activeMainTab === 'assignments' ? 800 : 600,
              color: activeMainTab === 'assignments' ? 'var(--amrita-maroon)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeMainTab === 'assignments' ? 'var(--amrita-maroon)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              marginBottom: '-2px'
            }}
          >
            <span>📋 Valuation Assignments</span>
            <span style={{
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: activeMainTab === 'assignments' ? 'var(--accent-light)' : 'var(--bg-subtle)',
              color: activeMainTab === 'assignments' ? 'var(--amrita-maroon)' : 'var(--text-secondary)'
            }}>
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('doubts')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: activeMainTab === 'doubts' ? 800 : 600,
              color: activeMainTab === 'doubts' ? 'var(--warning)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeMainTab === 'doubts' ? 'var(--warning)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              marginBottom: '-2px'
            }}
          >
            <span>✋ Student Doubts & Grievances</span>
            <span style={{
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: pendingDoubtsCount > 0 ? 'var(--warning-bg)' : 'var(--bg-subtle)',
              color: pendingDoubtsCount > 0 ? 'var(--warning)' : 'var(--text-secondary)',
              border: pendingDoubtsCount > 0 ? '1px solid var(--warning-border)' : 'none'
            }}>
              {pendingDoubtsCount > 0 ? `✋ ${pendingDoubtsCount} Pending` : doubts.length}
            </span>
          </button>
        </div>
      </div>

      {activeMainTab === 'doubts' ? (
        /* ────────────────────────────────────────────────────────
            VIEW: STUDENT DOUBTS & GRIEVANCES MANAGEMENT
           ──────────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Quick Filter Bar for Doubts */}
          <div style={{
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
              {[
                ['ALL', `All (${doubts.length})`],
                ['PENDING', `Pending (${doubts.filter(d => d.status === 'PENDING').length})`],
                ['IN_REVIEW', `In Review (${doubts.filter(d => d.status === 'IN_REVIEW').length})`],
                ['RESOLVED', `Resolved (${doubts.filter(d => d.status === 'RESOLVED').length})`],
                ['REJECTED', `Reviewed (${doubts.filter(d => d.status === 'REJECTED').length})`]
              ].map(([st, label]) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDoubtFilterStatus(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: doubtFilterStatus === st ? 700 : 500,
                    border: doubtFilterStatus === st ? '1px solid #1E3A5F' : '1px solid var(--border)',
                    background: doubtFilterStatus === st ? '#1E3A5F' : 'transparent',
                    color: doubtFilterStatus === st ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search doubts by student or comment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.78rem',
                  minWidth: '220px'
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={loadDoubts}
                title="Refresh doubts"
                style={{ fontSize: '0.78rem' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {doubtLoading ? (
            <div className="dash-loading" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="dash-loading-spinner" /> Loading student doubts...
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Doubts Found</div>
              <p style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                {doubtFilterStatus !== 'ALL'
                  ? `No doubts currently in ${doubtFilterStatus} status.`
                  : 'No student doubts have been raised for your assigned papers yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDoubts.map(d => {
                const formattedDate = new Date(d.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const isPending = d.status === 'PENDING';
                const isResolved = d.status === 'RESOLVED';

                return (
                  <div
                    key={d._id}
                    style={{
                      background: 'var(--bg-white)',
                      border: `1px solid ${isPending ? 'var(--warning-border)' : 'var(--border)'}`,
                      borderLeft: `4px solid ${isPending ? 'var(--warning)' : isResolved ? 'var(--success)' : '#2563eb'}`,
                      borderRadius: '10px',
                      padding: '16px 18px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="fac-avatar" style={{ background: '#1E3A5F', color: '#fff' }}>
                          {d.studentName?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {d.studentName} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({d.studentRegNo})</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {d.examName} &nbsp;•&nbsp; {d.examContext}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#1E3A5F',
                          color: '#fff'
                        }}>
                          {d.questionNumber ? `Question ${d.questionNumber}` : 'General Paper Query'}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isPending ? 'var(--warning-bg)' : isResolved ? 'var(--success-bg)' : 'rgba(56, 189, 248, 0.12)',
                          color: isPending ? 'var(--warning)' : isResolved ? 'var(--success)' : 'var(--text-accent, #38bdf8)',
                          border: `1px solid ${isPending ? 'var(--warning-border)' : isResolved ? 'var(--success-border)' : 'rgba(56, 189, 248, 0.25)'}`
                        }}>
                          {d.status}
                        </span>
                      </div>
                    </div>

                    {/* Doubt details & comment */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>CATEGORY: {d.category}</span>
                        <span>Raised on {formattedDate}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        "{d.comment}"
                      </div>
                    </div>

                    {/* If question mark info exists */}
                    {d.questionNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <div>
                          Awarded Marks: <strong style={{ color: 'var(--text-primary)' }}>{d.currentMark ?? '—'}</strong> / {d.maxMark ?? '—'}
                        </div>
                      </div>
                    )}

                    {/* Teacher Reply if already responded */}
                    {d.teacherReply && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#166534' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '3px' }}>
                          ✓ Your Reply:
                        </div>
                        <div>{d.teacherReply}</div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      {d.sheetId && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => navigate(`/faculty/evaluate/${d.sheetId}`)}
                        >
                          🔍 Open Paper
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', background: '#1E3A5F', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => openReplyModal(d)}
                      >
                        <span>💬</span>
                        <span>{d.teacherReply ? 'Edit Response / Marks' : 'Review & Reply'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* ────────────────────────────────────────────────────────
            VIEW A & B: VALUATION ASSIGNMENTS (EXISTING FLOW)
           ──────────────────────────────────────────────────────── */
        <>
          {/* ────────────────────────────────────────────────────────
              COMPACT MODERN FILTER & SEARCH TOOLBAR
             ──────────────────────────────────────────────────────── */}
          <div className="filter-toolbar">
            {/* Top Row: Search input + View Switcher */}
            <div className="filter-toolbar-top">
              <div className="filter-search-box">
                <span className="filter-search-icon">
                  <SearchIcon />
                </span>
                <input
                  className="filter-search-input"
                  placeholder="Search student name, roll no, subject, section..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="filter-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Mode Toggle Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>View:</span>
                <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      fontWeight: viewMode === 'card' ? 700 : 500,
                      color: viewMode === 'card' ? 'var(--amrita-maroon)' : 'var(--text-secondary)',
                      background: viewMode === 'card' ? 'var(--bg-white)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <GridIcon /> Grouped Cohorts
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                      fontWeight: viewMode === 'table' ? 700 : 500,
                      color: viewMode === 'table' ? 'var(--amrita-maroon)' : 'var(--text-secondary)',
                      background: viewMode === 'table' ? 'var(--bg-white)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ListIcon /> Flat Student List
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Inline Filter Pills */}
            <div className="filter-pills-row">
              {/* Department */}
              <div className={`filter-pill ${filterCourse !== 'ALL' ? 'active' : ''}`}>
                <span className="filter-pill-label">Dept:</span>
                <select
                  className="filter-pill-select"
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                >
                  {uniqueCourses.map(c => (
                    <option key={c} value={c}>{c === 'ALL' ? 'All Depts' : c}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className={`filter-pill ${filterSubject !== 'ALL' ? 'active' : ''}`}>
                <span className="filter-pill-label">Subject:</span>
                <select
                  className="filter-pill-select"
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                >
                  {uniqueSubjects.map(s => (
                    <option key={s} value={s}>{s === 'ALL' ? 'All Subjects' : s}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div className={`filter-pill ${filterSemester !== 'ALL' ? 'active' : ''}`}>
                <span className="filter-pill-label">Sem:</span>
                <select
                  className="filter-pill-select"
                  value={filterSemester}
                  onChange={e => setFilterSemester(e.target.value)}
                >
                  {uniqueSemesters.map(s => (
                    <option key={s} value={s}>{s === 'ALL' ? 'All Semesters' : `Sem ${s}`}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className={`filter-pill ${filterSection !== 'ALL' ? 'active' : ''}`}>
                <span className="filter-pill-label">Sec:</span>
                <select
                  className="filter-pill-select"
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                >
                  {uniqueSections.map(s => (
                    <option key={s} value={s}>{s === 'ALL' ? 'All Sections' : `Sec ${s}`}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className={`filter-pill ${filterStatus !== 'ALL' ? 'active' : ''}`}>
                <span className="filter-pill-label">Status:</span>
                <select
                  className="filter-pill-select"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="DRAFT">In Progress (Draft)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="LOCKED">Locked</option>
                  <option value="UNLOCK_REQUESTED">Unlock Requested</option>
                </select>
              </div>

              {/* Reset Action */}
              {(filterCourse !== 'ALL' || filterSubject !== 'ALL' || filterSemester !== 'ALL' || filterSection !== 'ALL' || filterStatus !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="filter-reset-btn"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          {loading ? (
            <div className="dash-loading" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="dash-loading-spinner" /> Loading assignments...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Matching Answer Sheets</div>
              <p style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '6px auto 16px auto' }}>
                No evaluated or pending answer sheets match your active filters or search terms.
              </p>
              <button type="button" onClick={resetFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'card' ? (
            /* ────────────────────────────────────────────────────────
                VIEW A: HIERARCHICAL ACCORDION CARDS
               ──────────────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {hierarchicalData.map(deptGroup => {
                const deptKey = `dept_${deptGroup.course}`;
                const isDeptCollapsed = !!collapsedGroups[deptKey];

                return (
                  <div
                    key={deptKey}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      background: 'var(--bg-white)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Level 1: Department Header */}
                    <div
                      onClick={() => toggleGroupCollapse(deptKey)}
                      style={{
                        padding: '14px 18px',
                        background: 'var(--bg-subtle)',
                        borderBottom: isDeptCollapsed ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ChevronIcon open={!isDeptCollapsed} />
                        <div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            DEPARTMENT
                          </span>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {deptGroup.course}
                          </h3>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {deptGroup.completedCount} / {deptGroup.totalCount} Evaluated
                          </span>
                          <div style={{ width: '120px', height: '6px', background: 'var(--border)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${deptGroup.percent}%`, height: '100%', background: 'var(--amrita-maroon)', borderRadius: '3px' }} />
                          </div>
                        </div>
                        <span className="badge badge-gray">{deptGroup.subjects.length} Subjects</span>
                      </div>
                    </div>

                    {/* Level 1 Body (Subjects) */}
                    {!isDeptCollapsed && (
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-page)' }}>
                        {deptGroup.subjects.map(subGroup => {
                          const subKey = `sub_${deptGroup.course}_${subGroup.subject}`;
                          const isSubCollapsed = !!collapsedGroups[subKey];

                          return (
                            <div
                              key={subKey}
                              style={{
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                background: 'var(--bg-white)',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Level 2: Subject Header */}
                              <div
                                onClick={() => toggleGroupCollapse(subKey)}
                                style={{
                                  padding: '12px 16px',
                                  background: 'var(--bg-white)',
                                  borderBottom: isSubCollapsed ? 'none' : '1px solid var(--border)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  userSelect: 'none'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <ChevronIcon open={!isSubCollapsed} />
                                  <div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--amrita-maroon)', textTransform: 'uppercase' }}>
                                      COURSE SUBJECT
                                    </span>
                                    <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {subGroup.subject}
                                    </h4>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {subGroup.completedCount} / {subGroup.totalCount} Sheets ({subGroup.percent}%)
                                  </span>
                                  <span className="badge badge-blue">{subGroup.cohorts.length} Cohorts</span>
                                </div>
                              </div>

                              {/* Level 2 Body (Exam Cohorts) */}
                              {!isSubCollapsed && (
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {subGroup.cohorts.map(cohort => (
                                    <div
                                      key={cohort.examId}
                                      style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        background: 'var(--bg-white)',
                                        padding: '14px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                      }}
                                    >
                                      {/* Cohort Header & Valuation Actions */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        borderBottom: '1px solid var(--border)',
                                        paddingBottom: '10px',
                                        marginBottom: '10px'
                                      }}>
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                              Sem {cohort.semester} &nbsp;·&nbsp; Section {cohort.section}
                                            </span>
                                            <span className="badge badge-gray">{cohort.examType}</span>
                                            {cohort.isCourseInCharge && (
                                              <span className="badge badge-maroon" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                                ★ In-Charge Faculty
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Scale: {cohort.targetScale || 30} Marks &nbsp;|&nbsp; {cohort.completedCount} of {cohort.sheets.length} Evaluated ({cohort.percent}%)
                                          </div>
                                        </div>

                                        {/* Action Buttons for Valuation & In-Charge */}
                                        {cohort.isCourseInCharge && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <button
                                              type="button"
                                              className="btn btn-secondary btn-sm"
                                              style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                                              onClick={() => handleExportAUMS(cohort.examId, `${cohort.subject}_${cohort.section}`)}
                                              title="Download AUMS Excel score sheet"
                                            >
                                              <DownloadIcon /> Export AUMS
                                            </button>

                                            <button
                                              type="button"
                                              className="btn btn-secondary btn-sm"
                                              style={{
                                                fontSize: '0.74rem',
                                                padding: '4px 8px',
                                                borderColor: cohort.isPublished ? 'var(--success)' : 'var(--border)',
                                                color: cohort.isPublished ? 'var(--success)' : 'var(--text-primary)'
                                              }}
                                              onClick={() => handleTogglePublish(cohort.examId)}
                                              title="Allow students to view evaluated marks"
                                            >
                                              {cohort.isPublished ? '✓ Published to Students' : '👁 Publish Results'}
                                            </button>

                                            {!cohort.finalSubmittedToAdmin ? (
                                              <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                                                onClick={() => handleFinalSubmit(cohort.examId)}
                                                title="Lock and submit final marks to Admin"
                                              >
                                                🔒 Final Submit
                                              </button>
                                            ) : (
                                              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                                                🔒 Locked & Submitted
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Answer Sheets Table */}
                                      <table className="data-table" style={{ background: 'var(--bg-white)' }}>
                                        <thead>
                                          <tr>
                                            <th>Student</th>
                                            <th>Assigned Questions</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {cohort.sheets.map(item => (
                                            <tr key={item.sheetId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}>
                                              <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  <div className="fac-avatar">{item.studentName?.charAt(0)}</div>
                                                  <div>
                                                    <strong>{item.studentName}</strong>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                      {item.registrationNumber}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>
                                              <td><span className="badge badge-maroon">{item.questionRange}</span></td>
                                              <td><StatusBadge status={item.status} /></td>
                                              <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                  type="button"
                                                  className="btn btn-primary btn-sm"
                                                  style={{ fontSize: '0.74rem', padding: '3px 9px' }}
                                                  onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                                                >
                                                  Open Sheet
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
                VIEW B: FLAT STUDENT LIST TABLE
               ──────────────────────────────────────────────────────── */
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ margin: 0, minWidth: '950px' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Department &amp; Subject</th>
                      <th>Cohort</th>
                      <th>Assigned Qs</th>
                      <th>Valuation Status</th>
                      <th>Admin Lock</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.sheetId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}>
                        {/* Student */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="fac-avatar">{item.studentName?.charAt(0)}</div>
                            <div>
                              <strong>{item.studentName}</strong>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {item.registrationNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subject & Department */}
                        <td>
                          <strong>{item.subject}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Dept: {item.course}
                          </div>
                        </td>

                        {/* Cohort */}
                        <td>
                          <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                            Sem {item.semester} &nbsp;·&nbsp; Sec {item.section}
                          </span>
                        </td>

                        {/* Assigned Questions */}
                        <td>
                          <span className="badge badge-maroon">{item.questionRange}</span>
                        </td>

                        {/* Valuation Status */}
                        <td>
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Admin Lock Status */}
                        <td>
                          <span className={`badge ${item.finalSubmittedToAdmin ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                            {item.finalSubmittedToAdmin ? 'Locked' : 'Open'}
                          </span>
                        </td>

                        {/* Action Button */}
                        <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            onClick={() => navigate(`/faculty/evaluate/${item.sheetId}`)}
                          >
                            Open Sheet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────────────
          FACULTY DOUBT REPLY & MARK ADJUSTMENT MODAL
         ──────────────────────────────────────────────────────── */}
      {selectedDoubt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1E3A5F',
              color: '#fff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Review Student Doubt</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#93c5fd' }}>
                  {selectedDoubt.studentName} ({selectedDoubt.studentRegNo}) &nbsp;•&nbsp; {selectedDoubt.examName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReplyModal}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplySubmit} style={{ padding: '20px' }}>
              {/* Doubt summary banner */}
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDoubt.questionNumber ? `Question ${selectedDoubt.questionNumber}` : 'General Query'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Category: {selectedDoubt.category}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>
                  "{selectedDoubt.comment}"
                </div>
                {selectedDoubt.questionNumber && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Current Marks: <strong>{selectedDoubt.currentMark ?? '—'}</strong> / {selectedDoubt.maxMark ?? '—'}
                  </div>
                )}
              </div>

              {/* Adjust Question Marks if applicable */}
              {selectedDoubt.questionNumber && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Adjust / Update Question {selectedDoubt.questionNumber} Marks (Optional)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={selectedDoubt.maxMark || 100}
                      value={updatedMarks}
                      onChange={(e) => setUpdatedMarks(e.target.value)}
                      placeholder="Enter new marks"
                      className="form-control"
                      style={{
                        width: '130px',
                        padding: '8px 10px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Max: {selectedDoubt.maxMark ?? '—'} marks
                    </span>
                  </div>
                </div>
              )}

              {/* Resolution Status */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Resolution Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <option value="RESOLVED">Resolved (Accepted & Answered / Marks Updated)</option>
                  <option value="REJECTED">Reviewed (Marks Remain As Is)</option>
                  <option value="IN_REVIEW">Under Review / Further Checking</option>
                </select>
              </div>

              {/* Teacher Reply / Explanation */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Teacher Reply & Explanation <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your explanation or remark to the student..."
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeReplyModal}
                  disabled={submittingReply}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingReply}
                >
                  {submittingReply ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
