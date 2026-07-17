import type {
  Project, Bid, User, Branch, Notification, ProjectTask, ProjectDocument, CadFile,
  PurchaseOrder, MaterialItem, IssueRisk, DailyLog, AuditEntry,
} from '../types';
import { genId } from '../utils/format';
import {
  COST_MATERIALS, LABOR_RATES, EQUIPMENT_RATES, PRODUCTIVITY_RATES,
  COMPOSITION_TEMPLATES, ESTIMATES,
} from './estimationSeed';

// Anchor "today" so seed data feels current relative to the app clock.
const TODAY = new Date('2026-07-16T09:00:00');
function d(offsetDays: number): string {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

// ---------- Branches (this ERP instance is the central system / HQ) ----------
export const BRANCHES: Branch[] = [
  { id: 'br1', name: 'Greencore HQ — Seattle', code: 'HQ-SEA', type: 'Headquarters', location: 'Seattle, WA', manager: 'Elena Cruz', email: 'hq@greencore.com', phone: '+1 (555) 010-2000', established: '2011-03-01', status: 'Active', createdAt: '2011-03-01T08:00:00', createdBy: 'Miguel Santos' },
  { id: 'br2', name: 'South Sound Branch', code: 'BR-TAC', type: 'Branch', location: 'Tacoma, WA', manager: 'David Reyes', email: 'southsound@greencore.com', phone: '+1 (555) 010-2100', established: '2016-06-15', status: 'Active', createdAt: '2016-06-15T08:00:00', createdBy: 'Elena Cruz' },
  { id: 'br3', name: 'Eastside Branch', code: 'BR-BEL', type: 'Branch', location: 'Bellevue, WA', manager: 'Priya Nair', email: 'eastside@greencore.com', phone: '+1 (555) 010-2200', established: '2019-02-01', status: 'Active', createdAt: '2019-02-01T08:00:00', createdBy: 'Elena Cruz' },
  { id: 'br4', name: 'North Sound Branch', code: 'BR-EVR', type: 'Branch', location: 'Everett, WA', manager: 'David Reyes', email: 'northsound@greencore.com', phone: '+1 (555) 010-2300', established: '2023-09-01', status: 'Active', createdAt: '2023-09-01T08:00:00', createdBy: 'Miguel Santos' },
];

export const USERS: User[] = [
  { id: 'u1', name: 'Miguel Santos', email: 'miguel.santos@greencore.com', role: 'Administrator', title: 'System Administrator', phone: '+1 (555) 010-1001', avatarColor: '#2f6f4e', active: true },
  { id: 'u2', name: 'Elena Cruz', email: 'elena.cruz@greencore.com', role: 'Management', title: 'VP of Operations', phone: '+1 (555) 010-1002', avatarColor: '#8a4b9c', active: true },
  { id: 'u3', name: 'David Reyes', email: 'david.reyes@greencore.com', role: 'Project Manager', title: 'Senior Project Manager', phone: '+1 (555) 010-1003', avatarColor: '#1f6fa8', active: true },
  { id: 'u4', name: 'Priya Nair', email: 'priya.nair@greencore.com', role: 'Project Manager', title: 'Project Manager', phone: '+1 (555) 010-1004', avatarColor: '#c0722a', active: true },
  { id: 'u5', name: 'Jonathan Lee', email: 'jonathan.lee@greencore.com', role: 'Bidding Manager', title: 'Bidding & Proposals Manager', phone: '+1 (555) 010-1005', avatarColor: '#a13e5c', active: true },
  { id: 'u6', name: 'Sofia Bautista', email: 'sofia.bautista@greencore.com', role: 'Estimator', title: 'Senior Estimator', phone: '+1 (555) 010-1006', avatarColor: '#3a7d7d', active: true },
  { id: 'u7', name: 'Karl Mendoza', email: 'karl.mendoza@greencore.com', role: 'Finance', title: 'Finance Controller', phone: '+1 (555) 010-1007', avatarColor: '#6b5b3e', active: true },
  { id: 'u8', name: 'Anna Villareal', email: 'anna.villareal@greencore.com', role: 'Procurement', title: 'Procurement Lead', phone: '+1 (555) 010-1008', avatarColor: '#4a5a8c', active: true },
  { id: 'u9', name: 'Ben Torres', email: 'ben.torres@greencore.com', role: 'Project Staff', title: 'Site Engineer', phone: '+1 (555) 010-1009', avatarColor: '#5c8a3a', active: true },
  { id: 'u10', name: 'Grace Lim', email: 'grace.lim@greencore.com', role: 'Viewer', title: 'Client Liaison', phone: '+1 (555) 010-1010', avatarColor: '#9c5b4b', active: true },
];

function health(cost: 'Good'|'Watch'|'Critical', schedule: 'Good'|'Watch'|'Critical', quality: 'Good'|'Watch'|'Critical', safety: 'Good'|'Watch'|'Critical') {
  return { cost, schedule, quality, safety };
}

export const PROJECTS: Project[] = [
  {
    id: 'p1', code: 'GB-2025-014', name: 'Riverside Logistics Hub', client: 'Meridian Freight Corp',
    clientContact: 'Laura Chen — VP Facilities', location: 'Port of Tacoma, WA',
    description: 'Construction of a 180,000 sq ft cross-dock logistics facility with 42 dock doors, office annex, and yard paving.',
    scope: 'Sitework, foundations, steel erection, envelope, MEP, dock equipment, paving, and landscaping.',
    projectManager: 'David Reyes', status: 'In Progress', priority: 'High',
    startDate: d(-140), targetCompletionDate: d(95), currentPhase: 'MEP Rough-In', progress: 58,
    contractValue: 18750000, health: health('Watch', 'Watch', 'Good', 'Good'),
    phases: [
      { id: 'ph1', name: 'Sitework & Foundations', weight: 20, plannedStart: d(-140), plannedEnd: d(-90), actualStart: d(-140), actualEnd: d(-85), progress: 100, status: 'Completed' },
      { id: 'ph2', name: 'Steel Erection', weight: 25, plannedStart: d(-88), plannedEnd: d(-30), actualStart: d(-85), actualEnd: d(-25), progress: 100, status: 'Completed' },
      { id: 'ph3', name: 'Building Envelope', weight: 20, plannedStart: d(-28), plannedEnd: d(10), actualStart: d(-26), progress: 85, status: 'In Progress' },
      { id: 'ph4', name: 'MEP Rough-In', weight: 20, plannedStart: d(-5), plannedEnd: d(35), actualStart: d(-2), progress: 30, status: 'Delayed' },
      { id: 'ph5', name: 'Finishes & Commissioning', weight: 15, plannedStart: d(36), plannedEnd: d(95), progress: 0, status: 'Not Started' },
    ],
    milestones: [
      { id: 'm1', name: 'Foundation Sign-off', dueDate: d(-85), completedDate: d(-86), status: 'Completed' },
      { id: 'm2', name: 'Steel Topping Out', dueDate: d(-25), completedDate: d(-24), status: 'Completed' },
      { id: 'm3', name: 'Envelope Watertight', dueDate: d(12), status: 'Due Soon' },
      { id: 'm4', name: 'MEP Rough-In Complete', dueDate: d(35), status: 'Upcoming' },
      { id: 'm5', name: 'Substantial Completion', dueDate: d(90), status: 'Upcoming' },
    ],
    contacts: [
      { id: 'c1', name: 'David Reyes', role: 'Project Manager', type: 'Internal', email: 'david.reyes@greencore.com', phone: '+1 (555) 010-1003' },
      { id: 'c2', name: 'Ben Torres', role: 'Site Engineer', type: 'Internal', email: 'ben.torres@greencore.com', phone: '+1 (555) 010-1009' },
      { id: 'c3', name: 'Laura Chen', role: 'VP Facilities', company: 'Meridian Freight Corp', type: 'Client', email: 'l.chen@meridianfreight.com', phone: '+1 (555) 220-3301' },
      { id: 'c4', name: 'Tom Ashford', role: 'Structural Engineer', company: 'Ashford Structural Group', type: 'Consultant', email: 'tashford@asg-eng.com', phone: '+1 (555) 330-1120' },
      { id: 'c5', name: 'Rick Diaz', role: 'Steel Erection Foreman', company: 'Ironclad Steel Co.', type: 'Contractor', email: 'rick@ironcladsteel.com', phone: '+1 (555) 440-8890' },
    ],
    financials: {
      contractValue: 18750000, approvedBudget: 17900000, committedCost: 12400000, actualExpenses: 10850000,
      billed: 11200000, paymentsReceived: 10100000, retentionPct: 10,
      changeOrders: [
        { id: 'co1', projectId: 'p1', title: 'Additional dock levelers (x4)', amount: 186000, status: 'Approved', submittedDate: d(-40), approvedBy: 'Elena Cruz', approvedDate: d(-32) },
        { id: 'co2', projectId: 'p1', title: 'Yard lighting upgrade', amount: 64500, status: 'Submitted', submittedDate: d(-6) },
      ],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'Planning', newStatus: 'Mobilization', updatedBy: 'David Reyes', timestamp: d(-142) + 'T08:00', reason: 'NTP received' },
      { id: 'sh2', previousStatus: 'Mobilization', newStatus: 'In Progress', updatedBy: 'David Reyes', timestamp: d(-135) + 'T08:00', reason: 'Site mobilized, work commenced' },
    ],
    blockers: ['MEP subcontractor short-staffed on electrical crew', 'Awaiting dock leveler change-order approval from client'],
    createdAt: d(-150) + 'T08:00', updatedAt: d(-1) + 'T14:30', createdBy: 'Elena Cruz', archived: false,
  },
  {
    id: 'p2', code: 'GB-2025-021', name: 'Cascade Medical Office Building', client: 'Cascade Health Partners',
    clientContact: 'Dr. Alan Whitfield — COO', location: 'Bellevue, WA',
    description: 'Four-story, 65,000 sq ft medical office building with imaging suite and structured parking.',
    scope: 'Full ground-up construction including structured parking podium, curtain wall, and specialty medical MEP.',
    projectManager: 'Priya Nair', status: 'Delayed', priority: 'Critical',
    startDate: d(-210), targetCompletionDate: d(30), currentPhase: 'Interior Finishes', progress: 71,
    contractValue: 24300000, health: health('Critical', 'Critical', 'Watch', 'Good'),
    phases: [
      { id: 'ph1', name: 'Podium & Foundations', weight: 15, plannedStart: d(-210), plannedEnd: d(-165), actualStart: d(-210), actualEnd: d(-160), progress: 100, status: 'Completed' },
      { id: 'ph2', name: 'Structure & Envelope', weight: 30, plannedStart: d(-160), plannedEnd: d(-80), actualStart: d(-158), actualEnd: d(-65), progress: 100, status: 'Completed' },
      { id: 'ph3', name: 'MEP & Medical Systems', weight: 25, plannedStart: d(-78), plannedEnd: d(-10), actualStart: d(-75), progress: 90, status: 'In Progress' },
      { id: 'ph4', name: 'Interior Finishes', weight: 20, plannedStart: d(-9), plannedEnd: d(15), actualStart: d(-6), progress: 55, status: 'Delayed' },
      { id: 'ph5', name: 'Commissioning & Handover', weight: 10, plannedStart: d(16), plannedEnd: d(30), progress: 0, status: 'Not Started' },
    ],
    milestones: [
      { id: 'm1', name: 'Structure Topped Out', dueDate: d(-65), completedDate: d(-63), status: 'Completed' },
      { id: 'm2', name: 'Imaging Suite Shielding Inspection', dueDate: d(2), status: 'Due Soon' },
      { id: 'm3', name: 'TCO Application', dueDate: d(20), status: 'Upcoming' },
      { id: 'm4', name: 'Substantial Completion', dueDate: d(28), status: 'Upcoming' },
    ],
    contacts: [
      { id: 'c1', name: 'Priya Nair', role: 'Project Manager', type: 'Internal', email: 'priya.nair@greencore.com', phone: '+1 (555) 010-1004' },
      { id: 'c2', name: 'Dr. Alan Whitfield', role: 'COO', company: 'Cascade Health Partners', type: 'Client', email: 'awhitfield@cascadehealth.org', phone: '+1 (555) 220-7712' },
      { id: 'c3', name: 'Meredith Fox', role: 'MEP Engineer', company: 'Fox Mechanical Design', type: 'Consultant', email: 'mfox@foxmech.com', phone: '+1 (555) 330-9081' },
    ],
    financials: {
      contractValue: 24300000, approvedBudget: 23100000, committedCost: 19800000, actualExpenses: 18950000,
      billed: 19500000, paymentsReceived: 17200000, retentionPct: 10,
      changeOrders: [
        { id: 'co1', projectId: 'p2', title: 'Imaging suite RF shielding upgrade', amount: 412000, status: 'Approved', submittedDate: d(-55), approvedBy: 'Elena Cruz', approvedDate: d(-48) },
      ],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'In Progress', newStatus: 'Delayed', updatedBy: 'Priya Nair', timestamp: d(-12) + 'T10:00', reason: 'Imaging suite shielding rework pushed finishes schedule by 3 weeks' },
    ],
    blockers: ['RF shielding rework delaying drywall closeout on Level 3', 'Permit office backlog on TCO inspection scheduling'],
    createdAt: d(-220) + 'T08:00', updatedAt: d(-1) + 'T09:15', createdBy: 'Elena Cruz', archived: false,
  },
  {
    id: 'p3', code: 'GB-2026-003', name: 'Harborview Elementary Renovation', client: 'Harborview School District',
    clientContact: 'Nancy Ortiz — Facilities Director', location: 'Everett, WA',
    description: 'Phased renovation of classroom wings, new gymnasium roof, and accessibility upgrades while school remains occupied.',
    scope: 'Occupied-campus phased renovation across 3 summer/school-break windows.',
    projectManager: 'David Reyes', status: 'Planning', priority: 'Medium',
    startDate: d(20), targetCompletionDate: d(380), currentPhase: 'Pre-Construction', progress: 5,
    contractValue: 6400000, health: health('Good', 'Good', 'Good', 'Good'),
    phases: [
      { id: 'ph1', name: 'Design Coordination & Permitting', weight: 10, plannedStart: d(-10), plannedEnd: d(25), actualStart: d(-10), progress: 70, status: 'In Progress' },
      { id: 'ph2', name: 'Phase 1 - Classroom Wing A', weight: 30, plannedStart: d(26), plannedEnd: d(110), progress: 0, status: 'Not Started' },
      { id: 'ph3', name: 'Phase 2 - Gymnasium Roof', weight: 30, plannedStart: d(111), plannedEnd: d(220), progress: 0, status: 'Not Started' },
      { id: 'ph4', name: 'Phase 3 - Classroom Wing B & Accessibility', weight: 30, plannedStart: d(221), plannedEnd: d(380), progress: 0, status: 'Not Started' },
    ],
    milestones: [
      { id: 'm1', name: 'Permit Approval', dueDate: d(25), status: 'Upcoming' },
      { id: 'm2', name: 'Phase 1 Mobilization', dueDate: d(26), status: 'Upcoming' },
    ],
    contacts: [
      { id: 'c1', name: 'David Reyes', role: 'Project Manager', type: 'Internal', email: 'david.reyes@greencore.com', phone: '+1 (555) 010-1003' },
      { id: 'c2', name: 'Nancy Ortiz', role: 'Facilities Director', company: 'Harborview School District', type: 'Client', email: 'nortiz@harborviewsd.org', phone: '+1 (555) 220-4410' },
    ],
    financials: {
      contractValue: 6400000, approvedBudget: 6100000, committedCost: 420000, actualExpenses: 180000,
      billed: 150000, paymentsReceived: 0, retentionPct: 5, changeOrders: [],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'Lead / Opportunity', newStatus: 'Planning', updatedBy: 'David Reyes', timestamp: d(-18) + 'T08:00', reason: 'Contract awarded, converted from bid BID-2025-118' },
    ],
    blockers: [], createdAt: d(-18) + 'T08:00', updatedAt: d(-2) + 'T11:00', createdBy: 'David Reyes', archived: false,
    sourceBidId: 'b7',
  },
  {
    id: 'p4', code: 'GB-2024-047', name: 'Northgate Retail Plaza', client: 'Northgate Development Group',
    clientContact: 'Steve Marchetti — Principal', location: 'Renton, WA',
    description: 'New-build 8-tenant retail plaza with shared parking and monument signage.',
    scope: 'Shell and core construction for 8 retail pads, shared utilities, and site landscaping.',
    projectManager: 'Priya Nair', status: 'Completed', priority: 'Low',
    startDate: d(-400), targetCompletionDate: d(-30), currentPhase: 'Closeout', progress: 100,
    contractValue: 9200000, health: health('Good', 'Good', 'Good', 'Good'),
    phases: [
      { id: 'ph1', name: 'Sitework & Utilities', weight: 25, plannedStart: d(-400), plannedEnd: d(-330), actualStart: d(-400), actualEnd: d(-328), progress: 100, status: 'Completed' },
      { id: 'ph2', name: 'Shell Construction', weight: 45, plannedStart: d(-328), plannedEnd: d(-120), actualStart: d(-328), actualEnd: d(-115), progress: 100, status: 'Completed' },
      { id: 'ph3', name: 'Tenant Core Finishes', weight: 20, plannedStart: d(-115), plannedEnd: d(-40), actualStart: d(-115), actualEnd: d(-38), progress: 100, status: 'Completed' },
      { id: 'ph4', name: 'Closeout', weight: 10, plannedStart: d(-38), plannedEnd: d(-30), actualStart: d(-38), actualEnd: d(-29), progress: 100, status: 'Completed' },
    ],
    milestones: [
      { id: 'm1', name: 'Final Certificate of Occupancy', dueDate: d(-30), completedDate: d(-29), status: 'Completed' },
    ],
    contacts: [
      { id: 'c1', name: 'Priya Nair', role: 'Project Manager', type: 'Internal', email: 'priya.nair@greencore.com', phone: '+1 (555) 010-1004' },
      { id: 'c2', name: 'Steve Marchetti', role: 'Principal', company: 'Northgate Development Group', type: 'Client', email: 'steve@northgatedev.com', phone: '+1 (555) 220-5561' },
    ],
    financials: {
      contractValue: 9200000, approvedBudget: 9050000, committedCost: 8890000, actualExpenses: 8890000,
      billed: 9200000, paymentsReceived: 9200000, retentionPct: 0, changeOrders: [
        { id: 'co1', projectId: 'p4', title: 'Monument sign relocation', amount: 28500, status: 'Approved', submittedDate: d(-95), approvedBy: 'Elena Cruz', approvedDate: d(-90) },
      ],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'In Progress', newStatus: 'Completed', updatedBy: 'Priya Nair', timestamp: d(-29) + 'T16:00', reason: 'Final CO issued, all punch items closed' },
    ],
    blockers: [], createdAt: d(-410) + 'T08:00', updatedAt: d(-29) + 'T16:00', createdBy: 'Elena Cruz', archived: false,
  },
  {
    id: 'p5', code: 'GB-2025-032', name: 'Timberline Distribution Center Expansion', client: 'Timberline Logistics',
    clientContact: 'Patricia Nguyen — Director of Real Estate', location: 'Kent, WA',
    description: 'Expansion of existing 400,000 sq ft distribution center by 120,000 sq ft, including new truck court.',
    scope: 'Tilt-up concrete expansion, new truck court paving, and tie-in to existing fire/life-safety systems.',
    projectManager: 'David Reyes', status: 'On Hold', priority: 'Medium',
    startDate: d(-60), targetCompletionDate: d(240), currentPhase: 'Sitework', progress: 12,
    contractValue: 14100000, health: health('Watch', 'Watch', 'Good', 'Good'),
    phases: [
      { id: 'ph1', name: 'Sitework', weight: 20, plannedStart: d(-60), plannedEnd: d(20), actualStart: d(-60), progress: 45, status: 'In Progress' },
      { id: 'ph2', name: 'Tilt-up Panel Erection', weight: 30, plannedStart: d(21), plannedEnd: d(100), progress: 0, status: 'Not Started' },
      { id: 'ph3', name: 'MEP & Fire/Life Safety Tie-in', weight: 30, plannedStart: d(101), plannedEnd: d(190), progress: 0, status: 'Not Started' },
      { id: 'ph4', name: 'Finishes & Commissioning', weight: 20, plannedStart: d(191), plannedEnd: d(240), progress: 0, status: 'Not Started' },
    ],
    milestones: [
      { id: 'm1', name: 'Permit Amendment Approval', dueDate: d(15), status: 'Upcoming' },
    ],
    contacts: [
      { id: 'c1', name: 'David Reyes', role: 'Project Manager', type: 'Internal', email: 'david.reyes@greencore.com', phone: '+1 (555) 010-1003' },
      { id: 'c2', name: 'Patricia Nguyen', role: 'Director of Real Estate', company: 'Timberline Logistics', type: 'Client', email: 'pnguyen@timberlinelogistics.com', phone: '+1 (555) 220-9012' },
    ],
    financials: {
      contractValue: 14100000, approvedBudget: 13500000, committedCost: 1650000, actualExpenses: 1180000,
      billed: 900000, paymentsReceived: 900000, retentionPct: 10, changeOrders: [],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'In Progress', newStatus: 'On Hold', updatedBy: 'Elena Cruz', timestamp: d(-8) + 'T13:00', reason: 'Client requested pause pending permit amendment for truck court redesign' },
    ],
    blockers: ['Client-requested design change to truck court awaiting permit amendment'],
    createdAt: d(-70) + 'T08:00', updatedAt: d(-8) + 'T13:00', createdBy: 'Elena Cruz', archived: false,
  },
  {
    id: 'p6', code: 'GB-2025-040', name: 'Sunrise Senior Living Community', client: 'Sunrise Senior Communities',
    clientContact: 'Howard Blake — Development Manager', location: 'Puyallup, WA',
    description: '96-unit assisted living community with commercial kitchen and clubhouse.',
    scope: 'Wood-frame construction, three residential buildings, clubhouse, and site amenities.',
    projectManager: 'Priya Nair', status: 'For Inspection', priority: 'High',
    startDate: d(-260), targetCompletionDate: d(10), currentPhase: 'Final Inspections', progress: 94,
    contractValue: 21800000, health: health('Good', 'Watch', 'Good', 'Good'),
    phases: [
      { id: 'ph1', name: 'Sitework & Foundations', weight: 15, plannedStart: d(-260), plannedEnd: d(-210), actualStart: d(-260), actualEnd: d(-208), progress: 100, status: 'Completed' },
      { id: 'ph2', name: 'Framing & Envelope', weight: 35, plannedStart: d(-205), plannedEnd: d(-90), actualStart: d(-205), actualEnd: d(-85), progress: 100, status: 'Completed' },
      { id: 'ph3', name: 'MEP & Interiors', weight: 35, plannedStart: d(-84), plannedEnd: d(-15), actualStart: d(-82), actualEnd: d(-12), progress: 100, status: 'Completed' },
      { id: 'ph4', name: 'Final Inspections & Handover', weight: 15, plannedStart: d(-11), plannedEnd: d(10), actualStart: d(-9), progress: 70, status: 'In Progress' },
    ],
    milestones: [
      { id: 'm1', name: 'Fire Marshal Final', dueDate: d(4), status: 'Due Soon' },
      { id: 'm2', name: 'Certificate of Occupancy', dueDate: d(9), status: 'Upcoming' },
    ],
    contacts: [
      { id: 'c1', name: 'Priya Nair', role: 'Project Manager', type: 'Internal', email: 'priya.nair@greencore.com', phone: '+1 (555) 010-1004' },
      { id: 'c2', name: 'Howard Blake', role: 'Development Manager', company: 'Sunrise Senior Communities', type: 'Client', email: 'hblake@sunriseliving.com', phone: '+1 (555) 220-3390' },
    ],
    financials: {
      contractValue: 21800000, approvedBudget: 21200000, committedCost: 20650000, actualExpenses: 20100000,
      billed: 20400000, paymentsReceived: 19800000, retentionPct: 5, changeOrders: [],
    },
    statusHistory: [
      { id: 'sh1', previousStatus: 'In Progress', newStatus: 'For Inspection', updatedBy: 'Priya Nair', timestamp: d(-9) + 'T09:00', reason: 'All construction complete, entering final inspection sequence' },
    ],
    blockers: [], createdAt: d(-270) + 'T08:00', updatedAt: d(-1) + 'T15:00', createdBy: 'Elena Cruz', archived: false,
  },
];

