import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseManifestJson } from '@openchamber/sdk/schemas';

const root = resolve(process.argv[2] ?? '.');
const problems = [];

const exists = (p) => access(p).then(() => true, () => false);

const pkgPath = join(root, 'package.json');
if (!(await exists(pkgPath))) {
  console.error(`Missing package.json at ${pkgPath}`);
  process.exit(1);
}

const rawPkg = await readFile(pkgPath, 'utf8');
const parsed = parseManifestJson(rawPkg);
if (!parsed.ok) {
  console.error(`Invalid OpenChamber manifest: ${parsed.code}: ${parsed.message}`);
  process.exit(1);
}

const { contributes } = parsed.manifest;

if (contributes.panel?.icon?.endsWith('.svg')) {
  const iconPath = join(root, contributes.panel.icon);
  if (!(await exists(iconPath))) {
    problems.push(`Icon file missing: ${contributes.panel.icon}`);
  }
}

if (contributes.panel?.entry) {
  const htmlPath = join(root, contributes.panel.entry);
  if (!(await exists(htmlPath))) {
    problems.push(`Panel entry missing: ${contributes.panel.entry}`);
  } else {
    const html = await readFile(htmlPath, 'utf8');
    for (const [, src] of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)) {
      if (!src || /^[a-z]+:/i.test(src)) continue;
      if (src.endsWith('.ts')) {
        problems.push(`${contributes.panel.entry} references TypeScript file ${src}`);
      } else if (!(await exists(join(dirname(htmlPath), src)))) {
        problems.push(`Missing compiled panel script: ${src}`);
      }
    }
  }
}

if (contributes.service?.entry) {
  const svcPath = join(root, contributes.service.entry);
  if (!(await exists(svcPath))) {
    problems.push(`Missing compiled service script: ${contributes.service.entry}`);
  } else {
    const code = await readFile(svcPath, 'utf8');
    if (/from\s+["']@openchamber\/sdk/.test(code)) {
      problems.push(`${contributes.service.entry} still has unbundled @openchamber/sdk import.`);
    }
    if (!code.includes('OPENCHAMBER_SERVICE_PORT')) {
      problems.push(`${contributes.service.entry} does not read OPENCHAMBER_SERVICE_PORT.`);
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error('FAIL:', p);
  process.exit(1);
}

console.log('OK: OpenChamber extension manifest and bundled artifacts are valid and ready for Settings -> Extensions.');
