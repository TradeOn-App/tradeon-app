import { useEffect } from 'react';
import { LuLogOut, LuHouse } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelectedClient } from '../hooks/useSelectedClient';
import api from '../services/api';

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const { selectedClientId, setSelectedClientId, clients, setClients } = useSelectedClient();

  useEffect(() => {
    if (isAdmin && clients.length === 0) {
      api.get('/admin/clients?per_page=100').then(r => setClients(r.data.data));
    }
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="mobile-header">
      <button className="mobile-header-home" onClick={() => navigate('/')}>
        <LuHouse size={18} />
      </button>
      <div className="mobile-header-brand">
        {isAdmin && clients.length > 0 ? (
          <select
            className="filter-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{ fontSize: '0.75rem', maxWidth: 150, padding: '0.3rem 0.5rem' }}
          >
            <option value="">Todos</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        ) : (
          <>
            <span className="mobile-header-brand-name">TradeOn</span>
            <span className="mobile-header-user">{user?.name}</span>
          </>
        )}
      </div>
      <button className="mobile-header-logout" onClick={handleLogout}>
        <LuLogOut size={18} />
      </button>
    </header>
  );
}
