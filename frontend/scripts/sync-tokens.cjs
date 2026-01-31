const fs = require('fs');
const path = require('path');

/**
 * Sync script to transform Figma Tokens export to Style Dictionary format
 *
 * Usage:
 * 1. Export tokens from Figma Tokens Studio plugin to tokens-figma.json
 * 2. Run: npm run tokens:sync
 * 3. Tokens will be synced and built automatically
 */

const FIGMA_TOKENS_PATH = path.join(__dirname, '../tokens-figma.json');
const TOKENS_DIR = path.join(__dirname, '../src/design-system/tokens');

// Check if Figma tokens file exists
if (!fs.existsSync(FIGMA_TOKENS_PATH)) {
  console.log('ℹ️  No tokens-figma.json found. Skipping sync.');
  console.log('   To sync from Figma:');
  console.log('   1. Export from Tokens Studio plugin');
  console.log('   2. Save as tokens-figma.json in frontend/ directory');
  console.log('   3. Run: npm run tokens:sync');
  process.exit(0);
}

console.log('🔄 Syncing tokens from Figma...');

try {
  const figmaTokens = JSON.parse(fs.readFileSync(FIGMA_TOKENS_PATH, 'utf8'));

  // Transform Figma Tokens structure to Style Dictionary format
  // This is a basic implementation - adjust based on your Figma Tokens structure

  const transformTokenSet = (tokenSet) => {
    const result = {};

    for (const [key, value] of Object.entries(tokenSet)) {
      if (typeof value === 'object' && value !== null) {
        if (value.value !== undefined && value.type !== undefined) {
          // This is a token with a value
          result[key] = { value: value.value };
        } else {
          // This is a nested group
          result[key] = transformTokenSet(value);
        }
      }
    }

    return result;
  };

  // Get the first token set (or specific set if multiple)
  const tokenSetName = Object.keys(figmaTokens)[0];
  const tokens = figmaTokens[tokenSetName];

  // Split tokens by category and write to separate files
  const categories = {
    'colors.json': tokens.color || {},
    'spacing.json': tokens.spacing || {},
    'radius.json': tokens.radius || {},
    'shadows.json': tokens.shadow || {},
    'typography.json': tokens.font || {},
  };

  for (const [filename, categoryTokens] of Object.entries(categories)) {
    const outputPath = path.join(TOKENS_DIR, filename);
    const transformed = transformTokenSet(categoryTokens);

    // Wrap in category key (e.g., { "color": {...} })
    const categoryKey = filename.replace('.json', '').replace('s', ''); // colors -> color
    const output = { [categoryKey]: transformed };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Synced ${filename}`);
  }

  console.log('✨ Figma tokens synced successfully!');
  console.log('   Running tokens:build...');

} catch (error) {
  console.error('❌ Error syncing tokens:', error.message);
  process.exit(1);
}
