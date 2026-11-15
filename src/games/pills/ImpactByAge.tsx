import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../../i18n/context'
import { IMPACT_GROUPS, type ImpactGroup, type PillCard } from '../../content/schemas'
import { GroupGlyph } from './InsightVisual'
import { Loc } from './Loc'
import styles from './Insight.module.css'

/** Tabs for Children, Adults and Older adults. Arrow keys, Home and End move between them. */
export function ImpactByAge({ impacts }: { impacts: NonNullable<PillCard['audienceImpacts']> }) {
  const { t } = useI18n()
  const [active, setActive] = useState<ImpactGroup>('children')
  const base = useId()
  const refs = useRef<Partial<Record<ImpactGroup, HTMLButtonElement | null>>>({})

  const move = (e: KeyboardEvent, index: number) => {
    const last = IMPACT_GROUPS.length - 1
    const target =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (index + 1) % IMPACT_GROUPS.length
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (index + last) % IMPACT_GROUPS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1
    if (target < 0) return
    e.preventDefault()
    const group = IMPACT_GROUPS[target] as ImpactGroup
    setActive(group)
    refs.current[group]?.focus()
  }

  return (
    <section className={styles.age} aria-labelledby={`${base}-title`}>
      <h3 id={`${base}-title`} className={styles.subheading}>
        {t('pills.ageTitle')}
      </h3>
      <div role="tablist" className={styles.tabs} aria-labelledby={`${base}-title`}>
        {IMPACT_GROUPS.map((g, i) => (
          <button
            key={g}
            ref={(el) => {
              refs.current[g] = el
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${g}`}
            aria-selected={active === g}
            aria-controls={`${base}-panel`}
            tabIndex={active === g ? 0 : -1}
            className={styles.tab}
            onClick={() => setActive(g)}
            onKeyDown={(e) => move(e, i)}
          >
            <GroupGlyph group={g} />
            {t(`pills.audience.${g}`)}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
        className={styles.panel}
      >
        <Loc field={impacts[active]} as="p" />
      </div>
    </section>
  )
}
