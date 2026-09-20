import { GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6, SECONDARY } from './data';

/**
 * School year in Japan: 1–6 = 小学校, 7–9 = 中学校1–3年.
 *
 * 中学校学習指導要領 does not allocate kanji to individual grades, so 7, 8 and 9
 * all mean the same set: the whole 常用漢字表 (2136 characters).
 */
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Where a kanji is first taught: an elementary grade, or `'secondary'` (常用漢字 outside the 配当表). */
export type KanjiLevel = 1 | 2 | 3 | 4 | 5 | 6 | 'secondary';

export interface Options {
  /**
   * Accept only the glyphs printed in 常用漢字表. By default the four everyday
   * variants 叱 填 剥 頬 are treated like their official forms 𠮟 塡 剝 頰.
   */
  strict?: boolean;
}

/** Tables this version is built from. */
export const SOURCE = {
  elementary: '小学校学習指導要領（平成29年告示）国語 別表 学年別漢字配当表',
  secondary: '常用漢字表（平成22年内閣告示第2号）',
} as const;

const BASE = 0x4e00;
const END = 0x9fff;
const SECONDARY_LEVEL = 7;
const VARIANT = 0x10;
// 𠮟 is the only 常用漢字 outside the BMP.
const SHIKARU = 0x20b9f;
const GRADES = [GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6];

// table[codePoint - BASE]: 0 = not taught, 1–6 = grade, 7 = secondary, 7|VARIANT = everyday variant
const table = /* @__PURE__ */ buildTable();

function buildTable(): Uint8Array {
  const t = new Uint8Array(END - BASE + 1);
  GRADES.forEach((chars, i) => {
    for (const ch of chars) t[ch.codePointAt(0)! - BASE] = i + 1;
  });
  for (const ch of SECONDARY) {
    const cp = ch.codePointAt(0)!;
    if (cp !== SHIKARU) t[cp - BASE] = SECONDARY_LEVEL;
  }
  for (const ch of '叱填剥頬') t[ch.codePointAt(0)! - BASE] = SECONDARY_LEVEL | VARIANT;
  return t;
}

function limitOf(grade: Grade): number {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) {
    throw new RangeError(`grade must be an integer from 1 to 9, got ${String(grade)}`);
  }
  return grade > 6 ? SECONDARY_LEVEL : grade;
}

/** Level of a code point: 0 = kanji that is not taught, 1–7 = level, -1 = not a kanji. */
function levelOf(cp: number, mask: number): number {
  if (cp >= BASE && cp <= END) return table[cp - BASE] & mask;
  if (cp === SHIKARU) return SECONDARY_LEVEL;
  // Extension A, compatibility ideographs, Extension B and beyond
  if ((cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x20000 && cp <= 0x3ffff)) {
    return 0;
  }
  return -1;
}

/**
 * True when every kanji in `text` has been taught by the end of `grade`.
 * Kana, Latin letters, digits, punctuation and 々 are ignored.
 */
export function isLearnedBy(text: string, grade: Grade, options?: Options): boolean {
  const limit = limitOf(grade);
  const mask = options?.strict ? 0xff : 0x0f;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x3400) continue;
    if (c >= BASE && c <= END) {
      const v = table[c - BASE] & mask;
      if (v === 0 || v > limit) return false;
      continue;
    }
    const cp = text.codePointAt(i)!;
    if (cp > 0xffff) i++;
    const v = levelOf(cp, mask);
    if (v === 0 || v > limit) return false;
  }
  return true;
}

/** Kanji in `text` that have not been taught by the end of `grade`, unique, in order of appearance. */
export function unlearnedKanji(text: string, grade: Grade, options?: Options): string[] {
  const limit = limitOf(grade);
  const mask = options?.strict ? 0xff : 0x0f;
  const found = new Set<string>();
  for (const ch of text) {
    const v = levelOf(ch.codePointAt(0)!, mask);
    if (v === 0 || v > limit) found.add(ch);
  }
  return [...found];
}

/** Where `char` is first taught, or `undefined` when it is not a taught kanji. */
export function levelOfKanji(char: string, options?: Options): KanjiLevel | undefined {
  const cp = char.codePointAt(0);
  if (cp === undefined || char.length !== (cp > 0xffff ? 2 : 1)) return undefined;
  const v = levelOf(cp, options?.strict ? 0xff : 0x0f);
  if (v < 1 || v > SECONDARY_LEVEL) return undefined;
  return v === SECONDARY_LEVEL ? 'secondary' : (v as KanjiLevel);
}

/** All kanji taught by the end of `grade` (cumulative), in the order of the official tables. */
export function kanjiLearnedBy(grade: Grade): string[] {
  const limit = limitOf(grade);
  const chars = GRADES.slice(0, Math.min(limit, 6)).join('') + (limit === SECONDARY_LEVEL ? SECONDARY : '');
  return [...chars];
}
