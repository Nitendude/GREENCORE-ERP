import { NavLink } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useDemoConfig } from '../../store/DemoConfigContext';
import type { Permission } from '../../utils/permissions';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  permission: Permission;
  moduleId?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'bi-speedometer2', permission: 'nav.dashboard' },
  { label: 'Projects', to: '/projects', icon: 'bi-kanban', permission: 'nav.projects', moduleId: 'projects' },
  { label: 'Gantt Viewer', to: '/gantt', icon: 'bi-bar-chart-steps', permission: 'nav.gantt', moduleId: 'gantt' },
  { label: 'Bidding', to: '/bidding', icon: 'bi-briefcase', permission: 'nav.bidding', moduleId: 'bidding' },
  { label: 'Cost Database', to: '/cost-database', icon: 'bi-database', permission: 'nav.costdb', moduleId: 'cost-database' },
  { label: 'Estimates', to: '/estimates', icon: 'bi-calculator', permission: 'nav.estimates', moduleId: 'estimates' },
  { label: 'Tasks', to: '/tasks', icon: 'bi-check2-square', permission: 'nav.tasks', moduleId: 'tasks' },
  { label: 'Documents', to: '/documents', icon: 'bi-folder2-open', permission: 'nav.documents', moduleId: 'documents' },
  { label: 'CAD', to: '/cad', icon: 'bi-vector-pen', permission: 'nav.cad', moduleId: 'cad' },
  { label: 'Financials', to: '/financials', icon: 'bi-cash-coin', permission: 'nav.financials', moduleId: 'financials' },
  { label: 'Procurement', to: '/procurement', icon: 'bi-cart-check', permission: 'nav.procurement', moduleId: 'procurement' },
  { label: 'Materials', to: '/inventory', icon: 'bi-box-seam', permission: 'nav.inventory', moduleId: 'inventory' },
  { label: 'Reports', to: '/reports', icon: 'bi-bar-chart-line', permission: 'nav.reports', moduleId: 'reports' },
  { label: 'Branches', to: '/branches', icon: 'bi-diagram-3', permission: 'nav.branches', moduleId: 'branches' },
  { label: 'Access Preview', to: '/access', icon: 'bi-shield-lock', permission: 'nav.access' },
  { label: 'Demo Workshop', to: '/workshop', icon: 'bi-sliders', permission: 'nav.workshop' },
  { label: 'Users', to: '/users', icon: 'bi-people', permission: 'nav.users' },
  { label: 'Settings', to: '/settings', icon: 'bi-gear', permission: 'nav.settings' },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  const { can } = useAuth();
  const { isModuleEnabled } = useDemoConfig();
  const items = NAV_ITEMS.filter(item => can(item.permission) && (!item.moduleId || isModuleEnabled(item.moduleId)));

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? 'app-sidebar-collapsed' : ''} ${mobileOpen ? 'app-sidebar-mobile-open' : ''}`}>
        <div className="app-sidebar-brand">
          <span className="app-sidebar-brand-mark"><i className="bi bi-buildings" /></span>
          {!collapsed && <span className="app-sidebar-brand-text">Greencore ERP</span>}
        </div>
        <nav className="app-sidebar-nav" aria-label="Main navigation">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `app-sidebar-link${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      {mobileOpen && <div className="app-sidebar-backdrop" onClick={onNavigate} />}
    </>
  );
}
