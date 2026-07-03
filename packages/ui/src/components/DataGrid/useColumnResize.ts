import { useCallback, useEffect, useRef, useState } from 'react'

import { useControllableState } from '../../hooks'
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './types'

interface ResizeConstraints {
  minWidthOf: (columnId: string) => number
  // Объявленная/базовая ширина — пока нет пользовательского override.
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

// Headless-движок ресайза столбцов: pointer-драг слушается на window, чтобы жест
// пережил уход курсора с ручки; ширины идут через один сеттер (controlled/
// uncontrolled). nudge — клавиатурный ресайз (стрелки на ручке).
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

  const clampWidth = useCallback((columnId: string, rawWidth: number) => {
    const min = constraintsRef.current.minWidthOf(columnId) || MIN_COLUMN_WIDTH
    // Зажимаем с обеих сторон: снизу — minWidth столбца, сверху — MAX_COLUMN_WIDTH,
    // чтобы ширина не превысила объявленный слайдеру aria-valuemax (ARIA-контракт,
    // на который опирается header-ячейка).
    return Math.min(MAX_COLUMN_WIDTH, Math.max(min, Math.round(rawWidth)))
  }, [])

  const applyWidth = useCallback(
    (columnId: string, rawWidth: number) => {
      const next = clampWidth(columnId, rawWidth)
      setWidths((prev) => {
        if (prev[columnId] === next) return prev
        return { ...prev, [columnId]: next }
      })
    },
    [clampWidth, setWidths],
  )

  const nudge = useCallback(
    (columnId: string, deltaPx: number) => {
      // Резолвим дельту от последней закоммиченной ширины внутри updater'а, чтобы
      // подряд идущие синхронные nudge аккумулировались, а не читали одно
      // устаревшее значение из замыкания.
      setWidths((prev) => {
        const current =
          prev[columnId] ?? constraintsRef.current.baseWidthOf(columnId)
        const next = clampWidth(columnId, current + deltaPx)
        if (prev[columnId] === next) return prev
        return { ...prev, [columnId]: next }
      })
    },
    [clampWidth, setWidths],
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
