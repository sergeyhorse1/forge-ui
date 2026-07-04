import {
  Button,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function PopoverExample() {
  return (
    <Preview>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Edit label</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="popover-label">
                Label
              </label>
              <Input id="popover-label" defaultValue="Design review" aria-label="Label" />
            </div>
            <PopoverClose asChild>
              <Button size="sm">Save</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </Preview>
  )
}
