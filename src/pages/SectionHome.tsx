import { useI18n } from '../i18n/context'
import { usePage } from '../components/page-context'
import { Card, CardItem, CardList } from '../components/Card'
import { GameArt, PrasangArt, StoryArt } from '../components/Art'
import { PlaceholderNotice } from '../components/Placeholder'
import { AUDIENCE_SECTIONS, SECTIONS, paths, type SectionId } from '../config/sections'
import { partHasPlaceholders } from '../content'
import { gameIsPlaceholder } from '../content/games'
import styles from './pages.module.css'

export default function SectionHome({ section }: { section: SectionId }) {
  const { t } = useI18n()
  const config = SECTIONS[section]
  usePage(t(config.nameKey), { to: paths.home(), label: t('nav.home') })
  const showParts = !config.placeholder || config.games.length > 0
  const activityPlaceholder = AUDIENCE_SECTIONS.some((id) =>
    SECTIONS[id].games.some(gameIsPlaceholder),
  )
  const storyPlaceholder = AUDIENCE_SECTIONS.some((id) => partHasPlaceholders(id, 'story'))
  const prasangPlaceholder = AUDIENCE_SECTIONS.some((id) => partHasPlaceholders(id, 'prasang'))
  return (
    <>
      <h1>{t(config.nameKey)}</h1>
      <p className={styles.lead}>{t(config.leadKey)}</p>
      {config.placeholder && <PlaceholderNotice />}
      {showParts && (
        <CardList>
          <CardItem>
            <Card
              to={paths.activityHub()}
              title={t('part.activity.title')}
              description={t(config.activityDescKey)}
              art={<GameArt />}
              placeholder={activityPlaceholder}
            />
          </CardItem>
          <CardItem>
            <Card
              to={paths.scenarioHub()}
              title={t(config.storyTitleKey)}
              description={t(config.storyDescKey)}
              art={<StoryArt />}
              placeholder={storyPlaceholder}
            />
          </CardItem>
          <CardItem>
            <Card
              to={paths.prasangHub()}
              title={t('part.prasang.title')}
              description={t('part.prasang.desc')}
              art={<PrasangArt />}
              placeholder={prasangPlaceholder}
            />
          </CardItem>
        </CardList>
      )}
    </>
  )
}
