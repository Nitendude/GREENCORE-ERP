import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  Project, Bid, User, Branch, ProjectTask, ProjectDocument, CadFile, PurchaseOrder, MaterialItem,
  IssueRisk, DailyLog, Notification, AuditEntry, StatusHistoryEntry, ProjectStatus, BidStage, ID, Phase,
  CostMaterial, LaborRate, EquipmentRate, ProductivityRate, CompositionTemplate, Estimate, QuotationStatus,
} from '../types';
import { seedDatabase, genId } from '../data/seed';

// v4 introduces the estimation module (cost DB, composition templates, estimates).
const STORAGE_KEY = 'greencore-erp-db-v4';
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
  costMaterials: CostMaterial[];
  laborRates: LaborRate[];
  equipmentRates: EquipmentRate[];
  productivityRates: ProductivityRate[];
  compositionTemplates: CompositionTemplate[];
  estimates: Estimate[];
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
        costMaterials: Array.isArray(saved.costMaterials) ? saved.costMaterials : seed.costMaterials,
        laborRates: Array.isArray(saved.laborRates) ? saved.laborRates : seed.laborRates,
        equipmentRates: Array.isArray(saved.equipmentRates) ? saved.equipmentRates : seed.equipmentRates,
        productivityRates: Array.isArray(saved.productivityRates) ? saved.productivityRates : seed.productivityRates,
        compositionTemplates: Array.isArray(saved.compositionTemplates) ? saved.compositionTemplates : seed.compositionTemplates,
        estimates: Array.isArray(saved.estimates) ? saved.estimates : seed.estimates,
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
  updatePhaseStatus: (projectId: ID, phaseId: ID, newStatus: Phase['status'], user: string) => void;
  addPhase: (projectId: ID, phase: Phase, user: string) => void;
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
  // Estimation module
  addCostMaterial: (m: CostMaterial) => void;
  updateCostMaterial: (id: ID, patch: Partial<CostMaterial>) => void;
  updateCostMaterialPrice: (id: ID, unitCost: number, supplier: string, note: string, user: string) => void;
  bulkAdjustMaterialPrices: (pct: number, user: string) => void;
  addLaborRate: (r: LaborRate) => void;
  updateLaborRate: (id: ID, patch: Partial<LaborRate>) => void;
  addEquipmentRate: (r: EquipmentRate) => void;
  updateEquipmentRate: (id: ID, patch: Partial<EquipmentRate>) => void;
  addProductivityRate: (r: ProductivityRate) => void;
  updateProductivityRate: (id: ID, patch: Partial<ProductivityRate>) => void;
  addEstimate: (e: Estimate) => void;
  updateEstimate: (id: ID, patch: Partial<Estimate>) => void;
  changeEstimateStatus: (id: ID, status: QuotationStatus, user: string) => void;
  convertEstimateToProject: (estimateId: ID, user: string) => Project | null;
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

  const updatePhaseStatus = useCallback((projectId: ID, phaseId: ID, newStatus: Phase['status'], user: string) => {
    setDb(prev => {
      const today = new Date().toISOString().slice(0, 10);
      let previousStatus = '';
      let phaseName = '';
      const projects = prev.projects.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: p.phases.map(ph => {
            if (ph.id !== phaseId) return ph;
            previousStatus = ph.status;
            phaseName = ph.name;
            const patch: Partial<Phase> = { status: newStatus };
            if (newStatus === 'Completed') {
              patch.progress = 100;
              patch.actualEnd = ph.actualEnd || today;
              if (!ph.actualStart) patch.actualStart = today;
            } else if (newStatus === 'In Progress' && !ph.actualStart) {
              patch.actualStart = today;
            }
            return { ...ph, ...patch };
          }),
          updatedAt: new Date().toISOString(),
        };
      });
      return {
        ...prev,
        projects,
        auditLog: [{ id: genId('aud'), entityType: 'project', entityId: projectId, action: `Phase "${phaseName}" status changed from ${previousStatus} to ${newStatus}`, user, timestamp: new Date().toISOString(), previousValue: previousStatus, newValue: newStatus }, ...prev.auditLog],
      };
    });
  }, []);

  const addPhase = useCallback((projectId: ID, phase: Phase, user: string) => {
    setDb(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, phases: [...p.phases, phase], updatedAt: new Date().toISOString() } : p),
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: projectId, action: `Phase "${phase.name}" added with status ${phase.status}`, user, timestamp: new Date().toISOString(), newValue: phase.status }, ...prev.auditLog],
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

  // ---------- Estimation module ----------
  const nowStr = () => new Date().toISOString();
  const today = () => nowStr().slice(0, 10);

  const addCostMaterial = useCallback((m: CostMaterial) => {
    setDb(prev => ({ ...prev, costMaterials: [m, ...prev.costMaterials] }));
  }, []);
  const updateCostMaterial = useCallback((id: ID, patch: Partial<CostMaterial>) => {
    setDb(prev => ({ ...prev, costMaterials: prev.costMaterials.map(m => m.id === id ? { ...m, ...patch, updatedAt: nowStr() } : m) }));
  }, []);
  const updateCostMaterialPrice = useCallback((id: ID, unitCost: number, supplier: string, note: string, user: string) => {
    setDb(prev => ({
      ...prev,
      costMaterials: prev.costMaterials.map(m => m.id === id ? {
        ...m, unitCost, supplier, updatedAt: nowStr(),
        priceHistory: [...m.priceHistory, { date: today(), unitCost, supplier, note: note || undefined }],
      } : m),
      auditLog: [{ id: genId('aud'), entityType: 'user', entityId: id, action: `Updated price of ${prev.costMaterials.find(m => m.id === id)?.name ?? 'material'} to ${unitCost}`, user, timestamp: nowStr() }, ...prev.auditLog],
    }));
  }, []);
  const bulkAdjustMaterialPrices = useCallback((pct: number, user: string) => {
    setDb(prev => ({
      ...prev,
      costMaterials: prev.costMaterials.map(m => {
        const unitCost = Math.round(m.unitCost * (1 + pct / 100) * 100) / 100;
        return { ...m, unitCost, updatedAt: nowStr(), priceHistory: [...m.priceHistory, { date: today(), unitCost, supplier: m.supplier, note: `Bulk ${pct > 0 ? '+' : ''}${pct}% adjustment` }] };
      }),
      auditLog: [{ id: genId('aud'), entityType: 'user', entityId: 'costdb', action: `Bulk material price adjustment of ${pct > 0 ? '+' : ''}${pct}% applied`, user, timestamp: nowStr() }, ...prev.auditLog],
    }));
  }, []);
  const addLaborRate = useCallback((r: LaborRate) => setDb(prev => ({ ...prev, laborRates: [r, ...prev.laborRates] })), []);
  const updateLaborRate = useCallback((id: ID, patch: Partial<LaborRate>) => setDb(prev => ({ ...prev, laborRates: prev.laborRates.map(r => r.id === id ? { ...r, ...patch, updatedAt: nowStr() } : r) })), []);
  const addEquipmentRate = useCallback((r: EquipmentRate) => setDb(prev => ({ ...prev, equipmentRates: [r, ...prev.equipmentRates] })), []);
  const updateEquipmentRate = useCallback((id: ID, patch: Partial<EquipmentRate>) => setDb(prev => ({ ...prev, equipmentRates: prev.equipmentRates.map(r => r.id === id ? { ...r, ...patch, updatedAt: nowStr() } : r) })), []);
  const addProductivityRate = useCallback((r: ProductivityRate) => setDb(prev => ({ ...prev, productivityRates: [r, ...prev.productivityRates] })), []);
  const updateProductivityRate = useCallback((id: ID, patch: Partial<ProductivityRate>) => setDb(prev => ({ ...prev, productivityRates: prev.productivityRates.map(r => r.id === id ? { ...r, ...patch, updatedAt: nowStr() } : r) })), []);

  const addEstimate = useCallback((e: Estimate) => {
    setDb(prev => ({
      ...prev,
      estimates: [e, ...prev.estimates],
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: e.id, action: `Estimate ${e.code} created`, user: e.createdBy, timestamp: nowStr() }, ...prev.auditLog],
    }));
  }, []);
  const updateEstimate = useCallback((id: ID, patch: Partial<Estimate>) => {
    setDb(prev => ({ ...prev, estimates: prev.estimates.map(e => e.id === id ? { ...e, ...patch, updatedAt: nowStr() } : e) }));
  }, []);
  const changeEstimateStatus = useCallback((id: ID, status: QuotationStatus, user: string) => {
    setDb(prev => ({
      ...prev,
      estimates: prev.estimates.map(e => e.id === id ? { ...e, status, updatedAt: nowStr() } : e),
      auditLog: [{ id: genId('aud'), entityType: 'project', entityId: id, action: `Quotation status changed to ${status}`, user, timestamp: nowStr() }, ...prev.auditLog],
    }));
  }, []);

  const convertEstimateToProject = useCallback((estimateId: ID, user: string): Project | null => {
    let created: Project | null = null;
    setDb(prev => {
      const est = prev.estimates.find(e => e.id === estimateId);
      if (!est || est.convertedProjectId) return prev;

      // Contract price (with markup + VAT) and direct-cost budget baseline.
      const directCost = est.boqItems.reduce((s, it) => s + (it.materialUnitCost + it.laborUnitCost + it.equipmentUnitCost) * it.quantity, 0);
      const indirectTotal = est.costing.indirects.reduce((s, ind) => s + (ind.type === 'percent' ? directCost * (ind.value / 100) : ind.value), 0);
      const contingency = directCost * (est.costing.contingencyPct / 100);
      const subtotal = directCost + indirectTotal + contingency;
      const preVat = subtotal * (1 + est.costing.profitMarginPct / 100);
      const contractPrice = Math.round(preVat * (1 + est.costing.vatPct / 100));
      const approvedBudget = Math.round(subtotal); // job-costing budget baseline = full cost incl. indirects

      const newProjectId = genId('p');
      const now = nowStr();
      const startDate = new Date();
      const targetDate = new Date(startDate);
      targetDate.setMonth(targetDate.getMonth() + 9);
      const project: Project = {
        id: newProjectId,
        code: `GB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
        name: est.projectName, client: est.client, clientContact: est.clientContact, location: est.location,
        description: `Converted from won quotation ${est.code}. BOQ set as job-costing budget baseline.`,
        scope: est.boqItems.map(i => i.division).filter((v, idx, a) => a.indexOf(v) === idx).join(', '),
        projectManager: user, status: 'Planning', priority: 'Medium',
        startDate: startDate.toISOString().slice(0, 10), targetCompletionDate: targetDate.toISOString().slice(0, 10),
        currentPhase: 'Pre-Construction', progress: 0, contractValue: contractPrice,
        health: { cost: 'Good', schedule: 'Good', quality: 'Good', safety: 'Good' },
        phases: [], milestones: [], contacts: [],
        financials: {
          contractValue: contractPrice, approvedBudget, committedCost: 0, actualExpenses: 0,
          billed: 0, paymentsReceived: 0, retentionPct: 10, changeOrders: [],
        },
        statusHistory: [{ id: genId('sh'), previousStatus: 'Won Quotation', newStatus: 'Planning', updatedBy: user, timestamp: now, reason: `Converted from quotation ${est.code}; BOQ budget baseline ₱${approvedBudget.toLocaleString()}` }],
        blockers: [], createdAt: now, updatedAt: now, createdBy: user, archived: false, branchId: est.branchId,
      };
      created = project;
      return {
        ...prev,
        projects: [project, ...prev.projects],
        estimates: prev.estimates.map(e => e.id === estimateId ? { ...e, status: 'Won', convertedProjectId: newProjectId, convertedBy: user, convertedAt: now } : e),
        auditLog: [
          { id: genId('aud'), entityType: 'project', entityId: newProjectId, action: `Project created from quotation ${est.code} (budget baseline ₱${approvedBudget.toLocaleString()})`, user, timestamp: now, relatedRecord: est.id },
          ...prev.auditLog,
        ],
      };
    });
    return created;
  }, []);

  const value = useMemo<DataContextValue>(() => ({
    ...db,
    updateProject, changeProjectStatus, updatePhaseStatus, addPhase, createProject,
    updateBid, changeBidStage, createBid, convertBidToProject,
    addTask, updateTask, addDocument, addCadFile, updateCadFile, addPurchaseOrder, updatePurchaseOrder,
    addIssue, updateIssue, addDailyLog,
    markNotificationRead, markAllNotificationsRead, logAudit, resetToSeed,
    addUser, updateUser, addBranch, updateBranch,
    addCostMaterial, updateCostMaterial, updateCostMaterialPrice, bulkAdjustMaterialPrices,
    addLaborRate, updateLaborRate, addEquipmentRate, updateEquipmentRate,
    addProductivityRate, updateProductivityRate,
    addEstimate, updateEstimate, changeEstimateStatus, convertEstimateToProject,
  }), [db, updateProject, changeProjectStatus, updatePhaseStatus, addPhase, createProject, updateBid, changeBidStage, createBid,
      convertBidToProject, addTask, updateTask, addDocument, addCadFile, updateCadFile, addPurchaseOrder, updatePurchaseOrder,
      addIssue, updateIssue, addDailyLog, markNotificationRead, markAllNotificationsRead, logAudit, resetToSeed,
      addUser, updateUser, addBranch, updateBranch,
      addCostMaterial, updateCostMaterial, updateCostMaterialPrice, bulkAdjustMaterialPrices,
      addLaborRate, updateLaborRate, addEquipmentRate, updateEquipmentRate,
      addProductivityRate, updateProductivityRate,
      addEstimate, updateEstimate, changeEstimateStatus, convertEstimateToProject]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
