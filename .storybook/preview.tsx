import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    // iPhone SE-sized portrait/landscape presets so orientation-dependent
    // layouts (Tailwind `portrait:` / `landscape:` variants) can be previewed
    // at the actual device size used for review.
    viewport: {
      options: {
        mobilePortrait: {
          name: 'Mobile Portrait (iPhone SE)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        mobileLandscape: {
          name: 'Mobile Landscape (iPhone SE)',
          styles: { width: '667px', height: '375px' },
          type: 'mobile',
        },
      },
    },
  },
};

export default preview;