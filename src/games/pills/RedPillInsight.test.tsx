import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nProvider } from '../../i18n/I18nProvider'
import { PILLS } from '../../content/games'
import { RedPillInsight } from './RedPillInsight'

const reds = PILLS.data?.cards.filter((c) => c.path === 'red') ?? []
const render = (i: number) =>
  renderToStaticMarkup(
    <I18nProvider>
      <RedPillInsight data={reds[i]!} />
    </I18nProvider>,
  )

describe('RedPillInsight', () => {
  it.each(reds.map((_, i) => i))('card %i renders its parts', (i) => {
    const html = render(i)
    expect(html).toContain('role="img"')
    expect(html).toMatch(/aria-label="[^"]{20,}"/)
    expect(html).toContain('role="tablist"')
    expect(html.match(/role="tab"/g)).toHaveLength(2)
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('<h3')
    expect(html).toContain('Key takeaway')
    expect(html).toContain('What can help?')
    expect(html).toContain('References')
    expect(html).toContain('[1]')
    expect(html).toContain('[Online]. Available:')
  })

  it('shows only the first tab (children) at first, selected and focusable', () => {
    const html = render(0)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    expect(html.match(/tabindex="-1"/g)).toHaveLength(1)
  })

  it('puts the key takeaway and what can help in one box, before the age tabs', () => {
    const html = render(0)
    const box = html.indexOf('data-testid="takeaway-help"')
    const takeaway = html.indexOf('Key takeaway')
    const help = html.indexOf('What can help?')
    const tabs = html.indexOf('role="tablist"')
    expect(box).toBeGreaterThan(-1)
    expect(takeaway).toBeGreaterThan(box)
    expect(help).toBeGreaterThan(takeaway)
    expect(tabs).toBeGreaterThan(help)
  })

  it('writes qualitative levels in words next to the bars', () => {
    const bars = reds.findIndex((c) => c.visual?.type === 'impact-bars')
    const html = render(bars)
    expect(html).toContain('Higher concern')
    expect(html).toContain('Some concern')
    expect(html).toContain('Not measured data')
  })
})
