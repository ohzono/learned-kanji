import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLearnedBy, kanjiLearnedBy, unlearnedKanji } from '../src/index.ts';

// Wall-clock assertions are noisy on shared CI runners, so every check here takes
// the best of several runs and leaves a wide margin (10x or more) over what is
// measured locally. They guard the complexity class, not the exact speed.

// Available in Node.js and browsers; declared here to keep DOM types out of the library build.
declare const performance: { now(): number };

const JOYO = kanjiLearnedBy(9).join('');

function textOf(length: number): string {
  const unit = 'これはテストです。ABC 123 ' + JOYO;
  return unit.repeat(Math.ceil(length / unit.length)).slice(0, length);
}

function bestOf(runs: number, fn: () => void): number {
  fn(); // warm up
  let best = Infinity;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    best = Math.min(best, performance.now() - start);
  }
  return best;
}

describe('performance', () => {
  const small = textOf(500_000);
  const large = textOf(5_000_000);

  it('isLearnedBy scales linearly with the length of the text', () => {
    const tSmall = bestOf(7, () => isLearnedBy(small, 9));
    const tLarge = bestOf(7, () => isLearnedBy(large, 9));
    // 10x the input: linear is ~10x, quadratic would be ~100x
    assert.ok(tLarge / tSmall < 30, `10x input took ${tLarge / tSmall}x longer`);
  });

  it('unlearnedKanji scales linearly, even when every kanji is unlearned', () => {
    const tSmall = bestOf(7, () => unlearnedKanji(small, 1));
    const tLarge = bestOf(7, () => unlearnedKanji(large, 1));
    assert.ok(tLarge / tSmall < 30, `10x input took ${tLarge / tSmall}x longer`);
  });

  it('checks a million characters well within a frame budget', () => {
    const text = textOf(1_000_000);
    assert.strictEqual(isLearnedBy(text, 9), true);
    // ~3 ms locally; the budget is loose because CI runners are slow and noisy
    const tCheck = bestOf(7, () => isLearnedBy(text, 9));
    const tList = bestOf(7, () => unlearnedKanji(text, 9));
    assert.ok(tCheck < 500, `isLearnedBy took ${tCheck} ms`);
    assert.ok(tList < 500, `unlearnedKanji took ${tList} ms`);
  });

  it('isLearnedBy returns at the first unlearned kanji', () => {
    const failing = '薔' + large;
    assert.strictEqual(isLearnedBy(failing, 9), false);
    const tFull = bestOf(7, () => isLearnedBy(large, 9));
    const tEarly = bestOf(7, () => isLearnedBy(failing, 9));
    assert.ok(tEarly < tFull / 10, `early exit ${tEarly} ms vs full scan ${tFull} ms`);
  });

  it('unlearnedKanji output is bounded by distinct kanji, not by text length', () => {
    assert.strictEqual(unlearnedKanji(large, 1).length, 2136 - 80);
  });
});
