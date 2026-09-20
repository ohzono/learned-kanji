// Fails when a dependency sneaks in. The published package must stay dependency-free,
// and the toolchain is limited to TypeScript so that there is little to audit.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const errors = [];

for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies']) {
  if (pkg[field] && Object.keys(pkg[field]).length > 0) errors.push(`package.json must not declare ${field}`);
}

const allowedDev = ['typescript'];
const dev = Object.keys(pkg.devDependencies ?? {});
for (const name of dev) if (!allowedDev.includes(name)) errors.push(`unexpected devDependency: ${name}`);

const installed = Object.keys(lock.packages).filter((path) => path !== '');
for (const path of installed) {
  const entry = lock.packages[path];
  if (!allowedDev.includes(path.replace('node_modules/', ''))) errors.push(`unexpected package in lockfile: ${path}`);
  if (entry.hasInstallScript) errors.push(`package runs an install script: ${path}`);
  if (!entry.resolved?.startsWith('https://registry.npmjs.org/')) errors.push(`not from the npm registry: ${path}`);
  if (!entry.integrity?.startsWith('sha512-')) errors.push(`missing sha512 integrity: ${path}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ok: 0 runtime dependencies, ${installed.length} installed package(s): ${installed.join(', ')}`);
