import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../../../utils/format';
import type { Bid } from '../../../../types';

export default function OverviewTab({ bid }: { bid: Bid }) {
  const requirementsDone = bid.requirements.filter(r => r.completed).length;
  const approvalsDone = bid.approvals.filter(a => a.decision === 'Approved').length;

  return (
    <Row className="g-3">
      <Col xs={12} lg={8}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Opportunity Description</h6>
          <p className="mb-2">{bid.description}</p>
          <div className="d-flex flex-wrap gap-3 small text-secondary">
            <span><strong className="text-body">Source:</strong> {bid.source}</span>
            <span><strong className="text-body">Client Contact:</strong> {bid.clientContact || '—'}</span>
          </div>
        </div>

        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Competitors</h6>
          {bid.competitors.length === 0 ? (
            <EmptyState icon="bi-people" title="No competitor information yet" />
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {bid.competitors.map(c => <span key={c} className="badge text-bg-light border">{c}</span>)}
            </div>
          )}
        </div>

        {bid.goNoGo && (
          <div className="section-card p-3">
            <h6 className="fw-bold mb-2">Go/No-Go Assessment</h6>
            <div className="d-flex align-items-center gap-2 mb-2">
              <StatusBadge status={bid.goNoGo.recommendation === 'Go' ? 'Approved' : bid.goNoGo.recommendation === 'No-Go' ? 'Rejected' : 'Pending'} />
              <span className="fw-semibold">{bid.goNoGo.recommendation}</span>
              <span className="text-secondary small">assessed by {bid.goNoGo.assessedBy} on {formatDate(bid.goNoGo.assessedDate || '')}</span>
            </div>
            {bid.goNoGo.notes && <p className="small text-secondary mb-0">{bid.goNoGo.notes}</p>}
          </div>
        )}
      </Col>

      <Col xs={12} lg={4}>
        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Key Metrics</h6>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Estimated Value</span><span className="fw-semibold">{formatCurrency(bid.estimatedValue)}</span></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Win Probability</span><span className="fw-semibold">{bid.probability}%</span></div>
          <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Submission Deadline</span><span className="fw-semibold">{formatDate(bid.submissionDeadline)}</span></div>
          <div className="d-flex justify-content-between small"><span className="text-secondary">Bid Owner</span><span className="fw-semibold">{bid.bidOwner}</span></div>
        </div>

        <div className="section-card p-3 mb-3">
          <h6 className="fw-bold mb-2">Progress Snapshot</h6>
          <div className="small text-secondary mb-1">Requirements completed</div>
          <div className="workspace-progress-track mb-2"><div className="workspace-progress-fill" style={{ width: bid.requirements.length ? `${(requirementsDone / bid.requirements.length) * 100}%` : '0%' }} /></div>
          <div className="small mb-3">{requirementsDone} / {bid.requirements.length}</div>
          <div className="small text-secondary mb-1">Approvals received</div>
          <div className="workspace-progress-track mb-2"><div className="workspace-progress-fill" style={{ width: bid.approvals.length ? `${(approvalsDone / bid.approvals.length) * 100}%` : '0%' }} /></div>
          <div className="small">{approvalsDone} / {bid.approvals.length}</div>
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Next Action</h6>
          <p className="small mb-0">{bid.nextAction}</p>
        </div>
      </Col>
    </Row>
  );
}
