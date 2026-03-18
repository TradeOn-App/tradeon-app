import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { PlusLg, PencilSquare, Trash } from 'react-bootstrap-icons';
import api from '../../services/api';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', document: '', phone: '', notes: '' });

  const load = () => {
    setLoading(true);
    api.get('/admin/clients').then(r => setClients(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', document: '', phone: '', notes: '' });
    setShow(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ full_name: c.full_name, email: c.user?.email || '', document: c.document, phone: c.phone || '', notes: c.notes || '' });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = editing
      ? api.put(`/admin/clients/${editing.id}`, form)
      : api.post('/admin/clients', form);
    req.then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/clients/${id}`).then(load);
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Clientes</h4>
          <p className="page-subtitle mb-0">Gerenciar clientes da plataforma</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><PlusLg className="me-2" size={14} />Novo Cliente</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <div className="table-responsive">
          <Table className="table-dark table-hover align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td className="text-white fw-medium">{c.full_name}</td>
                  <td>{c.user?.email}</td>
                  <td><code className="text-gold">{c.document}</code></td>
                  <td>{c.phone || '-'}</td>
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
          <Modal.Title>{editing ? 'Editar Cliente' : 'Novo Cliente'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome Completo</Form.Label>
              <Form.Control value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            {!editing && (
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="bg-dark text-white border-secondary" />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>CPF/CNPJ</Form.Label>
              <Form.Control value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observacoes</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-dark text-white border-secondary" />
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
