// Рантайм-схема полей и пер-типовый реестр операторов для schema-aware редактора
// (и компактного summary). Намеренно отдельно от type-level FilterSchema из
// types.ts: это plain-конфиг, что консьюмер передаёт пропом fields, а не тип,
// которым параметризуется дерево. Редактор работает с пермиссивной формой правила,
// так что type-level S из массива не выводится — типизированы лишь сам конфиг и реестр.

/** The five value kinds a field can hold; each maps to its own operator set. */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum'

/** One choice in an `enum` field. The stored value is JSON-serializable. */
export interface EnumOption {
  label: string
  value: string | number
}

/** Properties shared by every field config regardless of type. */
interface FieldConfigBase {
  /** Stored on the rule; the discriminant the tree is keyed by. */
  field: string
  /** Human label shown in the field selector and the summary chips. */
  label: string
  /**
   * Optional narrowing of the operators offered for this field: omitted uses the
   * full per-type set from {@link OPERATORS_BY_TYPE}; given, it intersects with
   * that set in the order listed here.
   */
  operators?: readonly string[]
}

/** Config for a non-enum field: enum-only `options` is absent here. */
interface ScalarFieldConfig extends FieldConfigBase {
  type: Exclude<FieldType, 'enum'>
}

/** Config for an enum field: `options` is required (and forbidden elsewhere). */
interface EnumFieldConfig extends FieldConfigBase {
  type: 'enum'
  options: readonly EnumOption[]
}

/**
 * One field's runtime config, a discriminated union on `type`: `options` is
 * required exactly when `type` is `'enum'` and is not part of the other members.
 */
export type FilterFieldConfig = ScalarFieldConfig | EnumFieldConfig

/** The full ordered list of fields a consumer hands to {@link FilterBuilder}. */
export type FilterFieldSchema = readonly FilterFieldConfig[]

/**
 * How many value controls an operator needs:
 * - `single` — one scalar control (most operators).
 * - `range` — two controls; value is a `[from, to]` pair (e.g. `between`).
 * - `multi` — a multi-select; value is an array (e.g. enum `in`).
 */
export type OperatorInputKind = 'single' | 'range' | 'multi'

/** One operator in the registry. `label` doubles as the compact-summary verb. */
export interface OperatorDef {
  value: string
  label: string
  inputKind: OperatorInputKind
}

const STRING_OPERATORS: readonly OperatorDef[] = [
  { value: 'contains', label: 'contains', inputKind: 'single' },
  { value: 'equals', label: 'equals', inputKind: 'single' },
  { value: 'startsWith', label: 'starts with', inputKind: 'single' },
  { value: 'endsWith', label: 'ends with', inputKind: 'single' },
  { value: 'notContains', label: 'does not contain', inputKind: 'single' },
]

const NUMBER_OPERATORS: readonly OperatorDef[] = [
  { value: 'eq', label: '=', inputKind: 'single' },
  { value: 'neq', label: '≠', inputKind: 'single' },
  { value: 'lt', label: '<', inputKind: 'single' },
  { value: 'gt', label: '>', inputKind: 'single' },
  { value: 'lte', label: '≤', inputKind: 'single' },
  { value: 'gte', label: '≥', inputKind: 'single' },
  { value: 'between', label: 'between', inputKind: 'range' },
]

const DATE_OPERATORS: readonly OperatorDef[] = [
  { value: 'before', label: 'before', inputKind: 'single' },
  { value: 'after', label: 'after', inputKind: 'single' },
  { value: 'between', label: 'between', inputKind: 'range' },
]

const BOOLEAN_OPERATORS: readonly OperatorDef[] = [
  { value: 'is', label: 'is', inputKind: 'single' },
]

const ENUM_OPERATORS: readonly OperatorDef[] = [
  { value: 'is', label: 'is', inputKind: 'single' },
  { value: 'isNot', label: 'is not', inputKind: 'single' },
  { value: 'in', label: 'in', inputKind: 'multi' },
]

/** The default operator set offered for each {@link FieldType}. */
export const OPERATORS_BY_TYPE: Record<FieldType, readonly OperatorDef[]> = {
  string: STRING_OPERATORS,
  number: NUMBER_OPERATORS,
  date: DATE_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  enum: ENUM_OPERATORS,
}

/** Find a field config by its `field` name, or `undefined` if absent. */
export function fieldConfig(
  fieldName: string,
  schema: FilterFieldSchema,
): FilterFieldConfig | undefined {
  return schema.find((entry) => entry.field === fieldName)
}

/**
 * The operators offered for a field: the per-type default set, optionally
 * narrowed to (and reordered by) the field's own `operators` allow-list. An
 * unknown field, or one whose allow-list intersects to nothing, falls back to
 * the full per-type set so the selector is never empty for a valid type.
 */
export function operatorsForField(
  fieldName: string,
  schema: FilterFieldSchema,
): readonly OperatorDef[] {
  const config = fieldConfig(fieldName, schema)
  if (config === undefined) return []
  const byType = OPERATORS_BY_TYPE[config.type]
  const allow = config.operators
  if (allow === undefined || allow.length === 0) return byType
  const narrowed = allow
    .map((id) => byType.find((op) => op.value === id))
    .filter((op): op is OperatorDef => op !== undefined)
  return narrowed.length > 0 ? narrowed : byType
}

/**
 * Look up one operator definition by field type and operator id. When only a
 * field *name* is known, use {@link operatorDefForField} instead.
 */
export function operatorDef(
  type: FieldType,
  operatorId: string,
): OperatorDef | undefined {
  return OPERATORS_BY_TYPE[type].find((op) => op.value === operatorId)
}

/** The first valid operator id for a field — the schema-driven default. */
export function defaultOperatorForField(
  fieldName: string,
  schema: FilterFieldSchema,
): string {
  const operators = operatorsForField(fieldName, schema)
  return operators[0]?.value ?? ''
}

/** Resolve the operator definition for a rule's `(field, operator)` pair. */
export function operatorDefForField(
  fieldName: string,
  operatorId: string,
  schema: FilterFieldSchema,
): OperatorDef | undefined {
  return operatorsForField(fieldName, schema).find(
    (op) => op.value === operatorId,
  )
}
