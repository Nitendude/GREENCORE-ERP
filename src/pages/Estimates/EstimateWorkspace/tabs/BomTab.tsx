import { useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import SummaryCard from '../../../../components/ui/SummaryCard';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { generateBom, bomTotal } from '../../../../utils/estimation';
import { formatCurrency, formatRate, formatQty } from '../../../../utils/format';
import type { Estimate } from '../../../../types';

export default function BomTab({ estimate }: { estimate: Estimate }) {
  const { compositionTemplates, costMaterials } = useData();
  // Local wastage overrides so the estimator can tune BOM without mutating the DB.
  const [wastage, setWastage] = useState<Record<string, number>>({});

  const rows = useMemo(() => generateBom(estimate, compositionTemplates, costMaterials, wastage), [estimate, compositionTemplates, costMaterials, wastage]);
  const total = bomTotal(rows);
  const baseTotal = rows.reduce((s, r) => s + r.baseQty * r.unitCost, 0);
  const wastageValue = total - baseTotal;

  const linkedItems = estimate.boqItems.filter(i => i.templateId).length;
  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) { const arr = map.get(r.category) ?? []; arr.push(r); map.set(r.category, arr); }
    return Array.from(map.entries());
  }, [rows]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="bi-boxes"
        title="No materials to generate"
        message={linkedItems === 0
          ? 'BOM is auto-generated from BOQ line items that are linked to a composition template. Link a template on a BOQ item (e.g. "CHB Wall 100mm") to expand it into materials.'
          : 'The linked templates produced no components.'}
      />
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-0">Bill of Materials</h6>
          <span className="text-secondary small">Auto-generated from {linkedItems} template-linked BOQ item(s). Future link: this becomes the basis for purchase orders.</span>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><SummaryCard label="Distinct Materials" value={rows.length} icon="bi-boxes" variant="primary" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Base Material Cost" value={formatCurrency(baseTotal)} icon="bi-box" variant="secondary" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Wastage Allowance" value={formatCurrency(wastageValue)} icon="bi-exclamation-triangle" variant="warning" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Total Material Cost" value={formatCurrency(total)} icon="bi-cash-stack" variant="success" /></Col>
      </Row>

      {grouped.map(([category, items]) => (
        <div key={category} className="section-card mb-3">
          <div className="boq-division-header"><span>{category}</span><span>{formatCurrency(items.reduce((s, r) => s + r.amount, 0))}</span></div>
          <div className="table-responsive-wrapper" style={{ border: 'none' }}>
            <table className="table app-table mb-0">
              <thead>
                <tr>
                  <th>Material</th><th className="text-end">Base Qty</th><th style={{ width: 110 }} className="text-end">Wastage %</th>
                  <th className="text-end">Total Qty</th><th>Unit</th><th className="text-end">Unit Cost</th><th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.materialId}>
                    <td>
                      <div className="fw-semibold">{r.name}</div>
                      <div className="text-secondary small">{r.code} · from {r.fromItems.length} work item(s)</div>
                    </td>
                    <td className="text-end">{formatQty(r.baseQty)}</td>
                    <td className="text-end">
                      <Form.Control
                        type="number" size="sm" className="text-end" style={{ width: 90, display: 'inline-block' }}
                        value={wastage[r.materialId] ?? r.wastagePct}
                        onChange={e => setWastage(w => ({ ...w, [r.materialId]: Number(e.target.value) }))}
                      />
                    </td>
                    <td className="text-end fw-semibold">{formatQty(r.totalQty)}</td>
                    <td>{r.unit}</td>
                    <td className="text-end">{formatRate(r.unitCost)}</td>
                    <td className="text-end fw-semibold">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="section-card p-3 d-flex justify-content-between align-items-center">
        <span className="small text-secondary">Consolidated across all template-linked line items · wastage editable per material</span>
        <div className="text-end"><div className="small text-secondary">Total Material Cost</div><div className="fs-5 fw-bold">{formatCurrency(total)}</div></div>
      </div>
    </div>
  );
}
