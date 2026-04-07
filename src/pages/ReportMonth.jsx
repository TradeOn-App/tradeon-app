import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Table, Spinner } from 'react-bootstrap';
import { LuArrowLeft, LuDownload, LuCircleArrowUp, LuCircleArrowDown, LuTrendingUp, LuPercent, LuWallet, LuCoins } from 'react-icons/lu';
import api from '../services/api';

const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const typeMap = { deposit: 'Valor Inicial', contribution: 'Aporte', withdrawal: 'Saque', updated_value: 'Valor Atualizado' };

export default function ReportMonth() {
  const { year, month } = useParams();
  const [data, setData] = useState({ report: null, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    api
      .get(`/client/reports/${year}/${month}`)
      .then(({ data: res }) => setData(res))
      .catch(() => setData({ report: null, transactions: [] }))
      .finally(() => setLoading(false));
  }, [year, month]);

  const handleDownloadPdf = () => {
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

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  if (!data.report) {
    return (
      <div className="page-container">
        <Link to="/reports" className="back-link"><LuArrowLeft size={14} className="me-1" /> Voltar</Link>
        <Card className="chart-card">
          <Card.Body className="text-center py-5">
            <p className="text-stone mb-0">Relatório não encontrado.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { report, transactions } = data;

  const filtered = transactions.filter(ct => {
    if (!typeFilter) return true;
    return ct.type === typeFilter;
  });

  const nextMonthLabel = report.summary?.next_month || '';

  const hasDebit = Number(report.initial_debit) > 0;
  const isLoss = Number(report.real_gain) < 0;

  const cards = [
    { title: 'Valor Inicial', value: formatCurrency(report.initial_value), icon: <LuCircleArrowUp size={22} />, iconClass: 'icon-petrol' },
    { title: 'Valor Atualizado', value: formatCurrency(report.updated_value), icon: <LuTrendingUp size={22} />, iconClass: 'icon-gold' },
    { title: 'Ganho Real', value: formatCurrency(report.real_gain), icon: <LuCircleArrowUp size={22} />, iconClass: isLoss ? 'icon-danger' : 'icon-petrol', valueClass: isLoss ? '' : '' },
    { title: 'Ganho %', value: `${Number(report.gain_percentage).toFixed(2)}%`, icon: <LuPercent size={22} />, iconClass: isLoss ? 'icon-danger' : 'icon-gold', valueClass: isLoss ? '' : 'metric-value-gold' },
    ...(hasDebit ? [{ title: 'Débito Inicial', value: formatCurrency(report.initial_debit), icon: <LuCircleArrowDown size={22} />, iconClass: 'icon-danger' }] : []),
    { title: `Comissão (${Number(report.commission_rate).toFixed(1)}%)`, value: formatCurrency(report.commission_value), icon: <LuCoins size={22} />, iconClass: 'icon-gold' },
    { title: 'Lucro', value: formatCurrency(report.profit_value), icon: <LuWallet size={22} />, iconClass: Number(report.profit_value) > 0 ? 'icon-petrol' : 'icon-stone', valueClass: Number(report.profit_value) > 0 ? 'metric-value-petrol' : '' },
    { title: `Valor Inicial ${nextMonthLabel}`, value: formatCurrency(report.next_month_initial), icon: <LuCircleArrowUp size={22} />, iconClass: 'icon-petrol' },
  ];

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/reports" className="back-link"><LuArrowLeft size={14} className="me-1" /> Voltar aos relatórios</Link>
          <h4 className="page-title mt-2">{monthNames[Number(month)]} / {year}</h4>
          <p className="page-subtitle">Detalhamento do período</p>
        </div>
        <button className="btn btn-gold" onClick={handleDownloadPdf}>
          <LuDownload size={14} className="me-2" />Baixar PDF
        </button>
      </div>

      <Row className="g-3 mb-4">
        {cards.map((c, i) => (
          <Col key={i} xs={12} sm={6} lg={3}>
            <Card className="metric-card h-100">
              <Card.Body className="d-flex align-items-center gap-3 py-3">
                <div className={`metric-icon ${c.iconClass}`}>{c.icon}</div>
                <div>
                  <div className="metric-label">{c.title}</div>
                  <div className={`metric-value ${c.valueClass || ''}`}>{c.value}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="chart-card">
        <Card.Body className="p-0">
          <div className="px-4 pt-4 pb-2">
            <h6 className="chart-title">Histórico de Movimentações</h6>
          </div>
          <div className="filter-bar">
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="deposit">Aporte</option>
              <option value="withdrawal">Saque</option>
              <option value="allocation">Alocação</option>
            </select>
          </div>
          {transactions.length === 0 ? (
            <p className="text-stone px-4 pb-4">Nenhuma movimentação neste período.</p>
          ) : filtered.length === 0 ? (
            <p className="text-stone px-4 pb-4">Nenhuma movimentação encontrada.</p>
          ) : (
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle responsive-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Moeda</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ct) => (
                    <tr key={ct.id}>
                      <td data-label="Tipo">
                        <span className={ct.type === 'deposit' ? 'badge-deposit' : ct.type === 'contribution' ? 'badge-petrol' : ct.type === 'withdrawal' ? 'badge-withdrawal' : ct.type === 'updated_value' ? 'badge-gold' : 'badge-stone'}>
                          {typeMap[ct.type] || ct.type}
                        </span>
                      </td>
                      <td data-label="Valor" className={['deposit', 'contribution', 'updated_value'].includes(ct.type) ? 'text-petrol fw-semibold' : ct.type === 'withdrawal' ? 'fw-semibold' : ''}
                          style={ct.type === 'withdrawal' ? { color: '#e07060' } : {}}>
                        {formatCurrency(Number(ct.amount) * (Number(ct.cash_flow_transaction?.quotation_at_transaction) || 1))}
                      </td>
                      <td data-label="Moeda">BRL</td>
                      <td data-label="Data">{ct.cash_flow_transaction?.transaction_date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
