# Design System Implementation

## Quick Start

### For Developers

```bash
# 1. Build design tokens
npm run tokens:build

# 2. Start dev server (auto-builds tokens)
npm run dev

# 3. Use components in your code
import { Button, Input, Card } from '@/design-system/foundations';
```

### For Designers

1. Open Figma → Install "Tokens Studio for Figma" plugin
2. Create tokens matching the structure in `tokens-figma.json.example`
3. Export tokens to `tokens-figma.json`
4. Run `npm run tokens:sync` to sync to code

## What Was Implemented

### ✅ Design Token System

**Location:** `frontend/src/design-system/tokens/`

- **colors.json** - Primary, slate shades, semantic colors
- **spacing.json** - Spacing scale (2, 3, 4, 6, 8)
- **radius.json** - Border radius values
- **shadows.json** - Shadow effects
- **typography.json** - Font sizes and weights

**How it works:**
1. Tokens defined in JSON files
2. Style Dictionary transforms to multiple formats
3. Tailwind config imports and uses tokens
4. All hardcoded values replaced with token references

### ✅ Component Library

**Location:** `frontend/src/design-system/foundations/`

**Components:**
- **Button** - 3 variants (primary, secondary, danger), 3 sizes
- **Input** - With label and error state support
- **Card** - Container with optional gradient

**Features:**
- Full TypeScript type safety
- Consistent styling via design tokens
- Composable and reusable
- Path alias support (`@/design-system/foundations`)

### ✅ Figma Integration

**Sync Script:** `frontend/scripts/sync-tokens.cjs`

**Workflow:**
1. Designer exports tokens from Figma Tokens Studio plugin
2. Save as `tokens-figma.json` in frontend directory
3. Run `npm run tokens:sync`
4. Tokens automatically update in code

### ✅ Tailwind Integration

**Config:** `frontend/tailwind.config.cjs`

Tailwind now uses design tokens for:
- Colors (primary, slate, success, danger, warning)
- Spacing
- Border radius
- Shadows
- Typography

### ✅ Build Automation

**Scripts added to package.json:**
- `tokens:build` - Build tokens from JSON to JS/TS/CSS
- `tokens:sync` - Sync from Figma and build
- `dev` - Auto-builds tokens before starting dev server
- `build` - Auto-builds tokens before production build

### ✅ Path Aliases

**Configured in:** `tsconfig.app.json` and `vite.config.ts`

```tsx
// Before
import { Button } from '../../../design-system/foundations/Button';

// After
import { Button } from '@/design-system/foundations';
```

### ✅ Documentation

- **doc/design-system.md** - Complete design system documentation
- **frontend/DESIGN_SYSTEM.md** - This file, implementation guide
- **tokens-figma.json.example** - Example Figma tokens structure

### ✅ Migration Example

**Home page** (`src/pages/Home.tsx`) migrated to use:
- Button component instead of hardcoded buttons
- Input component instead of hardcoded inputs
- Design tokens for consistent styling

## File Structure

```
frontend/
├── src/design-system/
│   ├── tokens/                    # Source of truth
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   ├── radius.json
│   │   ├── shadows.json
│   │   └── typography.json
│   ├── theme/                     # Auto-generated (in .gitignore)
│   │   ├── tokens.js              # CommonJS format
│   │   ├── tokens.d.ts            # TypeScript types
│   │   ├── tokens.css             # CSS variables
│   │   └── tailwind-tokens.js     # Tailwind helper
│   └── foundations/               # Component library
│       ├── Button/
│       │   ├── Button.tsx
│       │   ├── Button.types.ts
│       │   └── index.ts
│       ├── Input/
│       ├── Card/
│       └── index.ts
├── scripts/
│   └── sync-tokens.cjs            # Figma sync script
├── style-dictionary.config.js     # Token build config
├── tailwind.config.cjs            # Tailwind (uses tokens)
├── tokens-figma.json.example      # Example Figma export
└── DESIGN_SYSTEM.md               # This file

doc/
└── design-system.md               # Full documentation
```

