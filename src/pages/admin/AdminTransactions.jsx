import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuSearch } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const typeMap = { deposit: 'Aporte', withdrawal: 'Saque', allocation: 'Alocacao' };

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
  const [form, setForm] = useState({ client_id: '', type: 'deposit', amount: '', currency_id: '', network_id: '', description: '', transaction_date: '', quotation: '' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

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
    const today = new Date().toISOString().split('T')[0];
    const quotation = await fetchDollarQuotation(today);
    setForm({ client_id: '', type: 'deposit', amount: '', currency_id: '', network_id: '', description: '', transaction_date: today, quotation });
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
    api.post('/admin/client-transactions', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/client-transactions/${id}`).then(load);
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
          <h4 className="page-title mb-0">Transacoes</h4>
          <p className="page-subtitle mb-0">Aportes, saques e alocacoes de clientes</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Transacao</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="deposit">Aporte</option>
          <option value="withdrawal">Saque</option>
          <option value="allocation">Alocação</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle responsive-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Data</th>
                <th>Cotação USD</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td data-label="Cliente" className="text-white fw-medium">{t.client?.full_name}</td>
                  <td data-label="Tipo">
                    <span className={t.type === 'deposit' ? 'badge-deposit' : t.type === 'withdrawal' ? 'badge-withdrawal' : 'badge-stone'}>
                      {typeMap[t.type] || t.type}
                    </span>
                  </td>
                  <td data-label="Valor" className={t.type === 'deposit' ? 'text-petrol fw-semibold' : t.type === 'withdrawal' ? 'fw-semibold' : ''}
                      style={t.type === 'withdrawal' ? { color: '#e07060' } : {}}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td data-label="Moeda">{t.cash_flow_transaction?.currency?.code}</td>
                  <td data-label="Data">{t.cash_flow_transaction?.transaction_date}</td>
                  <td data-label="Cotação USD">{t.cash_flow_transaction?.quotation_at_transaction ? formatCurrency(t.cash_flow_transaction.quotation_at_transaction) : '-'}</td>
                  <td data-label="Ações" className="td-actions">
                    <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(t.id)}><LuTrash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Nova Transacao</Modal.Title>
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
                <option value="deposit">Aporte</option>
                <option value="withdrawal">Saque</option>
                <option value="allocation">Alocacao</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required className="bg-dark text-white border-secondary" />
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
              <Form.Control type="number" step="0.01" value={form.quotation} onChange={e => setForm({ ...form, quotation: e.target.value })} className="bg-dark text-white border-secondary" placeholder="Preenchido automaticamente pela data" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descricao</Form.Label>
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
