import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6, SECONDARY } from '../src/data.ts';
import { isLearnedBy, kanjiLearnedBy, levelOfKanji, unlearnedKanji, type Grade } from '../src/index.ts';

const GRADES = [GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6];

describe('data', () => {
  it('matches the official character counts', () => {
    assert.deepStrictEqual(GRADES.map((g) => [...g].length), [80, 160, 200, 202, 193, 191]);
    assert.strictEqual([...SECONDARY].length, 1110);
  });

  it('has no duplicates across 常用漢字 2136', () => {
    assert.strictEqual(new Set([...GRADES.join(''), ...SECONDARY]).size, 2136);
  });

  it('puts the 25 prefecture kanji of the 平成29年 revision in grade 4', () => {
    for (const ch of '茨媛岡潟岐熊香佐埼崎滋鹿縄井沖栃奈梨阪阜賀群徳富城') {
      assert.strictEqual(levelOfKanji(ch), 4, ch);
    }
  });

  it('reflects the grade moves of the 平成29年 revision', () => {
    for (const ch of '囲紀喜救型航告殺士史象賞貯停堂得毒費粉脈歴') assert.strictEqual(levelOfKanji(ch), 5, ch);
    for (const ch of '胃腸恩券承舌銭退敵俵預') assert.strictEqual(levelOfKanji(ch), 6, ch);
  });
});

describe('isLearnedBy', () => {
  it('is cumulative over grades', () => {
    assert.strictEqual(isLearnedBy('山と川', 1), true);
    assert.strictEqual(isLearnedBy('海', 1), false);
    assert.strictEqual(isLearnedBy('海', 2), true);
    assert.strictEqual(isLearnedBy('山と海', 6), true);
  });

  it('accepts every kanji of a grade at that grade and rejects it one grade earlier', () => {
    GRADES.forEach((chars, i) => {
      const grade = (i + 1) as Grade;
      assert.strictEqual(isLearnedBy(chars, grade), true);
      for (const ch of chars) {
        if (grade > 1) assert.strictEqual(isLearnedBy(ch, (grade - 1) as Grade), false, ch);
      }
    });
  });

  it('treats grades 7, 8 and 9 as the whole 常用漢字表', () => {
    for (const grade of [7, 8, 9] as Grade[]) {
      assert.strictEqual(isLearnedBy(SECONDARY, grade), true);
      assert.strictEqual(isLearnedBy('憂鬱な語彙', grade), true);
    }
    for (const ch of SECONDARY) assert.strictEqual(isLearnedBy(ch, 6), false, ch);
  });

  it('rejects kanji outside 常用漢字表', () => {
    assert.strictEqual(isLearnedBy('薔薇', 9), false);
    assert.strictEqual(isLearnedBy('㐂', 9), false); // Extension A
    assert.strictEqual(isLearnedBy('𠀋', 9), false); // Extension B
    assert.strictEqual(isLearnedBy('﨑', 9), false); // compatibility ideograph
  });

  it('rejects radical look-alikes that would otherwise bypass the check', () => {
    assert.strictEqual(isLearnedBy('\u2F2D', 9), false); // ⼭ KANGXI RADICAL MOUNTAIN, renders like 山
    assert.strictEqual(isLearnedBy('\u2E81', 9), false); // CJK RADICAL CLIFF
    assert.strictEqual(isLearnedBy('\u2FD5', 9), false); // last Kangxi radical
    assert.deepStrictEqual(unlearnedKanji('\u2F2Dと山', 9), ['\u2F2D']);
    assert.strictEqual(levelOfKanji('\u2F2D'), undefined);
    // Neighbours of the radical blocks are still ignored
    assert.strictEqual(isLearnedBy('\u2E7F\u2FF0\u3000\u3001', 1), true);
  });

  it('ignores everything that is not a kanji', () => {
    assert.strictEqual(isLearnedBy('', 1), true);
    assert.strictEqual(isLearnedBy('ひらがな カタカナ ABC abc 123 、。「」！？々〆ー😀', 1), true);
  });

  it('handles 𠮟 (U+20B9F) and the everyday variants', () => {
    assert.strictEqual(isLearnedBy('𠮟る', 9), true);
    assert.strictEqual(isLearnedBy('𠮟る', 6), false);
    assert.strictEqual(isLearnedBy('𠮟る', 9, { strict: true }), true);
    for (const ch of '叱填剥頬') {
      assert.strictEqual(isLearnedBy(ch, 9), true, ch);
      assert.strictEqual(isLearnedBy(ch, 6), false, ch);
      assert.strictEqual(isLearnedBy(ch, 9, { strict: true }), false, ch);
    }
  });

  it('throws on an invalid grade', () => {
    for (const g of [0, 10, 1.5, NaN, '3']) {
      assert.throws(() => isLearnedBy('山', g as Grade), RangeError);
    }
  });
});

describe('unlearnedKanji', () => {
  it('lists offending kanji once, in order of appearance', () => {
    assert.deepStrictEqual(unlearnedKanji('薔薇と海と薔薇と𠀋', 1), ['薔', '薇', '海', '𠀋']);
    assert.deepStrictEqual(unlearnedKanji('山と川', 1), []);
  });

  it('agrees with isLearnedBy', () => {
    const text = GRADES.join('') + SECONDARY + '薔薇叱𠮟あA';
    for (let g = 1; g <= 9; g++) {
      for (const strict of [false, true]) {
        const bad = unlearnedKanji(text, g as Grade, { strict });
        assert.strictEqual(isLearnedBy(text, g as Grade, { strict }), bad.length === 0);
        for (const ch of text) {
          assert.strictEqual(isLearnedBy(ch, g as Grade, { strict }), !bad.includes(ch), ch);
        }
      }
    }
  });
});

describe('levelOfKanji', () => {
  it('returns the grade, secondary, or undefined', () => {
    assert.strictEqual(levelOfKanji('一'), 1);
    assert.strictEqual(levelOfKanji('論'), 6);
    assert.strictEqual(levelOfKanji('鬱'), 'secondary');
    assert.strictEqual(levelOfKanji('𠮟'), 'secondary');
    assert.strictEqual(levelOfKanji('叱'), 'secondary');
    assert.strictEqual(levelOfKanji('叱', { strict: true }), undefined);
    assert.strictEqual(levelOfKanji('薔'), undefined);
    assert.strictEqual(levelOfKanji('あ'), undefined);
    assert.strictEqual(levelOfKanji('山川'), undefined);
    assert.strictEqual(levelOfKanji(''), undefined);
  });
});

describe('kanjiLearnedBy', () => {
  it('returns cumulative lists', () => {
    assert.strictEqual(kanjiLearnedBy(1).length, 80);
    assert.strictEqual(kanjiLearnedBy(4).length, 642);
    assert.strictEqual(kanjiLearnedBy(6).length, 1026);
    assert.strictEqual(kanjiLearnedBy(7).length, 2136);
    assert.deepStrictEqual(kanjiLearnedBy(9), kanjiLearnedBy(7));
  });
});
