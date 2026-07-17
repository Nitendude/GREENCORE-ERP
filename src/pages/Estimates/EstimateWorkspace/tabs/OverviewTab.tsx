import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { computeCosting, divisionTotals, generateBom, bomTotal } from '../../../../utils/estimation';
import { formatCurrency, formatRate, formatDate } from '../../../../utils/format';
import type { Estimate } from '../../../../types';

export default function OverviewTab({ estimate }: { estimate: Estimate }) {
  const navigate = useNavigate();
  const { compositionTemplates, costMaterials } = useData();
  const costing = computeCosting(estimate);
  const divisions = divisionTotals(estimate.boqItems).sort((a, b) => b.directCost - a.directCost);
  const bom = generateBom(estimate, compositionTemplates, costMaterials);
  const materialsFromBom = bomTotal(bom);

  return (
    <Row className="g-3">
      <Col xs={12} lg={8}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Cost Summary</h6>
          <div className="cost-summary-grid">
            <div><span>Direct Cost (BOQ)</span><strong>{formatCurrency(costing.directCost)}</strong></div>
            <div><span>Indirect Costs</span><strong>{formatCurrency(costing.indirectTotal)}</strong></div>
            <div><span>Contingency ({estimate.costing.contingencyPct}%)</span><strong>{formatCurrency(costing.contingency)}</strong></div>
            <div><span>Subtotal</span><strong>{formatCurrency(costing.subtotal)}</strong></div>
            <div><span>Profit Margin ({estimate.costing.profitMarginPct}%)</span><strong>{formatCurrency(costing.margin)}</strong></div>
            <div><span>VAT ({estimate.costing.vatPct}%)</span><strong>{formatCurrency(costing.vat)}</strong></div>
            <div className="cost-summary-total"><span>Contract Price</span><strong>{formatCurrency(costing.contractPrice)}</strong></div>
            {estimate.grossFloorArea > 0 && <div className="cost-summary-total"><span>Per sqm</span><strong>{formatRate(costing.perSqm)}</strong></div>}
          </div>
        </div>

        <div className="section-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Cost by Division</h6>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/estimates/${estimate.id}/boq`)}>Open BOQ</Button>
          </div>
          {divisions.length === 0 ? <EmptyState icon="bi-list-columns-reverse" title="No BOQ items yet" message="Add line items in the BOQ tab." /> : (
            <div className="d-flex flex-column gap-2">
              {divisions.map(div => {
                const pct = costing.directCost > 0 ? (div.directCost / costing.directCost) * 100 : 0;
                return (
                  <div key={div.division}>
                    <div className="d-flex justify-content-between small mb-1"><span>{div.division} <span className="text-secondary">· {div.count} item(s)</span></span><span className="fw-semibold">{formatCurrency(div.directCost)}</span></div>
                    <div className="workspace-progress-track"><div className="workspace-progress-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Col>

      <Col xs={12} lg={4}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Estimate Details</h6>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Status</span><StatusBadge status={estimate.status} /></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Revision</span><span>{estimate.currentRevision}</span></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">BOQ Line Items</span><span>{estimate.boqItems.length}</span></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Materials (from BOM)</span><span>{formatCurrency(materialsFromBom)}</span></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Created</span><span>{formatDate(estimate.createdAt)}</span></div>
          <div className="d-flex justify-content-between small"><span className="text-secondary">Updated</span><span>{formatDate(estimate.updatedAt)}</span></div>
        </div>

        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Quick Actions</h6>
          <div className="d-grid gap-2">
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/estimates/${estimate.id}/boq`)}><i className="bi bi-list-columns-reverse me-1" /> Edit BOQ</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/estimates/${estimate.id}/bom`)}><i className="bi bi-boxes me-1" /> Generate BOM</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/estimates/${estimate.id}/costing`)}><i className="bi bi-cash-coin me-1" /> Adjust Costing</Button>
            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/estimates/${estimate.id}/quotation`)}><i className="bi bi-file-earmark-text me-1" /> Generate Quotation</Button>
          </div>
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Latest Quotation Revision</h6>
          {estimate.quotationRevisions.length === 0 ? <EmptyState icon="bi-file-earmark" title="No revisions issued" /> : (
            (() => { const r = estimate.quotationRevisions[estimate.quotationRevisions.length - 1]; return (
              <div>
                <div className="d-flex justify-content-between"><span className="fw-semibold">{r.label}</span><span className="fw-semibold">{formatCurrency(r.contractPrice)}</span></div>
                <div className="text-secondary small">{formatDate(r.date)} · {r.author}</div>
                <p className="small mb-0 mt-1">{r.changeNote}</p>
              </div>
            ); })()
          )}
        </div>
      </Col>
    </Row>
  );
}
