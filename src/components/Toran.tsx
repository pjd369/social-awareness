import styles from './Toran.module.css'

const STRANDS = 12

/** A marigold toran: strands of marigolds between pairs of mango leaves. Decorative. */
export function Toran({ className }: { className?: string }) {
  return (
    <div className={[styles.toran, className].filter(Boolean).join(' ')} aria-hidden="true">
      {Array.from({ length: STRANDS }, (_, i) => (
        <span key={i}>
          <i />
          <b />
          <i />
        </span>
      ))}
    </div>
  )
}
