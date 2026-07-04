import type { DateRange } from 'react-day-picker'
import type { VariantProps } from 'class-variance-authority'

import type { datePickerTriggerVariants } from './styles'

export type { DateRange }

/** Supported UI locales, mapped to date-fns locales internally. */
export type DatePickerLocale = 'en' | 'ru'

export type DatePickerTriggerVariantProps = VariantProps<typeof datePickerTriggerVariants>

interface DatePickerBaseProps extends DatePickerTriggerVariantProps {
  /** Calendar locale; drives weekday order and formatting. */
  locale?: DatePickerLocale
  /** Text shown in the trigger when nothing is selected. */
  placeholder?: string
  /** Disables the trigger. */
  disabled?: boolean
  /** Number of month grids to show side by side. */
  numberOfMonths?: number
  /** Controlled open state of the calendar popover. */
  open?: boolean
  /** Initial open state in uncontrolled mode. */
  defaultOpen?: boolean
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Extra class names for the trigger. */
  className?: string
  /** Accessible name for the trigger. */
  'aria-label'?: string
}

/** Single-date selection props. */
export interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: 'single'
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
}

/** Range selection props. */
export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: 'range'
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps
