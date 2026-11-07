import { describe, expect, it } from 'vitest'
import { addRemainingNumbers, canPair, createInitialState, findAvailablePair, isValidPair, removePair, undo } from './rules'

describe('Number Match rules', () => {
  it('matches identical numbers and pairs that sum to ten', () => {
    expect(canPair(4, 4)).toBe(true)
    expect(canPair(2, 8)).toBe(true)
    expect(canPair(3, 8)).toBe(false)
  })

  it('allows pairs across empty cells in the same row', () => {
    expect(isValidPair([1, null, 9], 0, 2)).toBe(true)
    expect(isValidPair([1, 2, null, 9], 0, 3)).toBe(false)
  })

  it('allows the same column in consecutive rows, but not a diagonal', () => {
    const board = [1, null, null, null, null, null, null, null, null, 9]
    expect(isValidPair(board, 0, 9)).toBe(true)
    expect(isValidPair(board, 0, 10)).toBe(false)
  })

  it('allows diagonal matches only when every cell between them is empty', () => {
    const board = Array.from<number | null>({ length: 21 }).fill(null)
    board[0] = 1
    board[20] = 9
    expect(isValidPair(board, 0, 20)).toBe(true)
    board[10] = 5
    expect(isValidPair(board, 0, 20)).toBe(false)
    const adjacentDiagonal = Array.from<number | null>({ length: 11 }).fill(null)
    adjacentDiagonal[0] = 1
    adjacentDiagonal[10] = 9
    expect(isValidPair(adjacentDiagonal, 0, 10)).toBe(true)
  })

  it('allows the last cell of a row to match the first cell of the next row', () => {
    const board = Array.from<number | null>({ length: 18 }).fill(null)
    board[8] = 1
    board[9] = 9
    expect(isValidPair(board, 8, 9)).toBe(true)
  })

  it('removes a match, scores it, and can append remaining numbers after a dead end', () => {
    const initial = createInitialState()
    expect(initial.board).toHaveLength(35)
    const pair = findAvailablePair(initial.board)
    expect(pair).not.toBeNull()
    const cleared = removePair(initial, ...pair!)
    expect(cleared.score).toBe(10)
    expect(cleared.board[pair![0]]).toBeNull()
    expect(undo(cleared).score).toBe(0)
    expect(undo(cleared).board).toEqual(initial.board)
    const noMoves = { ...cleared, board: [1, 2, 3] }
    expect(addRemainingNumbers(noMoves).board).toEqual([1, 2, 3, 1, 2, 3])
  })

  it('can append numbers even while a valid move is available', () => {
    const state = { ...createInitialState(), board: [1, 9, 2] }
    expect(addRemainingNumbers(state).board).toEqual([1, 9, 2, 1, 9, 2])
  })
})