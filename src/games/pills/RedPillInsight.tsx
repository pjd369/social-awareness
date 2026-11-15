import { useI18n } from '../../i18n/context'
import { Icon } from '../../components/Icon'
import type { PillCard } from '../../content/schemas'
import { ImpactByAge } from './ImpactByAge'
import { InsightVisual } from './InsightVisual'
import { Loc } from './Loc'
import { References } from './References'
import styles from './Insight.module.css'
import card from './PillGame.module.css'

/** A finished red card: title, point, diagram, takeaway and help together, impact by age, references. */
export function RedPillInsight({ data }: { data: PillCard }) {
  const { t } = useI18n()
  const sources = [data.source, ...data.moreSources].filter((s) => s !== null)
  return (
    <article className={card.card} data-testid="red-insight">
      {data.title && <Loc field={data.title} as="h3" />}
      <Loc field={data.text} as="p" />
      {data.visual && <InsightVisual data={data.visual} />}
      {(data.takeaway || data.recommendation) && (
        <section className={styles.takeHelp} data-testid="takeaway-help">
          {data.takeaway && (
            <>
              <h3 className={styles.boxHeading}>
                <Icon name="lightbulb" size={20} />
                {t('pills.takeaway')}
              </h3>
              <Loc field={data.takeaway} as="p" />
            </>
          )}
          {data.recommendation && (
            <>
              <h3 className={styles.boxHeading}>
                <Icon name="check" size={20} />
                {t('pills.help')}
              </h3>
              <Loc field={data.recommendation} as="p" />
            </>
          )}
        </section>
      )}
      {data.audienceImpacts && <ImpactByAge impacts={data.audienceImpacts} />}
      <References sources={sources} />
    </article>
  )
}
