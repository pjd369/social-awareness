import { useI18n } from '../../i18n/context'
import { Icon } from '../../components/Icon'
import type { GreenPage } from '../../content/schemas'
import { Disclosure } from './Disclosure'
import { InsightVisual } from './InsightVisual'
import { Loc } from './Loc'
import { References } from './References'
import styles from './Insight.module.css'
import card from './PillGame.module.css'

/** The "I'll try this" button: pressed once the visitor has put the solution on their plan. */
export function TryButton({ tried, onToggle }: { tried: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  return (
    <button type="button" className={styles.tryButton} aria-pressed={tried} onClick={onToggle}>
      <span className={styles.tick} aria-hidden="true">
        <Icon name="check" size={18} />
      </span>
      {t('pills.green.try')}
    </button>
  )
}

/**
 * One green pill page. The headline, the diagram and what to do are shown,
 * with a button to put it on the visitor's plan; why it helps and the
 * references open when asked for.
 */
export function GreenPillPage({
  data,
  tried,
  onToggleTry,
}: {
  data: GreenPage
  tried: boolean
  onToggleTry: () => void
}) {
  const { t } = useI18n()
  return (
    <article className={`${card.card} ${card.greenCard}`} data-testid="green-page">
      <Loc field={data.title} as="h3" className={styles.headline} />
      {data.visual && <InsightVisual data={data.visual} tone="green" />}
      <section className={styles.keyBox} data-testid="action">
        <h4 className={styles.boxHeading}>
          <Icon name="check" size={20} />
          {t('pills.green.action')}
        </h4>
        <Loc field={data.action} as="p" />
        <TryButton tried={tried} onToggle={onToggleTry} />
      </section>
      <Disclosure label={t('pills.green.why')} testId="why">
        <Loc field={data.text} as="p" />
        <Loc field={data.why} as="p" />
      </Disclosure>
      <References sources={[data.source, ...data.moreSources]} />
    </article>
  )
}
