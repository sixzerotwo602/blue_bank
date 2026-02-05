# Blue Banker Design System

## Overview

The Blue Banker design system provides a centralized token system and reusable UI components to ensure consistency across the application and streamline design-development collaboration.

## Architecture

```
frontend/src/design-system/
├── tokens/              # Design token definitions (JSON)
│   ├── colors.json      # Color palette
│   ├── spacing.json     # Spacing scale
│   ├── radius.json      # Border radius values
│   ├── shadows.json     # Shadow effects
│   └── typography.json  # Font sizes and weights
├── theme/               # Generated theme files (auto-generated)
│   ├── tokens.js        # CommonJS tokens
│   ├── tokens.d.ts      # TypeScript definitions
│   ├── tokens.css       # CSS custom properties
│   └── tailwind-tokens.js  # Tailwind-optimized tokens
└── foundations/         # Base component library
    ├── Button/
    ├── Input/
    ├── Card/
    └── index.ts         # Barrel export
```

## Design Tokens

### Colors

**Primary (Blue):**
- `primary-500`: #3b82f6 (lighter blue, hover states)
- `primary-600`: #2563eb (main blue, primary actions)

**Slate (Grayscale):**
- `slate-700`: #334155 (borders, secondary text)
- `slate-800`: #1e293b (card backgrounds)
- `slate-900`: #0f172a (darker backgrounds)
- `slate-950`: #020617 (darkest, page background)

**Semantic Colors:**
- `success`: #10b981 (green, positive feedback)
- `danger`: #dc2626 (red, errors, destructive actions)
- `warning`: #eab308 (yellow, warnings)

### Spacing

- `2`: 0.5rem (8px) - tight spacing
- `3`: 0.75rem (12px) - small gaps
- `4`: 1rem (16px) - standard spacing
- `6`: 1.5rem (24px) - medium spacing
- `8`: 2rem (32px) - large spacing

### Border Radius

- `lg`: 0.5rem (8px) - small corners
- `xl`: 0.75rem (12px) - standard corners
- `2xl`: 1rem (16px) - large corners
- `full`: 9999px - fully rounded (pills, circles)

### Shadows

- `lg`: 0 10px 15px -3px rgb(0 0 0 / 0.1) - standard elevation
- `xl`: 0 20px 25px -5px rgb(0 0 0 / 0.1) - higher elevation
- `blue`: 0 10px 30px -10px rgba(37, 99, 235, 0.2) - branded glow

### Typography

**Font Sizes:**
- `xs`: 0.75rem (12px)
- `sm`: 0.875rem (14px)
- `base`: 1rem (16px) - body text
- `lg`: 1.125rem (18px) - headings
- `xl`: 1.25rem (20px) - large headings

**Font Weights:**
- `medium`: 500 - body text
- `bold`: 700 - headings, emphasis

## Component Library

### Button

Flexible button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean
- All standard button HTML attributes

**Usage:**

```tsx
import { Button } from '@/design-system/foundations';

// Primary button
<Button onClick={handleClick}>
  Click Me
</Button>

// Secondary button (outlined)
<Button variant="secondary" size="lg">
  Cancel
</Button>

// Danger button (destructive actions)
<Button variant="danger" size="sm">
  Delete
</Button>
```

**Variants:**
- **Primary**: Blue background, white text (main CTAs)
- **Secondary**: Dark background with border, white text (secondary actions)
- **Danger**: Red background, white text (destructive actions)

### Input

Text input with label and error state support.

**Props:**
- `label`: string (optional label above input)
- `error`: string (error message below input)
- All standard input HTML attributes

**Usage:**

```tsx
import { Input } from '@/design-system/foundations';

// Basic input
<Input
  label="Username"
  placeholder="Enter your username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// Input with error
<Input
  label="Email"
  type="email"
  error="Invalid email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**States:**
- **Default**: Gray border
- **Focus**: Blue border (`border-primary-500`)
- **Error**: Red border (`border-danger`)

### Card

Container component for grouped content with optional gradient.

**Props:**
- `gradient`: boolean (adds gradient background)
- All standard div HTML attributes

**Usage:**

```tsx
import { Card } from '@/design-system/foundations';

// Basic card
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>

// Card with gradient
<Card gradient>
  <h2>Featured Content</h2>
  <p>Special card with gradient background</p>
</Card>
```

**Styling:**
- Base: Dark background (`slate-900`), border, rounded corners, shadow
- Gradient: Adds subtle gradient from `slate-900` to `slate-800`

## Figma Integration Workflow

### Setup

1. **Create Figma Design System File**
   - File name: "Blue Banker Design System"
   - Install: Tokens Studio for Figma plugin

2. **Define Tokens in Figma**
   - Use Tokens Studio plugin to create token sets
   - Match token names with code (e.g., `color.primary.600`)

3. **Export Tokens**
   - Tokens Studio → Export → JSON
   - Save as `tokens-figma.json` in `frontend/` directory

### Syncing Changes

**Design → Code Workflow:**

```bash
# 1. Designer updates tokens in Figma
# 2. Export from Tokens Studio plugin → tokens-figma.json
# 3. Run sync command
npm run tokens:sync

