import { useEffect, useRef, useState, type RefObject } from 'react'
import { useI18n } from '../../i18n/context'
import { Icon } from '../../components/Icon'
import type { PillBlue } from '../../content/schemas'
import { Loc } from './Loc'
import styles from './Blackout.module.css'

/**
 * The blue pill's blackout: a full-screen dark dialog with a calm message,
 * with no time limit: it stays until the person chooses Continue (or presses
 * Escape), so they can read at their own pace. Tapping the screen does not
 * skip it. The message is read out through a status region. It fades in
 * gently, and not at all with reduced motion.
 */
export function BlackoutScreen({
  content,
  headingRef,
  onDone,
}: {
  content: PillBlue['blackout']
  headingRef: RefObject<HTMLHeadingElement | null>
  onDone: () => void
}) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [announced, setAnnounced] = useState(false)

  // A modal dialog covers the whole screen and keeps the page behind it out of reach.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  // The message is added to the status region just after it opens, so screen readers announce it.
  useEffect(() => {
    const id = window.setTimeout(() => setAnnounced(true), 150)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.blackout}
      aria-labelledby="blackout-title"
      onCancel={(e) => {
        e.preventDefault()
        onDone()
      }}
      data-testid="blackout"
    >
      <h2 id="blackout-title" ref={headingRef} className="visually-hidden">
        {t('pills.blue.title')}
      </h2>
      <div className={styles.inner}>
        <div role="status" className={styles.message}>
          {announced && (
            <>
              <Loc field={content.message} as="p" />
              <Loc field={content.note} as="p" />
            </>
          )}
        </div>
        <button type="button" className={styles.continue} onClick={onDone}>
          {t('pills.continue')}
          <Icon name="arrow-right" size={20} />
        </button>
      </div>
    </dialog>
  )
}
