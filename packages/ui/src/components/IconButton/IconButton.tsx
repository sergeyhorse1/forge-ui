import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { Button } from '../Button'
import type { ButtonVariantProps } from '../Button'

const iconButtonVariants = cva('aspect-square p-0', {
  variants: {
    size: {
      sm: 'size-8',
      md: 'size-10',
      lg: 'size-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>

export interface IconButtonProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'>,
    IconButtonVariantProps,
    Pick<ButtonVariantProps, 'variant'> {
  /** Accessible label (required — icon-only buttons have no visible text). */
  'aria-label': string
  /** Icon element to render. */
  icon: React.ReactElement
  /** Show a loading spinner. */
  loading?: boolean
}

/** Square icon-only button with required accessible label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, variant, size, icon, loading, ...props },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(iconButtonVariants({ size }), className)}
        loading={loading}
        {...props}
      >
        {!loading && icon}
      </Button>
    )
  },
)
