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

function tipTouchesFlame(
  tipX: number,
  tipY: number,
  flame: DOMRect,
  stage: DOMRect,
): boolean {
  const absX = stage.left + tipX
  const absY = stage.top + tipY
  const pad = 18
  return (
    absX >= flame.left - pad &&
    absX <= flame.right + pad &&
    absY >= flame.top - pad &&
    absY <= flame.bottom + pad
  )
}

/**
 * Annakut unveiling: unlit diya, a button that brings out a burning fuljadi,
 * then drag the fuljadi onto the diya to light it. The fuljadi leaves once lit.
 */
export function DiyaLighting({ onLit }: { onLit?: () => void }) {
  const { t } = useI18n()
  const reducedMotion = usePrefersReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const flameRef = useRef<HTMLSpanElement>(null)
  const [lit, setLit] = useState(readLit)
  const [fuljadiOut, setFuljadiOut] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const onLitRef = useRef(onLit)
  onLitRef.current = onLit

  const lightDiya = useCallback(() => {
    writeLit()
    setLit(true)
    setLeaving(true)
    onLitRef.current?.()
    window.setTimeout(() => {
      setFuljadiOut(false)
      setLeaving(false)
      setDragging(false)
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

  function restFuljadi() {
    const stage = stageRef.current
    if (!stage) return { x: 0, y: 0 }
    const { width, height } = stage.getBoundingClientRect()
    return { x: width * 0.86, y: height * 0.42 }
  }

  function summonFuljadi() {
    if (lit) return
    // Reduced motion: light immediately — no drag required.
    if (reducedMotion) {
      lightDiya()
      return
    }
    setPos(restFuljadi())
    setFuljadiOut(true)
  }

  function onFuljadiPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (lit || leaving) return
    event.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    dragOffset.current = {
      x: event.clientX - rect.left - pos.x,
      y: event.clientY - rect.top - pos.y,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onStagePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || lit) return
    const stage = stageRef.current
    const flame = flameRef.current
    if (!stage || !flame) return
    const rect = stage.getBoundingClientRect()
    const next = {
      x: Math.min(Math.max(event.clientX - rect.left - dragOffset.current.x, 8), rect.width - 8),
      y: Math.min(Math.max(event.clientY - rect.top - dragOffset.current.y, 8), rect.height - 8),
    }
    setPos(next)
    if (tipTouchesFlame(next.x, next.y, flame.getBoundingClientRect(), rect)) {
      setDragging(false)
      lightDiya()
    }
  }

  function onStagePointerUp() {
    if (!dragging) return
    setDragging(false)
  }

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-testid="diya-lighting"
      data-lit={lit ? 'true' : 'false'}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
    >
      <div className={styles.diyaWrap}>
        <DiyaLamp lit={lit} />
        <span ref={flameRef} className={styles.flameHit} data-testid="diya-flame-hit" />
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

      {fuljadiOut && (
        <Fuljadi
          x={pos.x}
          y={pos.y}
          label={t('intro.diya.fuljadi')}
          dragging={dragging}
          leaving={leaving}
          onPointerDown={onFuljadiPointerDown}
        />
      )}
    </div>
  )
}

/** True when this tab has already lit the intro diya (or e2e auto-lit). */
export function isDiyaLit(): boolean {
  return readLit()
}
