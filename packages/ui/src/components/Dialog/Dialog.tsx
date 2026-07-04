import { forwardRef } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 animate-in fade-in-0 motion-reduce:animate-none',
)

const dialogContentVariants = cva(
  'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg rounded-lg animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
)

const dialogHeaderVariants = cva('flex flex-col gap-1.5 text-center sm:text-left')
const dialogFooterVariants = cva('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2')
const dialogTitleVariants = cva('text-lg font-semibold leading-none tracking-tight')
const dialogDescriptionVariants = cva('text-sm text-muted-foreground')

export interface DialogProps {
  /** Controlled open state. */
  open?: boolean
  /** Open state change handler. */
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/** Modal dialog container. */
export const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </RadixDialog.Root>
)

export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Trigger>

/** Element that opens the dialog. */
export const DialogTrigger = RadixDialog.Trigger

export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Close>

/** Element that closes the dialog. */
export const DialogClose = RadixDialog.Close

export type DialogContentProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
  /** Hide the built-in close (X) button. ESC and click-outside still close. */
  hideCloseButton?: boolean
}

/** Dialog content panel with overlay. */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent({ className, children, hideCloseButton = false, ...props }, ref) {
    return (
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={cn(dialogOverlayVariants())} />
        <RadixDialog.Content
          ref={ref}
          aria-modal="true"
          className={cn(dialogContentVariants(), className)}
          {...props}
        >
          {children}
          {hideCloseButton ? null : (
            <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none motion-reduce:transition-none">
              <CloseIcon />
              <span className="sr-only">Close</span>
            </RadixDialog.Close>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    )
  },
)

export type DialogHeaderProps = React.ComponentPropsWithoutRef<'div'>

/** Dialog header area. */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  function DialogHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn(dialogHeaderVariants(), className)} {...props} />
  },
)

export type DialogFooterProps = React.ComponentPropsWithoutRef<'div'>

/** Dialog footer area. */
export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  function DialogFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn(dialogFooterVariants(), className)} {...props} />
  },
)

export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Title>

/** Dialog title heading. */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle({ className, ...props }, ref) {
    return (
      <RadixDialog.Title ref={ref} className={cn(dialogTitleVariants(), className)} {...props} />
    )
  },
)

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Description>

/** Dialog description text. */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription({ className, ...props }, ref) {
    return (
      <RadixDialog.Description
        ref={ref}
        className={cn(dialogDescriptionVariants(), className)}
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
  dialogOverlayVariants,
  dialogContentVariants,
  dialogHeaderVariants,
  dialogFooterVariants,
  dialogTitleVariants,
  dialogDescriptionVariants,
}
