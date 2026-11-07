import { useEffect, useMemo, useRef, useState } from 'react'
import { addRemainingNumbers, createInitialState, findAvailablePair, removePair, undo } from './game/rules'
import type { GameState } from './game/types'
import { ROW_SIZE } from './game/types'
import './App.css'

const BEST_SCORE_KEY = 'number-match-best-score'

function readBestScore() {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

interface ConnectionSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

function App() {
  const [game, setGame] = useState<GameState>(createInitialState)
  const [bestScore, setBestScore] = useState(readBestScore)
  const [connection, setConnection] = useState<{ segments: ConnectionSegment[]; width: number; height: number; sequential: boolean } | null>(null)
  const boardWrapRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([])
  const availablePair = useMemo(() => findAvailablePair(game.board), [game.board])
  const remainingCount = game.board.filter((cell) => cell !== null).length
  const isComplete = remainingCount === 0
  const visibleCellCount = Math.ceil(game.board.length / ROW_SIZE) * ROW_SIZE

  useEffect(() => {
    if (!connection) return
    const timeout = window.setTimeout(() => setConnection(null), connection.sequential ? 1300 : 720)
    return () => window.clearTimeout(timeout)
  }, [connection])

  function startNewGame() {
    setGame(createInitialState())
  }

  function showHint() {
    const pair = findAvailablePair(game.board)
    if (pair) setGame((current) => ({ ...current, hintPair: pair, selectedIndex: null }))
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return
      if (event.key.toLowerCase() === 'h') showHint()
      if (event.key.toLowerCase() === 'u') setGame((current) => undo(current))
      if (event.key.toLowerCase() === 'n') startNewGame()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function selectCell(index: number) {
    if (game.board[index] === null) return
    if (game.selectedIndex === null) {
      setGame({ ...game, selectedIndex: index, hintPair: null })
      return
    }
    if (game.selectedIndex === index) {
      setGame({ ...game, selectedIndex: null })
      return
    }

    const next = removePair(game, game.selectedIndex, index)
    setGame(next)
    if (next.score > game.score) {
      const wrapper = boardWrapRef.current
      const boardElement = boardRef.current
      const firstCell = cellRefs.current[game.selectedIndex]
      const secondCell = cellRefs.current[index]
      if (wrapper && boardElement && firstCell && secondCell) {
        const bounds = wrapper.getBoundingClientRect()
        const boardBounds = boardElement.getBoundingClientRect()
        const firstBounds = firstCell.getBoundingClientRect()
        const secondBounds = secondCell.getBoundingClientRect()
        const firstIndex = Math.min(game.selectedIndex, index)
        const secondIndex = Math.max(game.selectedIndex, index)
        const wrapsToNextRow =
          secondIndex - firstIndex === 1 &&
          Math.floor(firstIndex / ROW_SIZE) + 1 === Math.floor(secondIndex / ROW_SIZE) &&
          firstIndex % ROW_SIZE === ROW_SIZE - 1 &&
          secondIndex % ROW_SIZE === 0
        const firstCenter = {
          x: firstBounds.left + firstBounds.width / 2 - bounds.left,
          y: firstBounds.top + firstBounds.height / 2 - bounds.top,
        }
        const secondCenter = {
          x: secondBounds.left + secondBounds.width / 2 - bounds.left,
          y: secondBounds.top + secondBounds.height / 2 - bounds.top,
        }
        const segments: ConnectionSegment[] = wrapsToNextRow
          ? [
              { x1: firstCenter.x, y1: firstCenter.y, x2: boardBounds.right - bounds.left, y2: firstCenter.y },
              { x1: boardBounds.left - bounds.left, y1: secondCenter.y, x2: secondCenter.x, y2: secondCenter.y },
            ]
          : [{ x1: firstCenter.x, y1: firstCenter.y, x2: secondCenter.x, y2: secondCenter.y }]
        setConnection({
          segments,
          width: bounds.width,
          height: bounds.height,
          sequential: wrapsToNextRow,
        })
      }
    }
    if (next.score > bestScore) {
      setBestScore(next.score)
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(next.score))
      } catch {
        // The game remains playable when browser storage is unavailable.
      }
    }
  }

  function handleAddNumbers() {
    setGame((current) => addRemainingNumbers(current))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Namber Mutch ホーム">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>Namber Mutch</span>
        </a>
      </header>

      <section className="game-layout" aria-label="Number Match ゲーム">
        <div className="game-card">
          <div className="game-card-header">
            <div>
              <span className="section-kicker">PUZZLE No. 001</span>
              <h2>今日のナンバーマッチ</h2>
            </div>
            <button type="button" className="new-game-button" onClick={startNewGame}>
              <span aria-hidden="true">↻</span> 新しいゲーム
            </button>
          </div>

          <div className="score-strip" aria-label={`スコア ${game.score}、ベスト ${bestScore}`}>
            <div className="score-item"><span className="score-label">SCORE</span><strong>{String(game.score).padStart(3, '0')}</strong></div>
            <span className="score-divider" />
            <div className="score-item best-score"><span className="score-label">BEST</span><strong>{String(bestScore).padStart(3, '0')}</strong></div>
            <div className="remaining-pill"><span className="remaining-dot" />残り <strong>{remainingCount}</strong></div>
          </div>

          <div className="board-wrap" ref={boardWrapRef}>
            <div className="board" ref={boardRef} role="group" aria-label="数字の盤面">
              {Array.from({ length: visibleCellCount }, (_, index) => {
                const number = game.board[index] ?? null
                const isSelected = game.selectedIndex === index
                const isHinted = game.hintPair?.includes(index) ?? false
                const rowNumber = Math.floor(index / ROW_SIZE) + 1
                const columnNumber = (index % ROW_SIZE) + 1
                return (
                  <button
                    className={`number-cell${number === null ? ' is-empty' : ''}${isSelected ? ' is-selected' : ''}${isHinted ? ' is-hinted' : ''}`}
                    key={index}
                    ref={(element) => { cellRefs.current[index] = element }}
                    type="button"
                    disabled={number === null}
                    onClick={() => selectCell(index)}
                    aria-label={number === null ? `行${rowNumber}列${columnNumber} 空き` : `行${rowNumber}列${columnNumber} 数字${number}${isSelected ? ' 選択中' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {number}
                  </button>
                )
              })}
            </div>
            {connection && (
              <svg className={`pair-connection${connection.sequential ? ' is-sequential' : ''}`} viewBox={`0 0 ${connection.width} ${connection.height}`} aria-hidden="true">
                {connection.segments.map((segment, index) => (
                  <line key={index} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} />
                ))}
              </svg>
            )}
            {isComplete && (
              <div className="completion-banner" role="status">
                <span aria-hidden="true">✦</span><strong>すべての数字をクリア！</strong><span>新しいゲームで、もう一度。</span>
              </div>
            )}
            {!availablePair && !isComplete && (
              <div className="stuck-banner" role="status">次の一手が見つからないみたい。数字を追加して続けよう。</div>
            )}
          </div>

          <div className="board-hint" aria-live="polite">
            <span className="hint-icon" aria-hidden="true">✦</span>
            {game.hintPair ? '光っている2つの数字を消してみよう' : game.selectedIndex !== null ? 'ペアになる数字をもうひとつ選んでね' : 'ペアをタップして選ぼう'}
          </div>

          <div className="action-row">
            <button type="button" className="action-button secondary-action" onClick={() => setGame((current) => undo(current))} disabled={game.history.length === 0}>
              <span aria-hidden="true">↶</span><span>ひとつ戻す<small>UNDO</small></span>
            </button>
            <button type="button" className="action-button hint-action" onClick={showHint} disabled={!availablePair}>
              <span className="action-symbol" aria-hidden="true">✧</span><span>ヒント<small>HINT</small></span>
            </button>
            <button type="button" className="action-button add-action" onClick={handleAddNumbers} disabled={isComplete}>
              <span aria-hidden="true">＋</span><span>数字を追加<small>{isComplete ? 'クリア済み' : '残り数字を追加'}</small></span>
            </button>
          </div>
          <p className="keyboard-note">キーボードショートカット： <kbd>H</kbd> ヒント <kbd>U</kbd> 戻す <kbd>N</kbd> 新しいゲーム</p>
        </div>
      </section>

    </main>
  )
}

export default App
