import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from './Sheet'

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  args: {
    children: null,
  },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Right: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <button>Open right</button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Make changes to your profile.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <button>Save</button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const Left: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <button>Open left</button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav>Menu items here</nav>
      </SheetContent>
    </Sheet>
  ),
}

export const Top: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <button>Open top</button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notification</SheetTitle>
          <SheetDescription>Something happened.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

export const Bottom: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <button>Open bottom</button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
        </SheetHeader>
        <p>Bottom sheet content</p>
      </SheetContent>
    </Sheet>
  ),
}
