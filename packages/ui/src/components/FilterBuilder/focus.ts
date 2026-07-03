import { getNodeAt } from './tree'
import {
  isGroup,
  type FilterPath,
  type FilterSchema,
  type FilterTree,
} from './types'

// Отложенный запрос фокуса, записанный экшеном и разрешаемый после коммита дерева.
// Билдер полностью controlled и не держит состояние дерева, поэтому DOM правки ещё
// нет, когда экшен срабатывает — новая/удалённая строка появится, лишь когда
// консьюмер вернёт следующий value. Фокус не может двигаться синхронно: каждый
// мутирующий экшен пишет намерение (адресованное path), а пост-коммит эффект
// разрешает его против свежего DOM. Намерение в ref (не в state): запись не триггерит
// рендер и не возвращает состояние дерева.
export type FocusIntent =
  | { kind: 'ruleFirstControl'; path: FilterPath }
  | { kind: 'groupFirstControl'; path: FilterPath }
  | { kind: 'afterRemove'; parentPath: FilterPath; index: number }

// Кодирует FilterPath в значение data-*: корень — пустая строка, глубже индексы
// через «/». В этой форме строки/группы штампуют data-rule-path/data-group-path/
// data-add-rule-path, чтобы разрешённое намерение адресовало узел CSS-селектором.
export function encodePath(path: FilterPath): string {
  return path.join('/')
}

// Нативные контролы в порядке табуляции по строке.
const FOCUSABLE_SELECTOR = 'input, select, textarea, button:not([tabindex="-1"])'

// Разрешает записанное намерение против только что закоммиченного DOM: двигает
// фокус на первый контрол затронутой строки/группы (после удаления — на уцелевшего
// соседа или кнопку «Add rule» группы). Читает НОВОЕ дерево, поэтому afterRemove
// знает, остались ли у родителя дети и какого типа сосед. Фокус не крадёт: если
// целевого элемента нет (консьюмер проигнорировал onChange), оставляет фокус на
// месте, а не сбрасывает на document.body.
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

  // Родителя может уже не быть (напр. его самого срезала каскадная правка) —
  // фокусить нечего.
  if (parent === undefined || !isGroup(parent)) return

  if (parent.rules.length === 0) {
    // Группа опустела: откатываемся на её кнопку «Add rule», чтобы не уронить
    // клавиатурного юзера на document.body. Кнопка и есть цель (data-атрибут на
    // ней), фокусим напрямую.
    focusElement(root, addRuleSelector(parentPath))
    return
  }

  // Фокусим предыдущего сиблинга, если он есть, иначе — элемент, съехавший в
  // освободившийся слот (index 0).
  const targetIndex = index > 0 ? index - 1 : 0
  const neighbour = parent.rules[targetIndex]
  const neighbourPath: FilterPath = [...parentPath, targetIndex]
  const selector =
    neighbour !== undefined && isGroup(neighbour)
      ? groupSelector(neighbourPath)
      : ruleSelector(neighbourPath)
  focusFirstControlIn(root, selector)
}

function focusFirstControlIn(root: HTMLElement, selector: string): void {
  const container = root.querySelector<HTMLElement>(selector)
  if (container === null) return
  const control = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
  if (control === null) return
  control.focus()
}

function focusElement(root: HTMLElement, selector: string): void {
  const target = root.querySelector<HTMLElement>(selector)
  if (target === null) return
  target.focus()
}

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
