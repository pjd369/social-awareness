import { describe, expect, it } from 'vitest'
import type { Story } from '../../content/schemas'
import { followedExpectedPath } from './expected'

const t = (en: string) => ({ en })
const end = { outcome: t('o'), lesson: t('l') }

const story: Story = {
  id: 's',
  audience: 'bhulkao',
  title: t('T'),
  startNode: 'start',
  placeholder: false,
  nodes: [
    {
      id: 'start',
      text: t('a'),
      choices: [
        { label: t('play'), next: 'play' },
        { label: t('finish'), next: 'finish', expected: true },
      ],
    },
    {
      id: 'finish',
      text: t('b'),
      choices: [
        { label: t('together'), next: 'together', expected: true },
        { label: t('alone'), next: 'alone' },
      ],
    },
    { id: 'play', text: t('c'), ending: end },
    { id: 'together', text: t('d'), ending: end },
    { id: 'alone', text: t('e'), ending: end },
  ],
}

describe('followedExpectedPath', () => {
  it('is true only when every expected decision was taken', () => {
    expect(followedExpectedPath(story, ['start', 'finish', 'together'])).toBe(true)
  })

  it('is false when an expected decision was skipped', () => {
    expect(followedExpectedPath(story, ['start', 'finish', 'alone'])).toBe(false)
    expect(followedExpectedPath(story, ['start', 'play'])).toBe(false)
  })

  it('is false before an ending', () => {
    expect(followedExpectedPath(story, ['start', 'finish'])).toBe(false)
  })
})
