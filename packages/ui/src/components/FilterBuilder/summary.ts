/**
 * Pure text formatters for the compact, read-only summary. Kept framework-free
 * so the chip text is unit-testable without rendering: `FilterSummary` only maps
 * these strings onto styled elements.
 */
import {
  fieldConfig,
  operatorDefForField,
  type FilterFieldSchema,
  type OperatorInputKind,
} from './schema'
import type {
  Combinator,
  FilterGroup,
  FilterRule,
  FilterSchema,
  FilterValue,
} from './types'

/** The three text parts of a rule chip: "Field", "operator", "value". */
export interface RuleSummaryParts {
  field: string
  operator: string
  value: string
}

/** "AND of 3 conditions" / "OR of 1 condition" — caption for a group. */
export function describeCombinator(
  combinator: Combinator,
  childCount: number,
): string {
  const word = combinator === 'and' ? 'AND' : 'OR'
  const noun = childCount === 1 ? 'condition' : 'conditions'
  return `${word} of ${childCount} ${noun}`
}

/**
 * Build the labelled parts of a rule chip: the field's label, the operator's
 * verb (its registry `label`, e.g. `>` or `is not`), and a human value. Enum
 * values are mapped back to their option label; ranges read "a – b"; arrays are
 * comma-joined; booleans read true/false.
 */
export function summarizeRule<S extends FilterSchema>(
  rule: FilterRule<S>,
  schema: FilterFieldSchema,
): RuleSummaryParts {
  const field = String(rule.field)
  const operatorId = String(rule.operator)
  const config = fieldConfig(field, schema)
  const operator = operatorDefForField(field, operatorId, schema)
  return {
    field: config?.label ?? field,
    operator: operator?.label ?? operatorId,
    value: formatValue(rule.value, field, schema, operator?.inputKind),
  }
}

/** A single one-line string for a rule, e.g. "Price > 100". */
export function summarizeRuleText<S extends FilterSchema>(
  rule: FilterRule<S>,
  schema: FilterFieldSchema,
): string {
  const parts = summarizeRule(rule, schema)
  return [parts.field, parts.operator, parts.value]
    .filter((part) => part.length > 0)
    .join(' ')
}

/** Caption text for a group node. */
export function summarizeGroup<S extends FilterSchema>(
  group: FilterGroup<S>,
): string {
  return describeCombinator(group.combinator, group.rules.length)
}

/**
 * Render a rule value as display text. The operator's `inputKind` disambiguates
 * an array value: a `range` reads "a – b" while a `multi` joins its option
 * labels with commas (a two-item multi must not be mistaken for a range).
 * Booleans read true/false and an empty value reads as an em dash so the chip
 * never ends on a dangling verb.
 */
function formatValue(
  value: FilterValue,
  field: string,
  schema: FilterFieldSchema,
  inputKind: OperatorInputKind | undefined,
): string {
  if (value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  if (Array.isArray(value)) {
    if (inputKind === 'range' && value.length >= 2) {
      const from = labelFor(value[0] ?? '', field, schema)
      const to = labelFor(value[1] ?? '', field, schema)
      return `${from} – ${to}`
    }
    const labels = value
      .map((item) => labelFor(item, field, schema))
      .filter((label) => label.length > 0)
    return labels.length > 0 ? labels.join(', ') : '—'
  }

  if (typeof value === 'object') return '—'
  return labelFor(value, field, schema)
}

/** Map one scalar to its enum option label when the field is an enum. */
function labelFor(
  value: FilterValue,
  field: string,
  schema: FilterFieldSchema,
): string {
  const config = fieldConfig(field, schema)
  if (config?.type === 'enum') {
    const option = config.options.find((entry) => entry.value === value)
    if (option) return option.label
  }
  if (value === null || typeof value === 'object') return ''
  return String(value)
}
