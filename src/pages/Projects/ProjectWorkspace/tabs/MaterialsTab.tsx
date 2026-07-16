import DataTable, { type Column } from '../../../../components/ui/DataTable';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { formatCurrency, formatDate, isOverdue } from '../../../../utils/format';
import type { Project, MaterialItem } from '../../../../types';

export default function MaterialsTab({ project }: { project: Project }) {
  const { materials } = useData();
  const projectMaterials = materials.filter(m => m.projectId === project.id);
  const alerts = projectMaterials.filter(m => m.lowStock || (m.receivedQty < m.requestedQty && isOverdue(m.deliveryDate)));

  const columns: Column<MaterialItem>[] = [
    { key: 'name', label: 'Material', sortable: true, accessor: m => m.name, render: m => (
      <span className="fw-semibold">{m.name}{m.lowStock && <i className="bi bi-exclamation-triangle-fill text-warning ms-2" title="Low stock" />}</span>
    ) },
    { key: 'unit', label: 'Unit', accessor: m => m.unit },
    { key: 'requestedQty', label: 'Requested', sortable: true, accessor: m => m.requestedQty },
    { key: 'receivedQty', label: 'Received', sortable: true, accessor: m => m.receivedQty },
    { key: 'issuedQty', label: 'Issued', sortable: true, accessor: m => m.issuedQty },
    { key: 'remaining', label: 'Remaining', accessor: m => m.receivedQty - m.issuedQty, render: m => m.receivedQty - m.issuedQty },
    { key: 'storageLocation', label: 'Location', accessor: m => m.storageLocation },
    { key: 'supplier', label: 'Supplier', accessor: m => m.supplier },
    { key: 'unitCost', label: 'Unit Cost', sortable: true, accessor: m => m.unitCost, render: m => formatCurrency(m.unitCost) },
    { key: 'deliveryDate', label: 'Delivery', sortable: true, accessor: m => m.deliveryDate, render: m => (
      <span className={m.receivedQty < m.requestedQty && isOverdue(m.deliveryDate) ? 'text-danger fw-semibold' : ''}>{formatDate(m.deliveryDate)}</span>
    ) },
  ];

  return (
    <div>
      {alerts.length > 0 && (
        <div className="section-card p-3 mb-3 border-warning">
          <h6 className="fw-bold mb-2 text-warning-emphasis"><i className="bi bi-exclamation-triangle-fill me-2" />Material Alerts</h6>
          <ul className="mb-0 ps-3 small">
            {alerts.map(m => (
              <li key={m.id}>
                {m.name} — {m.lowStock ? 'running low on stock' : 'delivery overdue'} (supplier: {m.supplier})
              </li>
            ))}
          </ul>
        </div>
      )}
      {projectMaterials.length === 0 ? (
        <EmptyState icon="bi-box-seam" title="No materials tracked" message="Materials requested for this project will appear here." />
      ) : (
        <DataTable columns={columns} rows={projectMaterials} keyField={m => m.id} pageSize={8} />
      )}
    </div>
  );
}
