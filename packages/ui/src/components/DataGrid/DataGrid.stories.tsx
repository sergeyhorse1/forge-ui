import { useMemo } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { DataGrid, type DataGridProps } from './DataGrid'
import {
  demoColumns,
  getRowKey,
  makePerfColumns,
  makeRows,
  type DemoRow,
} from './demo/fixtures'
import { PerfHarness } from './demo/PerfHarness'

const meta = {
  title: 'Data/DataGrid',
  component: DataGrid<DemoRow>,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataGrid<DemoRow>>

export default meta

type Story = StoryObj<typeof meta>

const SMALL_ROWS = makeRows(500, 0)

export const Default: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 420,
  },
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole('grid')
    await expect(grid).toBeInTheDocument()

    // Only the visible window (plus overscan) is mounted, never the full dataset.
    const renderedCells = canvasElement.querySelectorAll('[role="gridcell"]')
    const visibleRows = Math.ceil(420 / 40) + 8 /* overscanRows */ + 1
    const maxCells = visibleRows * demoColumns.length
    await expect(renderedCells.length).toBeGreaterThan(0)
    await expect(renderedCells.length).toBeLessThanOrEqual(maxCells)
  },
}

export const FrozenColumns: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    // The first two columns are frozen, so two columnheaders sit in the static
    // corner while the remaining headers live in the scroll layer.
    const headers = canvasElement.querySelectorAll('[role="columnheader"]')
    await expect(headers.length).toBeGreaterThanOrEqual(demoColumns.length)

    // Regression guard: the frozen-body cells of a single row must lay out
    // left-to-right with no overlap. The frozen overlay paints its cells as
    // aria-hidden `presentation` boxes; for the first data row their bounding
    // boxes must have strictly increasing left edges and never intersect
    // horizontally (the previous bug stacked them all at the same x). This only
    // catches in a real browser, where layout is actually computed.
    const overlay = canvasElement.querySelector(
      '[aria-hidden="true"] [role="presentation"]',
    )?.parentElement as HTMLElement
    const firstRowCells = Array.from(
      overlay.querySelectorAll<HTMLElement>('[role="presentation"]'),
    )
    await expect(firstRowCells.length).toBe(2)

    const rects = firstRowCells.map((cell) => cell.getBoundingClientRect())
    for (let i = 1; i < rects.length; i += 1) {
      const previous = rects[i - 1]!
      const current = rects[i]!
      // Each subsequent frozen cell starts at or after the previous one ends.
      await expect(current.left).toBeGreaterThanOrEqual(previous.right)
      // And it has real width, i.e. it is not collapsed onto its neighbour.
      await expect(current.width).toBeGreaterThan(0)
    }

    // Vertical-clip guard: the scroll layer virtualizes a window plus overscan,
    // so its rowgroup is far taller than the body. Those overscan rows must be
    // clipped to the grid's box and never paint below its bottom edge. A
    // bounding rect alone is not enough — a clipped cell still reports a rect
    // outside its scroll ancestor — so we hit-test a point just below the grid:
    // if anything inside the grid is painted there, clipping has regressed.
    // (With the previous `overflow: visible` bug, a `gridcell` was hit here.)
    const grid = canvasElement.querySelector('[role="grid"]') as HTMLElement
    const gridRect = grid.getBoundingClientRect()
    const belowGrid = document.elementFromPoint(
      gridRect.left + gridRect.width / 2,
      gridRect.bottom + 30,
    )
    // Nothing belonging to the grid may be painted below its bottom edge. A null
    // hit (the page background) is fine; a hit that the grid contains is a leak.
    const leaked = belowGrid !== null && grid.contains(belowGrid)
    await expect(leaked).toBe(false)
  },
}

export const MultiSort: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    sort: { multiSort: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const headerFor = (label: string) =>
      canvas.getByText(label).closest('[role="columnheader"]') as HTMLElement

    // Activating a sortable header via keyboard cycles it into ascending order.
    headerFor('Team').focus()
    await userEvent.keyboard('{Enter}')
    await expect(headerFor('Team')).toHaveAttribute('aria-sort', 'ascending')

    // Shift+Enter on a second header adds it to the multi-sort.
    headerFor('Score').focus()
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await expect(headerFor('Score')).toHaveAttribute('aria-sort', 'ascending')
    await expect(headerFor('Team')).toHaveAttribute('aria-sort', 'ascending')
  },
}

export const SelectableRows: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole('grid')
    await expect(grid).toHaveAttribute('aria-multiselectable', 'true')

    const firstRow = canvasElement.querySelector(
      '.overflow-auto [role="row"]',
    ) as HTMLElement
    await userEvent.click(firstRow)
    await expect(firstRow).toHaveAttribute('aria-selected', 'true')
  },
}

