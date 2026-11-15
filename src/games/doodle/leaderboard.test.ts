import { describe, expect, it } from 'vitest'
import { dayKey, firebaseConfig, memoryLeaderboard } from './leaderboard'

describe('dayKey()', () => {
  it('uses the US Pacific calendar date for everyone', () => {
    // 07:59 UTC on 6 January is 23:59 on 5 January in Pacific Standard Time.
    expect(dayKey(new Date(Date.UTC(2026, 0, 6, 7, 59)))).toBe('2026-01-05')
    expect(dayKey(new Date(Date.UTC(2026, 0, 6, 8, 0)))).toBe('2026-01-06')
    // Daylight saving time: 06:59 UTC on 2 July is 23:59 on 1 July in PDT.
    expect(dayKey(new Date(Date.UTC(2026, 6, 2, 6, 59)))).toBe('2026-07-01')
  })
})

describe('firebaseConfig()', () => {
  it('needs an API key and a project id', () => {
    expect(firebaseConfig({})).toBeNull()
    expect(firebaseConfig({ VITE_FIREBASE_API_KEY: 'k' })).toBeNull()
    expect(firebaseConfig({ VITE_FIREBASE_API_KEY: 'k', VITE_FIREBASE_PROJECT_ID: 'p' })).toEqual({
      apiKey: 'k',
      projectId: 'p',
      authDomain: 'p.firebaseapp.com',
      appId: undefined,
    })
  })
})

describe('leaderboard', () => {
  it("keeps each name's best score for the day and shows the top three", async () => {
    const board = memoryLeaderboard()
    await board.submit('2026-01-05', 'Riya', 4)
    await board.submit('2026-01-05', 'riya', 2)
    await board.submit('2026-01-05', 'Aarav', 9)
    await board.submit('2026-01-05', 'Meera', 6)
    await board.submit('2026-01-05', 'Dev', 1)
    await board.submit('2026-01-04', 'Old', 50)

    expect(await board.read('2026-01-05')).toEqual({
      top: [
        { name: 'Aarav', score: 9 },
        { name: 'Meera', score: 6 },
        { name: 'Riya', score: 4 },
      ],
      players: 4,
    })
  })

  it('counts a player who scored zero', async () => {
    const board = memoryLeaderboard()
    await board.submit('2026-01-05', 'Riya', 0)
    expect((await board.read('2026-01-05')).players).toBe(1)
  })
})
