import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function FacultyEvaluationPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [targetScale, setTargetScale] = useState(30);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Workspace Active Tab selection ('questionPaper', 'answerSheet', 'answerKey', 'evaluationPanel')
  const [activeTab, setActiveTab] = useState('questionPaper');

  // PDF Viewer Controls
  const [zoom, setZoom] = useState(100);
  const [rotate, setRotate] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await axios.get(`/api/faculty/evaluations?sheetId=${sheetId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` }
      });
      const resData = response.data.data || {};
      setData(resData);
      setRows(resData.evaluations || []);
      if (resData.convertedScale) {
        setTargetScale(resData.convertedScale);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to load evaluation sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sheetId]);

  const resolvePdfUrl = (url) => {
    if (!url) return null;
    const clean = url.replace(/^\/+/, '');
    if (/^(https?:)?\/\//.test(clean)) return clean;
    return `/${clean}`;
  };

  const questionPaperUrl = useMemo(() => resolvePdfUrl(data?.questionPaperUrl), [data?.questionPaperUrl]);
  const sheetPdfUrl = useMemo(() => resolvePdfUrl(data?.sheetPdfUrl), [data?.sheetPdfUrl]);
  const answerKeyUrl = useMemo(() => resolvePdfUrl(data?.answerKeyUrl), [data?.answerKeyUrl]);

  const hasAnswerKey = Boolean(answerKeyUrl);
  const finalSubmittedToAdmin = Boolean(data?.finalSubmittedToAdmin);

  // Update specific evaluation row by evaluationId
  const updateRowById = (evaluationId, field, value) => {
    setRows((current) =>
      current.map((row) =>
        row.evaluationId === evaluationId ? { ...row, [field]: value } : row
      )
    );
  };

  // Validation logic - enforce whole integers
  const validationErrors = useMemo(() => {
    const errors = {};
    rows.forEach((row) => {
      if (row.marksObtained !== null && row.marksObtained !== undefined && row.marksObtained !== '') {
        const val = Number(row.marksObtained);
        if (Number.isNaN(val) || !Number.isInteger(val)) {
          errors[row.evaluationId] = 'Must be a whole integer';
        } else if (val < 0) {
          errors[row.evaluationId] = 'Marks cannot be negative';
        } else if (row.maxMark != null && val > row.maxMark) {
          errors[row.evaluationId] = `Cannot exceed max mark (${row.maxMark})`;
        }
      }
    });
    return errors;
  }, [rows]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const allQuestionsEvaluated = useMemo(() => {
    if (!rows.length) return false;
    return rows.every(
      (r) => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== ''
    );
  }, [rows]);

  // Running totals across ALL co-evaluators
  const totals = useMemo(() => {
    let myObtained = 0;
    let myMax = 0;
    rows.forEach((r) => {
      if (r.maxMark != null) myMax += Number(r.maxMark);
      if (r.marksObtained != null && r.marksObtained !== '') myObtained += Number(r.marksObtained);
    });

    let totalCombinedObtained = 0;
    let totalExamMax = 0;
    let pendingCoEvaluatorsCount = 0;

    (data?.allEvaluations || []).forEach((ev) => {
      if (ev.maxMark != null) totalExamMax += Number(ev.maxMark);
      if (ev.marksObtained != null && ev.marksObtained !== '') {
        totalCombinedObtained += Number(ev.marksObtained);
      } else {
        pendingCoEvaluatorsCount += 1;
      }
    });

    // Handle single evaluator vs co-evaluator totals
    const effectiveTotalObtained = (data?.allEvaluations || []).length > 0 ? totalCombinedObtained : myObtained;
    const effectiveExamMax = totalExamMax > 0 ? totalExamMax : (myMax || 50);

    const scale = Number(targetScale) || 30;
    const convertedScore = effectiveExamMax > 0
      ? Math.round((effectiveTotalObtained / effectiveExamMax) * scale)
      : 0;

    const passCutoff = Math.ceil(effectiveExamMax * 0.4); // 40% pass threshold
    const isPassing = effectiveTotalObtained >= passCutoff;
    const marksNeededToPass = Math.max(0, passCutoff - effectiveTotalObtained);

    return {
      myObtained,
      myMax,
      effectiveTotalObtained,
      effectiveExamMax,
      scale,
      convertedScore,
      passCutoff,
      isPassing,
      marksNeededToPass,
      pendingCoEvaluatorsCount
    };
  }, [rows, data?.allEvaluations, targetScale]);

  // Save Draft
  const handleDraft = async () => {
    if (hasValidationErrors) {
      setErrorMessage('Please fix mark validation errors before saving draft.');
      return;
    }
    try {
      setMessage('');
      setErrorMessage('');
      await axios.put(
        `/api/faculty/evaluations/sheet/${sheetId}/draft`,
        {
          updates: rows.map((r) => ({
            evaluationId: r.evaluationId,
            marksObtained: r.marksObtained,
            review: r.review
          }))
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Saved as draft');
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to save draft');
    }
  };

  // Section Submit
  const handleSubmit = async () => {
    if (!allQuestionsEvaluated) {
      setErrorMessage('All assigned questions must be marked before submitting.');
      return;
    }
    if (hasValidationErrors) {
      setErrorMessage('Please fix mark validation errors before submitting.');
      return;
    }
    try {
      setMessage('');
      setErrorMessage('');
      await axios.put(
        `/api/faculty/evaluations/sheet/${sheetId}/submit`,
        {
          updates: rows.map((r) => ({
            evaluationId: r.evaluationId,
            marksObtained: r.marksObtained,
            review: r.review
          }))
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('facultyToken')}` } }
      );
      setMessage('Submitted successfully. Section evaluation recorded.');
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to submit evaluation');
    }
  };

  if (loading) return <p className="muted" style={{ padding: '24px' }}>Loading evaluation workspace...</p>;

  // Determine active PDF url for tab
  let activePdfUrl = null;
  if (activeTab === 'questionPaper') activePdfUrl = questionPaperUrl;
  if (activeTab === 'answerSheet') activePdfUrl = sheetPdfUrl;
  if (activeTab === 'answerKey') activePdfUrl = answerKeyUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: '12px' }}>
      {/* Top Banner & Live Multi-Evaluator Collaborative Moderation Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" onClick={() => navigate('/faculty/assignments')} className="secondary small">
                ← Back to Tasks
              </button>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                Grading Workspace
              </h3>
            </div>
          </div>

          {/* Live Cumulative Score & Grace Mark Moderation Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Cumulative Score (All Evaluators)</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                {totals.effectiveTotalObtained} / {totals.effectiveExamMax}
              </span>
            </div>
            <div style={{ height: '30px', width: '1px', background: '#cbd5e1' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Target Converted Score</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
                {totals.convertedScore} / {totals.scale}
              </span>
            </div>
            <div style={{ height: '30px', width: '1px', background: '#cbd5e1' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Moderation / Pass Status</span>
              {totals.isPassing ? (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                  ✓ Student Passing (Cutoff: {totals.passCutoff})
                </span>
              ) : (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                  ⚠ Failing — Needs {totals.marksNeededToPass} mark(s) to pass ({totals.passCutoff})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Co-Evaluator Status Warnings */}
        {data?.coEvaluators && data.coEvaluators.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#475569' }}>
            <span><strong>Co-Evaluators:</strong></span>
            {data.coEvaluators.map((co, idx) => {
              const pendingCount = co.evaluations.filter((e) => e.marksObtained == null).length;
              return (
                <span key={idx} style={{ background: pendingCount > 0 ? '#fffbe6' : '#dcfce7', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${pendingCount > 0 ? '#fde68a' : '#86efac'}` }}>
                  {co.name}: {pendingCount > 0 ? `⚠ Evaluation Pending (${pendingCount} Qs)` : '✓ Complete'}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {message && <div style={{ padding: '10px 14px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', border: '1px solid #bbf7d0' }}>✓ {message}</div>}
      {errorMessage && <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca' }}>⚠ {errorMessage}</div>}

      {/* Main Tabbed Workspace Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        {/* WORKSPACE TAB NAVIGATION HEADER */}
        <div style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {/* Tab 1: Question Paper */}
            <button
              type="button"
              onClick={() => setActiveTab('questionPaper')}
              style={{
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'questionPaper' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'questionPaper' ? '#ffffff' : 'transparent',
                color: activeTab === 'questionPaper' ? '#2563eb' : '#64748b',
                cursor: 'pointer'
              }}
            >
              ❓ Question Paper PDF
            </button>

            {/* Tab 2: Student Answer Paper */}
            <button
              type="button"
              onClick={() => setActiveTab('answerSheet')}
              style={{
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'answerSheet' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'answerSheet' ? '#ffffff' : 'transparent',
                color: activeTab === 'answerSheet' ? '#2563eb' : '#64748b',
                cursor: 'pointer'
              }}
            >
              📄 Student Answer Paper PDF
            </button>

            {/* Tab 3: Answer Key (Conditionally Displayed ONLY if uploaded) */}
            {hasAnswerKey && (
              <button
                type="button"
                onClick={() => setActiveTab('answerKey')}
                style={{
                  padding: '12px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: activeTab === 'answerKey' ? '3px solid #2563eb' : '3px solid transparent',
                  background: activeTab === 'answerKey' ? '#ffffff' : 'transparent',
                  color: activeTab === 'answerKey' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                🗝 Answer Key PDF
              </button>
            )}

            {/* Tab 4 / Last Tab: Evaluation Panel */}
            <button
              type="button"
              onClick={() => setActiveTab('evaluationPanel')}
              style={{
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                borderBottom: activeTab === 'evaluationPanel' ? '3px solid #2563eb' : '3px solid transparent',
                background: activeTab === 'evaluationPanel' ? '#ffffff' : 'transparent',
                color: activeTab === 'evaluationPanel' ? '#2563eb' : '#64748b',
                cursor: 'pointer'
              }}
            >
              📝 Evaluation Panel
            </button>
          </div>

          {/* PDF Viewer Controls (Visible for PDF Tabs) */}
          {activeTab !== 'evaluationPanel' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button type="button" className="secondary small" onClick={() => setZoom((z) => Math.max(50, z - 25))}>-</button>
              <span style={{ fontSize: '0.8rem', minWidth: '45px', textAlign: 'center' }}>{zoom}%</span>
              <button type="button" className="secondary small" onClick={() => setZoom((z) => Math.min(200, z + 25))}>+</button>
              <button type="button" className="secondary small" onClick={() => setRotate((r) => (r + 90) % 360)}>↻</button>
            </div>
          )}
        </div>

        {/* WORKSPACE TAB BODY CONTENT */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {activeTab !== 'evaluationPanel' ? (
            activePdfUrl ? (
              <iframe
                src={`${activePdfUrl}#view=FitH`}
                title="PDF Document Viewer"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  transform: `scale(${zoom / 100}) rotate(${rotate}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease'
                }}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                No PDF document available for this tab.
              </div>
            )
          ) : (
            /* EVALUATION PANEL TAB CONTENT */
            <div style={{ height: '100%', overflowY: 'auto', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>My Assigned Question Marking</h3>
                <span className="badge" style={{ background: finalSubmittedToAdmin ? '#fef3c7' : '#dcfce7', color: finalSubmittedToAdmin ? '#b45309' : '#15803d' }}>
                  {finalSubmittedToAdmin ? 'LOCKED (Submitted to Admin)' : 'EDITABLE'}
                </span>
              </div>

              {/* Question Evaluation Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {rows.map((row) => {
                  const errorMsg = validationErrors[row.evaluationId];
                  return (
                    <div
                      key={row.evaluationId}
                      style={{
                        border: errorMsg ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px',
                        background: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                          Question #{row.questionNumber}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          Max Mark: {row.maxMark ?? 'N/A'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                            Marks (Integer)
                          </label>
                          <input
                            type="number"
                            step="1"
                            disabled={finalSubmittedToAdmin}
                            value={row.marksObtained ?? ''}
                            onChange={(e) => updateRowById(row.evaluationId, 'marksObtained', e.target.value)}
                            placeholder="0"
                            style={{
                              width: '100%',
                              padding: '8px',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              borderColor: errorMsg ? '#ef4444' : '#cbd5e1',
                              borderRadius: '6px'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                            Review / Remarks
                          </label>
                          <input
                            type="text"
                            disabled={finalSubmittedToAdmin}
                            value={row.review || ''}
                            onChange={(e) => updateRowById(row.evaluationId, 'review', e.target.value)}
                            placeholder="Optional evaluation remarks"
                            style={{ width: '100%', padding: '8px', fontSize: '0.85rem', borderRadius: '6px' }}
                          />
                        </div>
                      </div>

                      {errorMsg && (
                        <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                          ⚠ {errorMsg}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={finalSubmittedToAdmin || hasValidationErrors || !allQuestionsEvaluated}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: (finalSubmittedToAdmin || hasValidationErrors || !allQuestionsEvaluated) ? '#cbd5e1' : '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: (finalSubmittedToAdmin || hasValidationErrors || !allQuestionsEvaluated) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit & Save Section Marks
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleDraft}
                  disabled={finalSubmittedToAdmin || hasValidationErrors}
                  style={{ padding: '12px 20px', borderRadius: '8px' }}
                >
                  Save as Draft
                </button>
              </div>

              {!allQuestionsEvaluated && !finalSubmittedToAdmin && (
                <span style={{ fontSize: '0.75rem', color: '#d97706', textAlign: 'center', marginTop: '6px', display: 'block' }}>
                  ⚠ Please mark all assigned questions before submitting section marks.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
