import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion'

// Accordion.Root — дискриминированный union (single|multiple), поэтому его пропсы
// схлопываются в never; типизируем meta аннотацией, а не satisfies, чтобы args был
// опциональным для render-only сторис.
const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Accordion>

export const Single: Story = {
  tags: ['test'],
  render: () => (
    <Accordion type="single" collapsible defaultValue="shipping">
      <AccordionItem value="shipping">
        <AccordionTrigger>How does shipping work?</AccordionTrigger>
        <AccordionContent>Orders ship within two business days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>What is the return policy?</AccordionTrigger>
        <AccordionContent>Returns are accepted within 30 days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByRole('button', { name: 'How does shipping work?' })
    await expect(first).toHaveAttribute('aria-expanded', 'true')

    const second = canvas.getByRole('button', { name: 'What is the return policy?' })
    await userEvent.click(second)
    await expect(second).toHaveAttribute('aria-expanded', 'true')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
  },
}

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a']}>
      <AccordionItem value="a">
        <AccordionTrigger>Section A</AccordionTrigger>
        <AccordionContent>Body A</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Section B</AccordionTrigger>
        <AccordionContent>Body B</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
