import { useEffect, useId, useRef } from 'react'

import { cn } from '../../utils/cn'
import type { ComboboxOption } from './helpers'
import {
  comboboxGroupLabelVariants,
  comboboxListVariants,
  comboboxOptionVariants,
  comboboxStatusVariants,
} from './styles'
import type { ComboboxGroup, ComboboxItem, ComboboxVariantProps } from './types'

interface ComboboxListProps {
  groups: ComboboxGroup[]
  options: ComboboxOption[]
  loading: boolean
  isEmpty: boolean
  value: string
  activeIndex: number | null
  listboxId: string
  loadingText: string
  emptyText: string
  size: ComboboxVariantProps['size']
  onSelect: (item: ComboboxItem) => void
  onHover: (index: number) => void
}

/** Presentational listbox: groups, options and the loading/empty status rows. */
export function ComboboxList({
  groups,
  options,
  loading,
  isEmpty,
  value,
  activeIndex,
  listboxId,
  loadingText,
  emptyText,
  size,
  onSelect,
  onHover,
}: ComboboxListProps) {
  const groupBaseId = useId()
  // Позиция в плоском списке инкрементится по мере рендера групп — совпадает с
  // индексацией flattenOptions, чтобы id/active сходились.
  let flatIndex = 0

  return (
    // mousedown гасим, чтобы клик по опции не уводил фокус с инпута.
    <div
      role="listbox"
      id={listboxId}
      className={cn(comboboxListVariants())}
      onMouseDown={(event) => event.preventDefault()}
    >
      {/* Статус-строки чисто визуальные: единственный анонсер — sr-only role=status
          рядом с инпутом (см. Combobox.tsx), иначе скринридер читал бы дважды. */}
      {loading && <div className={cn(comboboxStatusVariants())}>{loadingText}</div>}
      {!loading && isEmpty && <div className={cn(comboboxStatusVariants())}>{emptyText}</div>}
      {!loading &&
        groups.map((group, groupIndex) => {
          const labelId = `${groupBaseId}-${groupIndex}`
          const renderOption = (item: ComboboxItem) => {
            const option = options[flatIndex]!
            flatIndex += 1
            return (
              <Option
                key={option.id}
                option={option}
                selected={item.value === value}
                active={activeIndex === option.index}
                size={size}
                onSelect={onSelect}
                onHover={onHover}
              />
            )
          }

          if (group.label === '') {
            return group.items.map(renderOption)
          }
          return (
            <div key={labelId} role="group" aria-labelledby={labelId}>
              <div id={labelId} aria-hidden className={cn(comboboxGroupLabelVariants())}>
                {group.label}
              </div>
              {group.items.map(renderOption)}
            </div>
          )
        })}
    </div>
  )
}

interface OptionProps {
  option: ComboboxOption
  selected: boolean
  active: boolean
  size: ComboboxVariantProps['size']
  onSelect: (item: ComboboxItem) => void
  onHover: (index: number) => void
}

function Option({ option, selected, active, size, onSelect, onHover }: OptionProps) {
  const { item } = option
  const ref = useRef<HTMLDivElement>(null)

  // Навигация идёт через aria-activedescendant (фокус на инпуте), поэтому браузер
  // сам не скроллит контейнер — подтягиваем активную опцию в зону видимости.
  // scrollIntoView не переносит DOM-фокус; в jsdom метод отсутствует → optional-call.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  return (
    <div
      ref={ref}
      role="option"
      id={option.id}
      aria-selected={selected}
      aria-disabled={item.disabled || undefined}
      data-active={active}
      data-disabled={item.disabled ? true : undefined}
      className={cn(comboboxOptionVariants({ size }), selected && 'font-medium')}
      onClick={() => onSelect(item)}
      onMouseMove={() => onHover(option.index)}
    >
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {selected && <CheckIcon />}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="ml-2 shrink-0"
    >
      <path
        d="M11.5 3.5L5.5 10L2.5 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
