import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { PeopleFill, ArrowUpCircleFill, ArrowDownCircleFill, WalletFill, CashCoin, CurrencyExchange, Percent } from 'react-bootstrap-icons';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  if (!data) return null;

  const cards = [
    { title: 'Clientes Ativos', value: data.cards.total_clients, icon: <PeopleFill size={22} />, iconClass: 'icon-gold' },
    { title: 'Total Depositos', value: formatCurrency(data.cards.total_deposits), icon: <ArrowUpCircleFill size={22} />, iconClass: 'icon-petrol' },
    { title: 'Total Saques', value: formatCurrency(data.cards.total_withdrawals), icon: <ArrowDownCircleFill size={22} />, iconClass: 'icon-danger' },
    { title: 'Saldo Geral', value: formatCurrency(data.cards.balance), icon: <WalletFill size={22} />, iconClass: 'icon-petrol', valueClass: 'metric-value-petrol' },
    { title: 'Volume P2P', value: formatCurrency(data.cards.total_p2p), icon: <CurrencyExchange size={22} />, iconClass: 'icon-petrol' },
    { title: 'Operacoes P2P', value: data.cards.p2p_count, icon: <CashCoin size={22} />, iconClass: 'icon-stone' },
    { title: 'Total Comissoes', value: formatCurrency(data.cards.total_commissions), icon: <Percent size={22} />, iconClass: 'icon-gold' },
    { title: 'Entradas Caixa', value: formatCurrency(data.cards.cash_flow_entries), icon: <ArrowUpCircleFill size={22} />, iconClass: 'icon-petrol' },
  ];

  const revenueChart = {
    labels: data.chart.map(c => c.period),
    datasets: [
      {
        label: 'Rendimento Liquido',
        data: data.chart.map(c => c.net),
        borderColor: '#00b3b3',
        backgroundColor: 'rgba(0,179,179,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00b3b3',
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Depositos',
        data: data.chart.map(c => c.deposits),
        borderColor: '#BFA071',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#BFA071',
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Saques',
        data: data.chart.map(c => c.withdrawals),
        borderColor: '#7A7F82',
        fill: false,
        tension: 0.4,
        borderDash: [5, 5],
        pointBackgroundColor: '#7A7F82',
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const p2pChart = {
    labels: data.p2p_chart.map(c => c.period),
    datasets: [
      {
        label: 'Volume P2P',
        data: data.p2p_chart.map(c => c.total),
        backgroundColor: 'rgba(0,179,179,0.3)',
        borderColor: '#00b3b3',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(0,179,179,0.5)',
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#7A7F82', font: { family: 'Inter', size: 12 }, padding: 20, usePointStyle: true, pointStyleWidth: 8 },
      },
      tooltip: {
        backgroundColor: '#161616',
        borderColor: '#222222',
        borderWidth: 1,
        titleColor: '#00b3b3',
        bodyColor: '#e8e6e3',
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#5a5a5a', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(0,77,77,0.06)', drawBorder: false },
      },
      y: {
        ticks: {
          color: '#5a5a5a',
          font: { family: 'Inter', size: 11 },
          callback: (v) => formatCurrency(v),
        },
        grid: { color: 'rgba(0,77,77,0.06)', drawBorder: false },
      },
    },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h4 className="page-title">Dashboard <span className="page-title-petrol">Admin</span></h4>
        <p className="page-subtitle">Visao consolidada de todas as operacoes</p>
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

      <Row className="g-3">
        <Col xs={12} lg={8}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h6 className="chart-title mb-4">Evolucao de Rendimentos</h6>
              <Line data={revenueChart} options={chartOpts} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="chart-card">
            <Card.Body className="p-4">
              <h6 className="chart-title mb-4">Volume P2P Mensal</h6>
              <Bar data={p2pChart} options={chartOpts} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
