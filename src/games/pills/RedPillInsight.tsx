import { useI18n } from '../../i18n/context'
import { Icon } from '../../components/Icon'
import type { PillCard } from '../../content/schemas'
import { Disclosure } from './Disclosure'
import { ImpactByAge } from './ImpactByAge'
import { InsightVisual } from './InsightVisual'
import { Loc } from './Loc'
import { References } from './References'
import styles from './Insight.module.css'
import card from './PillGame.module.css'

/**
 * A finished red card. The headline, the diagram and the key takeaway are
 * shown; what can help, the fuller text with the impact by age, and the
 * references each open when asked for.
 */
export function RedPillInsight({ data }: { data: PillCard }) {
  const { t } = useI18n()
  const sources = [data.source, ...data.moreSources].filter((s) => s !== null)
  return (
    <article className={card.card} data-testid="red-insight">
      {data.title && <Loc field={data.title} as="h3" className={styles.headline} />}
      {data.visual && <InsightVisual data={data.visual} />}
      {data.takeaway && (
        <section className={styles.keyBox} data-testid="takeaway">
          <h4 className={styles.boxHeading}>
            <Icon name="lightbulb" size={20} />
            {t('pills.takeaway')}
          </h4>
          <Loc field={data.takeaway} as="p" />
        </section>
      )}
      {data.recommendation && (
        <Disclosure label={t('pills.help')} testId="help">
          <Loc field={data.recommendation} as="p" />
        </Disclosure>
      )}
      <Disclosure label={t('pills.more')} testId="more">
        <Loc field={data.text} as="p" />
        {data.audienceImpacts && <ImpactByAge impacts={data.audienceImpacts} />}
      </Disclosure>
      <References sources={sources} />
    </article>
  )
}
