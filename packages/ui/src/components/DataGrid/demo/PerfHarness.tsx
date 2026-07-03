import { useCallback, useRef, useState, type ReactNode } from 'react'

interface FrameReport {
  frames: number
  p50: number
  p95: number
  max: number
  droppedOver32: number
  estimatedFps: number
}

interface PerfHarnessProps {
  // Селектор скролл-вьюпорта для авто-скролла.
  scrollSelector?: string
  durationMs?: number
  children: ReactNode
}

function summarise(deltas: number[]): FrameReport {
  const sorted = [...deltas].sort((a, b) => a - b)
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0
  const total = deltas.reduce((sum, d) => sum + d, 0)
  return {
    frames: deltas.length,
    p50: Number(at(0.5).toFixed(2)),
    p95: Number(at(0.95).toFixed(2)),
    max: Number(Math.max(0, ...deltas).toFixed(2)),
    droppedOver32: deltas.filter((d) => d > 32).length,
    estimatedFps: total > 0 ? Number(((deltas.length / total) * 1000).toFixed(1)) : 0,
  }
}

// Оборачивает сетку логгером времени кадра: «Measure scroll» программно скроллит
// вьюпорт durationMs, семплируя дельты requestAnimationFrame, и выдаёт
// p50/p95/max/dropped — сырьё для таблицы perf-бюджета. Отчёт также кладётся в
// window для автоматического захвата.
export function PerfHarness({
  scrollSelector = '[data-perf-scroll] .overflow-auto',
  durationMs = 3000,
  children,
}: PerfHarnessProps) {
  const [report, setReport] = useState<FrameReport | null>(null)
  const [running, setRunning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const run = useCallback(() => {
    const root = containerRef.current
    const scroller = root?.querySelector<HTMLElement>(scrollSelector)
    if (!scroller) return

    setRunning(true)
    const deltas: number[] = []
    let last = performance.now()
    const start = last
    let direction = 1

    const step = (now: number) => {
      deltas.push(now - last)
      last = now

      const max = scroller.scrollHeight - scroller.clientHeight
      let next = scroller.scrollTop + direction * 80
      if (next >= max) {
        next = max
        direction = -1
      } else if (next <= 0) {
        next = 0
        direction = 1
      }
      scroller.scrollTop = next

      if (now - start < durationMs) {
        requestAnimationFrame(step)
      } else {
        const summary = summarise(deltas.slice(1))
        setReport(summary)
        setRunning(false)
        // Кладём отчёт в window для внешнего (Playwright) захвата; двойной каст
        // добавляет ad-hoc поле, не засоряя глобальный тип.
        ;(window as unknown as Record<string, unknown>).__datagridPerf = summary
      }
    }

    requestAnimationFrame(step)
  }, [scrollSelector, durationMs])

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {running ? 'Measuring…' : 'Measure scroll'}
        </button>
        {report ? (
          <output className="font-mono text-xs text-muted-foreground">
            frames={report.frames} · p50={report.p50}ms · p95={report.p95}ms ·
            max={report.max}ms · &gt;32ms={report.droppedOver32} · ~
            {report.estimatedFps}fps
          </output>
        ) : (
          <span className="text-xs text-muted-foreground">
            Press to log requestAnimationFrame deltas over {durationMs / 1000}s.
          </span>
        )}
      </div>
      <div data-perf-scroll>{children}</div>
    </div>
  )
}
