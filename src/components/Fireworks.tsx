import { useEffect, useRef, useState } from 'react'
import styles from './Fireworks.module.css'

/** First launch: right after the diya is lit. */
const START_MS = 80
/** Last regular launch; a short finale follows. */
const END_MS = 7600
/** Hard stop — full celebration is about 10 seconds. */
const MAX_MS = 10_000
const FINALE = 8
/** Soft gravity so round bursts don’t collapse into a tall column. */
const GRAVITY = 28
const COLOURS = [
  '#ff4d6d',
  '#ff8fab',
  '#ffd60a',
  '#ff9f1c',
  '#80ffdb',
  '#56cfe1',
  '#4cc9f0',
  '#7b2cbf',
  '#c77dff',
  '#f72585',
  '#06d6a0',
  '#ff6b35',
  '#fff1d2',
  '#90e0ef',
]

interface Rocket {
  x: number
  startY: number
  targetY: number
  launchAt: number
  riseMs: number
  colour: string
  /** Relative size of the burst. */
  scale: number
  burst: boolean
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  colour: string
  size: number
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

function pickColour(i: number): string {
  return COLOURS[i % COLOURS.length] ?? '#ffd60a'
}

/**
 * Fireworks rising from the bottom of the screen and bursting for about
 * 10 seconds after the intro diya is lit. Bursts expand in a round halo with
 * mixed festival colours. The canvas never takes pointer events.
 */
export function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      setDone(true)
      return
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.scale(dpr, dpr)

    const small = width < 600
    const size = Math.min(1.15, Math.max(0.75, width / 480))
    const rocketCount = small ? 36 : 52
    const sparksPerRing = small ? 36 : 48
    const regular = rocketCount - FINALE

    const rockets: Rocket[] = Array.from({ length: rocketCount }, (_, i) => {
      const finale = i >= regular
      // 7 is coprime with 36 and 52 — scattered launch slots across the width.
      const slot = (i * 7) % rocketCount
      return {
        x: width * (0.04 + (0.92 * (slot + 0.15 + Math.random() * 0.7)) / rocketCount),
        startY: height + 8,
        targetY: height * (0.12 + Math.random() * 0.38),
        launchAt: finale
          ? END_MS + 120 + (i - regular) * 180
          : START_MS + (i / regular) * (END_MS - START_MS) + Math.random() * 200,
        riseMs: 900 + Math.random() * 400,
        colour: pickColour(i + Math.floor(Math.random() * 3)),
        scale: finale ? 1.55 : 0.95 + Math.random() * 0.55,
        burst: false,
      }
    })

    const sparks: Spark[] = []
    let start = 0
    let last = 0
    let frame = 0

    /** Even radial speeds → round 2D burst; nested rings for a fuller bloom. */
    const burst = (x: number, y: number, colour: string, scale: number) => {
      const rings = [
        { count: Math.round(sparksPerRing * scale), speed: 95 * size * scale, life: 1.7 },
        { count: Math.round(sparksPerRing * 0.7 * scale), speed: 62 * size * scale, life: 1.9 },
        { count: Math.round(sparksPerRing * 0.35 * scale), speed: 34 * size * scale, life: 2.1 },
      ]
      const accents = [colour, pickColour(Math.floor(Math.random() * COLOURS.length)), '#ffffff']

      for (const ring of rings) {
        for (let i = 0; i < ring.count; i++) {
          // Even spacing around the circle; tiny jitter only so it stays round.
          const angle = (Math.PI * 2 * i) / ring.count + (Math.random() - 0.5) * 0.06
          const speed = ring.speed * (0.94 + Math.random() * 0.12)
          const tint =
            Math.random() < 0.18 ? accents[2]! : Math.random() < 0.35 ? accents[1]! : accents[0]!
          sparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            age: 0,
            life: ring.life + Math.random() * 0.35,
            colour: tint,
            size: (1.6 + Math.random() * 1.5) * size * (0.85 + scale * 0.2),
          })
        }
      }

      // Bright core flash particles (still radial, short range).
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (8 + Math.random() * 18) * size * scale
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: 0.45 + Math.random() * 0.25,
          colour: '#fffef5',
          size: (2.2 + Math.random() * 1.4) * size,
        })
      }
    }

    const tick = (now: number) => {
      if (!start) start = last = now
      const elapsed = now - start
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      for (const rocket of rockets) {
        if (rocket.burst || elapsed < rocket.launchAt) continue
        const t = Math.min((elapsed - rocket.launchAt) / rocket.riseMs, 1)
        const y = rocket.startY + (rocket.targetY - rocket.startY) * easeOut(t)
        if (t >= 1) {
          rocket.burst = true
          burst(rocket.x, y, rocket.colour, rocket.scale)
          continue
        }
        const trail = ctx.createLinearGradient(rocket.x, y, rocket.x, y + 36 * size)
        trail.addColorStop(0, rocket.colour)
        trail.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.strokeStyle = trail
        ctx.lineWidth = 2.8 * size
        ctx.beginPath()
        ctx.moveTo(rocket.x, y)
        ctx.lineTo(rocket.x, y + 36 * size)
        ctx.stroke()
        ctx.fillStyle = '#fffef5'
        ctx.beginPath()
        ctx.arc(rocket.x, y, 2.8 * size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Mild drag keeps the bloom circular longer (was 0.4 — that crushed sideways).
      const drag = Math.pow(0.82, dt)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        if (!spark) continue
        spark.age += dt
        if (spark.age >= spark.life) {
          sparks.splice(i, 1)
          continue
        }
        const t = spark.age / spark.life
        spark.vx *= drag
        // Gravity ramps in late so the early burst reads as a round disk.
        spark.vy = spark.vy * drag + GRAVITY * dt * Math.min(1, t * 1.6)
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt

        const alpha = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88
        const speed = Math.hypot(spark.vx, spark.vy) || 1
        const nx = spark.vx / speed
        const ny = spark.vy / speed
        const streak = spark.size * (1.2 + (1 - t) * 2.2)

        ctx.globalAlpha = alpha
        ctx.strokeStyle = spark.colour
        ctx.lineWidth = spark.size * (1 - t * 0.35)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(spark.x, spark.y)
        ctx.lineTo(spark.x - nx * streak, spark.y - ny * streak)
        ctx.stroke()

        ctx.fillStyle = '#fffef8'
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, spark.size * 0.45 * (1 - t * 0.3), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const finished = rockets.every((r) => r.burst) && sparks.length === 0
      if (finished || elapsed > MAX_MS) {
        setDone(true)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [done])

  if (done) return null
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
