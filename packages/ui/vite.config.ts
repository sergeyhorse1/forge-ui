import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), dts({ bundleTypes: true, tsconfigPath: './tsconfig.json' })],
  build: {
    lib: {
      // `index` carries the runtime surface (and imports the stylesheet);
      // `preset` is a standalone entry so consumers can pull tokens without the
      // rest of the bundle (exports map -> dist/preset.js).
      entry: {
        index: 'src/index.ts',
        preset: 'src/styles/preset.ts',
      },
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      // ADR-006: every peer dependency stays external. The regexes also cover
      // the unified radix-ui package and scoped subpath imports. Runtime
      // `dependencies` (clsx, tailwind-merge, class-variance-authority,
      // @tanstack/react-virtual) are externalised too: they are declared in
      // package.json so a consumer's installer pulls them in, and keeping them
      // out of the bundle avoids embedding hashed node_modules paths in the
      // published output while letting them dedupe across the app.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^radix-ui($|\/)/,
        'lucide-react',
        'date-fns',
        /^date-fns\//,
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        '@tanstack/react-virtual',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Emit the single pre-built stylesheet as dist/styles.css so the exports
        // map (`./styles.css`) resolves; other assets keep hashed names.
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((name) => name.endsWith('.css'))
            ? 'styles.css'
            : '[name]-[hash][extname]',
      },
    },
  },
})
