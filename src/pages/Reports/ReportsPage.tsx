import { useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import DataTable, { type Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { exportToCsv } from '../../utils/csv';

const REPORTS = [
  { value: 'project-status', label: 'Project Status & Health' },
  { value: 'planned-actual', label: 'Planned vs. Actual Progress' },
  { value: 'budget-actual', label: 'Budget vs. Actual Costs' },
  { value: 'delayed', label: 'Delayed Projects' },
  { value: 'milestones', label: 'Upcoming Milestones' },
  { value: 'bidding-pipeline', label: 'Active Bidding Pipeline' },
  { value: 'bid-outcomes', label: 'Bid Outcomes (Win/Loss)' },
  { value: 'estimate-vs-awarded', label: 'Estimated vs. Awarded Value' },
  { value: 'workload', label: 'Employee Workload' },
  { value: 'procurement-status', label: 'Procurement & Material Status' },
];

export default function ReportsPage() {
  const { projects, bids, tasks, purchaseOrders, materials } = useData();
  const { can, allUsers } = useAuth();
  const [reportType, setReportType] = useState('project-status');
  const [client, setClient] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const canExport = can('reports.export');

  const clients = Array.from(new Set([...projects.map(p => p.client), ...bids.map(b => b.client)])).sort();

  const inDateRange = (dateStr: string) => {
    if (dateFrom && dateStr < dateFrom) return false;
    if (dateTo && dateStr > dateTo) return false;
    return true;
  };

  const content = useMemo(() => {
    switch (reportType) {
      case 'project-status': {
        const rows = projects.filter(p => (!client || p.client === client) && (!projectId || p.id === projectId));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'code', label: 'Code', accessor: p => p.code },
          { key: 'name', label: 'Project', sortable: true, accessor: p => p.name },
          { key: 'client', label: 'Client', accessor: p => p.client },
          { key: 'status', label: 'Status', render: p => <StatusBadge status={p.status} /> },
          { key: 'progress', label: 'Progress', sortable: true, accessor: p => p.progress, render: p => `${p.progress}%` },
          { key: 'cost', label: 'Cost Health', render: p => <StatusBadge status={p.health.cost} /> },
          { key: 'schedule', label: 'Schedule Health', render: p => <StatusBadge status={p.health.schedule} /> },
          { key: 'quality', label: 'Quality Health', render: p => <StatusBadge status={p.health.quality} /> },
          { key: 'safety', label: 'Safety Health', render: p => <StatusBadge status={p.health.safety} /> },
        ];
        return { rows, columns, csv: rows.map(p => ({ Code: p.code, Project: p.name, Client: p.client, Status: p.status, Progress: `${p.progress}%`, Cost: p.health.cost, Schedule: p.health.schedule, Quality: p.health.quality, Safety: p.health.safety })) };
      }
      case 'planned-actual': {
        const phaseRows = projects.flatMap(p => p.phases.map(ph => ({ ...ph, id: `${p.id}-${ph.id}`, projectName: p.name, projectCode: p.code })))
          .filter(r => (!projectId || projects.find(p => p.code === r.projectCode)?.id === projectId));
        const columns: Column<typeof phaseRows[number]>[] = [
          { key: 'project', label: 'Project', accessor: r => r.projectName },
          { key: 'phase', label: 'Phase', accessor: r => r.name },
          { key: 'plannedStart', label: 'Planned Start', accessor: r => r.plannedStart, render: r => formatDate(r.plannedStart) },
          { key: 'plannedEnd', label: 'Planned End', accessor: r => r.plannedEnd, render: r => formatDate(r.plannedEnd) },
          { key: 'actualStart', label: 'Actual Start', render: r => r.actualStart ? formatDate(r.actualStart) : '—' },
          { key: 'actualEnd', label: 'Actual End', render: r => r.actualEnd ? formatDate(r.actualEnd) : 'In progress' },
          { key: 'progress', label: 'Progress', accessor: r => r.progress, render: r => `${r.progress}%` },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
        ];
        return { rows: phaseRows, columns, csv: phaseRows.map(r => ({ Project: r.projectName, Phase: r.name, PlannedStart: r.plannedStart, PlannedEnd: r.plannedEnd, ActualStart: r.actualStart || '', ActualEnd: r.actualEnd || '', Progress: r.progress, Status: r.status })) };
      }
      case 'budget-actual': {
        const rows = projects.filter(p => (!client || p.client === client) && (!projectId || p.id === projectId));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'name', label: 'Project', sortable: true, accessor: p => p.name },
          { key: 'budget', label: 'Approved Budget', accessor: p => p.financials.approvedBudget, render: p => formatCurrency(p.financials.approvedBudget) },
          { key: 'actual', label: 'Actual Expenses', accessor: p => p.financials.actualExpenses, render: p => formatCurrency(p.financials.actualExpenses) },
          { key: 'variance', label: 'Variance', render: p => {
            const v = p.financials.approvedBudget - p.financials.actualExpenses;
            return <span className={v < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>{formatCurrency(v)}</span>;
          } },
          { key: 'pct', label: '% Spent', render: p => `${((p.financials.actualExpenses / p.financials.approvedBudget) * 100).toFixed(1)}%` },
        ];
        return { rows, columns, csv: rows.map(p => ({ Project: p.name, Budget: p.financials.approvedBudget, Actual: p.financials.actualExpenses, Variance: p.financials.approvedBudget - p.financials.actualExpenses })) };
      }
      case 'delayed': {
        const rows = projects.filter(p => p.status === 'Delayed' && (!client || p.client === client));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'name', label: 'Project', accessor: p => p.name },
          { key: 'client', label: 'Client', accessor: p => p.client },
          { key: 'pm', label: 'Project Manager', accessor: p => p.projectManager },
          { key: 'target', label: 'Target Completion', accessor: p => p.targetCompletionDate, render: p => formatDate(p.targetCompletionDate) },
          { key: 'blockers', label: 'Blockers', render: p => p.blockers.join('; ') || '—' },
        ];
        return { rows, columns, csv: rows.map(p => ({ Project: p.name, Client: p.client, PM: p.projectManager, Target: p.targetCompletionDate, Blockers: p.blockers.join('; ') })) };
      }
      case 'milestones': {
        const rows = projects.flatMap(p => p.milestones.filter(m => m.status !== 'Completed').map(m => ({ ...m, id: `${p.id}-${m.id}`, projectName: p.name })))
          .filter(r => inDateRange(r.dueDate))
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'project', label: 'Project', accessor: r => r.projectName },
          { key: 'milestone', label: 'Milestone', accessor: r => r.name },
          { key: 'dueDate', label: 'Due Date', sortable: true, accessor: r => r.dueDate, render: r => formatDate(r.dueDate) },
          { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
        ];
        return { rows, columns, csv: rows.map(r => ({ Project: r.projectName, Milestone: r.name, DueDate: r.dueDate, Status: r.status })) };
      }
      case 'bidding-pipeline': {
        const rows = bids.filter(b => !['Awarded', 'Lost', 'Withdrawn', 'Cancelled'].includes(b.stage) && (!client || b.client === client));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'reference', label: 'Reference', accessor: b => b.reference },
          { key: 'title', label: 'Opportunity', sortable: true, accessor: b => b.title },
          { key: 'client', label: 'Client', accessor: b => b.client },
          { key: 'owner', label: 'Bid Owner', accessor: b => b.bidOwner },
          { key: 'stage', label: 'Stage', render: b => <StatusBadge status={b.stage} /> },
          { key: 'value', label: 'Estimated Value', sortable: true, accessor: b => b.estimatedValue, render: b => formatCurrency(b.estimatedValue) },
          { key: 'deadline', label: 'Deadline', accessor: b => b.submissionDeadline, render: b => formatDate(b.submissionDeadline) },
        ];
        return { rows, columns, csv: rows.map(b => ({ Reference: b.reference, Title: b.title, Client: b.client, Owner: b.bidOwner, Stage: b.stage, Value: b.estimatedValue, Deadline: b.submissionDeadline })) };
      }
      case 'bid-outcomes': {
        const rows = bids.filter(b => b.result && (!client || b.client === client));
        const columns: Column<typeof rows[number]>[] = [
          { key: 'reference', label: 'Reference', accessor: b => b.reference },
          { key: 'title', label: 'Opportunity', accessor: b => b.title },
          { key: 'client', label: 'Client', accessor: b => b.client },
          { key: 'outcome', label: 'Outcome', render: b => <StatusBadge status={b.result!.outcome} /> },
          { key: 'final', label: 'Final Amount', accessor: b => b.result!.finalAmount || 0, render: b => formatCurrency(b.result!.finalAmount) },
          { key: 'reason', label: 'Reason', accessor: b => b.result!.reason || '—' },
        ];
        return { rows, columns, csv: rows.map(b => ({ Reference: b.reference, Title: b.title, Client: b.client, Outcome: b.result!.outcome, FinalAmount: b.result!.finalAmount, Reason: b.result!.reason })) };
      }
      case 'estimate-vs-awarded': {
        const rows = bids.filter(b => b.stage === 'Awarded' || b.result?.outcome === 'Awarded');
        const columns: Column<typeof rows[number]>[] = [
          { key: 'reference', label: 'Reference', accessor: b => b.reference },
          { key: 'title', label: 'Opportunity', accessor: b => b.title },
          { key: 'estimated', label: 'Estimated Value', accessor: b => b.estimatedValue, render: b => formatCurrency(b.estimatedValue) },
          { key: 'awarded', label: 'Awarded Value', render: b => formatCurrency(b.result?.winningAmount ?? b.result?.finalAmount ?? b.estimatedValue) },
          { key: 'variance', label: 'Variance', render: b => {
            const awardedVal = b.result?.winningAmount ?? b.result?.finalAmount ?? b.estimatedValue;
            return formatCurrency(awardedVal - b.estimatedValue);
          } },
        ];
        return { rows, columns, csv: rows.map(b => ({ Reference: b.reference, Title: b.title, Estimated: b.estimatedValue, Awarded: b.result?.winningAmount ?? b.result?.finalAmount ?? b.estimatedValue })) };
      }
      case 'workload': {
        const grouped = allUsers.map(u => ({
          user: u.name, role: u.role,
          taskCount: tasks.filter(t => t.assignee === u.name && t.status !== 'Completed').length,
          overdueCount: tasks.filter(t => t.assignee === u.name && t.status !== 'Completed' && t.dueDate < new Date().toISOString().slice(0, 10)).length,
        })).filter(r => r.taskCount > 0);
        const columns: Column<typeof grouped[number]>[] = [
          { key: 'user', label: 'Team Member', sortable: true, accessor: r => r.user },
          { key: 'role', label: 'Role', accessor: r => r.role },
          { key: 'taskCount', label: 'Active Tasks', sortable: true, accessor: r => r.taskCount },
          { key: 'overdueCount', label: 'Overdue', sortable: true, accessor: r => r.overdueCount },
        ];
        return { rows: grouped, columns, csv: grouped.map(r => ({ TeamMember: r.user, Role: r.role, ActiveTasks: r.taskCount, Overdue: r.overdueCount })) };
      }
      case 'procurement-status': {
        const poRows = purchaseOrders.filter(po => !projectId || po.projectId === projectId);
        const columns: Column<typeof poRows[number]>[] = [
          { key: 'poNumber', label: 'PO Number', accessor: po => po.poNumber },
          { key: 'project', label: 'Project', accessor: po => projects.find(p => p.id === po.projectId)?.name || '—' },
          { key: 'supplier', label: 'Supplier', accessor: po => po.supplier },
          { key: 'amount', label: 'Amount', accessor: po => po.amount, render: po => formatCurrency(po.amount) },
          { key: 'status', label: 'Status', render: po => <StatusBadge status={po.status} /> },
          { key: 'delivery', label: 'Delivery', accessor: po => po.deliveryDate, render: po => formatDate(po.deliveryDate) },
        ];
        return { rows: poRows, columns, csv: poRows.map(po => ({ PONumber: po.poNumber, Supplier: po.supplier, Amount: po.amount, Status: po.status, Delivery: po.deliveryDate })) };
      }
      default:
        return { rows: [], columns: [], csv: [] };
    }
  }, [reportType, projects, bids, tasks, purchaseOrders, materials, client, projectId, dateFrom, dateTo, allUsers]);

  const showClientFilter = ['project-status', 'budget-actual', 'delayed', 'bidding-pipeline', 'bid-outcomes'].includes(reportType);
  const showProjectFilter = ['project-status', 'planned-actual', 'budget-actual', 'procurement-status'].includes(reportType);
  const showDateFilter = ['milestones'].includes(reportType);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Reports' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-3">
        <h4 className="fw-bold mb-0">Reports</h4>
        {canExport && (
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" onClick={() => window.print()}><i className="bi bi-printer me-1" /> Print</Button>
            <Button size="sm" variant="outline-primary" onClick={() => exportToCsv(reportType, content.csv)}><i className="bi bi-download me-1" /> Export CSV</Button>
          </div>
        )}
      </div>

      <div className="section-card p-3 mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={12} md={4}>
            <Form.Label className="small mb-1">Report</Form.Label>
            <Form.Select value={reportType} onChange={e => setReportType(e.target.value)}>
              {REPORTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Form.Select>
          </Col>
          {showClientFilter && (
            <Col xs={6} md={3}>
              <Form.Label className="small mb-1">Client</Form.Label>
              <Form.Select value={client} onChange={e => setClient(e.target.value)}>
                <option value="">All clients</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Col>
          )}
          {showProjectFilter && (
            <Col xs={6} md={3}>
              <Form.Label className="small mb-1">Project</Form.Label>
              <Form.Select value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">All projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Form.Select>
            </Col>
          )}
          {showDateFilter && (
            <>
              <Col xs={6} md={2}>
                <Form.Label className="small mb-1">From</Form.Label>
                <Form.Control type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small mb-1">To</Form.Label>
                <Form.Control type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </Col>
            </>
          )}
        </Row>
      </div>

      {content.rows.length === 0 ? (
        <EmptyState icon="bi-bar-chart-line" title="No data for this report" message="Try adjusting the filters." />
      ) : (
        <DataTable<any>
          columns={content.columns as Column<any>[]}
          rows={content.rows as any[]}
          keyField={(r: any) => r.id || r.reference || r.user}
          pageSize={12}
        />
      )}
    </div>
  );
}
