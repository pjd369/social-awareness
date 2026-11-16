import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../../i18n/context'
import { usePrefersReducedMotion } from '../../../components/motion'
import { FirecrackerShow, type FirecrackerKind } from './show'
import styles from './FirecrackerReward.module.css'

/** Fifteen seconds of fireworks, then a slow fade so it leaves without a hard cut. */
const PLAY_MS = 15_000
const FADE_MS = 2_500
const TOTAL_MS = PLAY_MS + FADE_MS

const KINDS: FirecrackerKind[] = ['rockets', 'confetti', 'spinners']

const LABEL: Record<
  FirecrackerKind,
  'story.celebrate.rockets' | 'story.celebrate.confetti' | 'story.celebrate.spinners'
> = {
  rockets: 'story.celebrate.rockets',
  confetti: 'story.celebrate.confetti',
  spinners: 'story.celebrate.spinners',
}

/**
 * The reward for a Bhulkao story when every expected decision was chosen.
 * Tapping an icon fills the screen for about 15 seconds. The screen size at
 * that moment is the wall. Leaving the ending stops the show at once.
 */
export function FirecrackerReward() {
  const { t } = useI18n()
  const [kind, setKind] = useState<FirecrackerKind | null>(null)

  return (
    <section className={styles.reward} aria-label={t('story.celebrate.title')}>
      <h2 className={styles.title}>{t('story.celebrate.title')}</h2>
      <p className={styles.lead}>{t('story.celebrate.lead')}</p>
      <ul className={styles.options}>
        {KINDS.map((option) => (
          <li key={option}>
            <button
              type="button"
              className={styles.option}
              aria-label={t(LABEL[option])}
              onClick={() => setKind(option)}
            >
              <FirecrackerIcon kind={option} />
            </button>
          </li>
        ))}
      </ul>
      {kind && <FirecrackerStage kind={kind} onDone={() => setKind(null)} />}
    </section>
  )
}

function FirecrackerIcon({ kind }: { kind: FirecrackerKind }) {
  if (kind === 'rockets') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path
          fill="currentColor"
          d="M32 3c7 9 10 18 10 27 0 3.2-1.2 6-2.8 8L32 43l-7.2-5C23.2 36 22 33.2 22 30 22 21 25 12 32 3z"
        />
        <path fill="#fff6dc" d="M30 20.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
        <path fill="currentColor" opacity="0.75" d="M22 36 12 48c6-.2 10-2.4 12-7.2L22 36z" />
        <path fill="currentColor" opacity="0.75" d="M42 36 52 48c-6-.2-10-2.4-12-7.2L42 36z" />
        <path
          fill="#ffc05b"
          d="M32 44c3.2 4.2 4.2 7.4 4.2 10.4 0 3.2-1.7 5.4-4.2 7.6-2.5-2.2-4.2-4.4-4.2-7.6C27.8 51.4 28.8 48.2 32 44z"
        />
        <path
          fill="#fff6dc"
          d="M32 50c1.5 2.1 2 3.6 2 5 0 1.5-.8 2.6-2 3.6-1.2-1-2-2.1-2-3.6 0-1.4.5-2.9 2-5z"
        />
      </svg>
    )
  }
  if (kind === 'confetti') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path fill="currentColor" d="M14 16c6 1 8 6 6 10-4-1-8-4-6-10z" />
        <path fill="#fff6dc" d="M30 8l3 8 8 2-8 3-2 8-3-8-8-2 8-3z" />
        <rect
          fill="currentColor"
          x="46"
          y="14"
          width="6"
          height="10"
          rx="1"
          transform="rotate(24 49 19)"
        />
        <circle cx="18" cy="40" r="4" fill="#ffc05b" />
        <path fill="currentColor" opacity="0.8" d="M34 36c5 0 8 4 7 8-4 1-8-1-9-5 0-2.2.8-3 2-3z" />
        <path fill="#fff6dc" d="M48 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <rect
          fill="#ffc05b"
          x="26"
          y="48"
          width="5"
          height="9"
          rx="1"
          transform="rotate(-18 28 52)"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="5" fill="#fff6dc" />
      <circle cx="32" cy="32" r="2.2" fill="#ffc05b" />
      <g fill="currentColor">
        <path d="M32 6c1.2 6 1.2 10 0 14-1.2-4-1.2-8 0-14z" />
        <path d="M32 44c1.2 4 1.2 8 0 14-1.2-6-1.2-10 0-14z" />
        <path d="M6 32c6-1.2 10-1.2 14 0-4 1.2-8 1.2-14 0z" />
        <path d="M44 32c4-1.2 8-1.2 14 0-6 1.2-10 1.2-14 0z" />
        <path d="M13 13c4.2 4.2 7 6.4 9 6.2-2.2-4.6-4.4-7.4-9-6.2z" />
        <path d="M42 45c2 4.6 4.8 7.4 9 6.2-4.2-4.2-7-6.4-9-6.2z" />
        <path d="M51 13c-4.2 4.2-7 6.4-9 6.2 2.2-4.6 4.4-7.4 9-6.2z" />
        <path d="M22 45c-2 4.6-4.8 7.4-9 6.2 4.2-4.2 7-6.4 9-6.2z" />
      </g>
      <g fill="#ffc05b">
        <circle cx="32" cy="8" r="2.2" />
        <circle cx="32" cy="56" r="2.2" />
        <circle cx="8" cy="32" r="2.2" />
        <circle cx="56" cy="32" r="2.2" />
        <circle cx="15" cy="15" r="2" />
        <circle cx="49" cy="49" r="2" />
        <circle cx="49" cy="15" r="2" />
        <circle cx="15" cy="49" r="2" />
      </g>
    </svg>
  )
}

function FirecrackerStage({ kind, onDone }: { kind: FirecrackerKind; onDone: () => void }) {
  const { t } = useI18n()
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !stage || !ctx) return

    const width = window.innerWidth
    const height = window.innerHeight
    stage.style.width = `${width}px`
    stage.style.height = `${height}px`

    const show = new FirecrackerShow(kind, width, reduced)
    const started = performance.now()
    let frame = 0
    let last = 0
    let stopped = false

    const finish = () => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(frame)
      onDoneRef.current()
    }

    const paint = (now: number) => {
      const elapsed = now - started
      if (elapsed >= TOTAL_MS) {
        finish()
        return
      }
      const fading = elapsed > PLAY_MS
      if (fading) show.stopSpawning()
      const fade = fading ? (TOTAL_MS - elapsed) / FADE_MS : 1
      stage.style.opacity = String(fade)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextW = Math.round(width * dpr)
      const nextH = Math.round(height * dpr)
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const dt = last ? (now - last) / 1000 : 0.016
      last = now
      show.step(reduced ? 0 : dt, width, height)
      show.draw(ctx, width, height)
      frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [kind, reduced])

  return createPortal(
    <div ref={stageRef} className={styles.stage} role="img" aria-label={t('story.celebrate.scene')}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>,
    document.body,
  )
}
