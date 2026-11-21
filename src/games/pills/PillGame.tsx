import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type HTMLAttributes,
  type TouchEvent,
} from 'react'
import { useI18n } from '../../i18n/context'
import { localizedLang } from '../../i18n/localized'
import { Icon } from '../../components/Icon'
import { ExternalLink } from '../../components/ExternalLink'
import { ContentError } from '../../components/ContentError'
import { PlaceholderNotice } from '../../components/Placeholder'
import { Fireworks } from '../../components/Fireworks'
import { focusElement } from '../../components/focus'
import { usePrefersReducedMotion } from '../../components/motion'
import { useGameHeading } from '../../components/game-heading'
import { PILLS, pillsArePlaceholder } from '../../content/games'
import type { PillCard, Pills } from '../../content/schemas'
import { GreenPillPage } from './GreenPillPage'
import { Loc } from './Loc'
import { PillGuide, type GuidePill } from './PillGuide'
import { RedPillInsight } from './RedPillInsight'
import { START, pillReducer } from './machine'
import styles from './PillGame.module.css'

type PillColour = GuidePill

/** The pill's name and hint: shown beside the pill on hover or focus, and always on touch screens. */
function PillLabel({ colour }: { colour: PillColour }) {
  const { t } = useI18n()
  return (
    <span className={styles.tip}>
      <span className={styles.pillName}>{t(`pills.${colour}.name`)}</span>
      <span className={styles.pillHint}>{t(`pills.${colour}.hint`)}</span>
    </span>
  )
}

/**
 * A pill in the guide's hand, as a button. Its label opens towards the middle
 * of the screen. The landing screen keeps the same right-hand button when the
 * blue pill becomes the green one, so its colour changes instead of the button
 * being replaced.
 */
function PillButton({
  colour,
  side = 'right',
  onChoose,
  ...rest
}: { colour: PillColour; side?: 'left' | 'right'; onChoose: () => void } & Omit<
  HTMLAttributes<HTMLButtonElement>,
  'onClick' | 'className' | 'type'
>) {
  return (
    <button
      type="button"
      className={`${styles.pill} ${styles[colour]}`}
      onClick={onChoose}
      data-pill={colour}
      data-side={side}
      {...rest}
    >
      <PillLabel colour={colour} />
    </button>
  )
}

/** The green pill: an on-site button that opens the green pill pages. */
export function GreenPill({ onChoose }: { onChoose: () => void }) {
  return <PillButton colour="green" onChoose={onChoose} />
}

function CardSource({ card }: { card: PillCard }) {
  const { t } = useI18n()
  if (!card.source) {
    return (
      <p className={styles.sourceNeeded}>
        <Icon name="dash" size={16} />
        {t('pills.sourceNeeded')}
      </p>
    )
  }
  return (
    <p className={styles.source}>
      {t('pills.sourceLabel')}{' '}
      {card.source.url ? (
        <ExternalLink href={card.source.url}>{card.source.citation}</ExternalLink>
      ) : (
        card.source.citation
      )}
    </p>
  )
}

/** How far a finger must travel sideways, in pixels, to count as a swipe. */
const SWIPE_PX = 64

/**
 * Swipe left for the next card and right for the one before, on touch
 * screens. Back and Next do the same, so nothing depends on the gesture. A
 * swipe that is mostly up or down is a scroll and is left alone, as is one
 * that selects text or starts inside a dialog.
 */
function useSwipe(onNext: () => void, onBack: () => void) {
  const from = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches.length === 1 ? e.touches[0] : undefined
      const inDialog = e.target instanceof Element && e.target.closest('dialog') !== null
      from.current = touch && !inDialog ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd: (e: TouchEvent) => {
      const start = from.current
      const touch = e.changedTouches[0]
      from.current = null
      if (!start || !touch) return
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 2) return
      if (window.getSelection()?.isCollapsed === false) return
      if (dx < 0) onNext()
      else onBack()
    },
    onTouchCancel: () => {
      from.current = null
    },
  }
}

/**
 * Back, the progress dots and Next, in one bar that stays at the bottom of the
 * screen while its card is on screen. The dots repeat the "Card 2 of 5"
 * heading, so they are hidden from assistive technology.
 */
