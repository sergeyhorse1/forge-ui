# ADR-008: FilterBuilder — post-commit focus management via intent + effect

## Status

Accepted

## Context

The FilterBuilder is a fully controlled tree editor: it holds no tree state, and
every edit is a pure `(tree, path, …) => tree` operation whose result is handed
back through `onChange` (see ADR-007). Adding, removing, and editing rules and
groups is driven entirely by props.

Keyboard users need focus to follow their edits, the same way a native form does:

- Adding a rule should move focus into the new row's first control, so the user
  can start typing immediately without reaching for the mouse.
- Adding a group should move focus into the new group.
- Removing a rule should move focus to a surviving neighbour (or the group's "Add
  rule" button when the group empties), never dropping the user onto
  `document.body`, which strands keyboard navigation.

This is awkward under a controlled, stateless model. When an action fires, the
DOM for the edit does not exist yet: the new row only appears after the consumer
echoes the next `value` back and the component re-renders. Focus therefore cannot
be moved synchronously inside the action.

Two tempting shortcuts were rejected:

- **Move focus synchronously in the click handler.** The target element is not in
  the DOM yet (the tree has not committed), so there is nothing to focus.
- **Track focus in component state and remount rows with stable ids.** That
  reintroduces internal state and node ids, both of which the model deliberately
  rejects (ADR-007: identity is positional; the component is a pure projection).

## Decision

### Record a focus *intent*, resolve it after commit

Each mutating action records *what* should be focused as a small, path-addressed
`FocusIntent` in a ref, then performs its normal `onChange` emit:

- `addRule(path)` / `addGroup(path)` compute the appended child's index from the
  current tree and record a `ruleFirstControl` / `groupFirstControl` intent at
  the new node's path.
- `removeNode(path)` records an `afterRemove` intent carrying the parent path and
  the removed index.
- `updateRule` / `setCombinator` clear any pending intent — a value edit must not
  move focus, and a stale add/remove intent must not survive into this commit.

The intent lives in a `ref`, not in state: recording one neither triggers a
render nor reintroduces tree state, and the ref's stable identity is what lets the
`actions` object stay memoised with an empty dependency list (preserving the
render-isolation guarantees from ADR-007).

### Correlate the intent with the commit it belongs to

Each recorded intent is paired with the exact tree the action computed
(`{ intent, expected }`, where `expected` is the very object passed to `onChange`).
An effect depending on `[value]` runs only when the tree actually changes, and it
fires the intent **only when `value === expected`** — i.e. when the consumer
echoed back precisely the tree this action produced. This closes a subtle
focus-theft class: if `onChange` is rejected (a no-op, or a min-rule guard
returning the same tree) the commit never happens, and any later unrelated commit
finds `value !== expected` and refuses to move focus, so a stale `afterRemove`
intent can never yank focus out of a field the user is now editing. Depending on
`[value]` (not running on every render) additionally means an unrelated re-render
with an unchanged tree never touches focus.

The trade-off is deliberate: a consumer that clones or normalises the tree instead
of echoing it by reference (the `onChange={setValue}` pattern used throughout does
echo by reference) simply gets no focus movement — graceful degradation, never a
misdirected focus.

### Address the DOM by encoded path, resolve against the new tree

Rows, group panels, and "Add rule" buttons stamp their path as a `data-*`
attribute (`data-rule-path`, `data-group-path`, `data-add-rule-path`), where a
path is encoded as its indices joined by `/` (root = empty string). The resolver
is a pure helper that:

- for an added rule/group, focuses the first native control inside the addressed
  row/panel;
- for a removal, reads the **new** tree to decide the target — the previous
  sibling if one survives, the node that slid into the removed slot otherwise, or
  the group's "Add rule" button when the group is now empty.

The resolver never steals focus: if the addressed element is absent (for
instance, a read-only consumer ignored `onChange`, so no new row rendered) it
leaves focus where it is rather than defaulting to the body.

### Keyboard interaction stays native

All controls are native `<button>` / `<input>` / `<select>` elements, so Tab,
Enter, and Space work without any `onKeyDown` interception, and the tab order
follows DOM order. No focus traps or custom key handlers are added — only the
post-edit focus *movement* is orchestrated.

## Consequences

- **Focus follows edits without internal state.** The controlled, positional
  model from ADR-007 is preserved intact — the intent ref is not tree state, and
  no node ids are introduced. Render isolation is untouched: the focus effect
  reads a ref and moves focus, it does not participate in the memoised render
  path.
- **The `data-*` path attributes are an internal addressing seam.** They let the
  resolver find a node by path via a CSS selector without threading refs through
  the recursive tree. They are not public API.
- **The path stamp lives on a `display:contents` wrapper, so every renderer gets
  focus management for free.** `FilterRule` wraps whatever it renders — the
  built-in editor *or* a consumer's `renderRule` — in one
  `<div class="contents" data-rule-path=…>`. `display:contents` keeps the wrapper
  out of layout (the row's own flex is untouched), so a custom renderer does not
  have to know about or stamp the attribute itself; add/remove focus works for it
  uniformly. `RenderRuleContext` still exposes `path` (an additive, non-breaking
  extension) for renderers that want to address their own controls.
- **Behaviour is bounded to consumers that honour `onChange`.** Focus movement
  depends on the edit committing. A consumer that drops `onChange` gets no focus
  movement, which is correct: nothing changed on screen to move focus to.
- **The resolver is pure and independently testable.** It takes `(root, intent,
  tree)` and touches only the DOM under `root`, so focus behaviour is covered by
  jsdom unit tests (activeElement assertions) and a browser-mode story, rather
  than depending on integration timing.
