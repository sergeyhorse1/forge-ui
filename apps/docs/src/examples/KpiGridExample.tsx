import { KpiGrid, MetricCard } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function KpiGridExample() {
  return (
    <Preview>
      <KpiGrid className="w-full" minColWidth={180}>
        <MetricCard title="Revenue" value="$48k" delta={12} />
        <MetricCard title="Sessions" value="9.2k" delta={-3} />
        <MetricCard title="Signups" value={318} delta={7} />
        <MetricCard title="Churn" value="1.8%" delta={0} />
      </KpiGrid>
    </Preview>
  )
}
