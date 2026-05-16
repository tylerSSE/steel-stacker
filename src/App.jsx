import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================================
// STEEL STACKER
// A Southern Steel Engineers production. steelstacker.com
// Pieces render as actual structural cross-sections with AISC designations.
// ============================================================================

const COLS = 10;
const ROWS = 16;
// Cell size adapts to viewport: 24px on mobile, 28px on desktop. The actual
// active size lives in component state (see useCellSize hook below) so the
// playfield re-renders cleanly on rotation/resize.
const CELL_DESKTOP = 28;
const CELL_MOBILE = 24;
const MOBILE_BREAKPOINT = 640; // matches Tailwind's sm: breakpoint
const EMPTY = 0;
// Truck capacity expressed in pounds (the source of truth for all weight math).
// Display-side, divide by 2000 to show as tons. 20 short tons = 40,000 lb.
const TRUCK_CAPACITY_LB = 40000;
const TRUCK_CAPACITY_TONS = TRUCK_CAPACITY_LB / 2000;

// ============================================================================
// SSE LOGO (inlined as data URL — keeps preview self-contained, swappable for
// /sse-logo-no-sublabel-white.png in production deployment).
// ============================================================================
const SSE_LOGO_DATA_URL = "data:image/png;base64,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";



// Each piece's matrix is the actual cross-section profile of the steel shape.
// Weights are calculated from real AISC section weights (lb/ft) × realistic
// trailer lengths. Pounds are stored for display, tons (short tons, 2000 lb)
// for gameplay math. The big WF is intentionally heavy — placing it is hard,
// so it pays out in tonnage.
const SHAPES = {
  WF: {
    name: "WF",
    longName: "Wide Flange",
    designation: "W14×120",
    lengthFt: 40,
    pounds: 4800, // 120 lb/ft × 40'
    weight: 1, // rare — toughest piece to place, so don't drown the player in them
    color: "#94a3b8",
    edge: "#475569",
    // 3-tall I-beam (was 4-tall). Same footprint as W12×40 so it's playable on
    // a 10-wide field, but kept heavy (4,800 lb) and rare (1 slot) so placing
    // one still feels like a win. Color/lengthFt distinguish it from W12×40.
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  WF_S: {
    name: "WF",
    longName: "Wide Flange",
    designation: "W12×40",
    lengthFt: 45,
    pounds: 1800, // 40 lb/ft × 45'
    weight: 2,
    color: "#cbd5e1",
    edge: "#64748b",
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  HSS: {
    name: "HSS",
    longName: "Hollow Section",
    designation: "HSS8×8×1/2",
    lengthFt: 30,
    pounds: 1466, // 48.85 lb/ft × 30'
    weight: 3, // boosted — clean 2×2 piece is a useful workhorse
    color: "#0ea5e9",
    edge: "#0369a1",
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  HSS_R: {
    name: "HSS",
    longName: "Hollow Section",
    designation: "HSS12×3×3/8",
    lengthFt: 24,
    pounds: 619, // 25.82 lb/ft × 24'
    weight: 3, // workhorse mid-weight piece, easy to place (2×1 footprint)
    color: "#0284c7", // deeper navy/cyan — distinguishes from square HSS while staying "HSS family"
    edge: "#075985",
    // Rectangular tube: 2 cells wide, 1 cell tall. The most placement-friendly
    // shape in the bag after the 1×1 helpers. Eases the "everything is awkward" feel.
    matrix: [
      [1, 1],
      [0, 0],
    ],
  },
  PL: {
    name: "PL",
    longName: "Plate",
    designation: "PL1/2×12",
    lengthFt: 20,
    pounds: 410, // 1/2" × 12" × 20' × 490 lb/ft³ ≈ 408 lb
    weight: 2,
    color: "#f59e0b",
    edge: "#b45309",
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  WT: {
    name: "WT",
    longName: "Tee Section",
    designation: "WT6×20",
    lengthFt: 25,
    pounds: 500, // 20 lb/ft × 25'
    weight: 4, // boosted again — versatile T-piece is a workhorse for filling odd gaps
    color: "#a78bfa",
    edge: "#7c3aed",
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  L_R: {
    name: "L",
    longName: "Angle (R)",
    designation: "L6×4×3/8",
    lengthFt: 20,
    pounds: 234, // 11.7 lb/ft × 20'
    color: "#f97316",
    edge: "#c2410c",
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ],
  },
  L_L: {
    name: "L",
    longName: "Angle (L)",
    designation: "L6×4×3/8",
    lengthFt: 20,
    pounds: 234,
    color: "#ea580c",
    edge: "#9a3412",
    matrix: [
      [0, 0, 1],
      [0, 0, 1],
      [0, 1, 1],
    ],
  },
  L3_R: {
    name: "L",
    longName: "Angle (R)",
    designation: "L3×3×3/8",
    lengthFt: 20,
    pounds: 144, // 7.2 lb/ft × 20'
    weight: 2, // boosted — small angle is a useful filler for awkward gaps
    color: "#ef4444", // red — distinct from L6×4 oranges so the two L sizes read separately
    edge: "#991b1b",
    // Small L: 2×2 footprint, 3 cells in an L shape
    matrix: [
      [1, 0],
      [1, 1],
    ],
  },
  L3_L: {
    name: "L",
    longName: "Angle (L)",
    designation: "L3×3×3/8",
    lengthFt: 20,
    pounds: 144,
    weight: 2,
    color: "#dc2626",
    edge: "#7f1d1d",
    matrix: [
      [0, 1],
      [1, 1],
    ],
  },
  C_R: {
    name: "C",
    longName: "Channel (R)",
    designation: "C12×20.7",
    lengthFt: 28,
    pounds: 580, // 20.7 lb/ft × 28'
    color: "#10b981",
    edge: "#047857",
    matrix: [
      [1, 1, 0],
      [1, 0, 0],
      [1, 1, 0],
    ],
  },
  C_L: {
    name: "C",
    longName: "Channel (L)",
    designation: "C12×30",
    lengthFt: 28,
    pounds: 840, // 30 lb/ft × 28'
    color: "#14b8a6",
    edge: "#0f766e",
    matrix: [
      [0, 1, 1],
      [0, 0, 1],
      [0, 1, 1],
    ],
  },
  BOLT: {
    name: "HW",
    longName: "Keg of Bolts",
    designation: "3/4Ø A325",
    lengthFt: null,
    pounds: 200, // average keg of structural bolts
    weight: 3, // boosted — 1×1 helper for filling tight gaps
    color: "#facc15",
    edge: "#a16207",
    matrix: [[1]],
  },
  SHIM: {
    name: "SH",
    longName: "Bucket of Shims",
    designation: "1/8 SHIM",
    lengthFt: null,
    pounds: 100, // bucket of mixed steel shims
    weight: 2,
    color: "#d4d4d8", // zinc — distinct from BOLT gold and WF cool slate
    edge: "#71717a",
    matrix: [[1]],
  },
};

const SHAPE_KEYS = Object.keys(SHAPES);
const speedFor = (level) => Math.max(80, 800 - (level - 1) * 60);

// Tons derived from pounds — single source of truth. Avoids rounding drift
// between the gameplay tonnage counter and the shipping ticket which sums
// pounds directly. 2000 lb per short ton.
function piecePounds(key) {
  return SHAPES[key].pounds;
}
function pieceTons(key) {
  return SHAPES[key].pounds / 2000;
}

function makeBag() {
  // Build a weighted bag: each shape contributes `weight` slots (default 1).
  // Then Fisher-Yates shuffle so order is random within the bag, but the
  // overall distribution stays balanced across cycles. Common helpers (BOLT,
  // HSS) appear more often, hard-to-place pieces (WF) stay rare.
  const bag = [];
  for (const key of SHAPE_KEYS) {
    const w = SHAPES[key].weight || 1;
    for (let i = 0; i < w; i++) bag.push(key);
  }
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function rotateMatrix(m) {
  const N = m.length;
  const out = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out[c][N - 1 - r] = m[r][c];
  return out;
}

function spawnPiece(key) {
  const shape = SHAPES[key];
  const matrix = shape.matrix.map((row) => [...row]);
  const w = matrix[0].length;
  return { key, matrix, x: Math.floor((COLS - w) / 2), y: 0 };
}

function collides(grid, piece, dx = 0, dy = 0, mat = null) {
  const m = mat || piece.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && grid[ny][nx]) return true;
    }
  }
  return false;
}

function mergePiece(grid, piece) {
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (piece.matrix[r][c]) {
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) next[ny][nx] = piece.key;
      }
    }
  }
  return next;
}

function clearLines(grid) {
  const kept = grid.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(EMPTY));
  return { grid: kept, cleared };
}

function ghostY(grid, piece) {
  let dy = 0;
  while (!collides(grid, piece, 0, dy + 1)) dy++;
  return piece.y + dy;
}

function pieceCenterX(piece, cellSize) {
  if (!piece) return (COLS * cellSize) / 2;
  let minC = piece.matrix[0].length;
  let maxC = -1;
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (piece.matrix[r][c]) {
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  return (piece.x + (minC + maxC + 1) / 2) * cellSize;
}

function pieceTopY(piece, cellSize) {
  if (!piece) return 0;
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (piece.matrix[r][c]) return (piece.y + r) * cellSize;
    }
  }
  return 0;
}

// ============================================================================
// CELL OVERLAY — shape-specific SVG that turns a colored cell into "steel"
// ============================================================================
// Goal: at a glance, you can tell WF (flanges) from HSS (hollow) from PL
// (hatched plate) from L (angle apex) from C (asymmetric flange + back wall).
// Same overlay applies to every cell of a given shape regardless of orientation —
// not strictly accurate to rotation, but it keeps placed pieces readable.

function CellOverlay({ shapeKey, size, uid }) {
  const s = SHAPES[shapeKey];
  const dark = "rgba(0,0,0,0.45)";
  const light = "rgba(255,255,255,0.18)";

  const wrap = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  };

  switch (shapeKey) {
    case "WF":
    case "WF_S": {
      // I-beam: flange bands top + bottom, hint of web in middle
      // Both WF variants share the same overlay since they're the same shape, different size
      const flange = size * 0.22;
      return (
        <svg width={size} height={size} style={wrap}>
          <rect x="0" y="0" width={size} height={flange} fill={dark} />
          <rect x="0" y={size - flange} width={size} height={flange} fill={dark} />
          <line
            x1={size * 0.5}
            y1={flange}
            x2={size * 0.5}
            y2={size - flange}
            stroke={light}
            strokeWidth="0.8"
          />
        </svg>
      );
    }
    case "WT": {
      // Tee: top flange band only (no bottom flange) + central web stripe
      // The asymmetry is what visually distinguishes it from a WF
      const flange = size * 0.22;
      return (
        <svg width={size} height={size} style={wrap}>
          <rect x="0" y="0" width={size} height={flange} fill={dark} />
          <line
            x1={size * 0.5}
            y1={flange}
            x2={size * 0.5}
            y2={size}
            stroke={light}
            strokeWidth="0.8"
          />
        </svg>
      );
    }
    case "BOLT": {
      // Hex bolt head viewed from above — the universal "this is hardware" symbol
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.34;
      // Flat-top hexagon with 6 vertices computed from cos/sin at 60° increments
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      return (
        <svg width={size} height={size} style={wrap}>
          <polygon
            points={points.join(" ")}
            fill="rgba(0,0,0,0.55)"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="0.8"
          />
          {/* Threaded hole in the center */}
          <circle cx={cx} cy={cy} r={size * 0.1} fill="rgba(255,255,255,0.25)" />
        </svg>
      );
    }
    case "HSS":
    case "HSS_R": {
      // Tube: visible wall + hollow center.
      // Both square and rectangular HSS use the same overlay since the
      // hollow-center read works on either footprint.
      const wall = size * 0.22;
      return (
        <svg width={size} height={size} style={wrap}>
          <rect
            x={wall}
            y={wall}
            width={size - 2 * wall}
            height={size - 2 * wall}
            fill={dark}
          />
          <rect
            x={wall + 1}
            y={wall + 1}
            width={size - 2 * wall - 2}
            height={size - 2 * wall - 2}
            fill="none"
            stroke={light}
            strokeWidth="0.6"
          />
        </svg>
      );
    }
    case "PL": {
      // Plate: 45° section hatching, the universal "this is metal" symbol
      const id = `hatch-pl-${uid || size}`;
      return (
        <svg width={size} height={size} style={wrap}>
          <defs>
            <pattern
              id={id}
              patternUnits="userSpaceOnUse"
              width="5"
              height="5"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.35)" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
        </svg>
      );
    }
    case "L_R":
    case "L_L":
    case "L3_R":
    case "L3_L": {
      // Angle: hatching + thicker dark edge along one corner suggesting the apex.
      // Both L sizes share the overlay since the cross-section profile reads the
      // same regardless of leg length.
      const id = `hatch-l-${shapeKey}-${uid || size}`;
      const isRight = shapeKey === "L_R" || shapeKey === "L3_R";
      return (
        <svg width={size} height={size} style={wrap}>
          <defs>
            <pattern
              id={id}
              patternUnits="userSpaceOnUse"
              width="5"
              height="5"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
          {/* Apex emphasis on the corner where the angle meets */}
          {isRight ? (
            <>
              <rect x={0} y={size - 3} width={size} height={3} fill={dark} />
              <rect x={0} y={0} width={3} height={size} fill={dark} />
            </>
          ) : (
            <>
              <rect x={0} y={size - 3} width={size} height={3} fill={dark} />
              <rect x={size - 3} y={0} width={3} height={size} fill={dark} />
            </>
          )}
        </svg>
      );
    }
    case "SHIM": {
      // Stack of thin plates suggested by 4 horizontal stripes.
      // Distinct from BOLT (hex head) — reads as "layered hardware".
      return (
        <svg width={size} height={size} style={wrap}>
          <rect x="2" y={size * 0.18} width={size - 4} height={size * 0.06} fill="rgba(0,0,0,0.55)" />
          <rect x="2" y={size * 0.36} width={size - 4} height={size * 0.06} fill="rgba(0,0,0,0.55)" />
          <rect x="2" y={size * 0.54} width={size - 4} height={size * 0.06} fill="rgba(0,0,0,0.55)" />
          <rect x="2" y={size * 0.72} width={size - 4} height={size * 0.06} fill="rgba(0,0,0,0.55)" />
        </svg>
      );
    }
    case "C_R":
    case "C_L": {
      // Channel: flange bands like WF, plus a "back wall" stripe to read
      // distinct from a wide flange (channel is open on one side)
      const flange = size * 0.2;
      const isRight = shapeKey === "C_R";
      return (
        <svg width={size} height={size} style={wrap}>
          <rect x="0" y="0" width={size} height={flange} fill={dark} />
          <rect x="0" y={size - flange} width={size} height={flange} fill={dark} />
          {/* Web wall on one side — suggests the closed back of a channel */}
          {isRight ? (
            <rect x={0} y={0} width={2.5} height={size} fill={dark} />
          ) : (
            <rect x={size - 2.5} y={0} width={2.5} height={size} fill={dark} />
          )}
        </svg>
      );
    }
    default:
      return null;
  }
}

