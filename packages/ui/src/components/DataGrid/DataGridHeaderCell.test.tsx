import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataGridHeaderCell } from './DataGridHeaderCell'
import { RESIZE_KEYBOARD_STEP, type ColumnSortInfo, type ResolvedColumn } from './types'

interface Row {
  id: number
  name: string
}

function makeColumn(
  overrides: Partial<ResolvedColumn<Row>> = {},
): ResolvedColumn<Row> {
  return {
    def: { id: 'name', header: 'Name' },
    id: 'name',
    width: 160,
    minWidth: 64,
    align: 'left',
    frozen: false,
    sortable: true,
    resizable: true,
    colIndex: 1,
    ...overrides,
  }
}

const NO_SORT: ColumnSortInfo = { direction: null, priority: null }

function renderCell(
  props: Partial<Parameters<typeof DataGridHeaderCell<Row>>[0]> = {},
) {
  const handlers = {
    onToggleSort: vi.fn(),
    onResizeStart: vi.fn(),
    onResizeNudge: vi.fn(),
  }
  render(
    <DataGridHeaderCell
      column={makeColumn()}
      style={{}}
      sortInfo={NO_SORT}
      resizeActive={false}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('DataGridHeaderCell – sort affordance', () => {
  it('announces ascending sort with the up glyph and its priority', () => {
    renderCell({ sortInfo: { direction: 'asc', priority: 1 } })
    const header = screen.getByRole('columnheader')
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(header).toHaveTextContent('↑1')
  })

  it('announces descending sort with the down glyph', () => {
    renderCell({ sortInfo: { direction: 'desc', priority: null } })
    const header = screen.getByRole('columnheader')
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(header).toHaveTextContent('↓')
  })

  it('marks a sortable-but-unsorted column as aria-sort="none"', () => {
    renderCell({ sortInfo: NO_SORT })
    const header = screen.getByRole('columnheader')
    expect(header).toHaveAttribute('aria-sort', 'none')
    expect(header).toHaveAttribute('tabindex', '0')
    expect(header).toHaveTextContent('↕')
  })

  it('omits aria-sort and the tab stop when the column is not sortable', () => {
    renderCell({ column: makeColumn({ sortable: false }), sortInfo: NO_SORT })
    const header = screen.getByRole('columnheader')
    expect(header).not.toHaveAttribute('aria-sort')
    expect(header).toHaveAttribute('tabindex', '-1')
  })
})

describe('DataGridHeaderCell – sort interaction', () => {
  it('toggles sort on click, forwarding the shift modifier', () => {
    const { onToggleSort } = renderCell()
    fireEvent.click(screen.getByRole('columnheader'), { shiftKey: true })
    expect(onToggleSort).toHaveBeenCalledWith('name', true)
  })

  it('toggles sort on Enter and Space', () => {
    const { onToggleSort } = renderCell()
    const header = screen.getByRole('columnheader')
    fireEvent.keyDown(header, { key: 'Enter' })
    fireEvent.keyDown(header, { key: ' ' })
    expect(onToggleSort).toHaveBeenCalledTimes(2)
  })

  it('ignores keyboard sort when the column is not sortable', () => {
    const { onToggleSort } = renderCell({
      column: makeColumn({ sortable: false }),
    })
    fireEvent.keyDown(screen.getByRole('columnheader'), { key: 'Enter' })
    expect(onToggleSort).not.toHaveBeenCalled()
  })

  it('ignores non-activation keys', () => {
    const { onToggleSort } = renderCell()
    fireEvent.keyDown(screen.getByRole('columnheader'), { key: 'a' })
    expect(onToggleSort).not.toHaveBeenCalled()
  })
})

describe('DataGridHeaderCell – resize handle', () => {
  it('exposes a slider-like separator bounded by the column width range', () => {
    renderCell({ column: makeColumn({ width: 200, minWidth: 80 }) })
    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-valuenow', '200')
    expect(separator).toHaveAttribute('aria-valuemin', '80')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('omits the separator when the column is not resizable', () => {
    renderCell({ column: makeColumn({ resizable: false }) })
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('starts a pointer resize without bubbling to the sort handler', () => {
    const { onResizeStart, onToggleSort } = renderCell()
    fireEvent.pointerDown(screen.getByRole('separator'), { clientX: 120 })
    expect(onResizeStart).toHaveBeenCalledWith('name', 120)
    expect(onToggleSort).not.toHaveBeenCalled()
  })

  it('does not trigger a sort when the handle is clicked', () => {
    const { onToggleSort } = renderCell()
    fireEvent.click(screen.getByRole('separator'))
    expect(onToggleSort).not.toHaveBeenCalled()
  })

  it('nudges the width left and right with arrow keys', () => {
    const { onResizeNudge } = renderCell()
    const separator = screen.getByRole('separator')
    fireEvent.keyDown(separator, { key: 'ArrowLeft' })
    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(onResizeNudge).toHaveBeenNthCalledWith(1, 'name', -RESIZE_KEYBOARD_STEP)
    expect(onResizeNudge).toHaveBeenNthCalledWith(2, 'name', RESIZE_KEYBOARD_STEP)
  })

  it('ignores non-arrow keys on the handle', () => {
    const { onResizeNudge } = renderCell()
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Enter' })
    expect(onResizeNudge).not.toHaveBeenCalled()
  })
})

describe('DataGridHeaderCell – rendering variants', () => {
  it('renders a function header and applies right alignment', () => {
    renderCell({
      column: makeColumn({
        align: 'right',
        def: { id: 'name', header: (col) => `H:${col.id}` },
      }),
    })
    expect(screen.getByRole('columnheader')).toHaveTextContent('H:name')
  })
})
