import { MetricCard } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function MetricCardExample() {
  return (
    <Preview>
      <div className="w-full max-w-xs">
        <MetricCard
          title="Monthly revenue"
          value="$48.2k"
          delta={{ value: 12.5, label: 'vs last month' }}
          sparkline={[12, 18, 9, 22, 17, 28, 24, 31]}
        />
      </div>
    </Preview>
  )
}