// ---------- Tasks ----------
export const TASKS: ProjectTask[] = [
  { id: 't1', projectId: 'p1', name: 'Complete envelope flashing details - North elevation', assignee: 'Ben Torres', status: 'In Progress', priority: 'High', startDate: d(-10), dueDate: d(5), progress: 60, dependencies: [], isMilestone: false },
  { id: 't2', projectId: 'p1', name: 'Electrical rough-in - Office Annex', assignee: 'Ben Torres', status: 'Blocked', priority: 'Critical', startDate: d(-3), dueDate: d(-1), progress: 20, dependencies: [], isMilestone: false },
  { id: 't3', projectId: 'p1', name: 'Dock leveler installation', assignee: 'David Reyes', status: 'Not Started', priority: 'Medium', startDate: d(8), dueDate: d(20), progress: 0, dependencies: ['t2'], isMilestone: false },
  { id: 't4', projectId: 'p1', name: 'Envelope watertight walkthrough', assignee: 'David Reyes', status: 'Not Started', priority: 'High', startDate: d(11), dueDate: d(12), progress: 0, dependencies: ['t1'], isMilestone: true },
  { id: 't5', projectId: 'p2', name: 'RF shielding rework - Level 3 Imaging', assignee: 'Priya Nair', status: 'In Progress', priority: 'Critical', startDate: d(-14), dueDate: d(-2), progress: 80, dependencies: [], isMilestone: false },
  { id: 't6', projectId: 'p2', name: 'Drywall closeout - Level 3', assignee: 'Ben Torres', status: 'Blocked', priority: 'High', startDate: d(-5), dueDate: d(3), progress: 35, dependencies: ['t5'], isMilestone: false },
  { id: 't7', projectId: 'p2', name: 'TCO application submission', assignee: 'Priya Nair', status: 'Not Started', priority: 'Critical', startDate: d(15), dueDate: d(20), progress: 0, dependencies: ['t6'], isMilestone: true },
  { id: 't8', projectId: 'p3', name: 'Finalize classroom wing A permit set', assignee: 'David Reyes', status: 'In Progress', priority: 'High', startDate: d(-10), dueDate: d(22), progress: 70, dependencies: [], isMilestone: false },
  { id: 't9', projectId: 'p5', name: 'Truck court permit amendment resubmission', assignee: 'David Reyes', status: 'Blocked', priority: 'High', startDate: d(-8), dueDate: d(10), progress: 15, dependencies: [], isMilestone: false },
  { id: 't10', projectId: 'p6', name: 'Fire marshal walkthrough prep', assignee: 'Ben Torres', status: 'In Progress', priority: 'Critical', startDate: d(-3), dueDate: d(3), progress: 55, dependencies: [], isMilestone: true },
  { id: 't11', projectId: 'p6', name: 'Punch list closeout - Building C', assignee: 'Ben Torres', status: 'In Progress', priority: 'Medium', startDate: d(-6), dueDate: d(6), progress: 65, dependencies: [], isMilestone: false },
];

