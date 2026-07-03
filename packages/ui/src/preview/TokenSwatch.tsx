import { cn } from '../utils/cn'

interface TokenSwatchProps {
  /** Human-readable token name shown under the color. */
  name: string
  /** Tailwind background utility backed by a design token, e.g. `bg-primary`. */
  swatchClassName: string
}

// Демо-строительный блок для галереи токенов; в публичный API не входит.
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
