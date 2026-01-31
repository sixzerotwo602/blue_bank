import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

// Register Tokens Studio transforms
register(StyleDictionary);

export default {
  source: ['src/design-system/tokens/**/*.json'],
  platforms: {
    // Tailwind CSS theme extension
    js: {
      transformGroup: 'tokens-studio',
      buildPath: 'src/design-system/theme/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/module'
        }
      ]
    },
    // TypeScript type definitions
    ts: {
      transformGroup: 'tokens-studio',
      buildPath: 'src/design-system/theme/',
      files: [
        {
          destination: 'tokens.d.ts',
          format: 'typescript/module-declarations'
        }
      ]
    },
    // CSS custom properties (optional)
    css: {
      transformGroup: 'css',
      buildPath: 'src/design-system/theme/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables'
        }
      ]
    }
  }
};
