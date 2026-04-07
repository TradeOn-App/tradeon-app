import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuPencilLine, LuTrash2, LuSearch } from 'react-icons/lu';
import api from '../../services/api';
import CurrencyInput from '../../components/CurrencyInput';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminCollaborators() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', cpf: '', wallet: '', commission: '', fixed: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/collaborators')
      .then(r => setItems(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', cpf: '', wallet: '', commission: '', fixed: '' });
    setShow(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, cpf: c.cpf, wallet: c.wallet || '', commission: c.commission ?? '', fixed: c.fixed ?? '' });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = editing
      ? api.put(`/admin/collaborators/${editing.id}`, form)
      : api.post('/admin/collaborators', form);
    req.then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
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
          <p className="page-subtitle mb-0">Gerenciar colaboradores e comissões</p>
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
                <th>Comissão</th>
                <th>Fixo</th>
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
                  <td data-label="Comissão" className="text-gold">{c.commission ? `${c.commission}%` : '-'}</td>
                  <td data-label="Fixo" className="text-petrol">{c.fixed ? formatCurrency(c.fixed) : '-'}</td>
                  <td data-label="Status"><span className={c.is_active ? 'badge-active' : 'badge-inactive'}>{c.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  <td data-label="Ações" className="td-actions">
                    <div className="d-flex gap-1">
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
            <div className="row mb-3">
              <Form.Group className="col">
                <Form.Label>Comissão (%)</Form.Label>
                <Form.Control type="number" step="0.01" min="0" max="100" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} className="bg-dark text-white border-secondary" placeholder="% lucro da banca" />
              </Form.Group>
              <Form.Group className="col">
                <Form.Label>Fixo</Form.Label>
                <CurrencyInput value={form.fixed} onChange={v => setForm({ ...form, fixed: v })} className="bg-dark text-white border-secondary" placeholder="Valor fixo" />
              </Form.Group>
            </div>
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
