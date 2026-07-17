import { useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import EmptyState from '../../../../components/ui/EmptyState';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { lineDirectUnit, lineDirectCost, directCostTotal, divisionTotals, nextRevisionLabel } from '../../../../utils/estimation';
import { formatCurrency, formatRate, formatQty, formatDate, genId } from '../../../../utils/format';
import type { Estimate, BoqLineItem, BoqDivision } from '../../../../types';

const DIVISIONS: BoqDivision[] = ['General Requirements', 'Earthworks', 'Concrete', 'Masonry', 'Metal Works', 'Wood & Plastics', 'Thermal & Moisture', 'Doors & Windows', 'Finishes', 'Electrical', 'Plumbing', 'Mechanical', 'Fire Protection', 'Siteworks'];

const emptyLine = (): Omit<BoqLineItem, 'id'> => ({ division: 'Concrete', description: '', unit: '', quantity: 0, materialUnitCost: 0, laborUnitCost: 0, equipmentUnitCost: 0 });

export default function BoqTab({ estimate }: { estimate: Estimate }) {
  const { updateEstimate, compositionTemplates } = useData();
  const { can, currentUser } = useAuth();
  const canManage = can('estimates.manage');
  const [editing, setEditing] = useState<BoqLineItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, BoqLineItem[]>();
    for (const item of estimate.boqItems) {
      const arr = map.get(item.division) ?? [];
      arr.push(item);
      map.set(item.division, arr);
    }
    return Array.from(map.entries());
  }, [estimate.boqItems]);

  const total = directCostTotal(estimate.boqItems);

  const saveLine = (line: BoqLineItem) => {
    const exists = estimate.boqItems.some(i => i.id === line.id);
    const items = exists ? estimate.boqItems.map(i => i.id === line.id ? line : i) : [...estimate.boqItems, line];
    updateEstimate(estimate.id, { boqItems: items });
    setShowForm(false); setEditing(null);
  };

  const deleteLine = (id: string) => {
    updateEstimate(estimate.id, { boqItems: estimate.boqItems.filter(i => i.id !== id) });
  };

  const saveRevision = (note: string) => {
    const label = nextRevisionLabel(estimate.currentRevision);
    const revision = { id: genId('brv'), label, date: new Date().toISOString().slice(0, 10), author: currentUser.name, note, lineItemCount: estimate.boqItems.length, directCost: total };
    updateEstimate(estimate.id, { boqRevisions: [...estimate.boqRevisions, revision], currentRevision: label });
  };

  const importLines = (rows: Omit<BoqLineItem, 'id'>[]) => {
    const items = [...estimate.boqItems, ...rows.map(r => ({ ...r, id: genId('bl') }))];
    updateEstimate(estimate.id, { boqItems: items });
    setShowImport(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h6 className="fw-bold mb-0">Bill of Quantities — {estimate.currentRevision}</h6>
        {canManage && (
          <div className="d-flex gap-2 flex-wrap">
            <Button size="sm" variant="outline-secondary" onClick={() => setShowHistory(true)}><i className="bi bi-clock-history me-1" /> Revisions</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setShowImport(true)}><i className="bi bi-file-earmark-excel me-1" /> Import (Excel/CSV)</Button>
            <Button size="sm" variant="primary" onClick={() => { setEditing(null); setShowForm(true); }}><i className="bi bi-plus-lg me-1" /> Add Line Item</Button>
          </div>
        )}
      </div>

      {estimate.boqItems.length === 0 ? (
        <EmptyState icon="bi-list-columns-reverse" title="No line items yet" message="Add quantity take-off items or import from Excel/CSV." actionLabel={canManage ? 'Add Line Item' : undefined} onAction={canManage ? () => setShowForm(true) : undefined} />
      ) : (
        <>
          {grouped.map(([division, items]) => {
            const subtotal = items.reduce((s, i) => s + lineDirectCost(i), 0);
            return (
              <div key={division} className="section-card mb-3">
                <div className="boq-division-header"><span>{division}</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="table-responsive-wrapper" style={{ border: 'none' }}>
                  <table className="table app-table boq-table mb-0">
                    <thead>
                      <tr>
                        <th>Description</th><th className="text-end">Qty</th><th>Unit</th>
                        <th className="text-end">Mat.</th><th className="text-end">Labor</th><th className="text-end">Equip.</th>
                        <th className="text-end">Unit Cost</th><th className="text-end">Amount</th>
                        {canManage && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.description}
                            {item.templateId && <span className="badge text-bg-light border ms-2" title="Linked to composition template for BOM"><i className="bi bi-boxes me-1" />{compositionTemplates.find(t => t.id === item.templateId)?.workItem ?? 'template'}</span>}
                          </td>
                          <td className="text-end">{formatQty(item.quantity)}</td>
                          <td>{item.unit}</td>
                          <td className="text-end">{formatRate(item.materialUnitCost)}</td>
                          <td className="text-end">{formatRate(item.laborUnitCost)}</td>
                          <td className="text-end">{formatRate(item.equipmentUnitCost)}</td>
                          <td className="text-end fw-semibold">{formatRate(lineDirectUnit(item))}</td>
                          <td className="text-end fw-semibold">{formatCurrency(lineDirectCost(item))}</td>
                          {canManage && (
                            <td className="text-end text-nowrap">
                              <Button size="sm" variant="link" className="p-0 me-2" onClick={() => { setEditing(item); setShowForm(true); }}><i className="bi bi-pencil" /></Button>
                              <Button size="sm" variant="link" className="p-0 text-danger" onClick={() => deleteLine(item.id)}><i className="bi bi-trash" /></Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="section-card p-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="small text-secondary">{estimate.boqItems.length} line item(s) across {divisionTotals(estimate.boqItems).length} division(s)</div>
              {canManage && <Button size="sm" variant="outline-primary" className="mt-2" onClick={() => saveRevision(`Snapshot at ${new Date().toLocaleString()}`)}><i className="bi bi-bookmark-plus me-1" /> Save BOQ Revision</Button>}
            </div>
            <div className="text-end">
              <div className="small text-secondary">Total Direct Cost</div>
              <div className="fs-5 fw-bold">{formatCurrency(total)}</div>
            </div>
          </div>
        </>
      )}

      <BoqLineModal show={showForm} line={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={saveLine} templates={compositionTemplates.map(t => ({ id: t.id, label: `${t.workItem} (${t.unit})` }))} />
      <ImportModal show={showImport} onClose={() => setShowImport(false)} onImport={importLines} />
      <RevisionHistoryModal show={showHistory} estimate={estimate} onClose={() => setShowHistory(false)} onSave={saveRevision} canManage={canManage} />
    </div>
  );
}

function BoqLineModal({ show, line, onClose, onSave, templates }: { show: boolean; line: BoqLineItem | null; onClose: () => void; onSave: (l: BoqLineItem) => void; templates: { id: string; label: string }[] }) {
  const [form, setForm] = useState<Omit<BoqLineItem, 'id'>>(emptyLine());
  const id = line?.id;
  const onEnter = () => setForm(line ? { ...line } : emptyLine());
  const unit = form.materialUnitCost + form.laborUnitCost + form.equipmentUnitCost;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.unit.trim()) return;
    onSave({ ...form, id: id ?? genId('bl'), quantity: Number(form.quantity) || 0, materialUnitCost: Number(form.materialUnitCost) || 0, laborUnitCost: Number(form.laborUnitCost) || 0, equipmentUnitCost: Number(form.equipmentUnitCost) || 0 });
  };
  return (
    <Modal show={show} onHide={onClose} centered size="lg" onEntered={onEnter}>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title as="h5">{line ? 'Edit' : 'Add'} BOQ Line Item</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={5}><Form.Group controlId="bl-div"><Form.Label>Division</Form.Label><Form.Select value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value as BoqDivision }))}>{DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}</Form.Select></Form.Group></Col>
            <Col md={5}><Form.Group controlId="bl-tpl"><Form.Label>Composition Template (for BOM)</Form.Label><Form.Select value={form.templateId ?? ''} onChange={e => setForm(f => ({ ...f, templateId: e.target.value || undefined }))}><option value="">None</option>{templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</Form.Select></Form.Group></Col>
            <Col md={2}><Form.Group controlId="bl-unit"><Form.Label className="form-required">Unit</Form.Label><Form.Control required value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="sqm" /></Form.Group></Col>
            <Col md={12}><Form.Group controlId="bl-desc"><Form.Label className="form-required">Description</Form.Label><Form.Control required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group></Col>
            <Col md={3}><Form.Group controlId="bl-qty"><Form.Label>Quantity</Form.Label><Form.Control type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></Form.Group></Col>
            <Col md={3}><Form.Group controlId="bl-mat"><Form.Label>Material / unit</Form.Label><Form.Control type="number" value={form.materialUnitCost} onChange={e => setForm(f => ({ ...f, materialUnitCost: Number(e.target.value) }))} /></Form.Group></Col>
            <Col md={3}><Form.Group controlId="bl-lab"><Form.Label>Labor / unit</Form.Label><Form.Control type="number" value={form.laborUnitCost} onChange={e => setForm(f => ({ ...f, laborUnitCost: Number(e.target.value) }))} /></Form.Group></Col>
            <Col md={3}><Form.Group controlId="bl-eq"><Form.Label>Equipment / unit</Form.Label><Form.Control type="number" value={form.equipmentUnitCost} onChange={e => setForm(f => ({ ...f, equipmentUnitCost: Number(e.target.value) }))} /></Form.Group></Col>
          </Row>
          <div className="section-card p-2 mt-3 d-flex justify-content-between px-3">
            <span className="small">Direct unit cost = material + labor + equipment</span>
            <span className="fw-bold">{formatRate(unit)} × {formatQty(Number(form.quantity) || 0)} = {formatCurrency(unit * (Number(form.quantity) || 0))}</span>
          </div>
        </Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit">{line ? 'Save' : 'Add'}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
}

function ImportModal({ show, onClose, onImport }: { show: boolean; onClose: () => void; onImport: (rows: Omit<BoqLineItem, 'id'>[]) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const sample = 'Concrete\tRC footings\tcu.m\t18\t6800\t900\t150\nMasonry\tCHB wall 100mm\tsqm\t220\t420\t130\t20';
  const parse = () => {
    const rows: Omit<BoqLineItem, 'id'>[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cols = line.split(/\t|,/).map(c => c.trim());
      if (cols.length < 4) { setError(`Each row needs at least: Division, Description, Unit, Quantity. Problem near: "${line.slice(0, 40)}"`); return; }
      const [division, description, unit, quantity, mat, lab, eq] = cols;
      rows.push({ division: (DIVISIONS.includes(division as BoqDivision) ? division : 'General Requirements') as BoqDivision, description, unit, quantity: Number(quantity) || 0, materialUnitCost: Number(mat) || 0, laborUnitCost: Number(lab) || 0, equipmentUnitCost: Number(eq) || 0 });
    }
    if (rows.length === 0) { setError('No rows found.'); return; }
    onImport(rows); setText(''); setError('');
  };
  return (
    <Modal show={show} onHide={onClose} centered size="lg" onEntered={() => { setText(''); setError(''); }}>
      <Modal.Header closeButton><Modal.Title as="h5">Import Quantity Take-off</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="small text-secondary mb-2">Paste rows copied from Excel (tab-separated) or CSV. Columns: <code>Division, Description, Unit, Quantity, Material/unit, Labor/unit, Equipment/unit</code>. The last three are optional.</p>
        <Form.Control as="textarea" rows={7} value={text} onChange={e => setText(e.target.value)} placeholder={sample} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
        {error && <div className="text-danger small mt-2">{error}</div>}
        <button className="btn btn-link btn-sm px-0 mt-1" onClick={() => setText(sample)}>Load sample rows</button>
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={parse} disabled={!text.trim()}>Import</Button></Modal.Footer>
    </Modal>
  );
}

function RevisionHistoryModal({ show, estimate, onClose, onSave, canManage }: { show: boolean; estimate: Estimate; onClose: () => void; onSave: (note: string) => void; canManage: boolean }) {
  const [note, setNote] = useState('');
  return (
    <Modal show={show} onHide={onClose} centered onEntered={() => setNote('')}>
      <Modal.Header closeButton><Modal.Title as="h5">BOQ Revision History</Modal.Title></Modal.Header>
      <Modal.Body>
        {estimate.boqRevisions.length === 0 ? <EmptyState icon="bi-clock-history" title="No revisions saved" /> : (
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {[...estimate.boqRevisions].reverse().map(r => (
              <li key={r.id} className="border-bottom pb-2">
                <div className="d-flex justify-content-between"><span className="fw-semibold">{r.label}</span><span className="fw-semibold">{formatCurrency(r.directCost)}</span></div>
                <div className="text-secondary small">{formatDate(r.date)} · {r.author} · {r.lineItemCount} items</div>
                <p className="small mb-0 mt-1">{r.note}</p>
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <div className="mt-3">
            <Form.Label className="small mb-1">Save a new revision snapshot</Form.Label>
            <Form.Control as="textarea" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Change note (what changed in this revision)…" />
            <Button size="sm" variant="primary" className="mt-2" disabled={!note.trim()} onClick={() => { onSave(note); setNote(''); }}>Save Revision</Button>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Close</Button></Modal.Footer>
    </Modal>
  );
}