function Cell({ shapeKey, ghost = false, size = CELL_DESKTOP, uid }) {
  if (!shapeKey) {
    return (
      <div
        className="border border-slate-800/30"
        style={{ width: size, height: size, background: "rgba(15,23,42,0.35)" }}
      />
    );
  }
  const shape = SHAPES[shapeKey];
  return (
    <div
      style={{
        width: size,
        height: size,
        background: ghost
          ? "transparent"
          : `linear-gradient(135deg, ${shape.color} 0%, ${shape.edge} 100%)`,
        border: ghost
          ? `1.5px dashed ${shape.color}80`
          : `1px solid ${shape.edge}`,
        boxShadow: ghost
          ? "none"
          : `inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.18)`,
        position: "relative",
      }}
    >
      {!ghost && <CellOverlay shapeKey={shapeKey} size={size} uid={uid} />}
    </div>
  );
}

// ============================================================================
// STEEL SECTION — proper drafted cross-sections for previews and the gallery
// ============================================================================
// These are not gameplay pieces. They're architectural elevations of each shape
// drawn with hatching, so the title screen and "Next" preview look like a
// trimmed slice from an AISC manual.

function SectionHatch({ id }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(15,23,42,0.55)" strokeWidth="0.7" />
    </pattern>
  );
}

function SteelSection({ shapeKey, height = 80 }) {
  const s = SHAPES[shapeKey];
  const stroke = "#0f172a";
  const fill = s.color;
  const id = `sh-${shapeKey}`;

  switch (shapeKey) {
    case "WF": {
      // Wide flange: top flange, bottom flange, web. Drawn at typical W-shape proportions.
      const w = 70, h = 80;
      const fT = 10; // flange thickness
      const wT = 10; // web thickness
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <g>
            <rect x="0" y="0" width={w} height={fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x="0" y="0" width={w} height={fT} fill={`url(#${id})`} />
            <rect x={(w - wT) / 2} y={fT} width={wT} height={h - 2 * fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x={(w - wT) / 2} y={fT} width={wT} height={h - 2 * fT} fill={`url(#${id})`} />
            <rect x="0" y={h - fT} width={w} height={fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x="0" y={h - fT} width={w} height={fT} fill={`url(#${id})`} />
          </g>
        </svg>
      );
    }
    case "WF_S": {
      // Shorter, wider WF profile — same construction, different proportions
      // so it visually reads as "this is a smaller beam"
      const w = 70, h = 55;
      const fT = 9;
      const wT = 10;
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <g>
            <rect x="0" y="0" width={w} height={fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x="0" y="0" width={w} height={fT} fill={`url(#${id})`} />
            <rect x={(w - wT) / 2} y={fT} width={wT} height={h - 2 * fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x={(w - wT) / 2} y={fT} width={wT} height={h - 2 * fT} fill={`url(#${id})`} />
            <rect x="0" y={h - fT} width={w} height={fT} fill={fill} stroke={stroke} strokeWidth="1" />
            <rect x="0" y={h - fT} width={w} height={fT} fill={`url(#${id})`} />
          </g>
        </svg>
      );
    }
    case "WT": {
      // Tee section: horizontal flange on top, web hanging down from center.
      // Real WTs are cut from W-shapes, so the proportions echo a half-WF.
      const w = 60, h = 60;
      const fT = 9;
      const wT = 10;
      const path = `M0,0 H${w} V${fT} H${(w + wT) / 2} V${h} H${(w - wT) / 2} V${fT} H0 Z`;
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path d={path} fill={fill} stroke={stroke} strokeWidth="1" />
          <path d={path} fill={`url(#${id})`} />
        </svg>
      );
    }
    case "BOLT": {
      // Hex bolt viewed from above: hexagonal head with threaded hole in center.
      // The most recognizable "this is hardware" silhouette in two seconds.
      const w = 60, h = 60;
      const cx = w / 2;
      const cy = h / 2;
      const r = 22;
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <polygon
            points={points.join(" ")}
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
          />
          <polygon points={points.join(" ")} fill={`url(#${id})`} />
          {/* Threaded hole + concentric ring for depth */}
          <circle cx={cx} cy={cy} r="6" fill="#0f172a" stroke={stroke} strokeWidth="0.8" />
          <circle cx={cx} cy={cy} r="3" fill={fill} opacity="0.4" />
        </svg>
      );
    }
    case "HSS": {
      // Hollow square tube
      const w = 70, h = 70;
      const t = 10; // wall thickness
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path
            d={`M0,0 H${w} V${h} H0 Z M${t},${t} V${h - t} H${w - t} V${t} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth="1"
            fillRule="evenodd"
          />
          <path
            d={`M0,0 H${w} V${h} H0 Z M${t},${t} V${h - t} H${w - t} V${t} Z`}
            fill={`url(#${id})`}
            fillRule="evenodd"
          />
        </svg>
      );
    }
    case "HSS_R": {
      // Hollow rectangular tube — wider than tall, distinguishing it from square HSS.
      // Same hollow construction (outer rect minus inner rect) at 12×3 ratio.
      const w = 100, h = 28;
      const t = 7;
      return (
        <svg width={(height * w) / h} height={Math.min(height, height * 0.5)} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path
            d={`M0,0 H${w} V${h} H0 Z M${t},${t} V${h - t} H${w - t} V${t} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth="1"
            fillRule="evenodd"
          />
          <path
            d={`M0,0 H${w} V${h} H0 Z M${t},${t} V${h - t} H${w - t} V${t} Z`}
            fill={`url(#${id})`}
            fillRule="evenodd"
          />
        </svg>
      );
    }
    case "PL": {
      // Plates are physically wide and thin — at full aspect ratio (5:1) they
      // dominate the layout. Render compact: width matched to typical section
      // width, height kept thin to preserve the wide-flat read.
      // Diagonal stripes overlay reference real shop-floor diamond/hazard plate.
      const w = 100, h = 20;
      const dispHeight = Math.min(height * 0.25, 22);
      const dispWidth = (dispHeight * w) / h;
      const stripeId = `pl-stripe-${id}`;
      return (
        <svg width={dispWidth} height={dispHeight} viewBox={`0 0 ${w} ${h}`}>
          <defs>
            <SectionHatch id={id} />
            <pattern id={stripeId} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="rgba(15,23,42,0.55)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill={fill} stroke={stroke} strokeWidth="1" />
          <rect x="0" y="0" width={w} height={h} fill={`url(#${stripeId})`} />
        </svg>
      );
    }
    case "L_R":
    case "L_L": {
      // L6×4×3/8 — unequal angle. Vertical leg 6", horizontal leg 4", 3/8" thick.
      // Drawn at 10:1 scale, with thickness slightly exaggerated for legibility.
      const w = 40, h = 60;
      const t = 7;
      const isRight = shapeKey === "L_R";
      const path = isRight
        ? `M0,0 H${t} V${h - t} H${w} V${h} H0 Z`
        : `M${w - t},0 H${w} V${h} H0 V${h - t} H${w - t} Z`;
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path d={path} fill={fill} stroke={stroke} strokeWidth="1" />
          <path d={path} fill={`url(#${id})`} />
        </svg>
      );
    }
    case "L3_R":
    case "L3_L": {
      // L3×3×3/8 — equal-leg angle, smaller. Both legs 3", 3/8" thick.
      // Renders smaller than L6×4 so the size difference is visible at a glance.
      const w = 36, h = 36;
      const t = 6;
      const isRight = shapeKey === "L3_R";
      const path = isRight
        ? `M0,0 H${t} V${h - t} H${w} V${h} H0 Z`
        : `M${w - t},0 H${w} V${h} H0 V${h - t} H${w - t} Z`;
      // Shrink display height so the small angle reads visibly smaller than L6×4
      const dispHeight = height * 0.7;
      return (
        <svg width={(dispHeight * w) / h} height={dispHeight} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path d={path} fill={fill} stroke={stroke} strokeWidth="1" />
          <path d={path} fill={`url(#${id})`} />
        </svg>
      );
    }
    case "SHIM": {
      // Stack of thin shims viewed edge-on — multiple horizontal slabs with
      // gaps between to suggest layering. Compact like PL since shims are thin.
      const w = 80, dispHeight = Math.min(height * 0.4, 30);
      const dispWidth = (dispHeight * w) / 28; // viewBox h=28, scale to dispHeight
      const h = 28;
      const shimH = 4;
      const gap = 3;
      return (
        <svg width={dispWidth} height={dispHeight} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect
                x="0"
                y={i * (shimH + gap)}
                width={w}
                height={shimH}
                fill={fill}
                stroke={stroke}
                strokeWidth="0.7"
              />
              <rect
                x="0"
                y={i * (shimH + gap)}
                width={w}
                height={shimH}
                fill={`url(#${id})`}
              />
            </g>
          ))}
        </svg>
      );
    }
    case "C_R":
    case "C_L": {
      // Channel: web + two flanges, open on one side
      const w = 50, h = 70;
      const t = 10;
      const isRight = shapeKey === "C_R";
      const path = isRight
        ? `M0,0 H${w} V${t} H${t} V${h - t} H${w} V${h} H0 Z`
        : `M0,0 H${w} V${h} H0 V${h - t} H${w - t} V${t} H0 Z`;
      return (
        <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`}>
          <defs><SectionHatch id={id} /></defs>
          <path d={path} fill={fill} stroke={stroke} strokeWidth="1" />
          <path d={path} fill={`url(#${id})`} />
        </svg>
      );
    }
    default:
      return null;
  }
}

// ============================================================================
// CRANE + TRAILER (unchanged from v2)
// ============================================================================

function CraneGantry({ trolleyX, cableY, hooked, cell }) {
  const fieldWidth = COLS * cell;
  return (
    <svg
      width={fieldWidth + 60}
      height={70}
      viewBox={`0 0 ${fieldWidth + 60} 70`}
      style={{ marginBottom: -2, display: "block" }}
    >
      <rect x="6" y="8" width="14" height="58" fill="#475569" stroke="#0f172a" />
      <rect x="2" y="6" width="22" height="6" fill="#64748b" stroke="#0f172a" />
      <rect x={fieldWidth + 40} y="8" width="14" height="58" fill="#475569" stroke="#0f172a" />
      <rect x={fieldWidth + 36} y="6" width="22" height="6" fill="#64748b" stroke="#0f172a" />
      <rect x="0" y="14" width={fieldWidth + 60} height="6" fill="#64748b" stroke="#0f172a" />
      <rect x="0" y="32" width={fieldWidth + 60} height="6" fill="#64748b" stroke="#0f172a" />
      {Array.from({ length: Math.floor((fieldWidth + 60) / 24) }).map((_, i) => (
        <line key={i} x1={i * 24} y1={20} x2={(i + 1) * 24} y2={32} stroke="#0f172a" strokeWidth="1.5" />
      ))}
      <rect x="0" y="38" width={fieldWidth + 60} height="3" fill="#f59e0b" />
      {Array.from({ length: Math.floor((fieldWidth + 60) / 12) }).map((_, i) => (
        <rect key={i} x={i * 12} y={38} width={6} height={3} fill="#0f172a" />
      ))}
      <g style={{ transform: `translateX(${trolleyX + 30 - 18}px)`, transition: "transform 80ms linear" }}>
        {/* Trolley body — amber so the operator's eye tracks it instantly against
            the dark gantry and hazard stripe. The slate frame and dark wheels
            give it enough structure that it doesn't look like a sticker. */}
        <rect x="0" y="42" width="36" height="14" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
        {/* Slate detail band across the middle for a bit of mechanical texture */}
        <rect x="2" y="47" width="32" height="3" fill="#1e293b" />
        <circle cx="8" cy="56" r="2.5" fill="#0f172a" />
        <circle cx="28" cy="56" r="2.5" fill="#0f172a" />
        {hooked && (
          <line x1="18" y1="56" x2="18" y2={56 + cableY} stroke="#0f172a" strokeWidth="2" opacity="0.85" />
        )}
      </g>
    </svg>
  );
}

// Tractor cab — the truck pulling the trailer. Conventional sleeper-cab silhouette
// in SSE sky blue with amber accent stripe matching the gantry hazard band.
// Drawn at fixed dimensions so it sits proportionally next to the trailer.
function TractorCab() {
  // 90 wide × 50 tall — fits naturally beside the trailer at the kingpin
  return (
    <svg width={90} height={50} viewBox="0 0 90 50" style={{ display: "block" }}>
      {/* Hood — sloped front of cab */}
      <path d="M0,30 L12,18 L30,18 L30,40 L0,40 Z" fill="#0ea5e9" stroke="#0f172a" strokeWidth="1" />
      {/* Grille */}
      <rect x="2" y="28" width="9" height="10" fill="#0f172a" />
      <line x1="3" y1="30" x2="10" y2="30" stroke="#475569" strokeWidth="0.5" />
      <line x1="3" y1="32" x2="10" y2="32" stroke="#475569" strokeWidth="0.5" />
      <line x1="3" y1="34" x2="10" y2="34" stroke="#475569" strokeWidth="0.5" />
      <line x1="3" y1="36" x2="10" y2="36" stroke="#475569" strokeWidth="0.5" />
      {/* Headlight */}
      <circle cx="6" cy="24" r="2" fill="#fde047" stroke="#0f172a" strokeWidth="0.5" />
      {/* Windshield */}
      <path d="M14,20 L26,20 L26,28 L14,28 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="0.7" />
      {/* Sleeper cab + body */}
      <rect x="30" y="14" width="48" height="26" fill="#0ea5e9" stroke="#0f172a" strokeWidth="1" />
      {/* Side window */}
      <rect x="32" y="17" width="10" height="8" fill="#1e293b" stroke="#0f172a" strokeWidth="0.5" />
      {/* SSE accent stripe — matches the gantry hazard band */}
      <rect x="30" y="29" width="48" height="2.5" fill="#f59e0b" />
      {/* SSE wordmark on cab side */}
      <text x="54" y="38" fontSize="6" fontWeight="900" fill="#0f172a" textAnchor="middle" fontFamily="'Aleo', Georgia, serif">SSE</text>
      {/* Exhaust stacks behind sleeper */}
      <rect x="48" y="6" width="2.5" height="14" fill="#475569" stroke="#0f172a" strokeWidth="0.5" />
      <rect x="52" y="6" width="2.5" height="14" fill="#475569" stroke="#0f172a" strokeWidth="0.5" />
      {/* Frame rail back to kingpin connection */}
      <rect x="78" y="32" width="12" height="4" fill="#1e293b" />
      {/* Wheels — front + drive tandem */}
      <circle cx="20" cy="40" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
      <circle cx="20" cy="40" r="2" fill="#475569" />
      <circle cx="62" cy="40" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
      <circle cx="62" cy="40" r="2" fill="#475569" />
      <circle cx="74" cy="40" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
      <circle cx="74" cy="40" r="2" fill="#475569" />
    </svg>
  );
}

// Trailer SVG — stripped of the slide animation since DispatchAnimation now
// orchestrates rig movement at the parent level. Renders just the static trailer.
function TrailerSvg({ width }) {
  return (
    <svg width={width} height={50} viewBox={`0 0 ${width} 50`} style={{ display: "block" }}>
      {/* Trailer bed — diamond plate look */}
      <rect x="0" y="0" width={width} height="10" fill="#334155" stroke="#0f172a" />
      {Array.from({ length: Math.floor(width / 8) }).map((_, i) => (
        <line key={i} x1={i * 8} y1={0} x2={i * 8 + 4} y2={10} stroke="#1e293b" strokeWidth="0.5" />
      ))}
      {/* Frame rail */}
      <rect x="0" y="10" width={width} height="6" fill="#1e293b" stroke="#0f172a" />
      <rect x="20" y="16" width={width - 40} height="4" fill="#0f172a" />
      {/* Wheels — four sets across the trailer, mirrored at each end.
          Both end-wheels are inset 40px (matching the leftmost), so the right
          wheel doesn't clip the SVG canvas edge. r=11 + 40 = 51 from each edge. */}
      {[40, 90, width - 90, width - 40].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={32} r={11} fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx={cx} cy={32} r={4} fill="#475569" />
        </g>
      ))}
      {/* Kingpin connector on left */}
      <rect x="2" y="14" width="14" height="10" fill="#475569" stroke="#0f172a" />
    </svg>
  );
}

