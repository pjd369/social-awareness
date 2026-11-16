import { describe, expect, it } from 'vitest'
import { START, pillReducer, type PillAction, type PillState } from './machine'

const run = (actions: PillAction[], from: PillState = START, reds = 3, greens = 3) =>
  actions.reduce(pillReducer(reds, greens), from)

const red: PillAction = { type: 'choose', path: 'red' }
const blue: PillAction = { type: 'choose', path: 'blue' }
const next: PillAction = { type: 'next' }
const back: PillAction = { type: 'back' }

describe('pill game machine: red pill', () => {
  it('walks the red cards one at a time', () => {
    expect(run([red])).toEqual({ screen: 'red', index: 0 })
    expect(run([red, next, next])).toEqual({ screen: 'red', index: 2 })
  })

  it('returns to the landing screen after the last red card, not to the green pill', () => {
    expect(run([red, next, next, next])).toEqual(START)
  })

  it('lets the red pill be replayed, or the blue pill chosen, after finishing', () => {
    const finished = run([red, next, next, next])
    expect(run([red], finished)).toEqual({ screen: 'red', index: 0 })
    expect(run([blue], finished)).toEqual({ screen: 'blueBlackout' })
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
  it('goes blackout, then the reality screen, then the green pill', () => {
    expect(run([blue])).toEqual({ screen: 'blueBlackout' })
    expect(run([blue, { type: 'blackoutDone' }])).toEqual({ screen: 'blueReality' })
    expect(run([blue, { type: 'blackoutDone' }, { type: 'takeGreen' }])).toEqual({
      screen: 'green',
      index: 0,
    })
  })

  it('cannot skip the blackout or the reality screen', () => {
    expect(run([blue, next])).toEqual({ screen: 'blueBlackout' })
    expect(run([blue, { type: 'takeGreen' }])).toEqual({ screen: 'blueBlackout' })
    expect(run([{ type: 'takeGreen' }])).toEqual(START)
    expect(run([{ type: 'blackoutDone' }])).toEqual(START)
  })
})

describe('pill game machine: green pill', () => {
  const toGreen: PillAction[] = [blue, { type: 'blackoutDone' }, { type: 'takeGreen' }]

  it('walks the green pages with Next and Back', () => {
    expect(run([...toGreen, next])).toEqual({ screen: 'green', index: 1 })
    expect(run([...toGreen, next, next])).toEqual({ screen: 'green', index: 2 })
    expect(run([...toGreen, next, back])).toEqual({ screen: 'green', index: 0 })
  })

  it('goes back from the first green page to the reality screen', () => {
    expect(run([...toGreen, back])).toEqual({ screen: 'blueReality' })
  })

  it('has no Next after the last page; Exit returns to the landing screen', () => {
    expect(run([...toGreen, next, next, next])).toEqual({ screen: 'green', index: 2 })
    expect(run([...toGreen, next, next, { type: 'exit' }])).toEqual(START)
  })

  it('does not exit from a page that is not the last', () => {
    expect(run([...toGreen, { type: 'exit' }])).toEqual({ screen: 'green', index: 0 })
  })

  it('lets both pills be chosen again after exiting', () => {
    const exited = run([...toGreen, next, next, { type: 'exit' }])
    expect(run([red], exited)).toEqual({ screen: 'red', index: 0 })
    expect(run([blue], exited)).toEqual({ screen: 'blueBlackout' })
  })
})

describe('pill game machine: start over', () => {
  it('returns to the landing screen from every state', () => {
    const states: PillState[] = [
      { screen: 'red', index: 2 },
      { screen: 'blueBlackout' },
      { screen: 'blueReality' },
      { screen: 'green', index: 1 },
    ]
    for (const s of states) expect(run([{ type: 'startOver' }], s)).toEqual(START)
  })

  it('ignores actions that do not apply to the landing screen', () => {
    expect(run([next])).toEqual(START)
    expect(run([back])).toEqual(START)
    expect(run([{ type: 'exit' }])).toEqual(START)
  })
})
