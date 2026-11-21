import { useEffect, useRef, useState } from 'react'
import styles from './Fireworks.module.css'

/** First launch after the diya is lit. */
const START_MS = 200
/** Last regular launch; a short finale follows. */
const END_MS = 12_500
/** Hard stop — celebration lasts about 15 seconds. */
const MAX_MS = 15_000
const FINALE = 5
/** Soft gravity — heavy pull turns round bursts into a tall column. */
const GRAVITY = 32
const COLOURS = ['#ffdc9e', '#edbd74', '#ffc05b', '#f39b3a', '#fff1d2', '#f4a99b']

interface Rocket {
  /** Launch column — path spirals around this while spinning up. */
  baseX: number
  startY: number
  targetY: number
  launchAt: number
  riseMs: number
  colour: string
  /** Relative size of the burst. */
  scale: number
  /** Radians spun over the full rise (sign = spin direction). */
  spin: number
  /** How wide the spiral wanders while rising. */
  spiral: number
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

/**
 * Fireworks when the intro diya is lit: rockets spin upward and burst between
 * 50–80% of the viewer’s screen height (from the bottom) for about 15 seconds.
 * The canvas never takes pointer events.
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
    const size = Math.min(1, Math.max(0.6, width / 520))
    const rocketCount = small ? 22 : 32
    const sparksPerBurst = small ? 36 : 48
    const regular = rocketCount - FINALE

    const rockets: Rocket[] = Array.from({ length: rocketCount }, (_, i) => {
      const finale = i >= regular
      // 5 is coprime with 22 and 32 — scattered launch slots across the width.
      const slot = (i * 5) % rocketCount
      // Burst altitude: 50–80% of screen height measured from the bottom.
      const altitude = 0.5 + Math.random() * 0.3
      const turns = 1.6 + Math.random() * 1.8
      return {
        baseX: width * (0.08 + (0.84 * (slot + 0.2 + Math.random() * 0.6)) / rocketCount),
        startY: height + 8,
        targetY: height * (1 - altitude),
        launchAt: finale
          ? END_MS + 200 + (i - regular) * 280
          : START_MS + (i / regular) * (END_MS - START_MS) + Math.random() * 280,
        riseMs: 1100 + Math.random() * 450,
        colour: COLOURS[i % COLOURS.length] ?? '#edbd74',
        scale: finale ? 1.35 : 0.75 + Math.random() * 0.5,
        spin: turns * Math.PI * 2 * (Math.random() < 0.5 ? 1 : -1),
        spiral: (10 + Math.random() * 16) * size,
        burst: false,
      }
    })

    const sparks: Spark[] = []
    let start = 0
    let last = 0
    let frame = 0

    /**
     * All sparks launch together; speeds vary so some travel far and some stay
     * close — a filled round bloom, not equal-length spokes.
     */
    const burst = (x: number, y: number, colour: string, scale: number) => {
      const count = Math.round(sparksPerBurst * scale)
      const minSpeed = 28 * size * scale
      const maxSpeed = 110 * size * scale
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        // Bias a bit toward mid/far so the bloom still reads, but keep shorts.
        const t = Math.random() ** 0.65
        const speed = minSpeed + (maxSpeed - minSpeed) * t
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: 1.15 + Math.random() * 0.9,
          colour: Math.random() < 0.3 ? '#fff6dc' : colour,
          size: (1.3 + Math.random() * 1.4) * size,
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
        // Spiral out a little as it climbs, then settle toward the column.
        const spinAngle = rocket.spin * easeOut(t)
        const spiralR = rocket.spiral * Math.sin(t * Math.PI)
        const x = rocket.baseX + Math.cos(spinAngle) * spiralR
        if (t >= 1) {
          rocket.burst = true
          burst(x, y, rocket.colour, rocket.scale)
          continue
        }
        // Trail follows the spin tangent so the rise reads as spinning up.
        const trailLen = 34 * size
        const tx = Math.cos(spinAngle + Math.PI / 2) * spiralR * 0.35
        const trail = ctx.createLinearGradient(x, y, x - tx, y + trailLen)
        trail.addColorStop(0, rocket.colour)
        trail.addColorStop(1, 'rgba(255, 220, 158, 0)')
        ctx.strokeStyle = trail
        ctx.lineWidth = 2.5 * size
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - tx, y + trailLen)
        ctx.stroke()
        ctx.fillStyle = '#fff6dc'
        ctx.beginPath()
        ctx.arc(x, y, 2.6 * size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Mild drag + late gravity so the halo stays circular while it expands.
      const drag = Math.pow(0.78, dt)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        if (!spark) continue
        spark.age += dt
        if (spark.age >= spark.life) {
          sparks.splice(i, 1)
          continue
        }
        const lifeT = spark.age / spark.life
        spark.vx *= drag
        spark.vy = spark.vy * drag + GRAVITY * dt * Math.min(1, lifeT * 1.8)
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        ctx.globalAlpha = 1 - lifeT
        ctx.fillStyle = spark.colour
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
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
