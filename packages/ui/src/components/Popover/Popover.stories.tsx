import type { Meta, StoryObj } from '@storybook/react-vite'

import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from './Popover'

const meta = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  args: {
    children: null,
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <button>Open popover</button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Popover content here</p>
        <PopoverClose asChild>
          <button>Close</button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  ),
}

export const WithForm: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <button>Settings</button>
      </PopoverTrigger>
      <PopoverContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Name</label>
          <input type="text" placeholder="Enter name" />
          <PopoverClose asChild>
            <button>Save</button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
