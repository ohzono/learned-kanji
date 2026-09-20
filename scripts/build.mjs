// Builds dist/ (ESM) and dist/cjs/ (CommonJS) with nothing but tsc.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const tsc = ['node_modules/typescript/bin/tsc'];
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [...tsc, '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(process.execPath, [...tsc, '-p', 'tsconfig.cjs.json'], { stdio: 'inherit' });
// The package is "type": "module", so mark the CommonJS output explicitly.
writeFileSync('dist/cjs/package.json', '{ "type": "commonjs" }\n');
