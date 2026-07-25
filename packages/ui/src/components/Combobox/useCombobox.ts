import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { useControllableState } from '../../hooks'
import {
  enabledIndexes,
  flattenOptions,
  type ComboboxOption,
} from './helpers'
import { useComboboxItems } from './useComboboxItems'
import type { ComboboxGroup, ComboboxItem, ComboboxProps } from './types'

const DEFAULT_DEBOUNCE_MS = 300

/** Public shape returned by {@link useCombobox} for headless consumers. */
export interface UseComboboxResult {
  groups: ComboboxGroup[]
  options: ComboboxOption[]
  loading: boolean
  isEmpty: boolean
  open: boolean
  value: string
  inputValue: string
  activeIndex: number | null
  activeId: string | undefined
  listboxId: string
  setActiveIndex: (index: number) => void
  selectOption: (item: ComboboxItem) => void
  handleInputChange: (next: string) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  handleOpenChange: (next: boolean) => void
  openList: () => void
}

function step(enabled: number[], current: number | null, delta: 1 | -1): number | null {
  if (enabled.length === 0) return null
  if (current === null) return delta === 1 ? enabled[0]! : enabled[enabled.length - 1]!
  const pos = enabled.indexOf(current)
  if (pos === -1) return delta === 1 ? enabled[0]! : enabled[enabled.length - 1]!
  const nextPos = Math.min(Math.max(pos + delta, 0), enabled.length - 1)
  return enabled[nextPos]!
}

/**
 * Headless state machine for the combobox: controllable value/open/inputValue,
 * option resolution (sync or async) and `aria-activedescendant` navigation. The
 * input keeps DOM focus at all times; the active option is tracked by index.
 */
export function useCombobox(props: ComboboxProps): UseComboboxResult {
  const {
    items,
    loadItems,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    value: valueProp,
    defaultValue,
    onValueChange,
    open: openProp,
    defaultOpen,
    onOpenChange,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputValueChange,
  } = props

  const listboxId = useId()

  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  })
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })
  const [inputValue, setInputValue] = useControllableState({
    value: inputValueProp,
    defaultValue: defaultInputValue ?? '',
    onChange: onInputValueChange,
  })

  const { groups, loading } = useComboboxItems({
    items,
    loadItems,
    query: inputValue,
    debounceMs,
    open,
  })

  const options = useMemo(() => flattenOptions(groups, listboxId), [groups, listboxId])
  const enabled = useMemo(() => enabledIndexes(options), [options])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Reset подсветки на первую опцию завязан ТОЛЬКО на смену набора опций (фильтр/
  // резолв), НЕ на open-toggle: иначе открытие затирало бы явный active из клав-хендлера
  // (ArrowUp-из-закрытого → последняя). activeId всё равно гейтится open, так что при
  // закрытом списке подсветка не видна.
  useEffect(() => {
    setActiveIndex(enabled.length > 0 ? enabled[0]! : null)
  }, [groups, enabled])

  const isEmpty = !loading && options.length === 0

  const selectOption = useCallback(
    (item: ComboboxItem) => {
      if (item.disabled) return
      setValue(item.value)
      setInputValue(item.label)
      setOpen(false)
    },
    [setValue, setInputValue, setOpen],
  )

  const handleInputChange = useCallback(
    (next: string) => {
      setInputValue(next)
      if (!open) setOpen(true)
    },
    [setInputValue, open, setOpen],
  )

  const openList = useCallback(() => {
    if (!open) setOpen(true)
  }, [open, setOpen])

  const handleOpenChange = useCallback((next: boolean) => setOpen(next), [setOpen])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (!open) {
            setOpen(true)
            setActiveIndex(enabled[0] ?? null)
          } else {
            setActiveIndex(step(enabled, activeIndex, 1))
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (!open) {
            setOpen(true)
            setActiveIndex(enabled[enabled.length - 1] ?? null)
          } else {
            setActiveIndex(step(enabled, activeIndex, -1))
          }
          break
        case 'Home':
          if (open) {
            event.preventDefault()
            setActiveIndex(enabled[0] ?? null)
          }
          break
        case 'End':
          if (open) {
            event.preventDefault()
            setActiveIndex(enabled[enabled.length - 1] ?? null)
          }
          break
        case 'Enter': {
          if (!open) return
          event.preventDefault()
          const option = activeIndex !== null ? options[activeIndex] : undefined
          if (option) selectOption(option.item)
          break
        }
        case 'Escape':
          if (open) {
            event.preventDefault()
            setOpen(false)
          } else if (inputValue !== '') {
            setInputValue('')
          }
          break
        case 'Tab':
          if (open) setOpen(false)
          break
        default:
          break
      }
    },
    [open, enabled, activeIndex, options, selectOption, setOpen, inputValue, setInputValue],
  )

  // Во время loading options держат ещё старый набор, а рендер списка их прячет —
  // не указываем activedescendant на несуществующий в DOM узел.
  const activeId =
    open && !loading && activeIndex !== null ? options[activeIndex]?.id : undefined

  return {
    groups,
    options,
    loading,
    isEmpty,
    open,
    value,
    inputValue,
    activeIndex,
    activeId,
    listboxId,
    setActiveIndex,
    selectOption,
    handleInputChange,
    handleKeyDown,
    handleOpenChange,
    openList,
  }
}
