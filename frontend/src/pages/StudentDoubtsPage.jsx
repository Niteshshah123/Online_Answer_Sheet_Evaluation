import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORY_MAP = {
  DOUBT: { label: 'Question Doubt', bg: 'rgba(56, 189, 248, 0.12)', color: '#0284C7', border: 'rgba(56, 189, 248, 0.28)' },
  MARKS_CALCULATION: { label: 'Marks Calculation', bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.28)' },
  UNCHECKED_PART: { label: 'Unchecked Step/Part', bg: 'rgba(236, 72, 153, 0.12)', color: '#DB2777', border: 'rgba(236, 72, 153, 0.28)' },
  REEVALUATION: { label: 'Re-evaluation Request', bg: 'rgba(139, 92, 246, 0.12)', color: '#7C3AED', border: 'rgba(139, 92, 246, 0.28)' },
  OTHER: { label: 'General Query', bg: 'rgba(148, 163, 184, 0.12)', color: '#64748B', border: 'rgba(148, 163, 184, 0.28)' }
};

export default function StudentDoubtsPage() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpDoubtId, setFollowUpDoubtId] = useState(null);
  const [followUpText, setFollowUpText] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const token = localStorage.getItem('studentToken');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/student/doubts', { headers });
      setDoubts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load student doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleFollowUpSubmit = async (doubtId) => {
    if (!followUpText.trim()) return;
    try {
      setFollowUpLoading(true);
      await axios.post(`/api/student/doubts/${doubtId}/follow-up`, {
        followUpComment: followUpText.trim()
      }, { headers });

      setFollowUpText('');
      setFollowUpDoubtId(null);
      await fetchDoubts();
      setMsg({ type: 'success', text: 'Follow-up query sent to your evaluator.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send follow-up.' });
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Statistics
  const totalCount = doubts.length;
  const pendingCount = doubts.filter(d => d.status === 'PENDING' || d.status === 'IN_REVIEW').length;
  const resolvedCount = doubts.filter(d => d.status === 'RESOLVED' || d.status === 'REJECTED').length;

  // Filtered list
  const uniqueSubjects = Array.from(new Set(doubts.map(d => d.subject).filter(Boolean)));

  const filteredDoubts = doubts.filter(d => {
    if (statusFilter === 'PENDING' && (d.status !== 'PENDING' && d.status !== 'IN_REVIEW')) return false;
    if (statusFilter === 'RESOLVED' && d.status !== 'RESOLVED' && d.status !== 'REJECTED') return false;
    if (subjectFilter !== 'ALL' && d.subject !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComment = d.comment?.toLowerCase().includes(q);
      const matchReply = d.teacherReply?.toLowerCase().includes(q);
      const matchSubject = d.subject?.toLowerCase().includes(q);
      const matchCourse = d.course?.toLowerCase().includes(q);
      const matchFaculty = d.cleanFacultyName?.toLowerCase().includes(q);
      const matchQ = d.questionNumber && `q${d.questionNumber}`.includes(q);
      if (!matchComment && !matchReply && !matchSubject && !matchCourse && !matchFaculty && !matchQ) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Alert message */}
      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✋ Doubts & Teacher Clarifications</span>
        </h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Track queries raised on your evaluated answer sheets, communicate with faculty evaluators, and review clarification history.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--bg-white)', padding: '16px 20px', borderRadius: '12px',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Raised Doubts
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalCount}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-white)', padding: '16px 20px', borderRadius: '12px',
          border: '1px solid var(--warning-border)', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Awaiting Teacher Reply
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-white)', padding: '16px 20px', borderRadius: '12px',
          border: '1px solid var(--success-border)', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resolved by Evaluator
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-white)', padding: '14px 18px', borderRadius: '12px',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '8px' }}>
          {[
            { key: 'ALL', label: `All (${totalCount})` },
            { key: 'PENDING', label: `Pending (${pendingCount})` },
            { key: 'RESOLVED', label: `Resolved (${resolvedCount})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                background: statusFilter === tab.key ? 'var(--bg-white)' : 'transparent',
                color: statusFilter === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: statusFilter === tab.key ? 700 : 500,
                fontSize: '0.8rem', cursor: 'pointer',
                boxShadow: statusFilter === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Subject Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          {uniqueSubjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', minWidth: '150px', fontSize: '0.82rem', padding: '6px 10px' }}
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search query, Q#, or teacher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.82rem', padding: '6px 12px 6px 32px', width: '100%' }}
            />
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div className="dash-loading-spinner" style={{ margin: '0 auto 12px' }} />
          Loading your doubt submissions...
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div style={{
          background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)',
          padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>💬</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No doubts found
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            {searchQuery || statusFilter !== 'ALL' || subjectFilter !== 'ALL'
              ? 'No doubt submissions match your selected filters or search terms.'
              : 'You have not raised any evaluation doubts yet. To raise a doubt, open your evaluated paper in My Papers and click "Raise Hand" on any question.'}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/student/dashboard')}
          >
            Go to My Papers
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDoubts.map(doubt => {
            const cat = CATEGORY_MAP[doubt.category] || CATEGORY_MAP.DOUBT;
            const isResolved = doubt.status === 'RESOLVED';
            const cleanEvaluator = doubt.cleanFacultyName || 'Faculty Evaluator';

            return (
              <div
                key={doubt._id}
                style={{
                  background: 'var(--bg-white)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.14)', color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px',
                      borderRadius: '6px', letterSpacing: '0.02em'
                    }}>
                      {doubt.questionNumber ? `Question ${doubt.questionNumber}` : 'General Paper Query'}
                    </span>

                    <span style={{
                      background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px'
                    }}>
                      {cat.label}
                    </span>

                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {doubt.subject} · {doubt.examType || 'Exam'}
                    </span>

                    {doubt.currentMark !== null && doubt.maxMark !== null && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        (Score: {doubt.currentMark}/{doubt.maxMark} Marks)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${isResolved ? 'badge-green' : 'badge-amber'}`} style={{ padding: '3px 10px', borderRadius: '20px' }}>
                      {isResolved ? '✓ RESOLVED' : '⏳ PENDING'}
                    </span>

                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Student Query Section */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Query:
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {doubt.comment}
                  </div>
                </div>

                {/* Evaluator Response (if resolved/replied) */}
                {doubt.teacherReply ? (
                  <div style={{
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✓ EVALUATOR RESPONSE ({cleanEvaluator}):</span>
                      </div>
                      {doubt.resolvedAt && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
                          {new Date(doubt.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {doubt.teacherReply}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--warning)', marginBottom: '10px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏳ Awaiting teacher review and response. Evaluator will verify your answers against the answer scheme.</span>
                  </div>
                )}

                {/* Actions bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {doubt.sheetId && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/student/report/${doubt.sheetId}`)}
                        style={{ fontSize: '0.76rem', fontWeight: 600, padding: '5px 10px' }}
                      >
                        📄 View in Answer Sheet
                      </button>
                    )}

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setFollowUpDoubtId(followUpDoubtId === doubt._id ? null : doubt._id);
                        setFollowUpText('');
                      }}
                      style={{ fontSize: '0.76rem', fontWeight: 600, padding: '5px 10px' }}
                    >
                      💬 {followUpDoubtId === doubt._id ? 'Cancel Follow-up' : 'Ask Follow-up Query'}
                    </button>
                  </div>
                </div>

                {/* Inline Follow-up form */}
                {followUpDoubtId === doubt._id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Post Follow-up Clarification to {cleanEvaluator}:
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Type your follow-up message..."
                      value={followUpText}
                      onChange={e => setFollowUpText(e.target.value)}
                      style={{ width: '100%', fontSize: '0.82rem', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setFollowUpDoubtId(null)}
                        disabled={followUpLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleFollowUpSubmit(doubt._id)}
                        disabled={followUpLoading || !followUpText.trim()}
                      >
                        {followUpLoading ? 'Sending...' : 'Send to Evaluator'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
