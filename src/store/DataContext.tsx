import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  Project, Bid, User, Branch, ProjectTask, ProjectDocument, CadFile, PurchaseOrder, MaterialItem,
  IssueRisk, DailyLog, Notification, AuditEntry, StatusHistoryEntry, ProjectStatus, BidStage, ID,
} from '../types';
import { seedDatabase, genId } from '../data/seed';

// v3 introduces branches + branchId scoping; older payloads are reseeded so
// every record carries a branch assignment.
const STORAGE_KEY = 'greencore-erp-db-v3';
const LEGACY_STORAGE_KEYS: string[] = [];

interface DB {
  users: User[];
  branches: Branch[];
  projects: Project[];
  bids: Bid[];
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  cadFiles: CadFile[];
  purchaseOrders: PurchaseOrder[];
  materials: MaterialItem[];
  issues: IssueRisk[];
  dailyLogs: DailyLog[];
  notifications: Notification[];
  auditLog: AuditEntry[];
}

function loadDB(): DB {
  const seed = seedDatabase();
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const saved = JSON.parse(raw) as Partial<DB>;
      return {
        users: Array.isArray(saved.users) ? saved.users : seed.users,
        branches: Array.isArray(saved.branches) ? saved.branches : seed.branches,
        projects: Array.isArray(saved.projects) ? saved.projects : seed.projects,
        bids: Array.isArray(saved.bids) ? saved.bids : seed.bids,
        tasks: Array.isArray(saved.tasks) ? saved.tasks : seed.tasks,
        documents: Array.isArray(saved.documents) ? saved.documents : seed.documents,
        cadFiles: Array.isArray(saved.cadFiles) ? saved.cadFiles.map(file => {
          const seededFile = seed.cadFiles.find(seedFile => seedFile.id === file.id);
          if (!seededFile) return file;
          return {
            ...file,
            sheet: file.sheet ?? seededFile.sheet,
            units: file.units ?? seededFile.units,
            reviewStatus: file.reviewStatus ?? seededFile.reviewStatus,
            submissionTarget: file.submissionTarget ?? seededFile.submissionTarget,
            submittedAt: file.submittedAt ?? seededFile.submittedAt,
            submittedBy: file.submittedBy ?? seededFile.submittedBy,
            threads: file.threads ?? seededFile.threads,
            markups: file.markups ?? seededFile.markups,
            reviewHistory: file.reviewHistory ?? seededFile.reviewHistory,
          };
        }) : seed.cadFiles,
        purchaseOrders: Array.isArray(saved.purchaseOrders) ? saved.purchaseOrders : seed.purchaseOrders,
        materials: Array.isArray(saved.materials) ? saved.materials : seed.materials,
        issues: Array.isArray(saved.issues) ? saved.issues : seed.issues,
        dailyLogs: Array.isArray(saved.dailyLogs) ? saved.dailyLogs : seed.dailyLogs,
        notifications: Array.isArray(saved.notifications) ? saved.notifications : seed.notifications,
        auditLog: Array.isArray(saved.auditLog) ? saved.auditLog : seed.auditLog,
      };
    } catch {
      // Try the next stored version, then fall back to seed data.
    }
  }
  return seed;
}

