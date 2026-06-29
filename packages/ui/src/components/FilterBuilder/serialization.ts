import type {
  Combinator,
  FilterSchema,
  FilterTree,
  FilterValue,
} from './types'

/**
 * JSON (de)serialization for {@link FilterTree}, suitable for URL/query-string
 * state. `serialize` produces a versioned envelope; `deserialize` validates
 * structure recursively and throws on malformed input rather than returning a
 * half-broken tree.
 *
 * Round-trip contract: `deserialize(serialize(tree))` is structurally equal to
 * `tree` for any tree whose rule values are JSON-serializable (see
 * {@link FilterValue}). Values outside that contract (`Date`, `undefined`,
 * `NaN`, …) are the consumer's responsibility to pre-encode.
 */

/** Current envelope schema version. Bump when the wire format changes. */
const FORMAT_VERSION = 1

interface Envelope {
  v: number
  tree: unknown
}

const COMBINATORS: readonly Combinator[] = ['and', 'or']

/** Exact key set a serialized group node may carry. */
const GROUP_KEYS: readonly string[] = ['combinator', 'rules']

/** Exact key set a serialized rule node may carry. */
const RULE_KEYS: readonly string[] = ['field', 'operator', 'value']

/** Exact key set the wire envelope may carry. */
const ENVELOPE_KEYS: readonly string[] = ['v', 'tree']

/** Serialize a tree to a versioned JSON string. O(n) in the number of nodes. */
export function serialize<S extends FilterSchema>(tree: FilterTree<S>): string {
  const envelope: Envelope = { v: FORMAT_VERSION, tree }
  return JSON.stringify(envelope)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reject an object that carries any key outside `allowed`. Keeps deserialized
 * nodes normalized: unknown/extra keys (e.g. from a tampered URL payload) never
 * leak into the tree. Does not enforce that every allowed key is present — the
 * per-field checks do that.
 */
function assertExactKeys(
  node: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
): void {
  for (const key of Object.keys(node)) {
    if (!allowed.includes(key)) {
      throw new Error(`${where}: unexpected key "${key}"`)
    }
  }
}

/**
 * Validate that a parsed JSON value is a structurally-sound {@link FilterValue}.
 * Rejects anything `JSON.parse` cannot legally produce inside a JSON document
 * (which already excludes `undefined`/functions); the recursive walk guards
 * nested arrays and objects.
 */
function assertFilterValue(value: unknown, where: string): asserts value is FilterValue {
  if (value === null) return
  const type = typeof value
  if (type === 'string' || type === 'boolean') return
  if (type === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${where}: numeric value must be finite`)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFilterValue(item, `${where}[${index}]`))
    return
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      assertFilterValue(value[key], `${where}.${key}`)
    }
    return
  }
  throw new Error(`${where}: not a JSON-serializable value`)
}

function assertRule(node: Record<string, unknown>, where: string): void {
  // Exact key set first: this rejects a group/rule hybrid (combinator present)
  // and any stray key. `value`'s own payload is left opaque on purpose.
  assertExactKeys(node, RULE_KEYS, where)
  if (typeof node['field'] !== 'string') {
    throw new Error(`${where}: rule "field" must be a string`)
  }
  if (typeof node['operator'] !== 'string') {
    throw new Error(`${where}: rule "operator" must be a string`)
  }
  if (!('value' in node)) {
    throw new Error(`${where}: rule is missing "value"`)
  }
  assertFilterValue(node['value'], `${where}.value`)
}

function assertGroup(node: Record<string, unknown>, where: string): void {
  // Exact key set first: this rejects a hybrid carrying rule keys alongside
  // `combinator`, and any stray key.
  assertExactKeys(node, GROUP_KEYS, where)
  if (!COMBINATORS.includes(node['combinator'] as Combinator)) {
    throw new Error(`${where}: group "combinator" must be "and" or "or"`)
  }
  const { rules } = node
  if (!Array.isArray(rules)) {
    throw new Error(`${where}: group "rules" must be an array`)
  }
  rules.forEach((child, index) => assertNode(child, `${where}.rules[${index}]`))
}

/** Recursively validate one node as either a group or a rule. */
function assertNode(node: unknown, where: string): void {
  if (!isPlainObject(node)) {
    throw new Error(`${where}: expected an object node`)
  }
  if ('combinator' in node) {
    assertGroup(node, where)
    return
  }
  assertRule(node, where)
}

/**
 * Parse and validate a serialized filter tree. Throws an `Error` with a path to
 * the offending node when the input is not valid JSON, has an unknown envelope
 * version, or fails structural validation.
 *
 * Validation is **strict at the node level**: within a known format version,
 * each group node must carry exactly `combinator` + `rules` and each rule node
 * exactly `field` + `operator` + `value` — any unknown or extra key (and any
 * group/rule hybrid) is rejected so the parsed tree stays normalized against
 * untrusted input. Strictness stops at the node boundary: a rule's `value` is
 * opaque JSON, so its own nested keys are not constrained (only validated for
 * JSON-serializability and finite numbers). Forward compatibility is carried by
 * the envelope's version field, never by lenient key handling.
 */
export function deserialize<S extends FilterSchema = FilterSchema>(
  input: string,
): FilterTree<S> {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (cause) {
    throw new Error('Filter tree is not valid JSON', { cause })
  }

  if (!isPlainObject(parsed)) {
    throw new Error('Filter envelope must be an object')
  }
  assertExactKeys(parsed, ENVELOPE_KEYS, 'envelope')
  if (parsed['v'] !== FORMAT_VERSION) {
    throw new Error(`Unsupported filter format version: ${String(parsed['v'])}`)
  }

  const tree = parsed['tree']
  assertNode(tree, 'tree')
  // `assertNode` guarantees a plain object; the root must specifically be a
  // group, not a bare rule.
  if (!('combinator' in (tree as Record<string, unknown>))) {
    throw new Error('tree: root node must be a group')
  }

  return tree as unknown as FilterTree<S>
}
