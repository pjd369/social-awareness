import styles from './Toran.module.css'

const LIGHT = '#ffc05b'
const DEEP = '#e98b32'
const LEAF = '#6e8a53'
const LEAF_DEEP = '#3d6345'
const STRING = '#e0983a'
const SPACING = 12.5
const FLOWER_R = 4.2
const TOP_Y = 12
/** Wide canvas so one garland spans the screen as a single piece. */
const W = 1800
const H = 130

type Pt = { x: number; y: number }

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

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
  const steps = 96
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
  const last = samples[samples.length - 1]!
  if (dist(out[out.length - 1]!, last) > spacing * 0.3) out.push(last)
  else out[out.length - 1] = last
  return out
}

function pointsOnLine(x1: number, y1: number, x2: number, y2: number, spacing: number): Pt[] {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const n = Math.max(1, Math.round(len / spacing))
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }
  })
}

function StringPath({ points }: { points: Pt[] }) {
  if (points.length < 2) return null
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={STRING}
      strokeWidth="1.05"
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
      <circle r={FLOWER_R * 0.58} fill={rim} opacity="0.42" />
      <circle r={FLOWER_R * 0.26} fill={LIGHT} opacity="0.85" />
    </g>
  )
}

function MangoLeaves({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.9">
      <path d="M0 0 C-5.5 5 -7.5 13 -2 18 C1 11 2 5 0 0Z" fill={LEAF} />
      <path d="M0 0 C5.5 5 7.5 13 2 18 C-1 11 -2 5 0 0Z" fill={LEAF_DEEP} />
      <path d="M0 0 C-1 6 1 13 0 18 C1 13 -1 6 0 0Z" fill={LEAF} opacity="0.85" />
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
 * Build hanger X positions across the full width. Slightly uneven spans keep
 * the garland from reading as identical tiles; each gap gets one loose U.
 */
function buildJoints(width: number): number[] {
  const joints: number[] = [0]
  let x = 0
  // Soft alternating span lengths → natural doorway rhythm, not a stamp.
  const spans = [168, 186, 174, 192, 170, 188, 176, 190, 172, 184, 178, 186]
  let i = 0
  while (x < width - 140) {
    x += spans[i % spans.length]!
    if (x >= width - 8) break
    joints.push(x)
    i += 1
  }
  joints.push(width)
  return joints
}

/**
 * One continuous marigold toran — loose U drapes between green-leaf hangers,
 * drawn as a single garland so it doesn’t look tiled or stretched.
 */
export function Toran({ className }: { className?: string }) {
  const joints = buildJoints(W)
  const rail = pointsOnLine(0, TOP_Y, W, TOP_Y, SPACING)

  const swags: Pt[][] = []
  const swagInners: Pt[][] = []
  for (let i = 0; i < joints.length - 1; i++) {
    const x1 = joints[i]!
    const x2 = joints[i + 1]!
    const mid = (x1 + x2) / 2
    // Loose hang: deep sag, control point a little off-centre so each U feels soft.
    const bias = ((i % 3) - 1) * (x2 - x1) * 0.04
    const dip = 72 + (i % 4) * 3
    swags.push(pointsOnQuad(x1, TOP_Y, mid + bias, dip, x2, TOP_Y, SPACING))
    swagInners.push(pointsOnQuad(x1, TOP_Y + 8, mid + bias, dip + 10, x2, TOP_Y + 8, SPACING))
  }

  const hangers = joints.map((x, i) => {
    const drops = 3 + (i % 3 === 0 ? 1 : 0)
    return pointsOnLine(x, TOP_Y, x, TOP_Y + SPACING * drops, SPACING)
  })

  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
        preserveAspectRatio="xMidYMin slice"
      >
        <Strand points={rail} />
        {swags.map((pts, i) => (
          <Strand key={`swag-${i}`} points={pts} deepStart={i} />
        ))}
        {swagInners.map((pts, i) => (
          <Strand key={`inner-${i}`} points={pts} deepStart={i + 1} />
        ))}
        {hangers.map((pts, i) => (
          <Strand key={`hang-${i}`} points={pts} leaf deepStart={1} />
        ))}
      </svg>
    </div>
  )
}
