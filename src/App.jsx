import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import ClientDashboard from './pages/ClientDashboard';
import ClientReports from './pages/ClientReports';
import ReportMonth from './pages/ReportMonth';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminCollaborators from './pages/admin/AdminCollaborators';
import AdminCommissionRules from './pages/admin/AdminCommissionRules';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminP2p from './pages/admin/AdminP2p';
import AdminReports from './pages/admin/AdminReports';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={isAdmin ? <AdminDashboard /> : <ClientDashboard />} />
        <Route path="reports" element={<ClientReports />} />
        <Route path="reports/:year/:month" element={<ReportMonth />} />

        <Route path="admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
        <Route path="admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
        <Route path="admin/collaborators" element={<AdminRoute><AdminCollaborators /></AdminRoute>} />
        <Route path="admin/commission-rules" element={<AdminRoute><AdminCommissionRules /></AdminRoute>} />
        <Route path="admin/p2p" element={<AdminRoute><AdminP2p /></AdminRoute>} />
        <Route path="admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
