import { setProjectAnnotations } from '@storybook/react-vite'

import previewAnnotations from './.storybook/preview'

// Без этого браузерный раннер прогонит стори без декораторов и параметров превью
setProjectAnnotations([previewAnnotations])
