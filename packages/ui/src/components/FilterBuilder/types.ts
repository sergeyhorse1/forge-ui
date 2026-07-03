/**
 * Boolean operator joining the rules and sub-groups of a {@link FilterGroup}.
 */
export type Combinator = 'and' | 'or'

/**
 * A JSON-serializable value carried by a filter rule. The union is deliberately
 * narrow — `undefined`, `Date`, `NaN`, `Infinity`, functions and symbols are
 * excluded — so {@link serialize}/{@link deserialize} stay a lossless round trip;
 * pre-encode non-JSON values (e.g. a date to an ISO string) before use.
 */
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | FilterValue[]
  | { [key: string]: FilterValue }

/**
 * The shape of one field at the type level: the operators it accepts and the
 * value type those operators compare against.
 *
 * @typeParam TOperator - String-literal union of allowed operators.
 * @typeParam TValue - JSON value type compared by the operators.
 */
export interface FieldShape<TOperator extends string, TValue extends FilterValue> {
  operator: TOperator
  value: TValue
}

/**
 * Type-level map from field name to its {@link FieldShape} — a type only, no
 * runtime object. Supply one for per-field typed operators/values; omit it for
 * the permissive default where any string field carries any {@link FilterValue}.
 */
export type FilterSchema = Record<string, FieldShape<string, FilterValue>>

/**
 * A single leaf condition. Parameterised with a concrete {@link FilterSchema} it
 * becomes a discriminated union keyed by `field` (tying `operator`/`value` to
 * that field's shape); unparameterised it stays permissive.
 */
export type FilterRule<S extends FilterSchema = FilterSchema> = {
  [K in keyof S & string]: {
    field: K
    operator: S[K]['operator']
    value: S[K]['value']
  }
}[keyof S & string]

/**
 * A group of nodes combined by a {@link Combinator}. Groups may nest
 * arbitrarily deep via {@link FilterNode}.
 */
export interface FilterGroup<S extends FilterSchema = FilterSchema> {
  combinator: Combinator
  rules: FilterNode<S>[]
}

/** Either a leaf {@link FilterRule} or a nested {@link FilterGroup}. */
export type FilterNode<S extends FilterSchema = FilterSchema> =
  | FilterRule<S>
  | FilterGroup<S>

/** The root of a filter tree is always a group. */
export type FilterTree<S extends FilterSchema = FilterSchema> = FilterGroup<S>

/**
 * Address of a node within a tree: the chain of `rules` indices walked from the
 * root down to the node. An empty path `[]` refers to the root group itself.
 */
export type FilterPath = readonly number[]

/** Narrow a {@link FilterNode} to a {@link FilterGroup}. */
export function isGroup<S extends FilterSchema>(
  node: FilterNode<S>,
): node is FilterGroup<S> {
  return 'combinator' in node
}

/** Narrow a {@link FilterNode} to a {@link FilterRule}. */
export function isRule<S extends FilterSchema>(
  node: FilterNode<S>,
): node is FilterRule<S> {
  return !isGroup(node)
}
