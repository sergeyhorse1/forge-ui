import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Pagination } from './Pagination'

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: { page: 1, pageCount: 10, onPageChange: () => {} },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

function Interactive({ pageCount = 10, initial = 1 }: { pageCount?: number; initial?: number }) {
  const [page, setPage] = useState(initial)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      <p style={{ fontSize: 12 }}>Page {page}</p>
    </div>
  )
}

export const Default: Story = {
  tags: ['test'],
  render: () => <Interactive pageCount={10} initial={5} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Go to page 5' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(canvas.getByRole('button', { name: 'Go to next page' }))
    await expect(canvas.getByText('Page 6')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Go to page 6' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

export const FirstPage: Story = {
  render: () => <Interactive pageCount={10} initial={1} />,
}

export const FewPages: Story = {
  render: () => <Interactive pageCount={3} initial={2} />,
}
