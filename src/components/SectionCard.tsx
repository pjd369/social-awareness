import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'
import styles from './SectionCard.module.css'

interface SectionCardProps {
  to: string
  /** Position on the page, shown as "01", "02". */
  index: number
  /** Who the section is for, e.g. "Kids". */
  audience: string
  title: string
  /** Label of the button-styled call to action, e.g. "Explore". */
  action: string
  art: ReactNode
}

/** One of the two main sections on the home page. The whole card is the link. */
export function SectionCard({ to, index, audience, title, action, art }: SectionCardProps) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.art}>{art}</span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.eyebrow}>
          <span className={styles.badge} aria-hidden="true">
            {String(index).padStart(2, '0')}
          </span>
          {audience}
        </span>
        <span className={styles.action}>
          {action}
          <Icon name="arrow-right" size={18} />
        </span>
      </span>
    </Link>
  )
}
