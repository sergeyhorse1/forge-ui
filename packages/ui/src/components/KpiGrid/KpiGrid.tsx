import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

// Треки задаются инлайновым gridTemplateColumns (параметризуемо minColWidth и без
// литеральных grid-*-утилит, которые протекли бы в публичный dist-CSS).
const kpiGridVariants = cva('grid gap-4')

export interface KpiGridProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Minimum column width in px before the grid drops to fewer columns. */
  minColWidth?: number
}

/** Responsive auto-fit grid for dashboard metric tiles. */
export const KpiGrid = forwardRef<HTMLDivElement, KpiGridProps>(
  function KpiGrid({ className, minColWidth = 200, style, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(kpiGridVariants(), className)}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
          ...style,
        }}
        {...props}
      />
    )
  },
)

export { kpiGridVariants }
