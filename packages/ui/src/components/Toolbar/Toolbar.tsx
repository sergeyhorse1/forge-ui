import { forwardRef } from 'react'
import { Toolbar as RadixToolbar } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const toolbarVariants = cva(
  'flex items-center gap-1 rounded-md border border-border bg-background p-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
)
const toolbarItemVariants = cva(
  // Общий вид кнопки/ссылки/toggle; data-[state=on] красит нажатый toggle.
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-sm px-2.5 text-sm font-medium text-foreground no-underline transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
)
const toolbarSeparatorVariants = cva(
  'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-6 data-[orientation=vertical]:w-px',
)
const toolbarToggleGroupVariants = cva('flex items-center gap-1')

export type ToolbarProps = React.ComponentPropsWithoutRef<typeof RadixToolbar.Root>

/** Toolbar container (role="toolbar") with roving focus. */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar({ className, ...props }, ref) {
    return <RadixToolbar.Root ref={ref} className={cn(toolbarVariants(), className)} {...props} />
  },
)

export type ToolbarButtonProps = React.ComponentPropsWithoutRef<typeof RadixToolbar.Button>

/** Toolbar action button. */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton({ className, ...props }, ref) {
    return (
      <RadixToolbar.Button ref={ref} className={cn(toolbarItemVariants(), className)} {...props} />
    )
  },
)

export type ToolbarLinkProps = React.ComponentPropsWithoutRef<typeof RadixToolbar.Link>

/** Toolbar anchor link. */
export const ToolbarLink = forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
  function ToolbarLink({ className, ...props }, ref) {
    return <RadixToolbar.Link ref={ref} className={cn(toolbarItemVariants(), className)} {...props} />
  },
)

export type ToolbarSeparatorProps = React.ComponentPropsWithoutRef<typeof RadixToolbar.Separator>

/** Visual divider between toolbar groups. */
export const ToolbarSeparator = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(
  function ToolbarSeparator({ className, ...props }, ref) {
    return (
      <RadixToolbar.Separator
        ref={ref}
        className={cn(toolbarSeparatorVariants(), className)}
        {...props}
      />
    )
  },
)

export type ToolbarToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof RadixToolbar.ToggleGroup
>

/** Group of mutually related toggle items. */
export const ToolbarToggleGroup = forwardRef<HTMLDivElement, ToolbarToggleGroupProps>(
  function ToolbarToggleGroup({ className, ...props }, ref) {
    return (
      <RadixToolbar.ToggleGroup
        ref={ref}
        className={cn(toolbarToggleGroupVariants(), className)}
        {...props}
      />
    )
  },
)

export type ToolbarToggleItemProps = React.ComponentPropsWithoutRef<typeof RadixToolbar.ToggleItem>

/** Individual toggle inside a ToolbarToggleGroup. */
export const ToolbarToggleItem = forwardRef<HTMLButtonElement, ToolbarToggleItemProps>(
  function ToolbarToggleItem({ className, ...props }, ref) {
    return (
      <RadixToolbar.ToggleItem
        ref={ref}
        className={cn(toolbarItemVariants(), className)}
        {...props}
      />
    )
  },
)

export {
  toolbarVariants,
  toolbarItemVariants,
  toolbarSeparatorVariants,
  toolbarToggleGroupVariants,
}
