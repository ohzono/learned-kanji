// Runs against the built package the way a consumer would load it (ESM and CommonJS).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

for (const [name, load] of [
  ['ESM', () => import('learned-kanji')],
  ['CommonJS', async () => require('learned-kanji')],
]) {
  test(`${name} build works`, async () => {
    const lib = await load();
    assert.strictEqual(lib.isLearnedBy('山と川', 1), true);
    assert.strictEqual(lib.isLearnedBy('薔薇', 9), false);
    assert.deepStrictEqual(lib.unlearnedKanji('𠮟ると海', 1), ['𠮟', '海']);
    assert.strictEqual(lib.kanjiLearnedBy(9).length, 2136);
  });
}
