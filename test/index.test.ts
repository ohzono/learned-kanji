import { describe, expect, it } from 'vitest';
import { GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6, SECONDARY } from '../src/data';
import { isLearnedBy, kanjiLearnedBy, levelOfKanji, unlearnedKanji, type Grade } from '../src/index';

const GRADES = [GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6];

describe('data', () => {
  it('matches the official character counts', () => {
    expect(GRADES.map((g) => [...g].length)).toEqual([80, 160, 200, 202, 193, 191]);
    expect([...SECONDARY].length).toBe(1110);
  });

  it('has no duplicates across 常用漢字 2136', () => {
    expect(new Set([...GRADES.join(''), ...SECONDARY]).size).toBe(2136);
  });

  it('puts the 25 prefecture kanji of the 平成29年 revision in grade 4', () => {
    for (const ch of '茨媛岡潟岐熊香佐埼崎滋鹿縄井沖栃奈梨阪阜賀群徳富城') {
      expect(levelOfKanji(ch), ch).toBe(4);
    }
  });

  it('reflects the grade moves of the 平成29年 revision', () => {
    for (const ch of '囲紀喜救型航告殺士史象賞貯停堂得毒費粉脈歴') expect(levelOfKanji(ch), ch).toBe(5);
    for (const ch of '胃腸恩券承舌銭退敵俵預') expect(levelOfKanji(ch), ch).toBe(6);
  });
});

describe('isLearnedBy', () => {
  it('is cumulative over grades', () => {
    expect(isLearnedBy('山と川', 1)).toBe(true);
    expect(isLearnedBy('海', 1)).toBe(false);
    expect(isLearnedBy('海', 2)).toBe(true);
    expect(isLearnedBy('山と海', 6)).toBe(true);
  });

  it('accepts every kanji of a grade at that grade and rejects it one grade earlier', () => {
    GRADES.forEach((chars, i) => {
      const grade = (i + 1) as Grade;
      expect(isLearnedBy(chars, grade)).toBe(true);
      for (const ch of chars) {
        if (grade > 1) expect(isLearnedBy(ch, (grade - 1) as Grade), ch).toBe(false);
      }
    });
  });

  it('treats grades 7, 8 and 9 as the whole 常用漢字表', () => {
    for (const grade of [7, 8, 9] as Grade[]) {
      expect(isLearnedBy(SECONDARY, grade)).toBe(true);
      expect(isLearnedBy('憂鬱な語彙', grade)).toBe(true);
    }
    for (const ch of SECONDARY) expect(isLearnedBy(ch, 6), ch).toBe(false);
  });

  it('rejects kanji outside 常用漢字表', () => {
    expect(isLearnedBy('薔薇', 9)).toBe(false);
    expect(isLearnedBy('㐂', 9)).toBe(false); // Extension A
    expect(isLearnedBy('𠀋', 9)).toBe(false); // Extension B
    expect(isLearnedBy('﨑', 9)).toBe(false); // compatibility ideograph
  });

  it('ignores everything that is not a kanji', () => {
    expect(isLearnedBy('', 1)).toBe(true);
    expect(isLearnedBy('ひらがな カタカナ ABC abc 123 、。「」！？々〆ー😀', 1)).toBe(true);
  });

  it('handles 𠮟 (U+20B9F) and the everyday variants', () => {
    expect(isLearnedBy('𠮟る', 9)).toBe(true);
    expect(isLearnedBy('𠮟る', 6)).toBe(false);
    expect(isLearnedBy('𠮟る', 9, { strict: true })).toBe(true);
    for (const ch of '叱填剥頬') {
      expect(isLearnedBy(ch, 9), ch).toBe(true);
      expect(isLearnedBy(ch, 6), ch).toBe(false);
      expect(isLearnedBy(ch, 9, { strict: true }), ch).toBe(false);
    }
  });

  it('throws on an invalid grade', () => {
    for (const g of [0, 10, 1.5, NaN, '3']) {
      expect(() => isLearnedBy('山', g as Grade)).toThrow(RangeError);
    }
  });
});

describe('unlearnedKanji', () => {
  it('lists offending kanji once, in order of appearance', () => {
    expect(unlearnedKanji('薔薇と海と薔薇と𠀋', 1)).toEqual(['薔', '薇', '海', '𠀋']);
    expect(unlearnedKanji('山と川', 1)).toEqual([]);
  });

  it('agrees with isLearnedBy', () => {
    const text = GRADES.join('') + SECONDARY + '薔薇叱𠮟あA';
    for (let g = 1; g <= 9; g++) {
      for (const strict of [false, true]) {
        const bad = unlearnedKanji(text, g as Grade, { strict });
        expect(isLearnedBy(text, g as Grade, { strict })).toBe(bad.length === 0);
        for (const ch of text) {
          expect(isLearnedBy(ch, g as Grade, { strict }), ch).toBe(!bad.includes(ch));
        }
      }
    }
  });
});

describe('levelOfKanji', () => {
  it('returns the grade, secondary, or undefined', () => {
    expect(levelOfKanji('一')).toBe(1);
    expect(levelOfKanji('論')).toBe(6);
    expect(levelOfKanji('鬱')).toBe('secondary');
    expect(levelOfKanji('𠮟')).toBe('secondary');
    expect(levelOfKanji('叱')).toBe('secondary');
    expect(levelOfKanji('叱', { strict: true })).toBeUndefined();
    expect(levelOfKanji('薔')).toBeUndefined();
    expect(levelOfKanji('あ')).toBeUndefined();
    expect(levelOfKanji('山川')).toBeUndefined();
    expect(levelOfKanji('')).toBeUndefined();
  });
});

describe('kanjiLearnedBy', () => {
  it('returns cumulative lists', () => {
    expect(kanjiLearnedBy(1).length).toBe(80);
    expect(kanjiLearnedBy(4).length).toBe(642);
    expect(kanjiLearnedBy(6).length).toBe(1026);
    expect(kanjiLearnedBy(7).length).toBe(2136);
    expect(kanjiLearnedBy(9)).toEqual(kanjiLearnedBy(7));
  });
});
