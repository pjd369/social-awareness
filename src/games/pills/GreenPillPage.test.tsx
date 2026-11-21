import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nProvider } from '../../i18n/I18nProvider'
import { PILLS } from '../../content/games'
import { GreenPillPage } from './GreenPillPage'

const greens = PILLS.data?.green.pages ?? []

const render = (i: number, tried = false) =>
  renderToStaticMarkup(
    <I18nProvider>
      <GreenPillPage data={greens[i]!} tried={tried} onToggleTry={() => {}} />
    </I18nProvider>,
  )

describe('GreenPillPage', () => {
  it.each(greens.map((_, i) => i))('page %i shows its parts and numbered references', (i) => {
    const html = render(i)
    expect(html).toContain('<h3')
    expect(html).toContain('What you can do')
    expect(html).toContain('Why it helps')
    expect(html).toContain(`References (${1 + greens[i]!.moreSources.length})`)
    expect(html).toContain('[1]')
    expect(html).toContain('[Online]. Available:')
    expect(html).toMatch(/<figure[^>]* role="(img|group)" aria-label="[^"]{20,}"/)
  })

  it('shows what to do, and keeps why it helps and the references closed until asked for', () => {
    const html = render(0)
    const action = html.indexOf('data-testid="action"')
    const why = html.indexOf('data-testid="why"')
    expect(action).toBeGreaterThan(html.indexOf('<figure'))
    expect(why).toBeGreaterThan(action)
    expect(html.indexOf('data-testid="references"')).toBeGreaterThan(why)
    expect(html.match(/<details/g)).toHaveLength(2)
    expect(html).not.toContain('<details open')
  })

  it('has an "I’ll try this" button that is pressed once the solution is on the plan', () => {
    const button = (html: string) =>
      html.match(/<button[^>]*>(?:(?!<\/button>).)*I’ll try this/)?.[0]
    expect(button(render(0))).toContain('aria-pressed="false"')
    expect(button(render(0, true))).toContain('aria-pressed="true"')
  })
})
