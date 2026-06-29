// Guards against a silent regression where the built Storybook ships without the
// component utility classes. Tailwind's content scan is anchored to the build
// root, so the library's component sources (a sibling package) must be added as
// an explicit `@source`; if that ever breaks, the emitted CSS quietly drops to a
// handful of decorator rules and every component renders unstyled — something the
// story snapshots and a11y checks do not catch.
//
// Run after `storybook build`. It reads the freshest emitted stylesheet and
// asserts both that load-bearing component classes are present and that the rule
// count is well above the bare-decorator baseline.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS_DIR = fileURLToPath(
  new URL('../storybook-static/assets', import.meta.url),
)

// Classes emitted only when the component package is scanned. `overflow-auto`
// also clips the virtualizer overscan, so its presence is doubly load-bearing.
const REQUIRED_CLASSES = [
  'overflow-auto',
  'bg-muted',
  'truncate',
  'border-border',
  'text-muted-foreground',
]

// A package-less build emits roughly six decorator rules; a healthy build emits
// well over forty. The threshold sits comfortably between the two.
const MIN_RULE_COUNT = 40

function fail(message) {
  console.error(`verify-styles: ${message}`)
  process.exit(1)
}

let cssFiles
try {
  cssFiles = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.css'))
} catch {
  fail(`assets directory not found at ${ASSETS_DIR}; run \`storybook build\` first`)
}

if (cssFiles.length === 0) fail('no CSS asset was emitted by the build')

// storybook-static is not cleaned between builds, so several hashed stylesheets
// may coexist. The most recently written one belongs to the current build.
const newest = cssFiles
  .map((name) => {
    const path = join(ASSETS_DIR, name)
    return { name, path, mtime: statSync(path).mtimeMs }
  })
  .sort((a, b) => b.mtime - a.mtime)[0]

const css = readFileSync(newest.path, 'utf8')

const missing = REQUIRED_CLASSES.filter(
  (className) => !css.includes(`.${className}`),
)
if (missing.length > 0) {
  fail(
    `component utilities missing from ${newest.name}: ${missing.join(', ')} — ` +
      'the Tailwind content scan is not reaching the component package',
  )
}

const ruleCount = (css.match(/\{/g) ?? []).length
if (ruleCount < MIN_RULE_COUNT) {
  fail(
    `only ${ruleCount} CSS rules in ${newest.name} (expected > ${MIN_RULE_COUNT}); ` +
      'the component package is likely not being scanned',
  )
}

console.log(
  `verify-styles: ok — ${ruleCount} rules, all required classes present in ${newest.name}`,
)
