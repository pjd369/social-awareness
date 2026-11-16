import { useI18n } from '../../i18n/context'
import { Icon } from '../../components/Icon'
import type { GreenPage } from '../../content/schemas'
import { InsightVisual } from './InsightVisual'
import { Loc } from './Loc'
import { References } from './References'
import styles from './Insight.module.css'
import card from './PillGame.module.css'

/** One green pill page: title, point, diagram, what to do and why it helps together, then references. */
export function GreenPillPage({ data }: { data: GreenPage }) {
  const { t } = useI18n()
  return (
    <article className={`${card.card} ${card.greenCard}`} data-testid="green-page">
      <Loc field={data.title} as="h3" />
      <Loc field={data.text} as="p" />
      {data.visual && <InsightVisual data={data.visual} />}
      <section className={styles.takeHelp} data-testid="action-why">
        <h3 className={styles.boxHeading}>
          <Icon name="check" size={20} />
          {t('pills.green.action')}
        </h3>
        <Loc field={data.action} as="p" />
        <h3 className={styles.boxHeading}>
          <Icon name="lightbulb" size={20} />
          {t('pills.green.why')}
        </h3>
        <Loc field={data.why} as="p" />
      </section>
      <References sources={[data.source, ...data.moreSources]} />
    </article>
  )
}
