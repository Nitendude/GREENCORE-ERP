import type {
  CostMaterial, LaborRate, EquipmentRate, ProductivityRate,
  CompositionTemplate, Estimate,
} from '../types';

const TODAY = new Date('2026-07-16T09:00:00');
function d(offset: number): string {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
}

// ---------- Material library (with supplier price history) ----------
export const COST_MATERIALS: CostMaterial[] = [
  { id: 'cm1', code: 'CEM-40', name: 'Portland Cement (40kg)', category: 'Cement & Aggregates', unit: 'bag', unitCost: 260, supplier: 'Republic Cement', updatedAt: d(-5),
    priceHistory: [{ date: d(-180), unitCost: 238, supplier: 'Republic Cement' }, { date: d(-90), unitCost: 249, supplier: 'Republic Cement' }, { date: d(-5), unitCost: 260, supplier: 'Republic Cement', note: 'Fuel surcharge' }] },
  { id: 'cm2', code: 'AGG-SAND', name: 'Washed Sand', category: 'Cement & Aggregates', unit: 'cu.m', unitCost: 1400, supplier: 'Luzon Aggregates', updatedAt: d(-20),
    priceHistory: [{ date: d(-160), unitCost: 1250, supplier: 'Luzon Aggregates' }, { date: d(-20), unitCost: 1400, supplier: 'Luzon Aggregates' }] },
  { id: 'cm3', code: 'AGG-G34', name: 'Gravel 3/4"', category: 'Cement & Aggregates', unit: 'cu.m', unitCost: 1500, supplier: 'Luzon Aggregates', updatedAt: d(-20),
    priceHistory: [{ date: d(-160), unitCost: 1350, supplier: 'Luzon Aggregates' }, { date: d(-20), unitCost: 1500, supplier: 'Luzon Aggregates' }] },
  { id: 'cm4', code: 'CHB-100', name: 'CHB 4" (100mm)', category: 'Masonry', unit: 'pc', unitCost: 14, supplier: 'SolidBlock Mfg', updatedAt: d(-30),
    priceHistory: [{ date: d(-150), unitCost: 12, supplier: 'SolidBlock Mfg' }, { date: d(-30), unitCost: 14, supplier: 'SolidBlock Mfg' }] },
  { id: 'cm5', code: 'CHB-150', name: 'CHB 6" (150mm)', category: 'Masonry', unit: 'pc', unitCost: 18, supplier: 'SolidBlock Mfg', updatedAt: d(-30),
    priceHistory: [{ date: d(-150), unitCost: 16, supplier: 'SolidBlock Mfg' }, { date: d(-30), unitCost: 18, supplier: 'SolidBlock Mfg' }] },
  { id: 'cm6', code: 'RSB-10', name: 'Rebar 10mm Grade 40 (6m)', category: 'Steel & Rebar', unit: 'pc', unitCost: 180, supplier: 'SteelAsia', updatedAt: d(-12),
    priceHistory: [{ date: d(-140), unitCost: 165, supplier: 'SteelAsia' }, { date: d(-12), unitCost: 180, supplier: 'SteelAsia' }] },
  { id: 'cm7', code: 'RSB-12', name: 'Rebar 12mm Grade 40 (6m)', category: 'Steel & Rebar', unit: 'pc', unitCost: 255, supplier: 'SteelAsia', updatedAt: d(-12),
    priceHistory: [{ date: d(-140), unitCost: 232, supplier: 'SteelAsia' }, { date: d(-12), unitCost: 255, supplier: 'SteelAsia' }] },
  { id: 'cm8', code: 'RSB-16', name: 'Deformed Bar 16mm (6m)', category: 'Steel & Rebar', unit: 'pc', unitCost: 450, supplier: 'SteelAsia', updatedAt: d(-12),
    priceHistory: [{ date: d(-140), unitCost: 410, supplier: 'SteelAsia' }, { date: d(-12), unitCost: 450, supplier: 'SteelAsia' }] },
  { id: 'cm9', code: 'TW-16', name: 'Tie Wire #16', category: 'Hardware', unit: 'kg', unitCost: 85, supplier: 'HardwareCity', updatedAt: d(-40),
    priceHistory: [{ date: d(-40), unitCost: 85, supplier: 'HardwareCity' }] },
  { id: 'cm10', code: 'PLY-12', name: 'Plywood 1/2" Marine', category: 'Lumber & Formwork', unit: 'sheet', unitCost: 720, supplier: 'Timberline Supply', updatedAt: d(-25),
    priceHistory: [{ date: d(-150), unitCost: 640, supplier: 'Timberline Supply' }, { date: d(-25), unitCost: 720, supplier: 'Timberline Supply' }] },
  { id: 'cm11', code: 'LBR-2x2', name: 'Coco Lumber 2x2x8', category: 'Lumber & Formwork', unit: 'pc', unitCost: 95, supplier: 'Timberline Supply', updatedAt: d(-25),
    priceHistory: [{ date: d(-25), unitCost: 95, supplier: 'Timberline Supply' }] },
  { id: 'cm12', code: 'TIL-6060', name: 'Ceramic Floor Tile 60x60', category: 'Finishes', unit: 'pc', unitCost: 120, supplier: 'FinishPro', updatedAt: d(-18),
    priceHistory: [{ date: d(-120), unitCost: 108, supplier: 'FinishPro' }, { date: d(-18), unitCost: 120, supplier: 'FinishPro' }] },
  { id: 'cm13', code: 'ADH-25', name: 'Tile Adhesive (25kg)', category: 'Finishes', unit: 'bag', unitCost: 340, supplier: 'FinishPro', updatedAt: d(-18),
    priceHistory: [{ date: d(-18), unitCost: 340, supplier: 'FinishPro' }] },
  { id: 'cm14', code: 'PNT-LTX', name: 'Latex Paint (gal)', category: 'Finishes', unit: 'gal', unitCost: 620, supplier: 'ColorMax', updatedAt: d(-15),
    priceHistory: [{ date: d(-120), unitCost: 560, supplier: 'ColorMax' }, { date: d(-15), unitCost: 620, supplier: 'ColorMax' }] },
  { id: 'cm15', code: 'GI-26', name: 'Corrugated GI Sheet ga.26', category: 'Roofing', unit: 'sheet', unitCost: 480, supplier: 'RoofWorks', updatedAt: d(-22),
    priceHistory: [{ date: d(-130), unitCost: 430, supplier: 'RoofWorks' }, { date: d(-22), unitCost: 480, supplier: 'RoofWorks' }] },
  { id: 'cm16', code: 'ELE-THHN', name: 'THHN Wire 3.5mm²', category: 'Electrical', unit: 'm', unitCost: 38, supplier: 'PhaseOne Electrical', updatedAt: d(-10),
    priceHistory: [{ date: d(-10), unitCost: 38, supplier: 'PhaseOne Electrical' }] },
  { id: 'cm17', code: 'PLB-PVC4', name: 'PVC Pipe 4" S1000', category: 'Plumbing', unit: 'pc', unitCost: 420, supplier: 'FlowLine Plumbing', updatedAt: d(-10),
    priceHistory: [{ date: d(-10), unitCost: 420, supplier: 'FlowLine Plumbing' }] },
];

