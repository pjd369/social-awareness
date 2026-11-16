import { Link } from 'react-router'
import { useI18n } from '../i18n/context'
import { BrandLogo } from './BrandLogo'
import { Icon } from './Icon'
import { LanguageSwitch } from './LanguageSwitch'
import { Toran } from './Toran'
import type { BackLink } from './page-context'
import styles from './Header.module.css'

export function Header({ back }: { back?: BackLink }) {
  const { t } = useI18n()
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link to="/" className={styles.brand}>
          <BrandLogo className={styles.logo} />
        </Link>
        <LanguageSwitch />
      </div>
      <Toran />
      {back && (
        <nav className={styles.backNav} aria-label={t('nav.backLabel')}>
          <Link
            to={back.to}
            className={styles.back}
            aria-label={t('nav.back', { page: back.label })}
          >
            <Icon name="arrow-left" size={22} />
            <span className={styles.backCopy}>
              <span className={styles.backEyebrow}>{t('nav.backTo')}</span>
              <span className={styles.backPage}>{back.label}</span>
            </span>
          </Link>
        </nav>
      )}
    </header>
  )
}
