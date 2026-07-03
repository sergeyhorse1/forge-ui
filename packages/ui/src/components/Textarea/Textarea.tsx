import { forwardRef, useCallback, useId, useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'

const textareaVariants = cva(
  'flex w-full rounded-md border border-input bg-transparent text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type TextareaVariantProps = VariantProps<typeof textareaVariants>

export interface TextareaProps
  extends Omit<React.ComponentPropsWithoutRef<'textarea'>, 'size'>,
    TextareaVariantProps {
  /** Error message. */
  error?: string
  /** Auto-resize to content height. */
  autoResize?: boolean
  /** Controlled value. */
  value?: string
  /** Default value for uncontrolled mode. */
  defaultValue?: string
  /** Change handler. */
  onValueChange?: (value: string) => void
}

/** Multi-line text input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      size,
      error,
      autoResize,
      value: valueProp,
      defaultValue,
      onValueChange,
      onChange,
      rows = 3,
      ...props
    },
    ref,
  ) {
    const errorId = useId()
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue: defaultValue ?? '',
      onChange: onValueChange,
    })

    const adjustHeight = useCallback((el: HTMLTextAreaElement) => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      onChange?.(e)
      if (autoResize) {
        adjustHeight(e.target)
      }
    }

    const setRefs = useCallback(
      (el: HTMLTextAreaElement | null) => {
        internalRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
        if (el && autoResize) adjustHeight(el)
      },
      [ref, autoResize, adjustHeight],
    )

    return (
      <div className="flex flex-col gap-1">
        <textarea
          ref={setRefs}
          value={value}
          onChange={handleChange}
          rows={rows}
          className={cn(
            textareaVariants({ size }),
            autoResize && 'resize-none overflow-hidden',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)

export { textareaVariants }
