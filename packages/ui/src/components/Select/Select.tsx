import { forwardRef, useId } from 'react'
import { Select as RadixSelect } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const selectTriggerVariants = cva(
  'flex w-full items-center justify-between rounded-md border border-input bg-transparent text-foreground transition-colors motion-reduce:transition-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const selectContentVariants = cva(
  'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
  {
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
  },
)

const selectItemVariants = cva(
  'relative flex w-full cursor-default select-none items-center rounded-sm outline-none transition-colors motion-reduce:transition-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      size: {
        sm: 'py-1 px-2 text-xs',
        md: 'py-1.5 px-3 text-sm',
        lg: 'py-2 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type SelectVariantProps = VariantProps<typeof selectTriggerVariants>

export interface SelectOptionItem {
  /** Option value. */
  value: string
  /** Display label. */
  label: string
  /** Disabled state. */
  disabled?: boolean
}

export interface SelectProps extends SelectVariantProps {
  /** Options as data. */
  items?: SelectOptionItem[]
  /** Children (SelectItem elements). */
  children?: React.ReactNode
  /** Controlled value. */
  value?: string
  /** Default value for uncontrolled mode. */
  defaultValue?: string
  /** Change handler. */
  onValueChange?: (value: string) => void
  /** Error message. */
  error?: string
  /** Placeholder text. */
  placeholder?: string
  /** Disabled state. */
  disabled?: boolean
  /** Additional class names for the trigger. */
  className?: string
  /** Name for form submission. */
  name?: string
}

/** Select dropdown with keyboard and type-ahead support. */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  function Select(
    {
      className,
      size,
      items,
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      error,
      placeholder,
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
        <RadixSelect.Root
          value={value}
          onValueChange={setValue}
          disabled={disabled}
          name={name}
        >
          <RadixSelect.Trigger
            ref={ref}
            className={cn(
              selectTriggerVariants({ size }),
              error && 'border-destructive focus:ring-destructive',
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon className="ml-2">
              <ChevronIcon />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content className={cn(selectContentVariants({ size }))}>
              <RadixSelect.Viewport className="p-1">
                {items
                  ? items.map((item) => (
                      <SelectItem key={item.value} value={item.value} disabled={item.disabled} size={size}>
                        {item.label}
                      </SelectItem>
                    ))
                  : children}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg' | null
  className?: string
}

/** Individual option within a Select. */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  function SelectItem({ value, children, disabled, size, className }, ref) {
    return (
      <RadixSelect.Item
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(selectItemVariants({ size }), className)}
      >
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      </RadixSelect.Item>
    )
  },
)

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export { selectTriggerVariants, selectContentVariants, selectItemVariants }
