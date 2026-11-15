import { useEffect, useId, useState } from 'react'
import { useI18n } from '../../i18n/context'
import { dayKey, getLeaderboard, type LeaderboardSnapshot } from './leaderboard'
import { nameKey } from './name'
import styles from './DoodleGame.module.css'

type BoardState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: LeaderboardSnapshot }

/** Saves this run's score, then shows today's top players and how many played. */
export function LeaderboardPanel({ name, score }: { name: string; score: number }) {
  const { t } = useI18n()
  const titleId = useId()
  const [state, setState] = useState<BoardState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    const day = dayKey(new Date())
    getLeaderboard()
      .then(async (board): Promise<BoardState> => {
        if (!board) return { status: 'unavailable' }
        await board.submit(day, name, score)
        return { status: 'ready', snapshot: await board.read(day) }
      })
      .catch((): BoardState => ({ status: 'error' }))
      .then((next) => {
        if (alive) setState(next)
      })
    return () => {
      alive = false
    }
  }, [name, score])

  const me = nameKey(name)

  return (
    <section className={styles.board} aria-labelledby={titleId} data-testid="doodle-board">
      <h3 id={titleId} className={styles.boardTitle}>
        {t('doodle.board.title')}
      </h3>
      <div aria-live="polite">
        {state.status === 'loading' && <p>{t('doodle.board.loading')}</p>}
        {state.status === 'unavailable' && <p>{t('doodle.board.unavailable')}</p>}
        {state.status === 'error' && <p>{t('doodle.board.error')}</p>}
        {state.status === 'ready' && (
          <>
            {state.snapshot.top.length === 0 ? (
              <p>{t('doodle.board.empty')}</p>
            ) : (
              <ol className={styles.boardList}>
                {state.snapshot.top.map((entry, i) => (
                  <li
                    key={nameKey(entry.name)}
                    className={nameKey(entry.name) === me ? styles.boardMe : undefined}
                  >
                    <span className={styles.boardRank} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      {t('doodle.board.entry', { name: entry.name, n: entry.score })}
                      {nameKey(entry.name) === me && ` ${t('doodle.board.you')}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className={styles.boardCount}>
              {state.snapshot.players === 1
                ? t('doodle.board.players.one')
                : t('doodle.board.players', { n: state.snapshot.players })}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
