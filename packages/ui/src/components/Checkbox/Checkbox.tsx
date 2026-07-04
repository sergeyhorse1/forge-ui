import { forwardRef, useId } from 'react'
import { Checkbox as RadixCheckbox } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const checkboxVariants = cva(
  'shrink-0 rounded-sm border border-input transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const labelVariants = cva('cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>

export interface CheckboxProps extends CheckboxVariantProps {
  /** Label text. */
  label?: string
  /** Controlled checked state. */
  checked?: boolean | 'indeterminate'
  /** Default checked for uncontrolled mode. */
  defaultChecked?: boolean | 'indeterminate'
  /** Change handler. */
  onCheckedChange?: (checked: boolean | 'indeterminate') => void
  /** Error message. */
  error?: string
  /** Disabled state. */
  disabled?: boolean
  /** Additional class names. */
  className?: string
  /** Name for form submission. */
  name?: string
}

/** Checkbox with optional label. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  function Checkbox(
    {
      className,
      size,
      label,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      error,
      disabled,
      name,
    },
    ref,
  ) {
    const id = useId()
    const errorId = useId()

    const [checked, setChecked] = useControllableState<boolean | 'indeterminate'>({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      onChange: onCheckedChange,
    })

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <RadixCheckbox.Root
            ref={ref}
            id={id}
            className={cn(checkboxVariants({ size }), 'peer', className)}
            checked={checked}
            onCheckedChange={setChecked}
            disabled={disabled}
            name={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          >
            <RadixCheckbox.Indicator className="flex items-center justify-center">
              {checked === 'indeterminate' ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </RadixCheckbox.Indicator>
          </RadixCheckbox.Root>
          {label && (
            <label htmlFor={id} className={cn(labelVariants({ size }))}>
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)

export { checkboxVariants }
