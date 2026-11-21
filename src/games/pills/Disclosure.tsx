import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import styles from './Insight.module.css'

/**
 * A closed row that opens to show more: the browser's own details element, so
 * it works by keyboard and with screen readers, and "find in page" opens it.
 */
export function Disclosure({
  label,
  testId,
  children,
}: {
  label: string
  testId?: string
  children: ReactNode
}) {
  return (
    <details className={styles.more} data-testid={testId}>
      <summary className={styles.moreSummary}>
        <span>{label}</span>
        <Icon name="arrow-right" size={18} className={styles.chevron} />
      </summary>
      <div className={styles.moreBody}>{children}</div>
    </details>
  )
}
