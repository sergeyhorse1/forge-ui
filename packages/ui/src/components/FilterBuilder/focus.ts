import { getNodeAt } from './tree'
import {
  isGroup,
  type FilterPath,
  type FilterSchema,
  type FilterTree,
} from './types'

/**
 * A deferred focus request recorded by an action and resolved after the tree
 * commits.
 *
 * The builder is fully controlled and holds no tree state, so an edit's DOM does
 * not exist yet when the action fires — the new/removed row only appears once the
 * consumer echoes the next `value` back. Focus therefore cannot move
 * synchronously; instead each mutating action records *what* should be focused
 * as a path-addressed intent, and a post-commit effect resolves it against the
 * freshly-rendered DOM. Keeping intent in a ref (not state) means recording one
 * does not itself trigger a render and does not reintroduce tree state.
 */
export type FocusIntent =
  | { kind: 'ruleFirstControl'; path: FilterPath }
  | { kind: 'groupFirstControl'; path: FilterPath }
  | { kind: 'afterRemove'; parentPath: FilterPath; index: number }

/**
 * Encode a {@link FilterPath} as a `data-*` attribute value. The root group is
 * the empty string; deeper nodes join their indices with `/`. This is the string
 * form the rows/groups stamp onto `data-rule-path` / `data-group-path` /
 * `data-add-rule-path` so a resolved intent can address a node by CSS selector.
 */
export function encodePath(path: FilterPath): string {
  return path.join('/')
}

/** Native controls in the order a keyboard user tabs into a row. */
const FOCUSABLE_SELECTOR = 'input, select, textarea, button:not([tabindex="-1"])'

/**
 * Resolve a recorded {@link FocusIntent} against the just-committed DOM, moving
 * focus to the first control of the affected row/group (or, after a removal, to
 * the surviving neighbour or the group's "Add rule" button). It reads the *new*
 * `tree` — not the pre-edit one — so an `afterRemove` intent knows whether the
 * parent still has children and what kind of node the neighbour is.
 *
 * Never steals focus: if the target element is absent (e.g. the consumer ignored
 * `onChange`, so no new row rendered) it leaves focus where it is rather than
 * defaulting it to `document.body`.
 */
export function focusIntent<S extends FilterSchema>(
  root: HTMLElement,
  intent: FocusIntent,
  tree: FilterTree<S>,
): void {
  if (intent.kind === 'ruleFirstControl') {
    focusFirstControlIn(root, ruleSelector(intent.path))
    return
  }
  if (intent.kind === 'groupFirstControl') {
    focusFirstControlIn(root, groupSelector(intent.path))
    return
  }
  focusAfterRemove(root, intent, tree)
}

function focusAfterRemove<S extends FilterSchema>(
  root: HTMLElement,
  intent: Extract<FocusIntent, { kind: 'afterRemove' }>,
  tree: FilterTree<S>,
): void {
  const { parentPath, index } = intent
  const parent = safeNodeAt(tree, parentPath)

  // The parent may no longer exist (e.g. it was the removed node's own parent
  // and got pruned by a cascading edit) — nothing sensible to focus.
  if (parent === undefined || !isGroup(parent)) return

  if (parent.rules.length === 0) {
    // The group is now empty: fall back to its "Add rule" button so keyboard
    // users are not dropped onto the document body. The button *is* the target
    // (the data attribute sits on it), so focus it directly.
    focusElement(root, addRuleSelector(parentPath))
    return
  }

  // Focus the previous sibling when one exists, otherwise the item that slid
  // into the removed slot (index 0).
  const targetIndex = index > 0 ? index - 1 : 0
  const neighbour = parent.rules[targetIndex]
  const neighbourPath: FilterPath = [...parentPath, targetIndex]
  const selector =
    neighbour !== undefined && isGroup(neighbour)
      ? groupSelector(neighbourPath)
      : ruleSelector(neighbourPath)
  focusFirstControlIn(root, selector)
}

/** Focus the first focusable control *inside* the element matched by selector. */
function focusFirstControlIn(root: HTMLElement, selector: string): void {
  const container = root.querySelector<HTMLElement>(selector)
  if (container === null) return
  const control = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
  if (control === null) return
  control.focus()
}

/** Focus the element matched by selector directly (it is itself focusable). */
function focusElement(root: HTMLElement, selector: string): void {
  const target = root.querySelector<HTMLElement>(selector)
  if (target === null) return
  target.focus()
}

/** Read a node without throwing on an out-of-range path (returns undefined). */
function safeNodeAt<S extends FilterSchema>(tree: FilterTree<S>, path: FilterPath) {
  try {
    return getNodeAt(tree, path)
  } catch {
    return undefined
  }
}

function ruleSelector(path: FilterPath): string {
  return `[data-rule-path="${encodePath(path)}"]`
}

function groupSelector(path: FilterPath): string {
  return `[data-group-path="${encodePath(path)}"]`
}

function addRuleSelector(path: FilterPath): string {
  return `[data-add-rule-path="${encodePath(path)}"]`
}
