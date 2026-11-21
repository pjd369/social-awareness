import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'
import { PlaceholderTag } from './Placeholder'
import styles from './SectionCard.module.css'

interface SectionCardProps {
  to: string
  /** Position on the page, shown as "01", "02". */
  index: number
  title: string
  /** Label of the button-styled call to action, e.g. "Explore". */
  action: string
  art: ReactNode
  /** Shows the Placeholder badge while this section has no finished content. */
  placeholder?: boolean
}

/** One of the main sections on the home page. The whole card is the link. */
export function SectionCard({ to, index, title, action, art, placeholder }: SectionCardProps) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.art}>{art}</span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.eyebrow}>
          <span className={styles.badge} aria-hidden="true">
            {String(index).padStart(2, '0')}
          </span>
        </span>
        {placeholder && (
          <span className={styles.tag}>
            <PlaceholderTag />
          </span>
        )}
        <span className={styles.action}>
          {action}
          <Icon name="arrow-right" size={18} />
        </span>
      </span>
    </Link>
  )
}
