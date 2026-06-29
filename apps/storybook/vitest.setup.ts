import { setProjectAnnotations } from '@storybook/react-vite'

import previewAnnotations from './.storybook/preview'

// Applies the preview-level decorators, globals and parameters (theme toolbar,
// a11y test mode) to every story rendered inside the browser-mode test runner,
// so tests exercise stories exactly as Storybook does.
setProjectAnnotations([previewAnnotations])
