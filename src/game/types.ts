export type NumberCell = number | null

export interface GameState {
  board: NumberCell[]
  score: number
  history: Array<{ board: NumberCell[]; score: number }>
  selectedIndex: number | null
  hintPair: [number, number] | null
}

export const ROW_SIZE = 9