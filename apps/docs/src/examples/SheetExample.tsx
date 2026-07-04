import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function SheetExample() {
  return (
    <Preview>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open panel</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile and save when done.</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button>Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Preview>
  )
}
