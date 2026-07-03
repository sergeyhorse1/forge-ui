import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const cardVariants = cva(
  'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
)
const cardHeaderVariants = cva('flex flex-col gap-1.5 p-6')
const cardTitleVariants = cva('text-2xl font-semibold leading-none tracking-tight')
const cardDescriptionVariants = cva('text-sm text-muted-foreground')
const cardContentVariants = cva('p-6 pt-0')
const cardFooterVariants = cva('flex items-center p-6 pt-0')

export type CardProps = React.ComponentPropsWithoutRef<'div'>
export type CardHeaderProps = React.ComponentPropsWithoutRef<'div'>
export type CardTitleProps = React.ComponentPropsWithoutRef<'h3'>
export type CardDescriptionProps = React.ComponentPropsWithoutRef<'p'>
export type CardContentProps = React.ComponentPropsWithoutRef<'div'>
export type CardFooterProps = React.ComponentPropsWithoutRef<'div'>

/** Container card with semantic sub-components. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardVariants(), className)}
        {...props}
      />
    )
  },
)

/** Card header area. */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardHeaderVariants(), className)}
        {...props}
      />
    )
  },
)

/** Card title. */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn(cardTitleVariants(), className)}
        {...props}
      />
    )
  },
)

/** Card description text. */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn(cardDescriptionVariants(), className)}
        {...props}
      />
    )
  },
)

/** Card main content area. */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardContentVariants(), className)}
        {...props}
      />
    )
  },
)

/** Card footer area. */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardFooterVariants(), className)}
        {...props}
      />
    )
  },
)
