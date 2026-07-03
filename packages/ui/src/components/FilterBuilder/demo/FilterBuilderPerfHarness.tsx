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
  // Повторов на замер serialize/deserialize.
  serializeRuns?: number
}

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

// Ручной измерительный стенд FilterBuilder: рендерит большое дерево и вешает на
// каждую строку счётчик рендеров по field (стабильный renderRule, пишущий в ref-map).
// «Measure isolation» снимает счётчики, программно правит одно листовое правило той
// же иммутабельной операцией, что и UI, и по диффу считает, сколько строк
// перерисовалось — доказательство, что правка локальна. «Measure serialize» меряет
// медианы serialize/deserialize по всему дереву. Оба отчёта также кладутся в
// window.__filterbuilderPerf для внешнего (Playwright) захвата, как в DataGrid PerfHarness.
export function FilterBuilderPerfHarness({
  initial,
  serializeRuns = 20,
}: PerfHarnessProps) {
  const [tree, setTree] = useState<FilterTree>(initial)
  const renderCounts = useRef(new Map<string, number>())
  const [isolation, setIsolation] = useState<IsolationReport | null>(null)
  const [serializeReport, setSerializeReport] = useState<SerializeReport | null>(null)

  // Стабилен между рендерами, чтобы memo effectiveRenderRule ([renderRule, fields])
  // не инвалидировался — иначе перерисовались бы все строки и замер isolation стал бы бессмысленным.
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

    // Правим ровно один лист той же иммутабельной операцией, что и actions, и
    // форсим синхронный коммит рендера, чтобы счётчики отразили его до чтения
    // (микротаск отработал бы раньше коммита React).
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