# This will:
# - Parse tokens-figma.json
# - Update src/design-system/tokens/*.json
# - Rebuild Tailwind theme
# - Generate type definitions

# 4. Restart dev server to see changes
npm run dev
```

**Automatic Sync (Future):**
- GitHub Actions workflow can be set up
- Figma webhook → Auto-create PR with token updates

### Token Naming Convention

Use dot notation matching the JSON structure:

```
color.primary.600 → { "color": { "primary": { "600": { "value": "#2563eb" } } } }
spacing.4 → { "spacing": { "4": { "value": "1rem" } } }
```

## Development Workflow

### Adding New Tokens

1. Edit the appropriate JSON file in `src/design-system/tokens/`
2. Run `npm run tokens:build`
3. Use in Tailwind classes or components

**Example:**

```json
// src/design-system/tokens/colors.json
{
  "color": {
    "accent": {
      "value": "#f59e0b"
    }
  }
}
```

```javascript
// tailwind.config.cjs - auto-updated
extend: {
  colors: {
    accent: tokens.colors.accent,
  }
}
```

### Using Tokens in Components

**Tailwind Classes:**
```tsx
// Use token-based classes
<div className="bg-primary-600 text-white p-4 rounded-xl">
  Content
</div>
```

**Custom Components:**
```tsx
// Import and use design system components
import { Button, Input, Card } from '@/design-system/foundations';
```

### Path Aliases

TypeScript and Vite are configured with path aliases:

```tsx
// Instead of: import { Button } from '../../../design-system/foundations';
import { Button } from '@/design-system/foundations';
import { useGame } from '@/hooks/useGame';
import { Dashboard } from '@/pages/Dashboard';
```

## Migration Guide

### Migrating Existing Components

**Before (hardcoded styles):**

```tsx
<button
  onClick={handleClick}
  className="w-full bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-500"
>
  Click Me
</button>
```

**After (design system):**

```tsx
import { Button } from '@/design-system/foundations';

<Button onClick={handleClick} size="lg" className="w-full">
  Click Me
</Button>
```

**Benefits:**
- Consistent styling across the app
- Type safety with TypeScript
- Easier to maintain and update
- Automatic design token updates

### Migration Priority

1. ✅ **Home page** (simplest, 82 lines) - DONE
2. **Lobby page** (97 lines) - Buttons and inputs
3. **Dashboard components** - Gradually replace buttons, cards
4. **Modal components** - Use Card and Button

## Testing

### Build Verification

```bash
# 1. Token build
npm run tokens:build
# Check: src/design-system/theme/ files created

# 2. TypeScript check
npx tsc --noEmit
# Should pass with no errors

# 3. Dev server
npm run dev
# Verify components render correctly

# 4. Production build
npm run build
# Check bundle size
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/design-system/foundations';

test('renders button with correct variant', () => {
  render(<Button variant="primary">Click</Button>);
  const button = screen.getByText('Click');
  expect(button).toHaveClass('bg-primary-600');
});
```

## Maintenance

### Updating Tokens

1. **From Code:** Edit JSON files in `src/design-system/tokens/`
2. **From Figma:** Export and run `npm run tokens:sync`
3. **Verify:** Check `src/design-system/theme/tokens.js`
4. **Test:** Restart dev server and verify UI

### Adding Components

1. Create component directory in `src/design-system/foundations/`
2. Add types, component, and index files
3. Export from `foundations/index.ts`
4. Document usage in this file

### Token Best Practices

- ✅ Use semantic token names (`primary`, `danger`, `success`)
- ✅ Group related tokens (all colors together)
- ✅ Document purpose in comments
- ❌ Avoid hardcoded values in components
- ❌ Don't bypass the token system

## Troubleshooting

### Tokens not updating

```bash
# Clear and rebuild
rm -rf src/design-system/theme/*
npm run tokens:build
npm run dev
```

### TypeScript errors

```bash
# Regenerate type definitions
npm run tokens:build
npx tsc --noEmit
```

### Tailwind classes not working

- Ensure `npm run tokens:build` ran before dev/build
- Check `tailwind.config.cjs` imports tokens correctly
- Verify token file paths are correct

## Resources

- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Tokens Studio for Figma](https://tokens.studio/)
- [Tailwind CSS Theme Configuration](https://tailwindcss.com/docs/theme)
- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)

## Future Enhancements

- [ ] Storybook integration for component documentation
- [ ] Dark/light theme support (currently dark only)
- [ ] More complex components (Modal, Dropdown, Toast)
- [ ] Automated visual regression testing
- [ ] CI/CD integration for token sync
- [ ] Component usage analytics
