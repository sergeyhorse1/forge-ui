import { useEffect, useState, type RefObject } from 'react'

/** Display modes for the FilterBuilder. */
export type FilterMode = 'expanded' | 'compact' | 'auto'

/** The resolved mode after auto measurement collapses to a concrete value. */
export type ResolvedFilterMode = 'expanded' | 'compact'

/** Container width (px) at or below which `auto` resolves to `compact`. */
export const DEFAULT_COMPACT_BREAKPOINT = 480

/**
 * Resolve the effective display mode. Explicit `'compact'`/`'expanded'` force
 * that mode (deterministic for tests). `'auto'` measures the container via a
 * `ResizeObserver` and switches to compact at/below `breakpoint`.
 *
 * Auto is robust where `ResizeObserver` is absent (jsdom, SSR): it starts and
 * stays `expanded` rather than throwing, and forced modes never read the ref.
 * Mode/width here are *presentational* state — the controlled invariant only
 * forbids mirroring the **tree**, not measuring the layout.
 */
export function useFilterMode(
  mode: FilterMode,
  containerRef: RefObject<HTMLElement | null>,
  breakpoint: number = DEFAULT_COMPACT_BREAKPOINT,
): ResolvedFilterMode {
  const [autoMode, setAutoMode] = useState<ResolvedFilterMode>('expanded')

  useEffect(() => {
    if (mode !== 'auto') return
    const node = containerRef.current
    if (node === null || typeof ResizeObserver === 'undefined') return

    const apply = (width: number) => {
      setAutoMode(width <= breakpoint ? 'compact' : 'expanded')
    }
    apply(node.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) apply(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [mode, containerRef, breakpoint])

  if (mode === 'compact') return 'compact'
  if (mode === 'expanded') return 'expanded'
  return autoMode
}
