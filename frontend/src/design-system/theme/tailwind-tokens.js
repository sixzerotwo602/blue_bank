// Helper to extract just the values from Style Dictionary tokens for Tailwind
const tokens = require('./tokens.js');

const extractValues = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      if (value.value !== undefined) {
        // This is a token with a value
        result[key] = value.value;
      } else {
        // This is a nested object, recurse
        result[key] = extractValues(value);
      }
    }
  }
  return result;
};

module.exports = {
  colors: extractValues(tokens.color),
  spacing: extractValues(tokens.spacing),
  borderRadius: extractValues(tokens.radius),
  boxShadow: extractValues(tokens.shadow),
  fontSize: extractValues(tokens.font?.size || {}),
  fontWeight: extractValues(tokens.font?.weight || {}),
};
