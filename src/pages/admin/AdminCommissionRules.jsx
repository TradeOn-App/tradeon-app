import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuPencilLine, LuTrash2, LuSearch } from 'react-icons/lu';
import api from '../../services/api';
import CurrencyInput from '../../components/CurrencyInput';

export default function AdminCommissionRules() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', applicable_to: 'partner', type: 'percentage', value: '', description: '', valid_from: '', valid_until: '' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/commission-rules').then(r => setItems(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', applicable_to: 'partner', type: 'percentage', value: '', description: '', valid_from: '', valid_until: '' });
    setShow(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, applicable_to: c.applicable_to, type: c.type, value: c.value,
      description: c.description || '', valid_from: c.valid_from || '', valid_until: c.valid_until || '',
    });
    setShow(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = editing
      ? api.put(`/admin/commission-rules/${editing.id}`, form)
      : api.post('/admin/commission-rules', form);
    req.then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/commission-rules/${id}`).then(load);
  };

  const filtered = items.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && c.type !== filterType) return false;
    if (filterStatus === '1' && !c.is_active) return false;
    if (filterStatus === '0' && c.is_active) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Regras de Comissão</h4>
          <p className="page-subtitle mb-0">Configurar regras de comissionamento</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Nova Regra</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <LuSearch size={14} className="filter-search-icon" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="percentage">Percentual</option>
          <option value="fixed">Fixo</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="1">Ativa</option>
          <option value="0">Inativa</option>
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
                <th>Aplicável a</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td data-label="Nome" className="text-white fw-medium">{c.name}</td>
                  <td data-label="Aplicável a"><span className="badge-petrol">{c.applicable_to}</span></td>
                  <td data-label="Tipo">{c.type === 'percentage' ? 'Percentual' : 'Fixo'}</td>
                  <td data-label="Valor" className="text-gold fw-semibold">{c.type === 'percentage' ? `${c.value}%` : `R$ ${Number(c.value).toFixed(2)}`}</td>
                  <td data-label="Status"><span className={c.is_active ? 'badge-active' : 'badge-inactive'}>{c.is_active ? 'Ativa' : 'Inativa'}</span></td>
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
          <Modal.Title>{editing ? 'Editar Regra' : 'Nova Regra'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <div className="row mb-3">
              <Form.Group className="col">
                <Form.Label>Aplicável a</Form.Label>
                <Form.Select value={form.applicable_to} onChange={e => setForm({ ...form, applicable_to: e.target.value })} className="bg-dark text-white border-secondary">
                  <option value="partner">Partner</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="col">
                <Form.Label>Tipo</Form.Label>
                <Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="bg-dark text-white border-secondary">
                  <option value="percentage">Percentual</option>
                  <option value="fixed">Fixo</option>
                </Form.Select>
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <CurrencyInput value={form.value} onChange={v => setForm({ ...form, value: v })} required className="bg-dark text-white border-secondary" prefix={form.type === 'percentage' ? '%' : 'R$'} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-dark text-white border-secondary" />
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
