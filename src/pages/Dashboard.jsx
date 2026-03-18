import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/client/reports')
      .then(({ data }) => setReports(data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (loading) return <div className="loading">Carregando relatórios...</div>;

  return (
    <div className="dashboard">
      <h2>Meus Relatórios Mensais</h2>
      <p className="text-muted">Selecione um mês para ver rentabilidade e histórico de aportes/saques.</p>
      <div className="report-grid">
        {reports.length === 0 ? (
          <p className="empty">Nenhum relatório disponível no momento.</p>
        ) : (
          reports.map((r) => (
            <Link
              key={r.id}
              to={`/reports/${r.year}/${r.month}`}
              className="report-card"
            >
              <span className="report-period">
                {monthNames[r.month]} / {r.year}
              </span>
              {r.profitability_percent != null && (
                <span className="report-profitability">
                  {Number(r.profitability_percent) >= 0 ? '+' : ''}
                  {Number(r.profitability_percent).toFixed(2)}%
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
