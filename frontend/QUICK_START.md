# Design System Quick Start

## 🚀 Getting Started (30 seconds)

```bash
# Build tokens and start dev server
npm run dev
```

## 📦 Using Components

```tsx
import { Button, Input, Card } from '@/design-system/foundations';

// Button
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

// Input
<Input
  label="Username"
  value={value}
  onChange={handleChange}
/>

// Card
<Card gradient>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

## 🎨 Design Tokens in Tailwind

```tsx
// Colors
<div className="bg-primary-600 text-white">Primary</div>
<div className="bg-slate-900">Dark Background</div>
<div className="text-success">Success Message</div>

// Spacing
<div className="p-4 gap-3">Consistent spacing</div>

// Radius
<div className="rounded-xl">Standard corners</div>

// Shadows
<div className="shadow-lg">Elevated card</div>
```

## 🔄 Working with Tokens

### Modify Tokens
```bash
# 1. Edit src/design-system/tokens/*.json
# 2. Rebuild
npm run tokens:build

# 3. Restart dev server
npm run dev
```

### Sync from Figma
```bash
# 1. Get tokens-figma.json from designer
# 2. Place in frontend/ directory
# 3. Sync and rebuild
npm run tokens:sync

# 4. Restart dev server
npm run dev
```

## 📖 Full Documentation

- **Components & Usage:** `frontend/DESIGN_SYSTEM.md`
- **Complete Guide:** `doc/design-system.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

## 🛠️ Common Commands

```bash
npm run tokens:build    # Build tokens only
npm run tokens:sync     # Sync from Figma + build
npm run dev             # Auto-builds tokens, starts dev server
npm run build           # Auto-builds tokens, production build
```

## 🐛 Quick Troubleshooting

**Tokens not updating?**
```bash
rm -rf src/design-system/theme/*
npm run tokens:build
npm run dev
```

**Import errors?**
Check path alias: `@/design-system/foundations`

**Tailwind classes not working?**
Ensure tokens built: `npm run tokens:build`

## 🎯 Component Props Quick Reference

### Button
- `variant`: `'primary'` | `'secondary'` | `'danger'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `disabled`: `boolean`
- All standard button HTML props

### Input
- `label`: `string` (optional)
- `error`: `string` (optional)
- `type`: `string` (default: `'text'`)
- All standard input HTML props

### Card
- `gradient`: `boolean` (optional)
- `className`: `string` (optional)
- All standard div HTML props

## 💡 Pro Tips

1. **Use path aliases:** `@/design-system/foundations` not relative paths
2. **Token changes = restart dev:** Tokens build before server starts
3. **Extend components:** Add `className` for custom styles
4. **Type safety:** Let TypeScript guide you with autocomplete
5. **Consistent spacing:** Use token values (2, 3, 4, 6, 8) not arbitrary values

---

Need more details? Check `frontend/DESIGN_SYSTEM.md`
