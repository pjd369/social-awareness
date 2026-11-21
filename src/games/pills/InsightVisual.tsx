import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { localizedLang } from '../../i18n/localized'
import { Icon } from '../../components/Icon'
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

/**
 * Numbered steps, shown one at a time: "Then what?" brings in the next one.
 * Every step keeps its place from the start, so the button does not move as
 * the steps appear. Each new step is also read out.
 */
function Timeline({ data }: { data: Extract<InsightVisualData, { type: 'timeline' }> }) {
  const { t, l } = useI18n()
  const [shown, setShown] = useState(1)
  const total = data.steps.length
  const done = shown >= total
  const latest = data.steps[shown - 1]
  return (
    <>
      <ol className={styles.steps}>
        {data.steps.map((step, i) => {
          const visible = i < shown
          return (
            <li
              key={i}
              className={visible ? styles.step : `${styles.step} ${styles.stepWaiting}`}
              aria-hidden={visible ? undefined : true}
            >
              <span className={styles.stepNo}>{i + 1}</span>
              <span className="visually-hidden">{t('pills.visual.step', { n: i + 1 })}: </span>
              <Loc field={step} className={styles.stepText} />
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        className={styles.reveal}
        onClick={() => setShown(done ? 1 : shown + 1)}
        data-testid="timeline-next"
      >
        <Icon name={done ? 'restart' : 'arrow-right'} size={18} />
        {done ? t('pills.visual.again') : t('pills.visual.then')}
      </button>
      <p className="visually-hidden" aria-live="polite">
        {shown > 1 && latest ? `${t('pills.visual.step', { n: shown })}: ${l(latest)}` : ''}
      </p>
    </>
  )
}

type SwapSide = 'before' | 'after'

/** A habit and a swap, one at a time: "Often" and "Try instead" switch between them. */
function BeforeAfter({ data }: { data: Extract<InsightVisualData, { type: 'before-after' }> }) {
  const { t } = useI18n()
  const [side, setSide] = useState<SwapSide>('before')
  return (
    <div className={styles.swap}>
      <div className={styles.swapToggle}>
        {(['before', 'after'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={styles.swapButton}
            aria-pressed={side === s}
            onClick={() => setSide(s)}
          >
            {t(`pills.visual.${s}`)}
          </button>
        ))}
      </div>
      {/* Both boxes share one space, so the card keeps its height when they switch. */}
      <div className={styles.swapStack}>
        {(['before', 'after'] as const).map((s) => (
          <div
            key={s}
            className={`${styles.swapBox} ${s === 'before' ? styles.swapBefore : styles.swapAfter}`}
            data-active={side === s}
            aria-hidden={side === s ? undefined : true}
          >
            <p className={styles.swapTitle}>
              <Loc field={data[s].title} />
            </p>
            <p>
              <Loc field={data[s].text} />
            </p>
          </div>
        ))}
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

/** The diagrams with buttons in them. The others are a single picture. */
const INTERACTIVE: InsightVisualData['type'][] = ['timeline', 'before-after']

/**
 * One of a few simple diagrams, chosen by the card's visual.type. A diagram
 * without buttons is announced as one image with the card's own alt text. One
 * with buttons is a group named by that text, so its buttons can be reached.
 * Everything visible in a diagram is also text, so colour is never the only
 * signal. `tone` matches the diagram's accent to the pill.
 */
export function InsightVisual({
  data,
  tone = 'red',
}: {
  data: InsightVisualData
  tone?: 'red' | 'green'
}) {
  const { l, lang } = useI18n()
  return (
    <figure
      className={styles.visual}
      role={INTERACTIVE.includes(data.type) ? 'group' : 'img'}
      aria-label={l(data.alt)}
      lang={localizedLang(data.alt, lang)}
      data-visual={data.type}
      data-tone={tone}
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
