import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import SummaryCard from '../../../../components/ui/SummaryCard';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { formatCurrency, formatDate, genId } from '../../../../utils/format';
import type { Project, ChangeOrder } from '../../../../types';

export default function FinancialsTab({ project }: { project: Project }) {
  const { can, currentUser } = useAuth();
  const { updateProject } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '' });

  if (!can('projects.financials.view')) {
    return <EmptyState icon="bi-shield-lock" title="Restricted" message="Your role does not have permission to view financial data for this project." />;
  }

  const f = project.financials;
  const remaining = f.approvedBudget - f.actualExpenses;
  const outstanding = f.billed - f.paymentsReceived;
  const retentionAmount = f.billed * (f.retentionPct / 100);
  const costVariance = f.approvedBudget - f.actualExpenses;
  const costVariancePct = f.approvedBudget ? (costVariance / f.approvedBudget) * 100 : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number.isNaN(Number(form.amount))) return;
    const co: ChangeOrder = {
      id: genId('co'), projectId: project.id, title: form.title, amount: Number(form.amount),
      status: 'Submitted', submittedDate: new Date().toISOString().slice(0, 10),
    };
    updateProject(project.id, { financials: { ...f, changeOrders: [co, ...f.changeOrders] } }, currentUser.name);
    setShowForm(false);
    setForm({ title: '', amount: '' });
  };

  return (
    <div>
      <Row className="g-3 mb-3">
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Contract Value" value={formatCurrency(f.contractValue)} icon="bi-file-earmark-text" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Approved Budget" value={formatCurrency(f.approvedBudget)} icon="bi-wallet2" variant="info" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Committed Cost" value={formatCurrency(f.committedCost)} icon="bi-journal-check" variant="secondary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Actual Expenses" value={formatCurrency(f.actualExpenses)} icon="bi-cash-stack" variant={f.actualExpenses > f.approvedBudget ? 'danger' : 'primary'} /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Remaining Budget" value={formatCurrency(remaining)} icon="bi-piggy-bank" variant={remaining < 0 ? 'danger' : 'success'} /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Billed to Date" value={formatCurrency(f.billed)} icon="bi-receipt" variant="info" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Payments Received" value={formatCurrency(f.paymentsReceived)} icon="bi-cash-coin" variant="success" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Outstanding Balance" value={formatCurrency(outstanding)} icon="bi-hourglass-split" variant={outstanding > 0 ? 'warning' : 'success'} /></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col xs={12} md={6}>
          <div className="section-card p-3 h-100">
            <h6 className="fw-bold mb-2">Retention & Cost Variance</h6>
            <div className="d-flex justify-content-between small mb-1"><span className="text-secondary">Retention ({f.retentionPct}%)</span><span>{formatCurrency(retentionAmount)}</span></div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-secondary">Cost Variance</span>
              <span className={costVariance < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                {formatCurrency(costVariance)} ({costVariancePct.toFixed(1)}%)
              </span>
            </div>
            <div className="text-secondary small mt-2">
              {costVariance < 0
                ? 'Actual expenses have exceeded the approved budget.'
                : 'Project is currently tracking within the approved budget.'}
            </div>
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="section-card p-3 h-100">
            <h6 className="fw-bold mb-2">Budget Utilization</h6>
            <div className="workspace-progress-track mb-2">
              <div
                className="workspace-progress-fill"
                style={{ width: `${Math.min(100, (f.actualExpenses / f.approvedBudget) * 100)}%`, background: f.actualExpenses > f.approvedBudget ? '#d64545' : undefined }}
              />
            </div>
            <div className="text-secondary small">{((f.actualExpenses / f.approvedBudget) * 100).toFixed(1)}% of approved budget spent</div>
          </div>
        </Col>
      </Row>

      <div className="section-card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold mb-0">Change Orders</h6>
          {can('projects.edit') && <Button size="sm" variant="primary" onClick={() => setShowForm(true)}><i className="bi bi-plus-lg me-1" /> Submit Change Order</Button>}
        </div>
        {f.changeOrders.length === 0 ? (
          <EmptyState icon="bi-file-earmark-diff" title="No change orders" />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="table app-table mb-0">
              <thead><tr><th>Title</th><th>Amount</th><th>Status</th><th>Submitted</th><th>Approved</th></tr></thead>
              <tbody>
                {f.changeOrders.map(co => (
                  <tr key={co.id}>
                    <td>{co.title}</td>
                    <td>{formatCurrency(co.amount)}</td>
                    <td><StatusBadge status={co.status} /></td>
                    <td>{formatDate(co.submittedDate)}</td>
                    <td>{co.approvedDate ? `${formatDate(co.approvedDate)} (${co.approvedBy})` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton><Modal.Title as="h5">Submit Change Order</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId={`fld-1`}>
              <Form.Label className="form-required">Title</Form.Label>
              <Form.Control required value={form.title} onChange={e => setForm(f2 => ({ ...f2, title: e.target.value }))} />
            </Form.Group>
            <Form.Group controlId={`fld-2`}>
              <Form.Label className="form-required">Amount (USD)</Form.Label>
              <Form.Control required type="number" value={form.amount} onChange={e => setForm(f2 => ({ ...f2, amount: e.target.value }))} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
