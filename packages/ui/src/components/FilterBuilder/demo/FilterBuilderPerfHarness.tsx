import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { FilterBuilder } from '../FilterBuilder'
import type { RenderRuleContext } from '../FilterRule'
import { deserialize, serialize } from '../serialization'
import {
  isGroup,
  isRule,
  type FilterNode,
  type FilterPath,
  type FilterSchema,
  type FilterTree,
} from '../types'
import { getNodeAt, updateRule } from '../tree'

interface IsolationReport {
  editedField: string
  rerenderedRows: number
  totalRows: number
}

interface SerializeReport {
  rules: number
  serializeMedianMs: number
  deserializeMedianMs: number
  runs: number
}

interface PerfHarnessProps {
  initial: FilterTree
  /** Repetitions per serialize/deserialize measurement. */
  serializeRuns?: number
}

/** Address of the first leaf rule in the tree (depth-first). */
function firstRulePath(node: FilterNode, path: FilterPath = []): FilterPath | null {
  if (!isGroup(node)) return path
  for (let index = 0; index < node.rules.length; index += 1) {
    const found = firstRulePath(node.rules[index]!, [...path, index])
    if (found) return found
  }
  return null
}

function medianMs(run: () => void, runs: number): number {
  for (let i = 0; i < 5; i += 1) run()
  const samples: number[] = []
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now()
    run()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  return Number((samples[Math.floor(samples.length / 2)] ?? 0).toFixed(4))
}

const perfWindow = (): Record<string, unknown> =>
  window as unknown as Record<string, unknown>

/**
 * Manual measurement harness for the FilterBuilder. It renders a large tree and
 * instruments each rule row with a per-`field` render counter (a stable
 * `renderRule` writing into a ref map). Two buttons drive the two budgets:
 *
 * - **Measure isolation** snapshots the counters, programmatically edits a single
 *   leaf rule through the same immutable tree op the UI uses, then reports how
 *   many rule rows re-rendered by diffing against that snapshot — the render-count
 *   proof that an edit stays local.
 * - **Measure serialize** times `serialize`/`deserialize` over the whole tree and
 *   reports the medians.
 *
 * Both reports are also written to `window.__filterbuilderPerf` for an external
 * (Playwright) capture run, mirroring the DataGrid `PerfHarness`.
 */
export function FilterBuilderPerfHarness({
  initial,
  serializeRuns = 20,
}: PerfHarnessProps) {
  const [tree, setTree] = useState<FilterTree>(initial)
  const renderCounts = useRef(new Map<string, number>())
  const [isolation, setIsolation] = useState<IsolationReport | null>(null)
  const [serializeReport, setSerializeReport] = useState<SerializeReport | null>(null)

  // Stable across renders so `FilterBuilder`'s `effectiveRenderRule` memo (keyed
  // on `[renderRule, fields]`) is not invalidated — otherwise every row would
  // re-render and the isolation measurement would be meaningless.
  const renderRule = useCallback((ctx: RenderRuleContext<FilterSchema>) => {
    const field = ctx.rule.field
    const counts = renderCounts.current
    counts.set(field, (counts.get(field) ?? 0) + 1)
    return (
      <input
        aria-label={field}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
        value={String(ctx.rule.value ?? '')}
        onChange={(event) => ctx.update({ value: event.target.value })}
      />
    )
  }, [])

  const measureIsolation = useCallback(() => {
    const path = firstRulePath(tree)
    if (!path || path.length === 0) return

    const target = getNodeAt(tree, path)
    const editedField = isRule(target) ? target.field : '(none)'
    const counts = renderCounts.current
    const before = new Map(counts)

    // Edit exactly one leaf through the same immutable op the actions use, and
    // force the re-render to commit synchronously so the counts reflect it before
    // we read them (a microtask would run before React's commit).
    flushSync(() => {
      setTree((current) => updateRule(current, path, { value: `edited-${Date.now()}` }))
    })

    let rerenderedRows = 0
    for (const [field, count] of counts) {
      if (count !== before.get(field)) rerenderedRows += 1
    }
    const report: IsolationReport = {
      editedField,
      rerenderedRows,
      totalRows: counts.size,
    }
    setIsolation(report)
    perfWindow().__filterbuilderPerf = {
      ...(perfWindow().__filterbuilderPerf as object | undefined),
      isolation: report,
    }
  }, [tree])

  const measureSerialize = useCallback(() => {
    const wire = serialize(tree)
    const rules = countRules(tree)
    const report: SerializeReport = {
      rules,
      serializeMedianMs: medianMs(() => {
        serialize(tree)
      }, serializeRuns),
      deserializeMedianMs: medianMs(() => {
        deserialize(wire)
      }, serializeRuns),
      runs: serializeRuns,
    }
    setSerializeReport(report)
    perfWindow().__filterbuilderPerf = {
      ...(perfWindow().__filterbuilderPerf as object | undefined),
      serialize: report,
    }
  }, [tree, serializeRuns])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={measureIsolation}
          className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium"
        >
          Measure isolation
        </button>
        <button
          type="button"
          onClick={measureSerialize}
          className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium"
        >
          Measure serialize
        </button>
        <output className="font-mono text-xs text-muted-foreground">
          {isolation
            ? `edit "${isolation.editedField}" → re-rendered ${isolation.rerenderedRows}/${isolation.totalRows} rows`
            : `rows=${renderCounts.current.size} · press to measure`}
          {serializeReport
            ? ` · serialize=${serializeReport.serializeMedianMs}ms · deserialize=${serializeReport.deserializeMedianMs}ms (${serializeReport.rules} rules)`
            : ''}
        </output>
      </div>
      <div className="max-h-[520px] overflow-auto">
        <FilterBuilder value={tree} onChange={setTree} renderRule={renderRule} />
      </div>
    </div>
  )
}

function countRules(node: FilterNode): number {
  if (!isGroup(node)) return 1
  return node.rules.reduce((sum, child) => sum + countRules(child), 0)
}
