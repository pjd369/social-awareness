import { useI18n } from '../../i18n/context'
import { localizedLang } from '../../i18n/localized'
import { IMPACT_GROUPS, type ImpactGroup, type InsightVisualData } from '../../content/schemas'
import { Loc } from './Loc'
import styles from './Insight.module.css'

const SEGMENTS = { lower: 1, moderate: 2, higher: 3 } as const

/** A small person shape: the child is smaller, the older adult carries a stick. Decorative: the text beside it says who it is. */
export function GroupGlyph({ group }: { group: ImpactGroup }) {
  const head = group === 'children' ? 5 : 6
  const top = group === 'children' ? 14 : 8
  return (
    <svg className={styles.glyph} viewBox="0 0 32 40" aria-hidden="true" focusable="false">
      <circle cx="14" cy={top + head} r={head} fill="currentColor" />
      <path
        d={`M14 ${top + head * 2 + 2}v${group === 'children' ? 10 : 14}M6 ${top + head * 2 + 6}h16`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d={`M14 ${top + head * 2 + (group === 'children' ? 12 : 16)}l-5 ${group === 'children' ? 9 : 10}M14 ${top + head * 2 + (group === 'children' ? 12 : 16)}l5 ${group === 'children' ? 9 : 10}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ImpactBars({ data }: { data: Extract<InsightVisualData, { type: 'impact-bars' }> }) {
  const { t } = useI18n()
  return (
    <>
      <ul className={styles.bars}>
        {IMPACT_GROUPS.map((g) => {
          const level = data.values[g]
          const filled = SEGMENTS[level]
          return (
            <li key={g} className={styles.barRow}>
              <span className={styles.barWho}>
                <GroupGlyph group={g} />
                {t(`pills.audience.${g}`)}
              </span>
              <span className={styles.segments}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= filled ? styles.segOn : styles.segOff} />
                ))}
              </span>
              <span className={styles.barLevel}>
                {t(`pills.level.${level}`)} ({t('pills.level.segments', { n: filled })})
              </span>
            </li>
          )
        })}
      </ul>
      <p className={styles.caption}>{t('pills.visual.guide')}</p>
    </>
  )
}

function Timeline({ data }: { data: Extract<InsightVisualData, { type: 'timeline' }> }) {
  const { t } = useI18n()
  return (
    <ol className={styles.steps}>
      {data.steps.map((step, i) => (
        <li key={i} className={styles.step}>
          <span className={styles.stepNo}>{i + 1}</span>
          <span className="visually-hidden">{t('pills.visual.step', { n: i + 1 })}: </span>
          <Loc field={step} />
        </li>
      ))}
    </ol>
  )
}

function BeforeAfter({ data }: { data: Extract<InsightVisualData, { type: 'before-after' }> }) {
  const { t } = useI18n()
  return (
    <div className={styles.swap}>
      <div className={`${styles.swapBox} ${styles.swapBefore}`}>
        <p className={styles.swapTag}>{t('pills.visual.before')}</p>
        <p className={styles.swapTitle}>
          <Loc field={data.before.title} />
        </p>
        <p>
          <Loc field={data.before.text} />
        </p>
      </div>
      <span className={styles.swapArrow} aria-hidden="true">
        →
      </span>
      <div className={`${styles.swapBox} ${styles.swapAfter}`}>
        <p className={styles.swapTag}>{t('pills.visual.after')}</p>
        <p className={styles.swapTitle}>
          <Loc field={data.after.title} />
        </p>
        <p>
          <Loc field={data.after.text} />
        </p>
      </div>
    </div>
  )
}

function GroupCompare({ data }: { data: Extract<InsightVisualData, { type: 'group-compare' }> }) {
  const { t } = useI18n()
  return (
    <ul className={styles.groups}>
      {IMPACT_GROUPS.map((g) => (
        <li key={g} className={styles.group}>
          <GroupGlyph group={g} />
          <span className={styles.groupName}>{t(`pills.audience.${g}`)}</span>
          <Loc field={data.labels[g]} />
        </li>
      ))}
    </ul>
  )
}

/**
 * One of a few simple diagrams, chosen by the card's visual.type. The figure
 * is announced as one image with the card's own alt text; everything visible
 * in it is also text, so colour is never the only signal.
 */
export function InsightVisual({ data }: { data: InsightVisualData }) {
  const { l, lang } = useI18n()
  return (
    <figure
      className={styles.visual}
      role="img"
      aria-label={l(data.alt)}
      lang={localizedLang(data.alt, lang)}
      data-visual={data.type}
    >
      <div lang={lang}>
        {data.type === 'impact-bars' && <ImpactBars data={data} />}
        {data.type === 'timeline' && <Timeline data={data} />}
        {data.type === 'before-after' && <BeforeAfter data={data} />}
        {data.type === 'group-compare' && <GroupCompare data={data} />}
      </div>
    </figure>
  )
}
