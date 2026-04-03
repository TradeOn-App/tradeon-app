import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Table } from 'react-bootstrap';
import { LuFileText, LuDownload } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import api from '../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/reports')
      .then(r => setReports(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = (year, month) => {
    api.get(`/client/reports/${year}/${month}/pdf`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio-${month}-${year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h4 className="page-title">Meus Relatorios</h4>
        <p className="page-subtitle">Acompanhe sua rentabilidade mensal</p>
      </div>

      {reports.length === 0 ? (
        <Card className="chart-card">
          <Card.Body className="text-center py-5">
            <LuFileText size={40} className="text-stone mb-3" />
            <p className="text-stone mb-0">Nenhum relatorio disponivel.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="chart-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Depositos</th>
                    <th>Saques</th>
                    <th>Liquido</th>
                    <th>Rentabilidade</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => {
                    const net = Number(r.total_deposits) - Number(r.total_withdrawals);
                    return (
                      <tr key={`${r.year}-${r.month}`}>
                        <td>
                          <Link to={`/reports/${r.year}/${r.month}`} className="text-decoration-none text-white fw-medium">
                            <LuFileText size={14} className="text-gold me-2" />
                            {monthNames[r.month]} / {r.year}
                          </Link>
                        </td>
                        <td className="text-petrol fw-medium">{formatCurrency(r.total_deposits)}</td>
                        <td style={{ color: '#e07060' }} className="fw-medium">{formatCurrency(r.total_withdrawals)}</td>
                        <td className={net >= 0 ? 'text-gold fw-semibold' : 'fw-semibold'} style={net < 0 ? { color: '#e07060' } : {}}>
                          {formatCurrency(net)}
                        </td>
                        <td>
                          <span className={Number(r.profitability_percent) >= 0 ? 'badge-gold' : 'badge-withdrawal'}>
                            {Number(r.profitability_percent).toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link to={`/reports/${r.year}/${r.month}`} className="btn btn-outline-gold btn-sm">
                              Detalhar
                            </Link>
                            <button className="btn btn-outline-gold btn-sm" onClick={() => handleDownloadPdf(r.year, r.month)} title="Baixar PDF">
                              <LuDownload size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
