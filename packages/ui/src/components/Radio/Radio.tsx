import { forwardRef, useId } from 'react'
import { RadioGroup as RadixRadioGroup } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const radioGroupVariants = cva('flex flex-col gap-2', {
  variants: {
    size: {
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const radioItemVariants = cva(
  'shrink-0 rounded-full border border-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
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

const indicatorVariants = cva('rounded-full bg-primary', {
  variants: {
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const labelVariants = cva('cursor-pointer select-none', {
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

export type RadioGroupVariantProps = VariantProps<typeof radioGroupVariants>

export interface RadioItemProps {
  /** Value for this option. */
  value: string
  /** Label text. */
  label: string
  /** Disabled state. */
  disabled?: boolean
}

export interface RadioGroupProps extends RadioGroupVariantProps {
  /** Radio options. */
  children?: React.ReactNode
  /** Options as data (alternative to children). */
  items?: RadioItemProps[]
  /** Controlled value. */
  value?: string
  /** Default value for uncontrolled mode. */
  defaultValue?: string
  /** Change handler. */
  onValueChange?: (value: string) => void
  /** Error message. */
  error?: string
  /** Disabled state. */
  disabled?: boolean
  /** Additional class names. */
  className?: string
  /** Name for form submission. */
  name?: string
}

/** Radio group for single selection. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      className,
      size,
      items,
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      error,
      disabled,
      name,
    },
    ref,
  ) {
    const errorId = useId()

    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue: defaultValue ?? '',
      onChange: onValueChange,
    })

    return (
      <div className="flex flex-col gap-1">
        <RadixRadioGroup.Root
          ref={ref}
          className={cn(radioGroupVariants({ size }), className)}
          value={value}
          onValueChange={setValue}
          disabled={disabled}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          {items
            ? items.map((item) => (
                <RadioItem key={item.value} value={item.value} label={item.label} size={size} disabled={item.disabled} />
              ))
            : children}
        </RadixRadioGroup.Root>
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)

export interface RadioItemComponentProps extends RadioItemProps {
  size?: 'sm' | 'md' | 'lg' | null
}

/** Single radio option within a RadioGroup. */
export const RadioItem = forwardRef<HTMLButtonElement, RadioItemComponentProps>(
  function RadioItem({ value, label, size, disabled }, ref) {
    const id = useId()
    return (
      <div className="flex items-center gap-2">
        <RadixRadioGroup.Item
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          className={cn(radioItemVariants({ size }))}
        >
          <RadixRadioGroup.Indicator className="flex items-center justify-center">
            <span className={cn(indicatorVariants({ size }))} />
          </RadixRadioGroup.Indicator>
        </RadixRadioGroup.Item>
        <label htmlFor={id} className={cn(labelVariants({ size }))}>
          {label}
        </label>
      </div>
    )
  },
)

export { radioGroupVariants, radioItemVariants }
