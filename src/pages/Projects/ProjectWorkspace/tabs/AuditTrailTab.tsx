import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import DataTable, { type Column } from '../../../../components/ui/DataTable';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { formatDateTime } from '../../../../utils/format';
import type { Project, AuditEntry } from '../../../../types';

export default function AuditTrailTab({ project }: { project: Project }) {
  const { auditLog } = useData();
  const [actionFilter, setActionFilter] = useState('');

  const entries = auditLog.filter(a => a.entityType === 'project' && a.entityId === project.id);
  const actionTypes = Array.from(new Set(entries.map(e => e.action.split(' ')[0])));
  const filtered = actionFilter ? entries.filter(e => e.action.startsWith(actionFilter)) : entries;

  const columns: Column<AuditEntry>[] = [
    { key: 'user', label: 'User', sortable: true, accessor: e => e.user },
    { key: 'action', label: 'Action', accessor: e => e.action },
    { key: 'change', label: 'Previous → Updated', render: e => (
      e.previousValue || e.newValue
        ? <span className="small">{e.previousValue || '—'} → {e.newValue || '—'}</span>
        : <span className="text-secondary">—</span>
    ) },
    { key: 'relatedRecord', label: 'Related Record', accessor: e => e.relatedRecord || '—' },
    { key: 'timestamp', label: 'Date & Time', sortable: true, accessor: e => e.timestamp, render: e => formatDateTime(e.timestamp) },
  ];

  return (
    <div>
      <div className="section-card p-3 mb-3">
        <Form.Label className="small mb-1">Filter by activity type</Form.Label>
        <Form.Select style={{ maxWidth: 260 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All activity</option>
          {actionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </Form.Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="bi-clock-history" title="No audit history" />
      ) : (
        <DataTable columns={columns} rows={filtered} keyField={e => e.id} pageSize={10} />
      )}
    </div>
  );
}
