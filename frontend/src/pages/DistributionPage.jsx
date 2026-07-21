import { useState } from 'react';
import axios from 'axios';

export default function DistributionPage() {
  const [filters, setFilters] = useState({ course: '', subject: '', semester: '', section: '', examType: '' });
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [strategy, setStrategy] = useState('EQUAL');
  const [allocations, setAllocations] = useState('1,2,3');
  const [message, setMessage] = useState('');

  const loadExams = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach((k) => { if (filters[k]) params[k] = filters[k]; });
      const res = await axios.get('/api/admin/exams', { params, headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setExams(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedExam) {
      setMessage('Select an exam first');
      return;
    }

    const alloc = allocations
      .split(',')
      .filter(Boolean)
      .map((value) => ({ facultyId: value.trim() }));

    try {
      const response = await axios.post('/api/admin/configuration/distribution', {
        examId: selectedExam._id,
        strategyType: strategy,
        allocations: alloc
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessage(`Configured ${response.data.data?.length || 0} allocations.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to configure distribution.');
    }
  };

  return (
    <div>
      <h2>Question Distribution</h2>
      <p className="muted">Find an exam by filters, select it, then assign question ranges to faculty.</p>
      <div className="card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <input placeholder="Course" value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })} />
          <input placeholder="Subject" value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} />
          <input placeholder="Semester" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })} />
          <input placeholder="Section" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} />
          <input placeholder="Exam Type" value={filters.examType} onChange={(e) => setFilters({ ...filters, examType: e.target.value })} />
          <button onClick={loadExams}>Find Exams</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Select Exam</label>
          <select style={{ width: '100%', padding: 10, borderRadius: 8 }} onChange={(e) => setSelectedExam(exams.find(x => x._id === e.target.value))}>
            <option value="">-- choose exam --</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>{`${ex.course} / ${ex.subject} - ${ex.semester} ${ex.section} (${ex.examType})`}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div className="form-group">
            <label>Strategy</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              <option value="EQUAL">Equal Distribution</option>
              <option value="MANUAL">Manual Distribution</option>
              <option value="WEIGHTED">Weighted Distribution</option>
            </select>
          </div>
          <div className="form-group">
            <label>Faculty IDs (comma separated)</label>
            <input value={allocations} onChange={(e) => setAllocations(e.target.value)} />
          </div>
          <button type="submit">Save Distribution</button>
        </form>
        {message && <p className="muted" style={{ marginTop: '12px' }}>{message}</p>}
      </div>
    </div>
  );
}
