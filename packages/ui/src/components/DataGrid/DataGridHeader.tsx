import { type Virtualizer } from '@tanstack/react-virtual'

import { DataGridHeaderCell } from './DataGridHeaderCell'
import type { DataGridModel, ResolvedColumn } from './types'

interface DataGridHeaderProps<TRow> {
  model: DataGridModel<TRow>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
  headerHeight: number
  /** Current horizontal scroll offset of the main viewport, in px. */
  scrollLeft: number
}

/**
 * Two header quadrants sharing one virtualizer-derived layout:
 * - frozen header (top-left): static, never scrolls;
 * - scroll header (top-right): offset by `-scrollLeft` to track the body and
 *   itself column-virtualized so wide grids only mount visible header cells.
 */
export function DataGridHeader<TRow>({
  model,
  columnVirtualizer,
  headerHeight,
  scrollLeft,
}: DataGridHeaderProps<TRow>) {
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const totalWidth = columnVirtualizer.getTotalSize()

  const renderHeaderCell = (
    column: ResolvedColumn<TRow>,
    style: React.CSSProperties,
  ) => (
    <DataGridHeaderCell
      key={column.id}
      column={column}
      style={style}
      sortInfo={model.sort.infoFor(column.id)}
      resizeActive={model.resize.activeColumnId === column.id}
      onToggleSort={model.sort.toggle}
      onResizeStart={model.resize.start}
      onResizeNudge={model.resize.nudge}
    />
  )

  return (
    <div
      role="rowgroup"
      style={{ position: 'relative', height: headerHeight, flexShrink: 0 }}
    >
      <div
        role="row"
        aria-rowindex={1}
        style={{ position: 'relative', height: headerHeight }}
      >
        {model.frozenColumns.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              display: 'flex',
              height: headerHeight,
              width: model.frozenWidth,
            }}
          >
            {model.frozenColumns.map((column) =>
              renderHeaderCell(column, {
                width: column.width,
                height: headerHeight,
              }),
            )}
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: model.frozenWidth,
            right: 0,
            height: headerHeight,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: totalWidth,
              height: headerHeight,
              transform: `translateX(${-scrollLeft}px)`,
            }}
          >
            {virtualColumns.map((virtualColumn) => {
              const column = model.scrollColumns[
                virtualColumn.index
              ] as ResolvedColumn<TRow>
              return renderHeaderCell(column, {
                position: 'absolute',
                top: 0,
                left: virtualColumn.start,
                width: column.width,
                height: headerHeight,
              })
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
