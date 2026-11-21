import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useI18n } from '../i18n/context'
import { DIYA_LIT_SESSION_KEY } from '../config/site'
import { usePrefersReducedMotion } from './motion'
import { DiyaLamp } from './DiyaLamp'
import { Fuljadi } from './Fuljadi'
import styles from './DiyaLighting.module.css'

function readLit(): boolean {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return true
    return window.sessionStorage.getItem(DIYA_LIT_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeLit() {
  try {
    window.sessionStorage.setItem(DIYA_LIT_SESSION_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

/** Tip must reach the black vaat (wick); small pad so touch still feels fair. */
function tipNearWick(tipX: number, tipY: number, wick: DOMRect, play: DOMRect): boolean {
  const absX = play.left + tipX
  const absY = play.top + tipY
  const cx = wick.left + wick.width / 2
  const cy = wick.top + wick.height / 2
  const radius = Math.max(wick.width, wick.height) * 0.9 + 22
  const dx = absX - cx
  const dy = absY - cy
  return dx * dx + dy * dy <= radius * radius
}

/**
 * Annakut unveiling: unlit diya, a button that brings out a burning fuljadi
 * at the bottom of the page to play with, then drag it onto the wick to light.
 */
export function DiyaLighting({ onLit }: { onLit?: () => void }) {
  const { t } = useI18n()
  const reducedMotion = usePrefersReducedMotion()
  const playRef = useRef<HTMLDivElement>(null)
  const wickRef = useRef<HTMLSpanElement>(null)
  const [lit, setLit] = useState(readLit)
  const [fuljadiOut, setFuljadiOut] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const posRef = useRef(pos)
  const draggingRef = useRef(false)
  const litRef = useRef(lit)
  const onLitRef = useRef(onLit)
  onLitRef.current = onLit
  posRef.current = pos
  litRef.current = lit

  const lightDiya = useCallback(() => {
    if (litRef.current) return
    writeLit()
    litRef.current = true
    setLit(true)
    setLeaving(true)
    draggingRef.current = false
    setDragging(false)
    onLitRef.current?.()
    window.setTimeout(() => {
      setFuljadiOut(false)
      setLeaving(false)
    }, 420)
  }, [])

  useEffect(() => {
    // Automated browsers skip the ritual so e2e can reach Bhulkao / Yuvako.
    if (navigator.webdriver && !lit) {
      writeLit()
      setLit(true)
      onLitRef.current?.()
    }
  }, [lit])

  /** Bottom-center of the viewport playfield — room to wave the fuljadi. */
  function restFuljadiAtBottom() {
    const play = playRef.current
    const width = play?.clientWidth || window.innerWidth
    const height = play?.clientHeight || window.innerHeight
    return {
      x: width / 2,
      y: Math.max(height - 100, height * 0.82),
    }
  }

  function summonFuljadi() {
    if (lit) return
    if (reducedMotion) {
      lightDiya()
      return
    }
    setFuljadiOut(true)
    // Wait a frame so the playfield is mounted and measurable.
    requestAnimationFrame(() => {
      const next = restFuljadiAtBottom()
      posRef.current = next
      setPos(next)
    })
  }

  function moveTipTo(clientX: number, clientY: number) {
    const play = playRef.current
    const wick = wickRef.current
    if (!play || !wick || litRef.current) return
    const rect = play.getBoundingClientRect()
    const next = {
      x: Math.min(Math.max(clientX - rect.left - dragOffset.current.x, 24), rect.width - 24),
      y: Math.min(Math.max(clientY - rect.top - dragOffset.current.y, 24), rect.height - 24),
    }
    posRef.current = next
    setPos(next)
    if (tipNearWick(next.x, next.y, wick.getBoundingClientRect(), rect)) {
      lightDiya()
    }
  }

  function onFuljadiPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (lit || leaving) return
    event.preventDefault()
    const play = playRef.current
    if (!play) return
    const rect = play.getBoundingClientRect()
    dragOffset.current = {
      x: event.clientX - rect.left - posRef.current.x,
      y: event.clientY - rect.top - posRef.current.y,
    }
    draggingRef.current = true
    setDragging(true)

    const pointerId = event.pointerId
    const target = event.currentTarget
    target.setPointerCapture(pointerId)

    function onMove(ev: PointerEvent) {
      if (!draggingRef.current) return
      moveTipTo(ev.clientX, ev.clientY)
    }

    function onUp() {
      draggingRef.current = false
      setDragging(false)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      try {
        target.releasePointerCapture(pointerId)
      } catch {
        /* already released */
      }
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  return (
    <>
      <div className={styles.stage} data-testid="diya-lighting" data-lit={lit ? 'true' : 'false'}>
        <div className={styles.diyaWrap}>
          <DiyaLamp lit={lit} />
          <span ref={wickRef} className={styles.wickHit} data-testid="diya-wick-hit" />
        </div>

        {!lit && !fuljadiOut && (
          <>
            <p className={styles.hint}>{t('intro.diya.hint')}</p>
            <button
              type="button"
              className={styles.lightBtn}
              onClick={summonFuljadi}
              data-testid="light-diya"
            >
              {t('intro.diya.light')}
            </button>
          </>
        )}

        {!lit && fuljadiOut && !leaving && (
          <p className={styles.dragHint}>{t('intro.diya.drag')}</p>
        )}

        {lit && <p className={styles.litNote}>{t('intro.diya.lit')}</p>}
      </div>

      {fuljadiOut && (
        <div ref={playRef} className={styles.playfield} data-testid="fuljadi-playfield" aria-hidden>
          <Fuljadi
            x={pos.x}
            y={pos.y}
            label={t('intro.diya.fuljadi')}
            dragging={dragging}
            leaving={leaving}
            popping
            onPointerDown={onFuljadiPointerDown}
          />
        </div>
      )}
    </>
  )
}

/** True when this tab has already lit the intro diya (or e2e auto-lit). */
export function isDiyaLit(): boolean {
  return readLit()
}
