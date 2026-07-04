import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function CardExample() {
  return (
    <Preview>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Deploy project</CardTitle>
          <CardDescription>Push your latest changes to production.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The build completed in 42 seconds with no warnings.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Deploy</Button>
        </CardFooter>
      </Card>
    </Preview>
  )
}
