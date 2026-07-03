import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tooltip } from './Tooltip'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: 'Tooltip text',
    children: <button>Hover me</button>,
  },
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sides: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, padding: 64 }}>
      <Tooltip {...args} content="Top" side="top"><button>Top</button></Tooltip>
      <Tooltip {...args} content="Right" side="right"><button>Right</button></Tooltip>
      <Tooltip {...args} content="Bottom" side="bottom"><button>Bottom</button></Tooltip>
      <Tooltip {...args} content="Left" side="left"><button>Left</button></Tooltip>
    </div>
  ),
}

export const NoArrow: Story = {
  args: {
    arrow: false,
    content: 'No arrow',
    children: <button>No arrow</button>,
  },
}

export const CustomDelay: Story = {
  args: {
    delayDuration: 1000,
    content: 'Slow tooltip',
    children: <button>1s delay</button>,
  },
}