## Scripts

### `npm run tokens:build`
Builds design tokens from JSON to JS/TS/CSS formats.

**When to use:**
- After editing token JSON files
- Automatically runs before `dev` and `build`

**Output:**
- `src/design-system/theme/tokens.js`
- `src/design-system/theme/tokens.d.ts`
- `src/design-system/theme/tokens.css`

### `npm run tokens:sync`
Syncs tokens from Figma and rebuilds.

**Prerequisites:**
- `tokens-figma.json` file exported from Figma

**Steps:**
1. Parses `tokens-figma.json`
2. Transforms to Style Dictionary format
3. Updates `src/design-system/tokens/*.json`
4. Runs `tokens:build`

**If no Figma file:** Skips sync, continues to build

## Usage Examples

### Using Button Component

```tsx
import { Button } from '@/design-system/foundations';

// Primary button (blue)
<Button onClick={handleSave}>
  Save
</Button>

// Secondary button (dark with border)
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// Danger button (red)
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>

// With custom classes
<Button className="w-full">
  Full Width
</Button>
```

### Using Input Component

```tsx
import { Input } from '@/design-system/foundations';

// Basic input
<Input
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With label
<Input
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With error state
<Input
  label="Password"
  type="password"
  error={passwordError}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

### Using Card Component

```tsx
import { Card } from '@/design-system/foundations';

// Basic card
<Card>
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>

// Card with gradient
<Card gradient>
  <h2>Featured</h2>
  <p>Special content</p>
</Card>
```

### Using Design Tokens Directly

```tsx
// In Tailwind classes
<div className="bg-primary-600 text-white p-4 rounded-xl shadow-lg">
  Content
</div>

// Tokens available:
// - Colors: primary-500/600, slate-700/800/900/950, success, danger, warning
// - Spacing: p-2/3/4/6/8, m-2/3/4/6/8, gap-2/3/4/6/8
// - Radius: rounded-lg/xl/2xl/full
// - Shadows: shadow-lg/xl
```

## Figma Setup Guide

### Step 1: Install Plugin

1. Open Figma
2. Menu → Plugins → Browse plugins in Community
3. Search "Tokens Studio for Figma"
4. Install plugin

### Step 2: Create Token Set

1. Open your Figma file
2. Plugins → Tokens Studio
3. Create new token set: "blue-banker-tokens"

### Step 3: Define Tokens

**Colors:**
```
color/primary/500 = #3b82f6
color/primary/600 = #2563eb
color/slate/700 = #334155
color/slate/800 = #1e293b
color/slate/900 = #0f172a
color/slate/950 = #020617
color/success = #10b981
color/danger = #dc2626
color/warning = #eab308
```

**Spacing (in px):**
```
spacing/2 = 8
spacing/3 = 12
spacing/4 = 16
spacing/6 = 24
spacing/8 = 32
```

**Radius (in px):**
```
radius/lg = 8
radius/xl = 12
radius/2xl = 16
radius/full = 9999
```

**Shadows:**
```
shadow/lg = 0 10px 15px -3px rgba(0, 0, 0, 0.1)
shadow/xl = 0 20px 25px -5px rgba(0, 0, 0, 0.1)
shadow/blue = 0 10px 30px -10px rgba(37, 99, 235, 0.2)
```

**Typography:**
```
font/size/xs = 12
font/size/sm = 14
font/size/base = 16
font/size/lg = 18
font/size/xl = 20
font/weight/medium = 500
font/weight/bold = 700
```

### Step 4: Export Tokens

1. Tokens Studio → Settings (⚙️)
2. Export → JSON
3. Save as `tokens-figma.json` in `frontend/` directory
4. Run `npm run tokens:sync`

### Step 5: Apply to Components

1. Create Figma components (Button, Input, Card)
2. Use token references (not hardcoded values)
3. Example: Button fill = `{color.primary.600}`
4. Changes to tokens automatically update components

## Testing

### Verify Token Build

```bash
npm run tokens:build

