import { forwardRef } from 'react'
import { Popover as RadixPopover } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const popoverContentVariants = cva(
  'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
)

export interface PopoverProps {
  /** Controlled open state. */
  open?: boolean
  /** Open state change handler. */
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/** Click-triggered popover container. */
export const Popover = ({ open, onOpenChange, children }: PopoverProps) => (
  <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </RadixPopover.Root>
)

export type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof RadixPopover.Trigger>

/** Element that toggles the popover. */
export const PopoverTrigger = RadixPopover.Trigger

export type PopoverCloseProps = React.ComponentPropsWithoutRef<typeof RadixPopover.Close>

/** Element that closes the popover. */
export const PopoverClose = RadixPopover.Close

export type PopoverContentProps = React.ComponentPropsWithoutRef<typeof RadixPopover.Content>

/** Popover content panel. */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent({ className, align = 'center', sideOffset = 4, ...props }, ref) {
    return (
      <RadixPopover.Portal>
        <RadixPopover.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(popoverContentVariants(), className)}
          {...props}
        />
      </RadixPopover.Portal>
    )
  },
)

export { popoverContentVariants }
