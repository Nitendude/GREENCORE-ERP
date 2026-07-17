import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import type { Role, User, Branch } from '../types';
import { USERS } from '../data/seed';
import { useData } from './DataContext';
import { getPermissions, hasPermission, type Permission } from '../utils/permissions';

const STORAGE_KEY = 'greencore-erp-current-user-v1';
// Preview overlay is kept in sessionStorage: it survives refresh / direct-URL
// entry (so route guards apply) but clears when the tab/session ends.
const PREVIEW_ROLE_KEY = 'greencore-erp-preview-role';
const PREVIEW_BRANCH_KEY = 'greencore-erp-preview-branch';

interface AuthContextValue {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  can: (permission: Permission) => boolean;
  permissions: Permission[];

  // The role/branch actually in effect for the UI (accounts for preview overlay).
  effectiveRole: Role;
  effectiveBranch: Branch | null; // null = central system / all branches
  branches: Branch[];

  // Non-destructive "View As" preview overlay.
  previewRole: Role | null;
  previewBranchId: string | null;
  isPreviewing: boolean;
  setPreviewRole: (role: Role | null) => void;
  setPreviewBranchId: (branchId: string | null) => void;
  exitPreview: () => void;

  // Filters any branch-scoped record list down to the effective branch.
  // The central system (HQ / all branches) sees everything.
  scopeByBranch: <T extends { branchId?: string }>(items: T[]) => T[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// AuthProvider must be mounted inside DataProvider so the active-user list
// (allUsers) and branches stay in sync with edits made elsewhere.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, branches } = useData();
  const [userId, setUserId] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || USERS[0].id);
  const [previewRole, setPreviewRoleState] = useState<Role | null>(() => (sessionStorage.getItem(PREVIEW_ROLE_KEY) as Role | null) || null);
  const [previewBranchId, setPreviewBranchIdState] = useState<string | null>(() => sessionStorage.getItem(PREVIEW_BRANCH_KEY) || null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, userId);
  }, [userId]);

  const setPreviewRole = useCallback((role: Role | null) => {
    setPreviewRoleState(role);
    if (role) sessionStorage.setItem(PREVIEW_ROLE_KEY, role);
    else sessionStorage.removeItem(PREVIEW_ROLE_KEY);
  }, []);

  const setPreviewBranchId = useCallback((branchId: string | null) => {
    setPreviewBranchIdState(branchId);
    if (branchId) sessionStorage.setItem(PREVIEW_BRANCH_KEY, branchId);
    else sessionStorage.removeItem(PREVIEW_BRANCH_KEY);
  }, []);

  const currentUser = users.find(u => u.id === userId) || users[0];

  // Switching identity clears any active preview to avoid confusing overlaps.
  const switchUser = useCallback((id: string) => {
    setUserId(id);
    setPreviewRole(null);
    setPreviewBranchId(null);
  }, [setPreviewRole, setPreviewBranchId]);

  const exitPreview = useCallback(() => {
    setPreviewRole(null);
    setPreviewBranchId(null);
  }, [setPreviewRole, setPreviewBranchId]);

  const effectiveRole: Role = previewRole ?? currentUser.role;
  const previewBranch = previewBranchId ? branches.find(b => b.id === previewBranchId) ?? null : null;
  // When previewing HQ (Headquarters) the central system sees all branches.
  const effectiveBranch: Branch | null = previewBranch && previewBranch.type !== 'Headquarters' ? previewBranch : null;
  const isPreviewing = previewRole !== null || previewBranchId !== null;

  const scopeByBranch = useCallback(
    <T extends { branchId?: string }>(items: T[]): T[] => {
      if (!effectiveBranch) return items; // central / HQ view sees everything
      return items.filter(item => item.branchId === effectiveBranch.id);
    },
    [effectiveBranch],
  );

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    allUsers: users,
    switchUser,
    can: (permission: Permission) => hasPermission(effectiveRole, permission),
    permissions: getPermissions(effectiveRole),
    effectiveRole,
    effectiveBranch,
    branches,
    previewRole,
    previewBranchId,
    isPreviewing,
    setPreviewRole,
    setPreviewBranchId,
    exitPreview,
    scopeByBranch,
  }), [currentUser, users, switchUser, effectiveRole, effectiveBranch, branches, previewRole, previewBranchId, isPreviewing, exitPreview, scopeByBranch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { Role };
