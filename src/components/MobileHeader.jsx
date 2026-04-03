import { LuLogOut, LuHouse } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <span className="mobile-header-brand-name">TradeOn</span>
        <span className="mobile-header-user">{user?.name}</span>
      </div>
      <button className="mobile-header-logout" onClick={handleLogout}>
        <LuLogOut size={18} />
      </button>
    </header>
  );
}
