import styles from './Toran.module.css'

const LIGHT = 'var(--brand-marigold)'
const DEEP = 'var(--brand-marigold-deep)'
const LEAF = 'var(--brand-leaf)'
const LEAF_DEEP = 'var(--brand-leaf-deep)'

/** Points along a quadratic swag from left to right. */
function swagPoints(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  count: number,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const u = 1 - t
    out.push({
      x: u * u * x1 + 2 * u * t * cx + t * t * x2,
      y: u * u * y1 + 2 * u * t * cy + t * t * y2,
    })
  }
  return out
}

function Marigold({
  x,
  y,
  r,
  deep,
}: {
  x: number
  y: number
  r: number
  deep?: boolean
}) {
  const fill = deep ? DEEP : LIGHT
  const rim = deep ? LIGHT : DEEP
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} opacity="0.92" />
      <circle r={r * 0.58} fill={rim} opacity="0.45" />
      <circle r={r * 0.26} fill={LIGHT} opacity="0.85" />
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

/** Strand of marigolds hanging straight down. */
function Drop({
  x,
  y0,
  count,
  r,
  leaf,
}: {
  x: number
  y0: number
  count: number
  r: number
  leaf?: boolean
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <Marigold key={i} x={x} y={y0 + i * r * 1.55} r={r} deep={i % 2 === 1} />
      ))}
      {leaf && <MangoLeaves x={x} y={y0 + count * r * 1.55 + 1} />}
    </g>
  )
}

/**
 * Festive marigold toran under the Harisumiran header — swags and tassels in
 * brand golds/greens so it sits quietly on the wine page (inspired by a
 * classic marigold doorway garland, not a pasted photo).
 */
export function Toran({ className }: { className?: string }) {
  const W = 640
  const H = 112
  const topY = 12
  const railCount = 34
  const bloom = 12

  // Four scallops across the doorway, matching the familiar toran rhythm.
  const joints = [70, 190, 320, 450, 570]
  const swags = [
    swagPoints(joints[0]!, topY, 130, 52, joints[1]!, topY, bloom),
    swagPoints(joints[1]!, topY, 255, 52, joints[2]!, topY, bloom),
    swagPoints(joints[2]!, topY, 385, 52, joints[3]!, topY, bloom),
    swagPoints(joints[3]!, topY, 510, 52, joints[4]!, topY, bloom),
  ]

  const swagInner = swags.map((pts) =>
    pts.map((p, i) => {
      const t = i / (pts.length - 1)
      const dip = Math.sin(t * Math.PI) * 8
      return { x: p.x, y: p.y + 8 + dip * 0.12 }
    }),
  )

  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        {Array.from({ length: railCount }, (_, i) => {
          const x = 18 + (i / (railCount - 1)) * (W - 36)
          return <Marigold key={`rail-${i}`} x={x} y={topY} r={4.8} deep={i % 2 === 1} />
        })}

        <Drop x={28} y0={topY + 6} count={6} r={5} />
        <Drop x={W - 28} y0={topY + 6} count={6} r={5} />

        {swags.map((pts, s) =>
          pts.map((p, i) => (
            <Marigold key={`swag-${s}-${i}`} x={p.x} y={p.y} r={4.7} deep={(s + i) % 2 === 1} />
          )),
        )}
        {swagInner.map((pts, s) =>
          pts.slice(1, -1).map((p, i) => (
            <Marigold
              key={`inner-${s}-${i}`}
              x={p.x}
              y={p.y}
              r={4.1}
              deep={(s + i) % 2 === 0}
            />
          )),
        )}

        <Drop x={joints[1]!} y0={topY + 5} count={4} r={4.5} leaf />
        <Drop x={joints[2]!} y0={topY + 5} count={4} r={4.5} leaf />
        <Drop x={joints[3]!} y0={topY + 5} count={4} r={4.5} leaf />
      </svg>
    </div>
  )
}
