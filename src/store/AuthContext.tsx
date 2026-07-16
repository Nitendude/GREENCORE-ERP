import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Role, User } from '../types';
import { USERS } from '../data/seed';
import { useData } from './DataContext';
import { getPermissions, hasPermission, type Permission } from '../utils/permissions';

const STORAGE_KEY = 'greencore-erp-current-user-v1';

interface AuthContextValue {
  currentUser: User;
  allUsers: User[];
  switchUser: (userId: string) => void;
  can: (permission: Permission) => boolean;
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// AuthProvider must be mounted inside DataProvider so the active-user list
// (allUsers) stays in sync with edits made on the Users management page.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users } = useData();
  const [userId, setUserId] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || USERS[0].id);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, userId);
  }, [userId]);

  const currentUser = users.find(u => u.id === userId) || users[0];

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    allUsers: users,
    switchUser: setUserId,
    can: (permission: Permission) => hasPermission(currentUser.role, permission),
    permissions: getPermissions(currentUser.role),
  }), [currentUser, users]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { Role };
