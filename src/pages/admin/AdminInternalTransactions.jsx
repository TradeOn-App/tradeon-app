import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuSearch, LuPencilLine } from 'react-icons/lu';
import api from '../../services/api';
import CurrencyInput from '../../components/CurrencyInput';

const formatCurrency = (v) => 'US$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatUSD = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => { if (!d) return '-'; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };
const typeMap = { initial_value: 'Valor Inicial', updated_value: 'Valor Atualizado', deposit: 'Aporte', withdrawal: 'Retirada', commission_withdrawal: 'Saque Comissão', client_withdrawal: 'Saque Cliente' };

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

export default function AdminInternalTransactions() {
  const [items, setItems] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    collaborator_id: '', type: 'deposit', amount: '', currency_id: '', network_id: '',
    transaction_date: '', quotation_at_transaction: '', wallet_destination: '', tx_hash: '', description: '',
  });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/internal-transactions?per_page=50'),
      api.get('/admin/collaborators?per_page=100'),
      api.get('/admin/currencies'),
      api.get('/admin/networks'),
    ]).then(([r1, r2, r3, r4]) => {
      setItems(r1.data.data);
      setCollaborators(r2.data.data);
      setCurrencies(r3.data);
      setNetworks(r4.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Set USDT as default currency when currencies load
  useEffect(() => {
    if (currencies.length > 0 && !form.currency_id) {
      const usdt = currencies.find(c => c.code === 'USDT');
      if (usdt) setForm(f => ({ ...f, currency_id: String(usdt.id) }));
    }
  }, [currencies]);

  const openNew = async () => {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    const quotation = await fetchDollarQuotation(today);
    const usdt = currencies.find(c => c.code === 'USDT');
    setForm({
      collaborator_id: '', type: 'deposit', amount: '', currency_id: usdt ? String(usdt.id) : '',
      network_id: '', transaction_date: today, quotation_at_transaction: quotation,
      wallet_destination: '', tx_hash: '', description: '',
    });
    setShow(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      collaborator_id: t.collaborator_id || '',
      type: t.type || 'deposit',
      amount: t.amount || '',
      currency_id: t.currency_id ? String(t.currency_id) : '',
      network_id: t.network_id ? String(t.network_id) : '',
      transaction_date: t.transaction_date || '',
      quotation_at_transaction: t.quotation_at_transaction || '',
      wallet_destination: t.wallet_destination || '',
      tx_hash: t.tx_hash || '',
      description: t.description || '',
    });
    setShow(true);
  };

  const handleDateChange = async (dateValue) => {
    setForm(f => ({ ...f, transaction_date: dateValue }));
    if (dateValue) {
      const quotation = await fetchDollarQuotation(dateValue);
      setForm(f => ({ ...f, quotation_at_transaction: quotation }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editing
      ? api.put(`/admin/internal-transactions/${editing.id}`, form)
      : api.post('/admin/internal-transactions', form);
    request.then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/internal-transactions/${id}`).then(load);
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
    await Promise.all([...selected].map(id => api.delete(`/admin/internal-transactions/${id}`)));
    setSelected(new Set());
    setDeleting(false);
    load();
  };

  const filtered = items.filter(t => {
    const matchesSearch = !search || (t.collaborator?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Transações Internas</h4>
          <p className="page-subtitle mb-0">Transações entre admin e colaboradores</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Transação</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="initial_value">Valor Inicial</option>
          <option value="updated_value">Valor Atualizado</option>
          <option value="deposit">Aporte</option>
          <option value="withdrawal">Retirada</option>
          <option value="commission_withdrawal">Saque Comissão</option>
          <option value="client_withdrawal">Saque Cliente</option>
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
          <Table className="table-dark table-hover align-middle responsive-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className="form-check-input bulk-checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleSelectAll} />
                </th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Data</th>
                <th>Cotação</th>
                <th style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Hash</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={selected.has(t.id) ? 'row-selected' : ''}>
                  <td>
                    <input type="checkbox" className="form-check-input bulk-checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} />
                  </td>
                  <td data-label="Colaborador" className="text-white fw-medium">{t.collaborator?.name}</td>
                  <td data-label="Tipo">
                    <span className={
                      t.type === 'initial_value' ? 'badge-deposit' :
                      t.type === 'updated_value' ? 'badge-gold' :
                      t.type === 'deposit' ? 'badge-petrol' :
                      t.type === 'withdrawal' ? 'badge-withdrawal' :
                      t.type === 'client_withdrawal' ? 'badge-withdrawal' :
                      'badge-gold'
                    }>
                      {typeMap[t.type] || t.type}
                    </span>
                  </td>
                  <td data-label="Valor" className={['initial_value', 'updated_value', 'deposit'].includes(t.type) ? 'text-petrol fw-semibold' : 'fw-semibold'}
                      style={['withdrawal', 'commission_withdrawal', 'client_withdrawal'].includes(t.type) ? { color: '#e07060' } : {}}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td data-label="Moeda">{t.currency?.code}</td>
                  <td data-label="Data">{formatDate(t.transaction_date)}</td>
                  <td data-label="Cotação USD">{t.quotation_at_transaction ? formatUSD(t.quotation_at_transaction) : '-'}</td>
                  <td data-label="Hash" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><code className="text-stone" title={t.tx_hash || ''}>{t.tx_hash || '-'}</code></td>
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
          <Modal.Title>{editing ? 'Editar Transação Interna' : 'Nova Transação Interna'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Colaborador</Form.Label>
              <Form.Select value={form.collaborator_id} onChange={e => setForm({ ...form, collaborator_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="bg-dark text-white border-secondary">
                <option value="initial_value">Valor Inicial</option>
                <option value="updated_value">Valor Atualizado</option>
                <option value="deposit">Aporte</option>
                <option value="withdrawal">Retirada</option>
                <option value="commission_withdrawal">Saque Comissão</option>
          <option value="client_withdrawal">Saque Cliente</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <CurrencyInput value={form.amount} onChange={v => setForm({ ...form, amount: v })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <div className="row mb-3">
              <Form.Group className="col">
                <Form.Label>Moeda</Form.Label>
                <Form.Select value={form.currency_id} onChange={e => setForm({ ...form, currency_id: e.target.value })} required className="bg-dark text-white border-secondary">
                  <option value="">Selecione...</option>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="col">
                <Form.Label>Rede</Form.Label>
                <Form.Select value={form.network_id} onChange={e => setForm({ ...form, network_id: e.target.value })} className="bg-dark text-white border-secondary">
                  <option value="">Selecione...</option>
                  {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Data da Transação</Form.Label>
              <Form.Control type="date" value={form.transaction_date} onChange={e => handleDateChange(e.target.value)} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cotação Dólar</Form.Label>
              <CurrencyInput value={form.quotation_at_transaction} onChange={v => setForm({ ...form, quotation_at_transaction: v })} className="bg-dark text-white border-secondary" placeholder="Preenchido automaticamente pela data" prefix="$" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Wallet de Destino</Form.Label>
              <Form.Control value={form.wallet_destination} onChange={e => setForm({ ...form, wallet_destination: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hash</Form.Label>
              <Form.Control value={form.tx_hash} onChange={e => setForm({ ...form, tx_hash: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-dark text-white border-secondary" />
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
