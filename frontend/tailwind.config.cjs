const tokens = require('./src/design-system/theme/tailwind-tokens.js');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        slate: tokens.colors.slate,
        success: tokens.colors.success,
        danger: tokens.colors.danger,
        warning: tokens.colors.warning,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
    },
  },
  plugins: [],
}
