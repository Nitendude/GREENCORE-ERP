// ---------- Shared ----------
export type ID = string;

export interface AuditEntry {
  id: ID;
  entityType: 'project' | 'bid' | 'task' | 'document' | 'purchaseOrder' | 'issue' | 'user';
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
