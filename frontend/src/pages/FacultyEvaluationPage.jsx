import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_BADGE = {
  'VALUATION COMPLETED': 'badge-green',
  LOCKED: 'badge-green',
  COMPLETED: 'badge-green',
  SUBMITTED: 'badge-green',
  UNLOCK_REQUESTED: 'badge-amber',
  DRAFT: 'badge-blue',
  PENDING: 'badge-gray',
};

const ctrlBtn = {
  width: '24px', height: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-secondary)', transition: 'all 0.15s ease'
};

const PdfControls = ({ label, icon, zoom, onZoomIn, onZoomOut, onRotate }) => (
  <div style={{
    padding: '0 14px',
    height: '42px',
    background: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon && <span style={{ display: 'flex', alignItems: 'center', color: 'var(--amrita-maroon)' }}>{icon}</span>}
      <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-white)', padding: '2px 4px', borderRadius: '6px', border: '1px solid var(--border)' }}>
      <button onClick={onZoomOut} style={ctrlBtn} title="Zoom Out">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '38px', textAlign: 'center', userSelect: 'none' }}>
        {zoom}%
      </span>
      <button onClick={onZoomIn} style={ctrlBtn} title="Zoom In">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <div style={{ width: '1px', height: '14px', background: 'var(--border)', margin: '0 2px' }} />
      <button onClick={onRotate} style={ctrlBtn} title="Rotate 90°">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>
    </div>
  </div>
);

