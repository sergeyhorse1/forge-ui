import type { ComboboxGroup, ComboboxItem, ComboboxItems } from './types'

/** A flat option with the metadata navigation needs. */
export interface ComboboxOption {
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

/** Wrap a flat item list in a single untitled group; drop already-empty groups. */
export function normalizeGroups(items: ComboboxItems): ComboboxGroup[] {
  if (items.length === 0) return []
  if (isGroupArray(items)) {
    return items.map((group) => ({ ...group })).filter((group) => group.items.length > 0)
  }
  return [{ label: '', items: [...(items as readonly ComboboxItem[])] }]
}

/** Case-insensitive substring match on the label. */
function matches(item: ComboboxItem, query: string): boolean {
  return item.label.toLowerCase().includes(query.toLowerCase())
}

/** Filter groups by query; groups with no matching options are always dropped. */
export function filterGroups(groups: ComboboxGroup[], query: string): ComboboxGroup[] {
  const trimmed = query.trim()
  const scoped =
    trimmed === ''
      ? groups
      : groups.map((group) => ({
          ...group,
          items: group.items.filter((item) => matches(item, trimmed)),
        }))
  return scoped.filter((group) => group.items.length > 0)
}

/** Flatten groups into a positional option list keyed off `listboxId`. */
export function flattenOptions(groups: ComboboxGroup[], listboxId: string): ComboboxOption[] {
  const flat: ComboboxOption[] = []
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
export function enabledIndexes(options: ComboboxOption[]): number[] {
  return options.filter((option) => !option.item.disabled).map((option) => option.index)
}
