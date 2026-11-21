import styles from './Toran.module.css'

const LIGHT = 'var(--brand-marigold)'
const DEEP = 'var(--brand-marigold-deep)'
const LEAF = 'var(--brand-leaf)'
const LEAF_DEEP = 'var(--brand-leaf-deep)'
/** Thin cord the marigolds hang from. */
const STRING = '#e0983a'
/** Same centre-to-centre gap for every flower on the toran. */
const SPACING = 14
const FLOWER_R = 4.6

type Pt = { x: number; y: number }

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Sample a quadratic Bézier densely, then pick points at equal arc length. */
function pointsOnQuad(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  spacing: number,
): Pt[] {
  const samples: Pt[] = []
  const steps = 64
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    samples.push({
      x: u * u * x1 + 2 * u * t * cx + t * t * x2,
      y: u * u * y1 + 2 * u * t * cy + t * t * y2,
    })
  }

  const out: Pt[] = [samples[0]!]
  let carry = 0
  for (let i = 1; i < samples.length; i++) {
    const seg = dist(samples[i - 1]!, samples[i]!)
    carry += seg
    while (carry >= spacing) {
      const overshoot = carry - spacing
      const ratio = 1 - overshoot / seg
      const prev = samples[i - 1]!
      const next = samples[i]!
      out.push({
        x: prev.x + (next.x - prev.x) * ratio,
        y: prev.y + (next.y - prev.y) * ratio,
      })
      carry -= spacing
    }
  }

  // Always include the end joint so swags meet cleanly.
  const last = samples[samples.length - 1]!
  if (dist(out[out.length - 1]!, last) > spacing * 0.35) out.push(last)
  else out[out.length - 1] = last
  return out
}

/** Evenly spaced points on a straight segment (inclusive). */
function pointsOnLine(x1: number, y1: number, x2: number, y2: number, spacing: number): Pt[] {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const n = Math.max(1, Math.round(len / spacing))
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t })
  }
  return out
}

function StringPath({ points }: { points: Pt[] }) {
  if (points.length < 2) return null
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={STRING}
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    />
  )
}

function Marigold({ x, y, deep }: { x: number; y: number; deep?: boolean }) {
  const fill = deep ? DEEP : LIGHT
  const rim = deep ? LIGHT : DEEP
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={FLOWER_R} fill={fill} opacity="0.94" />
      <circle r={FLOWER_R * 0.58} fill={rim} opacity="0.45" />
      <circle r={FLOWER_R * 0.26} fill={LIGHT} opacity="0.85" />
    </g>
  )
}

function MangoLeaves({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.9">
      <path d="M0 0 C-6 5 -8 14 -2 19 C1 12 2 5 0 0Z" fill={LEAF} />
      <path d="M0 0 C6 5 8 14 2 19 C-1 12 -2 5 0 0Z" fill={LEAF_DEEP} />
      <path d="M0 0 C-1 7 1 14 0 20 C1 14 -1 7 0 0Z" fill={LEAF} opacity="0.85" />
    </g>
  )
}

function Strand({
  points,
  leaf,
  deepStart = 0,
}: {
  points: Pt[]
  leaf?: boolean
  deepStart?: number
}) {
  const tip = points[points.length - 1]!
  return (
    <g>
      <StringPath points={points} />
      {points.map((p, i) => (
        <Marigold key={i} x={p.x} y={p.y} deep={(i + deepStart) % 2 === 1} />
      ))}
      {leaf && <MangoLeaves x={tip.x} y={tip.y + FLOWER_R + 2} />}
    </g>
  )
}

/**
 * Festive marigold toran under the Harisumiran header — flowers hang on a thin
 * orange string with one shared spacing so the garland reads evenly.
 */
export function Toran({ className }: { className?: string }) {
  const W = 640
  const H = 118
  const topY = 12

  // Four scallops; joints land on the top rail.
  const joints = [70, 190, 320, 450, 570] as const
  const rail = pointsOnLine(18, topY, W - 18, topY, SPACING)

  const swagDefs: Array<[number, number, number, number, number, number]> = [
    [joints[0], topY, 130, 54, joints[1], topY],
    [joints[1], topY, 255, 54, joints[2], topY],
    [joints[2], topY, 385, 54, joints[3], topY],
    [joints[3], topY, 510, 54, joints[4], topY],
  ]

  const swags = swagDefs.map(([x1, y1, cx, cy, x2, y2]) =>
    pointsOnQuad(x1, y1, cx, cy, x2, y2, SPACING),
  )

  // Parallel inner cord under each swag (same spacing).
  const swagInner = swagDefs.map(([x1, y1, cx, cy, x2, y2]) =>
    pointsOnQuad(x1, y1 + 9, cx, cy + 10, x2, y2 + 9, SPACING),
  )

  const endLeft = pointsOnLine(28, topY, 28, topY + SPACING * 6, SPACING)
  const endRight = pointsOnLine(W - 28, topY, W - 28, topY + SPACING * 6, SPACING)
  const tassels = [joints[1], joints[2], joints[3]].map((x) =>
    pointsOnLine(x, topY, x, topY + SPACING * 4, SPACING),
  )

  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <Strand points={rail} />
        <Strand points={endLeft} deepStart={1} />
        <Strand points={endRight} deepStart={1} />
        {swags.map((pts, i) => (
          <Strand key={`swag-${i}`} points={pts} deepStart={i} />
        ))}
        {swagInner.map((pts, i) => (
          <Strand key={`inner-${i}`} points={pts} deepStart={i + 1} />
        ))}
        {tassels.map((pts, i) => (
          <Strand key={`tassel-${i}`} points={pts} leaf deepStart={1} />
        ))}
      </svg>
    </div>
  )
}
