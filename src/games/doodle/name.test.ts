import { describe, expect, it } from 'vitest'
import { checkName, nameKey } from './name'

describe('checkName()', () => {
  it('accepts first names and nicknames in any of the site scripts', () => {
    for (const name of ['Riya', 'Aarav', 'Kshitij', 'Ashita', 'Mary Ann', 'રિયા', 'आरव']) {
      expect(checkName(name)).toEqual({ ok: true, name })
    }
  })

  it('tidies spaces', () => {
    expect(checkName('  Riya   Shah ')).toEqual({ ok: true, name: 'Riya Shah' })
  })

  it('rejects an empty name', () => {
    expect(checkName('   ')).toEqual({ ok: false, problem: 'empty' })
  })

  it('rejects numbers, symbols and links', () => {
    for (const name of ['Riya7', 'r!ya', 'riya@mail.com', 'www.site', '😀']) {
      expect(checkName(name)).toEqual({ ok: false, problem: 'characters' })
    }
  })

  it('allows 12 letters, counting a Gujarati or Hindi letter with its marks as one', () => {
    expect(checkName('Abcdefghijkl').ok).toBe(true)
    expect(checkName('Abcdefghijklm')).toEqual({ ok: false, problem: 'tooLong' })
    expect(checkName('પ્રાર્થના').ok).toBe(true)
  })

  it('blocks rude words, without blocking names that only contain the letters', () => {
    expect(checkName('Shit')).toEqual({ ok: false, problem: 'blocked' })
    expect(checkName('fuckface')).toEqual({ ok: false, problem: 'blocked' })
    expect(checkName('Hassan').ok).toBe(true)
    expect(checkName('Prapeksha').ok).toBe(true)
  })
})

describe('nameKey()', () => {
  it('treats different capitals as the same player', () => {
    expect(nameKey('Riya')).toBe(nameKey('RIYA'))
  })
})
