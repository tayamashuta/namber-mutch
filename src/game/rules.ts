import { ROW_SIZE, type GameState, type NumberCell } from './types'

export function canPair(a: number, b: number): boolean {
  return a === b || a + b === 10
}

export function isValidPair(board: NumberCell[], first: number, second: number): boolean {
  if (
    first === second ||
    first < 0 ||
    second < 0 ||
    first >= board.length ||
    second >= board.length ||
    board[first] === null ||
    board[second] === null
  ) return false
  if (!canPair(board[first]!, board[second]!)) return false

  const left = Math.min(first, second)
  const right = Math.max(first, second)
  const leftRow = Math.floor(left / ROW_SIZE)
  const rightRow = Math.floor(right / ROW_SIZE)
  const leftColumn = left % ROW_SIZE
  const rightColumn = right % ROW_SIZE

  if (leftRow === rightRow) {
    return board.slice(left + 1, right).every((cell) => cell === null)
  }

  const wrapsToNextRow = rightRow === leftRow + 1 && leftColumn === ROW_SIZE - 1 && rightColumn === 0
  if (wrapsToNextRow || right - left === ROW_SIZE) return true

  const rowDistance = rightRow - leftRow
  const columnDistance = Math.abs(rightColumn - leftColumn)
  if (rowDistance !== columnDistance || rowDistance < 1) return false

  const columnStep = Math.sign(rightColumn - leftColumn)
  for (let step = 1; step < rowDistance; step += 1) {
    const intermediateIndex = (leftRow + step) * ROW_SIZE + leftColumn + columnStep * step
    if (board[intermediateIndex] !== null) return false
  }
  return true
}

export function findAvailablePair(board: NumberCell[]): [number, number] | null {
  for (let first = 0; first < board.length; first += 1) {
    if (board[first] === null) continue
    for (let second = first + 1; second < board.length; second += 1) {
      if (isValidPair(board, first, second)) return [first, second]
    }
  }
  return null
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function createPuzzleNumbers(): number[] {
  const pairs = Array.from({ length: 17 }, () => {
    const first = Math.floor(Math.random() * 9) + 1
    const second = Math.random() < 0.5 ? first : 10 - first
    return [first, second]
  }).flat()
  const numbers = [...pairs, Math.floor(Math.random() * 9) + 1]

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shuffled = shuffle(numbers)
    if (findAvailablePair(shuffled)) return shuffled
  }

  const shuffled = shuffle(numbers)
  shuffled[0] = 5
  shuffled[1] = 5
  return shuffled
}

export function createInitialState(): GameState {
  return {
    board: createPuzzleNumbers(),
    score: 0,
    history: [],
    selectedIndex: null,
    hintPair: null,
  }
}

export function removePair(state: GameState, first: number, second: number): GameState {
  if (!isValidPair(state.board, first, second)) {
    return { ...state, selectedIndex: second, hintPair: null }
  }

  const board = [...state.board]
  board[first] = null
  board[second] = null
  return {
    ...state,
    board,
    score: state.score + 10,
    history: [...state.history, { board: [...state.board], score: state.score }],
    selectedIndex: null,
    hintPair: null,
  }
}

export function addRemainingNumbers(state: GameState): GameState {
  const remaining = state.board.filter((cell): cell is number => cell !== null)
  if (remaining.length === 0) return state
  return {
    ...state,
    board: [...state.board, ...remaining],
    history: [...state.history, { board: [...state.board], score: state.score }],
    selectedIndex: null,
    hintPair: null,
  }
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1)
  if (!previous) return state
  return {
    ...state,
    board: previous.board,
    score: previous.score,
    history: state.history.slice(0, -1),
    selectedIndex: null,
    hintPair: null,
  }
}