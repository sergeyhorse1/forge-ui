import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

function TestTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="activity">Activity panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('exposes tablist and tab roles', () => {
    render(<TestTabs />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('shows the default panel and marks its tab selected', () => {
    render(<TestTabs />)
    expect(screen.getByText('Overview panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches panels on tab click', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByText('Activity panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
  })

  it('moves selection with arrow keys', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })
})
