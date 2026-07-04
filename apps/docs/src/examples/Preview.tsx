import type { ReactNode } from 'react'

interface PreviewProps {
  children: ReactNode
}

/**
 * Scope wrapper for live component demos. The `forge-preview` class confines the
 * component reset to this subtree so it never touches the surrounding docs
 * typography (see src/styles/forge.css).
 */
export function Preview({ children }: PreviewProps) {
  return (
    <div className="forge-preview not-content border-border bg-background flex flex-wrap items-center gap-3 rounded-lg border p-6">
      {children}
    </div>
  )
}
