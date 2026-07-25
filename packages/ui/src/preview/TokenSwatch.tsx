import { cn } from '../utils/cn'

interface TokenSwatchProps {
  name: string
  swatchClassName: string
}

export function TokenSwatch({ name, swatchClassName }: TokenSwatchProps) {
  return (
    <figure className="flex flex-col gap-2">
      <div
        className={cn(
          'border-border h-16 w-full rounded-md border',
          swatchClassName,
        )}
      />
      <figcaption className="text-muted-foreground text-sm">{name}</figcaption>
    </figure>
  )
}
