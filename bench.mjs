import { isLearnedBy, kanjiLearnedBy } from './dist/index.js';

const joyo = kanjiLearnedBy(9).join('');
const text = ('これは中学三年生以下で読める文章かを判定するための長い文です。' + joyo).repeat(50);
const N = 200;
isLearnedBy(text, 9);
const t = performance.now();
for (let i = 0; i < N; i++) isLearnedBy(text, 9);
const ms = performance.now() - t;
console.log(`${text.length} chars x ${N}: ${ms.toFixed(1)} ms  (${((text.length * N) / ms / 1000).toFixed(0)}M chars/s)`);
