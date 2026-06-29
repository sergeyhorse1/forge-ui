import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), dts({ bundleTypes: true, tsconfigPath: './tsconfig.json' })],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'] },
    sourcemap: true,
    rollupOptions: {
      // ADR-006: every peer dependency stays external. The regexes also cover
      // the unified radix-ui package and scoped subpath imports.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^radix-ui($|\/)/,
        'lucide-react',
        'date-fns',
        /^date-fns\//,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
})
