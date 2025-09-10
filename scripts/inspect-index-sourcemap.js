const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'dist', 'assets');
if (!fs.existsSync(dir)) {
  console.error('dist/assets not found:', dir);
  process.exit(1);
}
const files = fs.readdirSync(dir);
const mapFile = files.find(f => /^index.*\.js\.map$/.test(f));
if (!mapFile) {
  console.error('No index*.js.map found in', dir);
  process.exit(1);
}
const mapPath = path.join(dir, mapFile);
console.error('Using source map:', mapPath);
const m = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const srcs = m.sources || [];
const contents = m.sourcesContent || [];
const sizes = {};
for (let i = 0; i < srcs.length; i++) {
  let s = srcs[i];
  let c = contents[i];
  let size = 0;
  if (c) {
    size = Buffer.byteLength(c, 'utf8');
  } else {
    // heuristics to map source entry to repo file
    const candidates = [];
    const clean = s.replace(/^webpack:\/\//, '').replace(/^\//, '');
    candidates.push(path.join(process.cwd(), clean));
    // try relative from src
    const base = clean.split('/').slice(-3).join('/');
    candidates.push(path.join(process.cwd(), 'src', base));
    for (const cand of candidates) {
      try {
        if (fs.existsSync(cand)) {
          size = fs.statSync(cand).size;
          break;
        }
      } catch (e) {}
    }
  }
  sizes[s] = size;
}
const arr = Object.entries(sizes).sort((a,b)=>b[1]-a[1]);
console.log('Top 50 contributors to index chunk:');
arr.slice(0,50).forEach(([s,n],i)=>{
  console.log((i+1).toString().padStart(2,' ')+')\t'+(n/1024).toFixed(1)+' KB\t'+s);
});
