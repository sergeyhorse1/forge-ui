# ADR-007: FilterBuilder — controlled normalized tree with structural sharing

## Status

Accepted

## Context

The FilterBuilder lets users compose nested AND/OR conditions, the kind of
query found behind a "filter" panel on a dashboard. Before any rendering code,
the state shape and how it is mutated had to be settled, because three
requirements pull on the model directly:

1. **It must be fully controlled.** The filter value is application state: it is
   round-tripped through the URL/query string, persisted, and shared. The
   component cannot own private state that diverges from what the consumer
   holds — `value`/`onChange` must be the single source of truth.

2. **Editing one rule must not re-render the rest.** A realistic filter can hold
   a couple of hundred rules across nested groups. Typing in one rule's value
   field should not re-render its siblings or unrelated groups, or the panel
   becomes sluggish. That requires the data model itself to make untouched
   branches cheap to skip, not just careful memoisation in the view.

3. **It must serialize losslessly.** Exporting to JSON for URL state and
   re-importing has to reproduce the exact same tree, and a corrupted or
   hand-tampered payload must be rejected loudly rather than yielding a
   half-broken tree.

## Decision

### Normalized recursive tree: `{ combinator, rules: (Rule | Group)[] }`

The state is a single recursive structure. The root is a group; a group has a
`combinator` (`'and' | 'or'`) and an ordered `rules` array whose entries are
either leaf rules (`{ field, operator, value }`) or nested groups. A node's
address is a `path` — the list of `rules` indices walked from the root, with
`[]` meaning the root. Groups and rules are distinguished by the presence of the
`combinator` key, which doubles as the discriminator for both serialization and
the operation helpers.

### Generic schema at the type level, no runtime config in this layer

Field/operator/value are parameterised by a `FilterSchema` type map. Given a
concrete schema, a rule becomes a discriminated union keyed by `field`, so its
operator and value are tied to that field's declared shape; without a schema the
types stay permissive (any string field, any JSON value). This is purely a
type-level facility — there is no runtime schema object here. A runtime
field-configuration layer (labels, operator pickers) is a separate concern that
builds on top of this model.

### No internal state; pure path-based operations with structural sharing

There is no React state inside this layer. All edits are pure functions of the
form `(tree, path, …) => tree` that return a new tree and never mutate the
input. The consumer holds the tree and feeds the result of an operation back in
through `onChange`.

Each operation is implemented through one recursive rewrite helper that copies
**only the groups along the edited path**; every untouched branch keeps its
object identity (`===`). Editing the rule at `[2, 1]` produces a new root and a
new group at index 2, but `root.rules[0]`, `root.rules[1]` and the unedited
siblings inside the edited group are the very same objects as before. This is
deliberately *not* a deep clone (`structuredClone` of the whole tree would make
every node new and defeat the point): reference-stable siblings are what let the
view memoise rule rows by identity and re-render only the edited path. The cost
of an edit is O(depth × width-of-the-copied-level), with no quadratic blow-up.

### JSON serialization with strict structural validation

`serialize` emits a versioned envelope (`{ v, tree }`) via a single
`JSON.stringify` (O(n)). `deserialize` parses it, checks the version, and then
recursively validates structure through a reusable validator: every node must be
either a valid group (`combinator ∈ {and, or}`, `rules` is an array) or a valid
rule (`field` and `operator` are strings, `value` is a JSON value), and the root
must be a group. Malformed input throws an `Error` that names the offending node
path instead of returning a broken tree.

Validation is **strict at the node level**: a group node must carry exactly
`combinator` + `rules`, a rule node exactly `field` + `operator` + `value`, and
the envelope exactly `v` + `tree`. Any unknown or extra key — and therefore any
group/rule hybrid — is rejected, so payloads arriving from untrusted sources
(URL/query state) cannot smuggle stray keys into the normalized tree. Strictness
deliberately stops at the node boundary: a rule's `value` is opaque JSON, so its
own nested keys are unconstrained and validated only for JSON-serializability and
finite numbers. Forward compatibility is carried by the envelope version field,
never by lenient key handling.

## Consequences

- **The component will be a controlled value/onChange surface.** Because the
  model carries no state, the rendering layer is a thin projection over a tree
  the consumer owns — this is the foundation the interactive tree builder is
  built on.
- **Structural sharing is the load-bearing perf primitive.** The render-count
  isolation budget (editing one rule must not re-render siblings) depends on the
  reference stability these operations guarantee; the view can `React.memo` rule
  rows on node identity. Any future operation must preserve this invariant.
- **The round-trip contract is bounded to JSON values.** `Date`, `undefined`,
  `NaN` and other non-JSON values are intentionally outside the `value` type;
  consumers that filter on such values pre-encode them (e.g. ISO string, epoch
  number) and decode on read. Within that contract,
  `deserialize(serialize(tree))` is structurally equal to `tree`.
- **The wire format is versioned.** The envelope's `v` field lets the format
  evolve; `deserialize` rejects unknown versions rather than silently
  misreading newer payloads.
- **Deserialized trees are normalized, not lenient.** Because node-level keys
  are validated against an exact set, the output of `deserialize` carries only
  the canonical fields — no caller can rely on extra keys surviving a round trip,
  and new optional fields must arrive through a version bump rather than being
  tolerated silently. The opaque `value` payload is the one place where arbitrary
  keys remain by design.
