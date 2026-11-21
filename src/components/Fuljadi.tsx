import { type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import styles from './Fuljadi.module.css'

const SPARKS = [
  { dx: -18, dy: -34, delay: '0s', dur: '0.65s' },
  { dx: 16, dy: -38, delay: '0.08s', dur: '0.7s' },
  { dx: -8, dy: -42, delay: '0.16s', dur: '0.6s' },
  { dx: 22, dy: -28, delay: '0.24s', dur: '0.75s' },
  { dx: -24, dy: -22, delay: '0.1s', dur: '0.68s' },
  { dx: 6, dy: -46, delay: '0.2s', dur: '0.62s' },
  { dx: -14, dy: -18, delay: '0.3s', dur: '0.72s' },
  { dx: 12, dy: -20, delay: '0.05s', dur: '0.58s' },
  { dx: 0, dy: -48, delay: '0.14s', dur: '0.8s' },
  { dx: -20, dy: -30, delay: '0.28s', dur: '0.66s' },
]

interface FuljadiProps {
  x: number
  y: number
  label: string
  dragging: boolean
  leaving?: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

/**
 * A burning fuljadi (sparkler): stick with a glowing tip and flying sparks.
 * Position is the tip point in stage coordinates; the handle hangs below.
 */
export function Fuljadi({ x, y, label, dragging, leaving, onPointerDown }: FuljadiProps) {
  return (
    <button
      type="button"
      className={`${styles.fuljadi} ${dragging ? styles.dragging : ''} ${leaving ? styles.leaving : ''}`}
      style={{ left: x, top: y }}
      aria-label={label}
      aria-grabbed={dragging}
      data-testid="fuljadi"
      onPointerDown={onPointerDown}
    >
      <svg className={styles.art} viewBox="0 0 52 152" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="fuljadi-tip" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8d6" />
            <stop offset="35%" stopColor="#ffd36b" />
            <stop offset="70%" stopColor="#ff8a2a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ff8a2a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fuljadi-stick" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c47a3a" />
            <stop offset="40%" stopColor="#8a4e28" />
            <stop offset="100%" stopColor="#5a3218" />
          </linearGradient>
        </defs>

        {/* Stick */}
        <rect x="22" y="36" width="8" height="108" rx="3" fill="url(#fuljadi-stick)" />
        <rect x="23.5" y="38" width="2" height="100" rx="1" fill="rgb(255 220 170 / 25%)" />

        {/* Tip glow + burning head */}
        <circle className={styles.tipGlow} cx="26" cy="28" r="18" fill="url(#fuljadi-tip)" />
        <circle cx="26" cy="30" r="5.5" fill="#ffe9a8" />
        <circle cx="26" cy="30" r="3" fill="#fff" />

        {SPARKS.map((spark, i) => (
          <circle
            key={i}
            className={styles.spark}
            cx="26"
            cy="28"
            r={1.2 + (i % 3) * 0.45}
            fill={i % 2 === 0 ? '#ffe39a' : '#ffb347'}
            style={
              {
                '--dx': `${spark.dx}px`,
                '--dy': `${spark.dy}px`,
                '--delay': spark.delay,
                '--dur': spark.dur,
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </button>
  )
}
