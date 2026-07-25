import type { ReactNode } from 'react'

interface PreviewProps {
  children: ReactNode
}

// forge-preview держит reset компонентов в этом поддереве, иначе он сбросит типографику Starlight
export function Preview({ children }: PreviewProps) {
  return (
    <div className="forge-preview not-content border-border bg-background flex flex-wrap items-center gap-3 rounded-lg border p-6">
      {children}
    </div>
  )
}
