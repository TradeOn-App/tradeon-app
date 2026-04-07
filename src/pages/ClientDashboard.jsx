import { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { LuCircleArrowUp, LuWallet } from 'react-icons/lu';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/client')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  if (!data) {
    return <p className="text-stone p-4">Nenhum dado disponível.</p>;
  }

  const chartData = {
    labels: data.chart.map(c => c.period),
    datasets: [
      {
        label: 'Rendimento Líquido',
        data: data.chart.map(c => c.net),
        borderColor: '#00b3b3',
        backgroundColor: 'rgba(0,179,179,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00b3b3',
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Depósitos',
        data: data.chart.map(c => c.deposits),
        borderColor: '#BFA071',
        backgroundColor: 'rgba(191,160,113,0.08)',
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
        backgroundColor: 'rgba(122,127,130,0.08)',
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

  const chartOptions = {
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

  const cards = [
    { title: 'Total de Depósito', value: formatCurrency(data.cards.total_deposits), icon: <LuCircleArrowUp size={22} />, iconClass: 'icon-petrol' },
    { title: 'Saldo', value: formatCurrency(data.cards.balance), icon: <LuWallet size={22} />, iconClass: 'icon-petrol', valueClass: 'metric-value-petrol' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h4 className="page-title">Dashboard</h4>
        <p className="page-subtitle">Visão geral da sua conta</p>
      </div>

      <Row className="g-3 mb-4">
        {cards.map((c, i) => (
          <Col key={i} xs={12} sm={6}>
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
        <Card.Body className="p-4">
          <h6 className="chart-title mb-4">Evolução de Rendimentos</h6>
          <Line data={chartData} options={chartOptions} />
        </Card.Body>
      </Card>
    </div>
  );
}
