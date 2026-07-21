import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import FacultyLayout from './components/FacultyLayout';
import LoginPage from './pages/LoginPage';
import FacultyLoginPage from './pages/FacultyLoginPage';
import DashboardPage from './pages/DashboardPage';
import FacultyDashboardPage from './pages/FacultyDashboardPage';
import ImportPage from './pages/ImportPage';
import DistributionPage from './pages/DistributionPage';
import UnlockPage from './pages/UnlockPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ReportsPage from './pages/ReportsPage';
import FacultyAssignmentsPage from './pages/FacultyAssignmentsPage';
import FacultyEvaluationPage from './pages/FacultyEvaluationPage';
import TeachersPage from './pages/TeachersPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
}

function FacultyProtectedRoute({ children }) {
  const token = localStorage.getItem('facultyToken');
  return token ? children : <Navigate to="/faculty/login" replace />;
}

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/faculty/login" element={<FacultyLoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="distribution" element={<DistributionPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="unlock" element={<UnlockPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      <Route
        path="/faculty"
        element={
          <FacultyProtectedRoute>
            <FacultyLayout />
          </FacultyProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboardPage />} />
        <Route path="dashboard" element={<FacultyDashboardPage />} />
        <Route path="assignments" element={<FacultyAssignmentsPage />} />
        <Route path="evaluate/:sheetId" element={<FacultyEvaluationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
