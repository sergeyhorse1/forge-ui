// Чистые текстовые форматтеры для компактного read-only summary. Без фреймворка —
// текст чипов юнит-тестируется без рендера; FilterSummary лишь раскладывает эти
// строки по стилизованным элементам.
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

// Рендерит значение правила в текст. inputKind разводит массив: range читается
// «a – b», multi склеивает лейблы опций запятыми (двухэлементный multi нельзя
// спутать с range). Boolean — true/false, пустое — em-dash, чтобы чип не
// заканчивался повисшим глаголом.
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
      const fromValue = value[0] ?? ''
      const toValue = value[1] ?? ''
      // Нетронутый range (['','']) читается как любое пустое, а не как повисшее « – ».
      if (fromValue === '' && toValue === '') return '—'
      const from = labelFor(fromValue, field, schema)
      const to = labelFor(toValue, field, schema)
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

// Мапит скаляр в лейбл enum-опции, если поле enum.
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
