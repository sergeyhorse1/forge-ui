/**
 * Pure reconciliation between a rule's `(field, operator, value)` triple and a
 * field schema. Changing the field or operator can invalidate the operator
 * and/or reshape the value (single ↔ range ↔ multi); these helpers always
 * return a *complete*, structurally-valid rule so the tree never holds a broken
 * field/operator/value combination after a change.
 *
 * Everything here is framework-free and side-effect-free, so it is unit-tested
 * directly without rendering. The editor calls {@link reconcileField} from the
 * field selector's `onChange` and {@link reconcileOperator} from the operator
 * selector's `onChange`, passing the result to the pre-bound `update`.
 */
import {
  defaultOperatorForField,
  fieldConfig,
  operatorDef,
  operatorsForField,
  type FieldType,
  type FilterFieldConfig,
  type FilterFieldSchema,
  type OperatorInputKind,
} from './schema'
import type { FilterRule, FilterValue } from './types'

/** A fully-formed permissive rule — the shape the schema editor reads/writes. */
type Rule = FilterRule

/**
 * The default value for a freshly (re)shaped control. `number`/`string`/`date`
 * start empty (`''`) so the native control shows a blank rather than a
 * misleading `0`; `boolean` starts `false`; `enum` starts on its first option
 * (or `''` when the field declares none).
 */
export function defaultValueFor(
  type: FieldType,
  inputKind: OperatorInputKind,
  config?: FilterFieldConfig,
): FilterValue {
  if (inputKind === 'multi') return []
  if (inputKind === 'range') {
    const scalar = scalarDefault(type, config)
    return [scalar, scalar]
  }
  return scalarDefault(type, config)
}

/** The single-control default for a type, used by both single and range. */
function scalarDefault(type: FieldType, config?: FilterFieldConfig): FilterValue {
  if (type === 'boolean') return false
  if (type === 'enum') {
    const first = config?.type === 'enum' ? config.options[0] : undefined
    return first?.value ?? ''
  }
  return ''
}

/** Reduce any value to one scalar — used when collapsing range/multi to single. */
function toScalar(value: FilterValue, type: FieldType, config?: FilterFieldConfig): FilterValue {
  if (Array.isArray(value)) {
    const head = value[0]
    return head === undefined ? scalarDefault(type, config) : head
  }
  if (value === null || typeof value === 'object') {
    return scalarDefault(type, config)
  }
  return value
}

/**
 * Reshape a rule's `value` to match a new `inputKind`, preserving as much of the
 * existing value as makes sense:
 * - `single` — collapse to one scalar (first element of an array, else as-is).
 * - `range` — carry the current scalar into `[scalar, default]`; keep an
 *   existing 2-tuple; otherwise fall back to two defaults.
 * - `multi` — keep an existing array; wrap a meaningful scalar into a singleton;
 *   otherwise an empty array.
 */
export function coerceValue(
  value: FilterValue,
  type: FieldType,
  inputKind: OperatorInputKind,
  config?: FilterFieldConfig,
): FilterValue {
  if (inputKind === 'single') {
    return toScalar(value, type, config)
  }
  if (inputKind === 'range') {
    if (Array.isArray(value) && value.length >= 2) {
      return [value[0] ?? scalarDefault(type, config), value[1] ?? scalarDefault(type, config)]
    }
    const scalar = toScalar(value, type, config)
    return [scalar, scalarDefault(type, config)]
  }
  // multi
  if (Array.isArray(value)) return value
  const isEmptyScalar = value === '' || value === null
  return isEmptyScalar ? [] : [value]
}

/** The input kind for a rule's current operator, defaulting to `single`. */
function inputKindFor(
  fieldName: string,
  operatorId: string,
  schema: FilterFieldSchema,
): OperatorInputKind {
  const config = fieldConfig(fieldName, schema)
  if (config === undefined) return 'single'
  return operatorDef(config.type, operatorId)?.inputKind ?? 'single'
}

/**
 * Reconcile a rule after its **field** changes to `nextFieldName`:
 * 1. Keep the current operator if it is still valid for the new field;
 *    otherwise reset to the new field's default operator.
 * 2. Coerce the value to the (possibly new) operator's input kind for the new
 *    field's type, so no broken combination survives the change.
 */
export function reconcileField(
  rule: Rule,
  nextFieldName: string,
  schema: FilterFieldSchema,
): Rule {
  const config = fieldConfig(nextFieldName, schema)
  if (config === undefined) {
    return { field: nextFieldName, operator: rule.operator, value: rule.value }
  }

  const validOperators = operatorsForField(nextFieldName, schema)
  const keepsOperator = validOperators.some((op) => op.value === rule.operator)
  const nextOperator = keepsOperator
    ? rule.operator
    : defaultOperatorForField(nextFieldName, schema)

  const inputKind = inputKindFor(nextFieldName, nextOperator, schema)
  const nextValue = keepsOperator
    ? coerceValue(rule.value, config.type, inputKind, config)
    : defaultValueFor(config.type, inputKind, config)

  return { field: nextFieldName, operator: nextOperator, value: nextValue }
}

/**
 * Reconcile a rule after its **operator** changes within the same field. The
 * operator may switch the input kind (e.g. number `=` single → `between`
 * range), so the value is reshaped via {@link coerceValue} to keep it valid.
 */
export function reconcileOperator(
  rule: Rule,
  nextOperatorId: string,
  schema: FilterFieldSchema,
): Rule {
  const config = fieldConfig(rule.field, schema)
  if (config === undefined) {
    return { field: rule.field, operator: nextOperatorId, value: rule.value }
  }
  const inputKind = operatorDef(config.type, nextOperatorId)?.inputKind ?? 'single'
  return {
    field: rule.field,
    operator: nextOperatorId,
    value: coerceValue(rule.value, config.type, inputKind, config),
  }
}
