import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { PlusLg, PencilSquare, Trash } from 'react-bootstrap-icons';
import api from '../../services/api';

export default function AdminCollaborators() {
  const [items, setItems] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cpf: '', wallet: '', commission_rule_id: '' });

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

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/collaborators/${id}`).then(load);
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Colaboradores</h4>
          <p className="page-subtitle mb-0">Gerenciar colaboradores e comissoes</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><PlusLg className="me-2" size={14} />Novo</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Wallet</th>
                <th>Regra Comissao</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td className="text-white fw-medium">{c.name}</td>
                  <td><code className="text-gold">{c.cpf}</code></td>
                  <td><code className="text-petrol d-inline-block text-truncate" style={{ maxWidth: 150 }}>{c.wallet || '-'}</code></td>
                  <td>{c.commission_rule ? <span className="badge-gold">{c.commission_rule.name}</span> : <span className="text-stone">-</span>}</td>
                  <td><span className={c.is_active ? 'badge-active' : 'badge-inactive'}>{c.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openEdit(c)}><PencilSquare size={13} /></button>
                      <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(c.id)}><Trash size={13} /></button>
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
    </div>
  );
}
