import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface DemoModule {
  id: string;
  label: string;
  description: string;
  icon: string;
  locked?: boolean;
}

export interface FeatureRequest {
  id: string;
  title: string;
  moduleId: string;
  notes: string;
  status: 'Requested' | 'In review' | 'Accepted';
  createdAt: string;
}

export const DEMO_MODULES: DemoModule[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Portfolio summary and operational alerts.', icon: 'bi-speedometer2', locked: true },
  { id: 'projects', label: 'Projects', description: 'Project records, progress, phases, and client sharing.', icon: 'bi-kanban' },
  { id: 'gantt', label: 'Gantt Viewer', description: 'Cross-project planning and schedule visibility.', icon: 'bi-bar-chart-steps' },
  { id: 'bidding', label: 'Bidding', description: 'Bid pipeline, estimates, approvals, and conversion.', icon: 'bi-briefcase' },
  { id: 'cost-database', label: 'Cost Database', description: 'Materials, labor, equipment, and productivity rates.', icon: 'bi-database' },
  { id: 'estimates', label: 'Estimates', description: 'BOQ-based estimates and quotation workflow.', icon: 'bi-calculator' },
  { id: 'tasks', label: 'Tasks', description: 'Assignments, due dates, priorities, and status tracking.', icon: 'bi-check2-square' },
  { id: 'documents', label: 'Documents', description: 'Project files, versions, and approvals.', icon: 'bi-folder2-open' },
  { id: 'cad', label: 'CAD Workspace', description: 'Drawing review, markups, and client submissions.', icon: 'bi-vector-pen' },
  { id: 'financials', label: 'Financials', description: 'Budgets, commitments, billing, and change orders.', icon: 'bi-cash-coin' },
  { id: 'procurement', label: 'Procurement', description: 'Purchase orders and supplier workflow.', icon: 'bi-cart-check' },
  { id: 'inventory', label: 'Materials', description: 'Material availability and stock monitoring.', icon: 'bi-box-seam' },
  { id: 'reports', label: 'Reports', description: 'Management views and exportable summaries.', icon: 'bi-bar-chart-line' },
  { id: 'branches', label: 'Branches', description: 'Branch-level records and operating scope.', icon: 'bi-diagram-3' },
];

const STORAGE_KEY = 'greencore-demo-config-v1';

interface StoredConfig {
  enabledModules: Record<string, boolean>;
  featureRequests: FeatureRequest[];
}

interface DemoConfigContextValue extends StoredConfig {
  isModuleEnabled: (id: string) => boolean;
  setModuleEnabled: (id: string, enabled: boolean) => void;
  addFeatureRequest: (request: Omit<FeatureRequest, 'id' | 'createdAt'>) => void;
  updateFeatureRequest: (id: string, patch: Partial<FeatureRequest>) => void;
  removeFeatureRequest: (id: string) => void;
  resetWorkshop: () => void;
}

const defaultConfig = (): StoredConfig => ({
  enabledModules: Object.fromEntries(DEMO_MODULES.map(module => [module.id, true])),
  featureRequests: [],
});

function loadConfig(): StoredConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Partial<StoredConfig>;
    const defaults = defaultConfig();
    return {
      enabledModules: { ...defaults.enabledModules, ...(saved.enabledModules ?? {}) },
      featureRequests: Array.isArray(saved.featureRequests) ? saved.featureRequests : [],
    };
  } catch {
    return defaultConfig();
  }
}

const DemoConfigContext = createContext<DemoConfigContextValue | undefined>(undefined);

export function DemoConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoredConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const setModuleEnabled = useCallback((id: string, enabled: boolean) => {
    const module = DEMO_MODULES.find(item => item.id === id);
    if (!module || module.locked) return;
    setConfig(previous => ({
      ...previous,
      enabledModules: { ...previous.enabledModules, [id]: enabled },
    }));
  }, []);

  const addFeatureRequest = useCallback((request: Omit<FeatureRequest, 'id' | 'createdAt'>) => {
    setConfig(previous => ({
      ...previous,
      featureRequests: [
        {
          ...request,
          id: `feature-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
        },
        ...previous.featureRequests,
      ],
    }));
  }, []);

  const updateFeatureRequest = useCallback((id: string, patch: Partial<FeatureRequest>) => {
    setConfig(previous => ({
      ...previous,
      featureRequests: previous.featureRequests.map(request => request.id === id ? { ...request, ...patch } : request),
    }));
  }, []);

  const removeFeatureRequest = useCallback((id: string) => {
    setConfig(previous => ({
      ...previous,
      featureRequests: previous.featureRequests.filter(request => request.id !== id),
    }));
  }, []);

  const resetWorkshop = useCallback(() => setConfig(defaultConfig()), []);

  const value = useMemo<DemoConfigContextValue>(() => ({
    ...config,
    isModuleEnabled: id => config.enabledModules[id] !== false,
    setModuleEnabled,
    addFeatureRequest,
    updateFeatureRequest,
    removeFeatureRequest,
    resetWorkshop,
  }), [config, setModuleEnabled, addFeatureRequest, updateFeatureRequest, removeFeatureRequest, resetWorkshop]);

  return <DemoConfigContext.Provider value={value}>{children}</DemoConfigContext.Provider>;
}

export function useDemoConfig(): DemoConfigContextValue {
  const context = useContext(DemoConfigContext);
  if (!context) throw new Error('useDemoConfig must be used within DemoConfigProvider');
  return context;
}