# Check output
ls -la src/design-system/theme/
# Should show: tokens.js, tokens.d.ts, tokens.css
```

### Verify TypeScript

```bash
npx tsc --noEmit
# Should pass with no errors
```

### Verify Components Render

```bash
npm run dev
# Open browser, check Home page
# Buttons and inputs should use design system components
```

### Verify Tailwind Integration

```bash
# Inspect element in browser
# Check if classes like bg-primary-600 apply correct colors
```

## Migration Guide

### Migrating a Button

**Before:**
```tsx
<button
  onClick={handleClick}
  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold"
>
  Click Me
</button>
```

**After:**
```tsx
import { Button } from '@/design-system/foundations';

<Button onClick={handleClick} size="md">
  Click Me
</Button>
```

### Migrating an Input

**Before:**
```tsx
<input
  type="text"
  placeholder="Enter value"
  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500"
  value={value}
  onChange={handleChange}
/>
```

**After:**
```tsx
import { Input } from '@/design-system/foundations';

<Input
  placeholder="Enter value"
  value={value}
  onChange={handleChange}
/>
```

### Migrating a Card/Container

**Before:**
```tsx
<div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**After:**
```tsx
import { Card } from '@/design-system/foundations';

<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

## Troubleshooting

### Problem: Tokens not updating

**Solution:**
```bash
# Clear generated files
rm -rf src/design-system/theme/*

# Rebuild
npm run tokens:build

# Restart dev server
npm run dev
```

### Problem: TypeScript errors on imports

**Solution:**
```bash
# Ensure path aliases are configured
# Check tsconfig.app.json has:
"paths": {
  "@/design-system/*": ["./src/design-system/*"]
}

# Rebuild
npm run tokens:build
```

### Problem: Tailwind classes not working

**Solution:**
```bash
# Ensure tokens built before dev
npm run tokens:build

# Check tailwind.config.cjs imports tokens correctly
# Should have: const tokens = require('./src/design-system/theme/tailwind-tokens.js');
```

### Problem: Figma sync not working

**Solution:**
```bash
# Check tokens-figma.json exists
ls tokens-figma.json

# Check format matches example
cat tokens-figma.json.example

# Run sync with verbose output
npm run tokens:sync
```

## Next Steps

### Immediate (Completed in this implementation)

- ✅ Design token system (colors, spacing, radius, shadows, typography)
- ✅ Basic component library (Button, Input, Card)
- ✅ Figma sync workflow
- ✅ Tailwind integration
- ✅ Home page migration
- ✅ Documentation

### Phase 2 (Future)

- [ ] Migrate Lobby page to design system
- [ ] Migrate Dashboard components
- [ ] Migrate modal components
- [ ] Add more components (Modal, Dropdown, Toast)

### Phase 3 (Future)

- [ ] Storybook integration
- [ ] Component visual regression tests
- [ ] CI/CD automation for token sync
- [ ] Dark/light theme support
- [ ] Advanced animations and transitions

## Contributing

### Adding New Tokens

1. Edit appropriate JSON file in `src/design-system/tokens/`
2. Run `npm run tokens:build`
3. Use in components or Tailwind classes

### Adding New Components

1. Create directory in `src/design-system/foundations/`
2. Add `ComponentName.tsx`, `ComponentName.types.ts`, `index.ts`
3. Export from `foundations/index.ts`
4. Document in `doc/design-system.md`

### Syncing from Figma

1. Update tokens in Figma using Tokens Studio
2. Export to `tokens-figma.json`
3. Run `npm run tokens:sync`
4. Commit updated token files
5. Create PR with changes

## Support

For questions or issues:
1. Check `doc/design-system.md` for detailed documentation
2. Review `tokens-figma.json.example` for Figma structure
3. Look at Home page implementation for examples
4. Check this file for troubleshooting steps
