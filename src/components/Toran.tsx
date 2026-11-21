import marigoldToran from '../assets/brand/marigold-toran.png'
import styles from './Toran.module.css'

/** Festive marigold toran under the Harisumiran header. Decorative. */
export function Toran({ className }: { className?: string }) {
  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      <img
        className={styles.art}
        src={marigoldToran}
        alt=""
        width={1648}
        height={474}
        decoding="async"
        draggable={false}
      />
    </div>
  )
}
