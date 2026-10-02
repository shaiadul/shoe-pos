import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isPOS = location.pathname === '/pos';

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={false} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className={`flex-1 min-w-0 ${isPOS ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
