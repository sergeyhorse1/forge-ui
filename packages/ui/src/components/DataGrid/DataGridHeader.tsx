import { type Virtualizer } from '@tanstack/react-virtual'

import { cn } from '../../utils/cn'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import type { DataGridModel, ResolvedColumn } from './types'

interface DataGridHeaderProps<TRow> {
  model: DataGridModel<TRow>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
  headerHeight: number
  // Текущий горизонтальный офсет скролла главного вьюпорта, px.
  scrollLeft: number
}

// Два квадранта шапки на одной раскладке от виртуализатора: frozen-шапка (слева
// сверху) статична и не скроллится; scroll-шапка (справа сверху) сдвинута на
// -scrollLeft за телом и сама виртуализирована по столбцам, так что широкие сетки
// монтируют лишь видимые header-ячейки.
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
            // Frozen-угол висит над scroll-шапкой, её ячейки уезжают под него по
            // горизонтали. Поячеечный bg-muted/60 полупрозрачен — сам по себе
            // скроллящиеся шапки просвечивали бы. Сплошной bg-background под углом
            // делает его непрозрачным, сохраняя тот же muted-композит, что и полоса шапки.
            className={cn('bg-background')}
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
