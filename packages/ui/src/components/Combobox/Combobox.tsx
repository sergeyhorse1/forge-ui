import { forwardRef, useId, useRef } from 'react'
import { Popover as RadixPopover } from 'radix-ui'

import { cn } from '../../utils/cn'
import { Spinner } from '../Spinner'
import { ComboboxList } from './ComboboxList'
import { comboboxContentVariants, comboboxInputVariants } from './styles'
import type { ComboboxProps } from './types'
import { useCombobox } from './useCombobox'

/**
 * Editable combobox with a filterable listbox. Supports client-side filtering
 * (`items`) or debounced async loading (`loadItems`). Follows the WAI-ARIA
 * combobox pattern: the input keeps focus, options are tracked through
 * `aria-activedescendant`.
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  function Combobox(props, ref) {
    const {
      size,
      placeholder,
      disabled,
      error,
      loadingText = 'Loading…',
      emptyText = 'No results',
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    } = props

    const errorId = useId()
    const anchorRef = useRef<HTMLDivElement>(null)

    const combobox = useCombobox(props)
    const {
      open,
      loading,
      isEmpty,
      value,
      inputValue,
      activeId,
      listboxId,
      groups,
      options,
      activeIndex,
      handleInputChange,
      handleKeyDown,
      handleOpenChange,
      openList,
      selectOption,
      setActiveIndex,
    } = combobox

    // Живой анонс для скринридера: контейнер всегда смонтирован (вне портала), поэтому
    // смена текста надёжно озвучивается, в отличие от портального статуса.
    const liveMessage = !open
      ? ''
      : loading
        ? loadingText
        : isEmpty
          ? emptyText
          : `${options.length} ${options.length === 1 ? 'result' : 'results'} available`

    return (
      <div className="flex flex-col gap-1">
        <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
          <RadixPopover.Anchor asChild>
            <div ref={anchorRef} className="relative">
              <input
                ref={ref}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-busy={loading || undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                autoComplete="off"
                disabled={disabled}
                placeholder={placeholder}
                value={inputValue}
                className={cn(
                  comboboxInputVariants({ size }),
                  loading && 'pr-9',
                  error && 'border-destructive focus:ring-destructive',
                  className,
                )}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={openList}
              />
              {loading && (
                <Spinner
                  size="sm"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                />
              )}
              <span role="status" aria-live="polite" className="sr-only">
                {liveMessage}
              </span>
            </div>
          </RadixPopover.Anchor>
          <RadixPopover.Portal>
            <RadixPopover.Content
              align="start"
              sideOffset={4}
              // Radix отдаёт контенту role="dialog" — даём имя, иначе axe ругается.
              aria-label={ariaLabel ?? 'Suggestions'}
              className={cn(comboboxContentVariants({ size }))}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
              onInteractOutside={(event) => {
                // Клик по инпуту (он же anchor) не должен закрывать список.
                if (anchorRef.current?.contains(event.target as Node)) {
                  event.preventDefault()
                }
              }}
            >
              <ComboboxList
                groups={groups}
                options={options}
                loading={loading}
                isEmpty={isEmpty}
                value={value}
                activeIndex={activeIndex}
                listboxId={listboxId}
                loadingText={loadingText}
                emptyText={emptyText}
                size={size}
                onSelect={selectOption}
                onHover={setActiveIndex}
              />
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  },
)
