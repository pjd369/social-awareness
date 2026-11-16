import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nProvider } from '../../i18n/I18nProvider'
import { GreenPill } from './PillGame'

describe('GreenPill', () => {
  it('is an on-site button, never a link to another site', () => {
    const html = renderToStaticMarkup(
      <I18nProvider>
        <GreenPill onChoose={() => {}} />
      </I18nProvider>,
    )
    expect(html).toMatch(/^<button type="button"/)
    expect(html).not.toContain('href=')
    expect(html).not.toContain('target=')
    expect(html).toContain('Green pill')
  })
})
