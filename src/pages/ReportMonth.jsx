import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Table, Spinner } from 'react-bootstrap';
import { ArrowLeft, Download, ArrowUpCircleFill, ArrowDownCircleFill, GraphUpArrow } from 'react-bootstrap-icons';
import api from '../services/api';

const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const typeMap = { deposit: 'Aporte', withdrawal: 'Saque', allocation: 'Alocacao' };

export default function ReportMonth() {
  const { year, month } = useParams();
  const [data, setData] = useState({ report: null, transactions: [] });
  const [loading, setLoading] = useState(true);

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

  if (!data.report) {
    return (
      <div className="page-container">
        <Link to="/reports" className="back-link"><ArrowLeft size={14} className="me-1" /> Voltar</Link>
        <Card className="chart-card">
          <Card.Body className="text-center py-5">
            <p className="text-stone mb-0">Relatorio nao encontrado.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { report, transactions } = data;
  const net = Number(report.total_deposits) - Number(report.total_withdrawals);

  const cards = [
    { title: 'Total Depositos', value: formatCurrency(report.total_deposits), icon: <ArrowUpCircleFill size={22} />, iconClass: 'icon-petrol' },
    { title: 'Total Saques', value: formatCurrency(report.total_withdrawals), icon: <ArrowDownCircleFill size={22} />, iconClass: 'icon-danger' },
    { title: 'Rentabilidade', value: `${Number(report.profitability_percent).toFixed(2)}%`, icon: <GraphUpArrow size={22} />, iconClass: 'icon-gold', valueClass: 'metric-value-gold' },
  ];

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/reports" className="back-link"><ArrowLeft size={14} className="me-1" /> Voltar aos relatorios</Link>
          <h4 className="page-title mt-2">{monthNames[Number(month)]} / {year}</h4>
          <p className="page-subtitle">Detalhamento do periodo</p>
        </div>
        <button className="btn btn-gold" onClick={handleDownloadPdf}>
          <Download size={14} className="me-2" />Baixar PDF
        </button>
      </div>

      <Row className="g-3 mb-4">
        {cards.map((c, i) => (
          <Col key={i} xs={12} sm={4}>
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
            <h6 className="chart-title">Historico de Movimentacoes</h6>
          </div>
          {transactions.length === 0 ? (
            <p className="text-stone px-4 pb-4">Nenhuma movimentacao neste periodo.</p>
          ) : (
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Moeda</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((ct) => (
                    <tr key={ct.id}>
                      <td>
                        <span className={ct.type === 'deposit' ? 'badge-deposit' : ct.type === 'withdrawal' ? 'badge-withdrawal' : 'badge-stone'}>
                          {typeMap[ct.type] || ct.type}
                        </span>
                      </td>
                      <td className={ct.type === 'deposit' ? 'text-petrol fw-semibold' : ct.type === 'withdrawal' ? 'fw-semibold' : ''}
                          style={ct.type === 'withdrawal' ? { color: '#e07060' } : {}}>
                        {formatCurrency(ct.amount)}
                      </td>
                      <td>{ct.cash_flow_transaction?.currency?.code || '-'}</td>
                      <td>{ct.cash_flow_transaction?.transaction_date || '-'}</td>
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
