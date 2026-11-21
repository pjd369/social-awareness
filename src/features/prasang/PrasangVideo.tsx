import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { captionsUrl, imageUrl, videoUrl } from '../../content'
import { Icon } from '../../components/Icon'
import { useI18n } from '../../i18n/context'
import type { PrasangVideo as PrasangVideoData } from '../../content/schemas'
import styles from './Prasang.module.css'

/** How long controls stay up after play / interaction (YouTube-like). */
const HIDE_MS = 2500

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Prasang video with custom controls (no fullscreen). While playing, the bar
 * fades out like YouTube; a tap brings it back.
 */
export function PrasangVideo({ video }: { video: PrasangVideoData }) {
  const { t } = useI18n()
  const src = videoUrl(video.src)
  const captions = video.captions ? captionsUrl(video.captions) : undefined
  const poster = video.poster ? imageUrl(video.poster) : undefined
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const seekId = useId()
  const scrubbing = useRef(false)
  const hideTimer = useRef<number | null>(null)
  /** Controls were visible when the pointer went down on the video surface. */
  const controlsUpOnDown = useRef(true)

  const [subsOn, setSubsOn] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    const el = videoRef.current
    if (!el || el.paused) return
    hideTimer.current = window.setTimeout(() => {
      if (!scrubbing.current && videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false)
      }
    }, HIDE_MS)
  }, [clearHideTimer])

  const showControls = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !captions) return
    const apply = () => {
      for (const track of Array.from(el.textTracks)) {
        track.mode = subsOn ? 'showing' : 'hidden'
      }
    }
    apply()
    el.textTracks.addEventListener('addtrack', apply)
    return () => el.textTracks.removeEventListener('addtrack', apply)
  }, [captions, subsOn])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const onTime = () => {
      if (!scrubbing.current) setCurrentTime(el.currentTime)
    }
    const onMeta = () => setDuration(el.duration || 0)
    const onPlay = () => {
      setPlaying(true)
      setControlsVisible(true)
      scheduleHide()
    }
    const onPause = () => {
      setPlaying(false)
      clearHideTimer()
      setControlsVisible(true)
    }
    const onVolume = () => setMuted(el.muted || el.volume === 0)
    const onEnded = () => {
      setPlaying(false)
      clearHideTimer()
      setControlsVisible(true)
    }

    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('durationchange', onMeta)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('volumechange', onVolume)
    onMeta()
    onVolume()

    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('durationchange', onMeta)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('volumechange', onVolume)
      clearHideTimer()
    }
  }, [src, scheduleHide, clearHideTimer])

  if (!src) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  function toggleMute() {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
    showControls()
  }

  function onSeekInput(e: ChangeEvent<HTMLInputElement>) {
    const el = videoRef.current
    if (!el) return
    const next = Number(e.target.value)
    el.currentTime = next
    setCurrentTime(next)
    showControls()
  }

  function onVideoPointerDown() {
    controlsUpOnDown.current = controlsVisible
    if (!controlsVisible) showControls()
  }

  function onVideoClick() {
    // First tap while hidden only reveals controls (YouTube-like).
    if (!controlsUpOnDown.current) return
    togglePlay()
  }

  return (
    <div
      className={styles.videoShell}
      data-testid="prasang-video"
      data-controls={controlsVisible ? 'show' : 'hide'}
      onPointerMove={() => {
        if (playing) showControls()
      }}
    >
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={video.alt}
        onPointerDown={onVideoPointerDown}
        onClick={onVideoClick}
      >
        <source src={src} type="video/mp4" />
        {captions && <track kind="captions" src={captions} srcLang="en" label="English" />}
      </video>

      <div
        className={styles.videoBar}
        role="group"
        aria-label={t('prasang.video.controls')}
        aria-hidden={!controlsVisible}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.videoBarBtn}
          onClick={() => {
            togglePlay()
            showControls()
          }}
          aria-pressed={playing}
          aria-label={playing ? t('prasang.film.pause') : t('prasang.film.play')}
          tabIndex={controlsVisible ? 0 : -1}
        >
          <Icon name={playing ? 'pause' : 'play'} size={20} />
        </button>

        <div className={styles.seekWrap}>
          <label className={styles.srOnly} htmlFor={seekId}>
            {t('prasang.video.seek')}
          </label>
          <input
            id={seekId}
            className={styles.seek}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            tabIndex={controlsVisible ? 0 : -1}
            onChange={onSeekInput}
            onPointerDown={() => {
              scrubbing.current = true
              showControls()
            }}
            onPointerUp={() => {
              scrubbing.current = false
              scheduleHide()
            }}
            onPointerCancel={() => {
              scrubbing.current = false
              scheduleHide()
            }}
            style={{ '--progress': `${progress}%` } as CSSProperties}
          />
        </div>

        <span className={styles.videoTime} aria-hidden="true">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          className={styles.videoBarBtn}
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? t('prasang.video.unmute') : t('prasang.video.mute')}
          tabIndex={controlsVisible ? 0 : -1}
        >
          <Icon name={muted ? 'volume-off' : 'volume'} size={20} />
        </button>

        {captions && (
          <button
            type="button"
            className={`${styles.videoBarBtn} ${styles.videoCcBtn}`}
            aria-pressed={subsOn}
            aria-label={subsOn ? t('prasang.video.subsOn') : t('prasang.video.subsOff')}
            tabIndex={controlsVisible ? 0 : -1}
            onClick={() => {
              setSubsOn((on) => !on)
              showControls()
            }}
            data-testid="prasang-subs-toggle"
          >
            <Icon name={subsOn ? 'captions' : 'captions-off'} size={18} />
            <span className={styles.videoCcLabel} aria-hidden="true">
              {t('prasang.video.cc')}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
