const React = require('react');

// Known framer-motion exact prop names or prefixes we want to strip before rendering DOM nodes
const FRAMER_PROPS = new Set([
  'initial','animate','exit','transition','variants',
  'layout','layoutId','drag','dragConstraints','dragElastic','dragMomentum',
]);

const STRIP_PREFIXES = [
  'while', // whileHover, whileTap, whileDrag, whileInView, etc.
  'onPan', // onPan, onPanStart, onPanEnd
  'onDrag', // onDrag, onDragStart, onDragEnd
];

function stripFramerProps(props) {
  const out = {};
  Object.keys(props || {}).forEach((k) => {
    // Preserve children explicitly so test renderers that rely on props.children still receive them
    if (k === 'children') {
      out.children = props[k];
      return;
    }

    // Preserve common DOM / accessibility props explicitly
    if (k === 'className' || k === 'id' || k === 'role' || k === 'tabIndex' || k === 'title' || k === 'alt') {
      out[k] = props[k];
      return;
    }

    // Preserve data-* and aria-* attributes
    if (k.startsWith('data-') || k.startsWith('aria-')) {
      out[k] = props[k];
      return;
    }

    // Preserve normal event handlers like onClick, onMouseEnter, etc., but strip animation-specific ones
    if (k.startsWith('on')) {
      const shouldStrip = STRIP_PREFIXES.some((p) => k.startsWith(p));
      if (shouldStrip) return;
      out[k] = props[k];
      return;
    }

    // Strip exact known framer prop names
    if (FRAMER_PROPS.has(k)) return;

    // Strip prefixed animation props (whileHover, whileTap, whileDrag...)
    if (STRIP_PREFIXES.some((p) => k.startsWith(p))) return;

    // Otherwise keep the prop
    out[k] = props[k];
  });
  return out;
}

const motion = new Proxy({}, {
  get: (_target, prop) => {
    // Support symbol keys and strings; default to a safe tag name
    const tag = typeof prop === 'symbol' ? String(prop).replace(/^Symbol\((.*)\)$/, '$1') : String(prop);

    // return a functional component that renders the requested tag
    // Forward props (including children) directly to the DOM element to avoid
    // accidentally stripping content during tests. If needed, we can reintroduce
    // selective stripping for animation-specific props later.
    return (props = {}) => {
      const forwardProps = props || {};
      return React.createElement(tag || 'div', forwardProps);
    };
  }
});

// Provide AnimatePresence as a transparent wrapper and ensure ES module compatibility
const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children);

// Export both CommonJS and an ES-compatible shape so import { motion } and import motion both work
const exportsObj = {
  motion,
  AnimatePresence,
  // helpful for environments that do `import framer from 'framer-motion'`
  default: {
    motion,
    AnimatePresence,
  },
  __esModule: true,
};

module.exports = exportsObj;
