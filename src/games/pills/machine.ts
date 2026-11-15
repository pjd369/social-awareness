/**
 * The pill game as a small state machine:
 * start → red (one card at a time) → back to start after the last card
 * start → blue blackout (about 3 seconds) → blue reality → green (a few pages) → exit → start
 * Start over returns to start from anywhere.
 */
export type PillPath = 'red' | 'blue'

export type PillState =
  | { screen: 'start' }
  | { screen: 'red'; index: number }
  | { screen: 'blueBlackout' }
  | { screen: 'blueReality' }
  | { screen: 'green'; index: number }

export type PillAction =
  | { type: 'choose'; path: PillPath }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'blackoutDone' }
  | { type: 'takeGreen' }
  | { type: 'exit' }
  | { type: 'startOver' }

export const START: PillState = { screen: 'start' }

export function pillReducer(redCount: number, greenCount: number) {
  return (state: PillState, action: PillAction): PillState => {
    switch (action.type) {
      case 'choose':
        if (action.path === 'blue') return { screen: 'blueBlackout' }
        return redCount > 0 ? { screen: 'red', index: 0 } : START
      case 'next':
        if (state.screen === 'red') {
          // Finishing the last red card returns to the start, where either pill can be chosen.
          return state.index + 1 < redCount ? { screen: 'red', index: state.index + 1 } : START
        }
        if (state.screen === 'green') {
          return state.index + 1 < greenCount ? { screen: 'green', index: state.index + 1 } : state
        }
        return state
      case 'back':
        if (state.screen === 'red') {
          return state.index > 0 ? { screen: 'red', index: state.index - 1 } : START
        }
        if (state.screen === 'green') {
          return state.index > 0
            ? { screen: 'green', index: state.index - 1 }
            : { screen: 'blueReality' }
        }
        return state
      case 'blackoutDone':
        return state.screen === 'blueBlackout' ? { screen: 'blueReality' } : state
      case 'takeGreen':
        return state.screen === 'blueReality' && greenCount > 0
          ? { screen: 'green', index: 0 }
          : state
      case 'exit':
        // Only the last green page has an Exit button.
        return state.screen === 'green' && state.index + 1 >= greenCount ? START : state
      case 'startOver':
        return START
    }
  }
}
