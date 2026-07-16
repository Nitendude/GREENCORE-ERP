import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { generateLayerShapes, BLUEPRINT_CANVAS_SIZE } from '../../utils/blueprint';
import { loadCadPdf, saveCadPdf } from '../../utils/cadFileStorage';
import { formatDate, genId } from '../../utils/format';
import { useData } from '../../store/DataContext';
import { useAuth } from '../../store/AuthContext';
import type { CadFile, CadMarkup, CadReviewEvent, CadThread } from '../../types';

const LAYER_COLORS = ['#68b9e8', '#ffd166', '#8bd3c7', '#ff6b73', '#9d8df1', '#9ad35b', '#ff9f43', '#c7d6e5'];
type ReviewTool = 'pan' | 'select' | 'line' | 'rectangle' | 'measure' | 'pin' | 'comment';

function nextRevision(version: string): string {
  if (/^\d+$/.test(version)) return String(Number(version) + 1);
  if (/^[A-Z]$/i.test(version) && version.toUpperCase() !== 'Z') return String.fromCharCode(version.toUpperCase().charCodeAt(0) + 1);
  return `${version}.1`;
}

const TOOLS: { id: ReviewTool; label: string; icon: string }[] = [
  { id: 'pan', label: 'Pan', icon: 'bi-hand-index-thumb' },
  { id: 'select', label: 'Select', icon: 'bi-cursor' },
  { id: 'line', label: 'Line', icon: 'bi-slash-lg' },
  { id: 'rectangle', label: 'Rectangle', icon: 'bi-square' },
  { id: 'measure', label: 'Measure', icon: 'bi-rulers' },
  { id: 'pin', label: 'Pin', icon: 'bi-geo-alt' },
  { id: 'comment', label: 'Comment', icon: 'bi-chat-left' },
];

interface CadViewerModalProps {
  show: boolean;
  file: CadFile | null;
  projectName?: string;
  onClose: () => void;
}

