import { useId, type CSSProperties } from 'react'
import diya from './diya.module.css'
import styles from './DiyaLamp.module.css'

const PETALS = 12

/**
 * A large clay diya inside a faint mandala ring. Unlit, it shows only the
 * wick; when `lit` turns true the flame catches and warm light spreads.
 * Decorative.
 */
export function DiyaLamp({ lit = true, className }: { lit?: boolean; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const classes = [styles.lamp, lit && diya.lit, lit && styles.lit, className]
    .filter(Boolean)
    .join(' ')
  return (
    <svg className={classes} viewBox="0 0 240 220" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffd36b" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#f39b3a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f39b3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9924c" />
          <stop offset="1" stopColor="#87442a" />
        </linearGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f08a2c" />
          <stop offset="0.55" stopColor="#ffbe4d" />
          <stop offset="1" stopColor="#ffe6a3" />
        </linearGradient>
      </defs>

      <circle className={styles.glow} cx="120" cy="112" r="110" fill={`url(#${id}-glow)`} />

      <g className={styles.mandala} fill="none" stroke="#d9b07a">
        <circle cx="120" cy="110" r="90" strokeWidth="1" />
        {Array.from({ length: PETALS }, (_, i) => (
          <ellipse
            key={i}
            cx="120"
            cy="38"
            rx="9"
            ry="17"
            strokeWidth="1"
            transform={`rotate(${(360 / PETALS) * i} 120 110)`}
          />
        ))}
        <circle cx="200" cy="56" r="2" fill="#d9b07a" stroke="none" />
        <circle cx="44" cy="76" r="1.6" fill="#d9b07a" stroke="none" />
        <circle cx="64" cy="30" r="1.2" fill="#d9b07a" stroke="none" />
      </g>

      <ellipse cx="120" cy="196" rx="74" ry="8" fill="rgb(20 8 14 / 45%)" />
      <path
        d="M46 142c3 36 38 50 74 50s71-14 74-50z"
        fill={`url(#${id}-bowl)`}
        stroke="#f2c784"
        strokeWidth="1.5"
      />
      <ellipse cx="120" cy="142" rx="74" ry="14" fill="#f0c27a" />
      <ellipse cx="120" cy="142" rx="62" ry="9" fill="#9b5a2e" />
      <path d="M60 160c20 10 100 10 120 0" fill="none" stroke="#f6d29a" strokeWidth="1.2" />
      <path
        d="M90 170l6 5 6-5M114 175l6 5 6-5M138 170l6 5 6-5"
        fill="none"
        stroke="#f6d29a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M120 141c1-5 0-9-1-13"
        fill="none"
        stroke="#3a2420"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <g className={diya.flame}>
        <path
          d="M120 54c15 22 21 38 21 51a21 21 0 0 1-42 0c0-13 6-29 21-51z"
          fill={`url(#${id}-flame)`}
        />
        <path d="M120 80c7 11 10 19 10 26a10 10 0 0 1-20 0c0-7 3-15 10-26z" fill="#fff6d6" />
      </g>

      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className={styles.ember}
          cx={110 + i * 10}
          cy="70"
          r={1.6 - i * 0.3}
          fill="#ffd98a"
          style={{ '--delay': `${i * 900}ms` } as CSSProperties}
        />
      ))}
    </svg>
  )
}
