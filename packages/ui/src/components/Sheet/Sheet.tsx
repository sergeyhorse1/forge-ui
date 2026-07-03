import { forwardRef } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const sheetOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 animate-in fade-in-0 motion-reduce:animate-none',
)

const sheetContentVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition-transform motion-reduce:transition-none',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b h-auto max-h-[85vh] w-full animate-in slide-in-from-top motion-reduce:animate-none',
        bottom: 'inset-x-0 bottom-0 border-t h-auto max-h-[85vh] w-full animate-in slide-in-from-bottom motion-reduce:animate-none',
        left: 'inset-y-0 left-0 border-r w-3/4 max-w-sm h-full animate-in slide-in-from-left motion-reduce:animate-none',
        right: 'inset-y-0 right-0 border-l w-3/4 max-w-sm h-full animate-in slide-in-from-right motion-reduce:animate-none',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

const sheetHeaderVariants = cva('flex flex-col gap-1.5 text-center sm:text-left')
const sheetFooterVariants = cva('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2')
const sheetTitleVariants = cva('text-lg font-semibold text-foreground')
const sheetDescriptionVariants = cva('text-sm text-muted-foreground')

export type SheetVariantProps = VariantProps<typeof sheetContentVariants>

export interface SheetProps {
  /** Controlled open state. */
  open?: boolean
  /** Open state change handler. */
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/** Side-panel overlay built on Dialog. */
export const Sheet = ({ open, onOpenChange, children }: SheetProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </RadixDialog.Root>
)

export type SheetTriggerProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Trigger>

/** Element that opens the sheet. */
export const SheetTrigger = RadixDialog.Trigger

export type SheetCloseProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Close>

/** Element that closes the sheet. */
export const SheetClose = RadixDialog.Close

export interface SheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadixDialog.Content>, 'children'>,
    SheetVariantProps {
  children: React.ReactNode
}

/** Sheet content panel. */
export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  function SheetContent({ className, side = 'right', children, ...props }, ref) {
    return (
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={cn(sheetOverlayVariants())} />
        <RadixDialog.Content
          ref={ref}
          aria-modal="true"
          className={cn(sheetContentVariants({ side }), className)}
          {...props}
        >
          {children}
          <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none motion-reduce:transition-none">
            <CloseIcon />
            <span className="sr-only">Close</span>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    )
  },
)

export type SheetHeaderProps = React.ComponentPropsWithoutRef<'div'>

/** Sheet header area. */
export const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(
  function SheetHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn(sheetHeaderVariants(), className)} {...props} />
  },
)

export type SheetFooterProps = React.ComponentPropsWithoutRef<'div'>

/** Sheet footer area. */
export const SheetFooter = forwardRef<HTMLDivElement, SheetFooterProps>(
  function SheetFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn(sheetFooterVariants(), className)} {...props} />
  },
)

export type SheetTitleProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Title>

/** Sheet title heading. */
export const SheetTitle = forwardRef<HTMLHeadingElement, SheetTitleProps>(
  function SheetTitle({ className, ...props }, ref) {
    return (
      <RadixDialog.Title ref={ref} className={cn(sheetTitleVariants(), className)} {...props} />
    )
  },
)

export type SheetDescriptionProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Description>

/** Sheet description text. */
export const SheetDescription = forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  function SheetDescription({ className, ...props }, ref) {
    return (
      <RadixDialog.Description
        ref={ref}
        className={cn(sheetDescriptionVariants(), className)}
        {...props}
      />
    )
  },
)

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M11.782 4.032a.575.575 0 10-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 00-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 00.814.814L7.5 8.313l3.469 3.469a.575.575 0 00.813-.814L8.313 7.5l3.469-3.468z"
        fill="currentColor"
      />
    </svg>
  )
}

export {
  sheetOverlayVariants,
  sheetContentVariants,
  sheetHeaderVariants,
  sheetFooterVariants,
  sheetTitleVariants,
  sheetDescriptionVariants,
}
