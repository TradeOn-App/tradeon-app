import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuSearch, LuDownload, LuTriangleAlert } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => 'US$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthAbbr = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const PROFIT_TARGET = 5;

function profitColor(pct) {
  const n = Number(pct);
  if (n < 0) return '#e07060';
  if (n >= PROFIT_TARGET) return '#00b3b3';
  if (n > 0) return '#e0a830';
  return null;
}

function valueColor(v) {
  return Number(v) < 0 ? '#e07060' : undefined;
}

export default function AdminInternalReports() {
  const [items, setItems] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ collaborator_id: '', month: '', year: '' });
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/internal-reports?per_page=200'),
      api.get('/admin/collaborators?per_page=100'),
    ]).then(([r1, r2]) => {
      setItems(r1.data.data);
      setCollaborators(r2.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openGenerate = () => {
    const now = new Date();
    setForm({ collaborator_id: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) });
    setShow(true);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    api.post('/admin/internal-reports/generate', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/internal-reports/${id}`).then(load);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Confirma exclusão de ${selected.size} item(ns)?`)) return;
    setDeleting(true);
    await Promise.all([...selected].map(id => api.delete(`/admin/internal-reports/${id}`)));
    setSelected(new Set());
    setDeleting(false);
    load();
  };

  const handleBatchPdf = () => {
    api.post('/admin/internal-reports/batch-pdf', { ids: [...selected] }, { responseType: 'blob' })
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Relatorios Internos Selecionados.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const filtered = items.filter(r => {
    if (search && !(r.collaborator?.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterMonth && String(r.month) !== filterMonth) return false;
    if (filterYear && String(r.year) !== filterYear) return false;
    return true;
  });

  const selectedItems = filtered.filter(r => selected.has(r.id));
  const totalUpdatedValue = selectedItems.reduce((s, r) => s + Number(r.updated_value || 0), 0);
  const totalProfitPct = selectedItems.length > 0
    ? selectedItems.reduce((s, r) => s + Number(r.profit_percentage || 0), 0) / selectedItems.length
    : 0;

  const years = [...new Set(items.map(r => r.year))].sort((a, b) => b - a);

  const tdStyle = { padding: '0.5rem' };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Relatórios Internos</h4>
          <p className="page-subtitle mb-0">Relatórios mensais de colaboradores</p>
        </div>
        <Button className="btn-gold" onClick={openGenerate}><LuPlus className="me-2" size={14} />Gerar Relatório</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">Todos os meses</option>
          {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">Todos os anos</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-gold d-flex align-items-center gap-1" onClick={handleBatchPdf}>
              <LuDownload size={13} />
              PDF ({selected.size})
            </button>
            <button className="btn btn-sm btn-outline-danger-custom d-flex align-items-center gap-1" onClick={handleDeleteSelected} disabled={deleting}>
              <LuTrash2 size={13} />
              Excluir ({selected.size})
            </button>
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="d-flex gap-3 mb-3">
          <div className="px-3 py-2" style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span className="text-stone" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Total V. Atualizado</span>
            <div className="text-petrol fw-semibold">{formatCurrency(totalUpdatedValue)}</div>
          </div>
          <div className="px-3 py-2" style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span className="text-stone" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Média Lucro %</span>
            <div className="fw-semibold" style={{ color: profitColor(totalProfitPct) || 'var(--gold)' }}>{totalProfitPct.toFixed(2)}%</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <Card className="chart-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle responsive-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 40, padding: '0.5rem' }}>
                      <input type="checkbox" className="form-check-input bulk-checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
                    </th>
                    <th style={tdStyle}>Colaborador</th>
                    <th style={tdStyle}>Período</th>
                    <th style={tdStyle}>V. Inicial</th>
                    <th style={tdStyle}>V. Atualizado</th>
                    <th style={tdStyle}>Lucro</th>
                    <th style={tdStyle}>Lucro %</th>
                    <th style={tdStyle}>L. Total</th>
                    <th style={tdStyle}>L. Total %</th>
                    <th style={tdStyle}>Comissão</th>
                    <th style={tdStyle}>Próx. Mês</th>
                    <th style={tdStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const pct = Number(r.profit_percentage);
                    const pctColor = profitColor(pct);
                    const belowTarget = pct >= 0 && pct < PROFIT_TARGET;
                    const totalProfit = Number(r.updated_value || 0) - Number(r.total_deposits || 0);
                    const totalDeposits = Number(r.total_deposits || 0);
                    const totalProfitPctRow = totalDeposits > 0 ? (totalProfit / totalDeposits) * 100 : 0;
                    const totalProfitColor = profitColor(totalProfitPctRow);
                    return (
                      <tr key={r.id} className={selected.has(r.id) ? 'row-selected' : ''}>
                        <td style={tdStyle}>
                          <input type="checkbox" className="form-check-input bulk-checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                        </td>
                        <td data-label="Colaborador" className="text-white fw-medium" style={tdStyle}>{r.collaborator?.name}</td>
                        <td data-label="Período" style={tdStyle}><span className="badge-gold">{monthAbbr[r.month]}/{r.year}</span></td>
                        <td data-label="V. Inicial" className="fw-medium" style={{ ...tdStyle, color: valueColor(r.initial_value) || '#00b3b3' }}>{formatCurrency(r.initial_value)}</td>
                        <td data-label="V. Atualizado" className="fw-medium" style={{ ...tdStyle, color: valueColor(r.updated_value) || '#fff' }}>{formatCurrency(r.updated_value)}</td>
                        <td data-label="Lucro" className="fw-semibold" style={{ ...tdStyle, color: valueColor(r.profit) || '#00b3b3' }}>
                          {formatCurrency(r.profit)}
                        </td>
                        <td data-label="Lucro %" style={tdStyle}>
                          <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: pctColor || 'var(--gold)' }}>
                            {pct.toFixed(2)}%
                            {belowTarget && <LuTriangleAlert size={12} style={{ color: '#e0a830' }} title={`Abaixo da meta de ${PROFIT_TARGET}%`} />}
                          </span>
                        </td>
                        <td data-label="L. Total" className="fw-semibold" style={{ ...tdStyle, color: valueColor(totalProfit) || '#00b3b3' }}>
                          {formatCurrency(totalProfit)}
                        </td>
                        <td data-label="L. Total %" style={tdStyle}>
                          <span className="fw-semibold" style={{ color: totalProfitColor || 'var(--gold)' }}>
                            {totalProfitPctRow.toFixed(2)}%
                          </span>
                        </td>
                        <td data-label="Comissão" className="text-gold fw-medium" style={tdStyle}>{formatCurrency(r.commission_value)}</td>
                        <td data-label="Próx. Mês" className="fw-medium" style={{ ...tdStyle, color: valueColor(r.next_month_initial) || '#00b3b3' }}>{formatCurrency(r.next_month_initial)}</td>
                        <td data-label="Ações" className="td-actions" style={tdStyle}>
                          <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(r.id)}>
                            <LuTrash2 size={13} />
                          </button>
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

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Gerar Relatório Interno</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Colaborador</Form.Label>
              <Form.Select value={form.collaborator_id} onChange={e => setForm({ ...form, collaborator_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-3">
              <Form.Group className="flex-fill">
                <Form.Label>Mês</Form.Label>
                <Form.Select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required className="bg-dark text-white border-secondary">
                  {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="flex-fill">
                <Form.Label>Ano</Form.Label>
                <Form.Control type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required className="bg-dark text-white border-secondary" />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit">Gerar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
