import { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { LuCircleArrowUp, LuCircleArrowDown, LuWallet, LuCoins, LuPercent, LuTrendingUp, LuChevronDown, LuCalendar } from 'react-icons/lu';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';
import { useSelectedClient } from '../../hooks/useSelectedClient';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d) => d.toISOString().split('T')[0];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showRange, setShowRange] = useState(false);
  const rangeRef = useRef(null);
  const { selectedClientId, setSelectedClientId, clients } = useSelectedClient();

  const handlePeriod = (key) => {
    setPeriod(key);
    setShowRange(false);
    const now = new Date();
    if (key === 'today') {
      const d = fmt(now);
      setDateFrom(d);
      setDateTo(d);
    } else if (key === 'week') {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      setDateFrom(fmt(monday));
      setDateTo(fmt(now));
    } else if (key === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(fmt(first));
      setDateTo(fmt(now));
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Close range picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target)) {
        setShowRange(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClientName = clients.find(c => String(c.id) === String(selectedClientId))?.full_name;
  const headerLabel = selectedClientId ? selectedClientName : 'Gerais';

  const formatDateBR = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (selectedClientId) params.client_id = selectedClientId;
    api.get('/admin/dashboard', { params })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, selectedClientId]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" className="spinner-gold" /></div>;
  }

  if (!data) return null;

  const cards = [
    { title: 'Total Depósitos', value: formatCurrency(data.cards.total_deposits), icon: <LuCircleArrowUp size={22} />, iconClass: 'icon-petrol' },
    { title: 'Total Saques', value: formatCurrency(data.cards.total_withdrawals), icon: <LuCircleArrowDown size={22} />, iconClass: 'icon-danger' },
    { title: 'Saldo Geral', value: formatCurrency(data.cards.balance), icon: <LuWallet size={22} />, iconClass: 'icon-petrol', valueClass: 'metric-value-petrol' },
    { title: 'Lucro Total', value: formatCurrency(data.cards.total_profit), icon: <LuTrendingUp size={22} />, iconClass: 'icon-gold', valueClass: 'metric-value-gold' },
    { title: 'Rentabilidade Média', value: data.cards.avg_profitability + '%', icon: <LuPercent size={22} />, iconClass: 'icon-petrol' },
    { title: 'Operações P2P', value: data.cards.p2p_count, icon: <LuCoins size={22} />, iconClass: 'icon-stone' },
    { title: 'Total Comissões', value: formatCurrency(data.cards.total_commissions), icon: <LuPercent size={22} />, iconClass: 'icon-gold' },
    { title: 'Entradas Caixa', value: formatCurrency(data.cards.cash_flow_entries), icon: <LuCircleArrowUp size={22} />, iconClass: 'icon-petrol' },
  ];

  const revenueChart = {
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
      },
      {
        label: 'Depósitos',
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
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <h4 className="page-title" style={{ marginBottom: 0 }}>
            Dados{' '}
            <span className="client-selector-wrapper">
              <select
                className="client-selector-inline"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Gerais</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              <LuChevronDown size={18} className="client-selector-arrow" />
            </span>
          </h4>
        </div>
        <div className="dashboard-topbar-right">
          <div className="d-flex gap-2 align-items-center">
            {[
              { key: 'today', label: 'Hoje' },
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mês' },
              { key: 'all', label: 'Todos' },
            ].map(p => (
              <button
                key={p.key}
                className={`btn btn-sm ${period === p.key ? 'btn-gold' : 'btn-outline-gold'}`}
                onClick={() => handlePeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
            <div className="date-range-wrapper" ref={rangeRef}>
              <button
                className={`btn btn-sm date-range-toggle ${period === 'custom' ? 'btn-gold' : 'btn-outline-gold'}`}
                onClick={() => setShowRange(!showRange)}
              >
                <LuCalendar size={14} className="me-1" />
                {period === 'custom' && dateFrom && dateTo
                  ? `${formatDateBR(dateFrom)} - ${formatDateBR(dateTo)}`
                  : 'Período'}
              </button>
              {showRange && (
                <div className="date-range-dropdown">
                  <div className="date-range-field">
                    <label className="date-range-label">De</label>
                    <input
                      type="date"
                      className="date-range-input"
                      value={dateFrom}
                      onChange={e => { setDateFrom(e.target.value); setPeriod('custom'); }}
                    />
                  </div>
                  <div className="date-range-field">
                    <label className="date-range-label">Até</label>
                    <input
                      type="date"
                      className="date-range-input"
                      value={dateTo}
                      onChange={e => { setDateTo(e.target.value); setPeriod('custom'); }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
              <h6 className="chart-title mb-4">Evolução de Rendimentos</h6>
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