export const LABOR_RATES: LaborRate[] = [
  { id: 'lr1', trade: 'Foreman', skill: 'Supervisor', dailyRate: 900, updatedAt: d(-30) },
  { id: 'lr2', trade: 'Mason', skill: 'Skilled', dailyRate: 750, updatedAt: d(-30) },
  { id: 'lr3', trade: 'Carpenter', skill: 'Skilled', dailyRate: 750, updatedAt: d(-30) },
  { id: 'lr4', trade: 'Electrician', skill: 'Skilled', dailyRate: 800, updatedAt: d(-30) },
  { id: 'lr5', trade: 'Plumber', skill: 'Skilled', dailyRate: 780, updatedAt: d(-30) },
  { id: 'lr6', trade: 'Steelman', skill: 'Skilled', dailyRate: 760, updatedAt: d(-30) },
  { id: 'lr7', trade: 'Painter', skill: 'Semi-Skilled', dailyRate: 650, updatedAt: d(-30) },
  { id: 'lr8', trade: 'Laborer', skill: 'Unskilled', dailyRate: 560, updatedAt: d(-30) },
];

export const EQUIPMENT_RATES: EquipmentRate[] = [
  { id: 'eq1', name: 'Concrete Mixer (1-bagger)', ownership: 'Owned', hourlyRate: 120, dailyRate: 850, updatedAt: d(-45) },
  { id: 'eq2', name: 'Bar Cutter', ownership: 'Owned', hourlyRate: 90, dailyRate: 650, updatedAt: d(-45) },
  { id: 'eq3', name: 'Backhoe', ownership: 'Rental', hourlyRate: 1200, dailyRate: 9000, updatedAt: d(-20) },
  { id: 'eq4', name: 'Plate Compactor', ownership: 'Rental', hourlyRate: 250, dailyRate: 1800, updatedAt: d(-20) },
  { id: 'eq5', name: 'Scaffolding Set', ownership: 'Owned', hourlyRate: 20, dailyRate: 150, updatedAt: d(-45) },
  { id: 'eq6', name: 'Welding Machine', ownership: 'Owned', hourlyRate: 110, dailyRate: 800, updatedAt: d(-45) },
];

