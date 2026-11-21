import styles from './Toran.module.css'

const LIGHT = '#ffc05b'
const DEEP = '#e98b32'
const LEAF = '#6e8a53'
const LEAF_DEEP = '#3d6345'
const STRING = '#e0983a'
/** Same centre-to-centre gap for every flower. */
const SPACING = 13
const FLOWER_R = 4.35
/** One U-shaped cell — tiled across the screen without stretching. */
const UNIT_W = SPACING * 10
const UNIT_H = 108
const TOP_Y = 11
/** Enough tiles to cover ultra-wide screens at the fixed unit size. */
const TILES = 28

type Pt = { x: number; y: number }

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Equal arc-length samples on a quadratic Bézier (includes both ends). */
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
  const steps = 72
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
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.92"
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
  skipLastFlower,
}: {
  points: Pt[]
  leaf?: boolean
  deepStart?: number
  /** Omit the last bloom so tiled units don’t double up on the seam. */
  skipLastFlower?: boolean
}) {
  const flowers = skipLastFlower ? points.slice(0, -1) : points
  const tip = points[points.length - 1]!
  return (
    <g>
      <StringPath points={points} />
      {flowers.map((p, i) => (
        <Marigold key={i} x={p.x} y={p.y} deep={(i + deepStart) % 2 === 1} />
      ))}
      {leaf && <MangoLeaves x={tip.x} y={tip.y + FLOWER_R + 2} />}
    </g>
  )
}

/** One seamless U-cell (left edge inclusive, right edge shared with the next tile). */
function ToranUnit({ index }: { index: number }) {
  const mid = UNIT_W / 2
  // Rail stops one spacing before the right edge so the next tile’s first flower continues the rhythm.
  const rail = pointsOnLine(0, TOP_Y, UNIT_W, TOP_Y, SPACING)
  const swag = pointsOnQuad(0, TOP_Y, mid, 52, UNIT_W, TOP_Y, SPACING)
  const swagInner = pointsOnQuad(0, TOP_Y + 9, mid, 62, UNIT_W, TOP_Y + 9, SPACING)
  const tassel = pointsOnLine(mid, TOP_Y, mid, TOP_Y + SPACING * 4, SPACING)

  return (
    <svg
      className={styles.unit}
      viewBox={`0 0 ${UNIT_W} ${UNIT_H}`}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      aria-hidden="true"
    >
      <Strand points={rail} skipLastFlower deepStart={index} />
      <Strand points={swag} skipLastFlower deepStart={index} />
      <Strand points={swagInner} skipLastFlower deepStart={index + 1} />
      <Strand points={tassel} leaf deepStart={1} />
    </svg>
  )
}

/**
 * Full-bleed marigold toran: fixed-size U cells tiled horizontally so the
 * garland spans the screen without stretching flowers or leaving side gaps.
 */
export function Toran({ className }: { className?: string }) {
  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      <div className={styles.ribbon}>
        {Array.from({ length: TILES }, (_, i) => (
          <ToranUnit key={i} index={i} />
        ))}
      </div>
    </div>
  )
}
