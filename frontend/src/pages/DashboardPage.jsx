import { useEffect, useState } from 'react';
import axios from 'axios';

const cardData = [
  { key: 'totalExams', label: 'Total Exams' },
  { key: 'totalStudents', label: 'Total Students' },
  { key: 'checkedPapers', label: 'Checked Papers' },
  { key: 'remainingPapers', label: 'Remaining Papers' },
  { key: 'lockedEvaluations', label: 'Locked Evaluations' }
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setMetrics(response.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <div className="row">
        <div>
          <h2>Administrative Dashboard</h2>
          <p className="muted">Overview of the valuation workflow and current workload.</p>
        </div>
        <span className="badge">Live</span>
      </div>

      {loading ? (
        <p className="muted">Loading dashboard...</p>
      ) : (
        <div className="grid grid-2" style={{ marginTop: '16px' }}>
          {cardData.map((item) => (
            <div className="metric" key={item.key}>
              <h3>{item.label}</h3>
              <p>{metrics[item.key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>What this portal supports</h3>
        <ul>
          <li>Import exam, student, answer sheet, answer key, and evaluation data from Excel.</li>
          <li>Configure faculty question distribution using equal, manual, or weighted strategies.</li>
          <li>Unlock evaluations and inspect audit activity for accountability.</li>
          <li>Review operational reports and current evaluation status.</li>
        </ul>
      </div>
    </div>
  );
}
