import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion'

function TestAccordion() {
  return (
    <Accordion type="single" collapsible defaultValue="a">
      <AccordionItem value="a">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent>First body</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second body</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('renders triggers as buttons', () => {
    render(<TestAccordion />)
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument()
  })

  it('marks the open trigger with aria-expanded', () => {
    render(<TestAccordion />)
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens a section on click', async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByRole('button', { name: 'Second' }))
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses the open section when collapsible', async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    await user.click(screen.getByRole('button', { name: 'First' }))
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles a section with Enter from the keyboard', async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    const second = screen.getByRole('button', { name: 'Second' })
    second.focus()
    await user.keyboard('{Enter}')
    expect(second).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles a section with Space from the keyboard', async () => {
    const user = userEvent.setup()
    render(<TestAccordion />)
    const second = screen.getByRole('button', { name: 'Second' })
    second.focus()
    await user.keyboard(' ')
    expect(second).toHaveAttribute('aria-expanded', 'true')
  })
})
