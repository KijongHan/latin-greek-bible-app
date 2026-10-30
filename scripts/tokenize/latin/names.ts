import type { ProperName } from "../shared/parser";
import { normalizeLatin } from "./parser";

const NT_BOOKS = new Set(
  "MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(" "),
);
// Only in the Greek OT, so their names can be Hebrew or Greek dStrongs
const DEUTEROCANON_BOOKS = new Set("TOB JDT WIS SIR BAR 1MA 2MA".split(" "));

// The dStrong prefix a book's names should have, if only one fits
function bookLanguage(book: string): "G" | "H" | undefined {
  if (NT_BOOKS.has(book)) return "G";
  return DEUTEROCANON_BOOKS.has(book) ? undefined : "H";
}

// Greek → Latin letters, as Latin borrows Greek names: Ἰουδαῖος → iudaeus,
// Ἱεροσόλυμα → hierosolyma
const GREEK_DIGRAPHS: [RegExp, string][] = [
  [/ου/g, "u"],
  [/αι/g, "ae"],
  [/οι/g, "oe"],
  [/ει/g, "i"],
  [/γγ/g, "ng"],
  [/γκ/g, "nc"],
  [/ος$/, "us"],
  [/ον$/, "um"],
];
const GREEK_LETTERS: Record<string, string> = {
  α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "e", θ: "th", ι: "i",
  κ: "c", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "ph", χ: "ch", ψ: "ps", ω: "o",
};

function transliterateGreek(name: string): string | undefined {
  const decomposed = name.toLowerCase().normalize("NFD");
  if (!/[α-ω]/.test(decomposed)) return undefined;
  // Rough breathing on the first vowel is an initial h
  const rough = decomposed.slice(0, 4).includes("̔");
  let letters = decomposed.replace(/\p{M}/gu, "");
  for (const [re, latin] of GREEK_DIGRAPHS) letters = letters.replace(re, latin);
  return (rough ? "h" : "") + [...letters].map((c) => GREEK_LETTERS[c] ?? c).join("");
}

// Sound-alike key for comparing Latin, English and transliterated Greek
// spellings of one name. The Vulgate writes Hebrew ח and כ as ch or h where
// English has h, k or c (Achab / Ahab, Chanaan / Canaan, Cham / Ham), so
// those all become c. English final -h is dropped (Judah / Juda), and doubled
// letters are collapsed (Amorrhaeus / Amorite).
function soundKey(name: string): string {
  return normalizeLatin(name)
    .replace(/([^cpst])h$/, "$1")
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/sh/g, "s")
    .replace(/ch|h|k/g, "c")
    .replace(/y/g, "i")
    .replace(/z/g, "s")
    .replace(/ae|oe/g, "e")
    .replace(/(.)\1+/g, "$1");
}

// Gentilic endings: Latin Chananaeus / Iebusaeorum / Amalecitarum,
// English Canaanite / Jebusites. Stripped so the stems can be compared.
const LATIN_GENTILIC = /(eorum|itarum|eus|ei|eum|eos|eis|itae|ites|itis|ita|item)$/;
const ENGLISH_GENTILIC = /(ites|ite|ians|ian)$/;

