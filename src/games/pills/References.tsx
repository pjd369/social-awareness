import { useI18n } from '../../i18n/context'
import { ExternalLink } from '../../components/ExternalLink'
import type { PillCard } from '../../content/schemas'
import styles from './Insight.module.css'

type Source = NonNullable<PillCard['source']>

/** One IEEE-style reference. The texts above cite it as [n]. References stay in the language of the original work. */
function Reference({ n, source }: { n: number; source: Source }) {
  const { t } = useI18n()
  return (
    <li className={styles.reference} value={n}>
      <span className={styles.refNumber}>[{n}]</span> <span lang="en">{source.citation}</span>
      {source.url && (
        <>
          {' '}
          <span lang="en">{t('pills.ref.available')}</span>{' '}
          <ExternalLink href={source.url}>{source.url}</ExternalLink>
        </>
      )}
    </li>
  )
}

/** The numbered reference list at the end of a red card or green page. */
export function References({ sources }: { sources: Source[] }) {
  const { t } = useI18n()
  return (
    <section className={styles.sources}>
      <h3 className={styles.subheading}>{t('pills.sourcesLabel')}</h3>
      <ol className={styles.refList}>
        {sources.map((s, i) => (
          <Reference key={i} n={i + 1} source={s} />
        ))}
      </ol>
    </section>
  )
}