export const KeyboardSelection: Story = {
  name: 'Keyboard selection',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    // Roving tabindex: focus the first body cell (the only tab stop), step down
    // a row with the arrow keys, then toggle that row's selection with Enter —
    // entirely from the keyboard, never the mouse.
    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )

    const firstCell = cellAt(2, 1)!
    await expect(firstCell).toBeInTheDocument()
    firstCell.focus()
    await expect(firstCell).toHaveAttribute('tabindex', '0')

    await userEvent.keyboard('{ArrowDown}{ArrowRight}')

    const movedCell = cellAt(3, 2)
    await expect(movedCell).toHaveFocus()
    await expect(movedCell).toHaveAttribute('tabindex', '0')

    await userEvent.keyboard('{Enter}')
    const selectedRow = movedCell!.closest('[role="row"]') as HTMLElement
    await expect(selectedRow).toHaveAttribute('aria-selected', 'true')

    // The untouched first row stays unselected.
    const firstRow = firstCell.closest('[role="row"]') as HTMLElement
    await expect(firstRow).toHaveAttribute('aria-selected', 'false')
  },
}

export const FocusIndicators: Story = {
  name: 'Focus indicators',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    const hasVisibleRing = (element: HTMLElement) => {
      const style = getComputedStyle(element)
      // Tailwind's `ring-*` utilities render as a box-shadow; a real outline also
      // counts. Either being non-`none` proves a visible focus indicator.
      return (
        (style.boxShadow !== '' && style.boxShadow !== 'none') ||
        (style.outlineStyle !== '' && style.outlineStyle !== 'none')
      )
    }

    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )!

    // Enter the grid at the first frozen cell, then arrow into the first scroll
    // column (colindex 3). Driving the move from the keyboard activates
    // `:focus-visible` so the designed ring actually paints.
    const firstCell = cellAt(2, 1)
    firstCell.focus()
    await userEvent.keyboard('{End}')

    const scrollCell = cellAt(2, demoColumns.length)
    await expect(scrollCell).toHaveFocus()
    await expect(hasVisibleRing(scrollCell)).toBe(true)

    // The frozen column's real gridcell is clipped off-screen, so its ring is
    // mirrored onto the visible overlay cell. Arrow back onto the first frozen
    // column (colindex 1) and assert the overlay cell shows a ring.
    await userEvent.keyboard('{Home}')
    const frozenReal = cellAt(2, 1)
    await expect(frozenReal).toHaveFocus()

    const overlayCell = canvasElement.querySelector<HTMLElement>(
      '[aria-hidden="true"] [role="presentation"]',
    )!
    await expect(hasVisibleRing(overlayCell)).toBe(true)
  },
}

export const FocusSurvivesScroll: Story = {
  name: 'Focus survives mouse scroll',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 240,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector('.overflow-auto') as HTMLElement
    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )

    // Focus the first body cell (first scroll column = colindex 3).
    const firstCell = cellAt(2, 3)!
    firstCell.focus()
    await expect(firstCell).toHaveFocus()

    // Mouse-scroll far past the visible window. The focused cell would normally
    // be virtualized away, dropping focus; pinning the active row keeps it
    // mounted so focus and arrow navigation survive.
    viewport.scrollTop = 4000
    viewport.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    // The active cell is still mounted and still focused despite the scroll.
    await expect(cellAt(2, 3)).toBeInTheDocument()
    await expect(cellAt(2, 3)).toHaveFocus()

    // Arrow keys still navigate from the (recovered) active cell.
    await userEvent.keyboard('{ArrowDown}')
    await expect(cellAt(3, 3)).toHaveFocus()
  },
}

export const ResizableColumns: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    const handle = canvasElement.querySelector(
      '[role="separator"][aria-orientation="vertical"]',
    ) as HTMLElement
    await expect(handle).toBeInTheDocument()
    handle.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    // Keyboard resize is exercised; the handle keeps focus for the next nudge.
    await expect(handle).toHaveFocus()
  },
}

const PERF_COLUMNS = makePerfColumns()

/**
 * Generate the (large) dataset lazily inside the rendered component instead of
 * at module load, so merely importing this file for indexing/testing does not
 * allocate millions of objects.
 */
function PerfGrid({
  rowCount,
  ...args
}: { rowCount: number } & Omit<DataGridProps<DemoRow>, 'rows' | 'columns' | 'getRowKey'>) {
  const rows = useMemo(() => makeRows(rowCount, 26), [rowCount])
  return (
    <PerfHarness>
      <DataGrid rows={rows} columns={PERF_COLUMNS} getRowKey={getRowKey} {...args} />
    </PerfHarness>
  )
}

// `render` supplies its own data; these args satisfy the required prop types
// without allocating a dataset at module load.
const placeholderArgs = {
  rows: [] as DemoRow[],
  columns: PERF_COLUMNS,
  getRowKey,
}

export const Perf10k: Story = {
  name: 'Perf10k (10k × 30)',
  tags: ['test'],
  args: placeholderArgs,
  render: () => <PerfGrid rowCount={10_000} height={600} />,
  play: async ({ canvasElement }) => {
    // The DOM-node count must stay bounded by the visible window even at 10k rows.
    const cells = canvasElement.querySelectorAll('[role="gridcell"]')
    const visibleRows = Math.ceil(600 / 40) + 8 + 1
    const maxCells = visibleRows * PERF_COLUMNS.length
    await expect(cells.length).toBeLessThanOrEqual(maxCells)
    await expect(cells.length).toBeGreaterThan(0)
  },
}

export const Perf100k: Story = {
  name: 'Perf100k (100k × 30)',
  args: placeholderArgs,
  render: () => <PerfGrid rowCount={100_000} height={600} />,
}
