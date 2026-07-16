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
  | 'procurement.view'
  | 'procurement.manage'
  | 'inventory.view'
  | 'users.manage'
  | 'settings.manage'
  | 'reports.export'
  | 'nav.dashboard'
  | 'nav.projects'
  | 'nav.bidding'
  | 'nav.tasks'
  | 'nav.documents'
  | 'nav.financials'
  | 'nav.procurement'
  | 'nav.inventory'
  | 'nav.reports'
  | 'nav.users'
  | 'nav.settings';

const ALL_NAV: Permission[] = [
  'nav.dashboard', 'nav.projects', 'nav.bidding', 'nav.tasks', 'nav.documents',
  'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports', 'nav.users', 'nav.settings',
];

const matrix: Record<Role, Permission[]> = {
  Administrator: [
    ...ALL_NAV,
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'bidding.manage', 'bidding.estimate.edit', 'bidding.approve', 'bidding.convert',
    'documents.upload', 'documents.delete', 'procurement.view', 'procurement.manage',
    'inventory.view', 'users.manage', 'settings.manage', 'reports.export',
  ],
  Management: [
    'nav.dashboard', 'nav.projects', 'nav.bidding', 'nav.tasks', 'nav.documents',
    'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports', 'nav.users',
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'bidding.manage', 'bidding.approve', 'bidding.convert',
    'documents.upload', 'procurement.view', 'inventory.view', 'reports.export',
  ],
  'Project Manager': [
    'nav.dashboard', 'nav.projects', 'nav.bidding', 'nav.tasks', 'nav.documents',
    'nav.financials', 'nav.procurement', 'nav.inventory', 'nav.reports',
    'projects.view', 'projects.create', 'projects.edit', 'projects.financials.view',
    'bidding.view', 'documents.upload', 'documents.delete', 'procurement.view',
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
    'nav.dashboard', 'nav.projects', 'nav.bidding', 'nav.financials', 'nav.reports',
    'projects.view', 'projects.financials.view', 'bidding.view', 'reports.export',
  ],
  Procurement: [
    'nav.dashboard', 'nav.projects', 'nav.procurement', 'nav.inventory', 'nav.reports',
    'projects.view', 'procurement.view', 'procurement.manage', 'inventory.view', 'reports.export',
  ],
  'Project Staff': [
    'nav.dashboard', 'nav.projects', 'nav.tasks', 'nav.documents',
    'projects.view', 'documents.upload',
  ],
  Viewer: [
    'nav.dashboard', 'nav.projects', 'nav.bidding', 'nav.reports',
    'projects.view', 'bidding.view',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return matrix[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return matrix[role] ?? [];
}
