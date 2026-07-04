import { forwardRef } from 'react'
import { Tabs as RadixTabs } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const tabsListVariants = cva(
  'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
)
const tabsTriggerVariants = cva(
  // data-[state=active] красит выбранный таб; ring-offset-background гасит белый зазор
  // offset-кольца в тёмной теме.
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
)
const tabsContentVariants = cva(
  'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

export type TabsProps = React.ComponentPropsWithoutRef<typeof RadixTabs.Root>

/** Tab set root. Controls the active tab (value / defaultValue). */
export const Tabs = RadixTabs.Root

export type TabsListProps = React.ComponentPropsWithoutRef<typeof RadixTabs.List>

/** Container for the tab triggers (role="tablist"). */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ className, ...props }, ref) {
    return <RadixTabs.List ref={ref} className={cn(tabsListVariants(), className)} {...props} />
  },
)

export type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>

/** Clickable tab (role="tab"). */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ className, ...props }, ref) {
    return (
      <RadixTabs.Trigger ref={ref} className={cn(tabsTriggerVariants(), className)} {...props} />
    )
  },
)

export type TabsContentProps = React.ComponentPropsWithoutRef<typeof RadixTabs.Content>

/** Panel associated with a tab (role="tabpanel"). */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ className, ...props }, ref) {
    return (
      <RadixTabs.Content ref={ref} className={cn(tabsContentVariants(), className)} {...props} />
    )
  },
)

export { tabsListVariants, tabsTriggerVariants, tabsContentVariants }
