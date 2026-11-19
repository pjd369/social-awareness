import { describe, expect, it } from 'vitest'
import { bounceOffWalls, type Mover } from './physics'

function body(partial: Partial<Mover> = {}): Mover {
  return { x: 50, y: 50, vx: 10, vy: 10, radius: 8, ...partial }
}

describe('bounceOffWalls', () => {
  it('reverses horizontal speed on the left and right walls', () => {
    const left = body({ x: 2, vx: -40 })
    expect(bounceOffWalls(left, 200, 200).x).toBe(true)
    expect(left.x).toBe(8)
    expect(left.vx).toBeGreaterThan(0)

    const right = body({ x: 198, vx: 40 })
    expect(bounceOffWalls(right, 200, 200).x).toBe(true)
    expect(right.vx).toBeLessThan(0)
  })

  it('reverses vertical speed on the top and bottom walls', () => {
    const top = body({ y: 0, vy: -30 })
    expect(bounceOffWalls(top, 200, 200).y).toBe(true)
    expect(top.vy).toBeGreaterThan(0)

    const bottom = body({ y: 199, vy: 30 })
    expect(bounceOffWalls(bottom, 200, 200).y).toBe(true)
    expect(bottom.vy).toBeLessThan(0)
  })

  it('leaves a mover alone when it is inside the screen', () => {
    const mid = body()
    expect(bounceOffWalls(mid, 200, 200)).toEqual({ x: false, y: false })
    expect(mid.vx).toBe(10)
    expect(mid.vy).toBe(10)
  })
})
