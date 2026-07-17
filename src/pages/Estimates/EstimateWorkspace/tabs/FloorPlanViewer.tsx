import { useMemo, useState } from 'react';

// Lightweight, dependency-free stand-in for the company's existing Three.js
// floor-plan viewer. Renders a deterministic pseudo-3D room layout (CSS 3D
// transforms only) so this mount point is visually meaningful without
// pulling in a 3D engine. Swap the inner render for the real Three.js
// viewer, feeding it the plan geometry, and keep the same props contract.

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

interface Room {
  x: number; y: number; w: number; h: number; hue: number; label: string;
}

const ROOM_LABELS = ['Living', 'Kitchen', 'Bedroom', 'Bath', 'Garage', 'Dining', 'Office', 'Storage'];

function generateRooms(seed: string): Room[] {
  const rand = mulberry32(hashStr(seed));
  const cols = 3;
  const rows = 2;
  const rooms: Room[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.15 && idx > 2) continue; // occasionally merge/skip a cell
      rooms.push({
        x: c * (100 / cols), y: r * (100 / rows),
        w: 100 / cols - 2, h: 100 / rows - 2,
        hue: Math.floor(90 + rand() * 140),
        label: ROOM_LABELS[idx % ROOM_LABELS.length],
      });
      idx += 1;
    }
  }
  return rooms;
}

export default function FloorPlanViewer({ seed, area }: { seed: string; area: number }) {
  const rooms = useMemo(() => generateRooms(seed), [seed]);
  const [rotation, setRotation] = useState({ x: 52, z: -35 });
  const [dragging, setDragging] = useState(false);
  const dragStart = { x: 0, z: 0, mouseX: 0 };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.x = rotation.x;
    dragStart.z = rotation.z;
    dragStart.mouseX = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.mouseX;
    setRotation({ x: rotation.x, z: dragStart.z + dx * 0.3 });
  };

  return (
    <div className="floorplan-viewer">
      <div
        className="floorplan-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <div className="floorplan-scene" style={{ transform: `rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg)` }}>
          {rooms.map((room, i) => (
            <div
              key={i}
              className="floorplan-room"
              title={room.label}
              style={{
                left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%`,
                background: `hsl(${room.hue}, 45%, 55%)`,
              }}
            >
              <span>{room.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span className="text-secondary small">{area > 0 ? `${area} sqm footprint` : 'Drag to rotate'} · placeholder render</span>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRotation({ x: 52, z: -35 })}>Reset View</button>
      </div>
    </div>
  );
}
