import { forwardRef } from 'react'

import { cn } from '../../utils/cn'

export interface SkeletonProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Explicit width (CSS value). */
  width?: string | number
  /** Explicit height (CSS value). */
  height?: string | number
}

/** Placeholder pulse animation for loading states. */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, width, height, style, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
          className,
        )}
        style={{ width, height, ...style }}
        {...props}
      />
    )
  },
)
