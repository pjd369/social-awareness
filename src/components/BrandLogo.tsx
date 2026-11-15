import { BRAND_LOGO_ALT, BRAND_LOGO_SUFFIX } from '../config/site'
import styles from './BrandLogo.module.css'

/**
 * The official Harisumiran logo, tinted with the current text colour, with
 * "SF" set after the wordmark. Its accessible name is the logo's alt text.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={[styles.logo, className].filter(Boolean).join(' ')} lang="en">
      <span className={styles.artwork} aria-hidden="true" />
      <span className={styles.suffix} aria-hidden="true">
        {BRAND_LOGO_SUFFIX}
      </span>
      <span className="visually-hidden">{BRAND_LOGO_ALT}</span>
    </span>
  )
}
