import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { darkSelector, darkTokens, lightTokens } from './preset'

// Литеральный new URL('./x', import.meta.url) Vite переписывает в адрес дев-сервера, поэтому путь собираем сами
const tokensPath = join(dirname(fileURLToPath(import.meta.url)), 'tokens.css')
const source = readFileSync(tokensPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

function scopeBody(opening: RegExp, label: string): string {
  const match = opening.exec(source)
  if (!match) {
    throw new Error(`${label} block not found in tokens.css`)
  }
  const open = source.indexOf('{', match.index)
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') {
      depth += 1
    } else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(open + 1, i)
      }
    }
  }
  throw new Error(`${label} block is not closed in tokens.css`)
}

function declarations(body: string, prefix: RegExp): Map<string, string> {
  const parsed = new Map<string, string>()
  for (const [, name = '', value = ''] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    if (prefix.test(name)) {
      parsed.set(name, value.trim().replace(/\s+/g, ' '))
    }
  }
  return parsed
}

function colors(body: string): Map<string, string> {
  const parsed = new Map<string, string>()
  for (const [name, value] of declarations(body, /^color-/)) {
    parsed.set(name.slice('color-'.length), value)
  }
  return parsed
}

function radii(body: string): Map<string, string> {
  const raw = declarations(body, /^radius(-|$)/)
  const base = raw.get('radius')
  const parsed = new Map<string, string>()
  for (const [name, value] of raw) {
    const key = name === 'radius' ? 'DEFAULT' : name.slice('radius-'.length)
    parsed.set(key, base ? value.replaceAll('var(--radius)', base) : value)
  }
  return parsed
}

function mismatches(scope: string, css: Map<string, string>, preset: Record<string, string>) {
  const keys = [...new Set([...css.keys(), ...Object.keys(preset)])].sort()
  return keys
    .filter((key) => css.get(key) !== preset[key])
    .map(
      (key) =>
        `${scope}.${key}: tokens.css has ${css.get(key) ?? '<missing>'}, preset has ${preset[key] ?? '<missing>'}`,
    )
}

const lightBody = scopeBody(/@theme\s*\{/, '@theme')
const darkBody = scopeBody(/^\[data-theme='dark'\]\s*\{/m, "[data-theme='dark']")

describe('preset', () => {
  it('mirrors every light color from the @theme scope', () => {
    expect(mismatches('light', colors(lightBody), lightTokens.colors)).toEqual([])
  })

  it('mirrors every dark color from the dark scope', () => {
    expect(mismatches('dark', colors(darkBody), darkTokens.colors)).toEqual([])
  })

  it('mirrors the radius scale from the @theme scope', () => {
    expect(mismatches('light', radii(lightBody), lightTokens.radius)).toEqual([])
  })

  it('keeps the light radius scale in dark, which redeclares no radii', () => {
    expect([...radii(darkBody).keys()]).toEqual([])
    expect(darkTokens.radius).toEqual(lightTokens.radius)
  })

  it('exports the selector that scopes the dark tokens', () => {
    expect(source).toContain(`${darkSelector} {`)
  })

  it('parses every color declaration in the file', () => {
    const declared = source.match(/--color-[\w-]+\s*:/g) ?? []
    expect(colors(lightBody).size + colors(darkBody).size).toBe(declared.length)
  })
})
