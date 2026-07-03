import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        outline: 'border-border text-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<'span'>,
    BadgeVariantProps {}

/** Non-interactive status label. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, size, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
