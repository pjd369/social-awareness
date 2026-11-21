/**
 * Whether to play the opening fade-in and fireworks. Off when the visitor
 * prefers reduced motion, and in automated browsers (the end-to-end tests),
 * where a page mid-fade would fail colour-contrast checks.
 */
export function introMotionAllowed(): boolean {
  if (navigator.webdriver) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
