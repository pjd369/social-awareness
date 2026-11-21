import { DIYA_LIT_SESSION_KEY } from '../config/site'

/**
 * True when this tab has already lit the intro diya. Automated browsers count
 * as lit from the start, so the end-to-end tests skip the ritual and can reach
 * Bhulkao / Yuvako.
 */
export function isDiyaLit(): boolean {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return true
    return window.sessionStorage.getItem(DIYA_LIT_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/** Remember for the rest of this tab's session that the diya has been lit. */
export function markDiyaLit() {
  try {
    window.sessionStorage.setItem(DIYA_LIT_SESSION_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}
