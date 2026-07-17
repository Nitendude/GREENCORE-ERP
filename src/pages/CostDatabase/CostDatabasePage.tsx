import { useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import SummaryCard from '../../components/ui/SummaryCard';
import DataTable, { type Column } from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import { formatRate, formatDate, formatCompactCurrency, genId } from '../../utils/format';
import type { CostMaterial, LaborRate, EquipmentRate, ProductivityRate, MaterialCategory } from '../../types';

const TABS = [
  { key: 'materials', label: 'Materials', icon: 'bi-box-seam' },
  { key: 'labor', label: 'Labor Rates', icon: 'bi-person-workspace' },
  { key: 'equipment', label: 'Equipment', icon: 'bi-truck' },
  { key: 'productivity', label: 'Productivity', icon: 'bi-speedometer' },
] as const;

const CATEGORIES: MaterialCategory[] = ['Cement & Aggregates', 'Masonry', 'Steel & Rebar', 'Lumber & Formwork', 'Finishes', 'Electrical', 'Plumbing', 'Hardware', 'Roofing', 'Miscellaneous'];

export default function CostDatabasePage() {
  const { costMaterials, laborRates, equipmentRates, productivityRates, updateCostMaterialPrice, bulkAdjustMaterialPrices, addCostMaterial } = useData();
  const { can, currentUser } = useAuth();
  const canManage = can('costdb.manage');
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('materials');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceMat, setPriceMat] = useState<CostMaterial | null>(null);
  const [historyMat, setHistoryMat] = useState<CostMaterial | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const filteredMaterials = useMemo(() => {
    let list = costMaterials;
    if (search.trim()) list = list.filter(m => (m.name + m.code).toLowerCase().includes(search.trim().toLowerCase()));
    if (category) list = list.filter(m => m.category === category);
    return list;
  }, [costMaterials, search, category]);

  const materialCols: Column<CostMaterial>[] = [
    { key: 'code', label: 'Code', sortable: true, accessor: m => m.code, render: m => <span className="fw-semibold">{m.code}</span> },
    { key: 'name', label: 'Material', sortable: true, accessor: m => m.name },
    { key: 'category', label: 'Category', accessor: m => m.category },
    { key: 'unit', label: 'Unit', accessor: m => m.unit },
    { key: 'unitCost', label: 'Unit Cost', sortable: true, accessor: m => m.unitCost, render: m => <span className="fw-semibold">{formatRate(m.unitCost)}</span> },
    { key: 'supplier', label: 'Supplier', accessor: m => m.supplier },
    { key: 'updated', label: 'Updated', sortable: true, accessor: m => m.updatedAt, render: m => formatDate(m.updatedAt) },
    { key: 'actions', label: '', render: m => (
      <div className="d-flex gap-1 justify-content-end">
        <Button size="sm" variant="outline-secondary" title="Price history" onClick={() => setHistoryMat(m)}><i className="bi bi-graph-up" /></Button>
        {canManage && <Button size="sm" variant="outline-primary" title="Update price" onClick={() => setPriceMat(m)}><i className="bi bi-pencil" /></Button>}
      </div>
    ) },
  ];

  const laborCols: Column<LaborRate>[] = [
    { key: 'trade', label: 'Trade', sortable: true, accessor: r => r.trade, render: r => <span className="fw-semibold">{r.trade}</span> },
    { key: 'skill', label: 'Skill Level', accessor: r => r.skill },
    { key: 'dailyRate', label: 'Daily Rate (man-day)', sortable: true, accessor: r => r.dailyRate, render: r => formatRate(r.dailyRate) },
    { key: 'updated', label: 'Updated', accessor: r => r.updatedAt, render: r => formatDate(r.updatedAt) },
  ];

  const equipCols: Column<EquipmentRate>[] = [
    { key: 'name', label: 'Equipment', sortable: true, accessor: r => r.name, render: r => <span className="fw-semibold">{r.name}</span> },
    { key: 'ownership', label: 'Ownership', accessor: r => r.ownership, render: r => <span className={`badge ${r.ownership === 'Owned' ? 'text-bg-success' : 'text-bg-secondary'}`}>{r.ownership}</span> },
    { key: 'hourlyRate', label: 'Hourly', sortable: true, accessor: r => r.hourlyRate, render: r => formatRate(r.hourlyRate) },
    { key: 'dailyRate', label: 'Daily', sortable: true, accessor: r => r.dailyRate, render: r => formatRate(r.dailyRate) },
    { key: 'updated', label: 'Updated', accessor: r => r.updatedAt, render: r => formatDate(r.updatedAt) },
  ];

  const prodCols: Column<ProductivityRate>[] = [
    { key: 'workItem', label: 'Work Item', sortable: true, accessor: r => r.workItem, render: r => <span className="fw-semibold">{r.workItem}</span> },
    { key: 'output', label: 'Output / Man-Day', sortable: true, accessor: r => r.outputPerManDay, render: r => `${r.outputPerManDay} ${r.unit}` },
    { key: 'crew', label: 'Standard Crew', accessor: r => r.crew },
    { key: 'updated', label: 'Updated', accessor: r => r.updatedAt, render: r => formatDate(r.updatedAt) },
  ];

  const materialValue = costMaterials.reduce((s, m) => s + m.unitCost, 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Cost Database' }]} />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 mb-2">
        <div>
          <h4 className="fw-bold mb-1">Item &amp; Cost Database</h4>
          <p className="text-secondary small mb-0">The pricing foundation for BOQ, BOM, and quotation generation.</p>
        </div>
        {canManage && tab === 'materials' && (
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setShowBulk(true)}><i className="bi bi-arrow-repeat me-1" /> Bulk Price Update</Button>
            <Button variant="primary" onClick={() => setShowAdd(true)}><i className="bi bi-plus-lg me-1" /> Add Material</Button>
          </div>
        )}
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><SummaryCard label="Materials" value={costMaterials.length} icon="bi-box-seam" variant="primary" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Labor Trades" value={laborRates.length} icon="bi-person-workspace" variant="info" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Equipment" value={equipmentRates.length} icon="bi-truck" variant="secondary" /></Col>
        <Col xs={6} lg={3}><SummaryCard label="Sum of Unit Costs" value={formatCompactCurrency(materialValue)} icon="bi-cash-stack" variant="success" /></Col>
      </Row>

      <div className="tab-scroll-nav">
        <ul className="nav nav-tabs">
          {TABS.map(t => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <i className={`bi ${t.icon} me-1`} /> {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {tab === 'materials' && (
        <>
          <div className="section-card p-3 mb-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} md={7}><Form.Label className="small mb-1">Search</Form.Label><Form.Control placeholder="Material name or code…" value={search} onChange={e => setSearch(e.target.value)} /></Col>
              <Col xs={12} md={5}><Form.Label className="small mb-1">Category</Form.Label><Form.Select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Form.Select></Col>
            </Row>
          </div>
          {filteredMaterials.length === 0 ? <EmptyState icon="bi-box-seam" title="No materials found" /> : <DataTable columns={materialCols} rows={filteredMaterials} keyField={m => m.id} pageSize={10} />}
        </>
      )}
      {tab === 'labor' && <DataTable columns={laborCols} rows={laborRates} keyField={r => r.id} pageSize={12} />}
      {tab === 'equipment' && <DataTable columns={equipCols} rows={equipmentRates} keyField={r => r.id} pageSize={12} />}
      {tab === 'productivity' && <DataTable columns={prodCols} rows={productivityRates} keyField={r => r.id} pageSize={12} />}

      <UpdatePriceModal material={priceMat} onClose={() => setPriceMat(null)} onSave={(unitCost, supplier, note) => { if (priceMat) updateCostMaterialPrice(priceMat.id, unitCost, supplier, note, currentUser.name); setPriceMat(null); }} />
      <PriceHistoryModal material={historyMat} onClose={() => setHistoryMat(null)} />
      <BulkUpdateModal show={showBulk} onClose={() => setShowBulk(false)} onApply={pct => { bulkAdjustMaterialPrices(pct, currentUser.name); setShowBulk(false); }} />
      <AddMaterialModal show={showAdd} onClose={() => setShowAdd(false)} onSave={m => { addCostMaterial(m); setShowAdd(false); }} />
    </div>
  );
}

function UpdatePriceModal({ material, onClose, onSave }: { material: CostMaterial | null; onClose: () => void; onSave: (unitCost: number, supplier: string, note: string) => void }) {
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const open = material !== null;
  return (
    <Modal show={open} onHide={onClose} centered onEntered={() => { setUnitCost(String(material?.unitCost ?? '')); setSupplier(material?.supplier ?? ''); setNote(''); }}>
      <Modal.Header closeButton><Modal.Title as="h5">Update Price — {material?.name}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col xs={6}><Form.Group controlId="up-cost"><Form.Label className="form-required">New Unit Cost (₱)</Form.Label><Form.Control type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} /></Form.Group></Col>
          <Col xs={6}><Form.Group controlId="up-sup"><Form.Label>Supplier</Form.Label><Form.Control value={supplier} onChange={e => setSupplier(e.target.value)} /></Form.Group></Col>
          <Col xs={12}><Form.Group controlId="up-note"><Form.Label>Note</Form.Label><Form.Control value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for change (optional)" /></Form.Group></Col>
        </Row>
        <Form.Text>Previous prices are kept in the material's price history.</Form.Text>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!unitCost || Number.isNaN(Number(unitCost))} onClick={() => onSave(Number(unitCost), supplier, note)}>Save Price</Button>
      </Modal.Footer>
    </Modal>
  );
}

function PriceHistoryModal({ material, onClose }: { material: CostMaterial | null; onClose: () => void }) {
  return (
    <Modal show={material !== null} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title as="h5">Price History — {material?.name}</Modal.Title></Modal.Header>
      <Modal.Body>
        {!material || material.priceHistory.length === 0 ? <EmptyState icon="bi-graph-up" title="No price history" /> : (
          <table className="table app-table mb-0">
            <thead><tr><th>Date</th><th>Unit Cost</th><th>Supplier</th><th>Note</th></tr></thead>
            <tbody>
              {[...material.priceHistory].reverse().map((p, i) => (
                <tr key={i}><td>{formatDate(p.date)}</td><td className="fw-semibold">{formatRate(p.unitCost)}</td><td>{p.supplier}</td><td className="small text-secondary">{p.note || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Close</Button></Modal.Footer>
    </Modal>
  );
}

function BulkUpdateModal({ show, onClose, onApply }: { show: boolean; onClose: () => void; onApply: (pct: number) => void }) {
  const [pct, setPct] = useState('0');
  return (
    <Modal show={show} onHide={onClose} centered onEntered={() => setPct('0')}>
      <Modal.Header closeButton><Modal.Title as="h5">Bulk Price Update</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="small text-secondary">Apply a percentage adjustment to <strong>all</strong> material unit costs to keep the database current with market movement. Each change is recorded in price history.</p>
        <Form.Group controlId="bulk-pct">
          <Form.Label>Adjustment (%)</Form.Label>
          <Form.Control type="number" value={pct} onChange={e => setPct(e.target.value)} placeholder="e.g. 5 for +5%, -3 for -3%" />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!pct || Number.isNaN(Number(pct)) || Number(pct) === 0} onClick={() => onApply(Number(pct))}>Apply to All</Button>
      </Modal.Footer>
    </Modal>
  );
}

function AddMaterialModal({ show, onClose, onSave }: { show: boolean; onClose: () => void; onSave: (m: CostMaterial) => void }) {
  const [form, setForm] = useState({ code: '', name: '', category: 'Miscellaneous' as MaterialCategory, unit: '', unitCost: '', supplier: '' });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.unit.trim() || !form.unitCost) return;
    const today = new Date().toISOString().slice(0, 10);
    onSave({
      id: genId('cm'), code: form.code.trim() || `MAT-${Math.floor(Math.random() * 900 + 100)}`, name: form.name.trim(),
      category: form.category, unit: form.unit.trim(), unitCost: Number(form.unitCost), supplier: form.supplier.trim(),
      updatedAt: today, priceHistory: [{ date: today, unitCost: Number(form.unitCost), supplier: form.supplier.trim() || 'Initial' }],
    });
    setForm({ code: '', name: '', category: 'Miscellaneous', unit: '', unitCost: '', supplier: '' });
  };
  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title as="h5">Add Material</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={4}><Form.Group controlId="am-code"><Form.Label>Code</Form.Label><Form.Control value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></Form.Group></Col>
            <Col xs={8}><Form.Group controlId="am-name"><Form.Label className="form-required">Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Form.Group></Col>
            <Col xs={6}><Form.Group controlId="am-cat"><Form.Label>Category</Form.Label><Form.Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MaterialCategory }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Form.Select></Form.Group></Col>
            <Col xs={3}><Form.Group controlId="am-unit"><Form.Label className="form-required">Unit</Form.Label><Form.Control required value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="bag" /></Form.Group></Col>
            <Col xs={3}><Form.Group controlId="am-cost"><Form.Label className="form-required">Unit Cost</Form.Label><Form.Control required type="number" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} /></Form.Group></Col>
            <Col xs={12}><Form.Group controlId="am-sup"><Form.Label>Supplier</Form.Label><Form.Control value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></Form.Group></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Add Material</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
