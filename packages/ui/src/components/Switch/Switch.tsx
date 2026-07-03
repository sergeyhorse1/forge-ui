import { forwardRef, useId } from 'react'
import { Switch as RadixSwitch } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const switchVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input motion-reduce:transition-none',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const thumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform motion-reduce:transition-none',
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
        md: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
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

export type SwitchVariantProps = VariantProps<typeof switchVariants>

export interface SwitchProps extends SwitchVariantProps {
  /** Label text. */
  label?: string
  /** Controlled checked state. */
  checked?: boolean
  /** Default checked for uncontrolled mode. */
  defaultChecked?: boolean
  /** Change handler. */
  onCheckedChange?: (checked: boolean) => void
  /** Error message. */
  error?: string
  /** Disabled state. */
  disabled?: boolean
  /** Additional class names. */
  className?: string
  /** Name for form submission. */
  name?: string
}

/** Toggle switch with optional label. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
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

    const [checked, setChecked] = useControllableState({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      onChange: onCheckedChange,
    })

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <RadixSwitch.Root
            ref={ref}
            id={id}
            className={cn(switchVariants({ size }), 'peer', className)}
            checked={checked}
            onCheckedChange={setChecked}
            disabled={disabled}
            name={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          >
            <RadixSwitch.Thumb className={cn(thumbVariants({ size }))} />
          </RadixSwitch.Root>
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

export { switchVariants }