export const PRODUCTIVITY_RATES: ProductivityRate[] = [
  { id: 'pr1', workItem: 'CHB Laying (100mm)', unit: 'sqm', outputPerManDay: 12, crew: '1 Mason + 1 Laborer', updatedAt: d(-30) },
  { id: 'pr2', workItem: 'Plastering (2 faces)', unit: 'sqm', outputPerManDay: 8, crew: '1 Mason + 1 Laborer', updatedAt: d(-30) },
  { id: 'pr3', workItem: 'Concrete Pouring (RC)', unit: 'cu.m', outputPerManDay: 3, crew: '2 Carpenter + 3 Laborer', updatedAt: d(-30) },
  { id: 'pr4', workItem: 'Floor Tile Setting', unit: 'sqm', outputPerManDay: 6, crew: '1 Tile Setter + 1 Helper', updatedAt: d(-30) },
  { id: 'pr5', workItem: 'Latex Painting (2 coats)', unit: 'sqm', outputPerManDay: 35, crew: '1 Painter', updatedAt: d(-30) },
];

// ---------- Composition templates (BOM generation) ----------
export const COMPOSITION_TEMPLATES: CompositionTemplate[] = [
  { id: 'ct1', workItem: 'CHB Wall 100mm', unit: 'sqm', laborTrade: 'Mason', productivityId: 'pr1', components: [
    { materialId: 'cm4', qtyPerUnit: 12.5, wastagePct: 5 },
    { materialId: 'cm1', qtyPerUnit: 0.5, wastagePct: 5 },
    { materialId: 'cm2', qtyPerUnit: 0.03, wastagePct: 10 },
    { materialId: 'cm6', qtyPerUnit: 2, wastagePct: 3 },
    { materialId: 'cm9', qtyPerUnit: 0.1, wastagePct: 5 },
  ] },
  { id: 'ct2', workItem: 'Plastering (2 faces)', unit: 'sqm', laborTrade: 'Mason', productivityId: 'pr2', components: [
    { materialId: 'cm1', qtyPerUnit: 0.3, wastagePct: 5 },
    { materialId: 'cm2', qtyPerUnit: 0.02, wastagePct: 10 },
  ] },
  { id: 'ct3', workItem: 'RC Column', unit: 'cu.m', laborTrade: 'Carpenter', productivityId: 'pr3', components: [
    { materialId: 'cm1', qtyPerUnit: 9, wastagePct: 3 },
    { materialId: 'cm2', qtyPerUnit: 0.5, wastagePct: 8 },
    { materialId: 'cm3', qtyPerUnit: 1, wastagePct: 8 },
    { materialId: 'cm8', qtyPerUnit: 8, wastagePct: 3 },
    { materialId: 'cm9', qtyPerUnit: 8, wastagePct: 5 },
    { materialId: 'cm10', qtyPerUnit: 0.4, wastagePct: 10 },
    { materialId: 'cm11', qtyPerUnit: 6, wastagePct: 12 },
  ] },
  { id: 'ct4', workItem: 'Floor Tile 60x60', unit: 'sqm', laborTrade: 'Mason', productivityId: 'pr4', components: [
    { materialId: 'cm12', qtyPerUnit: 2.9, wastagePct: 8 },
    { materialId: 'cm13', qtyPerUnit: 0.25, wastagePct: 5 },
    { materialId: 'cm1', qtyPerUnit: 0.1, wastagePct: 5 },
  ] },
  { id: 'ct5', workItem: 'Latex Painting', unit: 'sqm', laborTrade: 'Painter', productivityId: 'pr5', components: [
    { materialId: 'cm14', qtyPerUnit: 0.08, wastagePct: 5 },
  ] },
];

