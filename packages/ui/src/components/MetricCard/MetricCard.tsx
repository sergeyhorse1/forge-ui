import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../../utils/cn'
import { Card } from '../Card'

const metricCardVariants = cva('flex flex-col gap-2 p-6')
const metricTitleVariants = cva('text-sm font-medium text-muted-foreground')
const metricValueVariants = cva(
  'text-3xl font-semibold leading-none tracking-tight text-card-foreground',
)
const metricDeltaVariants = cva('inline-flex items-center gap-1 text-sm font-medium', {
  variants: {
    trend: {
      up: 'text-success',
      down: 'text-destructive',
      flat: 'text-muted-foreground',
    },
  },
  defaultVariants: { trend: 'flat' },
})

/** Delta shown next to a metric: a bare number or a number with a label. */
export type MetricDelta = number | { value: number; label?: string }

export interface MetricCardProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Metric caption. */
  title: React.ReactNode
  /** Primary metric value. */
  value: React.ReactNode
  /** Signed change; drives the trend arrow and colour. */
  delta?: MetricDelta
  /** Numbers for the inline sparkline. Decorative by default. */
  sparkline?: number[]
  /** Accessible label for the sparkline; when set it becomes meaningful (role="img"). */
  sparklineLabel?: string
}

type Trend = 'up' | 'down' | 'flat'

function trendOf(value: number): Trend {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

function DeltaBadge({ delta }: { delta: MetricDelta }) {
  const value = typeof delta === 'number' ? delta : delta.value
  const label = typeof delta === 'number' ? undefined : delta.label
  const trend = trendOf(value)
  return (
    <span className={cn(metricDeltaVariants({ trend }))}>
      <TrendArrow trend={trend} />
      <span>{Math.abs(value)}</span>
      {label ? <span className="text-muted-foreground">{label}</span> : null}
    </span>
  )
}

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === 'flat') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  // up: стрелка вверх-вправо, down зеркалит по вертикали через scale.
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={trend === 'down' ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path
        d="M3.5 9.5L7.5 5.5L10.5 8.5M10.5 5V8.5H7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sparkline({ data, label }: { data: number[]; label?: string }) {
  if (data.length === 0) return null
  const width = 100
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  // Guard: плоский ряд (min==max) не должен делить на ноль — рисуем по центру.
  const range = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const points = data
    .map((value, index) => {
      const x = index * stepX
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className="h-8 w-full text-primary"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Dashboard KPI tile: title, value, signed delta and an optional sparkline. */
export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  function MetricCard(
    { className, title, value, delta, sparkline, sparklineLabel, ...props },
    ref,
  ) {
    return (
      <Card ref={ref} className={cn(metricCardVariants(), className)} {...props}>
        <span className={cn(metricTitleVariants())}>{title}</span>
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn(metricValueVariants())}>{value}</span>
          {delta !== undefined ? <DeltaBadge delta={delta} /> : null}
        </div>
        {sparkline ? <Sparkline data={sparkline} label={sparklineLabel} /> : null}
      </Card>
    )
  },
)

export { metricCardVariants, metricDeltaVariants }
