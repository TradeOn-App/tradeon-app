import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuPencilLine, LuTrash2, LuSearch, LuFileText } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminCollaborators() {
  const [items, setItems] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cpf: '', wallet: '', commission_rule_id: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/collaborators'),
      api.get('/admin/commission-rules?per_page=100'),
    ]).then(([r1, r2]) => {
      setItems(r1.data.data);
      setRules(r2.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', cpf: '', wallet: '', commission_rule_id: '' });
    setShow(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, cpf: c.cpf, wallet: c.wallet || '', commission_rule_id: c.commission_rule_id || '' });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, commission_rule_id: form.commission_rule_id || null };
    const req = editing
      ? api.put(`/admin/collaborators/${editing.id}`, payload)
      : api.post('/admin/collaborators', payload);
    req.then(() => { setShow(false); load(); });
  };

  const openReport = (collaborator) => {
    setReportLoading(true);
    setShowReport(true);
    setReportData(null);
    api.get(`/admin/collaborators/${collaborator.id}/report`)
      .then(r => setReportData(r.data))
      .finally(() => setReportLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/collaborators/${id}`).then(load);
  };

  const filtered = items.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      (c.name || '').toLowerCase().includes(term) ||
      (c.cpf || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || String(c.is_active) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Colaboradores</h4>
          <p className="page-subtitle mb-0">Gerenciar colaboradores e comissoes</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Novo</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="1">Ativo</option>
          <option value="0">Inativo</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle responsive-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Wallet</th>
                <th>Regra Comissão</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td data-label="Nome" className="text-white fw-medium">{c.name}</td>
                  <td data-label="CPF"><code className="text-gold">{c.cpf}</code></td>
                  <td data-label="Wallet"><code className="text-petrol d-inline-block text-truncate" style={{ maxWidth: 150 }}>{c.wallet || '-'}</code></td>
                  <td data-label="Regra Comissão">{c.commission_rule ? <span className="badge-gold">{c.commission_rule.name}</span> : <span className="text-stone">-</span>}</td>
                  <td data-label="Status"><span className={c.is_active ? 'badge-active' : 'badge-inactive'}>{c.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  <td data-label="Ações" className="td-actions">
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openReport(c)} title="Relatório"><LuFileText size={13} /></button>
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openEdit(c)}><LuPencilLine size={13} /></button>
                      <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(c.id)}><LuTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{editing ? 'Editar Colaborador' : 'Novo Colaborador'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>CPF</Form.Label>
              <Form.Control value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Wallet</Form.Label>
              <Form.Control value={form.wallet} onChange={e => setForm({ ...form, wallet: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Regra de Comissao</Form.Label>
              <Form.Select value={form.commission_rule_id} onChange={e => setForm({ ...form, commission_rule_id: e.target.value })} className="bg-dark text-white border-secondary">
                <option value="">Nenhuma</option>
                {rules.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type === 'percentage' ? `${r.value}%` : `R$${r.value}`})</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showReport} onHide={() => setShowReport(false)} centered size="lg" contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Relatório - {reportData?.collaborator?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reportLoading ? (
            <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
          ) : reportData ? (() => {
            const summary = reportData.summary || {};
            const profitColor = Number(summary.profit) >= 0 ? 'var(--petrol)' : 'var(--danger)';
            const summaryCards = [
              { label: 'Total Entradas', value: formatCurrency(summary.total_entries), color: 'var(--petrol)' },
              { label: 'Total Saídas', value: formatCurrency(summary.total_exits), color: 'var(--danger)' },
              { label: 'Total Comissão', value: formatCurrency(summary.total_commission), color: 'var(--gold)' },
              { label: 'Lucro', value: formatCurrency(summary.profit), color: profitColor },
              { label: '% Lucro', value: `${summary.profit_percent ?? 0}%`, color: profitColor },
            ];
            return (
              <>
                <div className="d-flex flex-wrap gap-3 mb-4">
                  {summaryCards.map((card, i) => (
                    <div key={i} className="flex-fill text-center p-3" style={{ background: 'var(--surface)', borderRadius: 10, minWidth: 120 }}>
                      <div className="text-stone" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{card.label}</div>
                      <div className="fw-semibold mt-1" style={{ color: card.color, fontSize: '1.1rem' }}>{card.value}</div>
                    </div>
                  ))}
                </div>
                {reportData.transactions && reportData.transactions.length > 0 && (
                  <div className="table-responsive">
                    <Table className="table-dark table-hover align-middle" size="sm">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Valor</th>
                          <th>Comissão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.transactions.map((t, i) => (
                          <tr key={i}>
                            <td>{t.date}</td>
                            <td>{t.type}</td>
                            <td>{formatCurrency(t.amount)}</td>
                            <td>{formatCurrency(t.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </>
            );
          })() : null}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowReport(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