function DeckNav({
  colour,
  count,
  index,
  onBack,
  onNext,
}: {
  colour: 'red' | 'green'
  count: number
  index: number
  onBack: () => void
  onNext: () => void
}) {
  const { t } = useI18n()
  return (
    <div className={styles.deckNav} data-testid="deck-nav">
      <button type="button" className={styles.navButton} onClick={onBack}>
        <Icon name="arrow-left" size={20} />
        {t('pills.back')}
      </button>
      <ol
        className={colour === 'green' ? `${styles.dots} ${styles.greenDots}` : styles.dots}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            className={
              i === index ? `${styles.dotDone} ${styles.dotNow}` : i < index ? styles.dotDone : ''
            }
          />
        ))}
      </ol>
      <button type="button" className={`${styles.navButton} ${styles.navNext}`} onClick={onNext}>
        {t('pills.next')}
        <Icon name="arrow-right" size={20} />
      </button>
    </div>
  )
}

export function PillGameView({ data }: { data: Pills }) {
  const { t, l, lang } = useI18n()
  const reds = data.cards
  const greens = data.green.pages
  const reducer = useMemo(
    () => pillReducer(reds.length, greens.length),
    [reds.length, greens.length],
  )
  const [state, dispatch] = useReducer(reducer, START)
  /** The green solutions the visitor said they will try, by page number. */
  const [tried, setTried] = useState<number[]>([])
  const reducedMotion = usePrefersReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isFirst = useRef(true)

  // Move focus to each new screen's heading (a new card, the guide's new line, a green page...).
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    focusElement(headingRef.current)
    // Every new screen starts at the top of the page, even after pressing Next at the bottom.
    window.scrollTo(0, 0)
  }, [state])

  // The page's main heading names the chosen pill. The default title stays on the
  // landing screen, including after the blue pill is tossed, as there is still a choice to make.
  useGameHeading(
    state.screen === 'red' || state.screen === 'redEnd'
      ? t('pills.red.name')
      : state.screen === 'green' || state.screen === 'greenEnd'
        ? t('pills.green.name')
        : undefined,
  )

  const redCard = state.screen === 'red' ? reds[state.index] : undefined
  const greenPage = state.screen === 'green' ? greens[state.index] : undefined
  // On the landing screen after the blue pill: the guide has tossed it and offers green instead.
  const swapped = state.screen === 'blueSwap'
  const offer = swapped ? 'green' : 'blue'
  // The pill being hovered or focused on the landing screen; the guide lifts that hand.
  const [lean, setLean] = useState<GuidePill | null>(null)
  const take = (pill: GuidePill) => {
    setLean(null)
    dispatch(pill === 'green' ? { type: 'takeGreen' } : { type: 'choose', path: pill })
  }
  const leanOn = (pill: GuidePill) => ({
    onPointerEnter: () => setLean(pill),
    onPointerLeave: () => setLean(null),
    onFocus: () => setLean(pill),
    onBlur: () => setLean(null),
  })
  const back = () => dispatch({ type: 'back' })
  const next = () => dispatch({ type: 'next' })
  const swipe = useSwipe(next, back)
  const toggleTried = (page: number) =>
    setTried((now) => (now.includes(page) ? now.filter((n) => n !== page) : [...now, page]))
  const startOver = () => {
    setTried([])
    dispatch({ type: 'startOver' })
  }
  const startOverButton = (
    <button type="button" className={styles.quiet} onClick={startOver}>
      <Icon name="restart" size={18} />
      {t('pills.startOver')}
    </button>
  )
  /** Back and Start over, under the recap and the plan. */
  const endActions = (
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={back}>
        <Icon name="arrow-left" size={20} />
        {t('pills.back')}
      </button>
      <button type="button" className={styles.secondary} onClick={startOver}>
        <Icon name="restart" size={20} />
        {t('pills.startOver')}
      </button>
    </div>
  )

  return (
    <div className={styles.game} data-testid="pill-game" data-screen={state.screen}>
      {pillsArePlaceholder(data) && <PlaceholderNotice />}

      {/* One landing section for both the first choice and the swap, so the guide
          stays on screen and plays the swap where he stands. */}
      {(state.screen === 'start' || swapped) && (
        <section className={`${styles.screen} ${styles.landing}`}>
          {swapped ? (
            <h2
              key="swap"
              ref={headingRef}
              className={`${styles.bubble} ${styles.bubbleLong}`}
              lang={localizedLang(data.blue.message, lang)}
            >
              {l(data.blue.message)}
            </h2>
          ) : (
            <h2 key="prompt" ref={headingRef} className={styles.bubble}>
              {t('pills.prompt')}
            </h2>
          )}
          <PillGuide
            offer={offer}
            lean={lean}
            left={
              <PillButton
                colour="red"
                side="left"
                onChoose={() => take('red')}
                {...leanOn('red')}
              />
            }
            right={<PillButton colour={offer} onChoose={() => take(offer)} {...leanOn(offer)} />}
          />
        </section>
      )}

      {state.screen === 'red' && redCard && (
        <section className={`${styles.screen} ${styles.deck}`} {...swipe}>
          <div className={styles.cardHead}>
            <h2 ref={headingRef} className={styles.progress}>
              {t('pills.progress', { n: state.index + 1, total: reds.length })}
            </h2>
            {startOverButton}
          </div>
          {redCard.visual ? (
            <RedPillInsight key={state.index} data={redCard} />
          ) : (
            <article className={styles.card}>
              <p className={styles.cardText} lang={localizedLang(redCard.text, lang)}>
                {l(redCard.text)}
              </p>
              <CardSource card={redCard} />
            </article>
          )}
          <DeckNav
            colour="red"
            count={reds.length}
            index={state.index}
            onBack={back}
            onNext={next}
          />
        </section>
      )}

      {/* After the last red card: every card in a line, and the green pill on offer. */}
      {state.screen === 'redEnd' && (
        <section className={styles.screen} data-testid="red-recap">
          <h2 ref={headingRef}>{t('pills.recap.title')}</h2>
          <ol className={styles.recap}>
            {reds.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={styles.recapRow}
                  onClick={() => dispatch({ type: 'review', index: i })}
                >
                  <span className={styles.recapNo} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.rowText}>
                    <Loc field={c.title ?? c.text} className={styles.rowTitle} plain />
                    {c.title && c.takeaway && <Loc field={c.takeaway} plain />}
                  </span>
                  <Icon name="arrow-right" size={18} />
                </button>
              </li>
            ))}
          </ol>
          {greens.length > 0 && (
            <div className={styles.handoff}>
              <p>{t('pills.recap.lead')}</p>
              <button
                type="button"
                className={styles.greenCta}
                onClick={() => dispatch({ type: 'takeGreen' })}
              >
                <span className={styles.capsule} aria-hidden="true" />
                {t('pills.recap.green')}
                <Icon name="arrow-right" size={20} />
              </button>
            </div>
          )}
          {endActions}
        </section>
      )}

      {state.screen === 'green' && greenPage && (
        <section className={`${styles.screen} ${styles.deck}`} {...swipe}>
          <div className={styles.cardHead}>
            <h2 ref={headingRef} className={styles.progress}>
              {t('pills.green.progress', { n: state.index + 1, total: greens.length })}
            </h2>
            {startOverButton}
          </div>
          <GreenPillPage
            key={state.index}
            data={greenPage}
            tried={tried.includes(state.index)}
            onToggleTry={() => toggleTried(state.index)}
          />
          <DeckNav
            colour="green"
            count={greens.length}
            index={state.index}
            onBack={back}
            onNext={next}
          />
        </section>
      )}

      {/* After the last green page: the visitor's plan. Each solution can still be put on it or taken off. */}
      {state.screen === 'greenEnd' && (
        <section className={styles.screen} data-testid="green-plan">
          {!reducedMotion && <Fireworks rockets={14} />}
          <h2 ref={headingRef}>{t('pills.plan.title')}</h2>
          <p className={styles.lead}>
            {tried.length > 0 ? t('pills.plan.lead') : t('pills.plan.empty')}
          </p>
          <ul className={styles.plan}>
            {greens.map((g, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={styles.planRow}
                  aria-pressed={tried.includes(i)}
                  onClick={() => toggleTried(i)}
                >
                  <span className={styles.planTick} aria-hidden="true">
                    <Icon name="check" size={18} />
                  </span>
                  <span className={styles.rowText}>
                    <Loc field={g.title} className={styles.rowTitle} />
                    <Loc field={g.action} plain />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {endActions}
        </section>
      )}
    </div>
  )
}

export default function PillGame() {
  if (!PILLS.data)
    return <ContentError titleKey="game.error.title" problems={PILLS.errors} level={2} />
  return <PillGameView data={PILLS.data} />
}
