import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Simple heuristic audit: flag occurrences of backdrop-blur-* combined in the SAME line
// with bg-white/* or border-white/* where it looks like a surface container (div, Card, etc.).
// Allowlist exceptions are matched by filepath substrings.

const ROOT = process.cwd();
const TARGET_DIR = join(ROOT, 'src');

const ALLOWLIST = [
  'components/layout/Navbar.tsx', // navbar exception
  'components/layout/__tests__/Navbar.test.tsx', // navbar tests
  'components/ui/__tests__/MobileMenu.test.tsx', // mobile menu test asserting legacy classes
  'components/ui/CommandPalette.tsx', // may keep specific nav glass tokens
  'components/ui/SimpleModal.tsx', // backdrop overlay
  'components/ui/Sheet.tsx', // overlay/backdrop
  'components/collaboration/TeamFormationInterface.tsx', // overlay backdrop lines
  'components/ui/ComponentFallbacks.tsx', // modal backdrop
  'components/features/search/EnhancedFilterPanel.tsx', // overlay backdrop
  'pages/ProfilePage.tsx', // sticky header backdrop
  'utils/styleAuditTool.ts', // examples contain legacy combos by design
];

const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

const backdropRegex = /\bbackdrop-blur-(sm|md|lg|xl|2xl|3xl)\b/;
const bgWhiteRegex = /\bbg-white\/[0-9]{1,3}\b/;
const borderWhiteRegex = /\bborder-white\/[0-9]{1,3}\b/;

let violations: Array<{ file: string; line: number; text: string }> = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (FILE_EXTENSIONS.has(extname(full))) {
      const rel = full.replace(ROOT + '/', '');
      if (ALLOWLIST.some((p) => rel.includes(p))) continue;
      const content = readFileSync(full, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (backdropRegex.test(line) && (bgWhiteRegex.test(line) || borderWhiteRegex.test(line))) {
          violations.push({ file: rel, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
}

walk(TARGET_DIR);

if (violations.length) {
  console.error('\nGlass style audit failed. Avoid ad-hoc surface combos. Use `glassmorphic` instead.');
  console.error('Violations:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line}: ${v.text}`);
  }
  process.exit(1);
} else {
  console.log('Glass style audit passed.');
}


