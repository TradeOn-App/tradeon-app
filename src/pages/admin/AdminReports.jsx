import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuDownload, LuSearch, LuSend, LuShare2, LuCheck } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => 'US$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthAbbr = ['', 'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function valueColor(v) {
  return Number(v) < 0 ? '#e07060' : undefined;
}

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ client_id: '', month: '', year: '' });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/reports?per_page=50'),
      api.get('/admin/clients?per_page=100'),
    ]).then(([r1, r2]) => {
      setItems(r1.data.data);
      setClients(r2.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openGenerate = () => {
    const now = new Date();
    setForm({ client_id: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) });
    setShow(true);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    api.post('/admin/reports/generate', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/reports/${id}`).then(load);
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
    await Promise.all([...selected].map(id => api.delete(`/admin/reports/${id}`)));
    setSelected(new Set());
    setDeleting(false);
    load();
  };

  const handleBatchPdf = () => {
    api.post('/admin/reports/batch-pdf', { ids: [...selected] }, { responseType: 'blob' })
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Relatorios Selecionados.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handlePublish = (reportId) => {
    api.post(`/admin/reports/${reportId}/publish`).then(() => load());
  };

  const handleDownloadPdf = (reportId) => {
    api.get(`/admin/reports/${reportId}/pdf`, { responseType: 'blob' })
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Relatorio ${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleSharePdf = (reportId, clientName, month, year) => {
    api.get(`/admin/reports/${reportId}/pdf`, { responseType: 'blob' })
      .then(async (res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const file = new File([blob], `Relatorio ${clientName} - ${month}-${year}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Relatório ${monthNames[month]} / ${year}` });
        } else {
          handleDownloadPdf(reportId);
        }
      });
  };

  const filtered = items.filter(r => {
    if (search && !(r.client?.full_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tdStyle = { padding: '0.5rem' };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Relatórios Externos</h4>
          <p className="page-subtitle mb-0">Relatórios mensais de clientes</p>
        </div>
        <Button className="btn-gold" onClick={openGenerate}><LuPlus className="me-2" size={14} />Gerar Relatório</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
                    <th style={tdStyle}>Cliente</th>
                    <th style={tdStyle}>Período</th>
                    <th style={tdStyle}>V. Inicial</th>
                    <th style={tdStyle}>V. Atualizado</th>
                    <th style={tdStyle}>Ganho Real</th>
                    <th style={tdStyle}>Ganho %</th>
                    <th style={tdStyle}>Comissão</th>
                    <th style={tdStyle}>Lucro</th>
                    <th style={tdStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className={selected.has(r.id) ? 'row-selected' : ''}>
                      <td style={tdStyle}>
                        <input type="checkbox" className="form-check-input bulk-checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      </td>
                      <td data-label="Cliente" className="text-white fw-medium" style={tdStyle}>{r.client?.full_name}</td>
                      <td data-label="Período" style={tdStyle}><span className="badge-gold">{monthAbbr[r.month]}/{r.year}</span></td>
                      <td data-label="V. Inicial" className="fw-medium" style={{ ...tdStyle, color: valueColor(r.initial_value) || '#00b3b3' }}>{formatCurrency(r.initial_value)}</td>
                      <td data-label="V. Atualizado" className="fw-medium" style={{ ...tdStyle, color: valueColor(r.updated_value) || '#fff' }}>{formatCurrency(r.updated_value)}</td>
                      <td data-label="Ganho Real" className="fw-semibold" style={{ ...tdStyle, color: valueColor(r.real_gain) || '#00b3b3' }}>
                        {formatCurrency(r.real_gain)}
                      </td>
                      <td data-label="Ganho %" style={tdStyle}>
                        <span className="fw-semibold" style={{ color: Number(r.gain_percentage) < 0 ? '#e07060' : Number(r.gain_percentage) >= 5 ? '#00b3b3' : 'var(--gold)' }}>
                          {Number(r.gain_percentage).toFixed(2)}%
                        </span>
                      </td>
                      <td data-label="Comissão" className="text-gold fw-medium" style={tdStyle}>{formatCurrency(r.commission_value)}</td>
                      <td data-label="Lucro" className="fw-semibold" style={{ ...tdStyle, color: valueColor(r.profit_value) || '#00b3b3' }}>
                        {formatCurrency(r.profit_value)}
                      </td>
                      <td data-label="Ações" className="td-actions" style={tdStyle}>
                        <div className="d-flex gap-1">
                          {!r.published_at ? (
                            <button className="btn btn-outline-gold btn-sm" onClick={() => handlePublish(r.id)} title="Enviar para o cliente">
                              <LuSend size={13} />
                            </button>
                          ) : (
                            <button className="btn btn-sm" style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', cursor: 'default' }} title="Enviado">
                              <LuCheck size={13} />
                            </button>
                          )}
                          {isMobile ? (
                            <button className="btn btn-outline-gold btn-sm" onClick={() => handleSharePdf(r.id, r.client?.full_name, r.month, r.year)} title="Compartilhar PDF">
                              <LuShare2 size={13} />
                            </button>
                          ) : (
                            <button className="btn btn-outline-gold btn-sm" onClick={() => handleDownloadPdf(r.id)} title="Baixar PDF">
                              <LuDownload size={13} />
                            </button>
                          )}
                          <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(r.id)}>
                            <LuTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Gerar Relatório</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
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
