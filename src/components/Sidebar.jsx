import { useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import { LuChartBar, LuFileText, LuLogOut, LuUsers, LuUserCheck, LuCoins, LuArrowLeftRight, LuReceipt, LuTrendingUp } from 'react-icons/lu';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelectedClient } from '../hooks/useSelectedClient';
import api from '../services/api';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const { selectedClientId, setSelectedClientId, clients, setClients } = useSelectedClient();

  useEffect(() => {
    if (isAdmin) {
      api.get('/admin/clients?per_page=100').then(r => setClients(r.data.data));
    }
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/', icon: <LuChartBar size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/clients', icon: <LuUsers size={18} />, label: 'Clientes' },
    { to: '/admin/transactions', icon: <LuArrowLeftRight size={18} />, label: 'Transações' },
    { to: '/admin/collaborators', icon: <LuUserCheck size={18} />, label: 'Colaboradores' },
    { to: '/admin/p2p', icon: <LuCoins size={18} />, label: 'P2P' },
    { to: '/admin/commission-rules', icon: <LuReceipt size={18} />, label: 'Comissão' },
    { to: '/admin/reports', icon: <LuFileText size={18} />, label: 'Relatórios' },
  ];

  const clientLinks = [
    { to: '/', icon: <LuTrendingUp size={18} />, label: 'Dashboard', end: true },
    { to: '/reports', icon: <LuFileText size={18} />, label: 'Relatórios' },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-name">TradeOn</div>
          <div className="brand-subtitle">{user?.name}</div>
        </div>

        {isAdmin && clients.length > 0 && (
          <div className="px-3 mb-2">
            <select
              className="filter-select w-100"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            >
              <option value="">Todos os Clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
        )}

        <Nav className="flex-column flex-grow-1 px-0 mt-2">
          {isAdmin ? (
            <>
              <div className="sidebar-section-label">Principal</div>
              <Nav.Link as={NavLink} to="/" end className="sidebar-link">
                <LuChartBar size={15} className="me-2" />
                <span className="link-text">Dashboard</span>
              </Nav.Link>

              <div className="sidebar-section-label">Gerenciar</div>
              <Nav.Link as={NavLink} to="/admin/clients" className="sidebar-link">
                <LuUsers size={15} className="me-2" />
                <span className="link-text">Clientes</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/transactions" className="sidebar-link">
                <LuArrowLeftRight size={15} className="me-2" />
                <span className="link-text">Transações</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/collaborators" className="sidebar-link">
                <LuUserCheck size={15} className="me-2" />
                <span className="link-text">Colaboradores</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/p2p" className="sidebar-link">
                <LuCoins size={15} className="me-2" />
                <span className="link-text">Operações P2P</span>
              </Nav.Link>

              <div className="sidebar-section-label">Configurações</div>
              <Nav.Link as={NavLink} to="/admin/commission-rules" className="sidebar-link">
                <LuReceipt size={15} className="me-2" />
                <span className="link-text">Regras Comissão</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/reports" className="sidebar-link">
                <LuFileText size={15} className="me-2" />
                <span className="link-text">Relatórios</span>
              </Nav.Link>
            </>
          ) : (
            <>
              <div className="sidebar-section-label">Principal</div>
              <Nav.Link as={NavLink} to="/" end className="sidebar-link">
                <LuTrendingUp size={15} className="me-2" />
                <span className="link-text">Dashboard</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/reports" className="sidebar-link">
                <LuFileText size={15} className="me-2" />
                <span className="link-text">Relatórios</span>
              </Nav.Link>
            </>
          )}
        </Nav>

        <div className="sidebar-logout">
          <Nav.Link onClick={handleLogout} className="sidebar-link">
            <LuLogOut size={15} className="me-2" />
            <span className="link-text">Sair</span>
          </Nav.Link>
        </div>
      </div>

      <nav className="mobile-bottombar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `mobile-bottombar-item ${isActive ? 'active' : ''}`
            }
          >
            {link.icon}
            <span className="mobile-bottombar-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
