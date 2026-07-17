import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PreviewBanner from './PreviewBanner';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className="app-shell-main">
        <Topbar
          onToggleSidebar={() => setCollapsed(c => !c)}
          onToggleMobileSidebar={() => setMobileOpen(o => !o)}
        />
        <PreviewBanner />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
