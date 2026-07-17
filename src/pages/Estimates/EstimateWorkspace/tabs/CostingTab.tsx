import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { useData } from '../../../../store/DataContext';
import { useAuth } from '../../../../store/AuthContext';
import { computeCosting } from '../../../../utils/estimation';
import { formatCurrency, formatRate, genId } from '../../../../utils/format';
import type { Estimate, IndirectCost, CostingConfig } from '../../../../types';

export default function CostingTab({ estimate }: { estimate: Estimate }) {
  const { updateEstimate } = useData();
  const { can } = useAuth();
  const canManage = can('estimates.manage');
  const c = estimate.costing;
  const breakdown = computeCosting(estimate);

  const [quickRate, setQuickRate] = useState('');
  const [quickArea, setQuickArea] = useState(String(estimate.grossFloorArea || ''));

  const patchCosting = (patch: Partial<CostingConfig>) => updateEstimate(estimate.id, { costing: { ...c, ...patch } });
  const updateIndirect = (id: string, patch: Partial<IndirectCost>) => patchCosting({ indirects: c.indirects.map(i => i.id === id ? { ...i, ...patch } : i) });
  const addIndirect = () => patchCosting({ indirects: [...c.indirects, { id: genId('ic'), label: 'New indirect cost', type: 'percent', value: 0 }] });
  const removeIndirect = (id: string) => patchCosting({ indirects: c.indirects.filter(i => i.id !== id) });

  const quickEstimate = quickRate && quickArea ? Number(quickRate) * Number(quickArea) : 0;

  return (
    <Row className="g-3">
      <Col xs={12} lg={7}>
        <div className="section-card p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0">Indirect Costs</h6>
            {canManage && <Button size="sm" variant="outline-primary" onClick={addIndirect}><i className="bi bi-plus-lg me-1" /> Add</Button>}
          </div>
          <div className="table-responsive-wrapper" style={{ border: 'none' }}>
            <table className="table app-table mb-0">
              <thead><tr><th>Item</th><th style={{ width: 120 }}>Type</th><th style={{ width: 130 }} className="text-end">Value</th><th className="text-end">Amount</th>{canManage && <th></th>}</tr></thead>
              <tbody>
                {c.indirects.map(ind => {
                  const amount = ind.type === 'percent' ? breakdown.directCost * (ind.value / 100) : ind.value;
                  return (
                    <tr key={ind.id}>
                      <td>{canManage ? <Form.Control size="sm" value={ind.label} onChange={e => updateIndirect(ind.id, { label: e.target.value })} /> : ind.label}</td>
                      <td>{canManage ? (
                        <Form.Select size="sm" value={ind.type} onChange={e => updateIndirect(ind.id, { type: e.target.value as 'percent' | 'amount' })}><option value="percent">% of direct</option><option value="amount">Fixed ₱</option></Form.Select>
                      ) : (ind.type === 'percent' ? '% of direct' : 'Fixed ₱')}</td>
                      <td className="text-end">{canManage ? <Form.Control size="sm" type="number" className="text-end" value={ind.value} onChange={e => updateIndirect(ind.id, { value: Number(e.target.value) })} /> : (ind.type === 'percent' ? `${ind.value}%` : formatRate(ind.value))}</td>
                      <td className="text-end fw-semibold">{formatCurrency(amount)}</td>
                      {canManage && <td className="text-end"><Button size="sm" variant="link" className="p-0 text-danger" onClick={() => removeIndirect(ind.id)}><i className="bi bi-trash" /></Button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-3">Markup &amp; Taxes</h6>
          <Row className="g-3">
            <Col xs={4}>
              <Form.Label className="small mb-1">Contingency (%)</Form.Label>
              <Form.Control type="number" size="sm" value={c.contingencyPct} disabled={!canManage} onChange={e => patchCosting({ contingencyPct: Number(e.target.value) })} />
            </Col>
            <Col xs={4}>
              <Form.Label className="small mb-1">Profit Margin (%)</Form.Label>
              <Form.Control type="number" size="sm" value={c.profitMarginPct} disabled={!canManage} onChange={e => patchCosting({ profitMarginPct: Number(e.target.value) })} />
            </Col>
            <Col xs={4}>
              <Form.Label className="small mb-1">VAT (%)</Form.Label>
              <Form.Control type="number" size="sm" value={c.vatPct} disabled={!canManage} onChange={e => patchCosting({ vatPct: Number(e.target.value) })} />
            </Col>
          </Row>
        </div>
      </Col>

      <Col xs={12} lg={5}>
        <div className="section-card p-3 mb-3 costing-summary-sheet">
          <h6 className="fw-bold mb-3">Summary Sheet</h6>
          <div className="css-row"><span>Direct Cost (BOQ)</span><span>{formatCurrency(breakdown.directCost)}</span></div>
          {breakdown.indirectLines.map((l, i) => <div className="css-row css-sub" key={i}><span>+ {l.label} <em>({l.detail})</em></span><span>{formatCurrency(l.amount)}</span></div>)}
          <div className="css-row css-sub"><span>+ Contingency ({c.contingencyPct}%)</span><span>{formatCurrency(breakdown.contingency)}</span></div>
          <div className="css-row css-subtotal"><span>Subtotal</span><span>{formatCurrency(breakdown.subtotal)}</span></div>
          <div className="css-row"><span>+ Profit Margin ({c.profitMarginPct}%)</span><span>{formatCurrency(breakdown.margin)}</span></div>
          <div className="css-row css-subtotal"><span>Pre-VAT Amount</span><span>{formatCurrency(breakdown.preVat)}</span></div>
          <div className="css-row"><span>+ VAT ({c.vatPct}%)</span><span>{formatCurrency(breakdown.vat)}</span></div>
          <div className="css-row css-total"><span>Contract Price</span><span>{formatCurrency(breakdown.contractPrice)}</span></div>
          {estimate.grossFloorArea > 0 && <div className="css-row css-persqm"><span>Per sqm ({estimate.grossFloorArea} sqm)</span><span>{formatRate(breakdown.perSqm)}</span></div>}
        </div>

        <div className="section-card p-3">
          <h6 className="fw-bold mb-2">Quick Per-sqm Estimate</h6>
          <p className="text-secondary small mb-2">For early client discussions — multiply a per-sqm rate by floor area.</p>
          <Row className="g-2 align-items-end">
            <Col xs={6}>
              <Form.Label className="small mb-1">Rate / sqm</Form.Label>
              <InputGroup size="sm"><InputGroup.Text>₱</InputGroup.Text><Form.Control type="number" value={quickRate} onChange={e => setQuickRate(e.target.value)} placeholder="22000" /></InputGroup>
            </Col>
            <Col xs={6}>
              <Form.Label className="small mb-1">Floor Area (sqm)</Form.Label>
              <Form.Control size="sm" type="number" value={quickArea} onChange={e => setQuickArea(e.target.value)} />
            </Col>
          </Row>
          <div className="mt-2 d-flex justify-content-between align-items-center">
            <button className="btn btn-link btn-sm px-0" onClick={() => setQuickRate(String(Math.round(breakdown.perSqm)))}>Use current per-sqm ({formatRate(breakdown.perSqm)})</button>
            <div className="text-end"><div className="small text-secondary">Quick estimate</div><div className="fs-5 fw-bold">{formatCurrency(quickEstimate)}</div></div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
