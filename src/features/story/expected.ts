import type { Story } from '../../content/schemas'
import type { StoryHistory } from './state'

/**
 * True when every step that offered an expected decision was answered with
 * that decision, and the path has reached an ending. Stories with no expected
 * choices never qualify.
 */
export function followedExpectedPath(story: Story, history: StoryHistory): boolean {
  const byId = new Map(story.nodes.map((node) => [node.id, node]))
  const last = byId.get(history[history.length - 1] ?? '')
  if (!last?.ending) return false

  let followed = false
  for (let i = 0; i < history.length - 1; i++) {
    const node = byId.get(history[i] ?? '')
    const next = history[i + 1]
    if (!node?.choices || next === undefined) return false
    const taken = node.choices.find((choice) => choice.next === next)
    if (!taken) return false
    if (node.choices.some((choice) => choice.expected)) {
      if (!taken.expected) return false
      followed = true
    }
  }
  return followed
}
