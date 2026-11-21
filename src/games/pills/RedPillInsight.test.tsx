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
    // A diagram with buttons in it is a named group; the others are one image.
    expect(html).toMatch(/<figure[^>]* role="(img|group)" aria-label="[^"]{20,}"/)
    expect(html).toContain('role="tablist"')
    expect(html.match(/role="tab"/g)).toHaveLength(2)
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('<h3')
    expect(html).toContain('Key takeaway')
    expect(html).toContain('What can help?')
    expect(html).toContain(`References (${1 + reds[i]!.moreSources.length})`)
    expect(html).toContain('[1]')
    expect(html).toContain('[Online]. Available:')
  })

  it('shows only the first tab (children) at first, selected and focusable', () => {
    const html = render(0)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    expect(html.match(/tabindex="-1"/g)).toHaveLength(1)
  })

  it('shows the headline, the diagram and the key takeaway, in that order', () => {
    const html = render(0)
    const headline = html.indexOf('<h3')
    const diagram = html.indexOf('<figure')
    const takeaway = html.indexOf('data-testid="takeaway"')
    const firstRow = html.indexOf('<details')
    expect(headline).toBeGreaterThan(-1)
    expect(diagram).toBeGreaterThan(headline)
    expect(takeaway).toBeGreaterThan(diagram)
    expect(firstRow).toBeGreaterThan(takeaway)
  })

  it('keeps what can help, the fuller text with the age tabs, and the references closed until asked for', () => {
    const html = render(0)
    expect(html.match(/<details/g)).toHaveLength(3)
    expect(html).not.toContain('<details open')
    const help = html.indexOf('data-testid="help"')
    const more = html.indexOf('data-testid="more"')
    const refs = html.indexOf('data-testid="references"')
    expect(help).toBeGreaterThan(-1)
    expect(more).toBeGreaterThan(help)
    expect(html.indexOf('role="tablist"')).toBeGreaterThan(more)
    expect(refs).toBeGreaterThan(html.indexOf('role="tabpanel"'))
    expect(html.indexOf('[Online]. Available:')).toBeGreaterThan(refs)
  })

  it('shows the first step of a timeline, with a button for the next', () => {
    const html = render(reds.findIndex((c) => c.visual?.type === 'timeline'))
    expect(html).toContain('Then what?')
    const steps = html.match(/<li[^>]*>/g)?.filter((li) => li.includes('step')) ?? []
    expect(steps.length).toBeGreaterThanOrEqual(3)
    // Every step but the first waits, hidden from assistive technology.
    expect(steps.filter((li) => li.includes('aria-hidden="true"'))).toHaveLength(steps.length - 1)
    expect(steps[0]).not.toContain('aria-hidden')
  })

  it('shows the habit of a before-and-after first, with two buttons to switch', () => {
    const html = render(reds.findIndex((c) => c.visual?.type === 'before-after'))
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(1)
    expect(html.indexOf('aria-pressed="true"')).toBeLessThan(html.indexOf('aria-pressed="false"'))
    expect(html).toContain('Often')
    expect(html).toContain('Try instead')
  })

  it('writes qualitative levels in words next to the bars', () => {
    const bars = reds.findIndex((c) => c.visual?.type === 'impact-bars')
    const html = render(bars)
    expect(html).toContain('Higher concern')
    expect(html).toContain('Some concern')
    expect(html).toContain('Not measured data')
  })
})