export default function CadViewerModal({ show, file, projectName, onClose }: CadViewerModalProps) {
  const { updateCadFile } = useData();
  const { currentUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const revisionInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(0.74);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [activeTool, setActiveTool] = useState<ReviewTool>('pan');
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [threads, setThreads] = useState<CadThread[]>([]);
  const [markups, setMarkups] = useState<CadMarkup[]>([]);
  const [history, setHistory] = useState<CadReviewEvent[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [commentTitle, setCommentTitle] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [submissionTarget, setSubmissionTarget] = useState<CadFile['submissionTarget']>('Client');
  const [reviewStatus, setReviewStatus] = useState<CadFile['reviewStatus']>('Draft');
  const [currentVersion, setCurrentVersion] = useState(file?.version ?? '1');
  const [versionHistory, setVersionHistory] = useState(file?.versionHistory ?? []);
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [docSize, setDocSize] = useState({ width: BLUEPRINT_CANVAS_SIZE, height: BLUEPRINT_CANVAS_SIZE * 0.75 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pdfState, setPdfState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle');
  const [savedNotice, setSavedNotice] = useState('');
  const [dirty, setDirty] = useState(false);

  const isPdf = file?.fileType === 'PDF';
  const selectedThread = threads.find(thread => thread.id === selectedThreadId) ?? null;
  const hoveredThread = threads.find(thread => thread.id === hoveredThreadId) ?? null;
  const openThreadCount = threads.filter(thread => thread.status === 'Open').length;
  const latestVersion = versionHistory.at(-1)?.version ?? file?.version ?? currentVersion;

  const layerShapes = useMemo(() => {
    if (!file || isPdf) return [];
    return file.layers.map((layer, index) => ({
      layer,
      color: LAYER_COLORS[index % LAYER_COLORS.length],
      shapes: generateLayerShapes(file.id, layer),
    }));
  }, [file, isPdf]);

  useEffect(() => {
    if (!show || !file) return;
    setZoom(0.74);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setActiveTool('pan');
    setVisibleLayers({});
    setThreads(file.threads ?? []);
    setMarkups(file.markups ?? []);
    setHistory(file.reviewHistory ?? []);
    setSelectedThreadId(null);
    setHoveredThreadId(null);
    setPendingPoint(null);
    setCommentTitle('');
    setCommentBody('');
    setReplyBody('');
    setSubmissionTarget(file.submissionTarget ?? 'Client');
    setReviewStatus(file.reviewStatus ?? 'Draft');
    setCurrentVersion(file.version);
    setVersionHistory(file.versionHistory);
    setUploadingRevision(false);
    setSavedNotice('');
    setDirty(false);
    setDocSize({ width: BLUEPRINT_CANVAS_SIZE, height: BLUEPRINT_CANVAS_SIZE * 0.75 });
    setCurrentPage(1);
    setPageCount(1);
  }, [show, file]);

  useEffect(() => {
    if (!show || !file || file.fileType !== 'PDF') {
      setPdfState('idle');
      return;
    }

    let cancelled = false;
    let cancelRender: (() => void) | undefined;
    setPdfState('loading');
    loadCadPdf(file.id, currentVersion)
      .then(async blob => {
        if (!blob) {
          if (!cancelled) setPdfState('missing');
          return;
        }
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
        if (!cancelled) setPageCount(pdf.numPages);
        const page = await pdf.getPage(Math.min(currentPage, pdf.numPages));
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDocSize({ width: viewport.width, height: viewport.height });
        const renderTask = page.render({ canvas, canvasContext: context, viewport });
        cancelRender = () => renderTask.cancel();
        await renderTask.promise;
        if (!cancelled) setPdfState('ready');
      })
      .catch(() => { if (!cancelled) setPdfState('error'); });

    return () => {
      cancelled = true;
      cancelRender?.();
    };
  }, [show, file, currentPage, currentVersion]);

  if (!file) return null;

  const isLayerVisible = (layer: string) => visibleLayers[layer] !== false;
  const toggleLayer = (layer: string) => setVisibleLayers(value => ({ ...value, [layer]: !isLayerVisible(layer) }));
  const resetView = () => { setZoom(0.74); setPan({ x: 0, y: 0 }); };
  const zoomBy = (delta: number) => setZoom(value => Math.min(2.5, Math.max(0.35, +(value + delta).toFixed(2))));

  const pointFromEvent = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === 'pan') {
      setDragging(true);
      dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const point = pointFromEvent(event.clientX, event.clientY);
    if (!point) return;
    if (activeTool === 'pin' || activeTool === 'comment') {
      setPendingPoint(point);
      setCommentTitle(activeTool === 'pin' ? `Review pin ${threads.length + 1}` : 'Design comment');
      setCommentBody('');
      setSelectedThreadId(null);
    } else if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'measure') {
      setDrawingStart(point);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || activeTool !== 'pan') return;
    setPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.x,
      y: dragStart.current.panY + event.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) setDragging(false);
    if (!drawingStart || !['line', 'rectangle', 'measure'].includes(activeTool)) return;
    const end = pointFromEvent(event.clientX, event.clientY);
    if (!end || Math.hypot(end.x - drawingStart.x, end.y - drawingStart.y) < 0.01) {
      setDrawingStart(null);
      return;
    }
    setMarkups(items => [...items, {
      id: genId('markup'), page: currentPage, type: activeTool as CadMarkup['type'],
      x1: drawingStart.x, y1: drawingStart.y, x2: end.x, y2: end.y,
      color: '#ff6b73', createdBy: currentUser.name, createdAt: new Date().toISOString(),
    }]);
    setDrawingStart(null);
    setDirty(true);
  };

  const addThread = () => {
    if (!pendingPoint || !commentBody.trim()) return;
    const thread: CadThread = {
      id: genId('thread'), page: currentPage, x: pendingPoint.x, y: pendingPoint.y,
      title: commentTitle.trim() || 'Design comment', status: 'Open',
      comments: [{ id: genId('comment'), author: currentUser.name, body: commentBody.trim(), createdAt: new Date().toISOString() }],
    };
    setThreads(items => [...items, thread]);
    setSelectedThreadId(thread.id);
    setPendingPoint(null);
    setCommentTitle('');
    setCommentBody('');
    setDirty(true);
    setActiveTool('select');
  };

  const addReply = () => {
    if (!selectedThread || !replyBody.trim()) return;
    setThreads(items => items.map(thread => thread.id === selectedThread.id ? {
      ...thread,
      comments: [...thread.comments, { id: genId('comment'), author: currentUser.name, body: replyBody.trim(), createdAt: new Date().toISOString() }],
    } : thread));
    setReplyBody('');
    setDirty(true);
  };

  const toggleThreadStatus = () => {
    if (!selectedThread) return;
    setThreads(items => items.map(thread => thread.id === selectedThread.id ? {
      ...thread, status: thread.status === 'Open' ? 'Resolved' : 'Open',
    } : thread));
    setDirty(true);
  };

  const saveReview = () => {
    const now = new Date().toISOString();
    const event: CadReviewEvent = {
      id: genId('review'), action: 'Review saved', user: currentUser.name, timestamp: now,
      details: `${markups.length} markup${markups.length === 1 ? '' : 's'}, ${threads.length} thread${threads.length === 1 ? '' : 's'}`,
    };
    const nextHistory = [event, ...history];
    const nextStatus: CadFile['reviewStatus'] = threads.some(thread => thread.status === 'Open') ? 'In Review' : 'Ready to Submit';
    setHistory(nextHistory);
    setReviewStatus(nextStatus);
    updateCadFile(file.id, { markups, threads, reviewHistory: nextHistory, reviewStatus: nextStatus });
    setSavedNotice('Review saved');
    setDirty(false);
    window.setTimeout(() => setSavedNotice(''), 2200);
  };

  const submitDesign = () => {
    const now = new Date().toISOString();
    const event: CadReviewEvent = {
      id: genId('review'), action: 'Submitted', user: currentUser.name, timestamp: now,
      details: `Submitted to ${submissionTarget}`,
    };
    const nextHistory = [event, ...history];
    setHistory(nextHistory);
    setReviewStatus('Submitted');
    updateCadFile(file.id, {
      markups, threads, reviewHistory: nextHistory, reviewStatus: 'Submitted', submissionTarget,
      submittedAt: now, submittedBy: currentUser.name,
    });
    setSavedNotice(`Submitted to ${submissionTarget}`);
    setDirty(false);
  };

  const uploadRevision = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    event.target.value = '';
    if (!uploaded) return;
    if (uploaded.type !== 'application/pdf' && !uploaded.name.toLowerCase().endsWith('.pdf')) {
      setSavedNotice('Updated drawing must be a PDF');
      return;
    }

    const version = nextRevision(latestVersion);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    setUploadingRevision(true);
    try {
      await saveCadPdf(file.id, uploaded, version);
      const revisionEntry = { version, date: today, uploadedBy: currentUser.name, notes: 'Updated drawing uploaded for review verification' };
      const nextVersions = [...versionHistory, revisionEntry];
      const nextThreads = threads.map(thread => thread.status === 'Open' ? {
        ...thread,
        comments: [...thread.comments, {
          id: genId('comment'), author: currentUser.name,
          body: `Revision ${version} uploaded for verification. Please check whether the requested change has been completed before resolving this thread.`,
          createdAt: now,
        }],
      } : thread);
      const revisionEvent: CadReviewEvent = {
        id: genId('review'), action: 'Reopened', user: currentUser.name, timestamp: now,
        details: `Revision ${version} uploaded; ${nextThreads.filter(thread => thread.status === 'Open').length} open thread(s) carried forward`,
      };
      const nextHistory = [revisionEvent, ...history];
      setVersionHistory(nextVersions);
      setThreads(nextThreads);
      setHistory(nextHistory);
      setCurrentVersion(version);
      setCurrentPage(1);
      setReviewStatus('In Review');
      setSelectedThreadId(null);
      setDirty(false);
      updateCadFile(file.id, {
        version, uploadedDate: today, uploadedBy: currentUser.name, sizeKb: Math.max(1, Math.ceil(uploaded.size / 1024)),
        approvalStatus: 'Pending', reviewStatus: 'In Review', versionHistory: nextVersions,
        threads: nextThreads, markups, reviewHistory: nextHistory,
        submissionTarget: undefined, submittedAt: undefined, submittedBy: undefined,
      });
      setSavedNotice(`Revision ${version} uploaded — pins and threads retained`);
      window.setTimeout(() => setSavedNotice(''), 3500);
    } catch {
      setSavedNotice('Revision upload failed');
    } finally {
      setUploadingRevision(false);
    }
  };

  const requestClose = () => {
    if (!dirty || window.confirm('Discard unsaved review changes?')) onClose();
  };

  const renderMarkup = (markup: CadMarkup) => {
    const x1 = markup.x1 * docSize.width;
    const y1 = markup.y1 * docSize.height;
    const x2 = markup.x2 * docSize.width;
    const y2 = markup.y2 * docSize.height;
    if (markup.type === 'rectangle') {
      return <rect key={markup.id} x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} fill="rgba(255,107,115,.08)" stroke={markup.color} strokeWidth="3" />;
    }
    const length = Math.round(Math.hypot(x2 - x1, y2 - y1));
    return (
      <g key={markup.id}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={markup.color} strokeWidth="3" strokeDasharray={markup.type === 'measure' ? '10 6' : undefined} />
        {markup.type === 'measure' && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} className="cad-measure-label">{length} units</text>}
      </g>
    );
  };

  return (
    <Modal show={show} onHide={requestClose} fullscreen className="cad-review-modal">
      <Modal.Body className="p-0">
        <div className="cad-review-shell">
          <header className="cad-review-header">
            <div className="min-w-0">
              <div className="cad-review-kicker">DRAWING {file.sheet || file.name.replace(/\.[^.]+$/, '').toUpperCase()} · REV {currentVersion}{currentVersion !== latestVersion ? ' · PREVIOUS VERSION' : ''}</div>
              <h5 className="mb-0 text-truncate">{file.name}</h5>
              <div className="small text-secondary text-truncate">{projectName} · {file.discipline}</div>
            </div>
            <div className="cad-review-actions">
              {savedNotice && <span className="cad-save-notice"><i className="bi bi-check-circle me-1" />{savedNotice}</span>}
              {isPdf && <><input ref={revisionInputRef} type="file" accept="application/pdf,.pdf" className="d-none" onChange={uploadRevision} /><Button variant="light" onClick={() => revisionInputRef.current?.click()} disabled={uploadingRevision}><i className="bi bi-upload me-1" />{uploadingRevision ? 'Uploading…' : 'Upload Revision'}</Button></>}
              <Button variant="light" onClick={() => zoomBy(-0.1)} aria-label="Zoom out"><i className="bi bi-dash-lg" /></Button>
              <span className="cad-zoom-label">{Math.round(zoom * 100)}%</span>
              <Button variant="light" onClick={() => zoomBy(0.1)} aria-label="Zoom in"><i className="bi bi-plus-lg" /></Button>
              {isPdf && pageCount > 1 && <div className="cad-page-controls"><Button variant="light" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1}><i className="bi bi-chevron-left" /></Button><span>{currentPage} / {pageCount}</span><Button variant="light" onClick={() => setCurrentPage(page => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount}><i className="bi bi-chevron-right" /></Button></div>}
              <Button variant="light" onClick={resetView}><i className="bi bi-arrows-fullscreen me-1" /> Reset</Button>
              <Button variant="outline-light" onClick={() => { setMarkups([]); setDirty(true); }} disabled={markups.length === 0}><i className="bi bi-eraser me-1" /> Clear</Button>
              <Button variant="warning" onClick={saveReview}><i className="bi bi-floppy me-1" /> Save Review</Button>
              <Button variant="outline-light" onClick={requestClose} aria-label="Close"><i className="bi bi-x-lg" /></Button>
            </div>
          </header>

          <aside className="cad-tool-rail" aria-label="Drawing review tools">
            {TOOLS.map(tool => (
              <button key={tool.id} type="button" className={`cad-tool-button ${activeTool === tool.id ? 'active' : ''}`} onClick={() => setActiveTool(tool.id)}>
                <i className={`bi ${tool.icon}`} /><span>{tool.label}</span>
              </button>
            ))}
          </aside>

          <main
            className={`cad-review-viewport tool-${activeTool}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { setDragging(false); setDrawingStart(null); }}
          >
            <div
              ref={stageRef}
              className="cad-document-stage"
              style={{ width: docSize.width, height: docSize.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {isPdf ? (
                <>
                  <canvas ref={canvasRef} className={`cad-pdf-canvas ${pdfState === 'ready' && isLayerVisible('PDF Artwork') ? 'visible' : ''}`} />
                  {pdfState === 'loading' && <div className="cad-document-message"><span className="spinner-border spinner-border-sm me-2" />Rendering PDF…</div>}
                  {pdfState === 'missing' && <div className="cad-document-message"><i className="bi bi-file-earmark-pdf fs-1 mb-2" /><strong>PDF content is not stored in this browser</strong><span>Upload the file again to render the real document.</span></div>}
                  {pdfState === 'error' && <div className="cad-document-message text-danger"><i className="bi bi-exclamation-triangle fs-1 mb-2" /><strong>Could not render this PDF</strong></div>}
                </>
              ) : (
                <svg viewBox={`0 0 ${docSize.width} ${docSize.height}`} className="cad-blueprint-svg">
                  <rect width={docSize.width} height={docSize.height} className="cad-canvas-bg" />
                  {layerShapes.map(({ layer, color, shapes }) => (
                    <g key={layer} opacity={isLayerVisible(layer) ? 1 : 0}>
                      {shapes.map((shape, index) => {
                        if (shape.type === 'rect') return <rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} fill="none" stroke={color} strokeWidth="2" />;
                        if (shape.type === 'line') return <line key={index} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={color} strokeWidth="1.5" />;
                        return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill="none" stroke={color} strokeWidth="2" />;
                      })}
                    </g>
                  ))}
                </svg>
              )}

              {isLayerVisible('Review Markup') && (
                <svg viewBox={`0 0 ${docSize.width} ${docSize.height}`} className="cad-markup-layer">
                  {markups.filter(markup => (markup.page ?? 1) === currentPage).map(renderMarkup)}
                </svg>
              )}
              {isLayerVisible('Comments & Pins') && threads.filter(thread => thread.page === currentPage).map(thread => (
                <button
                  type="button" key={thread.id}
                  className={`cad-thread-pin ${thread.status === 'Resolved' ? 'resolved' : ''} ${selectedThreadId === thread.id ? 'selected' : ''}`}
                  style={{ left: `${thread.x * 100}%`, top: `${thread.y * 100}%` }}
                  onPointerDown={event => event.stopPropagation()}
                  onMouseEnter={() => setHoveredThreadId(thread.id)}
                  onMouseLeave={() => setHoveredThreadId(null)}
                  onFocus={() => setHoveredThreadId(thread.id)}
                  onBlur={() => setHoveredThreadId(null)}
                  onClick={() => { setSelectedThreadId(thread.id); setPendingPoint(null); setActiveTool('select'); }}
                  aria-label={`Open thread: ${thread.title}`}
                ><span>{threads.indexOf(thread) + 1}</span></button>
              ))}
              {isLayerVisible('Comments & Pins') && hoveredThread && hoveredThread.page === currentPage && (
                <div
                  className={`cad-pin-tooltip ${hoveredThread.x > 0.7 ? 'align-left' : ''}`}
                  style={{ left: `${hoveredThread.x * 100}%`, top: `${hoveredThread.y * 100}%` }}
                  role="tooltip"
                >
                  <div className="cad-pin-tooltip-heading">
                    <strong>{hoveredThread.title}</strong>
                    <span className={hoveredThread.status === 'Resolved' ? 'resolved' : ''}>{hoveredThread.status}</span>
                  </div>
                  <p>{hoveredThread.comments.at(-1)?.body}</p>
                  <small>{hoveredThread.comments.length} comment{hoveredThread.comments.length === 1 ? '' : 's'} · Click to open thread</small>
                </div>
              )}
              {pendingPoint && <span className="cad-thread-pin pending" style={{ left: `${pendingPoint.x * 100}%`, top: `${pendingPoint.y * 100}%` }}><span>+</span></span>}
            </div>
            <div className="cad-coordinate-bar">
              <span>Page {currentPage} of {pageCount}</span><span>Scale 1:100</span><span>Snap 100 mm</span><span className="ms-auto">Tool: {TOOLS.find(tool => tool.id === activeTool)?.label}</span>
            </div>
          </main>

          <aside className="cad-review-sidebar">
            <section>
              <h6>LAYERS</h6>
              <div className="cad-layer-list">
                {(isPdf ? ['PDF Artwork'] : file.layers).map((layer, index) => (
                  <Form.Check key={layer} checked={isLayerVisible(layer)} onChange={() => toggleLayer(layer)} label={<span>{layer}<i style={{ background: isPdf ? '#d9e6ef' : LAYER_COLORS[index % LAYER_COLORS.length] }} /></span>} />
                ))}
                {['Review Markup', 'Comments & Pins'].map((layer, index) => (
                  <Form.Check key={layer} checked={isLayerVisible(layer)} onChange={() => toggleLayer(layer)} label={<span>{layer}<i style={{ background: index === 0 ? '#ff6b73' : '#ffb000' }} /></span>} />
                ))}
              </div>
            </section>

            <section className="cad-comments-panel">
              <div className="d-flex justify-content-between align-items-center"><h6>COMMENTS & PINS</h6><Badge bg={openThreadCount ? 'warning' : 'success'} text={openThreadCount ? 'dark' : undefined}>{openThreadCount} open</Badge></div>
              {pendingPoint ? (
                <div className="cad-thread-composer">
                  <Form.Control size="sm" value={commentTitle} onChange={event => setCommentTitle(event.target.value)} placeholder="Thread title" />
                  <Form.Control as="textarea" rows={3} value={commentBody} onChange={event => setCommentBody(event.target.value)} placeholder="Describe the required change…" autoFocus />
                  <div className="d-flex gap-2"><Button size="sm" variant="warning" onClick={addThread} disabled={!commentBody.trim()}>Start Thread</Button><Button size="sm" variant="outline-light" onClick={() => setPendingPoint(null)}>Cancel</Button></div>
                </div>
              ) : selectedThread ? (
                <div className="cad-thread-detail">
                  <div className="d-flex justify-content-between gap-2"><strong>{selectedThread.title}</strong><Badge bg={selectedThread.status === 'Open' ? 'warning' : 'success'} text={selectedThread.status === 'Open' ? 'dark' : undefined}>{selectedThread.status}</Badge></div>
                  <div className="cad-thread-messages">
                    {selectedThread.comments.map(comment => <div key={comment.id}><div><strong>{comment.author}</strong><span>{new Date(comment.createdAt).toLocaleString()}</span></div><p>{comment.body}</p></div>)}
                  </div>
                  <Form.Label className="small fw-semibold mb-0">Add another comment</Form.Label>
                  <Form.Control as="textarea" rows={2} value={replyBody} onChange={event => setReplyBody(event.target.value)} placeholder="Write a comment on this thread…" />
                  <div className="d-flex gap-2"><Button size="sm" variant="warning" onClick={addReply} disabled={!replyBody.trim()}>Add Comment</Button><Button size="sm" variant="outline-light" onClick={toggleThreadStatus}>{selectedThread.status === 'Open' ? 'Resolve' : 'Reopen'}</Button></div>
                </div>
              ) : threads.length ? (
                <div className="cad-thread-summary-list">{threads.map((thread, index) => <button type="button" key={thread.id} onClick={() => { setCurrentPage(thread.page); setSelectedThreadId(thread.id); }}><span>{index + 1}</span><div><strong>{thread.title}</strong><small>Page {thread.page} · {thread.comments.length} comment{thread.comments.length === 1 ? '' : 's'} · {thread.status}</small></div></button>)}</div>
              ) : <p className="cad-sidebar-hint">Choose Pin or Comment, then click the drawing to start a discussion thread.</p>}
            </section>

            <section>
              <h6>SUBMISSION</h6>
              <div className="cad-submission-box">
                <div className="d-flex justify-content-between"><span>Status</span><Badge bg={reviewStatus === 'Submitted' ? 'success' : reviewStatus === 'In Review' ? 'warning' : 'secondary'} text={reviewStatus === 'In Review' ? 'dark' : undefined}>{reviewStatus}</Badge></div>
                <Form.Select size="sm" value={submissionTarget} onChange={event => setSubmissionTarget(event.target.value as CadFile['submissionTarget'])}>
                  <option>Client</option><option>Bidding Requirements</option>
                </Form.Select>
                <Button size="sm" variant="primary" onClick={submitDesign} disabled={openThreadCount > 0 || currentVersion !== latestVersion} title={currentVersion !== latestVersion ? 'Return to the latest revision before submitting' : openThreadCount ? 'Resolve all open threads before submitting' : undefined}><i className="bi bi-send me-1" /> Submit Design</Button>
                {openThreadCount > 0 && <small>Resolve {openThreadCount} open thread{openThreadCount === 1 ? '' : 's'} before submission.</small>}
              </div>
            </section>

            <section>
              <h6>REVIEW HISTORY</h6>
              {history.length ? <div className="cad-review-history">{history.slice(0, 6).map(event => <div key={event.id}><i className={`bi ${event.action === 'Submitted' ? 'bi-send-check' : 'bi-floppy'}`} /><span><strong>{event.action}</strong><small>{event.user} · {new Date(event.timestamp).toLocaleString()}</small>{event.details && <small>{event.details}</small>}</span></div>)}</div> : <p className="cad-sidebar-hint">No saved activity yet.</p>}
            </section>

            <section>
              <h6>DRAWING REVISIONS</h6>
              <div className="cad-version-list">
                {[...versionHistory].reverse().map(version => (
                  <button type="button" key={version.version} className={currentVersion === version.version ? 'active' : ''} onClick={() => { setCurrentVersion(version.version); setCurrentPage(1); }}>
                    <span><strong>Revision {version.version}</strong><small>{formatDate(version.date)} · {version.uploadedBy}</small></span>
                    <i className={`bi ${currentVersion === version.version ? 'bi-eye-fill' : 'bi-eye'}`} />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h6>PROPERTIES</h6>
              <dl className="cad-properties"><dt>Discipline</dt><dd>{file.discipline}</dd><dt>Units</dt><dd>{file.units ?? 'Millimeters'}</dd><dt>Sheet</dt><dd>{file.sheet ?? '—'}</dd><dt>Viewing Revision</dt><dd>{currentVersion}</dd><dt>Latest Revision</dt><dd>{latestVersion}</dd></dl>
            </section>
          </aside>
        </div>
      </Modal.Body>
    </Modal>
  );
}