export default function FacultyEvaluationPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const pageRootRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEvalPanel, setShowEvalPanel] = useState(true);
  const [isSwapped, setIsSwapped] = useState(() => {
    try {
      return localStorage.getItem('faculty_pdf_swap_position') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSwapPanels = () => {
    setIsSwapped(prev => {
      const next = !prev;
      try {
        localStorage.setItem('faculty_pdf_swap_position', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [rows, setRows] = useState([]);
  const [questionPaperUrl, setQuestionPaperUrl] = useState(null);
  const [sheetPdfUrl, setSheetPdfUrl] = useState(null);
  const [answerKeyUrl, setAnswerKeyUrl] = useState(null);
  const [examType, setExamType] = useState('Mid_Term');
  const [targetScale, setTargetScale] = useState(30);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [remarkOpen, setRemarkOpen] = useState({});

  const [fullExamMaxMarks, setFullExamMaxMarks] = useState(50);
  const [coEvaluatorScore, setCoEvaluatorScore] = useState(0);
  const [coEvaluatorMax, setCoEvaluatorMax] = useState(0);

  const [panelWidths, setPanelWidths] = useState({ left: 35, center: 35, right: 30 });
  const [isDragging, setIsDragging] = useState(null);
  
  const [paperZoom, setPaperZoom] = useState(100);
  const [paperRotate, setPaperRotate] = useState(0);
  const [sheetZoom, setSheetZoom] = useState(100);
  const [sheetRotate, setSheetRotate] = useState(0);
  const [keyZoom, setKeyZoom] = useState(100);
  const [keyRotate, setKeyRotate] = useState(0);

  const [finalSubmittedToAdmin, setFinalSubmittedToAdmin] = useState(false);

  const [sheetDoubts, setSheetDoubts] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ name: 'Student', regNo: '—' });
  const [selectedQuestionDoubt, setSelectedQuestionDoubt] = useState(null);
  const [doubtReplyText, setDoubtReplyText] = useState('');
  const [doubtReplyStatus, setDoubtReplyStatus] = useState('RESOLVED');
  const [doubtAdjustedMark, setDoubtAdjustedMark] = useState('');
  const [savingDoubtReply, setSavingDoubtReply] = useState(false);

  const load = async () => {
    try {
      setLoading(true); setErrorMessage('');
      const token = localStorage.getItem('facultyToken');
      const res = await axios.get(`/api/faculty/evaluations?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = res.data.data || {};
      setRows(d.evaluations || []);
      setQuestionPaperUrl(d.questionPaperUrl || null);
      setSheetPdfUrl(d.sheetPdfUrl || null);
      setAnswerKeyUrl(d.answerKeyUrl || null);
      setExamType(d.examType || 'Mid_Term');
      setFullExamMaxMarks(d.fullExamMaxMarks || 50);
      setCoEvaluatorScore(d.coEvaluatorScore || 0);
      setCoEvaluatorMax(d.coEvaluatorMax || 0);
      setFinalSubmittedToAdmin(Boolean(d.finalSubmittedToAdmin));
      if (d.convertedScale) setTargetScale(d.convertedScale);
      setStudentInfo({
        name: d.studentName || 'Student',
        regNo: d.registrationNumber || '—'
      });
      if (d.doubts && Array.isArray(d.doubts)) {
        setSheetDoubts(d.doubts);
      }

      // Also refresh faculty doubts to ensure latest comments & status
      try {
        const doubtsRes = await axios.get('/api/faculty/doubts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allDoubts = doubtsRes.data.data || [];
        const filtered = allDoubts.filter(db => String(db.sheetId) === String(sheetId));
        if (filtered.length > 0) {
          setSheetDoubts(filtered);
        }
      } catch (errDb) {
        console.error('Failed to load doubts for sheet:', errDb);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to load evaluation sheet.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [sheetId]);

  const openDoubtModal = (qNum, evaluationId, currentMark, maxMark) => {
    const qDoubts = sheetDoubts.filter(d => Number(d.questionNumber) === Number(qNum));
    const pendingDoubt = qDoubts.find(d => d.status === 'PENDING' || d.status === 'IN_REVIEW');
    const latestDoubt = pendingDoubt || [...qDoubts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    setSelectedQuestionDoubt({
      questionNumber: qNum,
      evaluationId,
      doubts: qDoubts,
      latestDoubt,
      currentMark,
      maxMark
    });
    setDoubtReplyText(latestDoubt?.teacherReply || '');
    setDoubtReplyStatus(latestDoubt?.status === 'PENDING' ? 'RESOLVED' : (latestDoubt?.status || 'RESOLVED'));
    setDoubtAdjustedMark(currentMark != null && currentMark !== undefined ? String(currentMark) : '');
  };

  const closeDoubtModal = () => {
    setSelectedQuestionDoubt(null);
    setDoubtReplyText('');
    setDoubtAdjustedMark('');
  };

  const handleDoubtModalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuestionDoubt || !selectedQuestionDoubt.latestDoubt) return;
    try {
      setSavingDoubtReply(true);
      const token = localStorage.getItem('facultyToken');
      const doubtId = selectedQuestionDoubt.latestDoubt._id;
      const willAdjust = !finalSubmittedToAdmin && doubtAdjustedMark !== '' && doubtAdjustedMark !== null;

      await axios.post(`/api/faculty/doubts/${doubtId}/reply`, {
        teacherReply: doubtReplyText.trim(),
        status: doubtReplyStatus,
        updatedMarks: willAdjust ? Math.round(Number(doubtAdjustedMark)) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (willAdjust) {
        updateRow(selectedQuestionDoubt.evaluationId, 'marksObtained', Math.round(Number(doubtAdjustedMark)));
      }

      setMessage(`Student query on Question ${selectedQuestionDoubt.questionNumber} updated successfully.`);
      closeDoubtModal();
      await load();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit doubt resolution');
    } finally {
      setSavingDoubtReply(false);
    }
  };

  const isMidTerm = useMemo(() => {
    const t = String(examType || '').toLowerCase();
    return t.includes('mid') || t.includes('internal');
  }, [examType]);

  const statusSummary = useMemo(() => {
    if (!rows.length) return 'PENDING';
    const allMarked = rows.every(r => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== '');
    const hasSubmitted = rows.some(r => r.status === 'LOCKED' || r.status === 'COMPLETED' || r.status === 'SUBMITTED');
    if (allMarked && hasSubmitted) return 'VALUATION COMPLETED';
    if (rows.some(r => r.status === 'LOCKED')) return 'VALUATION COMPLETED';
    if (rows.some(r => r.status === 'UNLOCK_REQUESTED')) return 'UNLOCK_REQUESTED';
    if (rows.some(r => r.status === 'SUBMITTED')) return 'VALUATION COMPLETED';
    if (rows.some(r => r.status === 'COMPLETED')) return 'VALUATION COMPLETED';
    if (rows.some(r => r.status === 'DRAFT')) return 'DRAFT';
    return 'PENDING';
  }, [rows]);

  const isLockedOrRequested = statusSummary === 'LOCKED' || statusSummary === 'UNLOCK_REQUESTED';

  const resolvePdfUrl = (url) => {
    if (!url) return null;
    if (/^(https?:)?\/\//.test(url)) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return window.location.port === '5173' ? `http://localhost:3000${cleanPath}` : cleanPath;
  };

  const questionPaperPreviewUrl = useMemo(() => resolvePdfUrl(questionPaperUrl), [questionPaperUrl]);
  const sheetPreviewUrl = useMemo(() => resolvePdfUrl(sheetPdfUrl), [sheetPdfUrl]);
  const answerKeyPreviewUrl = useMemo(() => resolvePdfUrl(answerKeyUrl), [answerKeyUrl]);

  const qPaperIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );

  const studentSheetIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const answerKeyIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );

  const renderQuestionPaperPanel = () => (
    <div key="panel-question-paper" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-white)', overflow: 'hidden', borderRight: '1px solid var(--border)', height: '100%' }}>
      <PdfControls
        label="Question Paper"
        icon={qPaperIcon}
        zoom={paperZoom}
        onZoomIn={() => setPaperZoom(z => Math.min(z + 15, 200))}
        onZoomOut={() => setPaperZoom(z => Math.max(z - 15, 50))}
        onRotate={() => setPaperRotate(r => (r + 90) % 360)}
      />
      <div style={{ flex: 1, overflow: 'auto', background: '#262626', display: 'flex', justifyContent: 'center', padding: '10px' }}>
        {questionPaperPreviewUrl ? (
          <iframe
            title="Question Paper"
            src={questionPaperPreviewUrl}
            style={{ width: `${paperZoom}%`, minHeight: '600px', border: 'none', transform: `rotate(${paperRotate}deg)`, transition: 'transform 0.2s', borderRadius: '4px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}
          />
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
            No Question Paper PDF available
          </div>
        )}
      </div>
    </div>
  );

  const renderStudentAnswerSheetPanel = () => (
    <div key="panel-student-sheet" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-white)', overflow: 'hidden', borderRight: '1px solid var(--border)', height: '100%' }}>
      <PdfControls
        label="Student Answer Sheet"
        icon={studentSheetIcon}
        zoom={sheetZoom}
        onZoomIn={() => setSheetZoom(z => Math.min(z + 15, 200))}
        onZoomOut={() => setSheetZoom(z => Math.max(z - 15, 50))}
        onRotate={() => setSheetRotate(r => (r + 90) % 360)}
      />
      <div style={{ flex: 1, overflow: 'auto', background: '#262626', display: 'flex', justifyContent: 'center', padding: '10px' }}>
        {sheetPreviewUrl ? (
          <iframe
            title="Student Answer Sheet"
            src={sheetPreviewUrl}
            style={{ width: `${sheetZoom}%`, minHeight: '600px', border: 'none', transform: `rotate(${sheetRotate}deg)`, transition: 'transform 0.2s', borderRadius: '4px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}
          />
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', padding: '40px', textAlign: 'center', alignSelf: 'center' }}>
            No Student Answer Sheet PDF available
          </div>
        )}
      </div>
    </div>
  );

  const updateRow = (id, field, value) =>
    setRows(cur => cur.map(r => r.evaluationId === id ? { ...r, [field]: value } : r));

  const updateMax = (id, value) =>
    setRows(cur => cur.map(r => r.evaluationId === id ? { ...r, maxMark: Math.max(1, Math.round(Number(value))) } : r));

  const toggleRemark = (id) => setRemarkOpen(p => ({ ...p, [id]: !p[id] }));

  const validationErrors = useMemo(() => {
    const errors = {};
    rows.forEach(row => {
      if (row.marksObtained !== null && row.marksObtained !== undefined && row.marksObtained !== '') {
        const val = Number(row.marksObtained);
        if (Number.isNaN(val)) errors[row.evaluationId] = 'Must be a valid number';
        else if (val < 0) errors[row.evaluationId] = 'Cannot be negative';
        else if (row.maxMark != null && val > row.maxMark) errors[row.evaluationId] = `Cannot exceed ${row.maxMark}`;
      }
    });
    return errors;
  }, [rows]);

  const hasErrors = Object.keys(validationErrors).length > 0;
  const allEvaluated = useMemo(() =>
    rows.length > 0 && rows.every(r => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== ''),
  [rows]);

  const totals = useMemo(() => {
    let myObtained = 0, myMax = 0;
    rows.forEach(r => {
      if (r.maxMark != null) myMax += Number(r.maxMark);
      if (r.marksObtained != null && r.marksObtained !== '') myObtained += Number(r.marksObtained);
    });

    const cumulativeObtained = (coEvaluatorScore || 0) + myObtained;
    const fullMax = fullExamMaxMarks || (myMax + (coEvaluatorMax || 0)) || 50;
    const scale = Number(targetScale) || 30;
    const convertedScore = Math.round(fullMax > 0 ? (cumulativeObtained / fullMax) * scale : 0);

    const passThreshold = Math.ceil(scale * 0.40);
    const marksNeededToPass = passThreshold - convertedScore;
    const nearPass = marksNeededToPass > 0 && marksNeededToPass <= 3;

    return {
      myObtained,
      myMax,
      coEvaluatorScore,
      coEvaluatorMax,
      cumulativeObtained,
      fullMax,
      scale,
      convertedScore,
      passThreshold,
      nearPass,
      marksNeededToPass
    };
  }, [rows, coEvaluatorScore, coEvaluatorMax, fullExamMaxMarks, targetScale]);

  const handleDraft = async () => {
    if (hasErrors) { setErrorMessage('Fix validation errors before saving.'); return; }
    try {
      setMessage(''); setErrorMessage('');
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/draft`,
        { updates: rows.map(r => ({ evaluationId: r.evaluationId, marksObtained: r.marksObtained, review: r.review })) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate('/faculty/assignments', { state: { message: 'Draft saved successfully.' } });
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Unable to save.'); }
  };

  const handleSubmit = async () => {
    if (!allEvaluated) { setErrorMessage('All questions must be marked before completing valuation.'); return; }
    if (hasErrors) { setErrorMessage('Fix validation errors before submitting.'); return; }
    try {
      setMessage(''); setErrorMessage('');
      await axios.put(`/api/faculty/evaluations/sheet/${sheetId}/submit`,
        { updates: rows.map(r => ({ evaluationId: r.evaluationId, marksObtained: r.marksObtained, review: r.review })) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate('/faculty/assignments', { state: { message: 'Valuation completed successfully.' } });
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Unable to complete evaluation.'); }
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 90);
      if (isDragging === 'left') {
        const newLeft = Math.min(Math.max(xPct, 20), 50);
        const remaining = 100 - newLeft - panelWidths.right;
        if (remaining > 15) setPanelWidths(p => ({ ...p, left: newLeft, center: remaining }));
      } else {
        const newRight = Math.min(Math.max(100 - xPct, 20), 50);
        const remaining = 100 - panelWidths.left - newRight;
        if (remaining > 15) setPanelWidths(p => ({ ...p, center: remaining, right: newRight }));
      }
    };
    const onUp = () => setIsDragging(null);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging, panelWidths]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (pageRootRef.current?.requestFullscreen) {
        pageRootRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      ref={pageRootRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 52px)',
        width: '100%',
        background: 'var(--bg-page)',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        overflow: 'hidden'
      }}
    >

      {/* Workspace header */}
      <div style={{
        padding: '0 20px',
        height: '52px',
        background: 'var(--bg-white)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/faculty/assignments')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Assignments
          </button>
          <div style={{ width: '1px', height: '22px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--amrita-maroon)' }}>Evaluation Workspace</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
              {sheetId}
            </span>
            <span style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: 'var(--accent-light)',
              color: 'var(--amrita-maroon)',
              border: '1px solid var(--accent-border)'
            }}>
              {isMidTerm ? 'MID TERM • 3-PANEL VIEW' : 'END SEM • 4-PANEL VIEW'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Marks Evaluation Panel Toggle Button */}
          <button
            type="button"
            onClick={() => setShowEvalPanel(p => !p)}
            className={showEvalPanel ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}
            title={showEvalPanel ? 'Hide Marks Evaluation Panel' : 'Show Marks Evaluation Panel'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {showEvalPanel ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <polyline points="18 10 16 12 18 14" />
                </>
              ) : (
                <>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </>
              )}
            </svg>
            {showEvalPanel ? 'Hide Marks' : 'Assign Marks'}
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isFullscreen ? 'var(--accent-light)' : undefined,
              color: isFullscreen ? 'var(--amrita-maroon)' : undefined,
              borderColor: isFullscreen ? 'var(--amrita-maroon)' : undefined
            }}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="10" y1="14" x2="3" y2="21" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
          </button>

          <span className={`badge ${STATUS_BADGE[statusSummary] || 'badge-gray'}`}>{statusSummary}</span>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{ padding: '8px 20px', background: 'var(--success-bg)', color: 'var(--success)', borderBottom: '1px solid var(--success-border)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
          {message}
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: '8px 20px', background: 'var(--error-bg)', color: 'var(--error)', borderBottom: '1px solid var(--error-border)', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0 }}>
          {errorMessage}
        </div>
      )}

      {/* Student Doubts Notice on this paper */}
      {sheetDoubts.length > 0 && (
        <div style={{
          padding: '10px 20px',
          background: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          color: '#92400e',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>✋</span>
            <span>
              <strong>Student Query / Doubt Raised:</strong>{' '}
              {sheetDoubts.map(d => `${d.questionNumber ? `Q${d.questionNumber}` : 'General'}: "${d.comment}" (${d.status})`).join(' | ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/faculty/assignments?tab=doubts')}
            className="btn btn-xs"
            style={{
              background: '#b45309',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Manage in Doubts Tab ➔
          </button>
        </div>
      )}

      {/* Dynamic Panel Grid Layout (Same 2-viewer layout for both Mid-Term and End-Sem) */}
      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: showEvalPanel
            ? `${panelWidths.left}% 6px ${panelWidths.center}% 6px ${panelWidths.right}%`
            : '1fr 6px 1fr',
          flex: 1,
          overflow: 'hidden'
        }}
      >

        {/* Panel 1 (Question Paper OR Student Answer Sheet if swapped) */}
        {isSwapped ? renderStudentAnswerSheetPanel() : renderQuestionPaperPanel()}

        {/* Resizer 1 with Centered Floating Swap Button */}
        <div
          onMouseDown={() => setIsDragging('left')}
          style={{
            position: 'relative',
            cursor: 'col-resize',
            background: isDragging === 'left' ? 'var(--amrita-maroon)' : 'var(--border)',
            transition: 'background 0.15s',
            zIndex: 10
          }}
        >
          {/* Centered Floating Swap Button in the middle between both viewers */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSwapPanels();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={isSwapped ? 'Switch back: Question Paper on Left, Answer Sheet on Right' : 'Swap positions: Answer Sheet on Left, Question Paper on Right'}
            style={{
              position: 'absolute',
              top: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-white)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--amrita-maroon)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: 0,
              zIndex: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)';
              e.currentTarget.style.borderColor = 'var(--amrita-maroon)';
              e.currentTarget.style.background = 'var(--accent-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'var(--bg-white)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 5h18" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 19H3" />
            </svg>
          </button>
        </div>

        {/* Panel 2 (Student Answer Sheet OR Question Paper if swapped) */}
        {isSwapped ? renderQuestionPaperPanel() : renderStudentAnswerSheetPanel()}

        {/* Resizer 2 (Between Viewer 2 and Marks Evaluation Panel) */}
        {showEvalPanel && (
          <div onMouseDown={() => setIsDragging('right')}
            style={{ cursor: 'col-resize', background: isDragging === 'right' ? 'var(--amrita-maroon)' : 'var(--border)', transition: 'background 0.15s' }}
          />
        )}

        {/* Final Panel — Question Evaluation Form */}
        {showEvalPanel && (
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-white)', overflow: 'hidden' }}>
            <div style={{
              padding: '0 14px',
              height: '42px',
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Question Evaluation
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '10px' }}>
                  {rows.length} Qs
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEvalPanel(false)}
                style={{
                  ...ctrlBtn,
                  width: 'auto',
                  padding: '2px 8px',
                  gap: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}
                title="Hide evaluation panel"
              >
                Hide
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading questions...</p>
            ) : rows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No assigned questions found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {rows.map(row => {
                  const err = validationErrors[row.evaluationId];
                  const showRemark = !!remarkOpen[row.evaluationId];
                  return (
                    <div key={row.evaluationId} style={{
                      border: `1px solid ${err ? 'var(--error-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-white)',
                      borderLeft: `3px solid ${err ? 'var(--error)' : 'var(--amrita-maroon)'}`,
                      overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: err ? 'var(--error-bg)' : 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Q{row.questionNumber}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAX</span>
                          <input type="number" value={row.maxMark ?? ''} onChange={e => updateMax(row.evaluationId, e.target.value)}
                            disabled={finalSubmittedToAdmin} min={1} step="1"
                            style={{ width: '46px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', outline: 'none', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input className="form-input" type="number" value={row.marksObtained ?? ''}
                            placeholder={`0 – ${row.maxMark ?? 'max'}`}
                            onChange={e => updateRow(row.evaluationId, 'marksObtained', e.target.value === '' ? null : Math.round(Number(e.target.value)))}
                            disabled={finalSubmittedToAdmin} min={0} max={row.maxMark ?? undefined} step="1"
                            style={{ flex: 1, borderColor: err ? 'var(--error)' : undefined, fontSize: '0.875rem', padding: '6px 10px' }}
                          />
                          {!finalSubmittedToAdmin && (
                            <button type="button" onClick={() => toggleRemark(row.evaluationId)}
                              style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.7rem', fontWeight: 600, border: `1px solid ${showRemark ? 'var(--amrita-maroon)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: showRemark ? 'var(--accent-light)' : 'var(--bg-subtle)', color: showRemark ? 'var(--amrita-maroon)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {showRemark ? '− Note' : '+ Note'}
                            </button>
                          )}
                        </div>
                        {err && <span style={{ fontSize: '0.68rem', color: 'var(--error)' }}>{err}</span>}
                        {showRemark && (
                          <textarea className="form-input" value={row.review || ''} onChange={e => updateRow(row.evaluationId, 'review', e.target.value)}
                            placeholder="Add a note..." rows={2} autoFocus
                            style={{ resize: 'none', fontSize: '0.78rem', padding: '6px 10px' }}
                          />
                        )}
                        {finalSubmittedToAdmin && row.review && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>{row.review}</p>
                        )}

                        {/* Student Doubt Query Indicator & Review Button */}
                        {(() => {
                          const qDoubts = sheetDoubts.filter(d => Number(d.questionNumber) === Number(row.questionNumber));
                          if (!qDoubts.length) return null;
                          const hasPending = qDoubts.some(d => d.status === 'PENDING' || d.status === 'IN_REVIEW');
                          const count = qDoubts.length;

                          return (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: hasPending ? '#fef3c7' : '#f0fdf4',
                              border: `1px solid ${hasPending ? '#fde68a' : '#bbf7d0'}`,
                              borderRadius: '6px',
                              padding: '5px 8px',
                              marginTop: '4px'
                            }}>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: hasPending ? '#92400e' : '#166534',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>✋</span>
                                <span>{hasPending ? 'Student Query Pending' : 'Query Resolved'}</span>
                                <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>({count}x)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => openDoubtModal(row.questionNumber, row.evaluationId, row.marksObtained, row.maxMark)}
                                style={{
                                  background: hasPending ? '#d97706' : '#16a34a',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {hasPending ? 'Resolve / Reply ➔' : 'View Query'}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px', flexShrink: 0, background: 'var(--bg-white)' }}>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '10px' }}>
                {totals.coEvaluatorMax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>Co-Evaluator Marks:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{totals.coEvaluatorScore} / {totals.coEvaluatorMax}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>My Marks Portion:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{totals.myObtained} / {totals.myMax}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Exam Raw Score</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{totals.cumulativeObtained} / {totals.fullMax}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Convert to</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="number" value={targetScale} min={1}
                      onChange={e => setTargetScale(Math.max(1, Math.round(Number(e.target.value))))}
                      style={{ width: '60px', padding: '5px 8px', fontSize: '0.82rem', fontWeight: 700, border: '1px solid var(--amrita-maroon)', borderRadius: 'var(--radius-sm)', textAlign: 'center', outline: 'none', color: 'var(--amrita-maroon)', background: 'var(--accent-light)' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>marks</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--amrita-maroon)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Converted Total Score</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amrita-maroon)', fontVariantNumeric: 'tabular-nums' }}>{totals.convertedScore} / {totals.scale}</span>
                </div>
                {totals.nearPass && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
                    💡 Moderation Notice: Student is {totals.marksNeededToPass} mark(s) short of passing ({totals.passThreshold}/{totals.scale}).
                  </div>
                )}
              </div>

              {!finalSubmittedToAdmin ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={hasErrors || !allEvaluated} style={{ opacity: hasErrors || !allEvaluated ? 0.5 : 1 }}>
                    Complete Evaluation
                  </button>
                  {!allEvaluated && <p style={{ fontSize: '0.72rem', color: 'var(--warning)', textAlign: 'center', margin: 0 }}>All questions must be marked before completing valuation.</p>}
                  <button className="btn btn-ghost btn-full" onClick={handleDraft} disabled={hasErrors}>Save Draft</button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius)', fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                  Marks Permanently Locked (Final Submitted to Admin)
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Floating quick-access button to restore evaluation panel */}
      {!showEvalPanel && (
        <button
          type="button"
          onClick={() => setShowEvalPanel(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
            background: 'var(--amrita-maroon)',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.82rem',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)'; }}
          title="Open Question Evaluation Panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Assign Marks ({totals.convertedScore}/{totals.scale})
        </button>
      )}

      {/* ────────────────────────────────────────────────────────
          IN-PAGE STUDENT QUERY RESOLUTION MODAL
         ──────────────────────────────────────────────────────── */}
      {selectedQuestionDoubt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-white)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1E3A5F',
              color: '#fff',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                  ✋ Student Query — Question {selectedQuestionDoubt.questionNumber}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#93c5fd' }}>
                  {studentInfo.name} ({studentInfo.regNo}) &nbsp;•&nbsp; Raised {selectedQuestionDoubt.doubts.length} time{selectedQuestionDoubt.doubts.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDoubtModal}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDoubtModalSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Query Thread History */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                {selectedQuestionDoubt.doubts.map((d, idx) => (
                  <div key={d._id || idx} style={{ borderBottom: idx < selectedQuestionDoubt.doubts.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '3px' }}>
                      <span>Query #{idx + 1} &nbsp;·&nbsp; {d.category || 'DOUBT'}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, fontStyle: 'italic', marginBottom: '4px' }}>
                      "{d.comment}"
                    </div>
                    {d.teacherReply && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.74rem', color: '#166534', marginTop: '4px' }}>
                        <strong>Your Reply:</strong> {d.teacherReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Adjust Question Mark (Gated) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Marks for Question {selectedQuestionDoubt.questionNumber} (Max: {selectedQuestionDoubt.maxMark ?? '—'})
                </label>
                {finalSubmittedToAdmin ? (
                  <div style={{ padding: '8px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '6px', fontSize: '0.74rem', color: 'var(--warning)', fontWeight: 600 }}>
                    🔒 Marks are permanently locked (Exam submitted to Admin). You may provide an explanatory clarification below.
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      max={selectedQuestionDoubt.maxMark || 100}
                      step="1"
                      value={doubtAdjustedMark}
                      onChange={(e) => setDoubtAdjustedMark(e.target.value)}
                      placeholder="Enter marks"
                      className="form-control"
                      style={{ width: '120px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Current: {selectedQuestionDoubt.currentMark ?? '—'} / {selectedQuestionDoubt.maxMark ?? '—'}
                    </span>
                  </div>
                )}
              </div>

              {/* Resolution Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Resolution Status
                </label>
                <select
                  value={doubtReplyStatus}
                  onChange={(e) => setDoubtReplyStatus(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <option value="RESOLVED">Resolved (Answered & Updated)</option>
                  <option value="REJECTED">Reviewed (Keep Marks As Is)</option>
                  <option value="IN_REVIEW">Under Review</option>
                </select>
              </div>

              {/* Reply Comment */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Teacher Clarification & Explanation <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={doubtReplyText}
                  onChange={(e) => setDoubtReplyText(e.target.value)}
                  placeholder="Explain the marks or provide clarification to the student..."
                  className="form-control"
                  style={{ width: '100%', padding: '8px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={closeDoubtModal}
                  disabled={savingDoubtReply}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingDoubtReply}
                >
                  {savingDoubtReply ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

