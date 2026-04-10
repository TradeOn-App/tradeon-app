import { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { LuChartBar, LuFileText, LuLogOut, LuUsers, LuUserCheck, LuCoins, LuArrowLeftRight, LuTrendingUp, LuChevronDown, LuPanelLeftClose, LuPanelLeftOpen } from 'react-icons/lu';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSelectedClient } from '../hooks/useSelectedClient';
import api from '../services/api';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const { setClients } = useSelectedClient();
  const [transOpen, setTransOpen] = useState(
    location.pathname.includes('/admin/transactions') || location.pathname.includes('/admin/internal-transactions')
  );
  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.includes('/admin/reports') || location.pathname.includes('/admin/internal-reports')
  );
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed);
    document.documentElement.style.setProperty('--sidebar-current-width', collapsed ? '68px' : '260px');
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-current-width', collapsed ? '68px' : '260px');
  }, []);

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
    { to: '/admin/transactions', icon: <LuArrowLeftRight size={18} />, label: 'Externas' },
    { to: '/admin/internal-transactions', icon: <LuArrowLeftRight size={18} />, label: 'Internas' },
    { to: '/admin/collaborators', icon: <LuUserCheck size={18} />, label: 'Colaboradores' },
    { to: '/admin/p2p', icon: <LuCoins size={18} />, label: 'P2P' },
    { to: '/admin/reports', icon: <LuFileText size={18} />, label: 'Rel. Externos' },
    { to: '/admin/internal-reports', icon: <LuFileText size={18} />, label: 'Rel. Internos' },
  ];

  const clientLinks = [
    { to: '/', icon: <LuTrendingUp size={18} />, label: 'Dashboard', end: true },
    { to: '/reports', icon: <LuFileText size={18} />, label: 'Relatórios' },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <>
      <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand">
          {!collapsed && <div className="brand-name">TradeOn</div>}
          {!collapsed && <div className="brand-subtitle">{user?.name}</div>}
          {collapsed && <div className="brand-name" style={{ fontSize: '0.8rem', textAlign: 'center' }}>TO</div>}
        </div>

        <Nav className="flex-column flex-grow-1 px-0 mt-2">
          {isAdmin ? (
            <>
              {!collapsed && <div className="sidebar-section-label">Principal</div>}
              <Nav.Link as={NavLink} to="/" end className="sidebar-link" title="Dashboard">
                <LuChartBar size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Dashboard</span>}
              </Nav.Link>

              {!collapsed && <div className="sidebar-section-label">Gerenciar</div>}
              <Nav.Link as={NavLink} to="/admin/clients" className="sidebar-link" title="Clientes">
                <LuUsers size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Clientes</span>}
              </Nav.Link>

              {collapsed ? (
                <>
                  <Nav.Link as={NavLink} to="/admin/transactions" className="sidebar-link" title="Trans. Externas">
                    <LuArrowLeftRight size={15} />
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/admin/internal-transactions" className="sidebar-link" title="Trans. Internas">
                    <LuArrowLeftRight size={15} />
                  </Nav.Link>
                </>
              ) : (
                <div className="sidebar-submenu-group">
                  <div className={`sidebar-link sidebar-link-toggle ${transOpen ? 'open' : ''}`} onClick={() => setTransOpen(!transOpen)}>
                    <LuArrowLeftRight size={15} className="me-2" />
                    <span className="link-text">Transações</span>
                    <LuChevronDown size={13} className={`ms-auto submenu-chevron ${transOpen ? 'rotated' : ''}`} />
                  </div>
                  {transOpen && (
                    <div className="sidebar-submenu">
                      <Nav.Link as={NavLink} to="/admin/transactions" className="sidebar-link sidebar-sublink">
                        <span className="link-text">Externas</span>
                      </Nav.Link>
                      <Nav.Link as={NavLink} to="/admin/internal-transactions" className="sidebar-link sidebar-sublink">
                        <span className="link-text">Internas</span>
                      </Nav.Link>
                    </div>
                  )}
                </div>
              )}

              <Nav.Link as={NavLink} to="/admin/collaborators" className="sidebar-link" title="Colaboradores">
                <LuUserCheck size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Colaboradores</span>}
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/p2p" className="sidebar-link" title="Operações P2P">
                <LuCoins size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Operações P2P</span>}
              </Nav.Link>

              {!collapsed && <div className="sidebar-section-label">Configurações</div>}

              {collapsed ? (
                <>
                  <Nav.Link as={NavLink} to="/admin/reports" className="sidebar-link" title="Rel. Externos">
                    <LuFileText size={15} />
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/admin/internal-reports" className="sidebar-link" title="Rel. Internos">
                    <LuFileText size={15} />
                  </Nav.Link>
                </>
              ) : (
                <div className="sidebar-submenu-group">
                  <div className={`sidebar-link sidebar-link-toggle ${reportsOpen ? 'open' : ''}`} onClick={() => setReportsOpen(!reportsOpen)}>
                    <LuFileText size={15} className="me-2" />
                    <span className="link-text">Relatórios</span>
                    <LuChevronDown size={13} className={`ms-auto submenu-chevron ${reportsOpen ? 'rotated' : ''}`} />
                  </div>
                  {reportsOpen && (
                    <div className="sidebar-submenu">
                      <Nav.Link as={NavLink} to="/admin/reports" className="sidebar-link sidebar-sublink">
                        <span className="link-text">Externos</span>
                      </Nav.Link>
                      <Nav.Link as={NavLink} to="/admin/internal-reports" className="sidebar-link sidebar-sublink">
                        <span className="link-text">Internos</span>
                      </Nav.Link>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {!collapsed && <div className="sidebar-section-label">Principal</div>}
              <Nav.Link as={NavLink} to="/" end className="sidebar-link" title="Dashboard">
                <LuTrendingUp size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Dashboard</span>}
              </Nav.Link>
              <Nav.Link as={NavLink} to="/reports" className="sidebar-link" title="Relatórios">
                <LuFileText size={15} className={collapsed ? '' : 'me-2'} />
                {!collapsed && <span className="link-text">Relatórios</span>}
              </Nav.Link>
            </>
          )}
        </Nav>

        <div className="sidebar-logout">
          <Nav.Link onClick={() => setCollapsed(!collapsed)} className="sidebar-link" title={collapsed ? 'Expandir' : 'Recolher'}>
            {collapsed ? <LuPanelLeftOpen size={15} /> : <><LuPanelLeftClose size={15} className="me-2" /><span className="link-text">Recolher</span></>}
          </Nav.Link>
          <Nav.Link onClick={handleLogout} className="sidebar-link" title="Sair">
            <LuLogOut size={15} className={collapsed ? '' : 'me-2'} />
            {!collapsed && <span className="link-text">Sair</span>}
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
