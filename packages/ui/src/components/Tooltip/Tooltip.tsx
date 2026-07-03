import { forwardRef } from 'react'
import { Tooltip as RadixTooltip } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
)

export interface TooltipProps {
  /** Tooltip content. */
  content: React.ReactNode
  /** Preferred side. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Content alignment. */
  align?: 'start' | 'center' | 'end'
  /** Delay before showing in ms. */
  delayDuration?: number
  /** Show arrow indicator. */
  arrow?: boolean
  /** Merge trigger into child element. Defaults to true — the child is the trigger. */
  asChild?: boolean
  /** Controlled open state. */
  open?: boolean
  /** Default open state. */
  defaultOpen?: boolean
  /** Open state change handler. */
  onOpenChange?: (open: boolean) => void
  /** Additional class for content. */
  className?: string
  children: React.ReactNode
}

/** Accessible tooltip that appears on hover/focus. */
export const Tooltip = forwardRef<HTMLButtonElement, TooltipProps>(
  function Tooltip(
    {
      content,
      side = 'top',
      align = 'center',
      delayDuration,
      arrow = true,
      asChild = true,
      open,
      defaultOpen,
      onOpenChange,
      className,
      children,
    },
    ref,
  ) {
    return (
      <RadixTooltip.Provider delayDuration={delayDuration ?? 300}>
        <RadixTooltip.Root
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
        >
          <RadixTooltip.Trigger ref={ref} asChild={asChild}>
            {children}
          </RadixTooltip.Trigger>
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              side={side}
              align={align}
              sideOffset={4}
              className={cn(tooltipContentVariants(), className)}
            >
              {content}
              {arrow && (
                <RadixTooltip.Arrow className="fill-popover" />
              )}
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        </RadixTooltip.Root>
      </RadixTooltip.Provider>
    )
  },
)

export { tooltipContentVariants }