// ---------- Documents ----------
export const DOCUMENTS: ProjectDocument[] = [
  { id: 'doc1', projectId: 'p1', name: 'AIA A101 Owner-Contractor Agreement.pdf', category: 'Contract', version: '1.0', uploadedBy: 'Elena Cruz', uploadedDate: d(-150), approvalStatus: 'Approved', sizeKb: 842 },
  { id: 'doc2', projectId: 'p1', name: 'Structural Drawings - Steel Package Rev C.pdf', category: 'Drawing', version: 'C', uploadedBy: 'David Reyes', uploadedDate: d(-100), approvalStatus: 'Approved', sizeKb: 15320 },
  { id: 'doc3', projectId: 'p1', name: 'Building Permit - City of Tacoma.pdf', category: 'Permit', version: '1.0', uploadedBy: 'David Reyes', uploadedDate: d(-145), approvalStatus: 'Approved', sizeKb: 1120 },
  { id: 'doc4', projectId: 'p1', name: 'Monthly Progress Report - June 2026.pdf', category: 'Report', version: '1.0', uploadedBy: 'David Reyes', uploadedDate: d(-16), approvalStatus: 'Approved', sizeKb: 3040 },
  { id: 'doc5', projectId: 'p1', name: 'Site Progress Photos - Envelope.zip', category: 'Photo', version: '1.0', uploadedBy: 'Ben Torres', uploadedDate: d(-4), approvalStatus: 'Pending', sizeKb: 48200 },
  { id: 'doc6', projectId: 'p2', name: 'AIA A101 Owner-Contractor Agreement.pdf', category: 'Contract', version: '1.0', uploadedBy: 'Elena Cruz', uploadedDate: d(-220), approvalStatus: 'Approved', sizeKb: 790 },
  { id: 'doc7', projectId: 'p2', name: 'MEP Drawings - Imaging Suite Rev D.pdf', category: 'Drawing', version: 'D', uploadedBy: 'Priya Nair', uploadedDate: d(-50), approvalStatus: 'Approved', sizeKb: 21400 },
  { id: 'doc8', projectId: 'p2', name: 'RF Shielding Change Order Backup.pdf', category: 'Billing', version: '1.0', uploadedBy: 'Priya Nair', uploadedDate: d(-55), approvalStatus: 'Approved', sizeKb: 980 },
  { id: 'doc9', projectId: 'p3', name: 'Board Resolution - Contract Award.pdf', category: 'Contract', version: '1.0', uploadedBy: 'David Reyes', uploadedDate: d(-18), approvalStatus: 'Approved', sizeKb: 340 },
  { id: 'doc10', projectId: 'p6', name: 'Fire/Life Safety Final Inspection Checklist.pdf', category: 'Report', version: '2.0', uploadedBy: 'Priya Nair', uploadedDate: d(-2), approvalStatus: 'Pending', sizeKb: 220 },
];

