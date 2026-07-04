import { forwardRef } from 'react'
import { Popover as RadixPopover } from 'radix-ui'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { ru } from 'date-fns/locale/ru'
import type { Locale } from 'date-fns/locale'

import { cn } from '../../utils/cn'
import { useControllableState } from '../../hooks'
import { popoverContentVariants } from '../Popover'
import { datePickerTriggerVariants, dayPickerClassNames } from './styles'
import type { DatePickerLocale, DatePickerProps } from './types'

const LOCALES: Record<DatePickerLocale, Locale> = { en: enUS, ru }
// ru → неделя с понедельника, en → с воскресенья. Задаём явно, не полагаясь на локаль.
const WEEK_STARTS_ON: Record<DatePickerLocale, 0 | 1> = { en: 0, ru: 1 }

function isDate(value: unknown): value is Date {
  return value instanceof Date
}

function formatDate(date: Date, locale: Locale): string {
  return format(date, 'PP', { locale })
}

function triggerLabel(
  selected: Date | DateRange | undefined,
  mode: 'single' | 'range',
  locale: Locale,
): string | undefined {
  if (mode === 'range') {
    const range = selected as DateRange | undefined
    if (!range?.from) return undefined
    const from = formatDate(range.from, locale)
    return range.to ? `${from} – ${formatDate(range.to, locale)}` : from
  }
  return isDate(selected) ? formatDate(selected, locale) : undefined
}

/** Calendar date picker (single or range) inside a popover, localized en/ru. */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker(props, ref) {
    const {
      locale = 'en',
      placeholder = 'Pick a date',
      disabled,
      numberOfMonths,
      open,
      defaultOpen,
      onOpenChange,
      className,
      size,
      'aria-label': ariaLabel,
    } = props
    const mode = props.mode ?? 'single'
    const localeObj = LOCALES[locale]

    const [isOpen, setOpen] = useControllableState({
      value: open,
      defaultValue: defaultOpen ?? false,
      onChange: onOpenChange,
    })

    const [selected, setSelected] = useControllableState<Date | DateRange | undefined>({
      value: props.value,
      defaultValue: props.defaultValue,
      onChange: props.onValueChange as
        | ((value: Date | DateRange | undefined) => void)
        | undefined,
    })

    const label = triggerLabel(selected, mode, localeObj)
    const hasValue = label !== undefined

    return (
      <RadixPopover.Root open={isOpen} onOpenChange={setOpen}>
        <RadixPopover.Trigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            data-placeholder={!hasValue}
            aria-label={ariaLabel}
            className={cn(datePickerTriggerVariants({ size }), className)}
          >
            <CalendarIcon />
            <span>{hasValue ? label : placeholder}</span>
          </button>
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content
            align="start"
            sideOffset={4}
            // Radix отдаёт контенту role="dialog" — даём имя, иначе axe ругается.
            aria-label={ariaLabel ?? 'Calendar'}
            className={cn(popoverContentVariants(), 'w-auto p-0')}
          >
            {mode === 'range' ? (
              <DayPicker
                mode="range"
                numberOfMonths={numberOfMonths ?? 2}
                selected={selected as DateRange | undefined}
                onSelect={(range) => setSelected(range)}
                locale={localeObj}
                weekStartsOn={WEEK_STARTS_ON[locale]}
                classNames={dayPickerClassNames}
              />
            ) : (
              <DayPicker
                mode="single"
                numberOfMonths={numberOfMonths ?? 1}
                selected={isDate(selected) ? selected : undefined}
                onSelect={(date) => setSelected(date)}
                locale={localeObj}
                weekStartsOn={WEEK_STARTS_ON[locale]}
                classNames={dayPickerClassNames}
              />
            )}
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
    )
  },
)

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-muted-foreground"
    >
      <path
        d="M5.5 1.5V3.5M10.5 1.5V3.5M2.5 6H13.5M3.5 3H12.5C13.05 3 13.5 3.45 13.5 4V13C13.5 13.55 13.05 14 12.5 14H3.5C2.95 14 2.5 13.55 2.5 13V4C2.5 3.45 2.95 3 3.5 3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
