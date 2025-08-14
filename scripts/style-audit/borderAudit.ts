import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');
const BORDER_COLOR_REGEX = /\bborder-(white|gray|slate|neutral|zinc|stone|amber|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)(?:[-/]|\b)/g;

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function audit() {
  const files = walk(ROOT);
  let total = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (BORDER_COLOR_REGEX.test(line)) {
        total++;
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
      BORDER_COLOR_REGEX.lastIndex = 0; // reset regex per iteration
    });
  }
  if (total === 0) {
    console.log('No raw border-<color> usages found.');
  } else {
    console.log(`\nFound ${total} raw border-<color> occurrences. Consider replacing with border-standard, border-divider, or border-glass.`);
  }
}

audit();


