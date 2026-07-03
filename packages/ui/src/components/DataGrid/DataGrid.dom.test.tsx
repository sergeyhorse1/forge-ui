import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DataGrid } from './DataGrid'
import type { ColumnDef } from './types'

// jsdom рапортует все элементы как 0×0 и не даёт ResizeObserver — виртуализатор
// замерил бы пустой вьюпорт и не смонтировал ни строки. Даём скролл-вьюпорту
// реальные offset* и no-op observer: с определённой высотой он монтирует видимое окно.
const VIEWPORT = { width: 600, height: 440 }
const offsetSpies: ReturnType<typeof vi.spyOn>[] = []

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )

  for (const [prop, size] of [
    ['offsetWidth', VIEWPORT.width],
    ['offsetHeight', VIEWPORT.height],
  ] as const) {
    offsetSpies.push(
      vi
        .spyOn(HTMLElement.prototype, prop, 'get')
        .mockImplementation(function (this: HTMLElement) {
          // Замер виртуализатора ведёт только скролл-вьюпорт.
          return this.classList.contains('overflow-auto') ? size : 0
        }),
    )
  }
})

afterEach(() => {
  for (const spy of offsetSpies.splice(0)) spy.mockRestore()
  vi.unstubAllGlobals()
})

interface Row {
  id: number
  team: string
  score: number
}

const ROWS: Row[] = [
  { id: 1, team: 'Red', score: 10 },
  { id: 2, team: 'Blue', score: 20 },
  { id: 3, team: 'Green', score: 30 },
]

const COLUMNS: ColumnDef<Row>[] = [
  { id: 'id', header: 'ID', width: 80, frozen: true },
  { id: 'team', header: 'Team', width: 160 },
  { id: 'score', header: 'Score', width: 120 },
]

const getRowKey = (row: Row) => row.id

function renderGrid(props: Partial<Parameters<typeof DataGrid<Row>>[0]> = {}) {
  return render(
    <DataGrid rows={ROWS} columns={COLUMNS} getRowKey={getRowKey} {...props} />,
  )
}

function colIndices(container: HTMLElement, role: string): number[] {
  return [...container.querySelectorAll(`[role="${role}"]`)]
    .map((el) => Number(el.getAttribute('aria-colindex')))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)
}

describe('DataGrid – structural roles', () => {
  it('mounts a grid with the documented landmark roles', () => {
    renderGrid()
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-rowcount', String(ROWS.length + 1))
    expect(grid).toHaveAttribute('aria-colcount', String(COLUMNS.length))
    expect(within(grid).getAllByRole('columnheader').length).toBe(COLUMNS.length)
    expect(within(grid).getAllByRole('row').length).toBeGreaterThan(0)
    expect(within(grid).getAllByRole('gridcell').length).toBeGreaterThan(0)
  })
})

describe('DataGrid – aria indices under (horizontal) virtualization', () => {
  it('numbers headers canonically, frozen column first', () => {
    const { container } = renderGrid()
    // Три столбца, frozen id идёт первым → colindex 1, 2, 3 без пропусков.
    expect(colIndices(container, 'columnheader')).toEqual([1, 2, 3])
  })

  it('gives every mounted body cell a 1-based aria-colindex and aria-rowindex', () => {
    renderGrid()
    const cells = screen.getAllByRole('gridcell')
    for (const cell of cells) {
      const colIndex = Number(cell.getAttribute('aria-colindex'))
      const rowIndex = Number(cell.getAttribute('aria-rowindex'))
      expect(colIndex).toBeGreaterThanOrEqual(1)
      expect(colIndex).toBeLessThanOrEqual(COLUMNS.length)
      // Шапка — строка 1, поэтому первая строка данных — aria-rowindex 2.
      expect(rowIndex).toBeGreaterThanOrEqual(2)
    }
  })

  it('exposes the frozen column inside the semantic grid tree', () => {
    renderGrid()
    // Frozen-столбец id (colindex 1) должен владеть настоящими gridcell'ами, а не
    // только aria-hidden визуальным оверлеем.
    const frozenCells = screen
      .getAllByRole('gridcell')
      .filter((cell) => cell.getAttribute('aria-colindex') === '1')
    expect(frozenCells.length).toBeGreaterThan(0)
  })
})

describe('DataGrid – keyboard selection (roving tabindex)', () => {
  it('selects a row by focusing a cell and pressing Enter', () => {
    renderGrid({ selection: { mode: 'multi' } })

    const firstCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-rowindex') === '2')
    expect(firstCell).toBeDefined()

    // Roving tabindex: активная ячейка — единственный таб-стоп.
    firstCell!.focus()
    expect(firstCell).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(firstCell!, { key: 'Enter' })

    const selectedRow = firstCell!.closest('[role="row"]')
    expect(selectedRow).toHaveAttribute('aria-selected', 'true')
  })

  it('moves the active cell down with ArrowDown and toggles that row with Space', () => {
    renderGrid({ selection: { mode: 'multi' } })

    const cellsInRow = (rowIndex: number) =>
      screen
        .getAllByRole('gridcell')
        .filter((cell) => cell.getAttribute('aria-rowindex') === String(rowIndex))

    const firstCell = cellsInRow(2)[0]!
    firstCell.focus()

    fireEvent.keyDown(firstCell, { key: 'ArrowDown' })

    // Фокус перекатился на ячейку строкой ниже — она становится таб-стопом.
    const secondRowCell = cellsInRow(3).find(
      (cell) => cell.getAttribute('aria-colindex') === '1',
    )
    expect(secondRowCell).toHaveAttribute('tabindex', '0')
    expect(secondRowCell).toHaveFocus()

    fireEvent.keyDown(secondRowCell!, { key: ' ' })
    expect(secondRowCell!.closest('[role="row"]')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // Первая строка остаётся невыделенной — тогглится только активная.
    expect(firstCell.closest('[role="row"]')).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('does not preventDefault Space when selection is disabled', () => {
    renderGrid() // режим выделения по умолчанию — 'none'

    const firstCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-rowindex') === '2')!
    firstCell.focus()

    // Без действия выделения Space должен проходить сквозь, чтобы вьюпорт мог
    // скроллиться — обработчик не должен звать preventDefault.
    const defaultPrevented = !fireEvent.keyDown(firstCell, { key: ' ' })
    expect(defaultPrevented).toBe(false)
    // И ни одна строка не выделяется.
    expect(firstCell.closest('[role="row"]')).not.toHaveAttribute(
      'aria-selected',
    )
  })

  it('still navigates with arrows after focus falls back to the grid root', () => {
    renderGrid({ selection: { mode: 'multi' } })

    const grid = screen.getByRole('grid')
    const firstCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.getAttribute('aria-rowindex') === '2')!
    firstCell.focus()

    // Имитируем потерю активной ячейки: фокусим корень сетки напрямую (как сделал
    // бы браузер после того, как виртуализация размонтировала ячейку) и жмём
    // стрелку оттуда. Recovery-путь всё равно должен сдвинуть активную ячейку.
    grid.focus()
    fireEvent.keyDown(grid, { key: 'ArrowDown' })

    const movedCell = screen
      .getAllByRole('gridcell')
      .find(
        (cell) =>
          cell.getAttribute('aria-rowindex') === '3' &&
          cell.getAttribute('aria-colindex') === '1',
      )
    expect(movedCell).toHaveAttribute('tabindex', '0')
  })
})
