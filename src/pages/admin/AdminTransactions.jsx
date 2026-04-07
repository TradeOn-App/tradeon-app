import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuSearch, LuPencilLine } from 'react-icons/lu';
import api from '../../services/api';
import CurrencyInput from '../../components/CurrencyInput';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatUSD = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const typeMap = { deposit: 'Valor Inicial', withdrawal: 'Saque', updated_value: 'Valor Atualizado', contribution: 'Aporte' };

const fetchDollarQuotation = async (dateStr) => {
  try {
    if (dateStr) {
      const d = dateStr.replace(/-/g, '');
      const res = await fetch(`https://economia.awesomeapi.com.br/json/daily/USD-BRL/1?start_date=${d}&end_date=${d}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data[0].bid || '';
    }
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await res.json();
    return data.USDBRL?.bid || '';
  } catch {
    return '';
  }
};

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_id: '', type: 'deposit', amount: '', initial_debit: '', reference_month: '', reference_year: '', currency_id: '', network_id: '', description: '', transaction_date: '', quotation: '', receipt: null });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/client-transactions?per_page=50'),
      api.get('/admin/clients?per_page=100'),
      api.get('/admin/currencies'),
      api.get('/admin/networks'),
    ]).then(([r1, r2, r3, r4]) => {
      setItems(r1.data.data);
      setClients(r2.data.data);
      setCurrencies(r3.data);
      setNetworks(r4.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = async () => {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    const quotation = await fetchDollarQuotation(today);
    setForm({ client_id: '', type: 'deposit', amount: '', initial_debit: '', reference_month: '', reference_year: '', currency_id: '', network_id: '', description: '', transaction_date: today, quotation, receipt: null });
    setShow(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      client_id: t.client_id || t.client?.id || '',
      type: t.type || 'deposit',
      amount: t.amount || '',
      initial_debit: t.initial_debit || '',
      reference_month: t.reference_month || '',
      reference_year: t.reference_year || '',
      currency_id: t.cash_flow_transaction?.currency_id || '',
      network_id: t.cash_flow_transaction?.network_id || '',
      description: t.cash_flow_transaction?.description || '',
      transaction_date: t.cash_flow_transaction?.transaction_date || '',
      quotation: t.cash_flow_transaction?.quotation_at_transaction || '',
      receipt: null,
    });
    setShow(true);
  };

  const handleDateChange = async (dateValue) => {
    setForm(f => ({ ...f, transaction_date: dateValue }));
    if (dateValue) {
      const quotation = await fetchDollarQuotation(dateValue);
      setForm(f => ({ ...f, quotation }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      api.put(`/admin/client-transactions/${editing.id}`, form).then(() => { setShow(false); load(); });
    } else {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'receipt') {
          if (val) data.append('receipt', val);
        } else if (val !== '' && val !== null) {
          data.append(key, val);
        }
      });
      api.post('/admin/client-transactions', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(() => { setShow(false); load(); });
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/client-transactions/${id}`).then(load);
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
      setSelected(new Set(filtered.map(t => t.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Confirma exclusão de ${selected.size} item(ns)?`)) return;
    setDeleting(true);
    await Promise.all([...selected].map(id => api.delete(`/admin/client-transactions/${id}`)));
    setSelected(new Set());
    setDeleting(false);
    load();
  };

  const filtered = items.filter(t => {
    const matchesSearch = !search || (t.client?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Transações Externas</h4>
          <p className="page-subtitle mb-0">Valores iniciais, atualizados e saques de clientes</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Transação</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="deposit">Valor Inicial</option>
          <option value="contribution">Aporte</option>
          <option value="withdrawal">Saque</option>
          <option value="updated_value">Valor Atualizado</option>
        </select>
        {selected.size > 0 && (
          <button className="btn btn-sm btn-outline-danger-custom d-flex align-items-center gap-1" onClick={handleDeleteSelected} disabled={deleting}>
            <LuTrash2 size={13} />
            Excluir {selected.size} selecionado(s)
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle responsive-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className="form-check-input bulk-checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
                </th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Data</th>
                <th>Cotação USD</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={selected.has(t.id) ? 'row-selected' : ''}>
                  <td>
                    <input type="checkbox" className="form-check-input bulk-checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td data-label="Cliente" className="text-white fw-medium">{t.client?.full_name}</td>
                  <td data-label="Tipo">
                    <span className={t.type === 'deposit' ? 'badge-deposit' : t.type === 'contribution' ? 'badge-petrol' : t.type === 'withdrawal' ? 'badge-withdrawal' : t.type === 'updated_value' ? 'badge-gold' : 'badge-stone'}>
                      {typeMap[t.type] || t.type}
                    </span>
                    {t.type === 'updated_value' && t.reference_month && (
                      <small className="text-stone ms-1">({String(t.reference_month).padStart(2, '0')}/{t.reference_year})</small>
                    )}
                  </td>
                  <td data-label="Valor" className={['deposit', 'updated_value', 'contribution'].includes(t.type) ? 'text-petrol fw-semibold' : t.type === 'withdrawal' ? 'fw-semibold' : ''}
                      style={t.type === 'withdrawal' ? { color: '#e07060' } : {}}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td data-label="Moeda">{t.cash_flow_transaction?.currency?.code}</td>
                  <td data-label="Data">{t.cash_flow_transaction?.transaction_date}</td>
                  <td data-label="Cotação USD">{t.cash_flow_transaction?.quotation_at_transaction ? formatUSD(t.cash_flow_transaction.quotation_at_transaction) : '-'}</td>
                  <td data-label="Ações" className="td-actions">
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openEdit(t)}><LuPencilLine size={13} /></button>
                      <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(t.id)}><LuTrash2 size={13} /></button>
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
          <Modal.Title>{editing ? 'Editar Transação' : 'Nova Transação'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="bg-dark text-white border-secondary">
                <option value="deposit">Valor Inicial</option>
                <option value="contribution">Aporte</option>
                <option value="withdrawal">Saque</option>
                <option value="updated_value">Valor Atualizado</option>
              </Form.Select>
            </Form.Group>
            {form.type === 'updated_value' && (
              <Form.Group className="mb-3">
                <Form.Label>Referente ao mês</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select value={form.reference_month || ''} onChange={e => setForm({ ...form, reference_month: e.target.value })} required className="bg-dark text-white border-secondary">
                    <option value="">Mês...</option>
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </Form.Select>
                  <Form.Control type="number" placeholder="Ano" value={form.reference_year || ''} onChange={e => setForm({ ...form, reference_year: e.target.value })} required className="bg-dark text-white border-secondary" style={{ maxWidth: 100 }} />
                </div>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Valor (USD)</Form.Label>
              <CurrencyInput value={form.amount} onChange={v => setForm({ ...form, amount: v })} required className="bg-dark text-white border-secondary" prefix="$" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Débito Inicial (USD)</Form.Label>
              <CurrencyInput value={form.initial_debit} onChange={v => setForm({ ...form, initial_debit: v })} className="bg-dark text-white border-secondary" placeholder="Perda do mês anterior" prefix="$" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Moeda</Form.Label>
              <Form.Select value={form.currency_id} onChange={e => setForm({ ...form, currency_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rede</Form.Label>
              <Form.Select value={form.network_id} onChange={e => setForm({ ...form, network_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Data da Transação</Form.Label>
              <Form.Control type="date" value={form.transaction_date} onChange={e => handleDateChange(e.target.value)} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cotação Dólar</Form.Label>
              <CurrencyInput value={form.quotation} onChange={v => setForm({ ...form, quotation: v })} className="bg-dark text-white border-secondary" placeholder="Preenchido automaticamente pela data" prefix="$" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comprovante</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={e => setForm({ ...form, receipt: e.target.files[0] || null })} className="bg-dark text-white border-secondary" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
