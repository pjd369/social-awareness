import { bounceOffWalls } from './physics'

export type FirecrackerKind = 'rockets' | 'confetti' | 'spinners'

const COLOURS = ['#ffdc9e', '#edbd74', '#ffc05b', '#fff1d2', '#f4a99b', '#ffffff']

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  angle: number
  spin: number
  life: number
  age: number
  color: string
  /** Confetti rectangle size. */
  w: number
  h: number
  role: 'rocket' | 'spark' | 'confetti' | 'spinner'
  /** Height where a rocket bursts. */
  burstY: number
}

const colour = (i: number) => COLOURS[i % COLOURS.length] ?? '#edbd74'

function piece(partial: Partial<Piece> & Pick<Piece, 'x' | 'y' | 'role'>): Piece {
  return {
    vx: 0,
    vy: 0,
    radius: 4,
    angle: 0,
    spin: 0,
    life: 8,
    age: 0,
    color: '#edbd74',
    w: 8,
    h: 12,
    burstY: 0,
    ...partial,
  }
}

/**
 * One firecracker show. The width and height passed to `step` are the screen,
 * and every piece treats those edges as walls.
 */
export class FirecrackerShow {
  private pieces: Piece[] = []
  private launchIn = 0
  private spawning = true
  private readonly small: boolean

  constructor(
    private readonly kind: FirecrackerKind,
    width: number,
    private readonly reduced: boolean,
  ) {
    this.small = width < 700
    if (kind === 'confetti') this.fillConfetti(width, Math.max(width, 600))
    if (kind === 'spinners') this.fillSpinners(width, Math.max(width * 0.7, 500))
    if (kind === 'rockets') this.launchRocket(width, Math.max(width, 600))
  }

  /** No new pieces. Whatever is already in the air keeps moving until it fades. */
  stopSpawning(): void {
    this.spawning = false
  }

  step(dt: number, width: number, height: number): void {
    const stepDt = Math.min(dt, 0.05)
    if (!this.reduced && this.spawning) {
      this.launchIn -= stepDt
      if (this.kind === 'rockets' && this.launchIn <= 0) {
        this.launchRocket(width, height)
        this.launchIn = this.small ? 0.42 : 0.28
      }
      if (this.kind === 'confetti' && this.pieces.length < (this.small ? 70 : 120)) {
        this.dropConfetti(width)
      }
    }

    const shed: Piece[] = []
    let sparkCount = 0
    for (const item of this.pieces) {
      if (item.role === 'spark') sparkCount += 1
    }

    for (const item of this.pieces) {
      item.age += stepDt
      item.angle += item.spin * stepDt
      if (item.role === 'spark') item.vy += 420 * stepDt
      if (item.role === 'confetti') item.vy += 280 * stepDt
      item.x += item.vx * stepDt
      item.y += item.vy * stepDt

      if (item.role === 'rocket' && item.y <= item.burstY) {
        item.age = item.life
        this.burst(item.x, item.y, item.color)
        continue
      }

      if (item.role === 'spinner' && sparkCount + shed.length < (this.reduced ? 40 : 220)) {
        this.shedSpinnerSparks(item, shed)
      }

      const hit = bounceOffWalls(item, width, height, item.role === 'spinner' ? 0.96 : 0.8)
      if (hit.x || hit.y) {
        if (item.role === 'spinner') item.spin = -item.spin * 0.9 - Math.sign(item.spin || 1) * 50
        if (item.role === 'confetti') item.spin = -item.spin
        if (item.role === 'spark' && (hit.x || hit.y)) item.vx *= 0.98
      }
    }

    if (shed.length) this.pieces.push(...shed)
    this.pieces = this.pieces.filter((item) => item.age < item.life)
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height)
    for (const item of this.pieces) {
      ctx.globalCompositeOperation =
        item.role === 'spark' || item.role === 'rocket' ? 'lighter' : 'source-over'
      if (item.role === 'rocket') this.drawRocket(ctx, item)
      else if (item.role === 'spark') this.drawSpark(ctx, item)
      else if (item.role === 'confetti') this.drawConfetti(ctx, item)
      else this.drawSpinner(ctx, item)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  private launchRocket(width: number, height: number): void {
    const x = width * (0.12 + Math.random() * 0.76)
    this.pieces.push(
      piece({
        role: 'rocket',
        x,
        y: height - 8,
        vx: (Math.random() - 0.5) * 80,
        vy: -(height * (0.55 + Math.random() * 0.25)),
        radius: 3,
        color: colour(this.pieces.length),
        life: 3,
        burstY: height * (0.12 + Math.random() * 0.38),
      }),
    )
  }

  private burst(x: number, y: number, color: string): void {
    const count = this.reduced ? 18 : this.small ? 28 : 42
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2
      const speed = 90 + Math.random() * 160
      this.pieces.push(
        piece({
          role: 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.6 + Math.random() * 1.6,
          color: Math.random() < 0.35 ? '#fff6dc' : color,
          life: 1.6 + Math.random() * 1.1,
        }),
      )
    }
  }

