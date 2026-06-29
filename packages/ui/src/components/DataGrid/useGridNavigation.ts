import { type Virtualizer } from '@tanstack/react-virtual'
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
} from 'react'

/** Active cell address. `colIndex` is the canonical 1-based column position. */
export interface ActiveCell {
  rowIndex: number
  colIndex: number
}

interface UseGridNavigationParams {
  /** The scroll viewport that owns both virtualizers. */
  scrollRef: RefObject<HTMLDivElement | null>
  rowCount: number
  /** Canonical 1-based column indices of the scrollable (virtualized) columns. */
  scrollColIndices: number[]
  /** Canonical 1-based column indices of the frozen columns. */
  frozenColIndices: number[]
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
  /** Toggle selection for the data row at `rowIndex` (0-based). */
  onActivateRow: (rowIndex: number) => void
  /**
   * Active cell, lifted to the parent so the virtualizers can keep it mounted
   * (pinned) and so the frozen overlay can mirror its focus ring.
   */
  active: ActiveCell
  setActive: Dispatch<SetStateAction<ActiveCell>>
  /** Whether the grid currently has selection enabled (drives Space handling). */
  selectable: boolean
}

interface UseGridNavigationResult {
  active: ActiveCell
  /** `0` for the active cell (roving), `-1` for all others. */
  tabIndexFor: (rowIndex: number, colIndex: number) => 0 | -1
  /** Record focus when a cell is clicked/tabbed into, so roving stays in sync. */
  onCellFocus: (cell: ActiveCell) => void
  /** Key handler bound on the grid root. */
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

const FIRST_DATA_ROW = 0

/** Rows skipped by a single PageUp/PageDown press. */
const PAGE_STEP = 10

/** Deferred-focus retries before giving up, so focus is never stranded. */
const MAX_FOCUS_ATTEMPTS = 3

/**
 * Pure reducer from a navigation key to the next active cell, clamped to the
 * grid bounds. Returns `null` for keys that do not move focus.
 */
function nextCell(
  key: string,
  active: ActiveCell,
  colIndices: number[],
  rowCount: number,
): ActiveCell | null {
  const lastRow = rowCount - 1
  const colPos = colIndices.indexOf(active.colIndex)
  const lastColPos = colIndices.length - 1
  const rowAt = (row: number) => ({
    ...active,
    rowIndex: Math.min(Math.max(row, FIRST_DATA_ROW), lastRow),
  })
  const colAt = (pos: number) => ({
    ...active,
    colIndex: colIndices[Math.min(Math.max(pos, 0), lastColPos)]!,
  })

  switch (key) {
    case 'ArrowDown':
      return rowAt(active.rowIndex + 1)
    case 'ArrowUp':
      return rowAt(active.rowIndex - 1)
    case 'PageDown':
      return rowAt(active.rowIndex + PAGE_STEP)
    case 'PageUp':
      return rowAt(active.rowIndex - PAGE_STEP)
    case 'ArrowRight':
      return colAt(colPos + 1)
    case 'ArrowLeft':
      return colAt(colPos - 1)
    case 'Home':
      return colAt(0)
    case 'End':
      return colAt(lastColPos)
    default:
      return null
  }
}

/**
 * Roving-tabindex keyboard navigation for the virtualized grid body (WAI-ARIA
 * `grid` pattern). One cell is the tab stop (`tabIndex=0`); arrows move the
 * active cell, scrolling the virtualizers so an off-window target mounts before
 * we focus it. Enter/Space toggles the row's selection.
 *
 * Navigation runs over the canonical cell grid (frozen columns first, then
 * scroll columns), matching the off-screen semantic cells in the scroll body —
 * never the purely visual, `aria-hidden` frozen overlay.
 */
export function useGridNavigation({
  scrollRef,
  rowCount,
  scrollColIndices,
  frozenColIndices,
  rowVirtualizer,
  columnVirtualizer,
  onActivateRow,
  active,
  setActive,
  selectable,
}: UseGridNavigationParams): UseGridNavigationResult {
  const colIndices = [...frozenColIndices, ...scrollColIndices]

  // After a move that may require scrolling an off-window cell into view, focus
  // is deferred until the cell has mounted. The pending target lives in a ref so
  // the layout effect can pick it up without re-running on unrelated renders.
  // `attempts` bounds the retry so a target that never mounts (e.g. out-of-range
  // index) cannot leave focus pinned to a stale pending cell forever.
  const pendingFocus = useRef<{ cell: ActiveCell; attempts: number } | null>(
    null,
  )

  const focusCell = useCallback(
    (cell: ActiveCell) => {
      const node = scrollRef.current
      if (!node) return false
      const target = node.querySelector<HTMLElement>(
        `[role="gridcell"][aria-rowindex="${cell.rowIndex + 2}"][aria-colindex="${cell.colIndex}"]`,
      )
      if (!target) return false
      target.focus()
      return true
    },
    [scrollRef],
  )

  // A frozen column lives off-screen inside the scroll row (clipped), so it is
  // always mounted with its row; only scroll columns need horizontal scrolling.
  const ensureColumnVisible = useCallback(
    (colIndex: number) => {
      const scrollPos = scrollColIndices.indexOf(colIndex)
      if (scrollPos >= 0) columnVirtualizer.scrollToIndex(scrollPos)
    },
    [scrollColIndices, columnVirtualizer],
  )

  const moveTo = useCallback(
    (cell: ActiveCell) => {
      setActive(cell)
      rowVirtualizer.scrollToIndex(cell.rowIndex)
      ensureColumnVisible(cell.colIndex)
      // Try an immediate focus; if the target is not mounted yet (it was outside
      // the window), the layout effect retries once the scroll has rendered it.
      if (!focusCell(cell)) pendingFocus.current = { cell, attempts: 0 }
    },
    [rowVirtualizer, ensureColumnVisible, focusCell, setActive],
  )

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    if (focusCell(pending.cell)) {
      pendingFocus.current = null
      return
    }
    // Give up after a few renders so a never-mounting target does not strand the
    // pending state (the active cell is pinned mounted, so this is a safety net).
    pending.attempts += 1
    if (pending.attempts >= MAX_FOCUS_ATTEMPTS) pendingFocus.current = null
  })

  const onCellFocus = useCallback(
    (cell: ActiveCell) => {
      setActive(cell)
    },
    [setActive],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement
      const role = target.getAttribute('role')

      // Header cells and the resize separator own their own key handlers; never
      // hijack their keys.
      if (role === 'columnheader' || role === 'separator') return

      // Normal path: focus is on a body gridcell. Recovery path: focus fell back
      // to the grid root (target === currentTarget) because the active cell was
      // virtualized away by mouse-wheel scrolling. In both cases we drive the
      // active cell; recovery additionally re-mounts and re-focuses it.
      const fromCell = role === 'gridcell'
      const fromRoot = target === event.currentTarget
      if (!fromCell && !fromRoot) return

      if (event.key === 'Enter' || event.key === ' ') {
        // Without selection, Space has no action — let it scroll the viewport
        // rather than swallowing the keypress.
        if (!selectable && event.key === ' ') return
        event.preventDefault()
        if (fromRoot) focusCell(active)
        onActivateRow(active.rowIndex)
        return
      }

      const next = nextCell(event.key, active, colIndices, rowCount)
      if (!next) return
      event.preventDefault()
      moveTo(next)
    },
    [
      active,
      colIndices,
      rowCount,
      moveTo,
      onActivateRow,
      selectable,
      focusCell,
    ],
  )

  const tabIndexFor = useCallback(
    (rowIndex: number, colIndex: number): 0 | -1 =>
      rowIndex === active.rowIndex && colIndex === active.colIndex ? 0 : -1,
    [active],
  )

  return { active, tabIndexFor, onCellFocus, onKeyDown }
}
