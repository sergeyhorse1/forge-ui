/**
 * Tailwind preset for consumers who compile Forge alongside their own Tailwind
 * setup (ADR-005, path "a"). Tailwind v4 is CSS-first, so the canonical way to
 * inherit the design tokens is to import the token CSS:
 *
 * ```css
 * @import 'tailwindcss';
 * @import '@sergeyhorse/forge/styles.css';
 * ```
 *
 * This module additionally exposes the same tokens as a typed object so they can
 * be consumed programmatically — for example to keep an Astro/MDX docs site or a
 * design-token pipeline in sync with the library without re-declaring values.
 *
 * The values mirror `globals.css`; that file remains the single source of truth
 * for the pre-built `styles.css`.
 */

export interface ForgeThemeTokens {
  colors: Record<string, string>
  radius: Record<string, string>
}

/** Light-theme token values (the default `@theme` scope). */
export const lightTokens: ForgeThemeTokens = {
  colors: {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.22 0.01 286)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.22 0.01 286)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.22 0.01 286)',
    primary: 'oklch(0.55 0.21 263)',
    'primary-foreground': 'oklch(0.98 0.01 263)',
    secondary: 'oklch(0.96 0.01 286)',
    'secondary-foreground': 'oklch(0.3 0.01 286)',
    accent: 'oklch(0.96 0.01 286)',
    'accent-foreground': 'oklch(0.3 0.01 286)',
    muted: 'oklch(0.97 0.01 286)',
    'muted-foreground': 'oklch(0.55 0.01 286)',
    destructive: 'oklch(0.58 0.22 27)',
    'destructive-foreground': 'oklch(0.98 0.01 27)',
    success: 'oklch(0.6 0.16 150)',
    'success-foreground': 'oklch(0.98 0.02 150)',
    warning: 'oklch(0.75 0.16 75)',
    'warning-foreground': 'oklch(0.27 0.04 75)',
    border: 'oklch(0.92 0.01 286)',
    input: 'oklch(0.92 0.01 286)',
    ring: 'oklch(0.55 0.21 263)',
  },
  radius: {
    DEFAULT: '0.5rem',
    sm: 'calc(0.5rem - 0.25rem)',
    md: '0.5rem',
    lg: 'calc(0.5rem + 0.25rem)',
    xl: 'calc(0.5rem + 0.5rem)',
  },
}

/** Dark-theme token values, applied under `[data-theme='dark']`. */
export const darkTokens: ForgeThemeTokens = {
  colors: {
    background: 'oklch(0.18 0.01 286)',
    foreground: 'oklch(0.96 0.01 286)',
    card: 'oklch(0.21 0.01 286)',
    'card-foreground': 'oklch(0.96 0.01 286)',
    popover: 'oklch(0.21 0.01 286)',
    'popover-foreground': 'oklch(0.96 0.01 286)',
    primary: 'oklch(0.65 0.19 263)',
    'primary-foreground': 'oklch(0.18 0.02 263)',
    secondary: 'oklch(0.27 0.01 286)',
    'secondary-foreground': 'oklch(0.96 0.01 286)',
    accent: 'oklch(0.27 0.01 286)',
    'accent-foreground': 'oklch(0.96 0.01 286)',
    muted: 'oklch(0.27 0.01 286)',
    'muted-foreground': 'oklch(0.7 0.01 286)',
    destructive: 'oklch(0.55 0.22 27)',
    'destructive-foreground': 'oklch(0.98 0.01 27)',
    success: 'oklch(0.68 0.15 150)',
    'success-foreground': 'oklch(0.18 0.02 150)',
    warning: 'oklch(0.8 0.15 75)',
    'warning-foreground': 'oklch(0.27 0.04 75)',
    border: 'oklch(0.3 0.01 286)',
    input: 'oklch(0.32 0.01 286)',
    ring: 'oklch(0.65 0.19 263)',
  },
  radius: lightTokens.radius,
}

/** Attribute selector that activates the dark token scope. */
export const darkSelector = "[data-theme='dark']" as const

/** Default export: both theme scopes plus the dark-mode selector. */
export const preset = {
  light: lightTokens,
  dark: darkTokens,
  darkSelector,
} as const

export type ForgePreset = typeof preset

export default preset
