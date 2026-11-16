import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Owner correction: the green pill has nothing to do with the university the
 * first plan named as a stand-in. Its name, link and wording must not appear
 * in the code, interface text or README. (The search term is built from
 * parts so that this file does not contain it either.)
 *
 * One later, explicit exception: the "Reconnect with people" green page cites
 * the Adult Development study, which is named and linked in its references in
 * content/pills.json (and in the README's notes on how to write references).
 * It is a cited source, not the green pill's destination.
 */
const NAME = ['Har', 'vard'].join('')
const FORBIDDEN = new RegExp(NAME, 'i')
/** Files that may name the study in a citation. */
const CITATION_FILES = new Set([join('content', 'pills.json')])
/** The one line the owner asked for in the README's open questions. */
const ALLOWED_README_LINE = `Not ${['Har', 'vard'].join('')}; destination still to be supplied.`

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('green pill wording', () => {
  it('names the old stand-in nowhere in src, content, locales, scripts or tests', () => {
    const offenders = ['src', 'content', 'locales', 'scripts', 'tests']
      .flatMap(files)
      .filter((f) => !CITATION_FILES.has(f))
      .filter((f) => FORBIDDEN.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('is named in content only as a cited source of the Adult Development study', () => {
    const raw = readFileSync(join('content', 'pills.json'), 'utf8')
    const pills = JSON.parse(raw) as { green: { pages: { source: { citation: string } }[] } }
    const mentions = raw.match(new RegExp(FORBIDDEN, 'gi')) ?? []
    expect(mentions.length).toBeGreaterThan(0)
    // Every mention sits in the citation, its link, or the study's name in the page text.
    const stripped = raw
      .replaceAll(JSON.stringify(pills.green.pages[0]!.source.citation).slice(1, -1), '')
      .replaceAll(new RegExp(`https://news\\.${NAME}\\.edu[^"]*`, 'gi'), '')
      .replaceAll(new RegExp(`${NAME} Study of Adult Development`, 'gi'), '')
    expect(FORBIDDEN.test(stripped)).toBe(false)
  })

  it('appears in the README only in the requested open-question line', () => {
    const readme = readFileSync('README.md', 'utf8').replaceAll(ALLOWED_README_LINE, '')
    expect(FORBIDDEN.test(readme)).toBe(false)
  })
})
