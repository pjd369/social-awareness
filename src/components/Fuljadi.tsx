import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePrefersReducedMotion } from './motion'
import styles from './Fuljadi.module.css'

interface FuljadiProps {
  x: number
  y: number
  label: string
  dragging: boolean
  leaving?: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  width: number
  hue: number
}

const CANVAS_W = 220
const CANVAS_H = 260
/** Emission point — canvas is CSS-centered on the stick tip. */
const TIP_X = CANVAS_W / 2
const TIP_Y = CANVAS_H / 2

/**
 * A burning fuljadi: wooden stick plus a live sparkler spray
 * (dense gold/white streaks, like a real Indian fuljhadi).
 */
export function Fuljadi({ x, y, label, dragging, leaving, onPointerDown }: FuljadiProps) {
  const reducedMotion = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const tipGradId = useId().replace(/:/g, '')

  useEffect(() => {
    if (reducedMotion || leaving) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0
    let running = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = CANVAS_W * dpr
    canvas.height = CANVAS_H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    function emit(burst: number) {
      for (let i = 0; i < burst; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.55
        const speed = 1.6 + Math.random() * 4.8
        sparksRef.current.push({
          x: TIP_X + (Math.random() - 0.5) * 4,
          y: TIP_Y + (Math.random() - 0.5) * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 18 + Math.random() * 28,
          width: 0.7 + Math.random() * 1.4,
          hue: Math.random() < 0.55 ? 42 + Math.random() * 18 : 28 + Math.random() * 12,
        })
      }
      // Cap so a long hold never grows without bound.
      if (sparksRef.current.length > 220) {
        sparksRef.current.splice(0, sparksRef.current.length - 220)
      }
    }

    function tick() {
      if (!running || !ctx) return
      frame += 1
      // Continuous dense spray, with a small extra burst every few frames.
      emit(frame % 2 === 0 ? 7 : 4)
      if (frame % 5 === 0) emit(6)

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      // Soft bloom around the burning tip.
      const bloom = ctx.createRadialGradient(TIP_X, TIP_Y, 0, TIP_X, TIP_Y, 42)
      bloom.addColorStop(0, 'rgba(255, 248, 210, 0.95)')
      bloom.addColorStop(0.25, 'rgba(255, 196, 80, 0.55)')
      bloom.addColorStop(0.55, 'rgba(255, 120, 40, 0.18)')
      bloom.addColorStop(1, 'rgba(255, 120, 40, 0)')
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.arc(TIP_X, TIP_Y, 42, 0, Math.PI * 2)
      ctx.fill()

      const next: Spark[] = []
      for (const spark of sparksRef.current) {
        spark.life += 1
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += 0.09 // slight drop, like real sparks
        spark.vx *= 0.985
        if (spark.life >= spark.maxLife) continue
        next.push(spark)

        const t = spark.life / spark.maxLife
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
        const len = 4 + (1 - t) * 9
        const speed = Math.hypot(spark.vx, spark.vy) || 1
        const nx = spark.vx / speed
        const ny = spark.vy / speed

        ctx.strokeStyle = `hsla(${spark.hue}, 100%, ${68 + (1 - t) * 22}%, ${alpha})`
        ctx.lineWidth = spark.width * (1.15 - t * 0.5)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(spark.x, spark.y)
        ctx.lineTo(spark.x - nx * len, spark.y - ny * len)
        ctx.stroke()

        // Hot white core near the tip of each streak.
        if (t < 0.45) {
          ctx.fillStyle = `rgba(255, 255, 245, ${alpha * 0.9})`
          ctx.beginPath()
          ctx.arc(spark.x, spark.y, spark.width * 0.55, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      sparksRef.current = next

      // Bright burning head.
      ctx.fillStyle = '#fff8e8'
      ctx.beginPath()
      ctx.arc(TIP_X, TIP_Y, 3.2 + Math.sin(frame / 4) * 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 200, 90, 0.85)'
      ctx.beginPath()
      ctx.arc(TIP_X, TIP_Y, 5.5 + Math.sin(frame / 5) * 0.8, 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      sparksRef.current = []
    }
  }, [reducedMotion, leaving])

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
      <canvas
        ref={canvasRef}
        className={styles.sparks}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-hidden="true"
      />
      <svg className={styles.art} viewBox="0 0 52 152" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`fuljadi-tip-${tipGradId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8d6" />
            <stop offset="40%" stopColor="#ffd36b" />
            <stop offset="100%" stopColor="#ff8a2a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`fuljadi-stick-${tipGradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a06a" />
            <stop offset="35%" stopColor="#a56a3a" />
            <stop offset="100%" stopColor="#5a3218" />
          </linearGradient>
        </defs>

        <rect
          x="22"
          y="36"
          width="8"
          height="108"
          rx="3"
          fill={`url(#fuljadi-stick-${tipGradId})`}
        />
        <rect x="23.5" y="38" width="2.2" height="100" rx="1" fill="rgb(255 220 170 / 28%)" />

        {/* Static tip for reduced-motion / canvas loading. */}
        {reducedMotion && (
          <>
            <circle cx="26" cy="30" r="16" fill={`url(#fuljadi-tip-${tipGradId})`} />
            <circle cx="26" cy="30" r="5" fill="#ffe9a8" />
            <circle cx="26" cy="30" r="2.5" fill="#fff" />
          </>
        )}
      </svg>
    </button>
  )
}
