import { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import api from '../services/api';

export default function ChangePasswordModal({ show, onChanged }) {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('A senha deve ter no mínimo 12 caracteres.');
      return;
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[@$!%*?&#]/.test(password)) {
      setError('A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&#).');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    api.post('/change-password', { password, password_confirmation: passwordConfirmation })
      .then(() => onChanged())
      .catch((err) => {
        setError(err.response?.data?.message || 'Erro ao alterar senha.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal show={show} centered backdrop="static" keyboard={false} contentClassName="bg-dark text-white">
      <Modal.Header>
        <Modal.Title>Alterar Senha</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p className="text-stone mb-3">
            Por segurança, você precisa criar uma nova senha antes de continuar.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Nova Senha</Form.Label>
            <div style={{ position: 'relative' }}>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={12}
                className="bg-dark text-white border-secondary"
                placeholder="Mínimo 12 caracteres (A-z, 0-9, @$!%*?&#)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <LuEye size={18} /> : <LuEyeOff size={18} />}
              </button>
            </div>
            <Form.Text className="text-secondary">A senha deve ter no mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&#).</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirmar Nova Senha</Form.Label>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              minLength={12}
              className="bg-dark text-white border-secondary"
              placeholder="Repita a nova senha"
            />
          </Form.Group>
          {error && <p className="text-danger small mb-0">{error}</p>}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button className="btn-gold" type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
