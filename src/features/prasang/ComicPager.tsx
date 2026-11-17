import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { useI18n } from '../../i18n/context'
import { audioUrl, imageUrl } from '../../content'
import { Icon } from '../../components/Icon'
import { LessonBox } from '../../components/LessonBox'
import { usePrefersReducedMotion } from '../../components/motion'
import { SECTIONS, type SectionId } from '../../config/sections'
import type { PrasangDoc } from '../../content'
import styles from './Prasang.module.css'

/** Crossfade length when moving from one page to the next. */
const FADE_MS = 900

interface ComicPagerProps {
  doc: PrasangDoc
  section: SectionId
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Comic film: each page is tied to a slice of the continuous soundtrack.
 * Play/pause and a scrubber control the film; music can be muted independently.
 */
export function ComicPager({ doc, section }: ComicPagerProps) {
  const { t } = useI18n()
  const reducedMotion = usePrefersReducedMotion()
  const pages = doc.front.images
  const pageSeconds = doc.front.pageSeconds
  const total = pages.length
  const duration = total * pageSeconds
  const soundtrack = doc.front.soundtrack ? audioUrl(doc.front.soundtrack) : undefined
  const seekId = useId()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const indexRef = useRef(0)
  const scrubbing = useRef(false)
  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const [ended, setEnded] = useState(false)
  /** Wait for a tap so browsers allow sound and route tests can reach network idle. */
  const [needsGesture, setNeedsGesture] = useState(Boolean(soundtrack))
  const [currentTime, setCurrentTime] = useState(0)
  const fadeTimer = useRef<number | null>(null)

  const page = pages[index]
  const url = page ? imageUrl(page.src) : null
  const prevPage = prevIndex !== null ? pages[prevIndex] : null
  const prevUrl = prevPage ? imageUrl(prevPage.src) : null

  const applyPageFromTime = useCallback(
    (time: number, withFade: boolean) => {
      const next = Math.min(total - 1, Math.floor(time / pageSeconds))
      if (next === indexRef.current) return
      if (withFade && !reducedMotion) {
        setPrevIndex(indexRef.current)
        if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
        fadeTimer.current = window.setTimeout(() => setPrevIndex(null), FADE_MS)
      } else {
        setPrevIndex(null)
      }
      indexRef.current = next
      setIndex(next)
    },
    [total, pageSeconds, reducedMotion],
  )

  useEffect(() => {
    for (const offset of [0, 1, 2]) {
      const neighbor = pages[index + offset]
      if (!neighbor) continue
      const href = imageUrl(neighbor.src)
      if (!href) continue
      const img = new Image()
      img.src = href
    }
  }, [index, pages])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !soundtrack) return
    audio.muted = !musicOn
  }, [musicOn, soundtrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !soundtrack) return

    function syncFromAudio() {
      if (scrubbing.current) return
      const time = audio!.currentTime
      setCurrentTime(Math.min(time, duration))
      if (time >= duration - 0.05 || audio!.ended) {
        indexRef.current = total - 1
        setIndex(total - 1)
        setPrevIndex(null)
        setPlaying(false)
        setEnded(true)
        setCurrentTime(duration)
        audio!.pause()
        return
      }
      applyPageFromTime(time, true)
    }

    audio.addEventListener('timeupdate', syncFromAudio)
    audio.addEventListener('ended', syncFromAudio)
    return () => {
      audio.removeEventListener('timeupdate', syncFromAudio)
      audio.removeEventListener('ended', syncFromAudio)
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
    }
  }, [soundtrack, duration, total, applyPageFromTime])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || !soundtrack) return
    if (ended) {
      audio.currentTime = 0
      setCurrentTime(0)
      indexRef.current = 0
      setIndex(0)
      setPrevIndex(null)
      setEnded(false)
    }
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
      setNeedsGesture(false)
    } catch {
      setNeedsGesture(true)
      setPlaying(false)
    }
  }

  function seekTo(time: number) {
    const audio = audioRef.current
    if (!audio || !soundtrack) return
    const clamped = Math.min(Math.max(time, 0), duration - 0.01)
    audio.currentTime = clamped
    setCurrentTime(clamped)
    setEnded(false)
    applyPageFromTime(clamped, false)
  }

  function onSeekInput(event: ChangeEvent<HTMLInputElement>) {
    seekTo(Number(event.target.value))
  }

  function onSeekPointerDown() {
    scrubbing.current = true
  }

  function onSeekPointerUp() {
    scrubbing.current = false
  }

  if (!page || !url) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={styles.comic} data-audience={section}>
      <h1 className={styles.comicTitle}>{doc.front.title}</h1>
      {doc.body.trim() && <p className={styles.comicLead}>{doc.body.trim()}</p>}

      {soundtrack && <audio ref={audioRef} src={soundtrack} preload="none" playsInline />}

      <div className={styles.musicRow}>
        <button
          type="button"
          className={styles.musicBtn}
          onClick={() => setMusicOn((on) => !on)}
          aria-pressed={musicOn}
          aria-label={musicOn ? t('prasang.film.musicOn') : t('prasang.film.musicOff')}
          disabled={!soundtrack}
        >
          <Icon name={musicOn ? 'music' : 'music-off'} size={22} />
        </button>
      </div>

      <figure className={styles.page} aria-busy={playing || undefined}>
        <div className={styles.stage}>
          {prevUrl && prevPage && !reducedMotion && (
            <img
              key={`out-${prevPage.src}`}
              src={prevUrl}
              alt=""
              width={720}
              height={960}
              draggable={false}
              className={`${styles.pageImage} ${styles.fadeOut}`}
              aria-hidden="true"
            />
          )}
          <img
            key={`in-${page.src}`}
            src={url}
            alt={page.alt ?? ''}
            width={720}
            height={960}
            decoding="async"
            draggable={false}
            className={`${styles.pageImage} ${prevIndex !== null && !reducedMotion ? styles.fadeIn : ''}`}
          />
          {needsGesture && (
            <button type="button" className={styles.startOverlay} onClick={togglePlay}>
              <Icon name="play" size={28} />
              {t('prasang.film.start')}
            </button>
          )}

          <div className={styles.controlBar} role="group" aria-label={t('prasang.film.controls')}>
            <button
              type="button"
              className={styles.barPlay}
              onClick={togglePlay}
              aria-pressed={playing}
              aria-label={
                ended
                  ? t('prasang.film.replay')
                  : playing
                    ? t('prasang.film.pause')
                    : t('prasang.film.play')
              }
            >
              <Icon name={ended ? 'restart' : playing ? 'pause' : 'play'} size={22} />
            </button>
            <div className={styles.seekWrap}>
              <label className={styles.srOnly} htmlFor={seekId}>
                {t('prasang.film.seek')}
              </label>
              <input
                id={seekId}
                className={styles.seek}
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={Math.min(currentTime, duration)}
                onChange={onSeekInput}
                onPointerDown={onSeekPointerDown}
                onPointerUp={onSeekPointerUp}
                onPointerCancel={onSeekPointerUp}
                style={{ '--progress': `${progress}%` } as CSSProperties}
              />
            </div>
            <span className={styles.time} aria-hidden="true">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </figure>

      {ended && (
        <LessonBox heading={t(SECTIONS[section].prasangLessonKey)}>
          <p>{doc.front.moral}</p>
        </LessonBox>
      )}
    </div>
  )
}
