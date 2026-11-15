import { useI18n } from '../i18n/context'
import { LANGS, NATIVE_NAMES, SHORT_NAMES } from '../i18n/languages'
import styles from './LanguageSwitch.module.css'

/** Language switch. Each option is shown in its own script and carries its own lang attribute. */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={styles.switch} role="group" aria-label={t('lang.label')}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={styles.option}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {SHORT_NAMES[code] === NATIVE_NAMES[code] ? (
            NATIVE_NAMES[code]
          ) : (
            <>
              <span className={styles.full}>{NATIVE_NAMES[code]}</span>
              <span className={styles.short} aria-hidden="true">
                {SHORT_NAMES[code]}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}
