import type { ComboboxGroup, ComboboxItem, ComboboxItems } from './types'

/** A flat option with the metadata navigation needs. */
export interface FlatOption {
  item: ComboboxItem
  /** DOM id, stable per position, used for `aria-activedescendant`. */
  id: string
  /** Position among all rendered options (enabled or not). */
  index: number
}

function isGroupArray(items: ComboboxItems): items is readonly ComboboxGroup[] {
  const first = items[0]
  return first !== undefined && 'items' in first
}

/** Wrap a flat item list in a single untitled group so rendering is uniform. */
export function normalizeGroups(items: ComboboxItems): ComboboxGroup[] {
  if (items.length === 0) return []
  if (isGroupArray(items)) return items.map((group) => ({ ...group }))
  return [{ label: '', items: [...(items as readonly ComboboxItem[])] }]
}

/** Case-insensitive substring match on the label. */
function matches(item: ComboboxItem, query: string): boolean {
  return item.label.toLowerCase().includes(query.toLowerCase())
}

/** Filter groups by query, dropping groups left with no options. */
export function filterGroups(groups: ComboboxGroup[], query: string): ComboboxGroup[] {
  const trimmed = query.trim()
  if (trimmed === '') return groups
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => matches(item, trimmed)) }))
    .filter((group) => group.items.length > 0)
}

/** Flatten groups into a positional option list keyed off `listboxId`. */
export function flattenOptions(groups: ComboboxGroup[], listboxId: string): FlatOption[] {
  const flat: FlatOption[] = []
  let index = 0
  for (const group of groups) {
    for (const item of group.items) {
      flat.push({ item, id: `${listboxId}-opt-${index}`, index })
      index += 1
    }
  }
  return flat
}

/** Positions of the options that can actually be selected. */
export function enabledIndexes(options: FlatOption[]): number[] {
  return options.filter((option) => !option.item.disabled).map((option) => option.index)
}

/** Find the label matching a value across all options, if present. */
export function labelForValue(groups: ComboboxGroup[], value: string): string | undefined {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.value === value) return item.label
    }
  }
  return undefined
}