// Static (non-animating) trailer slot used during normal gameplay.
// Sits below the playfield as the "load deck" for cargo to pile onto.
// Static (non-animating) trailer slot used during normal gameplay.
// Sits below the playfield as the "load deck" for cargo to pile onto.
// Width matches the gantry (fieldWidth + 60). The parent container handles
// the negative margin so this just renders at its natural width.
function Trailer({ cell }) {
  const fieldWidth = COLS * cell;
  return (
    <div style={{ width: fieldWidth + 60 }}>
      <TrailerSvg width={fieldWidth + 60} />
    </div>
  );
}

// Full tractor-trailer rig — used in the dispatch animation when trucks are
// arriving or departing. The tractor sits to the left of the trailer with their
// frame rails aligned. Kept as a single transform target so the whole rig can
// slide horizontally as a unit.
function TruckRig({ trailerWidth }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <TractorCab />
      <div style={{ width: trailerWidth }}>
        <TrailerSvg width={trailerWidth} />
      </div>
    </div>
  );
}

// Dispatch animation overlay. Orchestrates two rigs over a 5-second sequence:
//   0.0–2.5s: loaded rig (current trailer) drives off to the right
//   2.5–5.0s: empty rig drives in from the left
// A skip button is rendered separately by the parent (it sits over the playfield
// dim layer for visual prominence).
function DispatchAnimation({ phase, cell, skipped }) {
  const fieldWidth = COLS * cell;
  const trailerWidth = fieldWidth + 40;
  // Total horizontal travel — far enough that the rig fully exits/enters frame
  const travel = trailerWidth + 220;

  // armed=false on first paint (rigs at start positions, no transition yet),
  // then RAF flips to true so the CSS transition has values to interpolate.
  // Resets each phase change so the entering animation runs fresh.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    // Two RAFs: first ensures the un-armed render has painted, second arms.
    // Single RAF can race with React's paint commit on some browsers.
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setArmed(true));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [phase]);

  // Resolve positions:
  // SKIP wins everything — both rigs snap to their final resting state
  // (loaded gone, empty centered).
  // Otherwise based on phase + armed state:
  //   leaving + !armed   → loaded at 0,       empty at -travel
  //   leaving + armed    → loaded at +travel, empty at -travel  (loaded animates out)
  //   arriving + !armed  → loaded at +travel, empty at -travel
  //   arriving + armed   → loaded at +travel, empty at 0        (empty animates in)
  let loadedX, emptyX;
  if (skipped) {
    loadedX = travel;
    emptyX = 0;
  } else if (phase === "leaving") {
    loadedX = armed ? travel : 0;
    emptyX = -travel;
  } else if (phase === "arriving") {
    loadedX = travel;
    emptyX = armed ? 0 : -travel;
  } else {
    loadedX = 0;
    emptyX = -travel;
  }

  // Cinematic ease-in-out — the "armed" state difference triggers the transition
  const transition = skipped
    ? "none"
    : "transform 2400ms cubic-bezier(0.45, 0, 0.55, 1)";

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        bottom: 0,
        height: 50,
      }}
    >
      <div className="relative" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        {/* Loaded rig — sits at center initially, slides right */}
        <div
          className="absolute"
          style={{
            left: "50%",
            bottom: 0,
            transform: `translateX(calc(-50% + ${loadedX}px))`,
            transition,
          }}
        >
          <TruckRig trailerWidth={trailerWidth} />
        </div>
        {/* Empty rig — starts off-screen left, slides into center */}
        <div
          className="absolute"
          style={{
            left: "50%",
            bottom: 0,
            transform: `translateX(calc(-50% + ${emptyX}px))`,
            transition,
          }}
        >
          <TruckRig trailerWidth={trailerWidth} />
        </div>
      </div>
    </div>
  );
}

