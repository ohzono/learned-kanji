# learned-kanji

Check whether Japanese text uses only the kanji that have been taught by a given school grade in Japan.

日本の学習指導要領に基づき、文章が「その学年までに習う漢字」だけで書かれているかを判定します。

- Based on the official tables: 学年別漢字配当表 (1026 kanji, grades 1–6) and 常用漢字表 (2136 kanji)
- Zero dependencies, ~15 KB, works in browsers and Node.js (ESM / CJS, TypeScript types included)
- Fast: one pass over the string with a `Uint8Array` lookup, no regular expressions

```sh
npm install --save-dev learned-kanji
```

## Usage

```ts
import { isLearnedBy, unlearnedKanji } from 'learned-kanji';

isLearnedBy('山と川', 1); // true
isLearnedBy('海', 1); // false (海 is taught in grade 2)
isLearnedBy('憂鬱な語彙', 9); // true
isLearnedBy('薔薇', 9); // false

unlearnedKanji('薔薇と海', 1); // ['薔', '薇', '海']
```

In a test, use `unlearnedKanji` so that a failure tells you which characters are wrong:

```ts
import { expect, test } from 'vitest';
import { unlearnedKanji } from 'learned-kanji';
import messages from '../src/locales/ja.json';

test('UI text uses only kanji taught by the end of junior high school', () => {
  for (const [key, text] of Object.entries(messages)) {
    expect(unlearnedKanji(text, 9), key).toEqual([]);
  }
});
```

## Grades

| `grade` | School year | Kanji allowed |
| --- | --- | --- |
| `1` – `6` | 小学校 1–6 年 | Cumulative 学年別漢字配当表: 80 / 240 / 440 / 642 / 835 / 1026 |
| `7` – `9` | 中学校 1–3 年 | All of 常用漢字表: 2136 |

The grade is inclusive: `isLearnedBy(text, 3)` means "taught by the end of grade 3".

**7, 8 and 9 are the same set.** 中学校学習指導要領 does not allocate kanji to individual grades; it only says that students learn to read most of the 常用漢字 by the end of grade 9. There is no official data that tells grade 7 from grade 8, so this package does not invent one.

## API

### `isLearnedBy(text, grade, options?): boolean`

`true` when every kanji in `text` has been taught by the end of `grade`. Stops at the first offending character.

### `unlearnedKanji(text, grade, options?): string[]`

The kanji that have not been taught by the end of `grade`: unique, in order of appearance.

### `levelOfKanji(char, options?): 1 | 2 | 3 | 4 | 5 | 6 | 'secondary' | undefined`

Where a single kanji is first taught. `'secondary'` means 常用漢字 outside the 配当表; `undefined` means it is not taught (or is not a single kanji).

### `kanjiLearnedBy(grade): string[]`

All kanji taught by the end of `grade`, in the order of the official tables.

### `options.strict`

常用漢字表 prints four characters in a form that differs from the one normally typed: 𠮟 塡 剝 頰. Almost all real text uses 叱 填 剥 頬 instead, so **both forms are accepted by default**. Pass `{ strict: true }` to accept only the official forms.

Note that 𠮟 is U+20B9F, outside the BMP. It is handled correctly.

### What is ignored

Only kanji are judged. Hiragana, katakana, Latin letters, digits, punctuation, emoji and the iteration mark 々 always pass. Every CJK ideograph that is not in the tables (CJK Unified Ideographs, Extension A, Extension B and later, compatibility ideographs) fails.

Readings are not considered: a kanji counts as learned from the grade it is allocated to, even if a particular reading is taught later.

## Data sources

- 文部科学省「小学校学習指導要領（平成29年告示）」国語 別表「学年別漢字配当表」, in force since April 2020
- 文化庁「常用漢字表」（平成22年内閣告示第2号）

The grade table was checked against two independent transcriptions and against the list of changes published in 文部科学省「小学校学習指導要領（平成29年告示）解説 国語編」 (20 kanji added, 25 prefecture kanji in grade 4, 32 kanji moved). The 常用漢字 list was checked against two independent transcriptions. The character counts are fixed by tests.

Some older packages still ship the previous table (1006 kanji). This one does not.

## License

MIT. The kanji tables themselves are published by the Japanese government.
