/**
 * The pill game as a small state machine:
 * start → red (one card at a time) → red recap (the cards in brief, with the
 *         green pill on offer) → green, or back to start
 * start → blue swap (on the same screen, the guide tosses the blue pill away
 *         and offers a green pill instead) → green (a few pages) → green plan
 *         (the solutions the visitor chose to try) → start
 * From the blue swap screen the red pill can still be taken.
 * Start over returns to start from anywhere.
 */
export type PillPath = 'red' | 'blue'

/** How the green pages were reached: from the blue swap, or from the red recap. */
export type GreenFrom = 'swap' | 'recap'

export type PillState =
  | { screen: 'start' }
  | { screen: 'red'; index: number }
  | { screen: 'redEnd' }
  | { screen: 'blueSwap' }
  | { screen: 'green'; index: number; from: GreenFrom }
  | { screen: 'greenEnd'; from: GreenFrom }

export type PillAction =
  | { type: 'choose'; path: PillPath }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'takeGreen' }
  /** From the red recap: open one red card again. */
  | { type: 'review'; index: number }
  | { type: 'startOver' }

export const START: PillState = { screen: 'start' }

export function pillReducer(redCount: number, greenCount: number) {
  return (state: PillState, action: PillAction): PillState => {
    switch (action.type) {
      case 'choose':
        if (action.path === 'blue') return { screen: 'blueSwap' }
        return redCount > 0 ? { screen: 'red', index: 0 } : START
      case 'next':
        if (state.screen === 'red') {
          // The last red card is followed by the recap, where the green pill is on offer.
          return state.index + 1 < redCount
            ? { screen: 'red', index: state.index + 1 }
            : { screen: 'redEnd' }
        }
        if (state.screen === 'green') {
          return state.index + 1 < greenCount
            ? { ...state, index: state.index + 1 }
            : { screen: 'greenEnd', from: state.from }
        }
        return state
      case 'back':
        if (state.screen === 'red') {
          return state.index > 0 ? { screen: 'red', index: state.index - 1 } : START
        }
        if (state.screen === 'redEnd') return { screen: 'red', index: redCount - 1 }
        if (state.screen === 'green') {
          if (state.index > 0) return { ...state, index: state.index - 1 }
          return state.from === 'recap' ? { screen: 'redEnd' } : { screen: 'blueSwap' }
        }
        if (state.screen === 'greenEnd') {
          return { screen: 'green', index: greenCount - 1, from: state.from }
        }
        return state
      case 'takeGreen':
        // The green pill is on offer once the blue one has been tossed away, and after the red cards.
        if (greenCount === 0) return state
        if (state.screen === 'blueSwap') return { screen: 'green', index: 0, from: 'swap' }
        if (state.screen === 'redEnd') return { screen: 'green', index: 0, from: 'recap' }
        return state
      case 'review':
        return state.screen === 'redEnd' && action.index >= 0 && action.index < redCount
          ? { screen: 'red', index: action.index }
          : state
      case 'startOver':
        return START
    }
  }
}