function Playfield({ grid, piece, gY, paused, gameOver, cell, onMove, onRotate, onHardDrop }) {
  const display = grid.map((row) => [...row]);
  const ghost = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // Swipe gesture state. Tracked via refs so the touch handlers don't
  // trigger re-renders mid-gesture.
  const touchStart = useRef(null);
  const touchMoved = useRef(false);
  const HORIZONTAL_THRESHOLD = cell;
  const VERTICAL_THRESHOLD = cell * 3; // hard drop needs a deliberate downward flick

  const handleTouchStart = (e) => {
    if (paused || gameOver) return;
    const t = e.touches[0];
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
      startX: t.clientX,
      startY: t.clientY,
      time: Date.now(),
    };
    touchMoved.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current || paused || gameOver) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    // Horizontal swipe: move piece, then reset anchor for incremental swipes.
    // Each cell-width of drag triggers another move, so a long swipe slides
    // the piece multiple columns the way it would on a real cab control.
    if (Math.abs(dx) >= HORIZONTAL_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      if (dx > 0) onMove && onMove(1, 0);
      else onMove && onMove(-1, 0);
      touchStart.current = {
        ...touchStart.current,
        x: t.clientX,
        y: t.clientY,
      };
      touchMoved.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current || paused || gameOver) {
      touchStart.current = null;
      return;
    }
    const elapsed = Date.now() - touchStart.current.time;

    // Use changedTouches because by touchend, e.touches is empty.
    // Measure total movement from the very start of the gesture (startX/startY)
    // so a long swipe-then-release still registers as a swipe, not a tap.
    const t = e.changedTouches[0];
    const totalDy = t.clientY - touchStart.current.startY;
    const totalDx = t.clientX - touchStart.current.startX;

    // Quick downward flick → hard drop. Vertical movement must dominate horizontal.
    if (totalDy > VERTICAL_THRESHOLD && Math.abs(totalDy) > Math.abs(totalDx)) {
      onHardDrop && onHardDrop();
    } else if (!touchMoved.current && elapsed < 300) {
      // Tap (no horizontal swipe registered, short duration) → rotate
      onRotate && onRotate();
    }
    touchStart.current = null;
  };

  if (piece) {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;
        const ny = gY + r;
        const nx = piece.x + c;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !display[ny][nx]) {
          ghost[ny][nx] = piece.key;
        }
      }
    }
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
          display[ny][nx] = piece.key;
          ghost[ny][nx] = null;
        }
      }
    }
  }

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,176,214,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(126,176,214,0.06) 1px, transparent 1px)",
          backgroundSize: `${cell}px ${cell}px`,
        }}
      />
      <div
        className="relative grid border-x-2 border-slate-700"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cell}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${cell}px)`,
          background: "rgba(2,18,40,0.85)",
        }}
      >
        {display.map((row, r) =>
          row.map((cellShape, c) => (
            <Cell
              key={`${r}-${c}`}
              shapeKey={cellShape || ghost[r][c]}
              ghost={!cellShape && !!ghost[r][c]}
              size={cell}
              uid={`${r}-${c}`}
            />
          )),
        )}
      </div>

      {(paused || gameOver) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm z-10">
          <div className="text-center px-6">
            <div
              className="text-amber-500 tracking-[0.16em] mb-2"
              style={{
                fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                fontSize: 44,
                lineHeight: 0.95,
              }}
            >
              {gameOver ? "LOAD SHIFTED" : "CRANE STOPPED"}
            </div>
            <div
              className="text-slate-400 tracking-[0.22em] uppercase"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 13 }}
            >
              {gameOver ? "Press R to dispatch a new rig" : "Press P to resume"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "Next on the Hook" panel — shows the proper drafted cross-section, designation,
// and tonnage. Reads like a bill-of-materials line item.
function PiecePreview({ shapeKey, label, sectionHeight = 70 }) {
  if (!shapeKey) return null;
  const shape = SHAPES[shapeKey];
  return (
    <div className="flex flex-col items-center">
      {label && (
        <div
          className="uppercase mb-3"
          style={{
            fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
            fontSize: 11,
            letterSpacing: "0.25em",
            color: "#7eb0d6",
          }}
        >
          {label}
        </div>
      )}
      <div
        className="flex items-center justify-center bg-slate-950/40 border border-slate-700 px-4 py-3"
        style={{ minHeight: sectionHeight + 10 }}
      >
        <SteelSection shapeKey={shapeKey} height={sectionHeight} />
      </div>
      <div className="mt-3 text-center">
        <div
          className="font-black tracking-wider"
          style={{ color: shape.color, fontFamily: "'Aleo', Georgia, serif", fontSize: 18 }}
        >
          {shape.designation}
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.18em] mt-0.5"
          style={{ color: "#4d7aa8" }}
        >
          {shape.longName}
          {shape.lengthFt && ` · ${shape.lengthFt}'`}
        </div>
        <div className="text-[11px] font-bold mt-1 tabular-nums tracking-wider" style={{ color: "#7eb0d6", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          {shape.pounds.toLocaleString()} LB
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, accent = false, sub = null, big = false }) {
  // The "big" variant is for the desktop left-sidebar stack — taller cards,
  // larger Bebas labels, larger JetBrains Mono values, more breathing room.
  // The default (compact) variant is used in the mobile top-strip where
  // multiple stats sit side-by-side in a tight row.
  //
  // Color system (per design spec):
  //   - Label: SSE blue-300 (#7eb0d6) — unified "label" color across the brand
  //   - Value (accent): amber-500 — earned amber for TONS LOADED (the score)
  //   - Value (default): pure white (#ffffff) — readout, not metadata
  //   - Subtitle: muted SSE blue (#4d7aa8) — quieter than the label, on-brand
  if (big) {
    return (
      <div className="border border-slate-700 bg-slate-900/60 px-4 py-3 sm:py-4">
        <div
          className="uppercase mb-1 whitespace-nowrap"
          style={{
            fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
            fontSize: 13,
            letterSpacing: "0.18em",
            color: "#7eb0d6",
          }}
        >
          {label}
        </div>
        <div
          className="tabular-nums leading-none"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontWeight: 700,
            fontSize: 40,
            color: accent ? "#f59e0b" : "#ffffff",
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            className="uppercase mt-2 whitespace-nowrap"
            style={{
              fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#4d7aa8",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="border border-slate-700 bg-slate-900/60 px-2 sm:px-3 py-1.5 sm:py-2">
      <div
        className="uppercase mb-0.5 sm:mb-1 whitespace-nowrap"
        style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.10em", color: "#7eb0d6" }}
      >
        {label}
      </div>
      <div
        className={`text-xl sm:text-2xl tabular-nums leading-none ${accent ? "text-amber-500" : "text-slate-100"}`}
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700 }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="uppercase mt-1 whitespace-nowrap"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.10em", color: "#4d7aa8" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function LoadGauge({ tons, capacity }) {
  const pct = Math.min(100, (tons / capacity) * 100);
  const danger = pct >= 80;
  return (
    <div className="border border-slate-700 bg-slate-900/60 px-2 sm:px-3 py-1 sm:py-2">
      <div className="flex justify-between items-baseline mb-0.5 sm:mb-1 gap-2">
        <div
          className="uppercase whitespace-nowrap"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.10em", color: "#7eb0d6" }}
        >
          Current Load
        </div>
        <div
          className="tabular-nums whitespace-nowrap"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11, fontWeight: 700, color: "#cfe0ee" }}
        >
          <span className="text-amber-500">{tons.toFixed(1)}</span> / {capacity} T
        </div>
      </div>
      <div className="h-2 sm:h-3 bg-slate-950 border border-slate-800 relative overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: danger
              ? "linear-gradient(90deg, #f59e0b, #ef4444)"
              : "linear-gradient(90deg, #1668ab, #7eb0d6)",
          }}
        />
        <div className="absolute top-0 bottom-0 border-l border-amber-500/50" style={{ left: "80%" }} />
      </div>
    </div>
  );
}

