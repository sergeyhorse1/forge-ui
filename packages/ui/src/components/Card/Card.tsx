import { forwardRef } from 'react'

import { cn } from '../../utils/cn'

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {}
export interface CardHeaderProps extends React.ComponentPropsWithoutRef<'div'> {}
export interface CardTitleProps extends React.ComponentPropsWithoutRef<'h3'> {}
export interface CardDescriptionProps extends React.ComponentPropsWithoutRef<'p'> {}
export interface CardContentProps extends React.ComponentPropsWithoutRef<'div'> {}
export interface CardFooterProps extends React.ComponentPropsWithoutRef<'div'> {}

/** Container card with semantic sub-components. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}
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
        className={cn('flex flex-col gap-1.5 p-6', className)}
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
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
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
        className={cn('text-sm text-muted-foreground', className)}
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
        className={cn('p-6 pt-0', className)}
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
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      />
    )
  },
)
