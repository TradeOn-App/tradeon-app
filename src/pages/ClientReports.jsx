import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Table } from 'react-bootstrap';
import { LuFileText, LuDownload, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import api from '../services/api';

const formatCurrency = (v) => 'US$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        link.setAttribute('download', `Relatorio Cliente - ${month}-${year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const filtered = reports.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      monthNames[r.month]?.toLowerCase().includes(term) ||
      String(r.year).includes(term)
    );
  });

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h4 className="page-title">Meus Relatórios</h4>
        <p className="page-subtitle">Acompanhe sua rentabilidade mensal</p>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="chart-card">
          <Card.Body className="text-center py-5">
            <LuFileText size={40} className="text-stone mb-3" />
            <p className="text-stone mb-0">Nenhum relatório disponível.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="chart-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle responsive-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Valor Inicial</th>
                    <th>Valor Atualizado</th>
                    <th>Ganho Real</th>
                    <th>Ganho %</th>
                    <th>Lucro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-stone py-4">Nenhum relatório encontrado.</td>
                    </tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={`${r.year}-${r.month}`}>
                        <td data-label="Período">
                          <Link to={`/reports/${r.year}/${r.month}`} className="text-decoration-none text-white fw-medium">
                            <LuFileText size={14} className="text-gold me-2" />
                            {monthNames[r.month]} / {r.year}
                          </Link>
                        </td>
                        <td data-label="Valor Inicial" className="text-petrol fw-medium">{formatCurrency(r.initial_value)}</td>
                        <td data-label="Valor Atualizado" className="text-white fw-medium">{formatCurrency(r.updated_value)}</td>
                        <td data-label="Ganho Real" className={Number(r.real_gain) >= 0 ? 'text-petrol fw-semibold' : 'fw-semibold'} style={Number(r.real_gain) < 0 ? { color: '#e07060' } : {}}>
                          {formatCurrency(r.real_gain)}
                        </td>
                        <td data-label="Ganho %">
                          <span className={Number(r.gain_percentage) >= 0 ? 'badge-gold' : 'badge-withdrawal'}>
                            {Number(r.gain_percentage).toFixed(2)}%
                          </span>
                        </td>
                        <td data-label="Lucro" className={Number(r.profit_value) >= 0 ? 'text-gold fw-semibold' : 'fw-semibold'} style={Number(r.profit_value) < 0 ? { color: '#e07060' } : {}}>
                          {formatCurrency(r.profit_value)}
                        </td>
                        <td data-label="Ações" className="td-actions">
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
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