// ---------- CAD Files ----------
export const CAD_FILES: CadFile[] = [
  {
    id: 'cad1', projectId: 'p1', name: 'Site Plan - Overall Layout.dwg', discipline: 'Civil', fileType: 'DWG',
    version: '3', uploadedBy: 'David Reyes', uploadedDate: d(-95), approvalStatus: 'Approved', sizeKb: 8420,
    sheet: 'C-101', units: 'Millimeters', reviewStatus: 'In Review',
    layers: ['Grid', 'Site Boundary', 'Building Footprint', 'Utilities', 'Paving', 'Dimensions'],
    threads: [
      {
        id: 'thread-seed-1', page: 1, x: 0.67, y: 0.38, title: 'Confirm fire lane clearance', status: 'Open',
        comments: [
          { id: 'comment-seed-1', author: 'David Reyes', body: 'Please confirm the fire lane maintains the required clear width beside the loading court.', createdAt: d(-3) },
          { id: 'comment-seed-2', author: 'Ben Torres', body: 'Checking this against the latest civil notes and turning template.', createdAt: d(-2) },
        ],
      },
      {
        id: 'thread-seed-2', page: 1, x: 0.31, y: 0.71, title: 'Utility conflict coordinated', status: 'Resolved',
        comments: [{ id: 'comment-seed-3', author: 'David Reyes', body: 'Storm line alignment updated to clear the footing. Resolved in Rev 3.', createdAt: d(-7) }],
      },
    ],
    markups: [
      { id: 'markup-seed-1', page: 1, type: 'rectangle', x1: 0.57, y1: 0.27, x2: 0.77, y2: 0.49, color: '#ff6b73', createdBy: 'David Reyes', createdAt: d(-3) },
      { id: 'markup-seed-2', page: 1, type: 'measure', x1: 0.22, y1: 0.64, x2: 0.42, y2: 0.64, color: '#ff6b73', createdBy: 'David Reyes', createdAt: d(-3) },
    ],
    reviewHistory: [{ id: 'review-seed-1', action: 'Review saved', user: 'David Reyes', timestamp: d(-3), details: 'Coordination review with civil and structural teams' }],
    versionHistory: [
      { version: '1', date: d(-140), uploadedBy: 'David Reyes', notes: 'Initial site layout' },
      { version: '2', date: d(-112), uploadedBy: 'David Reyes', notes: 'Revised dock door count' },
      { version: '3', date: d(-95), uploadedBy: 'David Reyes', notes: 'Added yard lighting layout' },
    ],
  },
  {
    id: 'cad2', projectId: 'p1', name: 'Structural Framing Plan - Level 1.dwg', discipline: 'Structural', fileType: 'DWG',
    version: '2', uploadedBy: 'Ben Torres', uploadedDate: d(-80), approvalStatus: 'Approved', sizeKb: 12100,
    sheet: 'S-201', units: 'Millimeters', reviewStatus: 'Submitted', submissionTarget: 'Client', submittedAt: d(-70), submittedBy: 'David Reyes',
    layers: ['Grid', 'Columns', 'Beams', 'Purlins', 'Dimensions', 'Notes'],
    threads: [], markups: [],
    reviewHistory: [{ id: 'review-seed-2', action: 'Submitted', user: 'David Reyes', timestamp: d(-70), details: 'Submitted to Client' }],
    versionHistory: [
      { version: '1', date: d(-102), uploadedBy: 'Ben Torres', notes: 'Initial framing plan' },
      { version: '2', date: d(-80), uploadedBy: 'Ben Torres', notes: 'Updated purlin spacing per erection review' },
    ],
  },
  {
    id: 'cad3', projectId: 'p1', name: 'Office Annex - Electrical Rough-In.rvt', discipline: 'Electrical', fileType: 'RVT',
    version: '1', uploadedBy: 'Ben Torres', uploadedDate: d(-6), approvalStatus: 'Pending', sizeKb: 24300,
    layers: ['Grid', 'Panel Boards', 'Conduit Runs', 'Lighting', 'Fire Alarm', 'Dimensions'],
    versionHistory: [
      { version: '1', date: d(-6), uploadedBy: 'Ben Torres', notes: 'Coordinated with dock leveler PO' },
    ],
  },
  {
    id: 'cad4', projectId: 'p2', name: 'Imaging Suite - RF Shielding Layout.dwg', discipline: 'Architectural', fileType: 'DWG',
    version: '4', uploadedBy: 'Priya Nair', uploadedDate: d(-48), approvalStatus: 'Approved', sizeKb: 9870,
    layers: ['Grid', 'Walls', 'Shielding Panels', 'Doors', 'Dimensions', 'Notes'],
    versionHistory: [
      { version: '3', date: d(-58), uploadedBy: 'Priya Nair', notes: 'Original shielding layout' },
      { version: '4', date: d(-48), uploadedBy: 'Priya Nair', notes: 'Added second shielding layer per change order' },
    ],
  },
  {
    id: 'cad5', projectId: 'p2', name: 'Level 3 - MEP Coordination Model.ifc', discipline: 'Mechanical', fileType: 'IFC',
    version: '2', uploadedBy: 'Priya Nair', uploadedDate: d(-20), approvalStatus: 'Approved', sizeKb: 41200,
    layers: ['Grid', 'Ductwork', 'Piping', 'Electrical Conduit', 'Structure', 'Clash Markers'],
    versionHistory: [
      { version: '1', date: d(-40), uploadedBy: 'Priya Nair', notes: 'Initial coordination model' },
      { version: '2', date: d(-20), uploadedBy: 'Priya Nair', notes: 'Resolved 12 clashes with structural steel' },
    ],
  },
  {
    id: 'cad6', projectId: 'p3', name: 'Classroom Wing A - Floor Plan.dwg', discipline: 'Architectural', fileType: 'DWG',
    version: '2', uploadedBy: 'David Reyes', uploadedDate: d(-9), approvalStatus: 'Pending', sizeKb: 6540,
    layers: ['Grid', 'Walls', 'Doors & Windows', 'Furniture', 'Dimensions'],
    versionHistory: [
      { version: '1', date: d(-16), uploadedBy: 'David Reyes', notes: 'Permit submission set' },
      { version: '2', date: d(-9), uploadedBy: 'David Reyes', notes: 'Accessibility upgrade revisions' },
    ],
  },
  {
    id: 'cad7', projectId: 'p5', name: 'Truck Court - Paving & Drainage Plan.dwg', discipline: 'Civil', fileType: 'DWG',
    version: '3', uploadedBy: 'David Reyes', uploadedDate: d(-4), approvalStatus: 'Pending', sizeKb: 7320,
    layers: ['Grid', 'Paving', 'Drainage', 'Striping', 'Dimensions'],
    versionHistory: [
      { version: '1', date: d(-55), uploadedBy: 'David Reyes', notes: 'Original truck court design' },
      { version: '2', date: d(-30), uploadedBy: 'David Reyes', notes: 'Client-requested redesign draft' },
      { version: '3', date: d(-4), uploadedBy: 'David Reyes', notes: 'Resubmission for permit amendment' },
    ],
  },
  {
    id: 'cad8', projectId: 'p6', name: 'Clubhouse - Landscape Plan.dwg', discipline: 'Landscape', fileType: 'DWG',
    version: '1', uploadedBy: 'Priya Nair', uploadedDate: d(-40), approvalStatus: 'Approved', sizeKb: 5210,
    layers: ['Grid', 'Planting Beds', 'Hardscape', 'Irrigation', 'Dimensions'],
    versionHistory: [
      { version: '1', date: d(-40), uploadedBy: 'Priya Nair', notes: 'Final landscape design' },
    ],
  },
];

// ---------- Purchase Orders ----------
export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'po1', projectId: 'p1', poNumber: 'PO-1042', supplier: 'PacWest Steel Supply', items: 'Structural steel purlins, 12 tons', amount: 186000, status: 'Delivered', requestedDate: d(-110), deliveryDate: d(-90), linkedPhase: 'Steel Erection' },
  { id: 'po2', projectId: 'p1', poNumber: 'PO-1088', supplier: 'Northwest Dock Equipment', items: 'Dock levelers (x8)', amount: 214000, status: 'Ordered', requestedDate: d(-20), deliveryDate: d(15), linkedPhase: 'MEP Rough-In' },
  { id: 'po3', projectId: 'p1', poNumber: 'PO-1095', supplier: 'Cascade Electrical Supply', items: 'Panel boards & gear', amount: 92500, status: 'Requested', requestedDate: d(-2), deliveryDate: d(25), linkedPhase: 'MEP Rough-In' },
  { id: 'po4', projectId: 'p2', poNumber: 'PO-2210', supplier: 'MedShield Systems', items: 'RF shielding panels', amount: 340000, status: 'Delivered', requestedDate: d(-58), deliveryDate: d(-40), linkedPhase: 'MEP & Medical Systems' },
  { id: 'po5', projectId: 'p2', poNumber: 'PO-2245', supplier: 'Pinnacle Drywall Inc.', items: 'Drywall & finishing materials', amount: 118000, status: 'Approved', requestedDate: d(-6), deliveryDate: d(4), linkedPhase: 'Interior Finishes' },
  { id: 'po6', projectId: 'p5', poNumber: 'PO-3050', supplier: 'Titan Concrete Supply', items: 'Ready-mix concrete, tilt-up panels', amount: 620000, status: 'Requested', requestedDate: d(-5), deliveryDate: d(30), linkedPhase: 'Tilt-up Panel Erection' },
  { id: 'po7', projectId: 'p6', poNumber: 'PO-4090', supplier: 'Summit Fire Protection', items: 'Fire alarm devices - final punch', amount: 24500, status: 'Delivered', requestedDate: d(-15), deliveryDate: d(-6), linkedPhase: 'Final Inspections & Handover' },
];

