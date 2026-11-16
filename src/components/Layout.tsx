import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useI18n } from '../i18n/context'
import { GAMES, sectionFromPath } from '../config/sections'
import { Header } from './Header'
import { Footer } from './Footer'
import { Fireworks } from './Fireworks'
import { PageContext, type PageInfo } from './page-context'
import { focusMainHeading } from './focus'
import { introMotionAllowed } from './intro-motion'
import { PreviewStrip } from './Placeholder'
import { siteHasPlaceholders } from '../content'
import styles from './Layout.module.css'

export function Layout() {
  const { t } = useI18n()
  const location = useLocation()
  const [page, setPage] = useState<PageInfo>({ title: '' })
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)
  const section = sectionFromPath(location.pathname)
  const siteTitle = t('site.title')
  // The pill game page does not show the "This site is a preview" strip.
  const onPillGame = location.pathname.replace(/\/+$/, '').endsWith(`/activity/${GAMES.pills.slug}`)
  const [intro] = useState(introMotionAllowed)

  useEffect(() => {
    document.title =
      page.title && page.title !== siteTitle ? `${page.title} · ${siteTitle}` : siteTitle
  }, [page.title, siteTitle])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    const frame = requestAnimationFrame(() => focusMainHeading(mainRef.current))
    return () => cancelAnimationFrame(frame)
  }, [location.pathname])

  return (
    <div
      className={styles.app}
      data-section={section ?? 'home'}
      data-intro={intro ? 'play' : undefined}
    >
      <a href="#main" className={styles.skip}>
        {t('nav.skip')}
      </a>
      <Header back={page.back} />
      {siteHasPlaceholders() && !onPillGame && <PreviewStrip />}
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <PageContext.Provider value={setPage}>
          <Outlet />
        </PageContext.Provider>
      </main>
      <Footer />
      {intro && <Fireworks />}
    </div>
  )
}
