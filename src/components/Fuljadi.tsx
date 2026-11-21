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

/** Square canvas so the sparkle perimeter reads as a round halo. */
const CANVAS = 240
const TIP = CANVAS / 2

/**
 * A burning fuljadi: thin stick plus a round sparkler spray
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
    canvas.width = CANVAS * dpr
    canvas.height = CANVAS * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    function emit(burst: number) {
      for (let i = 0; i < burst; i++) {
        // Full 360° so the sparkle cloud stays round, not oblong.
        const angle = Math.random() * Math.PI * 2
        const speed = 2.2 + Math.random() * 5.2
        sparksRef.current.push({
          x: TIP + (Math.random() - 0.5) * 3,
          y: TIP + (Math.random() - 0.5) * 3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 16 + Math.random() * 22,
          width: 0.65 + Math.random() * 1.35,
          hue: Math.random() < 0.55 ? 42 + Math.random() * 18 : 28 + Math.random() * 12,
        })
      }
      if (sparksRef.current.length > 280) {
        sparksRef.current.splice(0, sparksRef.current.length - 280)
      }
    }

    function tick() {
      if (!running || !ctx) return
      frame += 1
      emit(frame % 2 === 0 ? 10 : 7)
      if (frame % 4 === 0) emit(8)

      ctx.clearRect(0, 0, CANVAS, CANVAS)

      // Round bloom around the burning tip.
      const bloom = ctx.createRadialGradient(TIP, TIP, 0, TIP, TIP, 48)
      bloom.addColorStop(0, 'rgba(255, 248, 210, 0.98)')
      bloom.addColorStop(0.22, 'rgba(255, 196, 80, 0.6)')
      bloom.addColorStop(0.5, 'rgba(255, 120, 40, 0.2)')
      bloom.addColorStop(1, 'rgba(255, 120, 40, 0)')
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.arc(TIP, TIP, 48, 0, Math.PI * 2)
      ctx.fill()

      const next: Spark[] = []
      for (const spark of sparksRef.current) {
        spark.life += 1
        spark.x += spark.vx
        spark.y += spark.vy
        // Very light drag only — keep the perimeter round.
        spark.vx *= 0.978
        spark.vy *= 0.978
        if (spark.life >= spark.maxLife) continue
        next.push(spark)

        const t = spark.life / spark.maxLife
        const alpha = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88
        const len = 5 + (1 - t) * 10
        const speed = Math.hypot(spark.vx, spark.vy) || 1
        const nx = spark.vx / speed
        const ny = spark.vy / speed

        ctx.strokeStyle = `hsla(${spark.hue}, 100%, ${70 + (1 - t) * 22}%, ${alpha})`
        ctx.lineWidth = spark.width * (1.2 - t * 0.45)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(spark.x, spark.y)
        ctx.lineTo(spark.x - nx * len, spark.y - ny * len)
        ctx.stroke()

        if (t < 0.5) {
          ctx.fillStyle = `rgba(255, 255, 245, ${alpha * 0.95})`
          ctx.beginPath()
          ctx.arc(spark.x, spark.y, spark.width * 0.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      sparksRef.current = next

      ctx.fillStyle = '#fff8e8'
      ctx.beginPath()
      ctx.arc(TIP, TIP, 3.4 + Math.sin(frame / 4) * 0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 200, 90, 0.9)'
      ctx.beginPath()
      ctx.arc(TIP, TIP, 5.8 + Math.sin(frame / 5) * 0.9, 0, Math.PI * 2)
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
        width={CANVAS}
        height={CANVAS}
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

        {/* Thin stem */}
        <rect
          x="24.5"
          y="34"
          width="3"
          height="112"
          rx="1.5"
          fill={`url(#fuljadi-stick-${tipGradId})`}
        />
        <rect x="25" y="36" width="1" height="106" rx="0.5" fill="rgb(255 220 170 / 30%)" />

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