function stems(key: string): string[] {
  return [...new Set([key, key.replace(LATIN_GENTILIC, ""), key.replace(ENGLISH_GENTILIC, "")])].filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

// 1 for the same stem, down to 0 for nothing in common
function similarity(keys: string[], nameKey: string): number {
  let best = 0;
  for (const key of keys) {
    for (const a of stems(key)) {
      for (const b of stems(nameKey)) {
        best = Math.max(best, 1 - levenshtein(a, b) / Math.max(a.length, b.length));
      }
    }
  }
  return best;
}

const VERSE_THRESHOLD = 0.6;
const CHAPTER_THRESHOLD = 0.75;
const CHAPTER_MIN_LENGTH = 4;

export interface NameMatcher {
  // A name in the verse spelled the same, or else any name spelled the same
  exact(verseId: string, forms: string[]): string | undefined;
  // A name in the verse spelled similarly, or else in the chapter
  fuzzy(verseId: string, forms: string[], capitalized: boolean): string | undefined;
}

// Matches Latin names to TIPNR dStrongs. TIPNR lists every verse a name
// occurs in, so a Latin name is first compared only with the few names in its
// verse. That copes with very different spellings, eg Ionathas / Jonathan,
// Ezechias / Hezekiah, as long as the verse numbers agree.
export function buildNameMatcher(names: ProperName[]): NameMatcher {
  const keysByDStrong = new Map<string, string[]>();
  const byVerse = new Map<string, ProperName[]>();
  const byChapter = new Map<string, Set<ProperName>>();
  const byKey = new Map<string, ProperName[]>();
  const byUStrong = new Map<string, ProperName[]>();

  for (const name of names) {
    const keys = name.names
      .map((n) => transliterateGreek(n) ?? (/[A-Za-z]/.test(n) ? n : undefined))
      .filter((n): n is string => n !== undefined)
      .map(soundKey);
    keysByDStrong.set(name.dStrong, [...new Set(keys)]);
    for (const key of keys) push(byKey, key, name);
    push(byUStrong, name.uStrong, name);
    for (const ref of name.refs) {
      push(byVerse, ref, name);
      const chapter = ref.slice(0, ref.lastIndexOf("."));
      if (!byChapter.has(chapter)) byChapter.set(chapter, new Set());
      byChapter.get(chapter)!.add(name);
    }
  }

  // The best match, unless two different people tie for it
  function best(candidates: Iterable<ProperName>, keys: string[], minLength = 0) {
    let top: { score: number; name: ProperName } | undefined;
    let tied = false;
    for (const name of candidates) {
      const nameKeys = keysByDStrong.get(name.dStrong)!.filter((k) => k.length >= minLength);
      const score = Math.max(0, ...nameKeys.map((k) => similarity(keys, k)));
      if (!top || score > top.score) {
        top = { score, name };
        tied = false;
      } else if (score === top.score && name.uStrong !== top.name.uStrong) {
        tied = true;
      }
    }
    return top && !tied ? top : undefined;
  }

  // Of all the forms of the person, the one used in this book, or else in
  // this testament: Moyses in Exodus is Hebrew H4872, not Greek G3475.
  // Then the spelling that matched, since TIPNR treats Jacob and Israel as
  // one person, and Iacob should stay Jacob.
  function formForVerse(name: ProperName, keys: string[], verseId: string): string {
    const book = verseId.slice(0, verseId.indexOf("."));
    const language = bookLanguage(book) ?? "H";
    const forms = byUStrong.get(name.uStrong) ?? [name];
    const rank = (n: ProperName) => [
      n.refs.some((ref) => ref.startsWith(`${book}.`)) ? 0 : 1,
      n.dStrong.startsWith(language) ? 0 : 1,
      keysByDStrong.get(n.dStrong)!.some((k) => keys.includes(k)) ? 0 : 1,
      -n.refs.length,
    ];
    return [...forms].sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      const i = ra.findIndex((v, j) => v !== rb[j]);
      return i === -1 ? 0 : ra[i] - rb[i];
    })[0].dStrong;
  }

  return {
    exact(verseId, forms) {
      const keys = forms.map(soundKey);
      const inVerse = best(byVerse.get(verseId) ?? [], keys);
      if (inVerse?.score === 1) return inVerse.name.dStrong;

      const sameSpelling = keys.flatMap((k) => byKey.get(k) ?? []);
      if (sameSpelling.length === 0) return undefined;
      // The person named most often, eg the patriarch Jacob over the others
      const [mostNamed] = [...sameSpelling].sort((a, b) => b.refs.length - a.refs.length);
      const dStrong = formForVerse(mostNamed, keys, verseId);
      // A person only named in the other testament is someone else, eg Semei
      // in Ezra is Shimei, not Luke's Semein (G4584)
      const language = bookLanguage(verseId.slice(0, verseId.indexOf(".")));
      return !language || dStrong.startsWith(language) ? dStrong : undefined;
    },

    fuzzy(verseId, forms, capitalized) {
      const keys = forms.map(soundKey);
      const inVerse = best(byVerse.get(verseId) ?? [], keys);
      if (inVerse && inVerse.score >= VERSE_THRESHOLD) return inVerse.name.dStrong;

      // Verse numbers sometimes differ from the English, eg Vulgate Gen 25:25
      // is English 25:26, so look across the chapter, but only for longer,
      // capitalized words and closer spellings
      if (!capitalized) return undefined;
      if (keys.some((k) => k.length < CHAPTER_MIN_LENGTH)) return undefined;
      const chapter = verseId.slice(0, verseId.lastIndexOf("."));
      const inChapter = best(byChapter.get(chapter) ?? [], keys, CHAPTER_MIN_LENGTH);
      if (inChapter && inChapter.score >= CHAPTER_THRESHOLD) return inChapter.name.dStrong;
      return undefined;
    },
  };
}

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  if (!map.has(key)) map.set(key, []);
  map.get(key)!.push(value);
}
