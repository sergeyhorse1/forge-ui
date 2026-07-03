import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const spinnerVariants = cva(
  'inline-block animate-spin text-current motion-reduce:animate-[spin_3s_linear_infinite]',
  {
    variants: {
      size: {
        sm: 'size-4',
        md: 'size-5',
        lg: 'size-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>

export interface SpinnerProps
  extends React.ComponentPropsWithoutRef<'svg'>,
    SpinnerVariantProps {
  /** Accessible label for the spinner. */
  'aria-label'?: string
}

/** Animated loading indicator. */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  function Spinner({ className, size, 'aria-label': ariaLabel = 'Loading', ...props }, ref) {
    return (
      <svg
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(spinnerVariants({ size }), className)}
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-75"
        />
      </svg>
    )
  },
)
