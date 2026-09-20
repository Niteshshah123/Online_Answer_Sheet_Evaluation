import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function resolvePdfUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//.test(url)) return url;
  const normalizedUrl = `/${String(url).replace(/^\/+/, '')}`;
  return window.location.port === '5173' ? `http://localhost:3000${normalizedUrl}` : normalizedUrl;
}

const statusCfg = (s) => {
  if (s === 'LOCKED')   return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', dot: '#16a34a' };
  if (s === 'DRAFT')    return { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: '#d97706' };
  if (s === 'PENDING')  return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', dot: '#6b7280' };
  return                       { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#2563eb' };
};

const doubtStatusCfg = (s) => {
  if (s === 'RESOLVED') return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Resolved' };
  if (s === 'REJECTED') return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Reviewed' };
  if (s === 'IN_REVIEW') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'In Review' };
  return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Hand Raised (Pending)' };
};

export default function StudentReportPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [error, setError] = useState('');
  const [pdfTab, setPdfTab] = useState('sheet'); // 'sheet' | 'key'

  // Raise hand modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [category, setCategory] = useState('DOUBT');
  const [comment, setComment] = useState('');
  const [submittingDoubt, setSubmittingDoubt] = useState(false);
  const [doubtSuccessMessage, setDoubtSuccessMessage] = useState('');
  const [doubtErrorMessage, setDoubtErrorMessage] = useState('');

  const token = localStorage.getItem('studentToken');

  const loadReport = async () => {
    try {
      const res = await axios.get(`/api/student/reports/${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(res.data.data || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load report');
    }
  };

  const loadDoubts = async () => {
    try {
      const res = await axios.get(`/api/student/doubts/sheet/${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoubts(res.data.data || []);
    } catch (e) {
      console.error('Failed to load doubts:', e);
    }
  };

  useEffect(() => {
    loadReport();
    loadDoubts();
  }, [sheetId]);

  const openRaiseModal = (qNum = '') => {
    setSelectedQuestion(qNum ? String(qNum) : '');
    setCategory('DOUBT');
    setComment('');
    setDoubtErrorMessage('');
    setDoubtSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setDoubtErrorMessage('Please write your query or explanation');
      return;
    }

    try {
      setSubmittingDoubt(true);
      setDoubtErrorMessage('');
      await axios.post('/api/student/doubts', {
        sheetId,
        questionNumber: selectedQuestion ? Number(selectedQuestion) : null,
        category,
        comment: comment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDoubtSuccessMessage('Your doubt has been raised! Your teacher will be notified to review.');
      await loadDoubts();
      setTimeout(() => {
        setIsModalOpen(false);
        setDoubtSuccessMessage('');
      }, 1500);
    } catch (err) {
      setDoubtErrorMessage(err.response?.data?.message || 'Failed to submit doubt. Please try again.');
    } finally {
      setSubmittingDoubt(false);
    }
  };

  const sheetUrl   = useMemo(() => resolvePdfUrl(report?.sheetPdfUrl), [report]);
  const keyUrl     = useMemo(() => resolvePdfUrl(report?.answerKeyUrl), [report]);
  const fullyEval  = report?.evaluations?.every(e => e.status === 'LOCKED');
  const pct        = report?.fullMarks > 0 ? Math.round((report.marksObtained / report.fullMarks) * 100) : 0;

  // Map doubts by questionNumber for fast lookup
  const doubtsByQ = useMemo(() => {
    const map = {};
    for (const d of doubts) {
      if (d.questionNumber) {
        if (!map[d.questionNumber]) map[d.questionNumber] = [];
        map[d.questionNumber].push(d);
      }
    }
    return map;
  }, [doubts]);

  if (error) return <div className="alert alert-error" style={{ margin: '20px' }}>{error}</div>;
  if (!report) return <div className="dash-loading"><div className="dash-loading-spinner" /> Loading report...</div>;

  return (
    <div className="dash-root">

      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Dashboard
        </button>

        <button
          className="btn"
          onClick={() => openRaiseModal('')}
          style={{
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2B4C7E 100%)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(30,58,95,0.25)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1rem' }}>✋</span>
          Raise Hand / Clarification
        </button>
      </div>

      {/* Score summary cards */}
      <div className="dash-stat-grid">
        <div className="dash-stat-card" style={{ '--accent-color': '#1E3A5F' }}>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{report.marksObtained ?? '—'}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}> / {report.fullMarks}</span></div>
            <div className="dash-stat-label">Raw Marks</div>
            <div className="dash-stat-sub">{report.examName}</div>
          </div>
        </div>
        <div className="dash-stat-card" style={{ '--accent-color': '#16a34a' }}>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{report.convertedMarks ?? '—'}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}> / {report.convertedScale || 30}</span></div>
            <div className="dash-stat-label">Converted Score</div>
            <div className="dash-stat-sub">Scale of {report.convertedScale || 30}</div>
          </div>
        </div>
        <div className="dash-stat-card" style={{ '--accent-color': '#d97706' }}>
          <div className="dash-stat-body">
            <div className="dash-stat-value">{pct}%</div>
            <div className="dash-stat-label">Percentage</div>
            <div className="dash-stat-sub">Raw score percentage</div>
          </div>
        </div>
        <div className="dash-stat-card" style={{ '--accent-color': doubts.length > 0 ? '#b45309' : '#6b7280' }}>
          <div className="dash-stat-body">
            <div className="dash-stat-value" style={{ fontSize: '1.2rem', paddingTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✋ {doubts.length}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                ({doubts.filter(d => d.status === 'RESOLVED').length} resolved)
              </span>
            </div>
            <div className="dash-stat-label">Doubts & Queries</div>
            <div className="dash-stat-sub">{doubts.filter(d => d.status === 'PENDING').length} pending review</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="dash-progress-banner">
        <div className="dash-progress-banner-left">
          <span className="dash-progress-banner-pct">{pct}%</span>
          <span className="dash-progress-banner-label">{report.examName} · {report.examContext}</span>
        </div>
        <div className="dash-progress-banner-bar">
          <div className="dash-progress-banner-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="dash-progress-banner-counts">
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{report.marksObtained} / {report.fullMarks} marks</span>
        </div>
      </div>

      {/* Two-column: PDF viewer + question breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '18px', alignItems: 'start' }}>

        {/* PDF viewer */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex' }}>
              {[['sheet', 'Answer Sheet (Evaluated)'], ['key', 'Answer Key & Scheme']].map(([tab, label]) => (
                <button key={tab} onClick={() => setPdfTab(tab)} style={{
                  flex: 1, padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700,
                  background: pdfTab === tab ? '#fff' : '#f8fafc', border: 'none', cursor: 'pointer',
                  borderBottom: `3px solid ${pdfTab === tab ? 'var(--amrita-maroon)' : 'transparent'}`,
                  color: pdfTab === tab ? 'var(--amrita-maroon)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ height: '560px', background: '#2c3038', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(pdfTab === 'sheet' ? sheetUrl : keyUrl) ? (
              <iframe
                title={pdfTab}
                src={pdfTab === 'sheet' ? sheetUrl : keyUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>No PDF document available</p>
            )}
          </div>
        </div>

        {/* Question-wise breakdown */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Question Evaluation Breakdown</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Review evaluated marks and raise clarification if needed
              </p>
            </div>
            <span className="badge badge-gray">{report.evaluations?.length} questions</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>Q#</th>
                  <th>Marks</th>
                  <th>Evaluator</th>
                  <th>Evaluator Note</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {report.evaluations?.map(item => {
                  const qDoubts = doubtsByQ[item.questionNumber] || [];
                  const latestDoubt = qDoubts[0];

                  return (
                    <tr key={item.questionNumber} style={{ verticalAlign: 'middle' }}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          Q{item.questionNumber}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem', fontVariantNumeric: 'tabular-nums' }}>
                            {item.marksObtained ?? '—'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>/ {item.maxMark ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {item.facultyName || '—'}
                      </td>
                      <td style={{ fontSize: '0.73rem', color: item.review ? 'var(--text-primary)' : 'var(--text-muted)', maxWidth: '140px' }}>
                        {item.review ? item.review : <em>No note</em>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {latestDoubt ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: doubtStatusCfg(latestDoubt.status).bg,
                              color: doubtStatusCfg(latestDoubt.status).color,
                              border: `1px solid ${doubtStatusCfg(latestDoubt.status).border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              ✋ {doubtStatusCfg(latestDoubt.status).label}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openRaiseModal(item.questionNumber)}
                            className="btn btn-ghost btn-xs"
                            title="Raise hand for this question"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              color: '#1E3A5F',
                              fontWeight: 600,
                              background: '#f0f4f8',
                              border: '1px solid #d0dbe7',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            ✋ Raise
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Doubts and Resolutions History Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✋ Raised Doubts & Teacher Clarifications</span>
              {doubts.length > 0 && <span className="badge badge-amber">{doubts.length}</span>}
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Track queries submitted to your evaluator and view their responses
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openRaiseModal('')}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            + New Clarification
          </button>
        </div>

        {doubts.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✋</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Doubts Raised Yet</div>
            <div style={{ fontSize: '0.75rem', maxWidth: '380px', margin: '4px auto 14px auto' }}>
              If you have any doubt regarding your marks, totaling, or steps evaluated, click "Raise Hand" to notify your teacher.
            </div>
            <button
              onClick={() => openRaiseModal('')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.78rem', background: '#1E3A5F' }}
            >
              Raise a Query
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {doubts.map((d) => {
              const dCfg = doubtStatusCfg(d.status);
              const formattedDate = new Date(d.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              const resolvedDate = d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : null;

              return (
                <div
                  key={d._id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: '#1E3A5F',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {d.questionNumber ? `Question ${d.questionNumber}` : 'General Paper Query'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Category: {d.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        • {formattedDate}
                      </span>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: dCfg.bg,
                      color: dCfg.color,
                      border: `1px solid ${dCfg.border}`
                    }}>
                      {dCfg.label}
                    </span>
                  </div>

                  {/* Student Comment */}
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: d.teacherReply ? '10px' : '0' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
                      Your Query:
                    </div>
                    {d.comment}
                  </div>

                  {/* Teacher Reply */}
                  {d.teacherReply ? (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#166534'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#15803d' }}>
                          ✓ Evaluator Reply ({d.facultyName || 'Faculty'}):
                        </span>
                        {resolvedDate && <span style={{ fontSize: '0.68rem', color: '#166534' }}>{resolvedDate}</span>}
                      </div>
                      <div style={{ fontWeight: 500 }}>{d.teacherReply}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⏳</span>
                      <span>Assigned to <strong>{d.facultyName || 'Faculty Evaluator'}</strong>. Waiting for review and response.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Raise Doubt Modal */}
      {isModalOpen && (
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
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✋</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Raise Clarification / Doubt</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#93c5fd' }}>Notify your teacher about marks or evaluation queries</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRaiseSubmit} style={{ padding: '20px' }}>
              {doubtSuccessMessage && (
                <div style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  ✓ {doubtSuccessMessage}
                </div>
              )}

              {doubtErrorMessage && (
                <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  ⚠ {doubtErrorMessage}
                </div>
              )}

              {/* Question Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Target Question
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="">General Query (Entire Paper / Totaling)</option>
                  {report.evaluations?.map(ev => (
                    <option key={ev.questionNumber} value={ev.questionNumber}>
                      Question {ev.questionNumber} (Awarded: {ev.marksObtained ?? 0} / {ev.maxMark ?? '—'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Query Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="DOUBT">Clarification / Doubt on Evaluation</option>
                  <option value="TOTALING_ERROR">Calculation / Totaling Error</option>
                  <option value="UNCHECKED_STEP">Unchecked Step / Method</option>
                  <option value="KEY_MISMATCH">Discrepancy with Answer Key</option>
                  <option value="OTHER">Other Query</option>
                </select>
              </div>

              {/* Comment */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Describe your doubt or clarification <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain clearly what you would like the teacher to review..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.82rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Your teacher evaluator will be notified directly and can review your evaluated answer sheet.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingDoubt}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingDoubt}
                  style={{
                    background: '#1E3A5F',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {submittingDoubt ? 'Submitting...' : 'Submit Clarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
