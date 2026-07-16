// Deterministic pseudo-random blueprint generator so each CAD file/layer
// renders a stable, distinct "drawing" without needing real CAD content.

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Shape =
  | { type: 'rect'; x: number; y: number; w: number; h: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'circle'; cx: number; cy: number; r: number };

const CANVAS = 800;

export function generateLayerShapes(fileId: string, layerName: string): Shape[] {
  const rand = mulberry32(hashStr(`${fileId}:${layerName}`));
  const shapes: Shape[] = [];
  const lower = layerName.toLowerCase();

  if (lower.includes('grid')) {
    for (let i = 1; i < 8; i++) {
      const x = (CANVAS / 8) * i;
      shapes.push({ type: 'line', x1: x, y1: 20, x2: x, y2: CANVAS - 20 });
    }
    for (let i = 1; i < 6; i++) {
      const y = (CANVAS / 6) * i;
      shapes.push({ type: 'line', x1: 20, y1: y, x2: CANVAS - 20, y2: y });
    }
    return shapes;
  }

  if (lower.includes('dimension') || lower.includes('note')) {
    for (let i = 0; i < 6; i++) {
      const y = 60 + i * 90;
      shapes.push({ type: 'line', x1: 60, y1: y, x2: 200 + rand() * 400, y2: y });
    }
    return shapes;
  }

  // Generic layer: mix of rects/lines/circles scattered deterministically
  const count = 5 + Math.floor(rand() * 6);
  for (let i = 0; i < count; i++) {
    const kind = rand();
    if (kind < 0.4) {
      const w = 40 + rand() * 160;
      const h = 30 + rand() * 120;
      shapes.push({
        type: 'rect',
        x: 40 + rand() * (CANVAS - 80 - w),
        y: 40 + rand() * (CANVAS - 80 - h),
        w, h,
      });
    } else if (kind < 0.75) {
      shapes.push({
        type: 'line',
        x1: 40 + rand() * (CANVAS - 80),
        y1: 40 + rand() * (CANVAS - 80),
        x2: 40 + rand() * (CANVAS - 80),
        y2: 40 + rand() * (CANVAS - 80),
      });
    } else {
      shapes.push({
        type: 'circle',
        cx: 60 + rand() * (CANVAS - 120),
        cy: 60 + rand() * (CANVAS - 120),
        r: 8 + rand() * 24,
      });
    }
  }
  return shapes;
}

export const BLUEPRINT_CANVAS_SIZE = CANVAS;
