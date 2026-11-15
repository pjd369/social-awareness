import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { FamilyArt, YouthArt } from '../components/Art'
import { DiyaLamp } from '../components/DiyaLamp'
import { EventTitle } from '../components/EventTitle'
import { SectionCard } from '../components/SectionCard'
import { SECTIONS, paths } from '../config/sections'
import { INTRO_COPY_IS_PLACEHOLDER } from '../config/site'
import { PlaceholderNotice } from '../components/Placeholder'
import styles from './pages.module.css'

export default function Intro() {
  const { t } = useI18n()
  usePage(t('site.event'))
  return (
    <>
      <div className={styles.hero}>
        <DiyaLamp className={styles.heroLamp} />
        <EventTitle />
        <p className={styles.heroLine}>{t('site.title')}</p>
        <p className={styles.heroValue}>{t('site.value')}</p>
        <p className={styles.heroTheme}>{t('site.theme')}</p>
      </div>
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
    </>
  )
}
