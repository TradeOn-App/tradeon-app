import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const typeMap = { deposit: 'Aporte', withdrawal: 'Saque', allocation: 'Alocacao' };

export default function AdminTransactions() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ client_id: '', type: 'deposit', amount: '', currency_id: '', network_id: '', description: '', transaction_date: '' });

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

  const openNew = () => {
    setForm({ client_id: '', type: 'deposit', amount: '', currency_id: '', network_id: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/admin/client-transactions', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/client-transactions/${id}`).then(load);
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Transacoes</h4>
          <p className="page-subtitle mb-0">Aportes, saques e alocacoes de clientes</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Transacao</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Data</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id}>
                  <td className="text-white fw-medium">{t.client?.full_name}</td>
                  <td>
                    <span className={t.type === 'deposit' ? 'badge-deposit' : t.type === 'withdrawal' ? 'badge-withdrawal' : 'badge-stone'}>
                      {typeMap[t.type] || t.type}
                    </span>
                  </td>
                  <td className={t.type === 'deposit' ? 'text-petrol fw-semibold' : t.type === 'withdrawal' ? 'fw-semibold' : ''}
                      style={t.type === 'withdrawal' ? { color: '#e07060' } : {}}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td>{t.cash_flow_transaction?.currency?.code}</td>
                  <td>{t.cash_flow_transaction?.transaction_date}</td>
                  <td>
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
              <Form.Label>Data</Form.Label>
              <Form.Control type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} required className="bg-dark text-white border-secondary" />
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