function TouchButton({ children, onClick, ariaLabel, primary = false }) {
  // Use onPointerDown for instant response on tap (works for touch, mouse, stylus).
  // Avoids the iOS Safari quirk where touchstart + onClick can fight each other
  // and swallow fast taps. onKeyDown keeps keyboard activation working for a11y.
  const fire = (e) => {
    e.preventDefault();
    onClick && onClick();
  };
  const baseClass = primary
    ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 border-2 border-amber-600 text-slate-950 active:text-slate-950"
    : "bg-slate-800 hover:bg-slate-700 active:bg-amber-600 border border-slate-700 hover:border-amber-500 text-slate-200 active:text-white";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={fire}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "") fire(e);
      }}
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
      className={`${baseClass} py-4 px-1 text-lg font-black tracking-wider uppercase transition-all select-none`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// SHIPPING TICKET — game-over summary styled as a real bill of lading
// ============================================================================
// Aggregates piece counts by designation so mirrored variants (L_R/L_L) collapse
// to a single line — real shipping tickets don't track orientation. Each row
// shows quantity, designation, unit weight, and line total. Footer totals up
// trucks shipped, courses cleared, and grand total weight.

function ShippingTicket({
  pieceCounts,
  trucksShipped,
  poundsLoaded,
  courses,
  startedAt,
  ticketNumber,
  onDispatch,
  operatorName,
}) {
  // Aggregate by designation: collapse L_R + L_L into one row, etc.
  // Order pieces by the order they appear in SHAPE_KEYS, so heaviest structurals
  // come first on the ticket — matches how a real shipping ticket would order
  // material from heaviest down to hardware.
  const aggregated = {};
  const orderIndex = {};
  SHAPE_KEYS.forEach((key, i) => {
    const s = SHAPES[key];
    const count = pieceCounts[key] || 0;
    if (!count) return;
    const designation = s.designation;
    if (!aggregated[designation]) {
      aggregated[designation] = {
        qty: 0,
        designation,
        longName: s.longName.replace(/ \([RL]\)$/, ""), // strip orientation tag
        lengthFt: s.lengthFt,
        unitPounds: s.pounds,
        totalPounds: 0,
      };
      orderIndex[designation] = i;
    }
    aggregated[designation].qty += count;
    aggregated[designation].totalPounds += count * s.pounds;
  });
  const rows = Object.values(aggregated).sort(
    (a, b) => orderIndex[a.designation] - orderIndex[b.designation],
  );

  const grandTotalLb = rows.reduce((sum, r) => sum + r.totalPounds, 0);

  const dateStr = startedAt
    ? startedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "--";
  const timeStr = startedAt
    ? startedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Paper-stock background to evoke a printed ticket */}
      <div
        className="border-2 border-slate-700 shadow-2xl"
        style={{
          background:
            "repeating-linear-gradient(0deg, #fafaf9 0 28px, #f5f5f4 28px 56px)",
          color: "#0f172a",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
        }}
      >
        {/* Header band */}
        <div className="bg-slate-900 text-slate-100 px-4 sm:px-6 py-3 border-b-4 border-amber-500">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div
                className="uppercase tracking-[0.22em]"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
              >
                Bill of Lading
              </div>
              <div
                className="uppercase tracking-[0.10em] leading-none"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 28, color: "#ffffff" }}
              >
                Shipping <span style={{ color: "#f59e0b" }}>Ticket</span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="uppercase tracking-[0.18em]"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, color: "#7eb0d6" }}
              >
                Ticket No.
              </div>
              <div
                className="tabular-nums leading-none"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 22, fontWeight: 700, color: "#ffffff" }}
              >
                {ticketNumber || "------"}
              </div>
            </div>
          </div>
        </div>

        {/* Meta strip — date, from, to, driver */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 sm:px-6 py-3 border-b border-slate-300 text-[11px] sm:text-xs">
          <div>
            <span
              className="uppercase mr-1"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#1668ab" }}
            >
              From:
            </span>
            <div className="font-bold mt-0.5">SOUTHERN STEEL ENGINEERS</div>
            <div className="text-slate-600">Lexington, SC</div>
          </div>
          <div>
            <span
              className="uppercase mr-1"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#1668ab" }}
            >
              To:
            </span>
            <div className="font-bold mt-0.5">JOBSITE · TBD</div>
            <div className="text-slate-600">FOB Origin</div>
          </div>
          <div>
            <span
              className="uppercase mr-1"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#1668ab" }}
            >
              Date:
            </span>
            <span className="font-bold">{dateStr}</span>
            <span className="text-slate-600 ml-2">{timeStr}</span>
          </div>
          <div>
            <span
              className="uppercase mr-1"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#1668ab" }}
            >
              Driver:
            </span>
            <span className="font-bold">{operatorName || "CRANE OPERATOR"}</span>
          </div>
        </div>

        {/* Itemized table */}
        <div className="px-2 sm:px-4 py-2">
          {/* Column headers */}
          <div
            className="grid grid-cols-12 gap-1 sm:gap-2 px-2 py-1.5 border-b-2 border-slate-900 uppercase"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.18em", color: "#1668ab" }}
          >
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-4 sm:col-span-5">Designation</div>
            <div className="col-span-4 sm:col-span-3 hidden sm:block">Description</div>
            <div className="col-span-3 sm:col-span-2 text-right">Unit Lb</div>
            <div className="col-span-4 sm:col-span-1 text-right">Total Lb</div>
          </div>

          {/* Rows */}
          {rows.length === 0 ? (
            <div className="px-2 py-6 text-center text-slate-500 italic text-sm">
              No material loaded.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.designation}
                className="grid grid-cols-12 gap-1 sm:gap-2 px-2 py-1.5 text-[11px] sm:text-xs border-b border-slate-300 tabular-nums"
              >
                <div className="col-span-1 text-right font-black text-slate-900">
                  {r.qty}
                </div>
                <div className="col-span-4 sm:col-span-5 font-bold text-slate-900">
                  {r.designation}
                </div>
                <div className="col-span-4 sm:col-span-3 text-slate-600 hidden sm:block truncate">
                  {r.longName}
                  {r.lengthFt && ` · ${r.lengthFt}'`}
                </div>
                <div className="col-span-3 sm:col-span-2 text-right text-slate-700">
                  {r.unitPounds.toLocaleString()}
                </div>
                <div className="col-span-4 sm:col-span-1 text-right font-bold text-slate-900">
                  {r.totalPounds.toLocaleString()}
                </div>
              </div>
            ))
          )}

          {/* Grand total row */}
          <div className="grid grid-cols-12 gap-1 sm:gap-2 px-2 py-2 mt-1 border-t-2 border-slate-900 bg-amber-50 text-xs sm:text-sm tabular-nums">
            <div className="col-span-8 sm:col-span-10 text-right font-black tracking-wider uppercase text-slate-900">
              Grand Total
            </div>
            <div className="col-span-4 sm:col-span-2 text-right font-black text-slate-900">
              {grandTotalLb.toLocaleString()} LB
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 border-t-4 border-slate-900 bg-slate-100 text-center divide-x-2 divide-slate-300">
          <div className="px-2 py-3">
            <div
              className="uppercase"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.18em", color: "#1668ab" }}
            >
              Trucks
            </div>
            <div
              className="text-xl sm:text-2xl tabular-nums leading-tight"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: "#0f172a" }}
            >
              {trucksShipped}
            </div>
          </div>
          <div className="px-2 py-3">
            <div
              className="uppercase"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.18em", color: "#1668ab" }}
            >
              Tonnage
            </div>
            <div
              className="text-xl sm:text-2xl tabular-nums leading-tight"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: "#b45309" }}
            >
              {(poundsLoaded / 2000).toFixed(1)} T
            </div>
          </div>
          <div className="px-2 py-3">
            <div
              className="uppercase"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.18em", color: "#1668ab" }}
            >
              Courses
            </div>
            <div
              className="text-xl sm:text-2xl tabular-nums leading-tight"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: "#0f172a" }}
            >
              {courses}
            </div>
          </div>
        </div>

        {/* Signature line + footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-300 flex justify-between items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            {/* Signature SITS ON the line. Caveat cursive reads as a
                handwritten yard-foreman scribble. Empty (just the line) when
                the player hasn't submitted to the leaderboard yet. Slight
                rotation and tucking below the baseline mimics a real signature
                that doesn't sit perfectly on the ruled line. */}
            <div className="border-b border-slate-900 h-7 flex items-end pl-2 pb-0">
              {operatorName && (
                <span
                  style={{
                    fontFamily: "'Caveat', 'Brush Script MT', cursive",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#0f172a",
                    lineHeight: 1,
                    transform: "rotate(-2deg) translateY(2px)",
                    transformOrigin: "left bottom",
                    display: "inline-block",
                  }}
                >
                  {/* Title case for signature feel — real signatures aren't
                      all caps. Leaderboard and Driver: field stay uppercase. */}
                  {operatorName
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
            </div>
            <div
              className="uppercase mt-1"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.18em", color: "#1668ab" }}
            >
              Driver Signature
            </div>
          </div>
          <div
            className="text-right uppercase"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#1668ab" }}
          >
            SSE · Lic. 46 States
          </div>
        </div>
      </div>

      <button
        onClick={onDispatch}
        className="tracking-[0.14em] uppercase py-3 px-6 transition-all w-full mt-4"
        style={{
          fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
          fontSize: 20,
          background: "#1668ab",
          color: "#ffffff",
          border: "1px solid #2f83c4",
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#2f83c4'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#1668ab'; }}
      >
        Dispatch New Rig <span style={{ color: '#f59e0b' }}>→</span>
      </button>
    </div>
  );
}

// ============================================================================
// LEADERBOARD — display, submission, sanitization, mock storage
// ============================================================================
// Mock storage uses artifact window.storage for prototype. Production swaps
// these calls for fetches to Vercel API routes that talk to Supabase. The
// component API stays the same so the swap is a 3-line change.

// Profanity wordlist — kept short and targets common patterns. Server-side
// has a more thorough list; this is the first-line client check that gives
// instant feedback to the user. Case-insensitive substring match.
const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "cunt", "asshole", "dick", "cock", "pussy",
  "nigger", "nigga", "faggot", "retard", "whore", "slut", "bastard",
  "damn", "piss", "crap", "twat", "wank", "porn", "anal", "rape",
  "nazi", "hitler", "kkk",
];

// Strip control chars, normalize whitespace, enforce length, block profanity.
// Returns { value, error } — error is null if clean. Used for both name and company.
function sanitizeInput(raw, { maxLength, required, fieldName }) {
  if (raw == null) return { value: "", error: required ? `${fieldName} is required` : null };
  let v = String(raw)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (v.length === 0) {
    return { value: "", error: required ? `${fieldName} is required` : null };
  }
  if (v.length > maxLength) {
    return { value: v.slice(0, maxLength), error: `${fieldName} must be ${maxLength} characters or less` };
  }
  const lower = v.toLowerCase();
  for (const bad of PROFANITY_LIST) {
    if (lower.includes(bad)) {
      return { value: v, error: `${fieldName} contains language we can't accept` };
    }
  }
  return { value: v, error: null };
}

// Leaderboard storage adapter. Stage 2: real shared leaderboard via Vercel
// serverless API routes that talk to Supabase Postgres. Browser never touches
// the database directly — all writes flow through /api/leaderboard/submit
// which validates server-side, hashes the IP, and inserts via the service
// role key. Reads come from /api/leaderboard/top which caches at the edge.
//
// The interface (getTop, submit) is unchanged from Stage 1, so this swap is
// contained to this file. The rest of the component keeps calling
// leaderboardStorage.getTop(N) and leaderboardStorage.submit(entry).
const leaderboardStorage = {
  async getTop(limit = 100) {
    try {
      const response = await fetch(`/api/leaderboard/top?limit=${limit}`, {
        // The browser will cache via the Cache-Control header from the API
        // route (30s edge cache). No need for explicit cache options here.
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        // Server errors logged but not surfaced to the player — they see an
        // empty leaderboard, which reads as "be the first" rather than
        // "something's broken."
        return [];
      }
      const data = await response.json();
      return Array.isArray(data.entries) ? data.entries : [];
    } catch (e) {
      return [];
    }
  },
  async submit(entry) {
    try {
      const response = await fetch("/api/leaderboard/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(entry),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Pass the server's error message through to the user — it's already
        // sanitized and user-friendly (e.g. "Too many submissions, try again
        // in 180s" or "Game was too short to submit").
        return {
          success: false,
          error: data.error || `Submission failed (${response.status})`,
        };
      }
      return { success: true, id: data.id };
    } catch (e) {
      return { success: false, error: "Network error. Try again." };
    }
  },
};

// Server-equivalent sanity check on the client — instant feedback before
// submission. Server will re-check authoritatively.
function validateScore({ pounds_loaded, trucks_shipped, game_duration_s }) {
  if (game_duration_s < 60) {
    return { valid: false, reason: "Game was too short to submit (minimum 60 seconds)" };
  }
  const maxPossibleLb = game_duration_s * 800;
  if (pounds_loaded > maxPossibleLb) {
    return { valid: false, reason: "Score outside physical limits" };
  }
  const expectedTrucks = Math.floor(pounds_loaded / 40000);
  if (trucks_shipped > expectedTrucks + 1) {
    return { valid: false, reason: "Truck count doesn't match tonnage" };
  }
  return { valid: true };
}

function formatLeaderboardDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
  } catch (_) {
    return "";
  }
}

function formatTons(pounds) {
  return `${(pounds / 2000).toFixed(1)} T`;
}

// ============================================================================
// LEADERBOARD DISPLAY
// ============================================================================
// Responsive: horizontal table on desktop (sm+), vertical card stack on mobile.
// Top 10 default, "View Top 100" expansion.
// Visual language matches v20: Bebas Neue labels, JetBrains Mono tabular data,
// SSE blue for metadata. Amber stays out of metadata per the v20 audit; rank #1
// gets the highlight as the leaderboard's earned scoreboard moment.

function Leaderboard({ entries, highlightId }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? entries.slice(0, 100) : entries.slice(0, 10);
  const hasMore = entries.length > 10;

  if (entries.length === 0) {
    return (
      <div
        className="border border-slate-700 bg-slate-900/60 p-6 text-center"
        style={{ borderColor: "#1668ab" }}
      >
        <div
          className="uppercase tracking-[0.22em] mb-2"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 12, color: "#7eb0d6" }}
        >
          Yard Leaderboard
        </div>
        <div
          className="text-slate-400 italic"
          style={{ fontFamily: "'Aleo', Georgia, serif", fontSize: 13 }}
        >
          Be the first to make the board.
        </div>
      </div>
    );
  }

  return (
    <div className="border bg-slate-900/60" style={{ borderColor: "#1668ab" }}>
      {/* Header band — Bebas wordmark on the SSE-blue / hazard border combo */}
      <div
        className="border-b-4 bg-slate-900 px-4 py-3"
        style={{ borderColor: "#f59e0b" }}
      >
        <div
          className="uppercase tracking-[0.22em]"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
        >
          Yard Leaderboard
        </div>
        <div
          className="tracking-[0.06em]"
          style={{
            fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
            fontSize: 22,
            color: "#cfe0ee",
            lineHeight: 1.1,
          }}
        >
          Top {expanded ? "100" : "10"} <span className="text-amber-500">Hauls</span>
        </div>
      </div>

      {/* Desktop: horizontal columns. Hidden on mobile. */}
      <div className="hidden sm:block">
        <div
          className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-700 uppercase"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, letterSpacing: "0.18em", color: "#7eb0d6" }}
        >
          <div className="col-span-1 text-right">#</div>
          <div className="col-span-5">Operator</div>
          <div className="col-span-2 text-right">Trucks</div>
          <div className="col-span-2 text-right">Date</div>
          <div className="col-span-2 text-right">Tonnage</div>
        </div>
        {shown.map((entry, i) => {
          const rank = i + 1;
          const isHighlight = entry.id === highlightId;
          return (
            <div
              key={entry.id}
              className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-800 items-center"
              style={isHighlight ? { background: "rgba(245, 158, 11, 0.08)" } : undefined}
            >
              <div
                className="col-span-1 text-right tabular-nums"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  fontSize: 18,
                  color: rank === 1 ? "#f59e0b" : "#cfe0ee",
                  letterSpacing: "0.05em",
                }}
              >
                {rank}
              </div>
              <div className="col-span-5 min-w-0">
                <div
                  className="truncate uppercase"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 16,
                    letterSpacing: "0.06em",
                    color: isHighlight ? "#f59e0b" : "#cfe0ee",
                  }}
                >
                  {entry.name}
                </div>
                {entry.company && (
                  <div
                    className="truncate uppercase"
                    style={{
                      fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "#7eb0d6",
                    }}
                  >
                    {entry.company}
                  </div>
                )}
              </div>
              <div
                className="col-span-2 text-right tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12, color: "#7eb0d6", fontWeight: 700 }}
              >
                {entry.trucks_shipped}
              </div>
              <div
                className="col-span-2 text-right tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11, color: "#4d7aa8" }}
              >
                {formatLeaderboardDate(entry.created_at)}
              </div>
              <div
                className="col-span-2 text-right tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: rank === 1 ? "#f59e0b" : "#cfe0ee",
                }}
              >
                {formatTons(entry.pounds_loaded)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical cards. Hidden on sm+. */}
      <div className="sm:hidden">
        {shown.map((entry, i) => {
          const rank = i + 1;
          const isHighlight = entry.id === highlightId;
          return (
            <div
              key={entry.id}
              className="px-3 py-2.5 border-b border-slate-800 flex items-center gap-3"
              style={isHighlight ? { background: "rgba(245, 158, 11, 0.08)" } : undefined}
            >
              <div
                className="w-8 text-right tabular-nums"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  fontSize: 26,
                  color: rank === 1 ? "#f59e0b" : "#7eb0d6",
                  lineHeight: 1,
                }}
              >
                {rank}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="truncate uppercase"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 15,
                    letterSpacing: "0.06em",
                    color: isHighlight ? "#f59e0b" : "#cfe0ee",
                  }}
                >
                  {entry.name}
                </div>
                {entry.company && (
                  <div
                    className="truncate uppercase"
                    style={{
                      fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: "#7eb0d6",
                    }}
                  >
                    {entry.company}
                  </div>
                )}
                <div
                  className="tabular-nums mt-0.5"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, color: "#4d7aa8" }}
                >
                  {entry.trucks_shipped} truck{entry.trucks_shipped !== 1 ? "s" : ""} · {formatLeaderboardDate(entry.created_at)}
                </div>
              </div>
              <div
                className="text-right tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: rank === 1 ? 18 : 15,
                  fontWeight: 700,
                  color: rank === 1 ? "#f59e0b" : "#cfe0ee",
                }}
              >
                {formatTons(entry.pounds_loaded)}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="p-3 text-center border-t border-slate-700">
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            className="uppercase tracking-[0.22em] hover:text-amber-500 transition-colors"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6", letterSpacing: "0.22em" }}
          >
            {expanded ? "← Show Top 10" : "View Top 100 →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBMIT FORM
// ============================================================================

function LeaderboardSubmitForm({
  poundsLoaded,
  trucksShipped,
  coursesCleared,
  gameDurationS,
  onSubmitted,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  // Honeypot field — bots fill it, humans don't. Hidden off-screen.
  const [website, setWebsite] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (website.length > 0) {
      // Honeypot tripped — silent fake success
      setSubmitted(true);
      onSubmitted && onSubmitted({ id: null, suppressed: true });
      return;
    }

    const nameCheck = sanitizeInput(name, { maxLength: 16, required: true, fieldName: "Name" });
    if (nameCheck.error) {
      setError(nameCheck.error);
      return;
    }
    const companyCheck = sanitizeInput(company, { maxLength: 40, required: false, fieldName: "Company" });
    if (companyCheck.error) {
      setError(companyCheck.error);
      return;
    }

    const validation = validateScore({
      pounds_loaded: poundsLoaded,
      trucks_shipped: trucksShipped,
      game_duration_s: gameDurationS,
    });
    if (!validation.valid) {
      setError(validation.reason);
      return;
    }

    setSubmitting(true);
    const result = await leaderboardStorage.submit({
      name: nameCheck.value.toUpperCase(),
      company: companyCheck.value,
      pounds_loaded: poundsLoaded,
      trucks_shipped: trucksShipped,
      courses_cleared: coursesCleared,
      game_duration_s: gameDurationS,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Submission failed. Please try again.");
      return;
    }
    setSubmitted(true);
    onSubmitted && onSubmitted({ id: result.id });
  };

  if (submitted) {
    return (
      <div
        className="border-2 bg-slate-900 p-5 text-center"
        style={{ borderColor: "#f59e0b" }}
      >
        <div
          className="uppercase tracking-[0.22em]"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 26, color: "#f59e0b" }}
        >
          Logged
        </div>
        <div
          className="uppercase tracking-[0.22em] mt-1"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
        >
          Your haul is on the board
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 bg-slate-900/80 p-4 sm:p-5" style={{ borderColor: "#1668ab" }}>
      <div
        className="uppercase tracking-[0.06em] mb-1"
        style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 22, color: "#cfe0ee" }}
      >
        Submit Your <span className="text-amber-500">Haul</span>
      </div>
      <div
        className="uppercase tracking-[0.22em] mb-4 tabular-nums"
        style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
      >
        {formatTons(poundsLoaded)} · {trucksShipped} truck{trucksShipped !== 1 ? "s" : ""} shipped
      </div>

      <div className="space-y-3">
        <div>
          <label
            className="block uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
          >
            Operator <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full bg-slate-950 border border-slate-700 px-3 py-2 uppercase focus:outline-none"
            style={{
              fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
              fontSize: 16,
              letterSpacing: "0.08em",
              color: "#cfe0ee",
            }}
            autoComplete="off"
            onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
            onBlur={(e) => (e.target.style.borderColor = "")}
          />
        </div>

        <div>
          <label
            className="block uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
          >
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            maxLength={50}
            className="w-full bg-slate-950 border border-slate-700 px-3 py-2 focus:outline-none"
            style={{
              fontFamily: "'Aleo', Georgia, serif",
              fontSize: 14,
              color: "#cfe0ee",
            }}
            autoComplete="off"
            onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
            onBlur={(e) => (e.target.style.borderColor = "")}
          />
        </div>

        {/* Honeypot: hidden off-screen for sighted users + screen readers */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
        >
          <label>
            Website (leave blank)
            <input
              type="text"
              tabIndex={-1}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        {error && (
          <div
            className="px-3 py-2 border"
            style={{
              borderColor: "#7f1d1d",
              background: "rgba(127, 29, 29, 0.25)",
              fontFamily: "'Aleo', Georgia, serif",
              fontSize: 12,
              fontStyle: "italic",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* PRODUCTION NOTE: Cloudflare Turnstile widget mounts here when deployed.
            The /api/leaderboard/submit endpoint verifies the token server-side
            before accepting the entry. See DEPLOYMENT.md. */}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 uppercase py-3 px-4 transition-all whitespace-nowrap"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 18, letterSpacing: "0.14em" }}
          >
            {submitting ? "Logging…" : "Log Score"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border text-slate-300 py-3 px-4 uppercase transition-all"
            style={{
              fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
              fontSize: 14,
              letterSpacing: "0.18em",
              borderColor: "#1668ab",
              background: "rgba(5, 23, 48, 0.4)",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARE BUTTONS — screenshot the shipping ticket as PNG; download or copy
// ============================================================================
// Uses dynamic import of html-to-image at runtime. In preview the import fails
// gracefully and the user is told to take a manual screenshot. In production
// (npm install html-to-image) it just works.

async function captureTicketAsPng(elementId) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Ticket element not found");
  let toPng;
  try {
    const mod = await import("html-to-image");
    toPng = mod.toPng;
  } catch (e) {
    throw new Error("Share requires production build. Screenshot manually for now.");
  }
  return toPng(el, {
    pixelRatio: 2,
    backgroundColor: "#fafaf9",
  });
}

function ShareButtons({ ticketElementId }) {
  const [status, setStatus] = useState(null);

  const handleDownload = async () => {
    try {
      setStatus("working");
      const dataUrl = await captureTicketAsPng(ticketElementId);
      const link = document.createElement("a");
      link.download = `steel-stacker-ticket-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("downloaded");
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus(e.message || "Could not download");
      setTimeout(() => setStatus(null), 3500);
    }
  };

  const handleCopy = async () => {
    try {
      setStatus("working");
      const dataUrl = await captureTicketAsPng(ticketElementId);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus("copied");
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus(e.message || "Could not copy");
      setTimeout(() => setStatus(null), 3500);
    }
  };

  const btnStyle = {
    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
    fontSize: 13,
    letterSpacing: "0.22em",
    borderColor: "#1668ab",
    background: "rgba(5, 23, 48, 0.4)",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "working"}
          className="flex-1 border text-slate-200 hover:text-amber-500 hover:border-amber-500 py-2 px-3 uppercase transition-all"
          style={btnStyle}
        >
          ⬇ Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={status === "working"}
          className="flex-1 border text-slate-200 hover:text-amber-500 hover:border-amber-500 py-2 px-3 uppercase transition-all"
          style={btnStyle}
        >
          ⎘ Copy to Clipboard
        </button>
      </div>
      {status && status !== "working" && (
        <div
          className="text-center uppercase tracking-[0.22em]"
          style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11, color: "#7eb0d6" }}
        >
          {status === "copied" && "✓ Copied. Paste into LinkedIn."}
          {status === "downloaded" && "✓ Downloaded"}
          {status !== "copied" && status !== "downloaded" && (
            <span className="text-amber-500">{status}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function SteelStackerGame() {
  const [screen, setScreen] = useState("title");
  const [grid, setGrid] = useState(emptyGrid);
  const [bag, setBag] = useState(() => makeBag());
  const [piece, setPiece] = useState(null);
  const [next, setNext] = useState(null);
  // All weight state stored in pounds (single source of truth). Tons derived
  // for display only — see TRUCK_CAPACITY_LB and the .toFixed(1) display sites.
  const [poundsLoaded, setPoundsLoaded] = useState(0);
  const [currentTruckPounds, setCurrentTruckPounds] = useState(0);
  const [trucksShipped, setTrucksShipped] = useState(0);
  const [courses, setCourses] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [bestPounds, setBestPounds] = useState(0);
  const [flash, setFlash] = useState(0);
  const [shipping, setShipping] = useState(false);
  // dispatchPhase drives the truck-leaving + new-trailer-arriving animation.
  //   null      = no dispatch in progress
  //   "leaving" = loaded truck driving off to the right (0–2.5s)
  //   "arriving" = empty rig driving in from the left (2.5–5s)
  // While non-null, gameplay is paused (no piece spawns, no game loop ticks).
  const [dispatchPhase, setDispatchPhase] = useState(null);
  const [dispatchSkipped, setDispatchSkipped] = useState(false);
  const [hooked, setHooked] = useState(true);
  // When a truck fills, show a brief "DISPATCHED" stamp banner. Holds the truck
  // number and weight at the moment of dispatch so the banner reads correctly
  // even if state updates haven't all flushed.
  const [shipBanner, setShipBanner] = useState(null);
  // Per-shape piece counts for the shipping ticket. Object maps shape key → count.
  // Aggregated by designation at render time (mirrored L_R/L_L collapse to one row).
  const [pieceCounts, setPieceCounts] = useState({});
  // When the run started — used to put a date/time stamp on the shipping ticket.
  const [runStartedAt, setRunStartedAt] = useState(null);
  // Stable ticket number per run so re-renders don't reshuffle it.
  const [ticketNumber, setTicketNumber] = useState(null);
  // Leaderboard state. Entries load on game-over. submittedEntryId holds the
  // ID of the player's just-submitted entry so we can highlight it in the
  // leaderboard. showSubmitForm controls visibility of the submit UI.
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [submittedEntryId, setSubmittedEntryId] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Responsive cell size — drives the playfield, crane, and trailer dimensions.
  // 24px on phones, 28px on desktop. Re-evaluated on viewport changes (rotation, resize).
  // Initialized lazily so it gets the right value on the first render in the browser
  // (and falls back to desktop if window is undefined, e.g. during SSR).
  const [cellSize, setCellSize] = useState(() => {
    if (typeof window === "undefined") return CELL_DESKTOP;
    return window.innerWidth < MOBILE_BREAKPOINT ? CELL_MOBILE : CELL_DESKTOP;
  });
  useEffect(() => {
    const update = () => {
      setCellSize(
        window.innerWidth < MOBILE_BREAKPOINT ? CELL_MOBILE : CELL_DESKTOP,
      );
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pieceRef = useRef(piece);
  const gridRef = useRef(grid);
  const bagRef = useRef(bag);
  const nextRef = useRef(next);
  const pausedRef = useRef(paused);
  const screenRef = useRef(screen);
  const shippingRef = useRef(shipping);
  // Mirrors dispatchPhase for use inside the keyboard handler & game loop —
  // gameplay pauses any time we're mid-dispatch.
  const dispatchPhaseRef = useRef(dispatchPhase);
  // Ref-tracked truck capacity counter — used in lockPiece to detect dispatch
  // synchronously without depending on React batching/setter-callback timing.
  // Always kept in sync with currentTruckPounds state.
  const currentTruckPoundsRef = useRef(0);

  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { bagRef.current = bag; }, [bag]);
  useEffect(() => { nextRef.current = next; }, [next]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { shippingRef.current = shipping; }, [shipping]);
  useEffect(() => { dispatchPhaseRef.current = dispatchPhase; }, [dispatchPhase]);

  const drawFromBag = useCallback(() => {
    let b = [...bagRef.current];
    if (b.length === 0) b = makeBag();
    const key = b.shift();
    if (b.length === 0) b = makeBag();
    setBag(b);
    return key;
  }, []);

  const spawnNext = useCallback(() => {
    const currentKey = nextRef.current || drawFromBag();
    const newPiece = spawnPiece(currentKey);
    const upcoming = drawFromBag();
    if (collides(gridRef.current, newPiece)) {
      setScreen("gameover");
      setBestPounds((b) => Math.max(b, poundsLoaded));
      return;
    }
    setPiece(newPiece);
    setNext(upcoming);
    setHooked(true);
  }, [drawFromBag, poundsLoaded]);

  const move = useCallback((dx, dy) => {
    const p = pieceRef.current;
    if (!p) return false;
    if (!collides(gridRef.current, p, dx, dy)) {
      setPiece({ ...p, x: p.x + dx, y: p.y + dy });
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    const rotated = rotateMatrix(p.matrix);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(gridRef.current, p, kick, 0, rotated)) {
        setPiece({ ...p, matrix: rotated, x: p.x + kick });
        return;
      }
    }
  }, []);

  // Refs hold pending dispatch timeout IDs so the skip button can clear them.
  // Without this, a skip mid-animation would leave a stale timer that fires later
  // and incorrectly resets the dispatch state while gameplay is back to normal.
  const dispatchTimers = useRef([]);

  // Tracks whether ArrowDown is "armed" for soft-drop. When a piece locks, this
  // disarms — so if the player was holding ArrowDown to slam down a piece, the
  // next piece doesn't immediately start soft-dropping from the OS key auto-repeat
  // still firing keydown events. The player must release ArrowDown (keyup re-arms)
  // and re-press to soft-drop the next piece. Starts armed so the very first
  // press works.
  const softDropArmedRef = useRef(true);

  // Kick off the 5-second dispatch sequence: loaded rig leaves, empty rig arrives.
  // Phase changes drive the animation via DispatchAnimation. Gameplay is paused
  // throughout (the game loop and piece spawner check dispatchPhaseRef).
  // NOTE: declared BEFORE lockPiece because lockPiece references it. Same for
  // skipDispatch — keep declaration order > caller order to avoid TDZ errors.
  const startDispatchSequence = useCallback(() => {
    setDispatchSkipped(false);
    setDispatchPhase("leaving");
    setShipping(true); // legacy flag still gates spawnNext
    // After 2.5s, switch to "arriving" — empty rig slides in
    const t1 = setTimeout(() => {
      setDispatchPhase("arriving");
    }, 2500);
    // After another 2.5s, dispatch is complete — spawn the next piece and resume
    const t2 = setTimeout(() => {
      setDispatchPhase(null);
      setShipping(false);
      setDispatchSkipped(false);
      dispatchTimers.current = [];
      spawnNext();
    }, 5000);
    dispatchTimers.current = [t1, t2];
  }, [spawnNext]);

  // Skip handler — instantly completes the dispatch and resumes gameplay.
  // Cancels any pending phase-transition timers so they don't fire later.
  const skipDispatch = useCallback(() => {
    dispatchTimers.current.forEach((id) => clearTimeout(id));
    dispatchTimers.current = [];
    setDispatchSkipped(true);
    setDispatchPhase(null);
    setShipping(false);
    spawnNext();
  }, [spawnNext]);

  const lockPiece = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    setHooked(false);
    // Disarm soft-drop: next piece won't auto-drop just because the player is
    // still holding ArrowDown from slamming the previous piece. Player must
    // release and re-press ArrowDown to soft-drop the next piece. Re-arm
    // happens on keyup in the key handler below.
    softDropArmedRef.current = false;

    const addedPounds = piecePounds(p.key);
    // Track the piece for the shipping ticket
    setPieceCounts((counts) => ({
      ...counts,
      [p.key]: (counts[p.key] || 0) + 1,
    }));
    const merged = mergePiece(gridRef.current, p);
    const { grid: cleared, cleared: clearedCount } = clearLines(merged);
    setGrid(cleared);

    // Pounds added to lifetime/truck totals are exactly the piece's pounds —
    // no course-clear bonus. This guarantees lifetime tonnage matches the
    // shipping ticket grand total, since the ticket aggregates piece counts ×
    // per-piece weight. Field-clearing is its own reward (frees up the deck).
    setPoundsLoaded((pp) => pp + addedPounds);

    // Compute the new truck total synchronously from a ref-tracked value rather
    // than the setter callback. This avoids React-batching timing ambiguity:
    // we need to know NOW whether this piece triggered a dispatch, before the
    // spawn check below. currentTruckPoundsRef is updated alongside the state.
    const newTruckTotal = currentTruckPoundsRef.current + addedPounds;
    let triggeredDispatch = false;
    if (newTruckTotal >= TRUCK_CAPACITY_LB) {
      triggeredDispatch = true;
      currentTruckPoundsRef.current = 0;
      setCurrentTruckPounds(0);
      setTrucksShipped((n) => {
        const newN = n + 1;
        setShipBanner({ truckNum: newN, pounds: newTruckTotal });
        setTimeout(() => setShipBanner(null), 1000);
        return newN;
      });
      startDispatchSequence();
    } else {
      currentTruckPoundsRef.current = newTruckTotal;
      setCurrentTruckPounds(newTruckTotal);
    }

    if (clearedCount > 0) {
      setCourses((c) => {
        const updated = c + clearedCount;
        setLevel(Math.floor(updated / 10) + 1);
        return updated;
      });
      setFlash(clearedCount);
      setTimeout(() => setFlash(0), 250);
    }

    // Defer the next piece spawn until dispatch completes if a truck shipped.
    // Otherwise spawn immediately so play continues uninterrupted.
    if (!triggeredDispatch) {
      spawnNext();
    }
  }, [spawnNext, startDispatchSequence]);

  const softDrop = useCallback(() => {
    if (!move(0, 1)) lockPiece();
  }, [move, lockPiece]);

  const hardDrop = useCallback(() => {
    const p = pieceRef.current;
    if (!p) return;
    let dy = 0;
    while (!collides(gridRef.current, p, 0, dy + 1)) dy++;
    // Build the dropped piece and update both state AND ref synchronously
    // so lockPiece (which reads from pieceRef.current) sees the new position.
    // The previous setTimeout pattern relied on React flushing the state update
    // before the timeout fired, but the ref only updates via useEffect after
    // render — so lockPiece was reading the old (pre-drop) piece position.
    const dropped = { ...p, y: p.y + dy };
    setPiece(dropped);
    pieceRef.current = dropped;
    lockPiece();
  }, [lockPiece]);

  useEffect(() => {
    if (screen !== "playing" || paused || shipping) return;
    const interval = setInterval(() => {
      if (!move(0, 1)) lockPiece();
    }, speedFor(level));
    return () => clearInterval(interval);
  }, [screen, paused, level, move, lockPiece, shipping]);

  useEffect(() => {
    const handler = (e) => {
      if (screenRef.current === "title") {
        if (e.key === "Enter" || e.key === " ") startGame();
        return;
      }
      if (screenRef.current === "gameover") {
        if (e.key === "r" || e.key === "R" || e.key === "Enter") startGame();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        setPaused((p) => !p);
        return;
      }
      if (pausedRef.current || shippingRef.current) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault(); move(-1, 0); break;
        case "ArrowRight":
          e.preventDefault(); move(1, 0); break;
        case "ArrowDown":
          e.preventDefault();
          // A fresh press (not OS auto-repeat) always works and re-arms.
          // Auto-repeat events are gated by armed: holding through a piece
          // lock disarms, so the next piece doesn't auto-soft-drop. Player
          // must release and re-press to soft-drop the next piece.
          if (!e.repeat) {
            softDropArmedRef.current = true;
            softDrop();
          } else if (softDropArmedRef.current) {
            softDrop();
          }
          break;
        case "ArrowUp":
        case "x":
        case "X":
          e.preventDefault(); tryRotate(); break;
        case " ":
          e.preventDefault(); hardDrop(); break;
        default: break;
      }
    };
    // Re-arm soft drop on ArrowDown release. Lives in its own handler so
    // keyup doesn't interfere with the keydown switch above.
    const upHandler = (e) => {
      if (e.key === "ArrowDown") softDropArmedRef.current = true;
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", upHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = () => {
    const fresh = makeBag();
    bagRef.current = fresh;
    setBag(fresh);
    setGrid(emptyGrid());
    setPoundsLoaded(0);
    setCurrentTruckPounds(0);
    currentTruckPoundsRef.current = 0;
    setTrucksShipped(0);
    setCourses(0);
    setLevel(1);
    setPaused(false);
    setShipping(false);
    setShipBanner(null);
    setDispatchPhase(null);
    setDispatchSkipped(false);
    dispatchTimers.current.forEach((id) => clearTimeout(id));
    dispatchTimers.current = [];
    // Re-arm soft drop in case the player started a new run while still
    // holding ArrowDown from the previous game-over screen.
    softDropArmedRef.current = true;
    setHooked(true);
    setPieceCounts({});
    setRunStartedAt(new Date());
    // Random 6-digit ticket number — stable for the run since it goes into state
    setTicketNumber(Math.floor(100000 + Math.random() * 900000));
    // Reset leaderboard UI state so a new run doesn't show old submission status
    setSubmittedEntryId(null);
    setShowSubmitForm(false);
    setLeaderboardEntries([]);
    setNext(null);
    setPiece(null);
    setScreen("playing");
    setTimeout(() => spawnNext(), 0);
    // After game-over the page has grown long (shipping ticket, leaderboard,
    // footer). On restart the playfield would otherwise be above the viewport
    // and the page would be scrolled to the leaderboard. Reset to top so the
    // playfield is in view and arrow keys land on gameplay, not page scroll.
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  // Load leaderboard entries when the game ends. Re-fetched after a successful
  // submission (submittedEntryId in deps) so the player's entry appears with
  // the highlight without a page refresh.
  useEffect(() => {
    if (screen !== "gameover") return;
    let cancelled = false;
    leaderboardStorage.getTop(100).then((entries) => {
      if (!cancelled) setLeaderboardEntries(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [screen, submittedEntryId]);

  const gY = piece ? ghostY(grid, piece) : 0;
  const trolleyX = pieceCenterX(piece, cellSize);
  const cableY = pieceTopY(piece, cellSize);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4"
      style={{
        background:
          "radial-gradient(900px 500px at 50% -160px, rgba(47,131,196,0.16), transparent 70%), linear-gradient(180deg, #032c50 0%, #021530 35%, #010d22 70%, #010715 100%)",
        fontFamily: "'Aleo', Georgia, serif",
      }}
    >
      {/* Banner pop animation — scale + fade on the wrapper.
          Rotation lives on the inner card so the two don't conflict. */}
      <style>{`
        @keyframes shipBannerPulse {
          0% { opacity: 0; transform: scale(0.6); }
          15% { opacity: 1; transform: scale(1.05); }
          25% { transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        @keyframes dispatchDimFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dispatchSkipFade {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(126,176,214,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(126,176,214,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {flash > 0 && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity"
          style={{
            background: flash === 4 ? "rgba(245, 158, 11, 0.25)" : "rgba(126, 176, 214, 0.16)",
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-6xl">
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {/* STEEL STACKER wordmark — Bebas Neue, the SSE display face.
                  Two words; amber accent on "STACKER" mirrors the previous "BED" treatment. */}
              <div
                className="text-4xl sm:text-6xl tracking-[0.04em] text-slate-100 leading-none whitespace-nowrap"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif" }}
              >
                STEEL <span className="text-amber-500">STACKER</span>
              </div>
              <div
                className="text-[10px] sm:text-xs text-sky-200/60 tracking-[0.22em] uppercase mt-1 whitespace-nowrap"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}
              >
                Stack the Steel · Ship the Truck
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
              {/* PRESENTED BY eyebrow. Bebas, small, SSE blue. */}
              <div
                className="tracking-[0.22em] uppercase whitespace-nowrap"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  color: "#7eb0d6",
                  fontSize: 11,
                }}
              >
                Presented by
              </div>
              {/* Real SSE logo, white knockout. Replaces the prior text-SSE monogram
                  + 'SOUTHERN STEEL ENGINEERS' block (logo carries the full mark). */}
              <a
                href="https://www.southernsteelengineers.com"
                target="_blank"
                rel="noreferrer"
                className="block"
                aria-label="Southern Steel Engineers"
              >
                <img
                  src={SSE_LOGO_DATA_URL}
                  alt="Southern Steel Engineers"
                  className="block h-9 sm:h-11 w-auto"
                  style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.4))" }}
                />
              </a>
            </div>
          </div>
          {/* Industrial hazard stripe under the header — ties to the crane gantry */}
          <div className="mt-4 h-1 w-full" style={{
            background:
              "repeating-linear-gradient(90deg, #f59e0b 0 12px, #021530 12px 18px)",
          }} />
        </header>

        {/* TITLE — feature wall of cross-sections, magazine layout */}
        {screen === "title" && (
          <div className="border-2 border-slate-700 backdrop-blur p-6 sm:p-10" style={{ background: "rgba(6, 35, 74, 0.7)" }}>
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2">
                <div
                  className="tracking-[0.3em] uppercase mb-3"
                  style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 13, color: "#7eb0d6" }}
                >
                  Crane-Operator Sim · Steel Hauling
                </div>
                <h2
                  className="font-black text-slate-100 mb-4 leading-tight"
                  style={{
                    fontFamily: "'Aleo', Georgia, serif",
                    fontSize: "clamp(36px, 5vw, 56px)",
                    textWrap: "balance",
                  }}
                >
                  You're picking the next load.
                </h2>
                <p className="text-slate-400 mb-4 leading-relaxed text-base sm:text-[17px]">
                  Wide flange, channel, plate, angle, hollow section, tee, even
                  a keg of bolts or a bucket of shims when the gaps get tight. The crane drops them
                  one at a time. Slide them across the trailer, rotate them to
                  fit, and pack each course tight. Hit {TRUCK_CAPACITY_TONS} tons and the rig rolls out.
                </p>
                <p className="text-slate-500 text-sm sm:text-base mb-6 italic" style={{ fontFamily: "'Aleo', Georgia, serif" }}>
                  Pile too high and the load shifts. That's the whistle.
                </p>
                <div className="hidden md:block space-y-1 text-xs text-slate-500 mb-6">
                  <div>
                    <span className="text-amber-500 font-bold">←  →</span> Slide ·{" "}
                    <span className="text-amber-500 font-bold">↑</span> Rotate
                  </div>
                  <div>
                    <span className="text-amber-500 font-bold">↓</span> Lower ·{" "}
                    <span className="text-amber-500 font-bold">SPACE</span> Quick release
                  </div>
                  <div>
                    <span className="text-amber-500 font-bold">P</span> Pause crane ·{" "}
                    <span className="text-amber-500 font-bold">R</span> New rig
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 uppercase px-10 py-5 transition-all whitespace-nowrap"
                  style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 26, letterSpacing: "0.18em" }}
                >
                  Hook the Crane →
                </button>
              </div>
              <div className="md:col-span-3">
                <div
                  className="text-slate-400 tracking-[0.22em] uppercase mb-3"
                  style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 13 }}
                >
                  Steel Manifest · Today's Inventory
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 border border-slate-700 bg-slate-950/60">
                  {/* Order: heaviest structurals first, angles grouped by size, then channels and hardware.
                      Card sizing matches designer's magazine-grid feel: large cross-section
                      centered in a dark inset, AISC designation in colored Aleo serif, description
                      and length below in small-caps slate, weight in JetBrains Mono SSE blue. */}
                  {["WF", "WF_S", "HSS", "HSS_R", "PL", "WT", "L_R", "L_L", "L3_R", "L3_L", "C_R", "C_L", "BOLT", "SHIM"].map((k) => {
                    const s = SHAPES[k];
                    return (
                      <div
                        key={k}
                        className="border border-slate-800 bg-slate-900/40 p-3 sm:p-4 flex flex-col"
                      >
                        {/* Cross-section in a dark inset — the visual hero of the card.
                            Per design spec: 140px tall. The section itself sized to fill. */}
                        <div
                          className="flex items-center justify-center border border-slate-800 bg-slate-950/70 mb-3"
                          style={{ height: 140 }}
                        >
                          <SteelSection shapeKey={k} height={140} />
                        </div>
                        {/* AISC designation in piece color, Aleo serif, 20px — primary content of the card */}
                        <div
                          className="font-black tracking-wider"
                          style={{ color: s.color, fontFamily: "'Aleo', Georgia, serif", fontSize: 18 }}
                        >
                          {s.designation}
                        </div>
                        {/* Description + length in muted SSE blue, small caps */}
                        <div
                          className="text-[10px] uppercase tracking-[0.18em] mt-0.5 leading-snug"
                          style={{ color: "#4d7aa8" }}
                        >
                          {s.longName}{s.lengthFt && ` · ${s.lengthFt}'`}
                        </div>
                        {/* Weight, JetBrains Mono SSE blue — data not score */}
                        <div
                          className="text-[11px] font-bold mt-1.5 tabular-nums tracking-wider"
                          style={{ color: "#7eb0d6", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                        >
                          {s.pounds.toLocaleString()} LB
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GAME */}
        {(screen === "playing" || screen === "gameover") && (
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
            <div className="hidden md:flex flex-col gap-3 w-56">
              <StatBlock big label="Tons Loaded" value={(poundsLoaded / 2000).toFixed(1)} accent sub="lifetime" />
              <StatBlock big label="Trucks Shipped" value={trucksShipped} sub="dispatched" />
              <StatBlock big label="Courses" value={courses} />
              <StatBlock big label="Speed" value={`L${level}`} />
              <StatBlock
                big
                label="Yard Record"
                value={(Math.max(bestPounds, poundsLoaded) / 2000).toFixed(1)}
                sub="best haul"
              />
            </div>

            <div className="flex flex-col items-center">
              {/* Mobile top section — compact: stats on left, Next preview on right.
                  Replaces the old separate stat strip + load gauge + wrapping right rail.
                  Saves ~80px of vertical space so DROP button stays in viewport. */}
              <div className="md:hidden flex gap-2 w-full mb-2" style={{ maxWidth: COLS * cellSize }}>
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  <StatBlock label="Tons" value={(poundsLoaded / 2000).toFixed(1)} accent />
                  <StatBlock label="Trucks" value={trucksShipped} />
                  <StatBlock label="Speed" value={`L${level}`} />
                </div>
                {/* Tiny Next-piece card — just the cross-section, no labels.
                    Visible signal of what's coming without eating a full row. */}
                <div className="border border-slate-700 bg-slate-900/60 px-2 py-1 flex flex-col items-center justify-center" style={{ minWidth: 56 }}>
                  <div
                    className="uppercase mb-1"
                    style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 10, letterSpacing: "0.10em", color: "#7eb0d6" }}
                  >
                    Next
                  </div>
                  <div className="flex items-center justify-center" style={{ height: 32 }}>
                    {next && <SteelSection shapeKey={next} height={32} />}
                  </div>
                </div>
              </div>

              {/* Slim load gauge — single line, doesn't need its own card */}
              <div className="md:hidden w-full mb-3" style={{ maxWidth: COLS * cellSize }}>
                <LoadGauge tons={currentTruckPounds / 2000} capacity={TRUCK_CAPACITY_TONS} />
              </div>

              <div className="flex flex-col items-center relative">
                <CraneGantry
                  trolleyX={trolleyX}
                  cableY={cableY}
                  hooked={hooked && !!piece}
                  cell={cellSize}
                />
                {/* Playfield + dim/blur overlay while a dispatch is in progress.
                    The overlay sits above the field but below the truck animation
                    so attention shifts to the rolling truck.  */}
                <div className="relative">
                  <Playfield
                    grid={grid}
                    piece={piece}
                    gY={gY}
                    paused={paused}
                    gameOver={screen === "gameover"}
                    cell={cellSize}
                    onMove={move}
                    onRotate={tryRotate}
                    onHardDrop={hardDrop}
                  />
                  {dispatchPhase && (
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: "rgba(2,18,40,0.65)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        animation: "dispatchDimFade 300ms ease-out",
                      }}
                    />
                  )}
                </div>
                {/* Trailer slot. During gameplay shows the static load deck.
                    During a dispatch, hide the static trailer and let the
                    DispatchAnimation render the moving rigs in its place.
                    Width matches the crane gantry above (fieldWidth + 60).
                    The flex parent centers it horizontally over the playfield. */}
                <div
                  className="overflow-hidden relative"
                  style={{ width: COLS * cellSize + 60, height: 50 }}
                >
                  {!dispatchPhase && <Trailer cell={cellSize} />}
                  {dispatchPhase && (
                    <DispatchAnimation
                      phase={dispatchPhase}
                      cell={cellSize}
                      skipped={dispatchSkipped}
                    />
                  )}
                </div>
                <div
                  className="border-t border-slate-700 mt-1"
                  style={{ width: COLS * cellSize + 60, opacity: 0.5 }}
                />

                {/* Skip button — sits over the dimmed playfield while a dispatch
                    runs, so the player can bail out fast if they want.
                    Pointer-events enabled here even though the dim layer above
                    is set to none. */}
                {dispatchPhase && (
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      skipDispatch();
                    }}
                    className="absolute z-30 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black tracking-[0.2em] uppercase px-4 py-2 text-xs sm:text-sm border-2 border-slate-950 shadow-2xl"
                    style={{
                      top: "30%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                      touchAction: "manipulation",
                      animation: "dispatchSkipFade 300ms ease-out",
                    }}
                  >
                    Skip ▶
                  </button>
                )}

                {/* Truck-dispatched banner — fades in over the playfield, holds for ~1s, fades out */}
                {shipBanner && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    style={{ animation: "shipBannerPulse 1.4s ease-out forwards" }}
                  >
                    <div
                      className="bg-amber-500 text-slate-950 px-5 py-3 sm:px-7 sm:py-4 border-2 border-slate-950 shadow-2xl"
                      style={{
                        fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                        transform: "rotate(-4deg)",
                      }}
                    >
                      <div
                        className="tracking-[0.3em] opacity-80 uppercase"
                        style={{ fontSize: 11 }}
                      >
                        Truck #{shipBanner.truckNum}
                      </div>
                      <div
                        className="tracking-[0.10em] uppercase leading-none"
                        style={{ fontSize: 38 }}
                      >
                        Dispatched
                      </div>
                      <div
                        className="opacity-80 mt-1 tabular-nums"
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {Math.round(shipBanner.pounds).toLocaleString()} LB OUT
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:hidden mt-3 text-center tracking-[0.18em] text-slate-400 uppercase" style={{ maxWidth: COLS * cellSize, fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 11 }}>
                Tap = rotate · Swipe ←→ = move · Swipe ↓ = drop
              </div>

              {/* Single row of 5 buttons. DROP is the primary action button —
                  release the piece from the crane immediately. Soft-drop removed
                  since the ghost preview already shows where the piece will land. */}
              <div className="md:hidden grid grid-cols-6 gap-2 w-full mt-2" style={{ maxWidth: COLS * cellSize }}>
                <TouchButton ariaLabel="Slide left" onClick={() => move(-1, 0)}>←</TouchButton>
                <TouchButton ariaLabel="Rotate" onClick={tryRotate}>⟳</TouchButton>
                <TouchButton ariaLabel="Slide right" onClick={() => move(1, 0)}>→</TouchButton>
                <div className="col-span-2">
                  <TouchButton ariaLabel="Drop" onClick={hardDrop} primary>▼ DROP</TouchButton>
                </div>
                <TouchButton ariaLabel="Pause" onClick={() => setPaused((p) => !p)}>{paused ? "▶" : "❚❚"}</TouchButton>
              </div>
            </div>

            <div className="flex md:flex-col gap-3 w-full md:w-56 flex-wrap">
              {/* Next preview shown at top of mobile layout instead — hide here on small screens */}
              <div className="hidden md:block border border-slate-700 bg-slate-900/60 p-4 flex-1 md:flex-none">
                <PiecePreview shapeKey={next} label="Next on the Hook" sectionHeight={90} />
              </div>

              <div className="hidden md:block">
                <LoadGauge tons={currentTruckPounds / 2000} capacity={TRUCK_CAPACITY_TONS} />
              </div>

              <div className="hidden md:flex flex-col gap-2">
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="py-3 px-4 tracking-[0.18em] uppercase transition-all"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 15,
                    background: "#0a3b73",
                    border: "1px solid #1668ab",
                    color: "#cfe0ee",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#0e4a8e";
                    e.currentTarget.style.borderColor = "#f59e0b";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#0a3b73";
                    e.currentTarget.style.borderColor = "#1668ab";
                  }}
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => {
                    setBestPounds((b) => Math.max(b, poundsLoaded));
                    setScreen("title");
                  }}
                  className="py-3 px-4 tracking-[0.18em] uppercase transition-all"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 15,
                    background: "#0a3b73",
                    border: "1px solid #1668ab",
                    color: "#cfe0ee",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#0e4a8e";
                    e.currentTarget.style.borderColor = "#f59e0b";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#0a3b73";
                    e.currentTarget.style.borderColor = "#1668ab";
                  }}
                >
                  End Shift
                </button>
              </div>

              {screen === "gameover" && (
                <button
                  onClick={() => {
                    document
                      .getElementById("shipping-ticket")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="tracking-[0.14em] uppercase py-3 px-6 transition-all w-full"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 20,
                    background: "#1668ab",
                    color: "#ffffff",
                    border: "1px solid #2f83c4",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#2f83c4'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#1668ab'; }}
                >
                  View Ticket <span style={{ color: '#f59e0b' }}>↓</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game over content: ticket, share, submit form, leaderboard.
            Sequence reads top-to-bottom: cargo manifest first, then share
            (so people grab the screenshot before they forget), then submit
            CTA, then leaderboard for community context. */}
        {screen === "gameover" && (
          <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
            <div id="shipping-ticket">
              <ShippingTicket
                pieceCounts={pieceCounts}
                trucksShipped={trucksShipped}
                poundsLoaded={poundsLoaded}
                courses={courses}
                startedAt={runStartedAt}
                ticketNumber={ticketNumber}
                onDispatch={startGame}
                // Once the player submits to the leaderboard, retroactively
                // stamp their name onto the ticket — driver signature line
                // shows it in Aleo italic (signature feel) and the meta
                // strip Driver: field shows it in caps. Falls back to the
                // generic "CRANE OPERATOR" placeholder if not yet submitted.
                operatorName={
                  submittedEntryId
                    ? leaderboardEntries.find((e) => e.id === submittedEntryId)?.name || null
                    : null
                }
              />
            </div>

            {/* Share buttons — sit right under the ticket so the screenshot
                flow is obvious. Download saves PNG, copy puts it on clipboard. */}
            <div className="max-w-2xl mx-auto">
              <div
                className="uppercase mb-2 text-center tracking-[0.22em]"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontSize: 12, color: "#7eb0d6" }}
              >
                Share Your Haul
              </div>
              <ShareButtons ticketElementId="shipping-ticket" />
            </div>

            {/* Submit form — shown when player taps "Submit to Leaderboard",
                hidden otherwise. Keeps game-over flow uncluttered for people
                who don't care about the leaderboard. */}
            <div className="max-w-2xl mx-auto">
              {!showSubmitForm && !submittedEntryId && (
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(true)}
                  className="w-full transition-all py-3 px-4 uppercase whitespace-nowrap"
                  style={{
                    fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                    fontSize: 18,
                    letterSpacing: "0.14em",
                    background: "#1668ab",
                    color: "#ffffff",
                    border: "1px solid #2f83c4",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#2f83c4'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#1668ab'; }}
                >
                  Submit to Leaderboard <span style={{ color: '#f59e0b' }}>→</span>
                </button>
              )}
              {showSubmitForm && !submittedEntryId && (
                <LeaderboardSubmitForm
                  poundsLoaded={poundsLoaded}
                  trucksShipped={trucksShipped}
                  coursesCleared={courses}
                  gameDurationS={
                    runStartedAt
                      ? Math.floor((Date.now() - runStartedAt.getTime()) / 1000)
                      : 0
                  }
                  onSubmitted={(result) => {
                    // Delay clearing the form so the "Logged" confirmation
                    // inside the form is visible briefly before the leaderboard
                    // takes over.
                    setTimeout(() => {
                      setSubmittedEntryId(result.id);
                      setShowSubmitForm(false);
                    }, 1400);
                  }}
                  onCancel={() => setShowSubmitForm(false)}
                />
              )}
            </div>

            {/* Leaderboard — always shown on game over so visitors see the
                community competition even if they don't submit. */}
            <div className="max-w-2xl mx-auto">
              <Leaderboard
                entries={leaderboardEntries}
                highlightId={submittedEntryId}
              />
            </div>
          </div>
        )}

        <footer className="mt-8">
          {/* Hazard stripe — amber dashes on the page background */}
          <div className="h-1 w-full mb-4" style={{
            background:
              "repeating-linear-gradient(90deg, #f59e0b 0 12px, #021530 12px 18px)",
          }} />

          {/* Row 1 — brand thesis tagline */}
          <div
            className="text-center sm:text-left uppercase tracking-[0.22em] mb-2"
            style={{
              fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
              fontSize: 14,
              color: "#cfe0ee",
            }}
          >
            Structural Engineering for the <b style={{ color: "#f4a836", fontWeight: 400 }}>Steel Industry</b>
          </div>

          {/* Row 2 — audience callout. "Delegated steel design" emphasized. */}
          <p
            className="text-center sm:text-left mb-3"
            style={{
              fontFamily: "'Aleo', Georgia, serif",
              fontSize: 13,
              fontStyle: "italic",
              color: "#7eb0d6",
              lineHeight: 1.5,
              margin: "0 0 12px",
            }}
          >
            <b style={{ color: "#cfe0ee", fontStyle: "normal", fontWeight: 700 }}>Delegated steel design</b>{" "}
            for fabricators, detailers, and erectors nationwide.
          </p>

          {/* Row 3 — facts (left) + links stacked (right). LinkedIn on top of website
              so on narrow mobile widths the column fits cleanly without horizontal squeeze. */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div
              className="text-center sm:text-left uppercase tracking-[0.18em]"
              style={{
                fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                fontSize: 11,
                color: "#7eb0d6",
              }}
            >
              <span style={{ color: "#cfe0ee" }}>46</span> States
              {" · "}
              Lexington, SC
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1">
              <a
                href="https://www.linkedin.com/company/southernsteelengineers/"
                target="_blank"
                rel="noreferrer"
                className="uppercase tracking-[0.18em] hover:text-amber-500 transition-colors"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  fontSize: 11,
                  color: "#7eb0d6",
                  textDecoration: "none",
                }}
              >
                linkedin →
              </a>
              <a
                href="https://www.southernsteelengineers.com"
                target="_blank"
                rel="noreferrer"
                className="uppercase tracking-[0.18em] hover:text-amber-500 transition-colors"
                style={{
                  fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                  fontSize: 11,
                  color: "#7eb0d6",
                  textDecoration: "none",
                }}
              >
                southernsteelengineers.com →
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