// ---------- Materials ----------
export const MATERIALS: MaterialItem[] = [
  { id: 'mat1', projectId: 'p1', name: 'Structural Steel Purlins', unit: 'ton', requestedQty: 12, receivedQty: 12, issuedQty: 12, storageLocation: 'Site Laydown A', supplier: 'PacWest Steel Supply', unitCost: 1550, deliveryDate: d(-90), lowStock: false },
  { id: 'mat2', projectId: 'p1', name: 'Dock Levelers', unit: 'unit', requestedQty: 8, receivedQty: 4, issuedQty: 4, storageLocation: 'Warehouse Bay 2', supplier: 'Northwest Dock Equipment', unitCost: 26750, deliveryDate: d(15), lowStock: true },
  { id: 'mat3', projectId: 'p1', name: 'Electrical Panel Boards', unit: 'unit', requestedQty: 6, receivedQty: 0, issuedQty: 0, storageLocation: 'Warehouse Bay 1', supplier: 'Cascade Electrical Supply', unitCost: 15400, deliveryDate: d(25), lowStock: true },
  { id: 'mat4', projectId: 'p2', name: 'RF Shielding Panels', unit: 'sheet', requestedQty: 140, receivedQty: 140, issuedQty: 132, storageLocation: 'Level 3 Storage', supplier: 'MedShield Systems', unitCost: 2400, deliveryDate: d(-40), lowStock: false },
  { id: 'mat5', projectId: 'p2', name: 'Drywall Sheets 5/8in Type X', unit: 'sheet', requestedQty: 900, receivedQty: 620, issuedQty: 580, storageLocation: 'Level 2-3 Storage', supplier: 'Pinnacle Drywall Inc.', unitCost: 18, deliveryDate: d(4), lowStock: true },
  { id: 'mat6', projectId: 'p5', name: 'Ready-Mix Concrete', unit: 'cu yd', requestedQty: 2200, receivedQty: 0, issuedQty: 0, storageLocation: 'N/A - Direct Pour', supplier: 'Titan Concrete Supply', unitCost: 168, deliveryDate: d(30), lowStock: false },
  { id: 'mat7', projectId: 'p6', name: 'Fire Alarm Devices', unit: 'unit', requestedQty: 210, receivedQty: 210, issuedQty: 205, storageLocation: 'Clubhouse Storage', supplier: 'Summit Fire Protection', unitCost: 95, deliveryDate: d(-6), lowStock: false },
];

// ---------- Issues / Risks ----------
export const ISSUES: IssueRisk[] = [
  { id: 'i1', projectId: 'p1', type: 'Issue', description: 'MEP subcontractor short-staffed on electrical crew, slowing rough-in', owner: 'David Reyes', impact: 'High', severity: 'High', status: 'Open', dueDate: d(7), mitigation: 'Requesting subcontractor add second crew; evaluating backup electrical sub.', attachments: [] },
  { id: 'i2', projectId: 'p1', type: 'Change Order', description: 'Yard lighting upgrade requested by client for security compliance', owner: 'David Reyes', impact: 'Low', severity: 'Low', status: 'In Progress', dueDate: d(10), attachments: ['CO-002 Backup.pdf'] },
  { id: 'i3', projectId: 'p2', type: 'Risk', description: 'RF shielding rework may cascade into TCO inspection delay', owner: 'Priya Nair', impact: 'High', severity: 'Critical', status: 'Open', dueDate: d(5), mitigation: 'Daily coordination with shielding sub; expediting inspector scheduling.', attachments: [] },
  { id: 'i4', projectId: 'p2', type: 'Change Order', description: 'Imaging suite RF shielding upgrade — additional shielding layer', owner: 'Priya Nair', impact: 'Medium', severity: 'Medium', status: 'Closed', dueDate: d(-48), mitigation: 'Approved and completed.', attachments: ['CO-1 Cascade.pdf'] },
  { id: 'i5', projectId: 'p5', type: 'Risk', description: 'Truck court redesign permit amendment may extend hold period beyond 30 days', owner: 'David Reyes', impact: 'Medium', severity: 'Medium', status: 'Open', dueDate: d(15), mitigation: 'Weekly check-ins with city permit office; escalation contact identified.', attachments: [] },
  { id: 'i6', projectId: 'p6', type: 'Issue', description: 'Fire marshal identified minor punch items in Building C stairwell signage', owner: 'Ben Torres', impact: 'Low', severity: 'Low', status: 'In Progress', dueDate: d(3), mitigation: 'Signage reorder placed, install by Friday.', attachments: [] },
];

// ---------- Daily Logs ----------
export const DAILY_LOGS: DailyLog[] = [
  { id: 'dl1', projectId: 'p1', date: d(-1), submittedBy: 'Ben Torres', workCompleted: 'Continued envelope flashing on north elevation; electrical crew completed panel rough-in for office annex ground floor.', workforceCount: 24, materialsUsed: 'Flashing membrane, electrical conduit', equipmentUsed: 'Scissor lift, boom lift', weather: 'Overcast, 62°F', problems: 'Electrical crew still short 2 journeymen', nextActivities: 'Continue flashing, start office annex 2nd floor rough-in', photos: 6 },
  { id: 'dl2', projectId: 'p1', date: d(-2), submittedBy: 'Ben Torres', workCompleted: 'Envelope flashing north elevation continued; dock leveler pit prep started.', workforceCount: 22, materialsUsed: 'Flashing membrane, concrete for pits', equipmentUsed: 'Scissor lift, mini excavator', weather: 'Light rain, 58°F', nextActivities: 'Complete pit forms, continue flashing', photos: 4 },
  { id: 'dl3', projectId: 'p2', date: d(-1), submittedBy: 'Priya Nair', workCompleted: 'RF shielding rework 80% complete on Level 3; drywall crew mobilized for closeout.', workforceCount: 18, materialsUsed: 'RF shielding panels, drywall sheets', equipmentUsed: 'Material lift', weather: 'Clear, 68°F', problems: 'Drywall closeout paused pending shielding sign-off', nextActivities: 'Complete shielding rework, begin drywall closeout', photos: 8 },
  { id: 'dl4', projectId: 'p6', date: d(-1), submittedBy: 'Ben Torres', workCompleted: 'Punch list items closed in Building C common areas; fire marshal walkthrough prep.', workforceCount: 12, materialsUsed: 'Paint, signage hardware', equipmentUsed: 'None', weather: 'Clear, 71°F', nextActivities: 'Finalize signage install, host fire marshal walkthrough', photos: 5 },
];

