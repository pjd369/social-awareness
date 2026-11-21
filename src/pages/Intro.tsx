import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { FamilyArt, YouthArt } from '../components/Art'
import { DiyaLighting, isDiyaLit } from '../components/DiyaLighting'
import { Fireworks } from '../components/Fireworks'
import { introMotionAllowed } from '../components/intro-motion'
import { EventTitle } from '../components/EventTitle'
import { SectionCard } from '../components/SectionCard'
import { SECTIONS, paths } from '../config/sections'
import { INTRO_COPY_IS_PLACEHOLDER } from '../config/site'
import { PlaceholderNotice } from '../components/Placeholder'
import styles from './pages.module.css'

export default function Intro() {
  const { t } = useI18n()
  usePage(t('site.event'))
  const [unveiled, setUnveiled] = useState(isDiyaLit)
  /** Fresh lighting only — not when the tab already had the diya lit. */
  const [fireworks, setFireworks] = useState(false)

  function onDiyaLit() {
    setUnveiled(true)
    if (introMotionAllowed()) setFireworks(true)
  }

  return (
    <>
      {fireworks && <Fireworks />}
      <div className={styles.hero}>
        <DiyaLighting onLit={onDiyaLit} />
        <EventTitle />
        <p className={styles.heroLine}>{t('site.title')}</p>
        <p className={styles.heroValue} data-testid="atmiyata">
          {t('site.value')}
        </p>
        <p className={styles.heroTheme}>
          {t('site.theme.lead')}
          <span data-harmony data-testid="harmony">
            {t('site.theme.focus')}
          </span>
        </p>
      </div>

      <div
        className={styles.unveil}
        data-unveiled={unveiled ? 'true' : 'false'}
        {...(!unveiled ? { inert: true, 'aria-hidden': true } : {})}
      >
        {INTRO_COPY_IS_PLACEHOLDER && <PlaceholderNotice />}
        <div className={styles.divider}>
          <span aria-hidden="true" />
          <p>{t('intro.lead')}</p>
          <span aria-hidden="true" />
        </div>
        <ul className={styles.sections}>
          <li>
            <SectionCard
              to={paths.section('bhulkao')}
              index={1}
              audience={t('intro.bhulkao.audience')}
              title={t(SECTIONS.bhulkao.nameKey)}
              action={t('intro.explore')}
              art={<FamilyArt />}
            />
          </li>
          <li>
            <SectionCard
              to={paths.section('yuvako')}
              index={2}
              audience={t('intro.yuvako.audience')}
              title={t(SECTIONS.yuvako.nameKey)}
              action={t('intro.explore')}
              art={<YouthArt />}
            />
          </li>
        </ul>
      </div>
    </>
  )
}
