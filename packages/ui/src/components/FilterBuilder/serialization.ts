import type {
  Combinator,
  FilterSchema,
  FilterTree,
  FilterValue,
} from './types'

// JSON-(де)сериализация FilterTree для URL/query-state. Round-trip лоссовый для
// деревьев с JSON-совместимыми значениями (см. FilterValue); Date/undefined/NaN
// консьюмер пре-кодирует сам.

// Версия схемы конверта. Бампать при смене wire-формата.
const FORMAT_VERSION = 1

interface Envelope {
  v: number
  tree: unknown
}

const COMBINATORS: readonly Combinator[] = ['and', 'or']

const GROUP_KEYS: readonly string[] = ['combinator', 'rules']

const RULE_KEYS: readonly string[] = ['field', 'operator', 'value']

const ENVELOPE_KEYS: readonly string[] = ['v', 'tree']

/** Serialize a tree to a versioned JSON string. O(n) in the number of nodes. */
export function serialize<S extends FilterSchema>(tree: FilterTree<S>): string {
  const envelope: Envelope = { v: FORMAT_VERSION, tree }
  return JSON.stringify(envelope)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Отвергает объект с ключом вне allowed: десериализованные узлы нормализованы,
// лишние ключи (напр. из подделанного URL) не текут в дерево. Наличие всех
// allowed не требует — это делают per-field проверки.
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

// Проверяет, что распарсенное значение — структурно валидный FilterValue;
// рекурсивный обход стережёт вложенные массивы и объекты.
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
  // Сначала точный набор ключей: отвергает гибрид group/rule (есть combinator) и
  // любой лишний ключ. Полезную нагрузку value намеренно оставляем непрозрачной.
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
  // Сначала точный набор ключей: отвергает гибрид с rule-ключами рядом с
  // combinator и любой лишний ключ.
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
 * Parse and validate a serialized filter tree, throwing an `Error` with a path
 * to the offending node on invalid JSON, an unknown envelope version, or a
 * structural failure. Validation is strict per node — each group carries exactly
 * `combinator`+`rules`, each rule exactly `field`+`operator`+`value`, no extras —
 * but a rule's `value` stays opaque JSON (only checked for JSON-serializability).
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
  // assertNode гарантирует plain-object; корень должен быть именно группой, а не
  // голым правилом.
  if (!('combinator' in (tree as Record<string, unknown>))) {
    throw new Error('tree: root node must be a group')
  }

  return tree as unknown as FilterTree<S>
}
