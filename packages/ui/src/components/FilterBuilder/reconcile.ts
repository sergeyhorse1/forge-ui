// Чистая реконсиляция триплета правила (field, operator, value) со схемой полей.
// Смена field/operator может обнулить оператор и/или переформовать значение
// (single ↔ range ↔ multi); хелперы всегда возвращают ПОЛНОЕ структурно-валидное
// правило, чтобы дерево не держало битую комбинацию. Всё framework-free и без
// сайд-эффектов — юнит-тестируется без рендера.
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

function scalarDefault(type: FieldType, config?: FilterFieldConfig): FilterValue {
  if (type === 'boolean') return false
  if (type === 'enum') {
    const first = config?.type === 'enum' ? config.options[0] : undefined
    return first?.value ?? ''
  }
  return ''
}

// Сводит любое значение к одному скаляру — при схлопывании range/multi в single.
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
 * Reshape a rule's `value` to a new `inputKind`, preserving what makes sense:
 * `single` collapses to one scalar, `range` carries a scalar into `[scalar,
 * default]` (or keeps a 2-tuple), `multi` keeps an array or wraps a scalar.
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
  if (Array.isArray(value)) return value
  const isEmptyScalar = value === '' || value === null
  return isEmptyScalar ? [] : [value]
}

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
 * Reconcile a rule after its **field** changes: keep the current operator if it
 * is still valid for the new field (else its default), then coerce the value to
 * that operator's input kind for the new type, so no broken combination survives.
 */
export function reconcileField(
  rule: FilterRule,
  nextFieldName: string,
  schema: FilterFieldSchema,
): FilterRule {
  const config = fieldConfig(nextFieldName, schema)
  if (config === undefined) {
    return { field: nextFieldName, operator: rule.operator, value: rule.value }
  }

  const validOperators = operatorsForField(nextFieldName, schema)
  const keepsOperator = validOperators.some((op) => op.value === rule.operator)
  const nextOperator = keepsOperator
    ? rule.operator
    : defaultOperatorForField(nextFieldName, schema)

  // Id операторов пересекаются между типами (between — число и дата, is — boolean и
  // enum), поэтому сохранить id мало: число не должно уехать в date-поле, а true —
  // в enum. Значение переносим только при неизменном ТИПЕ, иначе — дефолт нового
  // типа. rule здесь всё ещё называет СТАРОЕ поле (реконсиляция до апдейта), так что
  // его config даёт прежний тип.
  const prevConfig = fieldConfig(rule.field, schema)
  const sameType = prevConfig?.type === config.type

  const inputKind = inputKindFor(nextFieldName, nextOperator, schema)
  const carried =
    keepsOperator && sameType
      ? coerceValue(rule.value, config.type, inputKind, config)
      : defaultValueFor(config.type, inputKind, config)
  // Даже в одном типе enum→enum с другими опциями может оставить значение вне
  // нового набора; sanitize закрывает этот зазор.
  const nextValue = sanitizeForField(carried, config, inputKind)

  return { field: nextFieldName, operator: nextOperator, value: nextValue }
}

// Выкидывает enum-значения вне набора опций целевого поля, чтобы controlled select
// не держал значение без опции. Для multi enum массив фильтруется (пустой, если
// ничего не уцелело); для single — значение вне набора падает в enum-дефолт.
// Не-enum поля проходят без изменений.
function sanitizeForField(
  value: FilterValue,
  config: FilterFieldConfig,
  inputKind: OperatorInputKind,
): FilterValue {
  if (config.type !== 'enum') return value
  const allowed = new Set<FilterValue>(config.options.map((option) => option.value))

  if (inputKind === 'multi') {
    return Array.isArray(value) ? value.filter((item) => allowed.has(item)) : []
  }
  if (allowed.has(value)) return value
  return defaultValueFor('enum', inputKind, config)
}

/**
 * Reconcile a rule after its **operator** changes within the same field. The
 * operator may switch the input kind (e.g. number `=` single → `between`
 * range), so the value is reshaped via {@link coerceValue} to keep it valid.
 */
export function reconcileOperator(
  rule: FilterRule,
  nextOperatorId: string,
  schema: FilterFieldSchema,
): FilterRule {
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
