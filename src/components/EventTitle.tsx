import { useI18n } from '../i18n/context'
import styles from './EventTitle.module.css'

/** "Annakut / Mahotsav 2026" in the festival serif, with the second word in gold. */
export function EventTitle({
  as: Tag = 'h1',
  id,
  className,
}: {
  as?: 'h1' | 'p'
  id?: string
  className?: string
}) {
  const { t } = useI18n()
  return (
    <Tag id={id} className={[styles.title, className].filter(Boolean).join(' ')}>
      {t('site.eventFirst')}{' '}
      <em>
        {t('site.eventSecond')} <span className={styles.year}>{t('site.eventYear')}</span>
      </em>
    </Tag>
  )
}
