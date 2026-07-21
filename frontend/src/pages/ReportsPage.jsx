import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ReportsPage() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/admin/reports', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setReport(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  if (!report) return <p className="muted">Loading reports...</p>;

  return (
    <div>
      <h2>Operational Reports</h2>
      <p className="muted">Summarized counts for exams, students, and evaluation activity.</p>
      <div className="grid grid-3" style={{ marginTop: '16px' }}>
        <div className="card">
          <h3>Total Exams</h3>
          <p>{report.totalExams}</p>
        </div>
        <div className="card">
          <h3>Total Students</h3>
          <p>{report.totalStudents}</p>
        </div>
        <div className="card">
          <h3>Total Evaluations</h3>
          <p>{report.totalEvaluations}</p>
        </div>
      </div>
      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Status Breakdown</h3>
        <ul>
          {Object.entries(report.evaluationsByStatus || {}).map(([status, count]) => (
            <li key={status}><strong>{status}</strong>: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