// ---------- Bids ----------
export const BIDS: Bid[] = [
  {
    id: 'b1', reference: 'BID-2026-201', title: 'Evergreen Corporate Campus - Building 3', client: 'Evergreen Tech Holdings',
    clientContact: 'Rachel Kim — Director of Real Estate', location: 'Redmond, WA',
    description: 'New-build 220,000 sq ft office building, shell and core plus tenant improvements for anchor tenant.',
    source: 'Direct Invitation', bidOwner: 'Jonathan Lee', estimatedValue: 42000000, submissionDeadline: d(18),
    stage: 'Cost Estimation', probability: 55, competitors: ['Cornerstone Builders', 'Apex Construction Group'],
    nextAction: 'Finalize subcontractor quotes for MEP package by Friday',
    requirements: [
      { id: 'r1', bidId: 'b1', requirement: 'Bonding capacity letter', responsible: 'Karl Mendoza', dueDate: d(5), completed: true, requiredDocument: 'Surety Letter', mandatory: true },
      { id: 'r2', bidId: 'b1', requirement: 'Safety record (EMR) documentation', responsible: 'Jonathan Lee', dueDate: d(6), completed: true, requiredDocument: 'OSHA 300 Logs', mandatory: true },
      { id: 'r3', bidId: 'b1', requirement: 'Technical proposal narrative', responsible: 'Sofia Bautista', dueDate: d(12), completed: false, requiredDocument: 'Technical Proposal', mandatory: true },
      { id: 'r4', bidId: 'b1', requirement: 'Reference project list (5 similar projects)', responsible: 'Jonathan Lee', dueDate: d(8), completed: false, mandatory: true },
    ],
    costEstimates: [
      { id: 'ce1', version: 1, date: d(-10), updatedBy: 'Sofia Bautista', proposedPrice: 39800000, lines: [
        { id: 'l1', category: 'Labor', amount: 11200000 }, { id: 'l2', category: 'Materials', amount: 14500000 },
        { id: 'l3', category: 'Equipment', amount: 3100000 }, { id: 'l4', category: 'Subcontractors', amount: 6800000 },
        { id: 'l5', category: 'Logistics', amount: 900000 }, { id: 'l6', category: 'Overhead', amount: 1600000 },
        { id: 'l7', category: 'Taxes', amount: 800000 }, { id: 'l8', category: 'Contingency', amount: 700000 },
        { id: 'l9', category: 'Markup', amount: 200000 },
      ] },
    ],
    documents: [
      { id: 'bd1', bidId: 'b1', name: 'Invitation to Bid - Evergreen Bldg 3.pdf', category: 'Invitation to Bid', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-25) },
      { id: 'bd2', bidId: 'b1', name: 'Scope of Work Rev A.pdf', category: 'Scope of Work', version: 'A', uploadedBy: 'Jonathan Lee', uploadedDate: d(-24) },
      { id: 'bd3', bidId: 'b1', name: 'Bill of Quantities.xlsx', category: 'Bill of Quantities', version: '1.0', uploadedBy: 'Sofia Bautista', uploadedDate: d(-15) },
    ],
    assignments: [
      { id: 'a1', bidId: 'b1', role: 'Bid Manager', person: 'Jonathan Lee' },
      { id: 'a2', bidId: 'b1', role: 'Estimator', person: 'Sofia Bautista', assignedRequirement: 'Technical proposal narrative', dueDate: d(12) },
      { id: 'a3', bidId: 'b1', role: 'Approver', person: 'Elena Cruz' },
    ],
    clarifications: [
      { id: 'cl1', bidId: 'b1', type: 'Pre-bid Meeting', date: d(-20), author: 'Jonathan Lee', content: 'Attended pre-bid meeting; confirmed LEED Gold target and phased occupancy requirement.' },
      { id: 'cl2', bidId: 'b1', type: 'Client Question', date: d(-14), author: 'Rachel Kim', content: 'Can substitution of curtain wall system be proposed as an alternate?' },
      { id: 'cl3', bidId: 'b1', type: 'Company Response', date: d(-13), author: 'Sofia Bautista', content: 'Yes, alternate curtain wall pricing will be included as a separate line item in the financial proposal.' },
    ],
    approvals: [
      { id: 'ap1', bidId: 'b1', type: 'Technical', approver: 'Elena Cruz', decision: 'Pending' },
      { id: 'ap2', bidId: 'b1', type: 'Financial', approver: 'Karl Mendoza', decision: 'Pending' },
      { id: 'ap3', bidId: 'b1', type: 'Management', approver: 'Elena Cruz', decision: 'Pending' },
    ],
    goNoGo: { strategicFit: 4, clientRelationship: 3, availableCapacity: 3, technicalCapability: 5, profitability: 4, competition: 2, submissionTime: 3, commercialLegalRisk: 4, recommendation: 'Go', notes: 'Strong technical fit; capacity is tight given Riverside and Cascade both active.', assessedBy: 'Elena Cruz', assessedDate: d(-22) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Lead / Opportunity', newStatus: 'For Review', updatedBy: 'Jonathan Lee', timestamp: d(-26) + 'T09:00' },
      { id: 'sh2', previousStatus: 'For Review', newStatus: 'Go/No-Go Decision', updatedBy: 'Jonathan Lee', timestamp: d(-23) + 'T09:00' },
      { id: 'sh3', previousStatus: 'Go/No-Go Decision', newStatus: 'Preparing Requirements', updatedBy: 'Elena Cruz', timestamp: d(-22) + 'T14:00', reason: 'Go decision approved' },
      { id: 'sh4', previousStatus: 'Preparing Requirements', newStatus: 'Cost Estimation', updatedBy: 'Jonathan Lee', timestamp: d(-11) + 'T09:00' },
    ],
    createdAt: d(-27) + 'T08:00', updatedAt: d(-1) + 'T10:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b2', reference: 'BID-2026-198', title: 'Willow Creek Water Treatment Facility Upgrade', client: 'City of Willow Creek',
    clientContact: 'Marcus Bell — Public Works Director', location: 'Willow Creek, WA',
    description: 'Municipal water treatment plant upgrade including new filtration building and pump station.',
    source: 'Public Tender', bidOwner: 'Jonathan Lee', estimatedValue: 16500000, submissionDeadline: d(4),
    stage: 'Internal Review', probability: 40, competitors: ['Municipal Infrastructure LLC'],
    nextAction: 'Complete internal review comments before submission prep',
    requirements: [
      { id: 'r1', bidId: 'b2', requirement: 'Prevailing wage certification', responsible: 'Karl Mendoza', dueDate: d(-2), completed: true, mandatory: true },
      { id: 'r2', bidId: 'b2', requirement: 'DBE participation plan', responsible: 'Jonathan Lee', dueDate: d(1), completed: false, mandatory: true },
      { id: 'r3', bidId: 'b2', requirement: 'Bid bond (5%)', responsible: 'Karl Mendoza', dueDate: d(3), completed: false, requiredDocument: 'Bid Bond', mandatory: true },
    ],
    costEstimates: [
      { id: 'ce1', version: 1, date: d(-8), updatedBy: 'Sofia Bautista', proposedPrice: 15900000, lines: [
        { id: 'l1', category: 'Labor', amount: 4800000 }, { id: 'l2', category: 'Materials', amount: 5600000 },
        { id: 'l3', category: 'Equipment', amount: 1900000 }, { id: 'l4', category: 'Subcontractors', amount: 2100000 },
        { id: 'l5', category: 'Logistics', amount: 400000 }, { id: 'l6', category: 'Overhead', amount: 600000 },
        { id: 'l7', category: 'Taxes', amount: 300000 }, { id: 'l8', category: 'Contingency', amount: 200000 },
      ] },
    ],
    documents: [
      { id: 'bd1', bidId: 'b2', name: 'Public Tender Notice.pdf', category: 'Invitation to Bid', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-30) },
      { id: 'bd2', bidId: 'b2', name: 'Terms of Reference.pdf', category: 'Terms of Reference', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-30) },
    ],
    assignments: [
      { id: 'a1', bidId: 'b2', role: 'Bid Manager', person: 'Jonathan Lee' },
      { id: 'a2', bidId: 'b2', role: 'Estimator', person: 'Sofia Bautista' },
    ],
    clarifications: [
      { id: 'cl1', bidId: 'b2', type: 'Addendum', date: d(-6), author: 'Marcus Bell', content: 'Addendum 1 issued: extended filtration warranty period from 2 to 5 years.' },
    ],
    approvals: [
      { id: 'ap1', bidId: 'b2', type: 'Technical', approver: 'Elena Cruz', decision: 'Pending' },
      { id: 'ap2', bidId: 'b2', type: 'Financial', approver: 'Karl Mendoza', decision: 'Pending' },
    ],
    goNoGo: { strategicFit: 3, clientRelationship: 2, availableCapacity: 3, technicalCapability: 4, profitability: 3, competition: 3, submissionTime: 2, commercialLegalRisk: 3, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-25) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Lead / Opportunity', newStatus: 'Cost Estimation', updatedBy: 'Jonathan Lee', timestamp: d(-20) + 'T09:00' },
      { id: 'sh2', previousStatus: 'Cost Estimation', newStatus: 'Internal Review', updatedBy: 'Jonathan Lee', timestamp: d(-3) + 'T09:00' },
    ],
    createdAt: d(-32) + 'T08:00', updatedAt: d(-1) + 'T11:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b3', reference: 'BID-2026-205', title: 'Pinecrest Assisted Living Expansion', client: 'Pinecrest Senior Living',
    clientContact: 'Diane Foster — VP Development', location: 'Olympia, WA',
    description: 'Second-phase expansion adding 48 units and expanded commercial kitchen.',
    source: 'Referral', bidOwner: 'Jonathan Lee', estimatedValue: 11200000, submissionDeadline: d(2),
    stage: 'Ready for Submission', probability: 65, competitors: [],
    nextAction: 'Final submission package assembly and courier scheduling',
    requirements: [
      { id: 'r1', bidId: 'b3', requirement: 'Financial proposal sign-off', responsible: 'Karl Mendoza', dueDate: d(1), completed: true, mandatory: true },
      { id: 'r2', bidId: 'b3', requirement: 'Technical proposal final copy', responsible: 'Sofia Bautista', dueDate: d(1), completed: true, mandatory: true },
    ],
    costEstimates: [
      { id: 'ce1', version: 2, date: d(-2), updatedBy: 'Sofia Bautista', proposedPrice: 10650000, lines: [
        { id: 'l1', category: 'Labor', amount: 3200000 }, { id: 'l2', category: 'Materials', amount: 4100000 },
        { id: 'l3', category: 'Equipment', amount: 900000 }, { id: 'l4', category: 'Subcontractors', amount: 1500000 },
        { id: 'l5', category: 'Overhead', amount: 500000 }, { id: 'l6', category: 'Contingency', amount: 300000 }, { id: 'l7', category: 'Markup', amount: 150000 },
      ] },
    ],
    documents: [
      { id: 'bd1', bidId: 'b3', name: 'Technical Proposal - Final.pdf', category: 'Technical Proposal', version: '2.0', uploadedBy: 'Sofia Bautista', uploadedDate: d(-2) },
      { id: 'bd2', bidId: 'b3', name: 'Financial Proposal - Final.pdf', category: 'Financial Proposal', version: '2.0', uploadedBy: 'Karl Mendoza', uploadedDate: d(-1) },
    ],
    assignments: [
      { id: 'a1', bidId: 'b3', role: 'Bid Manager', person: 'Jonathan Lee' },
    ],
    clarifications: [],
    approvals: [
      { id: 'ap1', bidId: 'b3', type: 'Technical', approver: 'Elena Cruz', date: d(-3), decision: 'Approved' },
      { id: 'ap2', bidId: 'b3', type: 'Financial', approver: 'Karl Mendoza', date: d(-2), decision: 'Approved' },
      { id: 'ap3', bidId: 'b3', type: 'Management', approver: 'Elena Cruz', date: d(-1), decision: 'Approved' },
    ],
    goNoGo: { strategicFit: 5, clientRelationship: 5, availableCapacity: 4, technicalCapability: 4, profitability: 4, competition: 5, submissionTime: 4, commercialLegalRisk: 4, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-18) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Internal Review', newStatus: 'For Approval', updatedBy: 'Jonathan Lee', timestamp: d(-4) + 'T09:00' },
      { id: 'sh2', previousStatus: 'For Approval', newStatus: 'Ready for Submission', updatedBy: 'Elena Cruz', timestamp: d(-1) + 'T15:00', reason: 'All approvals received' },
    ],
    createdAt: d(-19) + 'T08:00', updatedAt: d(-1) + 'T15:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b4', reference: 'BID-2026-190', title: 'Lakeside Business Park - Phase 2', client: 'Lakeside Properties LLC',
    clientContact: 'Greg Simmons — Managing Partner', location: 'Federal Way, WA',
    description: 'Three-building light industrial business park, phase 2 of existing relationship.',
    source: 'Repeat Client', bidOwner: 'Jonathan Lee', estimatedValue: 19800000, submissionDeadline: d(-5),
    stage: 'Under Evaluation', probability: 50, competitors: ['Cornerstone Builders'],
    nextAction: 'Awaiting client evaluation committee decision',
    requirements: [],
    costEstimates: [
      { id: 'ce1', version: 1, date: d(-20), updatedBy: 'Sofia Bautista', proposedPrice: 19200000, lines: [
        { id: 'l1', category: 'Labor', amount: 5400000 }, { id: 'l2', category: 'Materials', amount: 7200000 },
        { id: 'l3', category: 'Equipment', amount: 1800000 }, { id: 'l4', category: 'Subcontractors', amount: 3200000 },
        { id: 'l5', category: 'Overhead', amount: 800000 }, { id: 'l6', category: 'Contingency', amount: 500000 }, { id: 'l7', category: 'Markup', amount: 300000 },
      ] },
    ],
    documents: [
      { id: 'bd1', bidId: 'b4', name: 'Submitted Proposal Package.pdf', category: 'Submission', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-5) },
      { id: 'bd2', bidId: 'b4', name: 'Client Acknowledgment Receipt.pdf', category: 'Acknowledgment', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-5) },
    ],
    assignments: [{ id: 'a1', bidId: 'b4', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [
      { id: 'cl1', bidId: 'b4', type: 'Internal Note', date: d(-4), author: 'Jonathan Lee', content: 'Client indicated evaluation committee meets bi-weekly; decision expected within 3-4 weeks.', followUpDate: d(10) },
    ],
    approvals: [
      { id: 'ap1', bidId: 'b4', type: 'Technical', approver: 'Elena Cruz', date: d(-7), decision: 'Approved' },
      { id: 'ap2', bidId: 'b4', type: 'Financial', approver: 'Karl Mendoza', date: d(-6), decision: 'Approved' },
      { id: 'ap3', bidId: 'b4', type: 'Management', approver: 'Elena Cruz', date: d(-6), decision: 'Approved' },
    ],
    goNoGo: { strategicFit: 5, clientRelationship: 5, availableCapacity: 3, technicalCapability: 5, profitability: 4, competition: 3, submissionTime: 4, commercialLegalRisk: 5, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-25) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Ready for Submission', newStatus: 'Submitted', updatedBy: 'Jonathan Lee', timestamp: d(-5) + 'T09:00' },
      { id: 'sh2', previousStatus: 'Submitted', newStatus: 'Under Evaluation', updatedBy: 'Jonathan Lee', timestamp: d(-4) + 'T09:00' },
    ],
    createdAt: d(-30) + 'T08:00', updatedAt: d(-4) + 'T09:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b5', reference: 'BID-2026-183', title: 'Copper Ridge Mixed-Use Development', client: 'Copper Ridge Ventures',
    clientContact: 'Nina Alvarez — Development Director', location: 'Spokane, WA',
    description: 'Mixed-use retail and residential development, ground-up construction.',
    source: 'Public Tender', bidOwner: 'Jonathan Lee', estimatedValue: 28500000, submissionDeadline: d(-30),
    stage: 'Lost', probability: 0, competitors: ['Cornerstone Builders', 'Apex Construction Group', 'Municipal Infrastructure LLC'],
    nextAction: 'Closed - lessons learned documented',
    requirements: [], costEstimates: [
      { id: 'ce1', version: 1, date: d(-45), updatedBy: 'Sofia Bautista', proposedPrice: 27800000, lines: [
        { id: 'l1', category: 'Labor', amount: 8200000 }, { id: 'l2', category: 'Materials', amount: 10500000 },
        { id: 'l3', category: 'Subcontractors', amount: 5600000 }, { id: 'l4', category: 'Overhead', amount: 1800000 }, { id: 'l5', category: 'Markup', amount: 1700000 },
      ] },
    ],
    documents: [{ id: 'bd1', bidId: 'b5', name: 'Submitted Proposal Package.pdf', category: 'Submission', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-32) }],
    assignments: [{ id: 'a1', bidId: 'b5', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [],
    approvals: [
      { id: 'ap1', bidId: 'b5', type: 'Technical', approver: 'Elena Cruz', date: d(-35), decision: 'Approved' },
      { id: 'ap2', bidId: 'b5', type: 'Financial', approver: 'Karl Mendoza', date: d(-34), decision: 'Approved' },
    ],
    goNoGo: { strategicFit: 4, clientRelationship: 2, availableCapacity: 3, technicalCapability: 4, profitability: 3, competition: 2, submissionTime: 3, commercialLegalRisk: 3, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-50) },
    result: { outcome: 'Lost', finalAmount: 27800000, winningAmount: 26400000, competitorInfo: 'Apex Construction Group won with lower price and faster schedule commitment.', reason: 'Price gap of ~5%; competitor offered accelerated 4-month schedule.', lessonsLearned: 'Explore prefabrication options to compress schedule and improve price competitiveness on future mixed-use bids.' },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Submitted', newStatus: 'Under Evaluation', updatedBy: 'Jonathan Lee', timestamp: d(-28) + 'T09:00' },
      { id: 'sh2', previousStatus: 'Under Evaluation', newStatus: 'Lost', updatedBy: 'Jonathan Lee', timestamp: d(-15) + 'T09:00', reason: 'Client selected competing bid' },
    ],
    createdAt: d(-55) + 'T08:00', updatedAt: d(-15) + 'T09:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b6', reference: 'BID-2026-210', title: 'Meridian Cold Storage Facility', client: 'Meridian Freight Corp',
    clientContact: 'Laura Chen — VP Facilities', location: 'Fife, WA',
    description: 'New cold storage and freezer warehouse facility, repeat client from Riverside Logistics Hub.',
    source: 'Repeat Client', bidOwner: 'Jonathan Lee', estimatedValue: 22000000, submissionDeadline: d(35),
    stage: 'Preparing Requirements', probability: 60, competitors: [],
    nextAction: 'Assign estimator and gather subcontractor pricing for refrigeration package',
    requirements: [
      { id: 'r1', bidId: 'b6', requirement: 'Bonding capacity confirmation', responsible: 'Karl Mendoza', dueDate: d(10), completed: false, mandatory: true },
      { id: 'r2', bidId: 'b6', requirement: 'Refrigeration subcontractor pre-qualification', responsible: 'Jonathan Lee', dueDate: d(15), completed: false, mandatory: true },
    ],
    costEstimates: [], documents: [
      { id: 'bd1', bidId: 'b6', name: 'Invitation to Bid.pdf', category: 'Invitation to Bid', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-5) },
    ],
    assignments: [{ id: 'a1', bidId: 'b6', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [
      { id: 'cl1', bidId: 'b6', type: 'Internal Note', date: d(-3), author: 'Jonathan Lee', content: 'Strong repeat-client relationship from Riverside project; client explicitly requested Greencore bid.' },
    ],
    approvals: [],
    goNoGo: { strategicFit: 5, clientRelationship: 5, availableCapacity: 3, technicalCapability: 3, profitability: 4, competition: 5, submissionTime: 3, commercialLegalRisk: 4, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-6) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Lead / Opportunity', newStatus: 'Go/No-Go Decision', updatedBy: 'Jonathan Lee', timestamp: d(-6) + 'T09:00' },
      { id: 'sh2', previousStatus: 'Go/No-Go Decision', newStatus: 'Preparing Requirements', updatedBy: 'Elena Cruz', timestamp: d(-5) + 'T10:00', reason: 'Go decision approved' },
    ],
    createdAt: d(-8) + 'T08:00', updatedAt: d(-3) + 'T09:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b7', reference: 'BID-2025-118', title: 'Harborview Elementary Renovation', client: 'Harborview School District',
    clientContact: 'Nancy Ortiz — Facilities Director', location: 'Everett, WA',
    description: 'Phased renovation of classroom wings, new gymnasium roof, and accessibility upgrades.',
    source: 'Public Tender', bidOwner: 'Jonathan Lee', estimatedValue: 6600000, submissionDeadline: d(-45),
    stage: 'Awarded', probability: 100, competitors: ['Municipal Infrastructure LLC'],
    nextAction: 'Converted to active project GB-2026-003',
    requirements: [], costEstimates: [
      { id: 'ce1', version: 1, date: d(-60), updatedBy: 'Sofia Bautista', proposedPrice: 6400000, lines: [
        { id: 'l1', category: 'Labor', amount: 2100000 }, { id: 'l2', category: 'Materials', amount: 2400000 },
        { id: 'l3', category: 'Subcontractors', amount: 1000000 }, { id: 'l4', category: 'Overhead', amount: 400000 }, { id: 'l5', category: 'Markup', amount: 500000 },
      ] },
    ],
    documents: [{ id: 'bd1', bidId: 'b7', name: 'Submitted Proposal Package.pdf', category: 'Submission', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-46) }],
    assignments: [{ id: 'a1', bidId: 'b7', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [],
    approvals: [
      { id: 'ap1', bidId: 'b7', type: 'Technical', approver: 'Elena Cruz', date: d(-50), decision: 'Approved' },
      { id: 'ap2', bidId: 'b7', type: 'Financial', approver: 'Karl Mendoza', date: d(-49), decision: 'Approved' },
      { id: 'ap3', bidId: 'b7', type: 'Management', approver: 'Elena Cruz', date: d(-48), decision: 'Approved' },
    ],
    goNoGo: { strategicFit: 4, clientRelationship: 4, availableCapacity: 4, technicalCapability: 4, profitability: 3, competition: 4, submissionTime: 4, commercialLegalRisk: 4, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-62) },
    result: { outcome: 'Awarded', finalAmount: 6400000, winningAmount: 6400000, reason: 'Best value proposal with strong occupied-campus phasing plan.', lessonsLearned: 'Phasing plan presentation was a key differentiator; reuse template for future school district bids.' },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Under Evaluation', newStatus: 'Negotiation', updatedBy: 'Jonathan Lee', timestamp: d(-25) + 'T09:00' },
      { id: 'sh2', previousStatus: 'Negotiation', newStatus: 'Awarded', updatedBy: 'Jonathan Lee', timestamp: d(-19) + 'T09:00', reason: 'Board approved contract award' },
    ],
    createdAt: d(-65) + 'T08:00', updatedAt: d(-18) + 'T08:00', createdBy: 'Jonathan Lee',
    convertedProjectId: 'p3', convertedBy: 'David Reyes', convertedAt: d(-18) + 'T08:00',
  },
  {
    id: 'b8', reference: 'BID-2026-215', title: 'Blue Heron Office Park Renovation', client: 'Blue Heron Realty Trust',
    clientContact: 'Wendy Park — Asset Manager', location: 'Bothell, WA',
    description: 'Interior modernization and seismic retrofit of two existing office buildings.',
    source: 'Direct Invitation', bidOwner: 'Jonathan Lee', estimatedValue: 8900000, submissionDeadline: d(50),
    stage: 'Lead / Opportunity', probability: 25, competitors: [],
    nextAction: 'Schedule initial go/no-go review with management',
    requirements: [], costEstimates: [], documents: [
      { id: 'bd1', bidId: 'b8', name: 'Initial RFI from client.pdf', category: 'Invitation to Bid', version: '1.0', uploadedBy: 'Jonathan Lee', uploadedDate: d(-2) },
    ],
    assignments: [{ id: 'a1', bidId: 'b8', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [], approvals: [],
    stageHistory: [
      { id: 'sh1', previousStatus: 'Lead / Opportunity', newStatus: 'Lead / Opportunity', updatedBy: 'Jonathan Lee', timestamp: d(-2) + 'T09:00', reason: 'Opportunity logged' },
    ],
    createdAt: d(-2) + 'T08:00', updatedAt: d(-2) + 'T08:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b9', reference: 'BID-2026-212', title: 'Granite Falls Water Reservoir', client: 'Granite Falls Utility District',
    clientContact: 'Oscar Reyes — Engineering Manager', location: 'Granite Falls, WA',
    description: 'New 2-million gallon water reservoir and pump station.',
    source: 'Public Tender', bidOwner: 'Jonathan Lee', estimatedValue: 13400000, submissionDeadline: d(-10),
    stage: 'Withdrawn', probability: 0, competitors: [],
    nextAction: 'Withdrawn - insufficient specialty subcontractor availability',
    requirements: [], costEstimates: [], documents: [],
    assignments: [{ id: 'a1', bidId: 'b9', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [
      { id: 'cl1', bidId: 'b9', type: 'Internal Note', date: d(-16), author: 'Jonathan Lee', content: 'Unable to secure specialty reservoir-lining subcontractor within bid timeline; recommending withdrawal.' },
    ],
    approvals: [],
    goNoGo: { strategicFit: 2, clientRelationship: 1, availableCapacity: 2, technicalCapability: 3, profitability: 2, competition: 3, submissionTime: 2, commercialLegalRisk: 3, recommendation: 'No-Go', assessedBy: 'Elena Cruz', assessedDate: d(-17) },
    result: { outcome: 'Withdrawn', reason: 'Could not secure qualified specialty subcontractor for reservoir lining within submission window.', lessonsLearned: 'Pre-qualify specialty subcontractor pool for water infrastructure bids earlier in the pipeline.' },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Preparing Requirements', newStatus: 'Withdrawn', updatedBy: 'Jonathan Lee', timestamp: d(-16) + 'T09:00', reason: 'Subcontractor availability risk too high' },
    ],
    createdAt: d(-40) + 'T08:00', updatedAt: d(-16) + 'T09:00', createdBy: 'Jonathan Lee',
  },
  {
    id: 'b10', reference: 'BID-2026-208', title: 'Alderwood Community Center', client: 'City of Alderwood',
    clientContact: 'Janet Cole — Parks Director', location: 'Alderwood, WA',
    description: 'New 40,000 sq ft community center with gymnasium, pool, and multipurpose rooms.',
    source: 'Public Tender', bidOwner: 'Jonathan Lee', estimatedValue: 17800000, submissionDeadline: d(9),
    stage: 'For Approval', probability: 45, competitors: ['Cornerstone Builders'],
    nextAction: 'Awaiting management approval before submission prep',
    requirements: [
      { id: 'r1', bidId: 'b10', requirement: 'Pool contractor certification', responsible: 'Sofia Bautista', dueDate: d(2), completed: true, mandatory: true },
      { id: 'r2', bidId: 'b10', requirement: 'Public works bond', responsible: 'Karl Mendoza', dueDate: d(4), completed: false, mandatory: true },
    ],
    costEstimates: [
      { id: 'ce1', version: 1, date: d(-6), updatedBy: 'Sofia Bautista', proposedPrice: 17100000, lines: [
        { id: 'l1', category: 'Labor', amount: 5100000 }, { id: 'l2', category: 'Materials', amount: 6200000 },
        { id: 'l3', category: 'Subcontractors', amount: 3400000 }, { id: 'l4', category: 'Overhead', amount: 900000 }, { id: 'l5', category: 'Contingency', amount: 700000 }, { id: 'l6', category: 'Markup', amount: 800000 },
      ] },
    ],
    documents: [{ id: 'bd1', bidId: 'b10', name: 'Technical Proposal Draft.pdf', category: 'Technical Proposal', version: '1.0', uploadedBy: 'Sofia Bautista', uploadedDate: d(-4) }],
    assignments: [{ id: 'a1', bidId: 'b10', role: 'Bid Manager', person: 'Jonathan Lee' }],
    clarifications: [],
    approvals: [
      { id: 'ap1', bidId: 'b10', type: 'Technical', approver: 'Elena Cruz', date: d(-2), decision: 'Approved' },
      { id: 'ap2', bidId: 'b10', type: 'Financial', approver: 'Karl Mendoza', decision: 'Pending' },
      { id: 'ap3', bidId: 'b10', type: 'Management', approver: 'Elena Cruz', decision: 'Pending' },
    ],
    goNoGo: { strategicFit: 4, clientRelationship: 3, availableCapacity: 3, technicalCapability: 4, profitability: 3, competition: 3, submissionTime: 3, commercialLegalRisk: 4, recommendation: 'Go', assessedBy: 'Elena Cruz', assessedDate: d(-14) },
    stageHistory: [
      { id: 'sh1', previousStatus: 'Internal Review', newStatus: 'For Approval', updatedBy: 'Jonathan Lee', timestamp: d(-2) + 'T09:00' },
    ],
    createdAt: d(-16) + 'T08:00', updatedAt: d(-2) + 'T09:00', createdBy: 'Jonathan Lee',
  },
];

// ---------- Notifications ----------
export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'Bid Deadline', title: 'Bid deadline in 2 days', message: 'Pinecrest Assisted Living Expansion (BID-2026-205) submission deadline is approaching.', relatedType: 'bid', relatedId: 'b3', timestamp: d(-1) + 'T08:00', read: false },
  { id: 'n2', type: 'Bid Deadline', title: 'Bid deadline in 4 days', message: 'Willow Creek Water Treatment Facility Upgrade (BID-2026-198) submission deadline is approaching.', relatedType: 'bid', relatedId: 'b2', timestamp: d(-1) + 'T08:05', read: false },
  { id: 'n3', type: 'Overdue Requirement', title: 'Overdue requirement', message: 'DBE participation plan for BID-2026-198 is overdue.', relatedType: 'bid', relatedId: 'b2', timestamp: d(-1) + 'T08:10', read: false },
  { id: 'n4', type: 'Pending Approval', title: 'Financial approval pending', message: 'Alderwood Community Center (BID-2026-208) is awaiting financial approval.', relatedType: 'bid', relatedId: 'b10', timestamp: d(-2) + 'T09:00', read: false },
  { id: 'n5', type: 'Project Delay', title: 'Project marked Delayed', message: 'Cascade Medical Office Building status changed to Delayed.', relatedType: 'project', relatedId: 'p2', timestamp: d(-12) + 'T10:00', read: true },
  { id: 'n6', type: 'Overdue Task', title: 'Task overdue', message: 'Electrical rough-in - Office Annex on Riverside Logistics Hub is overdue.', relatedType: 'task', relatedId: 't2', timestamp: d(-1) + 'T07:00', read: false },
  { id: 'n7', type: 'Budget Overrun', title: 'Budget watch', message: 'Cascade Medical Office Building actual expenses are approaching approved budget.', relatedType: 'project', relatedId: 'p2', timestamp: d(-3) + 'T09:00', read: true },
  { id: 'n8', type: 'Pending Purchase Request', title: 'Purchase request awaiting approval', message: 'PO-1095 (Cascade Electrical Supply) for Riverside Logistics Hub is pending approval.', relatedType: 'purchaseOrder', relatedId: 'po3', timestamp: d(-2) + 'T13:00', read: false },
  { id: 'n9', type: 'Document Approval', title: 'Document pending approval', message: 'Site Progress Photos - Envelope.zip on Riverside Logistics Hub is pending approval.', relatedType: 'document', relatedId: 'doc5', timestamp: d(-4) + 'T15:00', read: true },
  { id: 'n10', type: 'New Assignment', title: 'New assignment', message: 'Sofia Bautista assigned to Technical proposal narrative on BID-2026-201.', relatedType: 'bid', relatedId: 'b1', timestamp: d(-12) + 'T09:00', read: true },
  { id: 'n11', type: 'Status Change', title: 'Bid stage updated', message: 'Pinecrest Assisted Living Expansion moved to Ready for Submission.', relatedType: 'bid', relatedId: 'b3', timestamp: d(-1) + 'T15:00', read: false },
];

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'aud1', entityType: 'project', entityId: 'p1', action: 'Status changed from Mobilization to In Progress', user: 'David Reyes', timestamp: d(-135) + 'T08:00', previousValue: 'Mobilization', newValue: 'In Progress' },
  { id: 'aud2', entityType: 'project', entityId: 'p2', action: 'Status changed from In Progress to Delayed', user: 'Priya Nair', timestamp: d(-12) + 'T10:00', previousValue: 'In Progress', newValue: 'Delayed', relatedRecord: 'Imaging suite shielding rework' },
  { id: 'aud3', entityType: 'bid', entityId: 'b7', action: 'Bid converted to project GB-2026-003', user: 'David Reyes', timestamp: d(-18) + 'T08:00', relatedRecord: 'p3' },
  { id: 'aud4', entityType: 'project', entityId: 'p1', action: 'Change order CO-002 submitted', user: 'David Reyes', timestamp: d(-6) + 'T11:00', relatedRecord: 'Yard lighting upgrade' },
  { id: 'aud5', entityType: 'bid', entityId: 'b3', action: 'Stage changed from For Approval to Ready for Submission', user: 'Elena Cruz', timestamp: d(-1) + 'T15:00', previousValue: 'For Approval', newValue: 'Ready for Submission' },
];

