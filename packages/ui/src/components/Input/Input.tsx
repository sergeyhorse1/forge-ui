import { forwardRef, useId } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-transparent text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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

export type InputVariantProps = VariantProps<typeof inputVariants>

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size'>,
    InputVariantProps {
  /** Error message. Enables aria-invalid and shows message below input. */
  error?: string
  /** Node rendered before the input. */
  leftAddon?: React.ReactNode
  /** Node rendered after the input. */
  rightAddon?: React.ReactNode
  /** Controlled value. */
  value?: string
  /** Default value for uncontrolled mode. */
  defaultValue?: string
  /** Change handler. */
  onValueChange?: (value: string) => void
}

/** Text input with addon slots and error support. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      size,
      error,
      leftAddon,
      rightAddon,
      value: valueProp,
      defaultValue,
      onValueChange,
      onChange,
      type = 'text',
      ...props
    },
    ref,
  ) {
    const errorId = useId()

    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue: defaultValue ?? '',
      onChange: onValueChange,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      onChange?.(e)
    }

    const hasAddons = leftAddon || rightAddon

    const inputEl = (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        className={cn(
          inputVariants({ size }),
          error && 'border-destructive focus-visible:ring-destructive',
          hasAddons && 'border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-0',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
    )

    return (
      <div className="flex flex-col gap-1">
        {hasAddons ? (
          <div
            className={cn(
              'flex items-center rounded-md border border-input transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              error && 'border-destructive focus-within:ring-destructive',
              props.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {leftAddon && (
              <span className="flex items-center pl-3 text-muted-foreground">{leftAddon}</span>
            )}
            {inputEl}
            {rightAddon && (
              <span className="flex items-center pr-3 text-muted-foreground">{rightAddon}</span>
            )}
          </div>
        ) : (
          inputEl
        )}
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)

export { inputVariants }
