import { useCallback, useEffect, useRef, useState } from 'react'

import { useControllableState } from '../../hooks'
import { MIN_COLUMN_WIDTH } from './types'

interface ResizeConstraints {
  /** Resolved minimum width per column id. */
  minWidthOf: (columnId: string) => number
  /** Declared/base width per column id (used when no override exists yet). */
  baseWidthOf: (columnId: string) => number
}

interface UseColumnResizeResult {
  widths: Record<string, number>
  widthOf: (columnId: string) => number
  start: (columnId: string, startClientX: number) => void
  nudge: (columnId: string, deltaPx: number) => void
  activeColumnId: string | null
}

interface DragState {
  columnId: string
  startClientX: number
  startWidth: number
}

/**
 * Headless column-resize engine.
 *
 * Pointer drags are tracked on `window` so the gesture survives the cursor
 * leaving the handle, and widths are applied through a single setter so the
 * grid stays a controlled-or-uncontrolled component. `nudge` powers keyboard
 * resizing (Arrow keys on a focused handle).
 */
export function useColumnResize(
  constraints: ResizeConstraints,
  value: Record<string, number> | undefined,
  defaultValue: Record<string, number> | undefined,
  onChange: ((next: Record<string, number>) => void) | undefined,
): UseColumnResizeResult {
  const [widths, setWidths] = useControllableState<Record<string, number>>({
    value,
    defaultValue: defaultValue ?? {},
    onChange,
  })

  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const constraintsRef = useRef(constraints)
  constraintsRef.current = constraints

  const widthOf = useCallback(
    (columnId: string) =>
      widths[columnId] ?? constraintsRef.current.baseWidthOf(columnId),
    [widths],
  )

  const applyWidth = useCallback(
    (columnId: string, rawWidth: number) => {
      const min = constraintsRef.current.minWidthOf(columnId) || MIN_COLUMN_WIDTH
      const next = Math.max(min, Math.round(rawWidth))
      setWidths((prev) => {
        if (prev[columnId] === next) return prev
        return { ...prev, [columnId]: next }
      })
    },
    [setWidths],
  )

  const nudge = useCallback(
    (columnId: string, deltaPx: number) => {
      const current =
        widths[columnId] ?? constraintsRef.current.baseWidthOf(columnId)
      applyWidth(columnId, current + deltaPx)
    },
    [widths, applyWidth],
  )

  const start = useCallback(
    (columnId: string, startClientX: number) => {
      const startWidth =
        widths[columnId] ?? constraintsRef.current.baseWidthOf(columnId)
      dragRef.current = { columnId, startClientX, startWidth }
      setActiveColumnId(columnId)
    },
    [widths],
  )

  useEffect(() => {
    if (activeColumnId === null) return

    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      applyWidth(drag.columnId, drag.startWidth + (event.clientX - drag.startClientX))
    }

    const handleUp = () => {
      dragRef.current = null
      setActiveColumnId(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [activeColumnId, applyWidth])

  return { widths, widthOf, start, nudge, activeColumnId }
}
