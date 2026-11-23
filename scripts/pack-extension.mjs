import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const outName = `model-arena-openchamber-extension-v${version}.zip`;
const outPath = join(root, outName);

const files = [
  'package.json',
  'icon.svg',
  'README.md',
  'panel/index.html',
  'panel/styles.css',
  'panel/main.js',
  'service/main.js',
];

for (const f of files) {
  if (!existsSync(join(root, f))) {
    console.error(`Missing required extension artifact: ${f}`);
    process.exit(1);
  }
}

if (existsSync(outPath)) {
  rmSync(outPath, { force: true });
}

// Create deterministic zip using Python's stdlib zipfile (cross-platform Windows/Linux/macOS)
const pyScript = `
import sys, zipfile, pathlib
out = pathlib.Path(sys.argv[1])
root = pathlib.Path(sys.argv[2])
files = sys.argv[3:]
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for rel in files:
        zf.write(root / rel, arcname=rel)
print(f"Packaged {out.name} ({out.stat().st_size} bytes)")
`;

const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
execFileSync(pythonCmd, ['-c', pyScript, outPath, root, ...files], { stdio: 'inherit' });
