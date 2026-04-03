import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminP2p() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [form, setForm] = useState({ currency_id: '', network_id: '', amount: '', to_whom: '', reason: '', operation_date: '', reference: '' });

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

  const openNew = () => {
    setForm({ currency_id: '', network_id: '', amount: '', to_whom: '', reason: '', operation_date: new Date().toISOString().split('T')[0], reference: '' });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/admin/p2p-operations', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/p2p-operations/${id}`).then(load);
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Operacoes P2P</h4>
          <p className="page-subtitle mb-0">Transferencias peer-to-peer</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Operacao</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle">
            <thead>
              <tr>
                <th>Data</th>
                <th>Para</th>
                <th>Valor</th>
                <th>Moeda</th>
                <th>Motivo</th>
                <th>Referencia</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td>{p.operation_date}</td>
                  <td className="text-white fw-medium">{p.to_whom}</td>
                  <td className="text-gold fw-semibold">{formatCurrency(p.amount)}</td>
                  <td><span className="badge-petrol">{p.currency?.code}</span></td>
                  <td>{p.reason || '-'}</td>
                  <td><code className="text-stone">{p.reference || '-'}</code></td>
                  <td>
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
          <Modal.Title>Nova Operacao P2P</Modal.Title>
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
            <Form.Group className="mb-3">
              <Form.Label>Motivo</Form.Label>
              <Form.Control value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Data</Form.Label>
              <Form.Control type="date" value={form.operation_date} onChange={e => setForm({ ...form, operation_date: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Referencia</Form.Label>
              <Form.Control value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="bg-dark text-white border-secondary" />
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
