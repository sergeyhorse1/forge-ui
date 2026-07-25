import { TokenSwatch } from './TokenSwatch'

const SWATCHES = [
  { name: 'Background', swatchClassName: 'bg-background' },
  { name: 'Foreground', swatchClassName: 'bg-foreground' },
  { name: 'Primary', swatchClassName: 'bg-primary' },
  { name: 'Secondary', swatchClassName: 'bg-secondary' },
  { name: 'Muted', swatchClassName: 'bg-muted' },
  { name: 'Accent', swatchClassName: 'bg-accent' },
  { name: 'Destructive', swatchClassName: 'bg-destructive' },
  { name: 'Success', swatchClassName: 'bg-success' },
  { name: 'Warning', swatchClassName: 'bg-warning' },
] as const

export function TokenGallery() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-semibold">Design tokens</h1>
      <p className="text-muted-foreground max-w-prose text-sm">
        Each swatch is a Tailwind utility backed by a semantic CSS variable.
        Toggle the theme in the toolbar to see the values respond.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SWATCHES.map((swatch) => (
          <TokenSwatch key={swatch.name} {...swatch} />
        ))}
      </div>
    </section>
  )
}
