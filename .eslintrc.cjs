// Check if file exists first
const fs = require('fs');
const path = require('path');

const eslintrcPath = path.join(__dirname, '.eslintrc.cjs');
let existingConfig = {};

if (fs.existsSync(eslintrcPath)) {
  existingConfig = require(eslintrcPath);
}

module.exports = {
  ...existingConfig,
  rules: {
    ...existingConfig.rules,
    // Custom rule to warn about solid backgrounds in button-related code
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'CallExpression[callee.name="Button"] > JSXExpressionContainer > JSXAttribute[name.name="className"] > Literal[value=/bg-(primary|secondary|destructive|success|warning|danger|accent)-\d+(?!\/\d)/]',
        message: 'Buttons must not use solid background colors. Use transparent backgrounds with opacity (e.g., bg-primary/10) instead.',
      },
    ],
  },
};