  private fillConfetti(width: number, height: number): void {
    const count = this.reduced ? 24 : this.small ? 70 : 120
    for (let i = 0; i < count; i++) {
      this.pieces.push(
        piece({
          role: 'confetti',
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 220,
          vy: -40 - Math.random() * 260,
          radius: 8,
          w: 7 + Math.random() * 8,
          h: 12 + Math.random() * 10,
          spin: (Math.random() - 0.5) * 10,
          angle: Math.random() * Math.PI,
          color: colour(i),
          life: 10_000,
        }),
      )
    }
  }

  private dropConfetti(width: number): void {
    this.pieces.push(
      piece({
        role: 'confetti',
        x: Math.random() * width,
        y: 10,
        vx: (Math.random() - 0.5) * 180,
        vy: 40 + Math.random() * 80,
        radius: 8,
        w: 7 + Math.random() * 8,
        h: 12 + Math.random() * 10,
        spin: (Math.random() - 0.5) * 10,
        color: colour(this.pieces.length),
        life: 10_000,
      }),
    )
  }

  private fillSpinners(width: number, height: number): void {
    const count = this.reduced ? 4 : this.small ? 8 : 12
    for (let i = 0; i < count; i++) {
      const speed = 160 + Math.random() * 140
      const angle = Math.random() * Math.PI * 2
      this.pieces.push(
        piece({
          role: 'spinner',
          x: width * (0.15 + Math.random() * 0.7),
          y: height * (0.15 + Math.random() * 0.7),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 26 + Math.random() * 16,
          spin: (Math.random() < 0.5 ? -1 : 1) * (125 + Math.random() * 125),
          color: colour(i),
          life: 10_000,
        }),
      )
    }
  }

  /** Sparks flung from the spinning tips, like a chakri shedding fire. */
  private shedSpinnerSparks(spinner: Piece, into: Piece[]): void {
    const tips = this.reduced ? 1 : this.small ? 2 : 3
    const arms = 10
    for (let i = 0; i < tips; i++) {
      const arm = Math.floor(Math.random() * arms)
      const a = spinner.angle + (Math.PI * 2 * arm) / arms
      const tipX = spinner.x + Math.cos(a) * spinner.radius
      const tipY = spinner.y + Math.sin(a) * spinner.radius
      const outward = 50 + Math.random() * 90
      const tangent = Math.sign(spinner.spin || 1) * (140 + Math.random() * 180)
      into.push(
        piece({
          role: 'spark',
          x: tipX,
          y: tipY,
          vx: Math.cos(a) * outward - Math.sin(a) * tangent + spinner.vx * 0.25,
          vy: Math.sin(a) * outward + Math.cos(a) * tangent + spinner.vy * 0.25,
          radius: 1.2 + Math.random() * 2,
          color: Math.random() < 0.45 ? '#fff6dc' : spinner.color,
          life: 0.28 + Math.random() * 0.4,
        }),
      )
    }
  }

  private drawRocket(ctx: CanvasRenderingContext2D, item: Piece): void {
    const len = 28
    const mag = Math.hypot(item.vx, item.vy) || 1
    ctx.strokeStyle = item.color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(item.x, item.y)
    ctx.lineTo(item.x - (item.vx / mag) * len, item.y - (item.vy / mag) * len)
    ctx.stroke()
    ctx.fillStyle = '#fff6dc'
    ctx.beginPath()
    ctx.arc(item.x, item.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawSpark(ctx: CanvasRenderingContext2D, item: Piece): void {
    ctx.globalAlpha = Math.max(0, 1 - item.age / item.life)
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawConfetti(ctx: CanvasRenderingContext2D, item: Piece): void {
    ctx.save()
    ctx.translate(item.x, item.y)
    ctx.rotate(item.angle)
    ctx.fillStyle = item.color
    ctx.globalAlpha = 0.95
    ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h)
    ctx.restore()
  }

  private drawSpinner(ctx: CanvasRenderingContext2D, item: Piece): void {
    ctx.save()
    ctx.translate(item.x, item.y)
    ctx.rotate(item.angle)
    const arms = 10
    for (let i = 0; i < arms; i++) {
      const a = (Math.PI * 2 * i) / arms
      ctx.strokeStyle = i % 2 ? '#fff6dc' : item.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6)
      ctx.lineTo(Math.cos(a) * item.radius, Math.sin(a) * item.radius)
      ctx.stroke()
      ctx.fillStyle = '#fff6dc'
      ctx.beginPath()
      ctx.arc(Math.cos(a) * item.radius, Math.sin(a) * item.radius, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.arc(0, 0, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
