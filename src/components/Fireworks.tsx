import { useEffect, useRef, useState } from 'react'
import styles from './Fireworks.module.css'

/** First launch: after the page has faded in. */
const START_MS = 900
/** Last regular launch; a short finale follows. */
const END_MS = 2400
/** Hard stop, so the canvas never outlives the welcome. */
const MAX_MS = 7500
const FINALE = 4
const GRAVITY = 70
const COLOURS = ['#ffdc9e', '#edbd74', '#ffc05b', '#f39b3a', '#fff1d2', '#f4a99b']

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

/**
 * Fireworks rising from the bottom of the screen and bursting, once per page
 * load: they start after the page has faded in and drift for about 5 seconds,
 * ending with a small finale. The canvas never takes pointer events. The
 * layout renders this only when intro motion is allowed.
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
    const rocketCount = small ? 10 : 14
    const sparksPerBurst = small ? 28 : 40
    const regular = rocketCount - FINALE

    const rockets: Rocket[] = Array.from({ length: rocketCount }, (_, i) => {
      const finale = i >= regular
      // 3 is coprime with 10 and 14, so this visits every slot once in a scattered order.
      const slot = (i * 3) % rocketCount
      return {
        x: width * (0.08 + (0.84 * (slot + 0.2 + Math.random() * 0.6)) / rocketCount),
        startY: height + 8,
        targetY: height * (0.14 + Math.random() * 0.32),
        launchAt: finale
          ? END_MS + 300 + (i - regular) * 220
          : START_MS + (i / regular) * (END_MS - START_MS) + Math.random() * 220,
        riseMs: 1200 + Math.random() * 400,
        colour: COLOURS[i % COLOURS.length] ?? '#edbd74',
        scale: finale ? 1.3 : 0.75 + Math.random() * 0.5,
        burst: false,
      }
    })

    const sparks: Spark[] = []
    let start = 0
    let last = 0
    let frame = 0

    const burst = (x: number, y: number, colour: string, scale: number) => {
      const count = Math.round(sparksPerBurst * scale)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2
        const speed = (60 + Math.random() * 70) * size * scale
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: 1.5 + Math.random() * 0.7,
          colour: Math.random() < 0.3 ? '#fff6dc' : colour,
          size: (1.4 + Math.random() * 1.2) * size,
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
        const trail = ctx.createLinearGradient(rocket.x, y, rocket.x, y + 34 * size)
        trail.addColorStop(0, rocket.colour)
        trail.addColorStop(1, 'rgba(255, 220, 158, 0)')
        ctx.strokeStyle = trail
        ctx.lineWidth = 2.5 * size
        ctx.beginPath()
        ctx.moveTo(rocket.x, y)
        ctx.lineTo(rocket.x, y + 34 * size)
        ctx.stroke()
        ctx.fillStyle = '#fff6dc'
        ctx.beginPath()
        ctx.arc(rocket.x, y, 2.6 * size, 0, Math.PI * 2)
        ctx.fill()
      }

      const drag = Math.pow(0.4, dt)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        if (!spark) continue
        spark.age += dt
        if (spark.age >= spark.life) {
          sparks.splice(i, 1)
          continue
        }
        spark.vx *= drag
        spark.vy = spark.vy * drag + GRAVITY * dt
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        ctx.globalAlpha = 1 - spark.age / spark.life
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
