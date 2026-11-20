/**
 * Schematic floor plan used ONLY as a labeled placeholder until real drawings are uploaded.
 * Deterministic per seed so each project shows a different, plausible-looking layout.
 */
const W = 800, H = 520, m = 60

/** Pure, seeded wall positions (LCG). */
function planLayout(seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const r = (min: number, max: number) => {
    h = (h * 1664525 + 1013904223) >>> 0
    return min + ((h % 1000) / 1000) * (max - min)
  }
  return { x1: Math.round(r(260, 380)), x2: Math.round(r(500, 600)), y1: Math.round(r(220, 300)) }
}

export function PlanDrawing({ seed, className = '' }: { seed: string; className?: string }) {
  const { x1, x2, y1 } = planLayout(seed)
  const labels = [
    { x: (m + x1) / 2, y: (m + y1) / 2, t: 'ΚΑΘΙΣΤΙΚΟ' },
    { x: (x1 + x2) / 2, y: (m + y1) / 2, t: 'ΚΟΥΖΙΝΑ' },
    { x: (x2 + W - m) / 2, y: (m + y1) / 2, t: 'ΥΠΝΟΔ.' },
    { x: (m + x1) / 2, y: (y1 + H - m) / 2, t: 'ΒΕΡΑΝΤΑ' },
    { x: (x1 + W - m) / 2, y: (y1 + H - m) / 2, t: 'ΤΡΑΠΕΖΑΡΙΑ' },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Ενδεικτικό σχηματικό σχέδιο κάτοψης">
      <g fill="none" stroke="currentColor">
        <rect x={m} y={m} width={W - 2 * m} height={H - 2 * m} strokeWidth="6" />
        <path d={`M${x1} ${m}V${y1 - 40}M${x1} ${y1 + 40}V${H - m}`} strokeWidth="3" />
        <path d={`M${x2} ${m}V${y1}`} strokeWidth="3" />
        <path d={`M${m} ${y1}H${x1 - 50}M${x1 + 50} ${y1}H${W - m}`} strokeWidth="3" />
        <path d={`M${x1 + 50} ${y1}a50 50 0 0 1-50 50`} strokeWidth="1" strokeDasharray="4 4" />
        <path d={`M${m + 80} ${H - m}h140M${x2} ${H - m}h120`} strokeWidth="10" stroke="var(--plan-paper, #f5f2eb)" />
        <path d={`M${m + 80} ${H - m}h140M${x2} ${H - m}h120`} strokeWidth="1.5" />
        <path d={`M${m} ${m - 30}H${W - m}M${m} ${m - 38}v16M${W - m} ${m - 38}v16`} strokeWidth="1" opacity="0.6" />
      </g>
      <g fill="currentColor" fontFamily="Manrope Variable, system-ui, sans-serif" fontSize="13" letterSpacing="2.5" textAnchor="middle" opacity="0.75">
        {labels.map((l) => (
          <text key={l.t} x={l.x} y={l.y}>{l.t}</text>
        ))}
      </g>
    </svg>
  )
}
