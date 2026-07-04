import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pagination, getPaginationRange } from './Pagination'

describe('getPaginationRange', () => {
  it('lists every page when the count is small', () => {
    expect(getPaginationRange(1, 1)).toEqual([1])
    expect(getPaginationRange(3, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('collapses the right side near the start', () => {
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-right', 10])
    expect(getPaginationRange(2, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-right', 10])
  })

  it('collapses the left side near the end', () => {
    expect(getPaginationRange(10, 10)).toEqual([1, 'ellipsis-left', 6, 7, 8, 9, 10])
    expect(getPaginationRange(9, 10)).toEqual([1, 'ellipsis-left', 6, 7, 8, 9, 10])
  })

  it('collapses both sides in the middle', () => {
    expect(getPaginationRange(5, 10)).toEqual([
      1,
      'ellipsis-left',
      4,
      5,
      6,
      'ellipsis-right',
      10,
    ])
  })

  it('honours a wider siblingCount', () => {
    expect(getPaginationRange(5, 20, 2)).toEqual([
      1,
      'ellipsis-left',
      3,
      4,
      5,
      6,
      7,
      'ellipsis-right',
      20,
    ])
  })
})

describe('Pagination', () => {
  it('marks the current page with aria-current', () => {
    render(<Pagination page={3} pageCount={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(<Pagination page={1} pageCount={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeEnabled()

    rerender(<Pagination page={10} pageCount={10} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
  })

  it('calls onPageChange with the chosen page', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Go to page 4' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('steps with prev and next', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
    await user.click(screen.getByRole('button', { name: 'Go to previous page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('exposes a labelled navigation landmark', () => {
    render(<Pagination page={1} pageCount={3} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
  })
})
