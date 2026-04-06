import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2, LuSearch, LuPencilLine } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

const emptyForm = { currency_id: '', network_id: '', amount: '', to_whom: '', reason: '', operation_date: '', reference: '', wallet_from: '', wallet_to: '', dollar_quotation: '' };

export default function AdminP2p() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/p2p-operations?per_page=50'),
      api.get('/admin/currencies'),
      api.get('/admin/networks'),
    ]).then(([r1, r2, r3]) => {
      setItems(r1.data.data);
      setCurrencies(r2.data);
      setNetworks(r3.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = async () => {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    const quotation = await fetchDollarQuotation(today);
    setForm({ ...emptyForm, operation_date: today, dollar_quotation: quotation });
    setShow(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    const quotation = await fetchDollarQuotation(item.operation_date);
    setForm({
      currency_id: item.currency_id || item.currency?.id || '',
      network_id: item.network_id || item.network?.id || '',
      amount: item.amount || '',
      to_whom: item.to_whom || '',
      reason: item.reason || '',
      operation_date: item.operation_date || '',
      reference: item.reference || '',
      wallet_from: item.wallet_from || '',
      wallet_to: item.wallet_to || '',
      dollar_quotation: item.dollar_quotation || quotation,
    });
    setShow(true);
  };

  const handleDateChange = async (dateValue) => {
    setForm(f => ({ ...f, operation_date: dateValue }));
    if (dateValue) {
      const quotation = await fetchDollarQuotation(dateValue);
      setForm(f => ({ ...f, dollar_quotation: quotation }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editing
      ? api.put(`/admin/p2p-operations/${editing.id}`, form)
      : api.post('/admin/p2p-operations', form);
    request.then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/p2p-operations/${id}`).then(load);
  };

  const filtered = items.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || (p.to_whom || '').toLowerCase().includes(searchLower) || (p.reason || '').toLowerCase().includes(searchLower);
    const matchesCurrency = !filterCurrency || String(p.currency_id || p.currency?.id) === filterCurrency;
    return matchesSearch && matchesCurrency;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Operacoes P2P</h4>
          <p className="page-subtitle mb-0">Transferencias peer-to-peer</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Operacao</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
          <option value="">Todas</option>
          {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle responsive-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Para</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Motivo</th>
                <th>Hash</th>
                <th>Wallet Envio</th>
                <th>Wallet Receb.</th>
                <th>Cotação USD</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td data-label="Data">{p.operation_date}</td>
                  <td data-label="Para" className="text-white fw-medium">{p.to_whom}</td>
                  <td data-label="Valor" className="text-gold fw-semibold">{formatCurrency(p.amount)}</td>
                  <td data-label="Moeda"><span className="badge-petrol">{p.currency?.code}</span></td>
                  <td data-label="Motivo">{p.reason || '-'}</td>
                  <td data-label="Hash"><code className="text-stone">{p.reference || '-'}</code></td>
                  <td data-label="Wallet Envio"><code className="text-stone">{p.wallet_from ? p.wallet_from.substring(0, 10) + '...' : '-'}</code></td>
                  <td data-label="Wallet Receb."><code className="text-stone">{p.wallet_to ? p.wallet_to.substring(0, 10) + '...' : '-'}</code></td>
                  <td data-label="Cotação USD">{p.dollar_quotation ? formatCurrency(p.dollar_quotation) : '-'}</td>
                  <td data-label="Ações" className="td-actions">
                    <button className="btn btn-outline-gold btn-sm me-1" onClick={() => openEdit(p)}><LuPencilLine size={13} /></button>
                    <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(p.id)}><LuTrash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{editing ? 'Editar Operação P2P' : 'Nova Operação P2P'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Para quem</Form.Label>
              <Form.Control value={form.to_whom} onChange={e => setForm({ ...form, to_whom: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required className="bg-dark text-white border-secondary" />
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
                <Form.Select value={form.network_id} onChange={e => setForm({ ...form, network_id: e.target.value })} required className="bg-dark text-white border-secondary">
                  <option value="">Selecione...</option>
                  {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="row mb-3">
              <Form.Group className="col">
                <Form.Label>Wallet de Envio</Form.Label>
                <Form.Control value={form.wallet_from} onChange={e => setForm({ ...form, wallet_from: e.target.value })} className="bg-dark text-white border-secondary" />
              </Form.Group>
              <Form.Group className="col">
                <Form.Label>Wallet de Recebimento</Form.Label>
                <Form.Control value={form.wallet_to} onChange={e => setForm({ ...form, wallet_to: e.target.value })} className="bg-dark text-white border-secondary" />
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Motivo</Form.Label>
              <Form.Control value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Data da Transação</Form.Label>
              <Form.Control type="date" value={form.operation_date} onChange={e => handleDateChange(e.target.value)} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hash</Form.Label>
              <Form.Control value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cotação Dólar</Form.Label>
              <Form.Control type="number" step="0.01" value={form.dollar_quotation} onChange={e => setForm({ ...form, dollar_quotation: e.target.value })} className="bg-dark text-white border-secondary" />
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
