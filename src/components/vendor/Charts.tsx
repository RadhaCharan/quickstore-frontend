import { useRef, useState } from 'react';

// Small, dependency-free SVG charts for the vendor dashboard — hand-rolled instead of
// pulling in a charting library, following the house rules: one axis, thin marks with
// rounded ends, recessive gridlines, a hover crosshair + tooltip, text never carries the
// series color, and (for the single-series trend charts) no legend box — the card title
// already names the one series being drawn.

const MUTED = '#9ca3af';
const GRID = '#f1f5f9';

interface TrendPoint { date: string; value: number; }

export function TrendChart({
  data, color, formatValue = (v: number) => String(v), height = 160,
}: {
  data: TrendPoint[];
  color: string;
  formatValue?: (v: number) => string;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const padL = 8, padR = 8, padT = 12, padB = 22;

  const max = Math.max(1, ...data.map(d => d.value));
  const n = Math.max(1, data.length - 1);
  const x = (i: number) => padL + (i / n) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / (max * 1.1)) * (H - padT - padB);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(H - padB).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padB).toFixed(1)} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1].map(f => H - padB - f * (H - padT - padB));

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((relX - padL) / (W - padL - padR)) * n);
    setHoverIdx(Math.min(data.length - 1, Math.max(0, idx)));
  }

  const hover = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? x(hoverIdx) : 0;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Trend chart"
      >
        {gridLines.map((gy, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={gy} y2={gy} stroke={GRID} strokeWidth={1} />
        ))}
        <path d={areaPath} fill={color} opacity={0.12} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {hover && (
          <>
            <line x1={hoverX} x2={hoverX} y1={padT} y2={H - padB} stroke={MUTED} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={hoverX} cy={y(hover.value)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
          </>
        )}
      </svg>
      {hover && (
        <div style={{
          position: 'absolute', top: 4, pointerEvents: 'none',
          left: `${Math.min(78, Math.max(0, (hoverX / W) * 100))}%`,
          background: '#111827', color: '#fff', borderRadius: 8, padding: '5px 9px',
          fontSize: 11, whiteSpace: 'nowrap', transform: 'translateX(-8%)',
        }}>
          <div style={{ opacity: 0.7 }}>{new Date(hover.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
          <div style={{ fontWeight: 700 }}>{formatValue(hover.value)}</div>
        </div>
      )}
    </div>
  );
}

export function BarList({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(it => (
        <div key={it.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{it.label}</span>
            <span style={{ color: '#6b7280' }}>{it.value}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(it.value / max) * 100}%`, background: it.color, borderRadius: 4, transition: 'width 0.2s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
