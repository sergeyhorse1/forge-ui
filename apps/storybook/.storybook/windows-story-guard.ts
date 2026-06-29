import type { Plugin } from 'vite'

/**
 * Workaround for a path-comparison issue in the Storybook Vitest addon.
 *
 * The addon wraps every generated story test in a guard:
 *
 *   convertToFilePath(import.meta.url).includes(
 *     globalThis.__vitest_worker__.filepath ?? expect.getState().testPath
 *   )
 *
 * `import.meta.url` yields a percent-encoded, forward-slashed URL path, while the
 * worker filepath is a decoded native path. On Windows — and on any host whose
 * project path contains spaces or non-ASCII characters — the two strings differ
 * by separator and/or encoding, so `String.includes` never matches and the test
 * is silently dropped ("No test suite found"). This mirrors the upstream Vitest
 * bug the addon itself flags (vitest-dev/vitest#6367).
 *
 * The plugin wraps both operands in a normaliser that decodes percent-escapes
 * and unifies separators before comparing. It runs after the addon transform and
 * is a no-op where the operands already match.
 *
 * Both rewrites are global: a single `.stories.tsx` file produces one guard block
 * per tested story, so missing later occurrences would silently drop every story
 * but the first. Remove this plugin once vitest-dev/vitest#6367 lands and the
 * addon compares normalised paths upstream.
 */
const GUARD_CALL = 'convertToFilePath(import.meta.url).includes('
const HELPER_NAME = '__forgeNormalizedPath'
const HELPER = `const ${HELPER_NAME} = (value) => { let v = String(value); try { v = decodeURIComponent(v); } catch {} return v.replaceAll("\\\\", "/"); };`

export function windowsStoryGuard(): Plugin {
  return {
    name: 'forge:windows-story-guard',
    enforce: 'post',
    transform(code) {
      // No-op if the upstream addon stops emitting this exact guard call.
      if (!code.includes(GUARD_CALL)) return null

      const guarded = code.replaceAll(
        GUARD_CALL,
        `${HELPER_NAME}(convertToFilePath(import.meta.url)).includes(${HELPER_NAME}(`,
      )

      // Close every wrapper opened around an operand, each ending at `.testPath`.
      const closed = guarded.replace(/\.testPath\);/g, '.testPath));')

      return `${HELPER}\n${closed}`
    },
  }
}
