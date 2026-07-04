import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const paginationNavVariants = cva('flex items-center gap-1')
const paginationItemVariants = cva(
  // ring-offset-2 + ring-offset-background даёт зазор, чтобы кольцо было видно даже на
  // активной кнопке (bg-primary), где ring==primary иначе слился бы с фоном.
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      active: {
        true: 'bg-primary text-primary-foreground',
        false: 'text-foreground hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: { active: false },
  },
)
const paginationEllipsisVariants = cva(
  'inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground',
)

/** A rendered pagination slot: a page number or a gap marker. */
export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

function range(start: number, end: number): number[] {
  const length = end - start + 1
  return Array.from({ length }, (_, index) => start + index)
}

/**
 * Build the sequence of page numbers and ellipsis markers to render.
 *
 * Always keeps the first and last page visible, plus `siblingCount` pages on
 * each side of the current page, collapsing the remaining gaps into ellipses.
 */
export function getPaginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
): PaginationItem[] {
  const totalPageNumbers = siblingCount * 2 + 5
  if (pageCount <= totalPageNumbers) {
    return range(1, pageCount)
  }

  const leftSibling = Math.max(page - siblingCount, 1)
  const rightSibling = Math.min(page + siblingCount, pageCount)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < pageCount - 1
  const edgeItemCount = 3 + 2 * siblingCount

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, edgeItemCount), 'ellipsis-right', pageCount]
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis-left', ...range(pageCount - edgeItemCount + 1, pageCount)]
  }
  return [1, 'ellipsis-left', ...range(leftSibling, rightSibling), 'ellipsis-right', pageCount]
}

export interface PaginationProps extends Omit<React.ComponentPropsWithoutRef<'nav'>, 'onChange'> {
  /** Current page (1-based). */
  page: number
  /** Total number of pages. */
  pageCount: number
  /** Called with the requested page when a control is activated. */
  onPageChange: (page: number) => void
  /** Pages shown on each side of the current page. */
  siblingCount?: number
  /** Accessible label for the previous-page control. */
  previousLabel?: string
  /** Accessible label for the next-page control. */
  nextLabel?: string
}

/** Accessible pagination control with page numbers and prev/next. */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      className,
      page,
      pageCount,
      onPageChange,
      siblingCount = 1,
      previousLabel = 'Go to previous page',
      nextLabel = 'Go to next page',
      'aria-label': ariaLabel = 'Pagination',
      ...props
    },
    ref,
  ) {
    const items = getPaginationRange(page, pageCount, siblingCount)
    const isFirst = page <= 1
    const isLast = page >= pageCount

    return (
      <nav ref={ref} aria-label={ariaLabel} className={className} {...props}>
        <ul className={cn(paginationNavVariants())}>
          <li>
            <button
              type="button"
              className={cn(paginationItemVariants())}
              onClick={() => onPageChange(page - 1)}
              disabled={isFirst}
              aria-disabled={isFirst || undefined}
              aria-label={previousLabel}
            >
              <ChevronIcon direction="left" />
            </button>
          </li>

          {items.map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  className={cn(paginationItemVariants({ active: item === page }))}
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Go to page ${item}`}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li key={item} aria-hidden="true" className={cn(paginationEllipsisVariants())}>
                &#8230;
              </li>
            ),
          )}

          <li>
            <button
              type="button"
              className={cn(paginationItemVariants())}
              onClick={() => onPageChange(page + 1)}
              disabled={isLast}
              aria-disabled={isLast || undefined}
              aria-label={nextLabel}
            >
              <ChevronIcon direction="right" />
            </button>
          </li>
        </ul>
      </nav>
    )
  },
)

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={direction === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M10 4l-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { paginationItemVariants, paginationNavVariants, paginationEllipsisVariants }