const defaultCosting = () => ({
  indirects: [
    { id: 'ic1', label: 'OCM (Overhead, Contingencies, Misc.)', type: 'percent' as const, value: 8 },
    { id: 'ic2', label: 'Mobilization / Demobilization', type: 'amount' as const, value: 80000 },
    { id: 'ic3', label: 'Temporary Facilities', type: 'amount' as const, value: 45000 },
    { id: 'ic4', label: 'Safety & Health', type: 'percent' as const, value: 3 },
  ],
  profitMarginPct: 12,
  vatPct: 12,
  contingencyPct: 3,
});

const defaultQuotation = () => ({
  detailLevel: 'Per Division' as const,
  validityDays: 30,
  paymentSchedule: '15% downpayment upon contract signing; progress billing per accomplishment; 10% retention released after final acceptance.',
  termsAndConditions: 'Prices are valid for the stated period and subject to change based on material price fluctuations. Any change in scope requires a written variation order and re-estimate. Permits and government fees are for the account of the Owner unless otherwise stated.',
  exclusions: 'Building permit and government fees, electrical/water meter deposits, furniture and fixtures, soil testing, and any works not explicitly listed in the BOQ.',
});

export const ESTIMATES: Estimate[] = [
  {
    id: 'est1', code: 'EST-2026-014', projectName: 'Two-Storey Residence — Alvarez', client: 'Mr. & Mrs. Alvarez',
    clientContact: 'Engr. Ramon Alvarez', location: 'Quezon City', grossFloorArea: 180, status: 'Negotiating',
    currentRevision: 'Rev B', estimator: 'Sofia Bautista', branchId: 'br3',
    boqItems: [
      { id: 'bl1', division: 'Earthworks', description: 'Structural excavation for footings', unit: 'cu.m', quantity: 45, materialUnitCost: 0, laborUnitCost: 120, equipmentUnitCost: 90 },
      { id: 'bl2', division: 'Concrete', description: 'Reinforced concrete columns (3000psi)', unit: 'cu.m', quantity: 8, materialUnitCost: 6800, laborUnitCost: 900, equipmentUnitCost: 150, templateId: 'ct3' },
      { id: 'bl3', division: 'Masonry', description: 'CHB wall 100mm incl. reinforcement', unit: 'sqm', quantity: 220, materialUnitCost: 420, laborUnitCost: 130, equipmentUnitCost: 20, templateId: 'ct1' },
      { id: 'bl4', division: 'Finishes', description: 'Cement plaster finish, two faces', unit: 'sqm', quantity: 440, materialUnitCost: 180, laborUnitCost: 95, equipmentUnitCost: 15, templateId: 'ct2' },
      { id: 'bl5', division: 'Finishes', description: 'Ceramic floor tiles 60x60', unit: 'sqm', quantity: 150, materialUnitCost: 520, laborUnitCost: 110, equipmentUnitCost: 10, templateId: 'ct4' },
      { id: 'bl6', division: 'Finishes', description: 'Latex paint finish, 2 coats', unit: 'sqm', quantity: 480, materialUnitCost: 55, laborUnitCost: 25, equipmentUnitCost: 5, templateId: 'ct5' },
      { id: 'bl7', division: 'Metal Works', description: 'C-purlin roof framing', unit: 'sqm', quantity: 120, materialUnitCost: 850, laborUnitCost: 220, equipmentUnitCost: 40 },
      { id: 'bl8', division: 'Thermal & Moisture', description: 'GI corrugated roofing ga.26', unit: 'sqm', quantity: 120, materialUnitCost: 520, laborUnitCost: 90, equipmentUnitCost: 10 },
      { id: 'bl9', division: 'Electrical', description: 'Electrical rough-in, wiring & fixtures', unit: 'lot', quantity: 1, materialUnitCost: 185000, laborUnitCost: 90000, equipmentUnitCost: 6000 },
      { id: 'bl10', division: 'Plumbing', description: 'Plumbing rough-in & fixtures', unit: 'lot', quantity: 1, materialUnitCost: 145000, laborUnitCost: 75000, equipmentUnitCost: 4000 },
    ],
    boqRevisions: [
      { id: 'br_a', label: 'Rev A', date: d(-38), author: 'Sofia Bautista', note: 'Initial take-off from schematic plans', lineItemCount: 9, directCost: 2450000 },
      { id: 'br_b', label: 'Rev B', date: d(-12), author: 'Sofia Bautista', note: 'Client upgraded to 60x60 tiles; added roof framing revision', lineItemCount: 10, directCost: 2685000 },
    ],
    costing: defaultCosting(),
    quotation: { ...defaultQuotation(), detailLevel: 'Per Division' },
    quotationRevisions: [
      { id: 'qr_a', label: 'Rev A', date: d(-36), author: 'Sofia Bautista', changeNote: 'Initial quotation issued', contractPrice: 3620000 },
      { id: 'qr_b', label: 'Rev B', date: d(-10), author: 'Sofia Bautista', changeNote: 'Revised per client finish upgrade', contractPrice: 3960000 },
    ],
    drawings: [
      { id: 'dw1', name: 'Ground Floor Plan.pdf', category: 'Plan', version: 'B', uploadedBy: 'Sofia Bautista', uploadedDate: d(-14) },
      { id: 'dw2', name: 'Front Perspective.jpg', category: 'Perspective', version: 'A', uploadedBy: 'Sofia Bautista', uploadedDate: d(-30) },
      { id: 'dw3', name: 'Structural Specifications.pdf', category: 'Specification', version: 'A', uploadedBy: 'David Reyes', uploadedDate: d(-28) },
    ],
    designRevisions: [
      { id: 'dr1', date: d(-30), author: 'Sofia Bautista', description: 'Schematic design issued', linkedQuotationRev: 'Rev A', triggersReEstimate: false },
      { id: 'dr2', date: d(-13), author: 'Engr. Ramon Alvarez', description: 'Client requested premium floor finish and wider eaves', linkedQuotationRev: 'Rev B', triggersReEstimate: true },
    ],
    createdAt: d(-38), updatedAt: d(-10), createdBy: 'Sofia Bautista',
  },
  {
    id: 'est2', code: 'EST-2026-021', projectName: 'Cold Storage Warehouse', client: 'Meridian Freight Corp',
    clientContact: 'Laura Chen — VP Facilities', location: 'Fife, WA', grossFloorArea: 1200, status: 'Sent',
    currentRevision: 'Rev A', estimator: 'Sofia Bautista', branchId: 'br2',
    boqItems: [
      { id: 'bl1', division: 'Earthworks', description: 'Site grading & compaction', unit: 'sqm', quantity: 1400, materialUnitCost: 0, laborUnitCost: 35, equipmentUnitCost: 55 },
      { id: 'bl2', division: 'Concrete', description: 'Reinforced slab-on-grade 150mm', unit: 'sqm', quantity: 1200, materialUnitCost: 980, laborUnitCost: 260, equipmentUnitCost: 60 },
      { id: 'bl3', division: 'Metal Works', description: 'Pre-engineered steel frame', unit: 'kg', quantity: 42000, materialUnitCost: 78, laborUnitCost: 22, equipmentUnitCost: 8 },
      { id: 'bl4', division: 'Thermal & Moisture', description: 'Insulated metal panel envelope', unit: 'sqm', quantity: 2200, materialUnitCost: 1850, laborUnitCost: 320, equipmentUnitCost: 45 },
    ],
    boqRevisions: [{ id: 'br_a', label: 'Rev A', date: d(-9), author: 'Sofia Bautista', note: 'Initial estimate from ITB drawings', lineItemCount: 4, directCost: 8950000 }],
    costing: { ...defaultCosting(), profitMarginPct: 10 },
    quotation: { ...defaultQuotation(), detailLevel: 'Lump Sum', validityDays: 45 },
    quotationRevisions: [{ id: 'qr_a', label: 'Rev A', date: d(-8), author: 'Sofia Bautista', changeNote: 'Initial quotation', contractPrice: 12400000 }],
    drawings: [{ id: 'dw1', name: 'Warehouse Layout.pdf', category: 'Plan', version: 'A', uploadedBy: 'Sofia Bautista', uploadedDate: d(-9) }],
    designRevisions: [{ id: 'dr1', date: d(-9), author: 'Sofia Bautista', description: 'Bid drawings received', linkedQuotationRev: 'Rev A', triggersReEstimate: false }],
    createdAt: d(-10), updatedAt: d(-8), createdBy: 'Sofia Bautista',
  },
  {
    id: 'est3', code: 'EST-2026-009', projectName: 'Barangay Health Center', client: 'LGU Marikina',
    clientContact: 'Hon. Grace Del Rosario', location: 'Marikina City', grossFloorArea: 240, status: 'Won',
    currentRevision: 'Rev C', estimator: 'Sofia Bautista', branchId: 'br3',
    boqItems: [
      { id: 'bl1', division: 'Concrete', description: 'RC footings, columns & beams', unit: 'cu.m', quantity: 32, materialUnitCost: 6800, laborUnitCost: 900, equipmentUnitCost: 150, templateId: 'ct3' },
      { id: 'bl2', division: 'Masonry', description: 'CHB wall 100mm', unit: 'sqm', quantity: 310, materialUnitCost: 420, laborUnitCost: 130, equipmentUnitCost: 20, templateId: 'ct1' },
      { id: 'bl3', division: 'Finishes', description: 'Plaster finish', unit: 'sqm', quantity: 620, materialUnitCost: 180, laborUnitCost: 95, equipmentUnitCost: 15, templateId: 'ct2' },
      { id: 'bl4', division: 'Finishes', description: 'Floor tiles 60x60', unit: 'sqm', quantity: 240, materialUnitCost: 520, laborUnitCost: 110, equipmentUnitCost: 10, templateId: 'ct4' },
      { id: 'bl5', division: 'Electrical', description: 'Electrical works', unit: 'lot', quantity: 1, materialUnitCost: 210000, laborUnitCost: 95000, equipmentUnitCost: 6000 },
      { id: 'bl6', division: 'Plumbing', description: 'Plumbing & sanitary works', unit: 'lot', quantity: 1, materialUnitCost: 175000, laborUnitCost: 82000, equipmentUnitCost: 4000 },
    ],
    boqRevisions: [
      { id: 'br_a', label: 'Rev A', date: d(-70), author: 'Sofia Bautista', note: 'Initial estimate', lineItemCount: 6, directCost: 3120000 },
      { id: 'br_c', label: 'Rev C', date: d(-40), author: 'Sofia Bautista', note: 'Final negotiated scope', lineItemCount: 6, directCost: 3260000 },
    ],
    costing: defaultCosting(),
    quotation: { ...defaultQuotation(), detailLevel: 'Full BOQ' },
    quotationRevisions: [{ id: 'qr_c', label: 'Rev C', date: d(-40), author: 'Sofia Bautista', changeNote: 'Awarded amount', contractPrice: 4780000 }],
    drawings: [{ id: 'dw1', name: 'Health Center Plans.pdf', category: 'Plan', version: 'C', uploadedBy: 'Sofia Bautista', uploadedDate: d(-42) }],
    designRevisions: [{ id: 'dr1', date: d(-70), author: 'Sofia Bautista', description: 'Design development set', linkedQuotationRev: 'Rev A', triggersReEstimate: false }],
    createdAt: d(-72), updatedAt: d(-38), createdBy: 'Sofia Bautista',
  },
  {
    id: 'est4', code: 'EST-2026-030', projectName: 'Townhouse Units (4-door)', client: 'Copper Ridge Ventures',
    clientContact: 'Nina Alvarez', location: 'Antipolo City', grossFloorArea: 320, status: 'Draft',
    currentRevision: 'Rev A', estimator: 'Sofia Bautista', branchId: 'br3',
    boqItems: [
      { id: 'bl1', division: 'Masonry', description: 'CHB wall 100mm', unit: 'sqm', quantity: 520, materialUnitCost: 420, laborUnitCost: 130, equipmentUnitCost: 20, templateId: 'ct1' },
      { id: 'bl2', division: 'Finishes', description: 'Plaster finish', unit: 'sqm', quantity: 1040, materialUnitCost: 180, laborUnitCost: 95, equipmentUnitCost: 15, templateId: 'ct2' },
    ],
    boqRevisions: [{ id: 'br_a', label: 'Rev A', date: d(-3), author: 'Sofia Bautista', note: 'Preliminary take-off for early pricing', lineItemCount: 2, directCost: 620000 }],
    costing: defaultCosting(),
    quotation: { ...defaultQuotation(), detailLevel: 'Lump Sum' },
    quotationRevisions: [],
    drawings: [],
    designRevisions: [],
    createdAt: d(-3), updatedAt: d(-3), createdBy: 'Sofia Bautista',
  },
];
