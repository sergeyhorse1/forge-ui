import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function ToolbarExample() {
  return (
    <Preview>
      <Toolbar aria-label="Text formatting">
        <ToolbarToggleGroup type="multiple" aria-label="Text style" defaultValue={['bold']}>
          <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
          <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
          <ToolbarToggleItem value="underline">Underline</ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton>Share</ToolbarButton>
        <ToolbarLink href="#docs">Docs</ToolbarLink>
      </Toolbar>
    </Preview>
  )
}
