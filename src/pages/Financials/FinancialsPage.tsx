import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatCompactCurrency, formatCurrency } from '../../utils/format';
import type { Project } from '../../types';

export default function FinancialsPage() {
  const { projects } = useData();
  const { can } = useAuth();
  const navigate = useNavigate();

  if (!can('projects.financials.view')) {
    return <EmptyState icon="bi-shield-lock" title="Restricted" message="Your role does not have permission to view financial data." />;
  }

  const activeProjects = projects.filter(p => !['Completed', 'Closed', 'Cancelled'].includes(p.status));
  const totalContractValue = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalExpenses = projects.reduce((s, p) => s + p.financials.actualExpenses, 0);
  const totalOutstanding = projects.reduce((s, p) => s + (p.financials.billed - p.financials.paymentsReceived), 0);
  const totalCommitted = projects.reduce((s, p) => s + p.financials.committedCost, 0);

  const columns: Column<Project>[] = [
    { key: 'code', label: 'Code', accessor: p => p.code },
    { key: 'name', label: 'Project', sortable: true, accessor: p => p.name },
    { key: 'contractValue', label: 'Contract Value', sortable: true, accessor: p => p.contractValue, render: p => formatCurrency(p.contractValue) },
    { key: 'approvedBudget', label: 'Approved Budget', accessor: p => p.financials.approvedBudget, render: p => formatCurrency(p.financials.approvedBudget) },
    { key: 'actualExpenses', label: 'Actual Expenses', sortable: true, accessor: p => p.financials.actualExpenses, render: p => (
      <span className={p.financials.actualExpenses > p.financials.approvedBudget ? 'text-danger fw-semibold' : ''}>{formatCurrency(p.financials.actualExpenses)}</span>
    ) },
    { key: 'billed', label: 'Billed', accessor: p => p.financials.billed, render: p => formatCurrency(p.financials.billed) },
    { key: 'outstanding', label: 'Outstanding', sortable: true, accessor: p => p.financials.billed - p.financials.paymentsReceived, render: p => formatCurrency(p.financials.billed - p.financials.paymentsReceived) },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Financials' }]} />
      <h4 className="fw-bold mt-2 mb-3">Financial Overview</h4>

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Total Contract Value" value={formatCompactCurrency(totalContractValue)} icon="bi-file-earmark-text" variant="primary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Committed Cost" value={formatCompactCurrency(totalCommitted)} icon="bi-journal-check" variant="secondary" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Total Expenses" value={formatCompactCurrency(totalExpenses)} icon="bi-cash-stack" variant="info" /></Col>
        <Col xs={12} sm={6} lg={3}><SummaryCard label="Outstanding Billings" value={formatCompactCurrency(totalOutstanding)} icon="bi-receipt" variant="warning" /></Col>
      </Row>

      <h6 className="fw-bold mb-2">By Project ({activeProjects.length} active)</h6>
      {projects.length === 0 ? (
        <EmptyState icon="bi-cash-coin" title="No project financials available" />
      ) : (
        <DataTable columns={columns} rows={projects} keyField={p => p.id} onRowClick={p => navigate(`/projects/${p.id}/financials`)} pageSize={10} />
      )}
    </div>
  );
}
