import { forwardRef } from 'react'
import { Accordion as RadixAccordion } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const accordionItemVariants = cva('border-b border-border')
const accordionTriggerVariants = cva(
  // Шеврон поворачивается на data-state=open через selector-утилиту.
  'flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all motion-reduce:transition-none hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
)
const accordionContentVariants = cva(
  'overflow-hidden text-sm text-muted-foreground data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none',
)

export type AccordionProps = React.ComponentPropsWithoutRef<typeof RadixAccordion.Root>

/** Accordion root. Pass `type="single"` (with `collapsible`) or `type="multiple"`. */
export const Accordion = RadixAccordion.Root

export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof RadixAccordion.Item>

/** A single collapsible section. */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem({ className, ...props }, ref) {
    return (
      <RadixAccordion.Item ref={ref} className={cn(accordionItemVariants(), className)} {...props} />
    )
  },
)

export type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>

/** Header button that toggles its section. */
export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, children, ...props }, ref) {
    return (
      <RadixAccordion.Header className="flex">
        <RadixAccordion.Trigger
          ref={ref}
          className={cn(accordionTriggerVariants(), className)}
          {...props}
        >
          {children}
          <ChevronIcon />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
    )
  },
)

export type AccordionContentProps = React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>

/** Collapsible body of a section. */
export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ className, children, ...props }, ref) {
    return (
      <RadixAccordion.Content
        ref={ref}
        className={cn(accordionContentVariants(), className)}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </RadixAccordion.Content>
    )
  },
)

function ChevronIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { accordionItemVariants, accordionTriggerVariants, accordionContentVariants }
