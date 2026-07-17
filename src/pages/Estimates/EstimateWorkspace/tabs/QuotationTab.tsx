import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { computeCosting, divisionTotals, lineDirectCost, nextRevisionLabel } from '../../../../utils/estimation';
import { formatCurrency, formatDate, formatQty, formatRate, genId } from '../../../../utils/format';
import type { Estimate, QuotationConfig, QuotationDetailLevel } from '../../../../types';

const DETAIL_LEVELS: QuotationDetailLevel[] = ['Lump Sum', 'Per Division', 'Full BOQ'];

export default function QuotationTab({ estimate, onConvert }: { estimate: Estimate; onConvert: () => void }) {
  const { updateEstimate } = useData();
  const { can, currentUser } = useAuth();
  const canManage = can('estimates.manage');
  const canConvert = can('estimates.convert');
  const q = estimate.quotation;
  const costing = computeCosting(estimate);
  const [showPreview, setShowPreview] = useState(false);
  const [showRev, setShowRev] = useState(false);

  const patchQuotation = (patch: Partial<QuotationConfig>) => updateEstimate(estimate.id, { quotation: { ...q, ...patch } });

  const issueRevision = (note: string) => {
    const label = nextRevisionLabel(estimate.currentRevision);
    const rev = { id: genId('qr'), label, date: new Date().toISOString().slice(0, 10), author: currentUser.name, changeNote: note, contractPrice: costing.contractPrice };
    updateEstimate(estimate.id, { quotationRevisions: [...estimate.quotationRevisions, rev], currentRevision: label });
  };

  return (
    <Row className="g-3">
      <Col xs={12} lg={7}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-3">Quotation Setup</h6>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label className="small mb-1">Detail Level</Form.Label>
              <Form.Select value={q.detailLevel} disabled={!canManage} onChange={e => patchQuotation({ detailLevel: e.target.value as QuotationDetailLevel })}>
                {DETAIL_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="small mb-1">Validity (days)</Form.Label>
              <Form.Control type="number" value={q.validityDays} disabled={!canManage} onChange={e => patchQuotation({ validityDays: Number(e.target.value) })} />
            </Col>
            <Col md={12}>
              <Form.Label className="small mb-1">Payment Schedule</Form.Label>
              <Form.Control as="textarea" rows={2} value={q.paymentSchedule} disabled={!canManage} onChange={e => patchQuotation({ paymentSchedule: e.target.value })} />
            </Col>
            <Col md={12}>
              <Form.Label className="small mb-1">Terms &amp; Conditions</Form.Label>
              <Form.Control as="textarea" rows={3} value={q.termsAndConditions} disabled={!canManage} onChange={e => patchQuotation({ termsAndConditions: e.target.value })} />
            </Col>
            <Col md={12}>
              <Form.Label className="small mb-1">Exclusions</Form.Label>
              <Form.Control as="textarea" rows={2} value={q.exclusions} disabled={!canManage} onChange={e => patchQuotation({ exclusions: e.target.value })} />
            </Col>
          </Row>
          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="primary" onClick={() => setShowPreview(true)}><i className="bi bi-file-earmark-pdf me-1" /> Preview / Print Quotation</Button>
            {canManage && <Button variant="outline-secondary" onClick={() => setShowRev(true)}><i className="bi bi-file-earmark-plus me-1" /> Issue Revision</Button>}
          </div>
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Revision History (Rev A, B, C…)</h6>
          {estimate.quotationRevisions.length === 0 ? <EmptyState icon="bi-file-earmark" title="No revisions issued yet" /> : (
            <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
              {[...estimate.quotationRevisions].reverse().map(r => (
                <li key={r.id} className="d-flex justify-content-between border-bottom pb-2">
                  <div><div className="fw-semibold">{r.label}</div><div className="text-secondary small">{formatDate(r.date)} · {r.author}</div><div className="small">{r.changeNote}</div></div>
                  <div className="fw-semibold">{formatCurrency(r.contractPrice)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Col>

      <Col xs={12} lg={5}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Status &amp; Conversion</h6>
          <div className="d-flex justify-content-between align-items-center mb-2"><span className="text-secondary small">Current status</span><StatusBadge status={estimate.status} /></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Contract Price</span><span className="fw-semibold">{formatCurrency(costing.contractPrice)}</span></div>
          <div className="d-flex justify-content-between small mb-3"><span className="text-secondary">Budget Baseline (on win)</span><span>{formatCurrency(Math.round(costing.subtotal))}</span></div>
          {estimate.status === 'Won' && !estimate.convertedProjectId && canConvert && (
            <Button variant="success" className="w-100" onClick={onConvert}><i className="bi bi-arrow-right-circle me-1" /> Convert to Project</Button>
          )}
          {estimate.status === 'Won' && !estimate.convertedProjectId && !canConvert && <p className="small text-secondary mb-0">Won — awaiting conversion by an authorized user.</p>}
          {estimate.convertedProjectId && <div className="small text-success"><i className="bi bi-check-circle-fill me-1" />Converted to a project. The BOQ is now the job-costing budget baseline.</div>}
          {estimate.status !== 'Won' && <p className="small text-secondary mb-0">Mark the quotation <strong>Won</strong> (Actions menu) to enable conversion to a project.</p>}
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Flow</h6>
          <div className="quotation-flow">
            {['Draft', 'Sent', 'Negotiating', 'Won'].map((s, i, arr) => (
              <span key={s} className={`qf-step ${estimate.status === s ? 'active' : ''} ${['Draft', 'Sent', 'Negotiating', 'Won'].indexOf(estimate.status) > i ? 'done' : ''}`}>
                {s}{i < arr.length - 1 && <i className="bi bi-chevron-right" />}
              </span>
            ))}
          </div>
          {estimate.status === 'Lost' && <div className="small text-danger mt-2"><i className="bi bi-x-circle me-1" />Marked as Lost.</div>}
        </div>
      </Col>

      <QuotationPreviewModal show={showPreview} estimate={estimate} onClose={() => setShowPreview(false)} />
      <RevisionModal show={showRev} onClose={() => setShowRev(false)} onSave={note => { issueRevision(note); setShowRev(false); }} />
    </Row>
  );
}

function RevisionModal({ show, onClose, onSave }: { show: boolean; onClose: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState('');
  return (
    <Modal show={show} onHide={onClose} centered onEntered={() => setNote('')}>
      <Modal.Header closeButton><Modal.Title as="h5">Issue Quotation Revision</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="small text-secondary">Captures the current contract price as a new revision (Rev A → B → C…).</p>
        <Form.Group controlId="qr-note"><Form.Label>Change Note</Form.Label><Form.Control as="textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="What changed in this revision…" /></Form.Group>
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!note.trim()} onClick={() => onSave(note)}>Issue Revision</Button></Modal.Footer>
    </Modal>
  );
}

function QuotationPreviewModal({ show, estimate, onClose }: { show: boolean; estimate: Estimate; onClose: () => void }) {
  const costing = computeCosting(estimate);
  const divisions = divisionTotals(estimate.boqItems);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + estimate.quotation.validityDays);

  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="quotation-preview-modal">
      <Modal.Header closeButton><Modal.Title as="h5">Quotation Preview — {estimate.quotation.detailLevel}</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="quotation-doc" id="quotation-print">
          <div className="qd-letterhead">
            <div className="qd-brand"><span className="qd-mark"><i className="bi bi-buildings" /></span><div><strong>GREENCORE BUILDERS INC.</strong><div className="small text-secondary">Design · Estimation · Construction</div></div></div>
            <div className="text-end small text-secondary">Quotation {estimate.code}<br />{estimate.currentRevision}<br />{formatDate(new Date().toISOString())}</div>
          </div>
          <hr />
          <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
            <div><div className="text-secondary small">Prepared for</div><strong>{estimate.client}</strong><div className="small">{estimate.clientContact}</div><div className="small">{estimate.location}</div></div>
            <div className="text-end"><div className="text-secondary small">Project</div><strong>{estimate.projectName}</strong>{estimate.grossFloorArea > 0 && <div className="small">{estimate.grossFloorArea} sqm</div>}</div>
          </div>

          {estimate.quotation.detailLevel === 'Lump Sum' && (
            <table className="table qd-table"><tbody><tr><td>Construction of {estimate.projectName} — complete as per plans and specifications</td><td className="text-end fw-semibold">{formatCurrency(costing.preVat)}</td></tr></tbody></table>
          )}
          {estimate.quotation.detailLevel === 'Per Division' && (
            <table className="table qd-table">
              <thead><tr><th>Division</th><th className="text-end">Amount</th></tr></thead>
              <tbody>{divisions.map(dv => <tr key={dv.division}><td>{dv.division}</td><td className="text-end">{formatCurrency(dv.directCost)}</td></tr>)}
                <tr className="fw-semibold"><td>Indirect, Contingency &amp; Margin</td><td className="text-end">{formatCurrency(costing.preVat - costing.directCost)}</td></tr>
              </tbody>
            </table>
          )}
          {estimate.quotation.detailLevel === 'Full BOQ' && (
            <table className="table qd-table">
              <thead><tr><th>Description</th><th className="text-end">Qty</th><th>Unit</th><th className="text-end">Amount</th></tr></thead>
              <tbody>{estimate.boqItems.map(i => <tr key={i.id}><td>{i.description}</td><td className="text-end">{formatQty(i.quantity)}</td><td>{i.unit}</td><td className="text-end">{formatCurrency(lineDirectCost(i))}</td></tr>)}
                <tr className="fw-semibold"><td colSpan={3}>Indirect, Contingency &amp; Margin</td><td className="text-end">{formatCurrency(costing.preVat - costing.directCost)}</td></tr>
              </tbody>
            </table>
          )}

          <table className="table qd-table qd-totals">
            <tbody>
              <tr><td>Sub-total (pre-VAT)</td><td className="text-end">{formatCurrency(costing.preVat)}</td></tr>
              <tr><td>VAT ({estimate.costing.vatPct}%)</td><td className="text-end">{formatCurrency(costing.vat)}</td></tr>
              <tr className="qd-grand"><td>TOTAL CONTRACT PRICE</td><td className="text-end">{formatCurrency(costing.contractPrice)}</td></tr>
              {estimate.grossFloorArea > 0 && <tr><td>Approx. per sqm</td><td className="text-end">{formatRate(costing.perSqm)}</td></tr>}
            </tbody>
          </table>

          <div className="qd-terms">
            <div><strong>Payment Schedule.</strong> {estimate.quotation.paymentSchedule}</div>
            <div><strong>Validity.</strong> This quotation is valid until {formatDate(validUntil.toISOString())} ({estimate.quotation.validityDays} days).</div>
            <div><strong>Terms &amp; Conditions.</strong> {estimate.quotation.termsAndConditions}</div>
            <div><strong>Exclusions.</strong> {estimate.quotation.exclusions}</div>
          </div>
          <div className="qd-sign"><div>Prepared by:<br /><strong>{estimate.estimator}</strong><br /><span className="small text-secondary">Estimator, Greencore Builders Inc.</span></div><div>Conforme:<br /><strong>{estimate.client}</strong></div></div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => window.print()}><i className="bi bi-printer me-1" /> Print / Save as PDF</Button>
      </Modal.Footer>
    </Modal>
  );
}
