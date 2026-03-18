import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { PlusLg, Trash, Download } from 'react-bootstrap-icons';
import api from '../../services/api';

const formatCurrency = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ client_id: '', month: '', year: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/reports?per_page=50'),
      api.get('/admin/clients?per_page=100'),
    ]).then(([r1, r2]) => {
      setItems(r1.data.data);
      setClients(r2.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openGenerate = () => {
    const now = new Date();
    setForm({ client_id: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) });
    setShow(true);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    api.post('/admin/reports/generate', form).then(() => { setShow(false); load(); });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Confirma exclusao?')) return;
    api.delete(`/admin/reports/${id}`).then(load);
  };

  const handleDownloadPdf = (reportId) => {
    api.get(`/admin/reports/${reportId}/pdf`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio-${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">Relatorios</h4>
          <p className="page-subtitle mb-0">Relatorios mensais de clientes</p>
        </div>
        <Button className="btn-gold" onClick={openGenerate}><PlusLg className="me-2" size={14} />Gerar Relatorio</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" className="spinner-gold" /></div>
      ) : (
        <Card className="chart-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Periodo</th>
                    <th>Depositos</th>
                    <th>Saques</th>
                    <th>Rentabilidade</th>
                    <th>Gerado em</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.id}>
                      <td className="text-white fw-medium">{r.client?.full_name}</td>
                      <td><span className="badge-gold">{monthNames[r.month]} / {r.year}</span></td>
                      <td className="text-petrol fw-medium">{formatCurrency(r.total_deposits)}</td>
                      <td style={{ color: '#e07060' }} className="fw-medium">{formatCurrency(r.total_withdrawals)}</td>
                      <td>
                        <span className={Number(r.profitability_percent) >= 0 ? 'text-gold fw-semibold' : 'fw-semibold'} style={Number(r.profitability_percent) < 0 ? { color: '#e07060' } : {}}>
                          {Number(r.profitability_percent).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-stone">{r.generated_at ? new Date(r.generated_at).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-gold btn-sm" onClick={() => handleDownloadPdf(r.id)} title="Baixar PDF">
                            <Download size={13} />
                          </button>
                          <button className="btn btn-outline-danger-custom btn-sm" onClick={() => handleDelete(r.id)}>
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered contentClassName="bg-dark text-white">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Gerar Relatorio</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required className="bg-dark text-white border-secondary">
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="d-flex gap-3">
              <Form.Group className="flex-fill">
                <Form.Label>Mes</Form.Label>
                <Form.Select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required className="bg-dark text-white border-secondary">
                  {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="flex-fill">
                <Form.Label>Ano</Form.Label>
                <Form.Control type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required className="bg-dark text-white border-secondary" />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
            <Button className="btn-gold" type="submit">Gerar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
