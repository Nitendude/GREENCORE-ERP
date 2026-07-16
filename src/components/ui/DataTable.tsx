import { useMemo, useState } from 'react';
import Table from 'react-bootstrap/Table';
import BsPagination from 'react-bootstrap/Pagination';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  accessor?: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns, rows, keyField, onRowClick, pageSize = 10,
  emptyTitle = 'No records found', emptyMessage = 'Try adjusting your search or filters.',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.accessor) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
    setPage(1);
  };

  if (rows.length === 0) {
    return <EmptyState icon="bi-inbox" title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      <div className="table-responsive-wrapper">
        <Table hover responsive className="app-table align-middle mb-0">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.className}
                  role={col.sortable ? 'button' : undefined}
                  onClick={() => handleSort(col)}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <i
                        className={`bi ${sortKey === col.key ? (sortDir === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill') : 'bi-caret-down'} sort-icon`}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map(row => (
              <tr
                key={keyField(row)}
                onClick={() => onRowClick?.(row)}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} className={col.className}>
                    {col.render ? col.render(row) : String(col.accessor?.(row) ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
          <span className="text-secondary small">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <BsPagination className="mb-0">
            <BsPagination.Prev disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
              .reduce<number[]>((acc, p) => {
                if (acc.length && p - acc[acc.length - 1] > 1) acc.push(-1);
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => p === -1 ? (
                <BsPagination.Ellipsis key={`e${idx}`} disabled />
              ) : (
                <BsPagination.Item key={p} active={p === currentPage} onClick={() => setPage(p)}>
                  {p}
                </BsPagination.Item>
              ))}
            <BsPagination.Next disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} />
          </BsPagination>
        </div>
      )}
    </div>
  );
}
