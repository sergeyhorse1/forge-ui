import { forwardRef } from 'react'
import { Toast as RadixToast } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const toastViewportVariants = cva(
  'fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
)

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-top-full motion-reduce:animate-none',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-success bg-success text-success-foreground',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const toastTitleVariants = cva('text-sm font-semibold')
const toastDescriptionVariants = cva('text-sm opacity-90')
const toastActionVariants = cva(
  'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
)
const toastCloseVariants = cva(
  'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 motion-reduce:transition-none',
)

export type ToastVariantProps = VariantProps<typeof toastVariants>

export type ToastProviderProps = React.ComponentPropsWithoutRef<typeof RadixToast.Provider>

/** Wraps the app to enable toasts. */
export const ToastProvider = RadixToast.Provider

export type ToastViewportProps = React.ComponentPropsWithoutRef<typeof RadixToast.Viewport>

/** Fixed viewport that renders toast list. */
export const ToastViewport = forwardRef<HTMLOListElement, ToastViewportProps>(
  function ToastViewport({ className, ...props }, ref) {
    return (
      <RadixToast.Viewport
        ref={ref}
        className={cn(toastViewportVariants(), className)}
        {...props}
      />
    )
  },
)

export interface ToastProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadixToast.Root>, 'children'>,
    ToastVariantProps {
  children: React.ReactNode
}

/** Individual toast notification. */
export const Toast = forwardRef<HTMLLIElement, ToastProps>(
  function Toast({ className, variant, ...props }, ref) {
    return (
      <RadixToast.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      />
    )
  },
)

export type ToastTitleProps = React.ComponentPropsWithoutRef<typeof RadixToast.Title>

/** Toast title text. */
export const ToastTitle = forwardRef<HTMLDivElement, ToastTitleProps>(
  function ToastTitle({ className, ...props }, ref) {
    return (
      <RadixToast.Title ref={ref} className={cn(toastTitleVariants(), className)} {...props} />
    )
  },
)

export type ToastDescriptionProps = React.ComponentPropsWithoutRef<typeof RadixToast.Description>

/** Toast description text. */
export const ToastDescription = forwardRef<HTMLDivElement, ToastDescriptionProps>(
  function ToastDescription({ className, ...props }, ref) {
    return (
      <RadixToast.Description
        ref={ref}
        className={cn(toastDescriptionVariants(), className)}
        {...props}
      />
    )
  },
)

export type ToastActionProps = React.ComponentPropsWithoutRef<typeof RadixToast.Action>

/** Toast action button. */
export const ToastAction = forwardRef<HTMLButtonElement, ToastActionProps>(
  function ToastAction({ className, ...props }, ref) {
    return (
      <RadixToast.Action
        ref={ref}
        className={cn(toastActionVariants(), className)}
        {...props}
      />
    )
  },
)

export type ToastCloseProps = React.ComponentPropsWithoutRef<typeof RadixToast.Close>

/** Toast close button. */
export const ToastClose = forwardRef<HTMLButtonElement, ToastCloseProps>(
  function ToastClose({ className, ...props }, ref) {
    return (
      <RadixToast.Close
        ref={ref}
        className={cn(toastCloseVariants(), className)}
        {...props}
      >
        <CloseIcon />
        <span className="sr-only">Close</span>
      </RadixToast.Close>
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
  toastViewportVariants,
  toastVariants,
  toastTitleVariants,
  toastDescriptionVariants,
  toastActionVariants,
  toastCloseVariants,
}
