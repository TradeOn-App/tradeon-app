import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import PwaInstallBanner from './PwaInstallBanner';

export default function Layout() {
  return (
    <div className="app-layout">
      <PwaInstallBanner />
      <MobileHeader />
      <Sidebar />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
