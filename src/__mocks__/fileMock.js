// Mock for handling file imports in tests
module.exports = {
  __esModule: true,
  default: 'test-file-stub',
  ReactComponent: props => ({
    ...props,
    $$typeof: Symbol.for('react.element'),
    type: 'svg',
    ref: null,
    key: null,
    props: {
      ...props,
      children: props.children || null
    }
  })
};
