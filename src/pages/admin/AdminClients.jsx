import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { LuPlus, LuPencilLine, LuTrash2, LuSearch, LuPower, LuSettings } from 'react-icons/lu';
import api from '../../services/api';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', document: '', phone: '', notes: '', commission: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsClient, setSettingsClient] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ email: '', password: '', password_confirmation: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/clients').then(r => setClients(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', password: '', document: '', phone: '', notes: '', commission: '' });
    setShow(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ full_name: c.full_name, email: c.user?.email || '', password: '', document: c.document, phone: c.phone || '', notes: c.notes || '', commission: c.commission ?? '' });
    setShow(true);
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const req = editing
      ? api.put(`/admin/clients/${editing.id}`, form)
      : api.post('/admin/clients', form);
    req
      .then(() => { setShow(false); load(); })
      .catch(err => {
        const errors = err.response?.data?.errors;
        if (errors) {
          setFormError(Object.values(errors).flat().join(' '));
        } else {
          setFormError(err.response?.data?.message || 'Erro ao salvar.');
        }
      });
  };

  const handleToggleActive = (c) => {
    const action = c.is_active ? 'inativar' : 'ativar';
    if (!window.confirm(`Confirma ${action} o cliente "${c.full_name}"?`)) return;
    api.put(`/admin/clients/${c.id}`, { is_active: !c.is_active }).then(load);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusão?')) return;
    api.delete(`/admin/clients/${id}`).then(load);
  };

  const openSettings = (c) => {
    setSettingsClient(c);
    setSettingsForm({ email: c.user?.email || '', password: '', password_confirmation: '' });
    setSettingsMsg('');
    setShowSettings(true);
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    if (settingsForm.password && settingsForm.password !== settingsForm.password_confirmation) {
      setSettingsMsg('As senhas não coincidem.');
      return;
    }
    setSettingsSaving(true);
    setSettingsMsg('');
    const payload = {};
    if (settingsForm.email !== settingsClient.user?.email) payload.email = settingsForm.email;
    if (settingsForm.password) payload.password = settingsForm.password;
    if (!Object.keys(payload).length) {
      setSettingsMsg('Nenhuma alteração detectada.');
      setSettingsSaving(false);
      return;
    }
    api.put(`/admin/clients/${settingsClient.id}`, payload)
      .then(() => { setSettingsMsg('Salvo com sucesso!'); load(); })
      .catch(err => {
        const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Erro ao salvar.';
        setSettingsMsg(msg);
      })
      .finally(() => setSettingsSaving(false));
  };

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      (c.full_name || '').toLowerCase().includes(term) ||
      (c.user?.email || '').toLowerCase().includes(term) ||
      (c.document || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || String(c.is_active) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Clientes</h4>
          <p className="page-subtitle mb-0">Gerenciar clientes da plataforma</p>
        </div>
        <Button className="btn-gold" onClick={openNew}><LuPlus className="me-2" size={14} />Novo Cliente</Button>
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
                <th>Email</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td data-label="Nome" className="text-white fw-medium">{c.full_name}</td>
                  <td data-label="Email">{c.user?.email}</td>
                  <td data-label="Documento"><code className="text-gold">{c.document}</code></td>
                  <td data-label="Telefone">{c.phone || '-'}</td>
                  <td data-label="Status"><span className={c.is_active ? 'badge-active' : 'badge-inactive'}>{c.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  <td data-label="Ações" className="td-actions">
                    <div className="d-flex gap-1">
                      <button
                        className={`btn btn-sm ${c.is_active ? 'btn-outline-danger-custom' : 'btn-outline-success'}`}
                        title={c.is_active ? 'Inativar' : 'Ativar'}
                        onClick={() => handleToggleActive(c)}
                      >
                        <LuPower size={13} />
                      </button>
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openEdit(c)}><LuPencilLine size={13} /></button>
                      <button className="btn btn-outline-gold btn-sm" onClick={() => openSettings(c)} title="Configurações"><LuSettings size={13} /></button>
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
          <Modal.Title>{editing ? 'Editar Cliente' : 'Novo Cliente'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome Completo</Form.Label>
              <Form.Control value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            {!editing && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="bg-dark text-white border-secondary" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Senha (primeiro acesso)</Form.Label>
                  <Form.Control type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={12} className="bg-dark text-white border-secondary" placeholder="Mínimo 12 caracteres" />
                  <Form.Text className="text-secondary">A senha deve ter no mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&#).</Form.Text>
                </Form.Group>
              </>
            )}
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <Form.Group className="mb-3">
              <Form.Label>CPF/CNPJ</Form.Label>
              <Form.Control value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comissão (%)</Form.Label>
              <Form.Control type="number" step="0.01" min="0" max="100" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} className="bg-dark text-white border-secondary" placeholder="Ex: 10.00" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-dark text-white border-secondary" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Configurações — {settingsClient?.full_name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSettingsSubmit}>
          <Modal.Body>
            {settingsMsg && (
              <div className={`alert ${settingsMsg.includes('sucesso') ? 'alert-success' : 'alert-danger'} py-2`}>
                {settingsMsg}
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={settingsForm.email}
                onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                required
                className="bg-dark text-white border-secondary"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nova Senha</Form.Label>
              <Form.Control
                type="password"
                value={settingsForm.password}
                onChange={e => setSettingsForm({ ...settingsForm, password: e.target.value })}
                className="bg-dark text-white border-secondary"
                placeholder="Deixe em branco para manter a atual"
                minLength={6}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirmar Nova Senha</Form.Label>
              <Form.Control
                type="password"
                value={settingsForm.password_confirmation}
                onChange={e => setSettingsForm({ ...settingsForm, password_confirmation: e.target.value })}
                className="bg-dark text-white border-secondary"
                placeholder="Repita a nova senha"
              />
            </Form.Group>
            <p className="text-stone mb-0" style={{ fontSize: '0.8rem' }}>
              Ao alterar a senha, o cliente será obrigado a trocá-la no próximo login.
            </p>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit" disabled={settingsSaving}>
              {settingsSaving ? <Spinner animation="border" size="sm" /> : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
