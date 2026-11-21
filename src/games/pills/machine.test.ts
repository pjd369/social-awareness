import { describe, expect, it } from 'vitest'
import { START, pillReducer, type PillAction, type PillState } from './machine'

const run = (actions: PillAction[], from: PillState = START, reds = 3, greens = 3) =>
  actions.reduce(pillReducer(reds, greens), from)

const red: PillAction = { type: 'choose', path: 'red' }
const blue: PillAction = { type: 'choose', path: 'blue' }
const next: PillAction = { type: 'next' }
const back: PillAction = { type: 'back' }
const takeGreen: PillAction = { type: 'takeGreen' }
const startOver: PillAction = { type: 'startOver' }

describe('pill game machine: red pill', () => {
  it('walks the red cards one at a time', () => {
    expect(run([red])).toEqual({ screen: 'red', index: 0 })
    expect(run([red, next, next])).toEqual({ screen: 'red', index: 2 })
  })

  it('shows the recap after the last red card', () => {
    expect(run([red, next, next, next])).toEqual({ screen: 'redEnd' })
    expect(run([red, next, next, next, next])).toEqual({ screen: 'redEnd' })
  })

  it('goes back from the recap to the last card, and opens any card from it', () => {
    const recap = run([red, next, next, next])
    expect(run([back], recap)).toEqual({ screen: 'red', index: 2 })
    expect(run([{ type: 'review', index: 1 }], recap)).toEqual({ screen: 'red', index: 1 })
    expect(run([{ type: 'review', index: 3 }], recap)).toEqual(recap)
    expect(run([{ type: 'review', index: -1 }], recap)).toEqual(recap)
  })

  it('opens a card by number only from the recap', () => {
    expect(run([{ type: 'review', index: 1 }])).toEqual(START)
    expect(run([red, { type: 'review', index: 2 }])).toEqual({ screen: 'red', index: 0 })
  })

  it('offers the green pill on the recap, and goes back to the recap from the first green page', () => {
    const recap = run([red, next, next, next])
    const green = run([takeGreen], recap)
    expect(green).toEqual({ screen: 'green', index: 0, from: 'recap' })
    expect(run([back], green)).toEqual({ screen: 'redEnd' })
  })

  it('stays on the recap when there are no green pages', () => {
    expect(run([red, next, next, next, takeGreen], START, 3, 0)).toEqual({ screen: 'redEnd' })
  })

  it('lets the red pill be replayed, or the blue pill chosen, after starting over from the recap', () => {
    const finished = run([red, next, next, next, startOver])
    expect(finished).toEqual(START)
    expect(run([red], finished)).toEqual({ screen: 'red', index: 0 })
    expect(run([blue], finished)).toEqual({ screen: 'blueSwap' })
  })

  it('goes back one card, and from the first card back to the landing screen', () => {
    expect(run([red, next, back])).toEqual({ screen: 'red', index: 0 })
    expect(run([red, back])).toEqual(START)
  })

  it('goes straight back to the landing screen when there are no red cards', () => {
    expect(run([red], START, 0)).toEqual(START)
  })
})

describe('pill game machine: blue pill', () => {
  it('swaps the blue pill for a green one on the landing screen, then goes to the green pages', () => {
    expect(run([blue])).toEqual({ screen: 'blueSwap' })
    expect(run([blue, takeGreen])).toEqual({ screen: 'green', index: 0, from: 'swap' })
  })

  it('still lets the red pill be taken after the swap', () => {
    expect(run([blue, red])).toEqual({ screen: 'red', index: 0 })
  })

  it('does not offer the green pill on the landing screen or on a red card', () => {
    expect(run([takeGreen])).toEqual(START)
    expect(run([red, takeGreen])).toEqual({ screen: 'red', index: 0 })
    expect(run([blue, next])).toEqual({ screen: 'blueSwap' })
    expect(run([blue, back])).toEqual({ screen: 'blueSwap' })
  })

  it('stays on the swap when there are no green pages', () => {
    expect(run([blue, takeGreen], START, 3, 0)).toEqual({ screen: 'blueSwap' })
  })
})

describe('pill game machine: green pill', () => {
  const toGreen: PillAction[] = [blue, takeGreen]

  it('walks the green pages with Next and Back', () => {
    expect(run([...toGreen, next])).toEqual({ screen: 'green', index: 1, from: 'swap' })
    expect(run([...toGreen, next, next])).toEqual({ screen: 'green', index: 2, from: 'swap' })
    expect(run([...toGreen, next, back])).toEqual({ screen: 'green', index: 0, from: 'swap' })
  })

  it('goes back from the first green page to the swap', () => {
    expect(run([...toGreen, back])).toEqual({ screen: 'blueSwap' })
  })

  it('shows the plan after the last page, and goes back from it to the last page', () => {
    const plan = run([...toGreen, next, next, next])
    expect(plan).toEqual({ screen: 'greenEnd', from: 'swap' })
    expect(run([next], plan)).toEqual(plan)
    expect(run([back], plan)).toEqual({ screen: 'green', index: 2, from: 'swap' })
  })

  it('remembers on the plan that the green pill came from the red recap', () => {
    const plan = run([red, next, next, next, takeGreen, next, next, next])
    expect(plan).toEqual({ screen: 'greenEnd', from: 'recap' })
    expect(run([back, back, back, back], plan)).toEqual({ screen: 'redEnd' })
  })

  it('lets both pills be chosen again after starting over from the plan', () => {
    const exited = run([...toGreen, next, next, next, startOver])
    expect(run([red], exited)).toEqual({ screen: 'red', index: 0 })
    expect(run([blue], exited)).toEqual({ screen: 'blueSwap' })
  })
})

describe('pill game machine: start over', () => {
  it('returns to the landing screen from every state', () => {
    const states: PillState[] = [
      { screen: 'red', index: 2 },
      { screen: 'redEnd' },
      { screen: 'blueSwap' },
      { screen: 'green', index: 1, from: 'swap' },
      { screen: 'greenEnd', from: 'recap' },
    ]
    for (const s of states) expect(run([startOver], s)).toEqual(START)
  })

  it('ignores actions that do not apply to the landing screen', () => {
    expect(run([next])).toEqual(START)
    expect(run([back])).toEqual(START)
    expect(run([takeGreen])).toEqual(START)
  })
})