interface DataContextValue extends DB {
  updateProject: (id: ID, patch: Partial<Project>, user: string) => void;
  changeProjectStatus: (id: ID, newStatus: ProjectStatus, user: string, reason: string) => void;
  createProject: (project: Project) => void;
  updateBid: (id: ID, patch: Partial<Bid>, user: string) => void;
  changeBidStage: (id: ID, newStage: BidStage, user: string, reason?: string) => void;
  createBid: (bid: Bid) => void;
  convertBidToProject: (bidId: ID, user: string) => Project | null;
  addTask: (task: ProjectTask) => void;
  updateTask: (id: ID, patch: Partial<ProjectTask>) => void;
  addDocument: (doc: ProjectDocument) => void;
  addCadFile: (file: CadFile) => void;
  updateCadFile: (id: ID, patch: Partial<CadFile>) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: ID, patch: Partial<PurchaseOrder>) => void;
  addIssue: (issue: IssueRisk) => void;
  updateIssue: (id: ID, patch: Partial<IssueRisk>) => void;
  addDailyLog: (log: DailyLog) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
  logAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  resetToSeed: () => void;
  addUser: (user: User) => void;
  updateUser: (id: ID, patch: Partial<User>) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: ID, patch: Partial<Branch>) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const logAudit = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    setDb(prev => ({
      ...prev,
      auditLog: [{ ...entry, id: genId('aud'), timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const updateProject = useCallback((id: ID, patch: Partial<Project>, user: string) => {
    setDb(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p),
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: id, action: 'Project details updated', user, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const changeProjectStatus = useCallback((id: ID, newStatus: ProjectStatus, user: string, reason: string) => {
    setDb(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== id) return p;
        const historyEntry: StatusHistoryEntry = {
          id: genId('sh'), previousStatus: p.status, newStatus, updatedBy: user, timestamp: new Date().toISOString(), reason,
        };
        return { ...p, status: newStatus, statusHistory: [historyEntry, ...p.statusHistory], updatedAt: new Date().toISOString() };
      }),
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: id, action: `Status changed to ${newStatus}`, user, timestamp: new Date().toISOString(), newValue: newStatus }, ...prev.auditLog],
    }));
  }, []);

  const createProject = useCallback((project: Project) => {
    setDb(prev => ({
      ...prev,
      projects: [project, ...prev.projects],
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: project.id, action: 'Project created', user: project.createdBy, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const updateBid = useCallback((id: ID, patch: Partial<Bid>, user: string) => {
    setDb(prev => ({
      ...prev,
      bids: prev.bids.map(b => b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b),
      auditLog: [{ id: genId('aud'), entityType: 'bid', entityId: id, action: 'Bid details updated', user, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const changeBidStage = useCallback((id: ID, newStage: BidStage, user: string, reason?: string) => {
    setDb(prev => ({
      ...prev,
      bids: prev.bids.map(b => {
        if (b.id !== id) return b;
        const historyEntry: StatusHistoryEntry = {
          id: genId('sh'), previousStatus: b.stage, newStatus: newStage, updatedBy: user, timestamp: new Date().toISOString(), reason,
        };
        return { ...b, stage: newStage, stageHistory: [historyEntry, ...b.stageHistory], updatedAt: new Date().toISOString() };
      }),
      auditLog: [{ id: genId('aud'), entityType: 'bid', entityId: id, action: `Stage changed to ${newStage}`, user, timestamp: new Date().toISOString(), newValue: newStage }, ...prev.auditLog],
    }));
  }, []);

  const createBid = useCallback((bid: Bid) => {
    setDb(prev => ({
      ...prev,
      bids: [bid, ...prev.bids],
      auditLog: [{ id: genId('aud'), entityType: 'bid', entityId: bid.id, action: 'Bid opportunity created', user: bid.createdBy, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const convertBidToProject = useCallback((bidId: ID, user: string): Project | null => {
    let created: Project | null = null;
    setDb(prev => {
      const bid = prev.bids.find(b => b.id === bidId);
      if (!bid || bid.convertedProjectId) return prev;
      const newProjectId = genId('p');
      const proposedPrice = bid.costEstimates.length
        ? bid.costEstimates[bid.costEstimates.length - 1].proposedPrice
        : bid.estimatedValue;
      const contractValue = bid.result?.winningAmount ?? bid.result?.finalAmount ?? proposedPrice;
      const now = new Date().toISOString();
      const startDate = new Date();
      const targetDate = new Date(startDate);
      targetDate.setFullYear(targetDate.getFullYear() + 1);
      const project: Project = {
        id: newProjectId,
        code: `GB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
        name: bid.title,
        client: bid.client,
        clientContact: bid.clientContact,
        location: bid.location,
        description: bid.description,
        scope: bid.description,
        projectManager: user,
        status: 'Planning',
        priority: 'Medium',
        startDate: startDate.toISOString().slice(0, 10),
        targetCompletionDate: targetDate.toISOString().slice(0, 10),
        currentPhase: 'Pre-Construction',
        progress: 0,
        contractValue,
        health: { cost: 'Good', schedule: 'Good', quality: 'Good', safety: 'Good' },
        phases: [],
        milestones: [],
        contacts: [],
        financials: {
          contractValue, approvedBudget: contractValue * 0.95, committedCost: 0, actualExpenses: 0,
          billed: 0, paymentsReceived: 0, retentionPct: 10, changeOrders: [],
        },
        statusHistory: [{ id: genId('sh'), previousStatus: 'Lead / Opportunity', newStatus: 'Planning', updatedBy: user, timestamp: now, reason: `Converted from awarded bid ${bid.reference}` }],
        blockers: [],
        createdAt: now, updatedAt: now, createdBy: user, archived: false,
        sourceBidId: bid.id,
      };
      created = project;
      return {
        ...prev,
        projects: [project, ...prev.projects],
        bids: prev.bids.map(b => b.id === bidId ? { ...b, convertedProjectId: newProjectId, convertedBy: user, convertedAt: now } : b),
        auditLog: [
          { id: genId('aud'), entityType: 'project', entityId: newProjectId, action: `Project created by converting bid ${bid.reference}`, user, timestamp: now, relatedRecord: bid.id },
          { id: genId('aud'), entityType: 'bid', entityId: bid.id, action: `Bid converted to project ${project.code}`, user, timestamp: now, relatedRecord: newProjectId },
          ...prev.auditLog,
        ],
      };
    });
    return created;
  }, []);

  const addTask = useCallback((task: ProjectTask) => {
    setDb(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
  }, []);
  const updateTask = useCallback((id: ID, patch: Partial<ProjectTask>) => {
    setDb(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...patch } : t) }));
  }, []);
  const addDocument = useCallback((doc: ProjectDocument) => {
    setDb(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
  }, []);
  const addCadFile = useCallback((file: CadFile) => {
    setDb(prev => ({ ...prev, cadFiles: [file, ...prev.cadFiles] }));
  }, []);
  const updateCadFile = useCallback((id: ID, patch: Partial<CadFile>) => {
    setDb(prev => ({ ...prev, cadFiles: prev.cadFiles.map(f => f.id === id ? { ...f, ...patch } : f) }));
  }, []);
  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setDb(prev => ({ ...prev, purchaseOrders: [po, ...prev.purchaseOrders] }));
  }, []);
  const updatePurchaseOrder = useCallback((id: ID, patch: Partial<PurchaseOrder>) => {
    setDb(prev => ({ ...prev, purchaseOrders: prev.purchaseOrders.map(p => p.id === id ? { ...p, ...patch } : p) }));
  }, []);
  const addIssue = useCallback((issue: IssueRisk) => {
    setDb(prev => ({ ...prev, issues: [issue, ...prev.issues] }));
  }, []);
  const updateIssue = useCallback((id: ID, patch: Partial<IssueRisk>) => {
    setDb(prev => ({ ...prev, issues: prev.issues.map(i => i.id === id ? { ...i, ...patch } : i) }));
  }, []);
  const addDailyLog = useCallback((log: DailyLog) => {
    setDb(prev => ({ ...prev, dailyLogs: [log, ...prev.dailyLogs] }));
  }, []);
  const markNotificationRead = useCallback((id: ID) => {
    setDb(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setDb(prev => ({ ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  }, []);
  const resetToSeed = useCallback(() => {
    setDb(seedDatabase());
  }, []);

  const addUser = useCallback((user: User) => {
    setDb(prev => ({
      ...prev,
      users: [...prev.users, user],
      auditLog: [{ id: genId('aud'), entityType: 'user', entityId: user.id, action: `User ${user.name} added with role ${user.role}`, user: user.name, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const updateUser = useCallback((id: ID, patch: Partial<User>) => {
    setDb(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...patch } : u) }));
  }, []);

  const addBranch = useCallback((branch: Branch) => {
    setDb(prev => ({
      ...prev,
      branches: [...prev.branches, branch],
      auditLog: [{ id: genId('aud'), entityType: 'branch', entityId: branch.id, action: `Branch ${branch.name} (${branch.code}) added to the central system`, user: branch.createdBy, timestamp: new Date().toISOString() }, ...prev.auditLog],
    }));
  }, []);

  const updateBranch = useCallback((id: ID, patch: Partial<Branch>) => {
    setDb(prev => ({ ...prev, branches: prev.branches.map(b => b.id === id ? { ...b, ...patch } : b) }));
  }, []);

  const value = useMemo<DataContextValue>(() => ({
    ...db,
    updateProject, changeProjectStatus, createProject,
    updateBid, changeBidStage, createBid, convertBidToProject,
    addTask, updateTask, addDocument, addCadFile, updateCadFile, addPurchaseOrder, updatePurchaseOrder,
    addIssue, updateIssue, addDailyLog,
    markNotificationRead, markAllNotificationsRead, logAudit, resetToSeed,
    addUser, updateUser, addBranch, updateBranch,
  }), [db, updateProject, changeProjectStatus, createProject, updateBid, changeBidStage, createBid,
      convertBidToProject, addTask, updateTask, addDocument, addCadFile, updateCadFile, addPurchaseOrder, updatePurchaseOrder,
      addIssue, updateIssue, addDailyLog, markNotificationRead, markAllNotificationsRead, logAudit, resetToSeed,
      addUser, updateUser, addBranch, updateBranch]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
