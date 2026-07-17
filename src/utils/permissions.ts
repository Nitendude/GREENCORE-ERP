import type { Role } from '../types';

export type Permission =
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.financials.view'
  | 'bidding.view'
  | 'bidding.manage'
  | 'bidding.estimate.edit'
  | 'bidding.approve'
  | 'bidding.convert'
  | 'documents.upload'
  | 'documents.delete'
  | 'cad.upload'
  | 'procurement.view'
  | 'procurement.manage'
  | 'inventory.view'
  | 'users.manage'
  | 'settings.manage'
  | 'reports.export'
  | 'branches.manage'
  | 'nav.dashboard'
  | 'nav.projects'
  | 'nav.gantt'
  | 'nav.bidding'
  | 'nav.tasks'
  | 'nav.documents'
  | 'nav.cad'
  | 'nav.financials'
  | 'nav.procurement'
  | 'nav.inventory'
  | 'nav.reports'
  | 'nav.branches'
  | 'nav.access'
  | 'nav.users'
  | 'nav.settings';

const ALL_NAV: Permission[] = [
  'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.bidding', 'nav.tasks', 'nav.documents', 'nav.cad',
  'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports', 'nav.branches', 'nav.access',
  'nav.users', 'nav.settings',
];

const matrix: Record<Role, Permission[]> = {
  Administrator: [
    ...ALL_NAV,
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'bidding.manage', 'bidding.estimate.edit', 'bidding.approve', 'bidding.convert',
    'documents.upload', 'documents.delete', 'cad.upload', 'procurement.view', 'procurement.manage',
    'inventory.view', 'users.manage', 'settings.manage', 'reports.export', 'branches.manage',
  ],
  Management: [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.bidding', 'nav.tasks', 'nav.documents', 'nav.cad',
    'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports', 'nav.branches', 'nav.access', 'nav.users',
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'bidding.manage', 'bidding.approve', 'bidding.convert',
    'documents.upload', 'procurement.view', 'inventory.view', 'reports.export', 'branches.manage',
  ],
  'Project Manager': [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.bidding', 'nav.tasks', 'nav.documents', 'nav.cad',
    'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports',
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'documents.upload', 'documents.delete', 'cad.upload', 'procurement.view',
    'procurement.manage', 'inventory.view', 'reports.export',
  ],
  'Bidding Manager': [
    'nav.dashboard', 'nav.bidding', 'nav.tasks', 'nav.documents', 'nav.reports',
    'projects.view', 'bidding.view', 'bidding.manage', 'bidding.estimate.edit',
    'bidding.approve', 'bidding.convert', 'documents.upload', 'documents.delete', 'reports.export',
  ],
  Estimator: [
    'nav.dashboard', 'nav.bidding', 'nav.documents', 'nav.reports',
    'bidding.view', 'bidding.estimate.edit', 'documents.upload',
  ],
  Finance: [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.bidding', 'nav.financials', 'nav.reports',
    'projects.view', 'projects.financials.view', 'bidding.view', 'reports.export',
  ],
  Procurement: [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.procurement', 'nav.inventory', 'nav.reports',
    'projects.view', 'procurement.view', 'procurement.manage', 'inventory.view', 'reports.export',
  ],
  'Project Staff': [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.tasks', 'nav.documents', 'nav.cad',
    'projects.view', 'documents.upload', 'cad.upload',
  ],
  Viewer: [
    'nav.dashboard', 'nav.projects', 'nav.gantt', 'nav.bidding', 'nav.reports',
    'projects.view', 'bidding.view',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return matrix[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return matrix[role] ?? [];
}

export const ALL_ROLES: Role[] = [
  'Administrator', 'Management', 'Project Manager', 'Bidding Manager',
  'Estimator', 'Finance', 'Procurement', 'Project Staff', 'Viewer',
];

// Data-driven catalog used by the Access Preview page to render the
// role × permission matrix. Grouped for readability.
export const PERMISSION_CATALOG: { group: string; icon: string; items: { key: Permission; label: string }[] }[] = [
  {
    group: 'Module Access (Navigation)', icon: 'bi-grid',
    items: [
      { key: 'nav.dashboard', label: 'Dashboard' },
      { key: 'nav.projects', label: 'Projects' },
      { key: 'nav.gantt', label: 'Gantt Viewer' },
      { key: 'nav.bidding', label: 'Bidding' },
      { key: 'nav.tasks', label: 'Tasks' },
      { key: 'nav.documents', label: 'Documents' },
      { key: 'nav.cad', label: 'CAD Workspace' },
      { key: 'nav.financials', label: 'Financials' },
      { key: 'nav.procurement', label: 'Procurement' },
      { key: 'nav.inventory', label: 'Materials' },
      { key: 'nav.reports', label: 'Reports' },
      { key: 'nav.branches', label: 'Branches' },
      { key: 'nav.access', label: 'Access Preview' },
      { key: 'nav.users', label: 'Users' },
      { key: 'nav.settings', label: 'Settings' },
    ],
  },
  {
    group: 'Projects & Financials', icon: 'bi-kanban',
    items: [
      { key: 'projects.view', label: 'View projects' },
      { key: 'projects.create', label: 'Create projects' },
      { key: 'projects.edit', label: 'Edit projects' },
      { key: 'projects.financials.view', label: 'View financial data' },
    ],
  },
  {
    group: 'Bidding', icon: 'bi-briefcase',
    items: [
      { key: 'bidding.view', label: 'View bids' },
      { key: 'bidding.manage', label: 'Manage bids' },
      { key: 'bidding.estimate.edit', label: 'Edit cost estimates' },
      { key: 'bidding.approve', label: 'Approve bids' },
      { key: 'bidding.convert', label: 'Convert bid to project' },
    ],
  },
  {
    group: 'Documents, CAD & Operations', icon: 'bi-folder2-open',
    items: [
      { key: 'documents.upload', label: 'Upload documents' },
      { key: 'documents.delete', label: 'Delete documents' },
      { key: 'cad.upload', label: 'Upload CAD drawings' },
      { key: 'procurement.view', label: 'View procurement' },
      { key: 'procurement.manage', label: 'Manage procurement' },
      { key: 'inventory.view', label: 'View materials' },
      { key: 'reports.export', label: 'Export reports' },
    ],
  },
  {
    group: 'Administration', icon: 'bi-shield-lock',
    items: [
      { key: 'branches.manage', label: 'Manage branches' },
      { key: 'users.manage', label: 'Manage users' },
      { key: 'settings.manage', label: 'Manage settings' },
    ],
  },
];
