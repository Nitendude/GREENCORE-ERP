// ---------- Shared ----------
export type ID = string;

export interface AuditEntry {
  id: ID;
  entityType: 'project' | 'bid' | 'task' | 'document' | 'purchaseOrder' | 'issue' | 'user' | 'branch';
  entityId: ID;
  action: string;
  user: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  relatedRecord?: string;
}

export interface StatusHistoryEntry {
  id: ID;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  timestamp: string;
  reason?: string;
}

export type Role =
  | 'Administrator'
  | 'Management'
  | 'Project Manager'
  | 'Bidding Manager'
  | 'Estimator'
  | 'Finance'
  | 'Procurement'
  | 'Project Staff'
  | 'Viewer';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  title?: string;
  phone?: string;
  avatarColor: string;
  active: boolean;
  branchId?: ID;
}

// ---------- Branches (multi-branch "central system") ----------
export type BranchType = 'Headquarters' | 'Branch';

export interface Branch {
  id: ID;
  name: string;
  code: string;
  type: BranchType;
  location: string;
  manager: string;
  email: string;
  phone: string;
  established: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  createdBy: string;
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

// ---------- Projects ----------
export type ProjectStatus =
  | 'Planning'
  | 'Mobilization'
  | 'In Progress'
  | 'On Hold'
  | 'Delayed'
  | 'For Inspection'
  | 'Completed'
  | 'Closed'
  | 'Cancelled';

export interface HealthIndicator {
  cost: 'Good' | 'Watch' | 'Critical';
  schedule: 'Good' | 'Watch' | 'Critical';
  quality: 'Good' | 'Watch' | 'Critical';
  safety: 'Good' | 'Watch' | 'Critical';
}

export interface Phase {
  id: ID;
  name: string;
  weight: number; // % weight toward overall progress
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number; // 0-100
  status: 'Not Started' | 'In Progress' | 'Delayed' | 'Completed';
}

export interface Milestone {
  id: ID;
  name: string;
  dueDate: string;
  completedDate?: string;
  status: 'Upcoming' | 'Due Soon' | 'Overdue' | 'Completed';
  phaseId?: ID;
}

export interface ProjectContact {
  id: ID;
  name: string;
  role: string;
  company?: string;
  type: 'Internal' | 'Client' | 'Consultant' | 'Contractor' | 'Supplier';
  email: string;
  phone: string;
}

export interface ProjectTask {
  id: ID;
  projectId: ID;
  name: string;
  assignee: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
  priority: Priority;
  startDate: string;
  dueDate: string;
  progress: number;
  dependencies: ID[];
  isMilestone: boolean;
}

export interface ProjectDocument {
  id: ID;
  projectId: ID;
  name: string;
  category: 'Contract' | 'Drawing' | 'Plan' | 'Permit' | 'Report' | 'Photo' | 'Purchase' | 'Billing';
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  sizeKb: number;
}

export interface CadVersionEntry {
  version: string;
  date: string;
  uploadedBy: string;
  notes?: string;
}

export interface CadComment {
  id: ID;
  author: string;
  body: string;
  createdAt: string;
}

export interface CadThread {
  id: ID;
  page: number;
  x: number; // Normalized 0-1 document coordinate
  y: number; // Normalized 0-1 document coordinate
  title: string;
  status: 'Open' | 'Resolved';
  comments: CadComment[];
}

export interface CadMarkup {
  id: ID;
  page?: number;
  type: 'line' | 'rectangle' | 'measure';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface CadReviewEvent {
  id: ID;
  action: 'Review saved' | 'Submitted' | 'Reopened';
  user: string;
  timestamp: string;
  details?: string;
}

export interface CadFile {
  id: ID;
  projectId: ID;
  name: string;
  discipline: 'Architectural' | 'Structural' | 'Mechanical' | 'Electrical' | 'Plumbing' | 'Civil' | 'Landscape';
  fileType: 'DWG' | 'DXF' | 'RVT' | 'IFC' | 'PDF';
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  layers: string[];
  sizeKb: number;
  versionHistory: CadVersionEntry[];
  sheet?: string;
  units?: 'Millimeters' | 'Centimeters' | 'Meters' | 'Inches' | 'Feet';
  reviewStatus?: 'Draft' | 'In Review' | 'Ready to Submit' | 'Submitted';
  submissionTarget?: 'Client' | 'Bidding Requirements';
  submittedAt?: string;
  submittedBy?: string;
  threads?: CadThread[];
  markups?: CadMarkup[];
  reviewHistory?: CadReviewEvent[];
}

export interface FinancialSummary {
  contractValue: number;
  approvedBudget: number;
  committedCost: number;
  actualExpenses: number;
  billed: number;
  paymentsReceived: number;
  retentionPct: number;
  changeOrders: ChangeOrder[];
}

export interface ChangeOrder {
  id: ID;
  projectId: ID;
  title: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PurchaseOrder {
  id: ID;
  projectId: ID;
  poNumber: string;
  supplier: string;
  items: string;
  amount: number;
  status: 'Requested' | 'Approved' | 'Ordered' | 'Delivered' | 'Rejected';
  requestedDate: string;
  deliveryDate: string;
  linkedPhase?: string;
}

export interface MaterialItem {
  id: ID;
  projectId: ID;
  name: string;
  unit: string;
  requestedQty: number;
  receivedQty: number;
  issuedQty: number;
  storageLocation: string;
  supplier: string;
  unitCost: number;
  deliveryDate: string;
  lowStock: boolean;
}

export interface IssueRisk {
  id: ID;
  projectId: ID;
  type: 'Issue' | 'Risk' | 'Change Order';
  description: string;
  owner: string;
  impact: 'Low' | 'Medium' | 'High';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
  dueDate: string;
  mitigation?: string;
  attachments: string[];
}

export interface DailyLog {
  id: ID;
  projectId: ID;
  date: string;
  submittedBy: string;
  workCompleted: string;
  workforceCount: number;
  materialsUsed: string;
  equipmentUsed: string;
  weather: string;
  problems?: string;
  nextActivities: string;
  photos: number;
}

export interface Project {
  id: ID;
  code: string;
  name: string;
  client: string;
  clientContact: string;
  location: string;
  description: string;
  scope: string;
  projectManager: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  targetCompletionDate: string;
  currentPhase: string;
  progress: number;
  contractValue: number;
  health: HealthIndicator;
  phases: Phase[];
  milestones: Milestone[];
  contacts: ProjectContact[];
  financials: FinancialSummary;
  statusHistory: StatusHistoryEntry[];
  blockers: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  archived: boolean;
  sourceBidId?: ID;
  branchId?: ID;
}

// ---------- Bidding ----------
export type BidStage =
  | 'Lead / Opportunity'
  | 'For Review'
  | 'Go/No-Go Decision'
  | 'Preparing Requirements'
  | 'Cost Estimation'
  | 'Internal Review'
  | 'For Approval'
  | 'Ready for Submission'
  | 'Submitted'
  | 'Under Evaluation'
  | 'Negotiation'
  | 'Awarded'
  | 'Lost'
  | 'Withdrawn'
  | 'Cancelled';

export interface BidRequirement {
  id: ID;
  bidId: ID;
  requirement: string;
  responsible: string;
  dueDate: string;
  completed: boolean;
  requiredDocument?: string;
  remarks?: string;
  mandatory: boolean;
}

export interface CostEstimateLine {
  id: ID;
  category: 'Labor' | 'Materials' | 'Equipment' | 'Subcontractors' | 'Logistics' | 'Overhead' | 'Taxes' | 'Contingency' | 'Markup';
  amount: number;
}

export interface CostEstimateVersion {
  id: ID;
  version: number;
  date: string;
  lines: CostEstimateLine[];
  proposedPrice: number;
  updatedBy: string;
}

export interface BidDocument {
  id: ID;
  bidId: ID;
  name: string;
  category: 'Invitation to Bid' | 'Terms of Reference' | 'Scope of Work' | 'Drawings' | 'Bill of Quantities' | 'Eligibility' | 'Technical Proposal' | 'Financial Proposal' | 'Submission' | 'Acknowledgment';
  version: string;
  uploadedBy: string;
  uploadedDate: string;
}

export interface ClarificationEntry {
  id: ID;
  bidId: ID;
  type: 'Client Question' | 'Company Response' | 'Pre-bid Meeting' | 'Site Visit' | 'Addendum' | 'Internal Note';
  date: string;
  author: string;
  content: string;
  followUpDate?: string;
}

export interface ApprovalEntry {
  id: ID;
  bidId: ID;
  type: 'Technical' | 'Financial' | 'Management';
  approver: string;
  date?: string;
  decision: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
}

export interface GoNoGoAssessment {
  strategicFit: number;
  clientRelationship: number;
  availableCapacity: number;
  technicalCapability: number;
  profitability: number;
  competition: number;
  submissionTime: number;
  commercialLegalRisk: number;
  recommendation: 'Go' | 'No-Go' | 'Undecided';
  notes?: string;
  assessedBy?: string;
  assessedDate?: string;
}

export interface BidAssignment {
  id: ID;
  bidId: ID;
  role: 'Bid Manager' | 'Estimator' | 'Technical Team' | 'Approver';
  person: string;
  assignedRequirement?: string;
  dueDate?: string;
}

export interface Bid {
  id: ID;
  reference: string;
  title: string;
  client: string;
  clientContact: string;
  location: string;
  description: string;
  source: string;
  bidOwner: string;
  estimatedValue: number;
  submissionDeadline: string;
  stage: BidStage;
  probability: number;
  competitors: string[];
  nextAction: string;
  requirements: BidRequirement[];
  costEstimates: CostEstimateVersion[];
  documents: BidDocument[];
  assignments: BidAssignment[];
  clarifications: ClarificationEntry[];
  approvals: ApprovalEntry[];
  goNoGo?: GoNoGoAssessment;
  result?: {
    outcome: 'Awarded' | 'Lost' | 'Withdrawn' | 'Cancelled';
    finalAmount?: number;
    winningAmount?: number;
    competitorInfo?: string;
    reason?: string;
    lessonsLearned?: string;
  };
  stageHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  convertedProjectId?: ID;
  convertedBy?: string;
  convertedAt?: string;
  branchId?: ID;
}

// ---------- Notifications ----------
export interface Notification {
  id: ID;
  type:
    | 'Bid Deadline'
    | 'Overdue Requirement'
    | 'Pending Approval'
    | 'Project Delay'
    | 'Overdue Task'
    | 'Budget Overrun'
    | 'Pending Purchase Request'
    | 'Document Approval'
    | 'New Assignment'
    | 'Status Change';
  title: string;
  message: string;
  relatedType: 'project' | 'bid' | 'task' | 'document' | 'purchaseOrder';
  relatedId: ID;
  timestamp: string;
  read: boolean;
}

// ================= Estimation & Pre-Construction Module =================

// ---------- Item & Cost Database (foundation) ----------
export interface PricePoint {
  date: string;
  unitCost: number;
  supplier: string;
  note?: string;
}

export type MaterialCategory =
  | 'Cement & Aggregates' | 'Masonry' | 'Steel & Rebar' | 'Lumber & Formwork'
  | 'Finishes' | 'Electrical' | 'Plumbing' | 'Hardware' | 'Roofing' | 'Miscellaneous';

export interface CostMaterial {
  id: ID;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string; // pc, bag, cu.m, kg, sheet, etc.
  unitCost: number; // current cost
  supplier: string;
  priceHistory: PricePoint[];
  updatedAt: string;
}

export interface LaborRate {
  id: ID;
  trade: string; // Mason, Carpenter, Electrician, Plumber, Laborer, Foreman...
  skill: 'Skilled' | 'Semi-Skilled' | 'Unskilled' | 'Supervisor';
  dailyRate: number; // per man-day
  updatedAt: string;
}

export interface EquipmentRate {
  id: ID;
  name: string;
  ownership: 'Owned' | 'Rental';
  hourlyRate: number;
  dailyRate: number;
  updatedAt: string;
}

export interface ProductivityRate {
  id: ID;
  workItem: string; // e.g. "CHB Laying (100mm)"
  unit: string; // sqm, cu.m, lm...
  outputPerManDay: number; // e.g. 12 sqm / man-day
  crew: string; // e.g. "1 Mason + 1 Laborer"
  updatedAt: string;
}

// ---------- Composition templates (BOM generation) ----------
export interface CompositionComponent {
  materialId: ID;
  qtyPerUnit: number; // material qty needed to build 1 unit of the work item
  wastagePct: number; // default wastage for this component
}

export interface CompositionTemplate {
  id: ID;
  workItem: string;   // e.g. "CHB Wall 100mm (per sqm)"
  unit: string;       // sqm, cu.m...
  components: CompositionComponent[];
  laborTrade?: string;        // links to a LaborRate trade
  productivityId?: ID;        // links to a ProductivityRate
}

// ---------- BOQ ----------
export type BoqDivision =
  | 'General Requirements' | 'Earthworks' | 'Concrete' | 'Masonry' | 'Metal Works'
  | 'Wood & Plastics' | 'Thermal & Moisture' | 'Doors & Windows' | 'Finishes'
  | 'Electrical' | 'Plumbing' | 'Mechanical' | 'Fire Protection' | 'Siteworks';

export interface BoqLineItem {
  id: ID;
  division: BoqDivision;
  description: string;
  unit: string;
  quantity: number;
  materialUnitCost: number;
  laborUnitCost: number;
  equipmentUnitCost: number;
  templateId?: ID; // composition template for BOM expansion
}

export interface BoqRevision {
  id: ID;
  label: string; // Rev A, Rev B...
  date: string;
  author: string;
  note: string;
  lineItemCount: number;
  directCost: number;
}

// ---------- Costing ----------
export interface IndirectCost {
  id: ID;
  label: string; // OCM, Mobilization, Temporary Facilities, Safety...
  type: 'percent' | 'amount';
  value: number; // percent of direct cost OR fixed amount
}

export interface CostingConfig {
  indirects: IndirectCost[];
  profitMarginPct: number;
  vatPct: number; // 12
  contingencyPct: number;
}

// ---------- Quotation ----------
export type QuotationStatus = 'Draft' | 'Sent' | 'Negotiating' | 'Won' | 'Lost';
export type QuotationDetailLevel = 'Lump Sum' | 'Per Division' | 'Full BOQ';

export interface QuotationRevision {
  id: ID;
  label: string; // Rev A, B, C
  date: string;
  author: string;
  changeNote: string;
  contractPrice: number;
}

export interface QuotationConfig {
  detailLevel: QuotationDetailLevel;
  validityDays: number;
  paymentSchedule: string;
  termsAndConditions: string;
  exclusions: string;
}

// ---------- Design ----------
export interface DesignDrawing {
  id: ID;
  name: string;
  category: 'Plan' | 'Perspective' | 'Specification' | 'Elevation' | 'Section' | 'Detail';
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  note?: string;
}

export interface DesignRevisionEntry {
  id: ID;
  date: string;
  author: string;
  description: string;
  linkedQuotationRev?: string; // Rev A/B/C
  triggersReEstimate: boolean;
}

// ---------- Estimate (the quotation record) ----------
export interface Estimate {
  id: ID;
  code: string; // EST-2026-001
  projectName: string;
  client: string;
  clientContact: string;
  location: string;
  grossFloorArea: number; // sqm — for per-sqm mode
  status: QuotationStatus;
  currentRevision: string; // Rev A/B/C
  boqItems: BoqLineItem[];
  boqRevisions: BoqRevision[];
  costing: CostingConfig;
  quotation: QuotationConfig;
  quotationRevisions: QuotationRevision[];
  drawings: DesignDrawing[];
  designRevisions: DesignRevisionEntry[];
  estimator: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  branchId?: ID;
  convertedProjectId?: ID;
  convertedAt?: string;
  convertedBy?: string;
  sourceBidId?: ID;
}
