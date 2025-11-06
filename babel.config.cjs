module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
    // Transform import.meta to process for tests
    function importMetaTransform() {
      return {
        visitor: {
          MemberExpression(path) {
            if (
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta'
            ) {
              // Replace import.meta with process in test environment
              path.replaceWithSourceString('process');
            }
          },
        },
      };
    },
  ],
};


