import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function Layout() {
  return (
    <div className="app-layout">
      <MobileHeader />
      <Sidebar />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
