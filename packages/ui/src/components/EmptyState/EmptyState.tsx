import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center gap-3 p-8 text-center',
)
const emptyStateIconVariants = cva(
  'flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6',
)
const emptyStateTitleVariants = cva('text-base font-semibold text-foreground')
const emptyStateDescriptionVariants = cva('max-w-sm text-sm text-muted-foreground')

export interface EmptyStateProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Decorative illustration or icon rendered above the title. */
  icon?: React.ReactNode
  /** Primary heading. */
  title: React.ReactNode
  /** Supporting text below the title. */
  description?: React.ReactNode
  /** Call-to-action slot rendered below the copy. */
  action?: React.ReactNode
}

/** Centered placeholder for empty lists, no-results and zero states. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ className, icon, title, description, action, ...props }, ref) {
    return (
      <div ref={ref} className={cn(emptyStateVariants(), className)} {...props}>
        {icon ? (
          <div className={cn(emptyStateIconVariants())} aria-hidden="true">
            {icon}
          </div>
        ) : null}
        <p className={cn(emptyStateTitleVariants())}>{title}</p>
        {description ? (
          <p className={cn(emptyStateDescriptionVariants())}>{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    )
  },
)

export {
  emptyStateVariants,
  emptyStateIconVariants,
  emptyStateTitleVariants,
  emptyStateDescriptionVariants,
}
