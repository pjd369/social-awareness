/** A moving piece. The screen edges are solid walls. */
export interface Mover {
  x: number
  y: number
  vx: number
  vy: number
  /** Half-size used for the wall. */
  radius: number
}

/**
 * Keep a mover inside the box. Hitting an edge reverses that direction, the
 * way a firecracker bounces off a wall. Returns which edges were struck.
 */
export function bounceOffWalls(
  body: Mover,
  width: number,
  height: number,
  restitution = 0.86,
): { x: boolean; y: boolean } {
  const hit = { x: false, y: false }
  const min = body.radius
  const maxX = Math.max(min, width - body.radius)
  const maxY = Math.max(min, height - body.radius)

  if (body.x < min) {
    body.x = min
    body.vx = Math.abs(body.vx) * restitution
    hit.x = true
  } else if (body.x > maxX) {
    body.x = maxX
    body.vx = -Math.abs(body.vx) * restitution
    hit.x = true
  }

  if (body.y < min) {
    body.y = min
    body.vy = Math.abs(body.vy) * restitution
    hit.y = true
  } else if (body.y > maxY) {
    body.y = maxY
    body.vy = -Math.abs(body.vy) * restitution
    hit.y = true
  }

  return hit
}
