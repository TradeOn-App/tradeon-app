import { Nav } from 'react-bootstrap';
import { BarChartFill, FileEarmarkTextFill, BoxArrowRight, PeopleFill, PersonBadgeFill, CashCoin, ArrowLeftRight, Receipt, GraphUpArrow } from 'react-bootstrap-icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/', icon: <BarChartFill size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/clients', icon: <PeopleFill size={18} />, label: 'Clientes' },
    { to: '/admin/transactions', icon: <ArrowLeftRight size={18} />, label: 'Transações' },
    { to: '/admin/collaborators', icon: <PersonBadgeFill size={18} />, label: 'Colaboradores' },
    { to: '/admin/p2p', icon: <CashCoin size={18} />, label: 'P2P' },
    { to: '/admin/commission-rules', icon: <Receipt size={18} />, label: 'Comissão' },
    { to: '/admin/reports', icon: <FileEarmarkTextFill size={18} />, label: 'Relatórios' },
  ];

  const clientLinks = [
    { to: '/', icon: <GraphUpArrow size={18} />, label: 'Dashboard', end: true },
    { to: '/reports', icon: <FileEarmarkTextFill size={18} />, label: 'Relatórios' },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-name">TradeOn</div>
          <div className="brand-subtitle">{user?.name}</div>
        </div>

        <Nav className="flex-column flex-grow-1 px-0 mt-2">
          {isAdmin ? (
            <>
              <div className="sidebar-section-label">Principal</div>
              <Nav.Link as={NavLink} to="/" end className="sidebar-link">
                <BarChartFill size={15} className="me-2" />
                <span className="link-text">Dashboard</span>
              </Nav.Link>

              <div className="sidebar-section-label">Gerenciar</div>
              <Nav.Link as={NavLink} to="/admin/clients" className="sidebar-link">
                <PeopleFill size={15} className="me-2" />
                <span className="link-text">Clientes</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/transactions" className="sidebar-link">
                <ArrowLeftRight size={15} className="me-2" />
                <span className="link-text">Transações</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/collaborators" className="sidebar-link">
                <PersonBadgeFill size={15} className="me-2" />
                <span className="link-text">Colaboradores</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/p2p" className="sidebar-link">
                <CashCoin size={15} className="me-2" />
                <span className="link-text">Operações P2P</span>
              </Nav.Link>

              <div className="sidebar-section-label">Configurações</div>
              <Nav.Link as={NavLink} to="/admin/commission-rules" className="sidebar-link">
                <Receipt size={15} className="me-2" />
                <span className="link-text">Regras Comissão</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/reports" className="sidebar-link">
                <FileEarmarkTextFill size={15} className="me-2" />
                <span className="link-text">Relatórios</span>
              </Nav.Link>
            </>
          ) : (
            <>
              <div className="sidebar-section-label">Principal</div>
              <Nav.Link as={NavLink} to="/" end className="sidebar-link">
                <GraphUpArrow size={15} className="me-2" />
                <span className="link-text">Dashboard</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/reports" className="sidebar-link">
                <FileEarmarkTextFill size={15} className="me-2" />
                <span className="link-text">Relatórios</span>
              </Nav.Link>
            </>
          )}
        </Nav>

        <div className="sidebar-logout">
          <Nav.Link onClick={handleLogout} className="sidebar-link">
            <BoxArrowRight size={15} className="me-2" />
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
