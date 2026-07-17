import type { Estimate, BoqLineItem, CompositionTemplate, CostMaterial } from '../types';

export function lineDirectUnit(item: BoqLineItem): number {
  return item.materialUnitCost + item.laborUnitCost + item.equipmentUnitCost;
}

export function lineDirectCost(item: BoqLineItem): number {
  return lineDirectUnit(item) * item.quantity;
}

export function directCostTotal(items: BoqLineItem[]): number {
  return items.reduce((sum, item) => sum + lineDirectCost(item), 0);
}

export interface CostingBreakdown {
  directCost: number;
  indirectLines: { label: string; amount: number; detail: string }[];
  indirectTotal: number;
  contingency: number;
  subtotal: number; // direct + indirect + contingency
  margin: number;
  preVat: number;
  vat: number;
  contractPrice: number;
  perSqm: number;
}

export function computeCosting(estimate: Estimate): CostingBreakdown {
  const directCost = directCostTotal(estimate.boqItems);
  const c = estimate.costing;

  const indirectLines = c.indirects.map(ind => {
    const amount = ind.type === 'percent' ? directCost * (ind.value / 100) : ind.value;
    const detail = ind.type === 'percent' ? `${ind.value}% of direct` : 'fixed amount';
    return { label: ind.label, amount, detail };
  });
  const indirectTotal = indirectLines.reduce((s, l) => s + l.amount, 0);
  const contingency = directCost * (c.contingencyPct / 100);
  const subtotal = directCost + indirectTotal + contingency;
  const margin = subtotal * (c.profitMarginPct / 100);
  const preVat = subtotal + margin;
  const vat = preVat * (c.vatPct / 100);
  const contractPrice = preVat + vat;
  const perSqm = estimate.grossFloorArea > 0 ? contractPrice / estimate.grossFloorArea : 0;

  return { directCost, indirectLines, indirectTotal, contingency, subtotal, margin, preVat, vat, contractPrice, perSqm };
}

export interface BomRow {
  materialId: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  baseQty: number;   // before wastage, consolidated
  wastageQty: number;
  totalQty: number;  // base + wastage
  unitCost: number;
  amount: number;    // totalQty * unitCost
  wastagePct: number;
  fromItems: string[]; // BOQ line descriptions contributing
}

// Expand BOQ line items into a consolidated bill of materials using composition
// templates. Only line items linked to a template contribute to the BOM.
export function generateBom(
  estimate: Estimate,
  templates: CompositionTemplate[],
  materials: CostMaterial[],
  wastageOverride?: Record<string, number>,
): BomRow[] {
  const acc = new Map<string, BomRow>();

  for (const item of estimate.boqItems) {
    if (!item.templateId) continue;
    const template = templates.find(t => t.id === item.templateId);
    if (!template) continue;
    for (const comp of template.components) {
      const material = materials.find(m => m.id === comp.materialId);
      if (!material) continue;
      const wastagePct = wastageOverride?.[material.id] ?? comp.wastagePct;
      const base = comp.qtyPerUnit * item.quantity;
      const existing = acc.get(material.id);
      if (existing) {
        existing.baseQty += base;
        if (!existing.fromItems.includes(item.description)) existing.fromItems.push(item.description);
        existing.wastagePct = wastagePct; // last-write; UI shows editable single value per material
      } else {
        acc.set(material.id, {
          materialId: material.id, code: material.code, name: material.name, unit: material.unit,
          category: material.category, baseQty: base, wastageQty: 0, totalQty: 0,
          unitCost: material.unitCost, amount: 0, wastagePct, fromItems: [item.description],
        });
      }
    }
  }

  const rows = Array.from(acc.values());
  for (const row of rows) {
    row.wastageQty = row.baseQty * (row.wastagePct / 100);
    row.totalQty = row.baseQty + row.wastageQty;
    row.amount = row.totalQty * row.unitCost;
  }
  return rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function bomTotal(rows: BomRow[]): number {
  return rows.reduce((s, r) => s + r.amount, 0);
}

// Group BOQ items by division with per-division direct cost (for per-division quotation detail).
export function divisionTotals(items: BoqLineItem[]): { division: string; directCost: number; count: number }[] {
  const map = new Map<string, { division: string; directCost: number; count: number }>();
  for (const item of items) {
    const entry = map.get(item.division) ?? { division: item.division, directCost: 0, count: 0 };
    entry.directCost += lineDirectCost(item);
    entry.count += 1;
    map.set(item.division, entry);
  }
  return Array.from(map.values());
}

export function nextRevisionLabel(current: string): string {
  const match = /Rev\s+([A-Z])/i.exec(current);
  if (match && match[1].toUpperCase() < 'Z') return `Rev ${String.fromCharCode(match[1].toUpperCase().charCodeAt(0) + 1)}`;
  return 'Rev A';
}