// ---------- Branch assignments ----------
// Records carry a branchId so the central system can scope what each branch sees.
const USER_BRANCH: Record<string, string> = { u1: 'br1', u2: 'br1', u3: 'br2', u4: 'br3', u5: 'br1', u6: 'br1', u7: 'br1', u8: 'br1', u9: 'br2', u10: 'br3' };
const PROJECT_BRANCH: Record<string, string> = { p1: 'br2', p2: 'br3', p3: 'br4', p4: 'br3', p5: 'br2', p6: 'br2' };
const BID_BRANCH: Record<string, string> = { b1: 'br3', b2: 'br4', b3: 'br2', b4: 'br3', b5: 'br4', b6: 'br2', b7: 'br4', b8: 'br3', b9: 'br4', b10: 'br2' };
USERS.forEach(user => { user.branchId = USER_BRANCH[user.id] ?? 'br1'; });
PROJECTS.forEach(project => { project.branchId = PROJECT_BRANCH[project.id] ?? 'br1'; });
BIDS.forEach(bid => { bid.branchId = BID_BRANCH[bid.id] ?? 'br1'; });

export function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export const seedDatabase = () => ({
  users: cloneSeed(USERS),
  branches: cloneSeed(BRANCHES),
  projects: cloneSeed(PROJECTS),
  bids: cloneSeed(BIDS),
  tasks: cloneSeed(TASKS),
  documents: cloneSeed(DOCUMENTS),
  cadFiles: cloneSeed(CAD_FILES),
  purchaseOrders: cloneSeed(PURCHASE_ORDERS),
  materials: cloneSeed(MATERIALS),
  issues: cloneSeed(ISSUES),
  dailyLogs: cloneSeed(DAILY_LOGS),
  notifications: cloneSeed(NOTIFICATIONS),
  auditLog: cloneSeed(AUDIT_LOG),
  costMaterials: cloneSeed(COST_MATERIALS),
  laborRates: cloneSeed(LABOR_RATES),
  equipmentRates: cloneSeed(EQUIPMENT_RATES),
  productivityRates: cloneSeed(PRODUCTIVITY_RATES),
  compositionTemplates: cloneSeed(COMPOSITION_TEMPLATES),
  estimates: cloneSeed(ESTIMATES),
});

export { genId };
